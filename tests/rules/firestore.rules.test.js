import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore'

const projectId = 'demo-message-board-tests'
const rules = readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8')
const emulatorAddress = (process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080').split(':')
let testEnv

function dbFor(uid, email = `${uid}@example.com`) {
  return testEnv.authenticatedContext(uid, { email }).firestore()
}

function commentData({
  uid = 'alice',
  userName = 'Alice',
  content = '有效留言',
  parentId = null,
  rootId,
  isDeleted = false,
} = {}) {
  return {
    userId: uid,
    userName,
    userPhotoURL: null,
    content,
    parentId,
    rootId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    isDeleted,
    deletedAt: isDeleted ? serverTimestamp() : null,
  }
}

function storedComment({
  uid = 'alice',
  userName = 'Alice',
  content = '有效留言',
  parentId = null,
  rootId,
  isDeleted = false,
} = {}) {
  const timestamp = Timestamp.fromMillis(1_000)
  return {
    userId: uid,
    userName,
    userPhotoURL: null,
    content: isDeleted ? '' : content,
    parentId,
    rootId,
    createdAt: timestamp,
    updatedAt: timestamp,
    isDeleted,
    deletedAt: isDeleted ? timestamp : null,
  }
}

async function seed(path, data) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), path), data)
  })
}

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: {
      host: emulatorAddress[0],
      port: Number(emulatorAddress[1]),
      rules,
    },
  })
})

beforeEach(async () => testEnv.clearFirestore())
afterAll(async () => testEnv.cleanup())

describe('users collection', () => {
  it('允许用户创建自己的完整资料', async () => {
    const db = dbFor('alice')
    await assertSucceeds(setDoc(doc(db, 'users/alice'), {
      displayName: 'Alice',
      email: 'alice@example.com',
      photoURL: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }))
  })

  it('拒绝创建他人的资料或缺少字段的资料', async () => {
    const db = dbFor('alice')
    await assertFails(setDoc(doc(db, 'users/bob'), {
      displayName: 'Bob',
      email: 'alice@example.com',
      photoURL: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }))
    await assertFails(setDoc(doc(db, 'users/alice'), {
      displayName: 'Alice',
      email: 'alice@example.com',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }))
  })

  it('只允许本人读取资料', async () => {
    await seed('users/alice', {
      displayName: 'Alice',
      email: 'alice@example.com',
      photoURL: null,
      createdAt: Timestamp.fromMillis(1_000),
      updatedAt: Timestamp.fromMillis(1_000),
    })
    await assertSucceeds(getDoc(doc(dbFor('alice'), 'users/alice')))
    await assertFails(getDoc(doc(dbFor('bob'), 'users/alice')))
  })
})

describe('comment creation', () => {
  it('拒绝未登录用户创建留言', async () => {
    const db = testEnv.unauthenticatedContext().firestore()
    await assertFails(setDoc(doc(db, 'comments/root'), commentData({ rootId: 'root' })))
  })

  it('允许合法根留言', async () => {
    const db = dbFor('alice')
    await assertSucceeds(setDoc(doc(db, 'comments/root'), commentData({ rootId: 'root' })))
  })

  it('拒绝伪造作者、空白边界、超长内容及无效 rootId', async () => {
    const db = dbFor('alice')
    await assertFails(setDoc(doc(db, 'comments/spoof'), commentData({ uid: 'bob', rootId: 'spoof' })))
    await assertFails(setDoc(doc(db, 'comments/empty'), commentData({ content: '', rootId: 'empty' })))
    await assertFails(setDoc(doc(db, 'comments/long'), commentData({ content: '长'.repeat(2001), rootId: 'long' })))
    await assertFails(setDoc(doc(db, 'comments/wrong'), commentData({ rootId: 'another-id' })))
  })

  it('拒绝未声明字段', async () => {
    const db = dbFor('alice')
    await assertFails(setDoc(doc(db, 'comments/root'), {
      ...commentData({ rootId: 'root' }),
      admin: true,
    }))
  })

  it('允许直接回复及多层嵌套回复', async () => {
    await seed('comments/root', storedComment({ rootId: 'root' }))
    const db = dbFor('bob')
    await assertSucceeds(setDoc(
      doc(db, 'comments/reply-1'),
      commentData({ uid: 'bob', userName: 'Bob', parentId: 'root', rootId: 'root' }),
    ))
    await assertSucceeds(setDoc(
      doc(db, 'comments/reply-2'),
      commentData({ uid: 'bob', userName: 'Bob', parentId: 'reply-1', rootId: 'root' }),
    ))
  })

  it('拒绝不存在的父留言、伪造 rootId 及回复已删除留言', async () => {
    await seed('comments/root', storedComment({ rootId: 'root' }))
    await seed('comments/deleted', storedComment({ rootId: 'deleted', isDeleted: true }))
    const db = dbFor('bob')
    await assertFails(setDoc(
      doc(db, 'comments/no-parent'),
      commentData({ uid: 'bob', parentId: 'missing', rootId: 'missing' }),
    ))
    await assertFails(setDoc(
      doc(db, 'comments/fake-root'),
      commentData({ uid: 'bob', parentId: 'root', rootId: 'fake' }),
    ))
    await assertFails(setDoc(
      doc(db, 'comments/reply-deleted'),
      commentData({ uid: 'bob', parentId: 'deleted', rootId: 'deleted' }),
    ))
  })
})

describe('comment deletion invariants', () => {
  beforeEach(async () => {
    await seed('comments/root', storedComment({ rootId: 'root' }))
  })

  it('允许作者软删除自己的留言', async () => {
    await assertSucceeds(updateDoc(doc(dbFor('alice'), 'comments/root'), {
      content: '',
      isDeleted: true,
      deletedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }))
  })

  it('拒绝他人软删除、物理删除和恢复留言', async () => {
    await assertFails(updateDoc(doc(dbFor('bob'), 'comments/root'), {
      content: '',
      isDeleted: true,
      deletedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }))
    await assertFails(deleteDoc(doc(dbFor('alice'), 'comments/root')))

    await seed('comments/deleted', storedComment({ rootId: 'deleted', isDeleted: true }))
    await assertFails(updateDoc(doc(dbFor('alice'), 'comments/deleted'), {
      content: '恢复内容',
      isDeleted: false,
      deletedAt: null,
      updatedAt: serverTimestamp(),
    }))
  })

  it('拒绝借软删除修改树结构或作者字段', async () => {
    await assertFails(updateDoc(doc(dbFor('alice'), 'comments/root'), {
      content: '',
      isDeleted: true,
      deletedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      rootId: 'tampered',
    }))
  })
})
