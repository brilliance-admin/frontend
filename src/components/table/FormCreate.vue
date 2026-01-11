<template>
  <v-dialog
    content-class="dialog-top-position"
    persistent
    :retain-focus="false"
    v-model="open"
    class="create-dialog"
  >
    <template v-slot:activator="{ props: activatorProps }">
      <v-btn
        v-bind="activatorProps"
        color="primary"
        @click="open = true"
        icon="mdi-plus"
        class="button-icon"
      ></v-btn>
    </template>

    <template v-slot:default="{ isActive }">
      <v-card v-if="open">

        <v-card-title class="d-flex justify-space-between align-center">
          <span v-if="getTitle()">{{ getTitle() }}: {{ $t('creation') }}</span>

          <v-btn
            icon="mdi-close"
            variant="text"
            density="compact"
            @click="isActive.value = false"
          ></v-btn>
        </v-card-title>

        <!-- Form for create new model record -->
        <FieldsContainer
          ref="fieldscontainer"
          form-type="create"
          :category-schema="categorySchema"
          :table-schema="categorySchema.getTableInfo().table_schema"

          :loading="loading"

          @changed="value => formData = value"
        />

        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn
            :text="$t('close')"
            @click="open = false"
          />
          <v-btn
            :text="$t('create')"
            variant="elevated"
            color="primary"
            @click="createModel"
          />
        </v-card-actions>
      </v-card>
    </template>
  </v-dialog>
</template>

<script>
// A component for displaying a button that causes a form to be opened to create a model.
import { CategorySchema } from '/src/api/schema'
import { getTableCreate } from '/src/api/table'
import { toast } from "vue3-toastify"
import FieldsContainer from '/src/components/table/FieldsContainer.vue'

export default {
  props: {
    title: {type: String, required: true},
    adminSchema: {type: Object, required: true},
    categorySchema: {type: CategorySchema, required: true},
  },
  components: {
    FieldsContainer,
  },
  emits: ["created"],
  data() {
    return {
      open: false,
      formData: {},
      loading: false,
    }
  },
  methods: {
    getTitle() {
      return this.title
    },
    createModel() {
      this.loading = true
      this.$refs.fieldscontainer.updateErrors({})
      getTableCreate({
        group: this.categorySchema.group,
        category: this.categorySchema.category,
        data: this.formData,
      }).then(response => {
        this.loading = false
        if (response) {
          let message = this.$t('modelCreated', {'pk': response.data.pk})
          toast(message, {"theme": "auto", "type": "success", "position": "top-center"})
        }
        this.open = false
        this.formData = {}
        this.$emit('created')
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
  },
}
</script>
