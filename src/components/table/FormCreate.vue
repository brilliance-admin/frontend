<template>
  <v-dialog
    content-class="dialog-top-position"
    persistent
    :retain-focus="false"
    v-model="open"
    class="create-dialog"
  >
    <template v-slot:activator="{ props: activatorProps }">
      <slot name="activator" :props="activatorProps">
        <v-btn
          v-bind="activatorProps"
          color="primary"
          @click="open = true"
          icon="mdi-plus"
          class="button-icon"
        ></v-btn>
      </slot>
    </template>

    <template v-slot:default="{ isActive }">
      <v-card v-if="open" :loading="loading">

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
          v-if="defaultsLoaded"
          ref="fieldscontainer"
          form-type="create"
          :admin-schema="adminSchema"
          :category-schema="categorySchema"
          :table-schema="categorySchema.getTableInfo().table_schema"
          :parent-pk="parentPk"
          :initial-form-data="initialFormData"

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
            :disabled="loading || !defaultsLoaded"
            @click="createModel"
          />
        </v-card-actions>
      </v-card>
    </template>
  </v-dialog>

  <v-dialog v-model="persistentMessageDialog" class="persistent-message-dialog">
    <v-card>
      <v-card-text v-html="persistentMessage" />
      <v-card-actions>
        <v-spacer />
        <v-btn :text="$t('close')" @click="persistentMessageDialog = false" />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
// A component for displaying a button that causes a form to be opened to create a model.
import { CategorySchema } from '/src/api/schema'
import { getTableBeforeCreate, getTableCreate } from '/src/api/table'
import { toast } from "vue3-toastify"
import FieldsContainer from '/src/components/table/FieldsContainer.vue'

export default {
  props: {
    title: {type: String, required: true},
    adminSchema: {type: Object, required: true},
    categorySchema: {type: CategorySchema, required: true},
    parentPk: {type: [String, Number], required: false},
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
      defaultsLoaded: false,
      initialFormData: {},
      defaultsController: null,
      persistentMessageDialog: false,
      persistentMessage: null,
    }
  },
  watch: {
    open(isOpen) {
      if (isOpen) {
        this.loadDefaults()
      } else {
        this.defaultsController?.abort()
        this.defaultsLoaded = false
      }
    },
  },
  beforeUnmount() {
    this.defaultsController?.abort()
  },
  methods: {
    async loadDefaults() {
      this.defaultsController?.abort()
      const controller = new AbortController()
      this.defaultsController = controller
      this.defaultsLoaded = false
      this.initialFormData = {}
      this.formData = {}
      this.loading = true
      try {
        const response = await getTableBeforeCreate({
          group: this.categorySchema.group,
          category: this.categorySchema.category,
          subcategory: this.categorySchema.subcategory,
          parent_pk: this.parentPk,
          formData: this.formData,
          signal: controller.signal,
        })
        if (controller.signal.aborted) return
        this.initialFormData = response.data.form_data
        this.formData = { ...response.data.form_data }
        this.defaultsLoaded = true
      } catch (error) {
        if (controller.signal.aborted) return
        const errorResult = this.$handleError(error, this.$t('errorTitles.loadRecord'))
        if (errorResult.persistentMessage) {
          this.persistentMessageDialog = true
          this.persistentMessage = errorResult.persistentMessage
        }
      } finally {
        if (this.defaultsController === controller) {
          this.loading = false
        }
      }
    },
    getTitle() {
      return this.title
    },
    createModel() {
      if (this.loading || !this.defaultsLoaded) return
      this.loading = true
      this.$refs.fieldscontainer.updateErrors({})
      getTableCreate({
        group: this.categorySchema.group,
        category: this.categorySchema.category,
        subcategory: this.categorySchema.subcategory,
        parent_pk: this.parentPk,
        data: this.formData,
      }).then(response => {
        this.loading = false
        if (response) {
          let message = this.$t('modelCreated', {'pk': response.data.pk})
          toast(message, {"theme": "auto", "type": "success", "position": "top-center"})
        }
        this.open = false
        this.formData = {}
        this.$emit('created', response.data)
      }).catch(error => {
        this.loading = false

        const errorResult = this.$handleError(error, this.$t('errorTitles.createRecord'))
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
