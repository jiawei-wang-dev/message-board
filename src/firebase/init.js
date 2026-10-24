import { getApp, getApps, initializeApp } from 'firebase/app'
import {
  browserLocalPersistence,
  connectAuthEmulator,
  getAuth,
  setPersistence,
} from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const firebaseConfigured = Object.values(firebaseConfig).every(Boolean)

export const firebaseApp = firebaseConfigured
  ? getApps().length
    ? getApp()
    : initializeApp(firebaseConfig)
  : null

export const auth = firebaseApp ? getAuth(firebaseApp) : null
export const db = firebaseApp ? getFirestore(firebaseApp) : null

function normalizeAuthEmulatorUrl(host) {
  return host.startsWith('http://') || host.startsWith('https://')
    ? host
    : `http://${host}`
}

function parseFirestoreEmulatorHost(host) {
  const url = new URL(normalizeAuthEmulatorUrl(host))
  return {
    hostname: url.hostname,
    port: Number(url.port || 8080),
  }
}

// Production builds never connect to local emulators, even if the variable is misconfigured.
const useEmulators = import.meta.env.DEV
  && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true'

if (useEmulators && auth && db && typeof window !== 'undefined') {
  const emulatorState = window.__messageBoardFirebaseEmulators ?? {
    auth: false,
    firestore: false,
  }

  if (!emulatorState.auth) {
    const authHost = import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099'
    connectAuthEmulator(auth, normalizeAuthEmulatorUrl(authHost), {
      disableWarnings: true,
    })
    emulatorState.auth = true
  }

  if (!emulatorState.firestore) {
    const firestoreHost = import.meta.env.VITE_FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080'
    const { hostname, port } = parseFirestoreEmulatorHost(firestoreHost)
    connectFirestoreEmulator(db, hostname, port)
    emulatorState.firestore = true
  }

  window.__messageBoardFirebaseEmulators = emulatorState
}

export const authPersistenceReady = auth
  ? setPersistence(auth, browserLocalPersistence).catch(() => undefined)
  : Promise.resolve()
