<template>
  <v-navigation-drawer
    class="navbar-container"
    :modelValue="drawer"
  >
    <v-list-item class="logo-item">
      <router-link to="/dashboard" class="logo-link">
        <v-img
          v-if="getLogo()"
          class="project-logo"
          :alt="getTitle()"
          :src="getLogo()"
          max-width="250"
          :eager="true"
        />
        <p class="project-logo-text text-h6" v-else>{{ getTitle() }}</p>
      </router-link>
    </v-list-item>

    <v-divider></v-divider>

    <v-list v-model:opened="openedGroups">
      <v-list-group
        v-for="(group, group_slug) in adminSchema.get_groups()"
        :value="group_slug"
        :key="group_slug"
      >
        <template v-slot:activator="{ props }">
          <v-list-item
            :density="navbarDensity()"
            v-bind="props"
            :title="group.title"
            :prepend-icon="group.icon"
            :subtitle="group.description"
          ></v-list-item>
        </template>

        <v-list-item
          class="navbar-link"
          v-for="(category, category_slug) in group.categories"

          :active="isTabActive(group_slug, category_slug)"

          :key="category_slug"
          :prepend-icon="category.icon"
          :title="category.title"
          :subtitle="category.description"
          :to="categoryUrl(group_slug, category_slug)"
          :density="navbarDensity()"
        ></v-list-item>
      </v-list-group>
    </v-list>

  </v-navigation-drawer>
</template>

<script>
import { categoryUrl } from '/src/api/scheme'
import { config_dataset } from '/src/utils/settings'

export default {
  props: {
    adminSchema: {type: Object, required: true},
    settings: {type: Object, required: true},
  },
  components: {
  },
  data() {
    return {
      drawer: null,
      openedGroups: [],
      categoryUrl: categoryUrl,
    }
  },
  created() {
    this.openedGroups.push(this.$route.params.group)
  },
  watch: {
    $route(to, from) {
      this.openedGroups.push(to.params.group)
    },
  },
  methods: {
    isTabActive(group_slug, category_slug) {
      return this.$route.params.group === group_slug && this.$route.params.category === category_slug
    },
    getLogo() {
      return config_dataset.logo_image
    },
    navbarDensity() {
      return this.settings.navbar_density || "default"
    },
    getTitle() {
      return this.settings.title
    },
    toggleDrawer() {
      this.drawer = !this.drawer
    },
  }
}
</script>
