<template>
  <v-layout class="h-screen">

    <template v-if="settings && adminSchema">

      <Navbar ref="navbar" :admin-schema="adminSchema" :settings="settings"/>

      <Header
        :admin-schema="adminSchema"
        :settings="settings"
        :langs="langs"
        @toggle-drawer="$refs.navbar.toggleDrawer()"
        @toggle-settings="$refs.settings.toggle()"
      />

      <v-main class="page-container">
        <Settings ref="settings"/>

        <router-view v-slot="{ Component }">
          <Transition name="fade" mode="out-in">
            <component
              :is="Component"
              :key="$route.path"
              :admin-schema="adminSchema"
              :settings="settings"
              class="route-view"
            />
          </Transition>
        </router-view>

      </v-main>

    </template>

    <template v-else-if="loading">
      <Loader/>
    </template>

  </v-layout>
</template>

<script>
import { config_dataset } from '/src/utils/settings'

import Navbar from '/src/layout/Navbar.vue'
import Header from '/src/layout/Header.vue'
import Settings from '/src/components/Settings.vue'
import Loader from '/src/components/Loader.vue'

import { getAdminSchema } from '/src/api/schema'
import { getToken } from '/src/utils/auth'
import { getLocalSettings } from '/src/utils/settings'
import { removeToken } from '/src/utils/auth'
import { getSettings } from '/src/api/settings'

export default {
  components: {
    Navbar,
    Header,
    Settings,
  },
  data() {
    return {
      adminSchema: null,
      settings: null,
      loading: true,
      langs: null,
    }
  },
  async created() {
    if (!getToken()) {
      this.$router.push({ path: '/login' })
      return
    }

    getSettings().then(settings => {
      this.settings = settings
    }).catch(error => {
      console.error('Get admin settings error:', error)

      const errorResult = this.$handleError(error)
      if (errorResult.persistentMessage) {
        this.persistentMessageDialog = true
        this.persistentMessage = errorResult.persistentMessage
      }
      return
    })

    getAdminSchema().then(adminSchema => {
      this.adminSchema = adminSchema
      this.loading = false
    }).catch(error => {
      this.loading = false
      console.error('Get admin schema error:', error)

      if (error.response && (error.response.status == 401 || error.response.status == 403)) {
        removeToken()
        this.$router.push({ path: '/login' })
        return
      }

      const errorResult = this.$handleError(error)
      if (errorResult.fieldErrors) {
        this.$refs.fieldscontainer.updateErrors(errorResult.fieldErrors)
      }
      if (errorResult.persistentMessage) {
        this.persistentMessageDialog = true
        this.persistentMessage = errorResult.persistentMessage
      }
    })
  },
  methods: {
  }
}
</script>
