import Cookies from 'js-cookie'

const backend_domain = import.meta.env.VITE_APP_URL_PREFIX || 'http://localhost:8082'
var config_dataset = {
  backend_prefix: `${backend_domain}/admin/`,
  static_prefix: '/static/custom_admin',
  version: '-',
  api_timeout_ms: 1000 * 5,
  logo_image: '/logo-outline.png',
}

if (import.meta.env.PROD) {
  config_dataset = JSON.parse(document.getElementById("settings").dataset.json)

  if (!config_dataset.static_prefix) {
    config_dataset.static_prefix = '/'
  }

  if (!config_dataset.backend_prefix) {
    config_dataset.backend_prefix = '/'
  }
}

console.assert(config_dataset.backend_prefix, "backend_prefix is required");

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
  theme: 'light',
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
