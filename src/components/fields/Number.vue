<template>
  <div v-if="isRange" class="number-range-filter d-flex">
    <v-number-input
      v-for="bound in ['from', 'to']"
      :key="bound"
      class="number-filter"
      :label="$t(bound === 'from' ? 'from' : 'to')"
      :density="density"
      :variant="variant"
      :clearable="!readOnly"
      :model-value="value?.[bound] ?? null"
      :readonly="readOnly"
      :loading="loading"
      :min="field.min_value"
      :max="field.max_value"
      :step="step"
      @update:modelValue="onRangeChange(bound, $event)"
    />
  </div>
  <v-number-input v-else
    :class="{ 'number-filter': isFilter }"
    :density="density"
    :variant="variant"
    :clearable="!readOnly"
    :model-value="value"
    :messages="getMessages()"
    :readonly="readOnly"
    :loading="loading"

    :max="field.max_value"
    :min="field.min_value"
    :step="step"

    :reverse="false"
    :hideInput="false"
    :inset="false"

    @update:modelValue="onChange"
  >
    <template v-if="!isFilter" #label>
      <span class="field-title">{{ field.label }}</span>
      <span v-if="field.required" class="required-star">*</span>
    </template>

    <template v-if="readOnly" #increment></template>
    <template v-if="readOnly" #decrement></template>
  </v-number-input>

</template>

<script>
import { VNumberInput } from 'vuetify/components'
import { defaultProps, validateProps } from '/src/utils/fields.js'

const requiredFields = {
  max_value: {type: Number, required: false},
  min_value: {type: Number, required: false},
  scale: {type: Number, required: false},
}

export default {
  components: {
    VNumberInput,
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
  created() {
    validateProps(this, requiredFields)
    if (!this.isFilter) {
      this.value = this.field.default
    }
  },
  computed: {
    isRange() {
      return this.isFilter && this.field.range
    },
    step() {
      if (typeof this.field.scale !== 'number' || this.field.scale <= 0) {
        return 1
      }

      return 1 / (10 ** this.field.scale)
    },
  },
  methods: {
    updateFormData(initFormData) {
      this.value = initFormData[this.fieldSlug]
    },
    getMessages() {
      if (this.isFilter) return []
      return this.field.help_text || []
    },
    onRangeChange(bound, newValue) {
      this.value = {...(this.value || {}), [bound]: newValue ?? null}
      this.$emit('changed', this.value)
    },
    onChange(newValue) {
      this.value = newValue === undefined ? null : newValue
      this.$emit('changed', this.value)
    },
  },
}
</script>
