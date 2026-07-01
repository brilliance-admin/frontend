<template>
  <div :class="{ 'formset-card': hasDirectFields(node) }">
    <div v-if="node.title || node.description" class="formset-header">
      <div v-if="node.title" class="formset-title">
        {{ node.title }}
      </div>
      <div v-if="node.description" class="formset-description">
        {{ node.description }}
      </div>
    </div>

    <div class="formset-grid">
      <template v-for="field in node.fields" v-bind:key="getFieldKey(field)">
        <div
          v-if="isFormsetNode(field)"
          class="formset-grid-item"
          :style="{ gridColumn: `span ${field.col_span || 12}` }"
        >
          <FormsetNode
            :ref="getRefString(getFieldKey(field))"
            :node="field"
            :category-schema="categorySchema"
            :table-schema="tableSchema"
            :loading="loading"
            :action-name="actionName"
            :read-only="readOnly"
            :inline-field-slug="inlineFieldSlug"
            :parent-pk="parentPk"
            :form-type="formType"
            :field-errors="fieldErrors"
            @changed="$emit('changed', $event)"
          />
        </div>

        <div
          v-else-if="resolveField(field).schema && isDisplayField(resolveField(field).schema)"
          class="field-cell formset-grid-item"
          :style="{ gridColumn: `span ${resolveField(field).col_span || 12}` }"
        >
          <span v-html="`<!-- type=${resolveField(field).schema.type} slug='${resolveField(field).slug}' -->`"></span>
          <div
            class="form-field-container"
            :class="[{ 'is-required': resolveField(field).schema.required, 'field-readonly': readOnly || resolveField(field).schema.read_only }]"
          >
            <component
              v-if="getFieldComponent(resolveField(field).schema, resolveField(field).slug)"
              :is="getFieldComponent(resolveField(field).schema, resolveField(field).slug)"
              :category-schema="categorySchema"
              density="comfortable"
              variant="filled"
              :ref="getRefString(resolveField(field).slug)"
              :field="resolveField(field).schema"
              :field-slug="resolveField(field).slug"
              :inline-field-slug="inlineFieldSlug"
              :loading="loading"
              :action-name="actionName"
              :read-only="readOnly || resolveField(field).schema.read_only"
              :parent-pk="parentPk"
              :error="getError(resolveField(field).slug)"
              @changed="value => _updateValue(value, resolveField(field).slug)"
            />
            <template v-else>
              Field "{{ resolveField(field).slug }}" type not found: {{ resolveField(field).schema }}
            </template>

            <template v-if="getError(resolveField(field).slug)">
              <p class="form-error">{{ formatError(getError(resolveField(field).slug)) }}</p>
            </template>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import BooleanField from '/src/components/fields/Boolean.vue'
import StringField from '/src/components/fields/String.vue'
import NumberField from '/src/components/fields/Number.vue'
import ChoiceField from '/src/components/fields/Choice.vue'
import FileField from '/src/components/fields/File.vue'
import JSONFormsField from '/src/components/fields/JSONForms.vue'
import JSONEditorField from '/src/components/fields/JSONEditor.vue'
import RelatedField from '/src/components/fields/Related.vue'
import DateTimeField from '/src/components/fields/DateTime.vue'
import ArrayField from '/src/components/fields/ArrayField.vue'
import InlineField from '/src/components/fields/InlineField.vue'
import TinyMCEField from '/src/components/fields/TinyMCE/index.vue'
import CKEditor from '/src/components/fields/CKEditor.vue'

export default {
  name: 'FormsetNode',
  props: {
    node: {type: Object, required: true},
    categorySchema: {type: Object, required: true},
    tableSchema: {type: Object, required: true},
    fieldErrors: {type: Object, required: false},
    loading: {type: Boolean, required: false},
    actionName: {type: String, required: false},
    readOnly: {type: Boolean, required: false},
    inlineFieldSlug: {type: String, required: false},
    parentPk: {type: [String, Number], required: false},
    formType: {type: String, required: true},
  },
  emits: ['changed'],
  methods: {
    isDisplayField(field) {
      if (this.formType === 'create' && field.read_only) return false
      return true
    },
    getFieldComponent(field) {
      if (['boolean'].indexOf(field.type) !== -1) return BooleanField
      if (['integer', 'decimal'].indexOf(field.type) !== -1) {
        if (field.choices) return ChoiceField
        return NumberField
      }
      if (['field', 'string', 'email', 'url', 'slug'].indexOf(field.type) !== -1) {
        if (field.tinymce) return TinyMCEField
        if (field.ckeditor) return CKEditor
        if (field.choices) return ChoiceField
        return StringField
      }
      if (['list', 'choice'].indexOf(field.type) !== -1) return ChoiceField
      if (['image', 'file'].indexOf(field.type) !== -1) return FileField
      if (['datetime', 'date', 'time'].indexOf(field.type) !== -1) return DateTimeField
      if (['related'].indexOf(field.type) !== -1) return RelatedField
      if (['array'].indexOf(field.type) !== -1) return ArrayField
      if (['inline'].indexOf(field.type) !== -1) return InlineField
      if (field.type === 'json') {
        if (field.json_forms) return JSONFormsField
        return JSONEditorField
      }
      return
    },
    isFormsetNode(field) {
      return !!field && typeof field === 'object' && Array.isArray(field.fields)
    },
    hasDirectFields(formset) {
      if (!formset || !Array.isArray(formset.fields)) return false
      return formset.fields.some(field => field && (typeof field === 'string' || !field.fields))
    },
    getFieldKey(field) {
      if (!field) return 'field-null'
      if (typeof field === 'string') return field
      return field.field || field.slug || field.title || JSON.stringify(field)
    },
    getField(slug) {
      return this.tableSchema.fields[slug]
    },
    resolveField(field) {
      if (typeof field === 'string') {
        return {slug: field, schema: this.getField(field), col_span: null}
      }
      const slug = field.field || field.slug || field.title
      return {slug, schema: this.getField(slug), col_span: field.col_span ?? null}
    },
    getRefString(slug) {
      return `field_${slug}`
    },
    getError(field_slug) {
      if (this.fieldErrors) return this.fieldErrors[field_slug]
    },
    formatError(error) {
      if (error.code) return this.$t(error.code)
      return error.message
    },
    _updateValue(value, field_slug) {
      this.$emit('changed', value, field_slug)
    },
    updateFormData(newData) {
      for (const field of this.node.fields) {
        if (this.isFormsetNode(field)) {
          const child = this.$refs[this.getRefString(this.getFieldKey(field))]
          if (child && child[0] && child[0].updateFormData) child[0].updateFormData(newData)
          continue
        }

        const resolved = this.resolveField(field)
        if (!resolved.slug) continue

        const ref = this.$refs[this.getRefString(resolved.slug)]
        if (!ref || !ref[0] || !ref[0].updateFormData) continue
        ref[0].updateFormData(newData)
      }
    },
  },
}
</script>
