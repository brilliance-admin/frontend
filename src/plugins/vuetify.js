import { useI18n } from 'vue-i18n'
import { createVueI18nAdapter } from 'vuetify/locale/adapters/vue-i18n'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import i18n from './i18n'
import { getLocalSettings } from '/src/utils/settings'
import { createVuetify } from 'vuetify'

export const themes = [
  'blueLight', 'blueDark', 'greenLight', 'greenDark', 'deepPurpleLight', 'deepPurpleDark'
]

function getTheme() {
  const theme = getLocalSettings().theme
  if (themes.indexOf(theme) !== -1) return theme
  return themes[0]
}

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
// https://www.w3schools.com/colors/colors_picker.asp

const darkSurface = 'rgb(26, 29, 30)'

const blueLight = {
  dark: false,
  colors: {
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
    'on-surface': '#E2E8F0',
    light2: '#2A3630',
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
    'on-surface': '#E2E8F0',
    light2: '#2D2D4A',
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

export default createVuetify({
  theme: {
    defaultTheme: getTheme(),
    themes: {
      blueLight,
      blueDark,
      greenLight,
      greenDark,
      deepPurpleLight,
      deepPurpleDark,
    },
  },
  locale: {
    adapter: createVueI18nAdapter({ i18n, useI18n }),
  },
  defaults: {
    global: {
      ripple: false,
      density: 'compact',
      hideDetails: 'auto',
    },
    VList: {
      density: 'default',
    },
    VTabs: {
      density: 'default',
    },
    VDataTable: {
      density: 'default',
    },
    VBtn: {
      density: 'default',
    },
  },
})
