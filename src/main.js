import { registerPlugins } from '@/plugins'
import { createHandleError } from "@/utils/handleError"
import App from './App.vue'
import { createApp } from 'vue'
import Vue3Toastify from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'
import { JsonForms } from "@jsonforms/vue"

import '/src/styles/index.scss'
import '@vuepic/vue-datepicker/dist/main.css';

import '@jsonforms/vue-vanilla/vanilla.css';

const app = createApp(App)
app.component('JsonForms', JsonForms)

import Category from '/src/views/Category.vue'
app.component('Category', Category)

import Detail from '/src/views/Detail.vue'
app.component('Detail', Detail)

registerPlugins(app)
app.use(Vue3Toastify, {
  clearOnUrlChange: false,
})

const t = app.config.globalProperties.$t?.bind(app.config.globalProperties)
app.config.globalProperties.$handleError = createHandleError(t ?? ((x) => String(x)))

import mitt from 'mitt';
const emitter = mitt();
app.config.globalProperties.emitter = emitter;

app.mount('#app')
