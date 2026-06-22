<template>
  <div
    v-if="categorySchema && isNestedDetail"
    class="edit-tabs-container d-flex edit-tabs-container--no-subcategories"
    elevation="2"
  >
    <div class="detail-tabs-window">
      <div class="detail-tab">
        <FormUpdate
          :admin-schema="adminSchema"
          :category-schema="categorySchema"
          :pk="detailPk"
          :parent-pk="pk"
          @closed="updateClosed"
        />
      </div>
    </div>
  </div>

  <div
    v-else-if="categorySchema"
    :class="['edit-tabs-container', 'd-flex', {'edit-tabs-container--no-subcategories': !hasSubcategories()}]"
    elevation="2"
  >
    <v-tabs
      v-model="activeTab"
      color="primary"
      direction="vertical"
      class="table-tabs"
      bg-color="light2"
    >
      <v-tab :value="0">{{ $t('mainTab') }}</v-tab>

      <template v-for="(subcategorySchema, category_slug, index) in getSubcategories()">
        <v-tab :value="index + 1">{{ subcategorySchema.title }}</v-tab>
      </template>
    </v-tabs>

    <v-divider vertical></v-divider>

    <v-tabs-window
      v-model="activeTab"
      class="detail-tabs-window"
    >

      <!-- Main category -->
      <v-tabs-window-item
        :value="0"
        class="detail-tab"
        :transition="false"
        :reverse-transition="false"
        :eager="true"
      >
        <FormUpdate :admin-schema="adminSchema" :category-schema="categorySchema" :pk="pk" @closed="updateClosed"/>
      </v-tabs-window-item>

      <!-- Subcategories -->
      <template v-for="(subcategorySchema, category_slug, index) in getSubcategories()">
        <v-tabs-window-item
          :value="index + 1"
          class="detail-tab"
          :transition="false"
          :reverse-transition="false"
          :eager="false"
        >

            <template v-if="subcategorySchema.type === 'table'">
              <TableCategory :admin-schema="adminSchema" :category-schema="subcategorySchema" :parent-pk="pk"/>
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
import { categoryUrl, CategorySchema, detailUrl } from '/src/api/schema'
import FormUpdate from '/src/components/table/FormUpdate.vue'
import TableCategory from '/src/components/table/TableCategory.vue'

export default {
  props: {
    adminSchema: {type: Object, required: true},
    settings: {type: Object, required: true},

    group: {type: String, required: true},
    category: {type: String, required: true},
    pk: {type: String, required: false},
    subcategory: {type: String, required: false},
    subpk: {type: String, required: false},
  },
  components: {
    FormUpdate,
  },
  data() {
    return {
      categorySchema: null,
      parentCategorySchema: null,
      activeTab: 0,
    }
  },
  computed: {
    isNestedDetail() {
      return !!(this.subcategory && this.subpk)
    },
    detailPk() {
      return this.isNestedDetail ? this.subpk : this.pk
    },
  },
  created() {
    this.parentCategorySchema = this.adminSchema.get_category(this.group, this.category)
    if (!this.parentCategorySchema) {
      this.$router.push({ path: '/404' })
      return
    }

    if (this.isNestedDetail) {
      const nestedSchema = this.getSubcategories(this.parentCategorySchema)[this.subcategory]
      if (!nestedSchema) {
        this.$router.push({ path: '/404' })
        return
      }
      this.categorySchema = nestedSchema
    } else {
      this.categorySchema = this.parentCategorySchema
    }

    if (!this.categorySchema.getTableInfo().can_retrieve) {
      console.error(`Page retrieve "${this.group}.${this.category}" is not found`)
      this.$router.push({ path: '/404' })
      return
    }
    this.deserializeQuery()
    this.updateDocumentTitle()
  },
  watch: {
    activeTab(value) {
      this.serializeQuery()
    },
    $route: {
      immediate: true,
      handler(to, from) {
        this.updateDocumentTitle()
        if (!this.isNestedDetail && this.categorySchema) {
          this.deserializeQuery()
        }
      }
    },
  },
  methods: {
    updateDocumentTitle() {
      if (!this.parentCategorySchema) return

      if (this.isNestedDetail) {
        if (!this.categorySchema) return
        document.title = `${this.categorySchema.title} #${this.subpk} - ${this.parentCategorySchema.title} #${this.pk} | ${this.settings?.title}`
        return
      }

      const subtab = this.$route.query.subtab
      if (subtab) {
        const subcategorySchema = this.getSubcategories(this.parentCategorySchema)[subtab]
        if (subcategorySchema) {
          document.title = `${subcategorySchema.title} - ${this.parentCategorySchema.title} #${this.pk} | ${this.settings?.title}`
          return
        }
      }

      document.title = `${this.parentCategorySchema.title} #${this.pk} | ${this.settings?.title}`
    },
    updateClosed() {
        if (this.isNestedDetail) {
          this.$router.push({
            path: detailUrl(this.group, this.category, this.pk),
            query: {subtab: this.subcategory},
          })
          return
        }

        const url = categoryUrl(this.categorySchema.group, this.categorySchema.category)
        this.$router.push({ path: url } )
    },
    getSubcategories(categorySchema = this.categorySchema) {
      let result = {}
      const subcategories = categorySchema.getTableInfo().subcategories
      for (const [subcategory_slug, subcategorySchema] of Object.entries(subcategories)) {
        result[subcategory_slug] = new CategorySchema(
          subcategorySchema,
          categorySchema.group,
          categorySchema.category,
          subcategory_slug,
        )
      }
      return result
    },
    hasSubcategories() {
      return Object.keys(this.categorySchema.getTableInfo().subcategories).length > 0
    },
    deserializeQuery() {
      if (!this.categorySchema) return

      const subtab = this.$route.query.subtab
      const subcategorySlugs = Object.keys(this.categorySchema.getTableInfo().subcategories)
      const subtabIndex = subcategorySlugs.indexOf(subtab)

      if (subtab && subtabIndex !== -1) {
        this.activeTab = subtabIndex + 1
      } else {
        this.activeTab = 0
      }
    },
    serializeQuery() {
      let newQuery = {}

      const subcategorySlugs = Object.keys(this.categorySchema.getTableInfo().subcategories)
      const subtabSlug = subcategorySlugs[this.activeTab - 1]

      if (this.activeTab > 0 && subtabSlug) {
        newQuery.subtab = subtabSlug
      }

      this.$router.push({ query: newQuery })
    },
  },
}
</script>
