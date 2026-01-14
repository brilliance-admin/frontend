import Cookies from 'js-cookie'

const TokenKey = 'vadmin_token'
const TokenRefreshKey = 'vadmin_refresh_token'

export function getToken() {
  return Cookies.get(TokenKey)
}

export function setToken(token, refresh_token) {
  Cookies.set(TokenKey, token)
  Cookies.set(TokenRefreshKey, refresh_token)
}

export function removeToken() {
  Cookies.remove(TokenKey)
  Cookies.remove(TokenRefreshKey)
}
