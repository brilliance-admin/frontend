<template>

  <v-select
    v-if="!field.btn_toggle"
    :density="density"
    :variant="variant"
    :clearable="!readOnly"
    :model-value="value"
    :messages="getMessages()"
    :readonly="readOnly"
    :menu-icon="readOnly ? null : undefined"
    :loading="loading"

    :items="field.choices"
    item-title="title"
    item-value="value"
    :return-object="true"

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
        <span class="choice-selection-text">{{ item.raw?.title ?? item.title }}</span>
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

    <template v-if="!isFilter" #label>
      <span class="field-title">{{ field.label }}</span>
      <span v-if="field.required" class="required-star">*</span>
    </template>
  </v-select>

  <div v-else>
    <div v-if="!isFilter" class="field-title-section">
      <span class="field-title">{{ field.label }}</span>
      <span v-if="field.required" class="required-star">*</span>
    </div>
    <v-input
      :messages="getMessages()"
      :readonly="readOnly"
      :disabled="loading"
    >
      <template #default>
        <v-btn-toggle
          class="choice-btn-toggle"
          :model-value="toggleValue"
          :density="density"
          :disabled="readOnly || loading"
          variant="outlined"
          mandatory
          divided
          @update:modelValue="onChange"
        >
          <v-btn
            v-for="(choice, index) in field.choices"
            :key="index"
            :value="choice"
            :color="choice.tag_color"
            :text="choice.title.length > 15 ? `${choice.title.slice(0, 15)}…` : choice.title"
            :title="choice.title"
            variant="outlined"
          />
        </v-btn-toggle>
      </template>
    </v-input>
  </div>

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
    if (!this.isFilter) {
      this.value = this.field.default
    }
  },
  computed: {
    toggleValue() {
      const selected = this.value !== null && typeof this.value === 'object'
        ? this.value.value
        : this.value
      return this.field.choices?.find(choice => choice.value === selected) ?? null
    },
  },
  methods: {
    getChoiceChipColor(value) {
      const choice = this.field.choices?.find(c => c.value === value)
      return choice?.tag_color
    },
    getMessages() {
      if (this.isFilter) return []
      return this.field.help_text || []
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


