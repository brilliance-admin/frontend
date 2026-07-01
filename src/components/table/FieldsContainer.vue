<template>
  <div fluid class="fields-container">
    <template v-if="field_errors">
      <template v-for="error in field_errors['non_field_errors']" v-bind:key="error">
        <v-alert
          :text="error"
          type="error"
        ></v-alert>
      </template>
    </template>

    <FormsetNode
      ref="rootFormsetNode"
      :node="getFormset()"
      :category-schema="categorySchema"
      :table-schema="tableSchema"
      :loading="loading"
      :action-name="actionName"
      :read-only="readOnly"
      :inline-field-slug="inlineFieldSlug"
      :parent-pk="parentPk"
      :form-type="formType"
      :field-errors="field_errors"
      @changed="value => $emit('changed', value)"
    />

  </div>
</template>

<script>
import { CategorySchema } from '/src/api/schema'
// Contains a list of tabs and a list of fields
import FormsetNode from '/src/components/table/FormsetNode.vue'

export default {
  name: 'FieldsContainer',
  components: { FormsetNode },
  props: {
    categorySchema: {type: CategorySchema, required: true},
    tableSchema: {type: Object, required: true},
    loading: {type: Boolean, required: false},
    actionName: {type: String, required: false},
    readOnly: {type: Boolean, required: false},
    inlineFieldSlug: {type: String, required: false},
    parentPk: {type: [String, Number], required: false},
    formType: {
      type: String,
      required: true,
      validator: function (value) {
          return ['create', 'edit'].indexOf(value) !== -1
      }
    },
  },
  emits: ["changed"],
  data() {
    return {
      field_errors: {},
      formData: {},
    }
  },
  created() {
  },
  methods: {
    getFormset() {
      if (this.tableSchema.formset) return this.tableSchema.formset

      return {
        fields: Object.keys(this.tableSchema.fields || {}),
      }
    },
    getField(slug) {
      return this.tableSchema.fields[slug]
    },
    updateErrors(field_errors) {
      this.field_errors = field_errors
    },
    updateFormData(newData) {
      this.formData = newData
      const root = this.$refs.rootFormsetNode
      if (root && root.updateFormData) {
        root.updateFormData(this.formData)
      }
    },
  },
}
</script>
