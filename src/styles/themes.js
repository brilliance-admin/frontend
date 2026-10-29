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

const greenLight = {
  dark: false,
  colors: {
    'surface-light': '#f7fbf8',
    light2: '#E8F0EC',
    light3: '#A3CFB4',
    secondary: '#6BA583',
    darken1: '#3D8B5E',
    primary: '#2D7A4F',
    darken3: '#1B4D32',
    darken4: '#112E1F',
    accent: '#81C99C',
    error: '#EF4444',
    info: '#3B82F6',
    success: '#4CAF50',
    warning: '#F59E0B',
  }
}
const greenDark = {
  dark: true,
  colors: {
    surface: '#141A16',
    'surface-light': '#202622',
    'on-surface': '#E2E8F0',
    light2: 'rgb(32, 41, 37)',
    light3: '#4ADE80',
    secondary: '#2A3F32',
    darken1: '#34D399',
    primary: '#10B981',
    'on-primary': '#FFFFFF',
    darken3: '#1C2820',
    darken4: '#0F1410',
    accent: '#6EE7B7',
    error: '#EF4444',
    info: '#3B82F6',
    success: '#22C55E',
    warning: '#F59E0B',
  }
}

const deepPurpleLight = {
  dark: false,
  colors: {
    'surface-light': '#faf8fd',
    light2: '#F3F0FA',
    light3: '#C4B5FD',
    secondary: '#7E6BB0',
    darken1: '#6E59A5',
    primary: '#5B4A8A',
    darken3: '#3D2E6B',
    darken4: '#2E2055',
    accent: '#9B8EC4',
    error: '#EF4444',
    info: '#3B82F6',
    success: '#22C55E',
    warning: '#F59E0B',
  }
}
const deepPurpleDark = {
  dark: true,
  colors: {
    surface: '#141420',
    'surface-light': 'rgb(26, 26, 39)',
    'on-surface': '#E2E8F0',
    light2: 'rgb(34, 34, 56)',
    light3: '#A78BFA',
    secondary: '#3D3A5C',
    darken1: '#8B5CF6',
    primary: '#7C3AED',
    'on-primary': '#FFFFFF',
    darken3: '#1E1E32',
    darken4: '#0E0E1C',
    accent: '#A78BFA',
    error: '#EF4444',
    info: '#3B82F6',
    success: '#22C55E',
    warning: '#F59E0B',
  }
}

const defaultThemes = {
  blueLight,
  blueDark,
  greenLight,
  greenDark,
  deepPurpleLight,
  deepPurpleDark,
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
