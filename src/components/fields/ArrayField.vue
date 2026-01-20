<template>
  <div class="array-fields">

    <span v-html="`<!-- Array type: ${field.array_type} -->`"></span>

    <div
      v-for="(item, index) in value"
      :key="index"
      class="array-field-line d-flex align-center mb-2"
    >
      <v-text-field
        class="array-field-text-field flex-grow-1"
        :model-value="item"
        :disabled="readOnly"
        :variant="variant"
        :density="density"
        hide-details
        @update:model-value="v => updateItem(index, v)"
      />
      <v-btn
        v-if="!readOnly"
        icon="mdi-close"
        variant="text"
        class="array-field-line-remove"
        @click="remove(index)"
      />
    </div>

    <v-btn
      v-if="!readOnly"
      size="small"
      variant="tonal"
      color="primary"
      @click="add"
    >
      Добавить
    </v-btn>

    <div v-if="field.help_text" class="text-caption mt-1">
      {{ field.help_text }}
    </div>
  </div>
</template>

<script>
import { defaultProps, validateProps } from '/src/utils/fields.js'

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
    validateProps(this)
    const def = this.field.default
    this.value = Array.isArray(def) && def.length ? this.normalizeIn(def) : ['']
  },
  methods: {
    normalizeIn(arr) {
      if (this.field.array_type === 'json' || this.field.array_type === 'jsonb') {
        return arr.map(v => typeof v === 'string' ? v : JSON.stringify(v))
      }
      return arr.map(v => String(v))
    },
    normalizeOut(arr) {
      if (this.field.array_type === 'json' || this.field.array_type === 'jsonb') {
        return arr.map(v => JSON.parse(v))
      }
      return arr
    },
    updateFormData(initFormData) {
      const v = initFormData[this.fieldSlug]
      this.value = (Array.isArray(v) && v.length) ? this.normalizeIn(v) : ['']
    },
    add() {
      this.value.push('')
      this.emit()
    },
    remove(index) {
      this.value.splice(index, 1)
      this.emit()
    },
    updateItem(index, newValue) {
      this.value[index] = String(newValue)
      this.emit()
    },
    emit() {
      const cleaned = this.value.map(v => v.trim()).filter(Boolean)
      this.$emit('changed', this.normalizeOut(cleaned))
    },
  },
}
</script>
