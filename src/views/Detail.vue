<template>

  <div :class="['edit-tabs-container', 'd-flex', {'edit-tabs-container--no-subcategories': !hasSubcategories()}]" elevation="2">
    <v-tabs
      v-model="activeTab"
      color="primary"
      direction="vertical"
      class="table-tabs"
      bg-color="light2"
    >
      <v-tab :value="null">{{ $t('mainTab') }}</v-tab>

      <template v-for="(subcategorySchema, category_slug) in getSubcategories()">
        <v-tab :value="category_slug">{{ subcategorySchema.title }}</v-tab>
      </template>
    </v-tabs>

    <v-divider vertical></v-divider>

    <v-tabs-window
      v-model="activeTab"
      class="detail-tabs-window"
    >

      <!-- Main category -->
      <v-tabs-window-item
        :value="null"
        class="detail-tab"
        :transition="false"
        :reverse-transition="false"
        :eager="true"
      >
        <FormUpdate :admin-schema="adminSchema" :category-schema="categorySchema" :pk="pk" @closed="updateClosed"/>
      </v-tabs-window-item>

      <!-- Subcategories -->
      <template v-for="(subcategorySchema, category_slug) in getSubcategories()">
        <v-tabs-window-item
          :value="category_slug"
          class="detail-tab"
          :transition="false"
          :reverse-transition="false"
          :eager="false"
        >

            <template v-if="subcategorySchema.type === 'table'">
              <TableCategory :admin-schema="adminSchema" :category-schema="subcategorySchema"/>
            </template>

            <template v-else-if="subcategorySchema.type === 'dashboard'">
              <DashboardCategory :admin-schema="adminSchema" :category-schema="subcategorySchema"/>
            </template>

            <template v-else>
              Type "{{ subcategorySchema.type }}" is not supporetd
            </template>

        </v-tabs-window-item>
      </template>

    </v-tabs-window>

  </div>
</template>

<script>
import { categoryUrl, CategorySchema } from '/src/api/schema'
import FormUpdate from '/src/components/table/FormUpdate.vue'
import TableCategory from '/src/components/table/TableCategory.vue'

export default {
  props: {
    adminSchema: {type: Object, required: true},
    settings: {type: Object, required: true},

    group: {type: String, required: true},
    category: {type: String, required: true},
    pk: {type: String, required: false},
  },
  components: {
    FormUpdate,
  },
  data() {
    return {
      categorySchema: null,
      activeTab: null,
    }
  },
  created() {
    this.categorySchema = this.adminSchema.get_category(this.group, this.category)
    if (!this.categorySchema.getTableInfo().can_retrieve) {
      console.error(`Page retrieve "${this.group}.${this.category}" is not found`)
      this.$router.push({ path: '/404' })
      return
    }
    this.deserializeQuery()
  },
  watch: {
    activeTab(value) {
      this.serializeQuery()
    },
    $route: {
      immediate: true,
      handler(to, from) {
        const categorySchema = this.adminSchema.get_category(this.group, this.category)
        document.title = `${categorySchema.title} #${this.pk} | ${this.settings?.title}`
      }
    },
  },
  methods: {
    updateClosed() {
        const url = categoryUrl(this.categorySchema.group, this.categorySchema.category)
        this.$router.push({ path: url } )
    },
    getSubcategories() {
      let result = {}
      const subcategories = this.categorySchema.getTableInfo().subcategories
      for (const [subcategory_slug, subcategorySchema] of Object.entries(subcategories)) {
        result[subcategory_slug] = new CategorySchema(
          subcategorySchema,
          this.categorySchema.group,
          this.categorySchema.category,
          subcategory_slug,
        )
      }
      return result
    },
    hasSubcategories() {
      return Object.keys(this.categorySchema.getTableInfo().subcategories).length > 0
    },
    deserializeQuery() {
      const subtab = this.$route.query.subtab
      const subcategories = this.categorySchema.getTableInfo().subcategories
      if (subtab && Object.keys(subcategories).includes(subtab)) {
        this.activeTab = subtab
      }
    },
    serializeQuery() {
      let newQuery = {}

      const subcategories = this.categorySchema.getTableInfo().subcategories
      if (Object.keys(subcategories).includes(this.activeTab)) {
        newQuery.subtab = this.activeTab
      }

      this.$router.push({ query: newQuery })
    },
  },
}
</script>
