import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  updateDoc,
  where,
} from 'firebase/firestore'
import { auth, db, firebaseConfigured } from '../firebase/init'
import {
  MAX_COMMENT_LENGTH,
  validateCommentContent,
} from '../utils/comments'

export const ROOT_COMMENTS_PAGE_SIZE = 10
export const REPLIES_PAGE_SIZE = 5
export { MAX_COMMENT_LENGTH }

const pendingCreates = new Map()

const errorMessages = {
  'permission-denied': '没有权限执行此操作，请重新登录后再试。',
  unauthenticated: '请先登录后再操作。',
  unavailable: '暂时无法连接到留言服务，请检查网络后重试。',
  'failed-precondition': '留言查询所需的 Firestore 索引尚未就绪。',
}

function serviceError(message, code = 'comments/unknown') {
  const error = new Error(message)
  error.code = code
  return error
}

export function getCommentErrorMessage(error, fallback = '操作失败，请稍后重试。') {
  if (error?.code === 'comments/not-configured') {
    return 'Firebase 尚未配置，请先完成本地环境变量设置。'
  }

  if (error?.code === 'comments/invalid-content') return error.message
  if (error?.code === 'comments/deleted-parent') return '该留言已被删除，不能继续回复。'
  if (error?.code === 'comments/invalid-parent') return '回复目标无效，请刷新后重试。'

  const firebaseCode = error?.code?.replace('firestore/', '')
  return errorMessages[firebaseCode] || fallback
}

function requireFirestore() {
  if (!firebaseConfigured || !db) {
    throw serviceError('Firebase 尚未配置。', 'comments/not-configured')
  }
}

function requireAuthenticatedUser(user) {
  requireFirestore()
  if (!user?.uid || auth?.currentUser?.uid !== user.uid) {
    throw serviceError('请先登录后再操作。', 'firestore/unauthenticated')
  }
}

function normalizeContent(content) {
  const result = validateCommentContent(content)
  if (!result.valid) throw serviceError(result.error, 'comments/invalid-content')
  return result.value
}

function mapComment(documentSnapshot) {
  return {
    id: documentSnapshot.id,
    ...documentSnapshot.data(),
  }
}

export async function createRootComment({ user, content }) {
  requireAuthenticatedUser(user)
  const normalizedContent = normalizeContent(content)
  const duplicateKey = `${user.uid}:${normalizedContent}`

  if (pendingCreates.has(duplicateKey)) return pendingCreates.get(duplicateKey)

  const creation = (async () => {
    const commentRef = doc(collection(db, 'comments'))
    const timestamp = serverTimestamp()

    await setDoc(commentRef, {
      userId: user.uid,
      userName: user.displayName?.trim() || user.email?.split('@')[0] || '社区成员',
      userPhotoURL: user.photoURL || null,
      content: normalizedContent,
      parentId: null,
      rootId: commentRef.id,
      createdAt: timestamp,
      updatedAt: timestamp,
      isDeleted: false,
      deletedAt: null,
    })

    return commentRef.id
  })()

  pendingCreates.set(duplicateKey, creation)

  try {
    return await creation
  } finally {
    pendingCreates.delete(duplicateKey)
  }
}

export async function createReply({ user, parent, content }) {
  requireAuthenticatedUser(user)
  const normalizedContent = normalizeContent(content)

  if (!parent?.id || typeof parent.id !== 'string') {
    throw serviceError('回复目标无效。', 'comments/invalid-parent')
  }
  if (parent.isDeleted) {
    throw serviceError('该留言已被删除，不能继续回复。', 'comments/deleted-parent')
  }

  const rootId = parent.parentId === null ? parent.id : parent.rootId
  if (!rootId || typeof rootId !== 'string') {
    throw serviceError('回复目标无效。', 'comments/invalid-parent')
  }

  const duplicateKey = `reply:${user.uid}:${parent.id}:${normalizedContent}`
  if (pendingCreates.has(duplicateKey)) return pendingCreates.get(duplicateKey)

  const creation = (async () => {
    const commentRef = doc(collection(db, 'comments'))
    const timestamp = serverTimestamp()
    const authorName = user.displayName?.trim() || user.email?.split('@')[0] || '社区成员'

    await setDoc(commentRef, {
      userId: user.uid,
      userName: authorName,
      userPhotoURL: user.photoURL || null,
      content: normalizedContent,
      parentId: parent.id,
      rootId,
      createdAt: timestamp,
      updatedAt: timestamp,
      isDeleted: false,
      deletedAt: null,
    })

    const localTimestamp = new Date()
    return {
      id: commentRef.id,
      userId: user.uid,
      userName: authorName,
      userPhotoURL: user.photoURL || null,
      content: normalizedContent,
      parentId: parent.id,
      rootId,
      createdAt: localTimestamp,
      updatedAt: localTimestamp,
      isDeleted: false,
      deletedAt: null,
    }
  })()

  pendingCreates.set(duplicateKey, creation)

  try {
    return await creation
  } finally {
    pendingCreates.delete(duplicateKey)
  }
}

export async function getRootComments({
  sortOrder = 'newest',
  cursor = null,
  pageSize = ROOT_COMMENTS_PAGE_SIZE,
} = {}) {
  requireFirestore()

  const direction = sortOrder === 'oldest' ? 'asc' : 'desc'
  const constraints = [where('parentId', '==', null), orderBy('createdAt', direction)]

  if (cursor) constraints.push(startAfter(cursor))
  constraints.push(limit(pageSize))

  const snapshot = await getDocs(query(collection(db, 'comments'), ...constraints))

  return {
    comments: snapshot.docs.map(mapComment),
    cursor: snapshot.docs.at(-1) || null,
    hasMore: snapshot.size === pageSize,
  }
}

export async function getReplies(parentId, {
  cursor = null,
  pageSize = REPLIES_PAGE_SIZE,
} = {}) {
  requireFirestore()

  if (!parentId || typeof parentId !== 'string') {
    throw serviceError('回复目标无效。', 'comments/invalid-parent')
  }

  const constraints = [
    where('parentId', '==', parentId),
    orderBy('createdAt', 'asc'),
  ]

  if (cursor) constraints.push(startAfter(cursor))
  constraints.push(limit(pageSize))

  const snapshot = await getDocs(query(collection(db, 'comments'), ...constraints))

  return {
    replies: snapshot.docs.map(mapComment),
    cursor: snapshot.docs.at(-1) || null,
    hasMore: snapshot.size === pageSize,
  }
}

export async function softDeleteComment({ commentId, userId }) {
  requireFirestore()

  if (!commentId || !userId || auth?.currentUser?.uid !== userId) {
    throw serviceError('没有权限删除这条留言。', 'firestore/permission-denied')
  }

  await updateDoc(doc(db, 'comments', commentId), {
    content: '',
    isDeleted: true,
    deletedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}
