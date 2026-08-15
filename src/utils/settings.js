import Cookies from 'js-cookie'
import urlJoin from 'url-join'

const backend_domain = import.meta.env.VITE_APP_URL_PREFIX || 'http://localhost:8082'
var config_dataset = {
  base_url: backend_domain,
  backend_prefix: `/admin/`,
  static_prefix: '/static/custom_admin',
  version: '-',
  api_timeout_ms: 1000 * 5,
  backend_debug: undefined,
  logo_image: '/logo-outline.png',
  custom_themes: [],
}

if (import.meta.env.PROD) {
  config_dataset = JSON.parse(document.getElementById("settings").dataset.json)
}

export function getBackendApi() {
  const base_url = config_dataset.base_url || window.location.origin
  const backendPrefix = Object.prototype.hasOwnProperty.call(config_dataset, 'backend_prefix')
    ? config_dataset.backend_prefix
    : '/admin/'
  console.assert(backendPrefix, "backend_prefix is required");
  if (backendPrefix.startsWith('http://') || backendPrefix.startsWith('https://')) return backendPrefix
  return urlJoin(base_url, backendPrefix)
}

export var config_dataset
console.log('config_dataset', config_dataset, 'prod', import.meta.env.PROD)

const SETTINGS_COOKIE_NAME = 'SETTINGS'
const VIEWSETS_SETTINGS = 'VIEWSETS_SETTINGS'

export const wysiwygTypes = {
  'dark-blue': 'Dark Blue',
  'dark-slim': 'Dark Slim',
  'lightgray': 'Light Gray',
}

const defaultSettings = {
  page_size: 25,
  theme: null,
  wysiwygSkin: 'dark-blue',
}

export function getLocalSettings() {
  const settings = Cookies.get(SETTINGS_COOKIE_NAME, { sameSite:'strict' })
  if (settings == null) {
    return defaultSettings
  }
  return JSON.parse(settings)
}

export function setLocalSettings(settings) {
  Cookies.set(SETTINGS_COOKIE_NAME, JSON.stringify(settings), { sameSite:'strict' })
}

export function getViewsetsSettings(viewname, serializer) {
  let settings = localStorage.getItem(`${VIEWSETS_SETTINGS}_${viewname}`, { sameSite:'strict' })
  settings = settings ? JSON.parse(settings) : {headers: {}}

  if (serializer) {
    for (const [field_slug, field] of Object.entries(serializer)) {
      if (settings.headers[field_slug] === undefined) {
        settings.headers[field_slug] = true
      }
    }
  }
  return settings
}

export function setViesetsSettings(viewname, settings) {
  localStorage.setItem(`${VIEWSETS_SETTINGS}_${viewname}`, JSON.stringify(settings), { sameSite:'strict' })
}

export const tinyMCEThemes = [
  'lightgray',
  'dark-blue',
  'dark-slim',
]

export function getTinyMCETheme() {
  let settings = getLocalSettings()
  if (tinyMCEThemes.indexOf(settings.tinyMCETheme) !== -1) return settings.tinyMCETheme
  return tinyMCEThemes[0]
}
