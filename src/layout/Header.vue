<template>
  <v-app-bar>
    <v-app-bar-nav-icon variant="text" @click="$emit('toggleDrawer')"/>

    <v-breadcrumbs :items="path">
      <template v-slot:divider>
        <v-icon icon="mdi-chevron-right"></v-icon>
      </template>
    </v-breadcrumbs>

    <v-spacer></v-spacer>

    <v-btn icon @click.native="$emit('toggleSettings')"><v-icon>mdi-cog-outline</v-icon></v-btn>

    <v-template v-if="settings && settings.languages">
      <Language :langs="settings.languages"/>
    </v-template>

    {{ adminSchema.schema.profile.username }}

    <v-btn icon @click.native="logout"><v-icon>mdi-logout</v-icon></v-btn>

  </v-app-bar>
</template>

<script>
import Language from '/src/components/Language.vue'
import { getBreadcrumbs } from '/src/utils/get-breadcrumb'
import { removeToken } from '/src/utils/auth'
import { setLang } from '/src/utils/language'

export default {
  props: {
    adminSchema: {type: Object, required: true},
    settings: {type: Object, required: true},
  },
  components: {
    Language,
  },
  data() {
    return {
      drawer: null,
      path: [],
      isNarrow: false,
    }
  },
  mounted () {
    const mq = window.matchMedia('(max-width: 1280px)')
    this.isNarrow = mq.matches

    mq.addEventListener('change', e => {
      this.isNarrow = e.matches
    })
  },
  watch: {
    $route() {
      this.getBreadcrumbInfo()
    }
  },
  created() {
    this.getBreadcrumbInfo()
  },
  methods: {
    getBreadcrumbInfo() {
      this.path = getBreadcrumbs(this.adminSchema, this.$router, this.$route)
    },
    changeLang(langSlug) {
      setLang(langSlug)
      document.location.reload()
    },
    logout() {
      removeToken()
      this.$router.push({ path: '/login' })
    },
  },
}
</script>
