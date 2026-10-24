import { computed, readonly, ref, triggerRef } from 'vue'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, authPersistenceReady } from '../firebase/init'

const currentUser = ref(null)
const authLoading = ref(true)
const authReady = ref(false)
const isAuthenticated = computed(() => Boolean(currentUser.value))

let listenerStarted = false
let resolveInitialAuth
const initialAuthPromise = new Promise((resolve) => {
  resolveInitialAuth = resolve
})

function finishInitialAuth() {
  authLoading.value = false
  authReady.value = true
  resolveInitialAuth()
}

export async function startAuthListener() {
  if (listenerStarted) return
  listenerStarted = true

  if (!auth) {
    finishInitialAuth()
    return
  }

  await authPersistenceReady

  onAuthStateChanged(
    auth,
    (user) => {
      currentUser.value = user
      if (!authReady.value) finishInitialAuth()
    },
    () => {
      currentUser.value = null
      if (!authReady.value) finishInitialAuth()
    },
  )
}

export function waitForAuthReady() {
  return authReady.value ? Promise.resolve() : initialAuthPromise
}

export function syncAuthUser(user) {
  currentUser.value = user
  // Firebase profile updates mutate the existing User object in place. Trigger
  // subscribers even when the object identity is unchanged.
  triggerRef(currentUser)
}

export function useAuth() {
  return {
    currentUser: readonly(currentUser),
    isAuthenticated,
    authLoading: readonly(authLoading),
    authReady: readonly(authReady),
  }
}
