<template>
  <v-card class="group-field-card">
    <div class="field-title-section">
      <span class="field-title">{{ field.label }}</span>
      <span v-if="field.required" class="required-star">*</span>
    </div>

    <div class="multiple-choice-options">
      <v-checkbox
        v-for="choice in field.choices"
        :key="choice.value"
        v-model="value"
        :value="choice.value"
        :label="choice.title"
        density="compact"
        :disabled="readOnly || loading"
        hide-details
        @update:modelValue="onChange"
      />
    </div>

    <div v-if="getMessages().length" class="field-help-text text-caption mt-1">
      {{ getMessages() }}
    </div>
  </v-card>
</template>

<script>
import { defaultProps, validateProps } from '/src/utils/fields.js'

const requiredFields = {
  choices: {type: Array, required: true},
}

export default {
  props: {
    ...defaultProps,
  },
  emits: ['changed'],
  data() {
    return {
      value: [],
    }
  },
  created() {
    validateProps(this, requiredFields)
    if (!this.isFilter) {
      this.value = this.field.default ?? (
        this.field.default_all_selected
          ? this.field.choices.map(choice => choice.value)
          : []
      )
    }
  },
  methods: {
    getMessages() {
      if (this.isFilter) return []
      return this.field.help_text || []
    },
    updateFormData(formData) {
      this.value = formData[this.fieldSlug] ?? []
    },
    onChange() {
      this.$emit('changed', [...this.value])
    },
  },
}
</script>
