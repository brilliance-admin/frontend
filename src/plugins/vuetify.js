import { useI18n } from 'vue-i18n'
import { createVueI18nAdapter } from 'vuetify/locale/adapters/vue-i18n'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import i18n from './i18n'
import { createVuetify } from 'vuetify'
import { getThemes, getTheme } from '/src/styles/themes'

export default createVuetify({
  theme: {
    defaultTheme: getTheme(),
    themes: getThemes(),
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
