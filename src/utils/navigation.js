export function getSafeRedirectPath(redirect, fallback = '/board') {
  if (typeof redirect !== 'string' || !redirect.startsWith('/')) return fallback

  let decoded
  try {
    decoded = decodeURIComponent(redirect)
  } catch {
    return fallback
  }

  const normalized = decoded.replaceAll('\\', '/')
  if (normalized.startsWith('//') || /[\u0000-\u001F]/.test(normalized)) return fallback

  return redirect
}
