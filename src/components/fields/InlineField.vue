<template>
  <div>
    <v-card class="field-inline-card">

      <v-card-title>
        <span>{{ field.label }}</span>
      </v-card-title>

      <v-card-subtitle v-if="field.help_text">
        {{ field.help_text }}
      </v-card-subtitle>

      <v-card
        v-for="(item, index) in value"
        :key="item?.id ?? index"
        variant="elevated"
        class="field-inline-record"
      >
        <div class="inline-record-layout">
          <FieldsContainer
            ref="fieldscontainer"
            form-type="edit"
            :category-schema="categorySchema"
            :table-schema="field.inline_field_schema"

            :loading="loading"
            :read-only="readOnly"

            @changed="newValue => onChange(index, newValue)"
          />
          <div class="inline-record-actions">
            <v-btn
              v-if="!readOnly"
              class="inline-record-remove"
              icon="mdi-close"
              size="small"
              variant="flat"
              color="secondary"
              @click="removeItem(index)"
            />
          </div>
        </div>
      </v-card>

      <div v-if="!readOnly" class="inline-record-add-wrap">
        <v-btn
          class="inline-record-add"
          icon="mdi-plus"
          size="small"
          variant="flat"
          color="secondary"
          @click="addItem"
        />
      </div>

    </v-card>
  </div>

</template>

<script>
import { defineAsyncComponent } from 'vue'
import { defaultProps, validateProps } from '/src/utils/fields.js'

const requiredFields = {
  inline_field_schema: {type: Object, required: true},
}

const FieldsContainer = defineAsyncComponent(() => import('/src/components/table/FieldsContainer.vue'))

export default {
  props: {
    ...defaultProps,
    error: {type: [String, Object, Array], required: false},
  },
  components: {
    FieldsContainer,
  },
  emits: ["changed"],
  data(props) {
    return {
      value: [],
    }
  },
  created() {
    validateProps(this, requiredFields)
    this.value = this.field.initial || []
  },
  methods: {
    updateFormData(initFormData) {
      this.value = initFormData[this.fieldSlug] || []

      this.$nextTick(() => {
        const fieldscontainers = this.$refs.fieldscontainer || []
        fieldscontainers.forEach((fieldscontainer, index) => {
          fieldscontainer.updateFormData(this.value[index] || {})
        })
      })
    },
    onChange(index, newValue) {
      const nextValue = this.value.slice()
      nextValue[index] = newValue === undefined ? {} : newValue
      this.value = nextValue
      this.$emit('changed', this.value)
    },
    removeItem(index) {
      const nextValue = this.value.slice()
      nextValue.splice(index, 1)
      this.value = nextValue
      this.$emit('changed', this.value)
    },
    addItem() {
      this.value = [...this.value, {}]
      this.$emit('changed', this.value)
    },
  },
}
</script>
