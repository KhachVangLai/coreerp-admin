const accessTokenKey = 'coreerp.accessToken'

export function getStoredAccessToken() {
  return window.localStorage.getItem(accessTokenKey)
}

export function setStoredAccessToken(accessToken: string) {
  window.localStorage.setItem(accessTokenKey, accessToken)
}

export function clearStoredAccessToken() {
  window.localStorage.removeItem(accessTokenKey)
}
