<template>

  <v-select
    :density="density"
    :variant="variant"
    :clearable="!readOnly"
    :model-value="value"
    :messages="field.help_text || []"
    :readonly="readOnly"
    :loading="loading"

    :items="field.choices"
    item-title="title"
    item-value="value"
    :return-object="false"

    @update:modelValue="onChange"
  >
    <template #selection="{ item }">
      <template v-if="getChoiceChipColor(item?.raw?.value ?? item?.value)">
        <v-chip
          class="choice-chip"
          size="default"
          variant="flat"
          :color="getChoiceChipColor(item?.raw?.value ?? item?.value)"
        >
          {{ item.raw?.title ?? item.title }}
        </v-chip>
      </template>
      <template v-else>
        <span>{{ item.raw?.title ?? item.title }}</span>
      </template>
    </template>

    <template #item="{ props, item }">
      <v-list-item v-bind="props">
        <template #title>
          <template v-if="getChoiceChipColor(item?.raw?.value)">
            <v-chip
              class="choice-chip choice-chip--item"
              size="default"
              variant="flat"
              :color="getChoiceChipColor(item?.raw?.value)"
            >
              {{ item.raw?.title ?? item.title }}
            </v-chip>
          </template>
          <template v-else>
            <span>{{ item.raw?.title ?? item.title }}</span>
          </template>
        </template>
      </v-list-item>
    </template>

    <template #label>
      <span class="field-title">{{ field.label }}</span>
      <span v-if="field.required" class="required-star">*</span>
    </template>
  </v-select>

</template>

<script>
import { defaultProps, validateProps } from '/src/utils/fields.js'

const requiredFields = {
  choices: {type: Array, required: false},
  tag_style: {type: String, required: false},
}

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
    validateProps(this, requiredFields)
    if (this.field.initial) {
      this.value = this.field.initial
    }
  },
  methods: {
    getChoiceChipColor(value) {
      const choice = this.field.choices?.find(c => c.value === value)
      return choice?.tag_color
    },
    updateFormData(initFormData) {
      const value = initFormData[this.fieldSlug]
      this.value = value
    },
    onChange(newValue) {
      this.value = newValue
      this.$emit('changed', this.value)
    },
  },
}
</script>
