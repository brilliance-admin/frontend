<template>
  <v-textarea
    v-if="field.multilined"
    :variant="variant"
    :density="density"
    :clearable="!readOnly"
    :model-value="value"
    :messages="field.help_text || []"
    :readonly="readOnly"
    :loading="loading"
    @update:modelValue="onChange"
    @keydown.enter.prevent="keydownEnter"
  >
    <template #label>
      <span class="field-title">{{ field.label }}</span>
      <span v-if="field.required" class="required-star">*</span>
    </template>
  </v-textarea>

  <template v-else>
    <v-text-field
      :variant="variant"
      :density="density"
      :clearable="!readOnly"
      :model-value="value"
      :messages="field.help_text || []"
      :readonly="readOnly"
      :type="field.password && !showPassword ? 'password' : 'text'"
      :append-inner-icon="field.password && !readOnly ? (showPassword ? 'mdi-eye' : 'mdi-eye-off') : undefined"
      @click:append-inner="!readOnly && (showPassword = !showPassword)"
      @update:modelValue="onChange"
      @keydown.enter.prevent="keydownEnter"
    >
      <template #label>
        <span class="field-title">{{ field.label }}</span>
        <span v-if="field.required" class="required-star">*</span>
      </template>
    </v-text-field>
  </template>
</template>

<script>
import { defaultProps, validateProps } from '/src/utils/fields.js'
const requiredFields = {
  wysiwyg: {type: Boolean, required: false},
  multilined: {type: Boolean, required: false},
  tag_style: {type: String, required: false},
  password: {type: Boolean, required: false},
}
export default {
  props: {
    ...defaultProps,
  },
  emits: ["changed", "keydown.enter.prevent"],
  data() {
    return {
      value: null,
      showPassword: false,
    }
  },
  created() {
    validateProps(this, requiredFields)
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
    keydownEnter() {
      this.$emit('keydown.enter.prevent')
    },
  },
}
</script>
