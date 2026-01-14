import Cookies from 'js-cookie'

const LANGUAGE_COOKIE_NAME = import.meta.env.VUE_APP_LANGUAGE_COOKIE_NAME || 'LANGUAGE'

export function getLang() {
  let lang = Cookies.get(LANGUAGE_COOKIE_NAME, { sameSite:'strict' })
  return lang
}

export function setLang(langSlug) {
  Cookies.set(LANGUAGE_COOKIE_NAME, langSlug, { sameSite:'strict' })
}
