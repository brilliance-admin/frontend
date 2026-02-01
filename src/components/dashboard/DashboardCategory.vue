<template>
  <div class="list-page">

    <div class="list-above-block">
      <div class="header-row-filters" v-if="hasFilters()">
        <Filters
          :category-schema="categorySchema"
          :filters-init="filters"
          :search-init="search"
          @filtered="handleFilter"
          :loading="loading"

          :search-enabled="getDashboardInfo().search_enabled"
          :fields-info="getDashboardInfo().table_filters.fields"
          :search-help="getDashboardInfo().search_help"
        />
      </div>
    </div>

    <div v-if="responseData">
      <v-container>
        <DashboardContainer :component-data="responseData" />
      </v-container>
    </div>

  </div>
</template>

<script>
import { toast } from "vue3-toastify"
import { CategorySchema } from '/src/api/schema'
import { getDashboardData } from '/src/api/dashboard'

import DashboardContainer from '/src/components/dashboard/DashboardContainer.vue'

export default {
  props: {
    adminSchema: {type: Object, required: true},
    categorySchema: {type: CategorySchema, required: true},
  },
  components: {
    DashboardContainer,
  },
  data() {
    return {
      search: null,
      filters: {},
      loading: false,
      responseData: null,
    }
  },
  created() {
    this.updateDashboard()
  },
  methods: {
    updateDashboard() {
      this.loading = true
      getDashboardData({
        group: this.categorySchema.group,
        category: this.categorySchema.category,
        filters: this.filters,
        search: this.search,
      }).then(response => {
        this.loading = false
        this.responseData = response.data
      }).catch(error => {
        this.loading = false
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
    hasFilters() {
      const table_filters = this.categorySchema.getDashboardInfo().table_filters
      return (
        this.categorySchema.getDashboardInfo().search_enabled ||
        (table_filters && Object.keys(table_filters).length > 0)
      )
    },
    handleFilter(filters, search) {
      this.filters = filters
      this.search = search
      this.updateDashboard()
    },
    getDashboardInfo() {
      return this.categorySchema.getDashboardInfo()
    },
  },
}
</script>
