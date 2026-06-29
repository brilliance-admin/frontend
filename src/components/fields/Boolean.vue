<template>

  <v-switch
    class="boolean-switch"
    :density="density"
    :variant="variant"
    :label="field.label"
    :model-value="value"
    :messages="field.help_text || []"
    :disabled="readOnly"
    color="primary"
    :loading="loading"

    @update:modelValue="onChange"
  >
    <template #label>
      <span class="field-title">{{ field.label }}</span>
      <span v-if="field.required" class="required-star">*</span>
    </template>
  </v-switch>

</template>

<script>
import { defaultProps, validateProps } from '/src/utils/fields.js'

export default {
  props: {
    ...defaultProps,
  },
  emits: ["changed"],
  data(props) {
    return {
      value: null,
    }
  },
  created() {
    validateProps(this)
    this.value = this.field.initial
  },
  methods: {
    updateFormData(initFormData) {
      this.value = initFormData[this.fieldSlug]
    },
    onChange(newValue) {
      this.value = newValue
      this.$emit('changed', this.value)
    },
  },
}
</script>
