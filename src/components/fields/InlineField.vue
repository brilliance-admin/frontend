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
        v-if="readOnly && value.length === 0"
        variant="elevated"
        class="field-inline-record inline-record-empty"
      >
        {{ $t('noRecords') }}
      </v-card>

      <v-card
        v-for="(item, index) in value"
        :key="item?.id ?? index"
        variant="elevated"
        class="field-inline-record"
      >
        <div class="inline-record-layout">
          <FieldsContainer
            ref="fieldscontainer"
            :form-type="itemFormTypes[index] ?? 'edit'"
            :category-schema="categorySchema"
            :table-schema="field.inline_field_schema"
            :inline-field-slug="fieldSlug"

            :loading="loading"
            :read-only="readOnly"

            @changed="newValue => onChange(index, newValue)"
          />
          <div class="inline-record-actions">
            <v-btn
              v-if="!readOnly && canRemoveItem"
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

      <div v-if="!readOnly && canAddItem" class="inline-record-add-wrap">
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
      itemFormTypes: [],
    }
  },
  created() {
    validateProps(this, requiredFields)
    if (this.field.initial !== undefined && !Array.isArray(this.field.initial)) {
      throw new Error(`InlineField initial value must be an array for field "${this.fieldSlug}"`)
    }
    this.value = Array.isArray(this.field.initial) ? this.field.initial : []
    this.itemFormTypes = this.value.map(() => 'edit')

    if (this.isRequired && this.value.length === 0) {
      this.appendNewItem()
    }
  },
  watch: {
    error: {
      handler() {
        this.$nextTick(() => {
          this.applyInlineErrors()
        })
      },
      deep: true,
    },
  },
  computed: {
    isMany() {
      return !!this.field.many
    },
    isRequired() {
      return !!this.field.required
    },
    canAddItem() {
      return this.isMany || this.value.length === 0
    },
    canRemoveItem() {
      if (!this.isMany) return false
      if (this.isRequired && this.value.length <= 1) return false
      return true
    },
  },
  methods: {
    applyInlineErrors() {
      const fieldscontainers = this.$refs.fieldscontainer || []
      const lineErrors = Array.isArray(this.error?.message) ? this.error.message : []

      fieldscontainers.forEach((fieldscontainer, index) => {
        fieldscontainer.updateErrors(lineErrors[index] || {})
      })
    },
    appendNewItem(formType = 'create') {
      this.value = [...this.value, {}]
      this.itemFormTypes = [...this.itemFormTypes, formType]
    },
    updateFormData(initFormData) {
      if (!Array.isArray(initFormData[this.fieldSlug])) {
        throw new Error(`InlineField form data must be an array for field "${this.fieldSlug}"`)
      }
      this.value = initFormData[this.fieldSlug]
      this.itemFormTypes = this.value.map(() => 'edit')

      if (this.isRequired && this.value.length === 0) {
        this.appendNewItem()
      }

      this.$nextTick(() => {
        const fieldscontainers = this.$refs.fieldscontainer || []
        fieldscontainers.forEach((fieldscontainer, index) => {
          fieldscontainer.updateFormData(this.value[index] || {})
        })
        this.applyInlineErrors()
      })
    },
    onChange(index, newValue) {
      const nextValue = this.value.slice()
      nextValue[index] = newValue === undefined ? {} : newValue
      this.value = nextValue
      this.$emit('changed', this.value)
    },
    removeItem(index) {
      if (!this.canRemoveItem) {
        throw new Error(`InlineField remove is forbidden for field "${this.fieldSlug}"`)
      }
      const nextValue = this.value.slice()
      const nextItemFormTypes = this.itemFormTypes.slice()
      nextValue.splice(index, 1)
      nextItemFormTypes.splice(index, 1)
      this.value = nextValue
      this.itemFormTypes = nextItemFormTypes
      this.$emit('changed', this.value)
    },
    addItem() {
      if (!this.canAddItem) {
        throw new Error(`InlineField add is forbidden for field "${this.fieldSlug}"`)
      }
      this.appendNewItem()
      this.$emit('changed', this.value)
      this.$nextTick(() => {
        this.applyInlineErrors()
      })
    },
  },
}
</script>
