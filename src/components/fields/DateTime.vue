<template>

  <v-dialog width="auto" :disabled="readOnly">
    <template v-slot:activator="{ props: activatorProps }">
      <v-text-field
        v-bind="activatorProps"
        :density="density"
        :variant="variant"
        :label="field.label"
        :model-value="displayValue"
        :messages="field.help_text || []"
        :readonly="readOnly"
        :loading="loading"
        :clearable="!readOnly"

        @update:modelValue="updateDisplayValue"
      >
        <template #label>
          <span>{{ field.label }}</span>
          <span v-if="field.required" class="required-star">*</span>
        </template>

        <template v-slot:append-inner v-if="!readOnly">
          <v-icon :icon="icon" v-for="icon in getIcons()"/>
        </template>
      </v-text-field>
    </template>

    <template v-slot:default="{ isActive }">
      <v-card>
        <v-text-field
          :model-value="displayValue"
          :readonly="readOnly"
          @update:modelValue="updateDisplayValue"
          @keydown.enter.prevent="isActive.value = false"
        />
        <Datepicker
          v-model="value"
          inline
          auto-apply
          time-picker-inline
          :format="formatDisplayValue"
          :dark="this.$vuetify.theme.current.dark"

          :range="isRange()"
          :enable-time-picker="isEnableTimePicker()"
          :time-picker="isTimePicker()"

          @update:model-value="updateDateTime"
        />
      </v-card>
    </template>
  </v-dialog>

</template>

<script>
import { defaultProps, validateProps } from '/src/utils/fields.js'
import moment from 'moment'
import Datepicker from '@vuepic/vue-datepicker';

const requiredFields = {}

export default {
  components: {
    Datepicker,
  },
  props: {
    ...defaultProps,
  },
  emits: ["changed"],
  data(props) {
    return {
      value: null,
      date: null,
      displayValue: '',
    }
  },
  created() {
    validateProps(this, requiredFields)
    this.value = this.field.initial
  },
  methods: {
    updateFormData(initFormData) {
      const value = initFormData[this.fieldSlug]
      if (value) {
        if (this.isRange()) {
          this.value = [new Date(moment(value.from)), new Date(moment(value.to))]
        } else {
          this.value = new Date(moment(value))
        }
        this.displayValue = this.getFormattedValue()
      }
    },
    getFormattedValue() {
      if (!this.value) return ''
      if (this.isRange()) {
        const _from = moment(this.value[0]).format(this.getFormat())
        const to = moment(this.value[1]).format(this.getFormat())
        return `${_from} - ${to}`
      }
      return moment(this.value).format(this.getFormat())
    },
    getFormat() {
      if (this.isEnableTimePicker()) return 'YYYY-MM-DD HH:mm'
      if (this.isDate()) return 'YYYY-MM-DD'
      if (this.isTimePicker()) return 'HH:mm'
      console.error('DateTime bad type:', this.field.type)
    },
    getIcons() {
      if (this.isEnableTimePicker()) {
        if (this.isRange()) {
          return ['mdi-calendar-expand-horizontal-outline', 'mdi-clock-time-eight-outline']
        }
        return ['mdi-calendar-range', 'mdi-clock-time-eight-outline']
      }
      if (this.isTimePicker()) return ['mdi-clock-time-eight-outline']
      if (this.isDate()) return ['mdi-calendar-range']
      console.error('DateTime bad type:', this.field.type)
    },
    updateDateTime(date) {
      this.displayValue = this.getFormattedValue()
      this.$emit('changed', this.serializeValue(date))
    },
    updateDisplayValue(value) {
      this.displayValue = value
      if (!value) {
        this.value = value
        this.$emit('changed', this.serializeValue(this.value))
        return
      }

      if (this.isRange()) {
        const values = value.split(' - ')
        this.value = [new Date(moment(values[0])), new Date(moment(values[1]))]
        this.$emit('changed', this.serializeValue(this.value))
        return
      }
      this.value = new Date(moment(value))
      this.$emit('changed', this.serializeValue(this.value))
    },
    formatDisplayValue(date) {
      if (!date) return ''

      if (this.isRange()) {
        const _from = moment(date[0]).format(this.getFormat())
        const to = moment(date[1]).format(this.getFormat())
        return `${_from} - ${to}`
      }
      return moment(date).format(this.getFormat())
    },
    serializeValue(date) {
      if (!date) return

      if (this.isRange()) {
        return {
          'from': moment(date[0]).format('yyyy-MM-DDTHH:mm:ss'),
          'to': moment(date[1]).format('yyyy-MM-DDTHH:mm:ss'),
        }
      }
      return moment(date).format('yyyy-MM-DDTHH:mm:ss')
    },
    isRange() {
      return this.field.range
    },
    isDate() {
      return this.field.include_date
    },
    isEnableTimePicker() {
      return this.field.include_date && this.field.include_time
    },
    isTimePicker() {
      return this.field.include_time && !this.field.include_date
    },
  },
}
</script>
