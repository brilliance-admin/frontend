<template>

  <div class="form-update">

    <v-card class="form-card">
      <v-card-title class="d-flex justify-space-between align-center flex-wrap ga-3">
        <span>{{ getHeaderTitle() }}</span>

        <div class="d-flex flex-wrap ga-2">
          <v-btn
            v-for="(actionInfo, actionKey) in getDetailActions()"
            :key="actionKey"
            size="default"
            class="action-button"
            :variant="actionInfo.variant || 'flat'"
            :prepend-icon="actionInfo.icon"
            :base-color="actionInfo.base_color || 'secondary'"
            @click="runDetailAction(actionKey, actionInfo)"
          >
            {{ actionInfo.title }}
          </v-btn>
        </div>
      </v-card-title>
    </v-card>

    <TableActionExecutor
      ref="actionExecutor"
      :category-schema="categorySchema"
      :parent-pk="parentPk"
      @success="handleActionSuccess"
    />

    <FieldsContainer
      ref="fieldscontainer"
      form-type="edit"
      :category-schema="categorySchema"
      :table-schema="categorySchema.getTableInfo().table_schema"

      :loading="loading"
      :read-only="!canUpdate()"

      @changed="value => formData = value"
    />

    <div class="model-form-bottom-actions">
      <div class="model-form-button">
        <v-btn
          v-if="canUpdate()"
          :text="$t('updateContinue')"
          variant="elevated"
          color="secondary"
          @click="updateModel(false)"
          :disabled="this.loading"
        />
      </div>
      <div class="model-form-button">
        <v-btn
          v-if="canUpdate()"
          :text="$t('update')"
          variant="elevated"
          color="primary"
          @click="updateModel(true)"
          :disabled="this.loading"
        />
      </div>
    </div>
  </div>

</template>

<script>
import { categoryUrl, CategorySchema, detailUrl } from '/src/api/schema'
import { getTableRetrieve, sendTableUpdate } from '/src/api/table'
import { getBreadcrumbs } from '/src/utils/get-breadcrumb'
import { toast } from "vue3-toastify"
import FieldsContainer from '/src/components/table/FieldsContainer.vue'
import TableActionExecutor from '/src/components/table/TableActionExecutor.vue'

export default {
  props: {
    adminSchema: {type: Object, required: true},
    categorySchema: {type: CategorySchema, required: true},
    pk: {type: String, required: false},
    parentPk: {type: [String, Number], required: false},
  },
  components: {
    FieldsContainer,
    TableActionExecutor,
  },
  emits: ["closed"],
  data() {
    return {
      loading: true,
      formData: {},
    }
  },
  async created() {
    this.retrieveData()
  },
  methods: {
    getHeaderTitle() {
      const breadcrumbs = getBreadcrumbs(this.adminSchema, this.$router, this.$route)
      const lastBreadcrumb = breadcrumbs[breadcrumbs.length - 1]

      if (lastBreadcrumb?.title) {
        return lastBreadcrumb.title
      }

      if (this.pk) {
        return `${this.categorySchema.title} #${this.pk}`
      }

      return this.categorySchema.title
    },
    getDetailActions() {
      const actions = this.categorySchema.getTableInfo().actions || {}
      return Object.fromEntries(
        Object.entries(actions).filter(([, actionInfo]) => actionInfo.allow_empty_selection !== true)
      )
    },
    runDetailAction(actionKey, actionInfo) {
      if (!this.pk) {
        throw new Error('Detail action requires record pk')
      }

      this.$refs.actionExecutor.run({
        actionKey,
        actionInfo,
        pks: [this.pk],
        sendToAll: false,
        filters: {},
        search: null,
        totalCount: 1,
      })
    },
    handleActionSuccess() {
      this.retrieveData()
    },
    redirectToList() {
      if (this.categorySchema.subcategory && this.parentPk) {
        this.$router.push({
          path: detailUrl(this.categorySchema.group, this.categorySchema.category, this.parentPk),
          query: {subtab: this.categorySchema.subcategory},
        })
        return
      }

      this.$router.push({
        path: categoryUrl(this.categorySchema.group, this.categorySchema.category),
      })
    },
    retrieveData() {
      if (!this.categorySchema.getTableInfo().can_retrieve) {
        console.error(`retrieve method is not found`)
        return
      }

      this.loading = true
      getTableRetrieve({
        group: this.categorySchema.group,
        category: this.categorySchema.category,
        pk: this.pk,
        subcategory: this.categorySchema.subcategory,
        parent_pk: this.parentPk,
      }).then(response => {
        this.loading = false
        this.formData = response.data.data
        this.$refs.fieldscontainer.updateFormData(response.data.data)
      }).catch(error => {
        this.loading = false
        if (error.response?.data?.code === 'record_not_found') {
          toast(error.response.data.message, {
            theme: "auto",
            type: "warning",
            position: "top-center",
          })
          this.redirectToList()
          return
        }

        if (error.response && error.response.status === 404) {
          this.$router.push({ path: '/404' })
          return
        }

        const errorResult = this.$handleError(error, this.$t('errorTitles.loadRecord'))
        if (errorResult.fieldErrors) {
          this.$refs.fieldscontainer.updateErrors(errorResult.fieldErrors)
        }
        if (errorResult.persistentMessage) {
          this.persistentMessageDialog = true
          this.persistentMessage = errorResult.persistentMessage
        }
      })
    },
    canUpdate() {
      return this.categorySchema.getTableInfo().can_update
    },
    updateModel(closeAfter) {
      if (!this.canUpdate()) {
        console.error(`This cetegory is not available for an update`)
        return
      }

      this.$refs.fieldscontainer.updateErrors({})
      this.loading = true
      sendTableUpdate({
        group: this.categorySchema.group,
        category: this.categorySchema.category,
        pk: this.pk,
        subcategory: this.categorySchema.subcategory,
        parent_pk: this.parentPk,
        data: this.formData,
      }).then(response => {
        this.loading = false
        let message = this.$t('modelUpdated', {'pk': response.data.pk})
        toast(message, {"theme": "auto", "type": "success", "position": "top-center"})
        if (closeAfter) {
          this.$emit('closed')
        }
      }).catch(error => {
        this.loading = false

        const errorResult = this.$handleError(error, this.$t('errorTitles.updateRecord'))
        if (errorResult.fieldErrors) {
          this.$refs.fieldscontainer.updateErrors(errorResult.fieldErrors)
        }
      })
    },
  },
}
</script>
