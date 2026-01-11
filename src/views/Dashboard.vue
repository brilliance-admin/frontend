<template>
  <div class="dashboard-page">

    <template v-for="(group, group_slug) in adminSchema.get_categories()">
      <div
        class="dashboard-element"
        cols="12"
        md="3"
        :key="group_slug"
        v-if="hasSubcategories(group)"
      >
        <v-card
          class="mx-auto"
          :prepend-icon="group.icon"
          width="400"
        >

          <template v-slot:title>
            <span class="font-weight-black">{{ group.title }}</span>
          </template>

          <v-card-text class="bg-surface-light pt-4">
            <v-list>
              <v-list-item
                v-for="(category, category_slug) in group.categories"
                :key="category_slug"
                :title="category.title"
                :prepend-icon="category.icon"
                :to="categoryUrl(group_slug, category_slug)"
              ></v-list-item>
            </v-list>
          </v-card-text>

        </v-card>

      </div>
    </template>

  </div>
</template>

<script>
import { config_dataset } from '/src/utils/settings'
import { categoryUrl } from '/src/api/schema'

export default {
  props: {
    adminSchema: {type: Object, required: true},
    settings: {type: Object, required: true},
  },
  data() {
    return {
      categoryUrl: categoryUrl,
    }
  },
  watch: {
    $route: {
      immediate: true,
      handler(to, from) {
        document.title = `${this.$t('mainPage')} | ${this.settings?.title}`
      }
    },
  },
  methods: {
    hasSubcategories(group) {
      return group.categories && typeof group.categories === 'object' && Object.keys(group.categories).length > 0
    },
  }
}
</script>
