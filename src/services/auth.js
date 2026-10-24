import {
  createUserWithEmailAndPassword,
  deleteUser,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { syncAuthUser } from '../composables/useAuth'
import {
  auth,
  authPersistenceReady,
  db,
  firebaseConfigured,
} from '../firebase/init'

const errorMessages = {
  'auth/email-already-in-use': '这个邮箱已经注册，请直接登录。',
  'auth/invalid-credential': '邮箱或密码不正确，请重新输入。',
  'auth/invalid-email': '请输入有效的邮箱地址。',
  'auth/network-request-failed': '网络连接失败，请检查网络后重试。',
  'auth/operation-not-allowed': '邮箱密码登录尚未启用，请联系管理员。',
  'auth/too-many-requests': '尝试次数过多，请稍后再试。',
  'auth/user-disabled': '这个账户已被停用，请联系管理员。',
  'auth/user-not-found': '邮箱或密码不正确，请重新输入。',
  'auth/weak-password': '密码强度不足，请设置至少 8 个字符的密码。',
  'auth/wrong-password': '邮箱或密码不正确，请重新输入。',
  'permission-denied': '没有权限创建用户资料，请检查 Firestore 规则。',
}

function configurationError() {
  return {
    success: false,
    error: 'Firebase 尚未配置，请先填写环境变量。',
  }
}

function normalizeFirebaseError(error) {
  return errorMessages[error?.code] ?? '操作失败，请稍后重试。'
}

export async function registerUser(displayName, email, password) {
  if (!firebaseConfigured || !auth || !db) return configurationError()

  let createdUser = null

  try {
    await authPersistenceReady
    const credential = await createUserWithEmailAndPassword(
      auth,
      email.trim(),
      password,
    )
    createdUser = credential.user
    const normalizedDisplayName = displayName.trim()

    await updateProfile(credential.user, {
      displayName: normalizedDisplayName,
    })

    await setDoc(doc(db, 'users', credential.user.uid), {
      displayName: normalizedDisplayName,
      email: credential.user.email,
      photoURL: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    syncAuthUser(credential.user)
    return { success: true, user: credential.user }
  } catch (error) {
    if (createdUser) {
      try {
        await deleteUser(createdUser)
      } catch {
        // If rollback is unavailable, keep the original user-facing error.
      }
    }
    return { success: false, error: normalizeFirebaseError(error) }
  }
}

export async function loginUser(email, password) {
  if (!firebaseConfigured || !auth) return configurationError()

  try {
    await authPersistenceReady
    const credential = await signInWithEmailAndPassword(
      auth,
      email.trim(),
      password,
    )
    syncAuthUser(credential.user)
    return { success: true, user: credential.user }
  } catch (error) {
    return { success: false, error: normalizeFirebaseError(error) }
  }
}

export async function logoutUser() {
  if (!firebaseConfigured || !auth) return configurationError()

  try {
    await authPersistenceReady
    await signOut(auth)
    syncAuthUser(null)
    return { success: true }
  } catch (error) {
    return { success: false, error: normalizeFirebaseError(error) }
  }
}
