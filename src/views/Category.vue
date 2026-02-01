<template>

  <template v-if="getType() === 'table'">
    <TableCategory :admin-schema="adminSchema" :category-schema="categorySchema"/>
  </template>

  <template v-else-if="getType() === 'dashboard'">
    <DashboardCategory :admin-schema="adminSchema" :category-schema="categorySchema"/>
  </template>

  <template v-else>
    Category type "{{ getType() }}" is not supported
  </template>

</template>

<script>
import { config_dataset } from '/src/utils/settings'
import TableCategory from '/src/components/table/TableCategory.vue'
import DashboardCategory from '/src/components/dashboard/DashboardCategory.vue'

export default {
  props: {
    adminSchema: {type: Object, required: true},
    settings: {type: Object, required: true},

    group: {type: String, required: true},
    category: {type: String, required: true},
  },
  components: {
    TableCategory,
    DashboardCategory,
  },
  data() {
    return {
      currentTab: null,
      apiMethods: null,
      categorySchema: null,
    }
  },
  created() {
    this.categorySchema = this.adminSchema.get_category(this.group, this.category)
    if (!this.categorySchema) {
      console.error(`Page with category "${this.category}" not found`)
      this.$router.push({ path: '/404' })
      return
    }
  },
  watch: {
    $route: {
      immediate: true,
      handler(to, from) {
        const categorySchema = this.adminSchema.get_category(this.group, this.category)
        if (categorySchema) {
          document.title = `${categorySchema.title} | ${this.settings?.title}`
        }
      }
    },
  },
  methods: {
    getType() {
      if (!this.categorySchema) return
      return this.categorySchema.type
    },
  },
}
</script>
