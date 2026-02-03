<template>
  <v-navigation-drawer
    class="navbar-container"
    v-model="drawer"
    :width="260"
    :permanent="false"
  >
    <v-list-item class="logo-item">
      <router-link :to="getMainPage()" class="logo-link">
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
      <template v-for="(group, group_slug) in adminSchema.get_categories()">

        <!-- Группа с одним разделом - выводим как прямую ссылку -->
        <v-list-item
          v-if="group.type === 'group' && isSingleCategory(group)"
          class="navbar-link"
          :key="'single-' + group_slug"
          :active="isFirstCategoryActive(group_slug, group)"
          :prepend-icon="group.icon"
          :title="group.title"
          :subtitle="group.description"
          :to="getFirstCategoryUrl(group_slug, group)"
          :density="navbarDensity()"
        ></v-list-item>

        <!-- Группа с несколькими разделами -->
        <v-list-group
          :value="group_slug"
          :key="'group-' + group_slug"
          v-else-if="group.type === 'group'"
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

        <!-- Ссылка -->
        <v-list-item
          v-else-if="group.type === 'link'"
          :key="'link-' + group_slug"
          :active="isTabActive(group_slug, null)"
          :title="group.title"
          :subtitle="group.description"
          :density="navbarDensity()"
          :append-icon="group.icon || 'mdi-open-in-new'"
          :to="isAbsolute(group.link) ? undefined : group.link"
          :href="isAbsolute(group.link) ? group.link : undefined"
          target="_blank"
          rel="noopener"
        />

      </template>
    </v-list>

  </v-navigation-drawer>
</template>

<script>
import { categoryUrl } from '/src/api/schema'
import { config_dataset } from '/src/utils/settings'

export default {
  props: {
    adminSchema: { type: Object, required: true },
    settings: { type: Object, required: true },
  },
  data() {
    return {
      drawer: true,
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
    getMainPage() {
      return this.settings.main_page || "/navigation"
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
    isAbsolute(link) {
      if (!link) return false
      return /^(https?:)?\/\//.test(link)
    },
    isSingleCategory(group) {
      if (!group.categories) return false
      return Object.keys(group.categories).length === 1
    },
    getFirstCategoryUrl(group_slug, group) {
      const firstCategorySlug = Object.keys(group.categories)[0]
      return categoryUrl(group_slug, firstCategorySlug)
    },
    isFirstCategoryActive(group_slug, group) {
      const firstCategorySlug = Object.keys(group.categories)[0]
      return this.isTabActive(group_slug, firstCategorySlug)
    },
  },
}
</script>
