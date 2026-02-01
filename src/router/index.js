import { createRouter, createWebHistory } from 'vue-router'
import { config_dataset } from '/src/utils/settings'

import Layout from '/src/layout/Layout.vue'
import Detail from '/src/views/Detail.vue'
import Navigation from '/src/views/Navigation.vue'
import Category from '/src/views/Category.vue'
import Login from '/src/views/Login.vue'
import Page404 from '/src/views/404.vue'

const routes = [
  {
    path: '',
    redirect: '/navigation',
  },
  {
    path: '/login',
    component: Login,
  },
  {
    path: '/404',
    component: Page404,
  },
  {
    path: '',
    component: Layout,
    children: [
      {
        path: 'navigation',
        props: true,
        component: Navigation,
      },
      {
        path: ':group/:category/',
        props: true,
        name: 'category',
        component: Category,
      },
      {
        path: ':group/:category/:pk/',
        props: true,
        name: 'detail',
        component: Detail,
      },
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/404', hidden: true }
]

export default createRouter({
  history: createWebHistory(config_dataset.base_admin_url || 'admin/'),
  routes,
})
