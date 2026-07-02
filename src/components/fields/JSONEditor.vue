<template>
  <div class="field-title-section">
    <span class="field-title">{{ field.label }}</span>
    <span v-if="field.required" class="required-star">*</span>
  </div>

  <JsonEditorVue
    v-model="value"
    :class="{ 'jse-theme-dark': this.$vuetify.theme.current.dark, 'jse-readonly': readOnly }"
    :read-only="readOnly"
  />

  <div v-if="field.help_text" class="field_help_text text-caption mt-1">
    {{ field.help_text }}
  </div>
</template>

<script>
import { defaultProps, validateProps } from '/src/utils/fields.js'
import 'vanilla-jsoneditor/themes/jse-theme-dark.css'

import JsonEditorVue from 'json-editor-vue'

export default {
  components: {
    JsonEditorVue,
  },
  props: {
    ...defaultProps,
  },
  emits: ["changed"],
  data(props) {
    return {
      value: null,
    }
  },
  watch: {
    value(val){
      if (typeof val === 'string') {
        try {
          val = JSON.parse(val)
        } catch (e) {
          throw new Error(`JSONEditor invalid JSON for field "${this.fieldSlug}": ${e.message}`)
        }
      }
      this.$emit('changed', val)
    }
  },
  methods: {
    updateFormData(initFormData) {
      this.value = initFormData[this.fieldSlug] || {}

      if (typeof this.value !== 'object') {
        this.value = JSON.parse(this.value)
      }
    },
  },
}
</script>
