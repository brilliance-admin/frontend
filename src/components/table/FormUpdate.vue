<template>

  <div class="form-update">
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
import { CategorySchema } from '/src/api/schema'
import { getTableRetrieve, sendTableUpdate } from '/src/api/table'
import { toast } from "vue3-toastify"
import FieldsContainer from '/src/components/table/FieldsContainer.vue'

export default {
  props: {
    adminSchema: {type: Object, required: true},
    categorySchema: {type: CategorySchema, required: true},
    pk: {type: String, required: false},
  },
  components: {
    FieldsContainer,
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
      }).then(response => {
        this.loading = false
        this.formData = response.data.data
        this.$refs.fieldscontainer.updateFormData(response.data.data)
      }).catch(error => {
        this.loading = false
        if (error.response && error.response.status === 404) {
          this.$router.push({ path: '/404' })
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

        const errorResult = this.$handleError(error)
        if (errorResult.fieldErrors) {
          this.$refs.fieldscontainer.updateErrors(errorResult.fieldErrors)
        }
      })
    },
  },
}
</script>
