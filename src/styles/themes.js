import { getLocalSettings } from '/src/utils/settings'
import { config_dataset } from '/src/utils/settings'

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
// https://www.w3schools.com/colors/colors_picker.asp

const darkSurface = 'rgb(26, 29, 30)'

const blueLight = {
  dark: false,
  colors: {
    'surface-light': '#f8fafc',
    light2: '#eff2f6',
    light3: '#dee5ed',
    secondary: '#bdcbdb', // light-4

    darken1: '#9db0c8',
    primary: '#5c7ca3', // darken-2
    darken3: '#304156',
    darken4: '#1f2d3d',

    accent: '#82B1FF',
    error: '#AA4A44',

    info: '#2196F3',
    success: '#4CAF50',
    warning: '#FFC107',
  }
}
const blueDark = {
  dark: true,
  colors: {
    surface: darkSurface,
    'surface-light': 'rgb(36, 39, 40)',

    light2: '#1f2223',
    light3: '#dee5ed',
    secondary: '#283749', // light-4

    darken1: '#9db0c8',
    primary: '#5c7ca3', // darken-2
    darken3: '#304156',
    darken4: '#1f2d3d',

    accent: '#82B1FF',
    error: '#AA4A44',

    info: '#2196F3',
    success: '#4CAF50',
    warning: '#FFC107',
  }
}

const defaultThemes = {
  blueLight,
  blueDark,
}

export function applyThemeStylesheet(name) {
  document.documentElement.dataset.adminTheme = name
  const stylesheetId = 'admin-theme-stylesheet'
  const current = document.getElementById(stylesheetId)
  const file = getThemes()[name]?.css_url
  if (!file) {
    current?.remove()
    return
  }

  const backendUrl = new URL(config_dataset.base_url || window.location.origin, window.location.origin)
  const stylesheetUrl = new URL(file, backendUrl)
  if (
    !['http:', 'https:'].includes(stylesheetUrl.protocol) ||
    stylesheetUrl.origin !== backendUrl.origin ||
    stylesheetUrl.username || stylesheetUrl.password
  ) {
    throw new Error(`Theme stylesheet must use the backend origin: ${stylesheetUrl.origin}`)
  }
  const href = stylesheetUrl.href
  if (current?.getAttribute('href') === href) return

  const stylesheet = current || document.createElement('link')
  stylesheet.id = stylesheetId
  stylesheet.rel = 'stylesheet'
  stylesheet.href = href
  if (!current) document.head.appendChild(stylesheet)
}

export function getThemes() {
  const custom = {}
  for (const t of (config_dataset.custom_themes || [])) {
    custom[t.name] = { dark: t.dark, colors: t.colors, css_url: t.css_url }
  }
  const themes = config_dataset.exclude_default_themes ? custom : { ...defaultThemes, ...custom }
  if (Object.keys(themes).length === 0) {
    throw new Error('No themes available: custom_themes must not be empty when exclude_default_themes is true')
  }
  return themes
}

export function getThemeList() {
  return Object.keys(getThemes())
}

export function getTheme() {
  const names = getThemeList()
  const savedTheme = getLocalSettings().theme
  if (names.includes(savedTheme)) return savedTheme
  if (names.includes(config_dataset.default_theme)) return config_dataset.default_theme
  return names[0]
}
