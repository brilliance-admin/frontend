<template>
  <div>
    <JsonForms
      :data="data"
      :renderers="renderers"
      :schema="field.json_forms.schema"
      :uischema="field.json_forms.uischema"
      :readonly="readOnly"

      @change="onChange"
    />

    <v-expansion-panels class="jsonforms-source-json">
      <v-expansion-panel>
        <v-expansion-panel-title><v-icon icon="mdi-cog-outline" size="x-small"/> <p>Source JSON</p></v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-label>{{ data }}</v-label>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <div v-if="field.help_text" class="field-help-text text-caption mt-1">
      {{ field.help_text }}
    </div>
  </div>
</template>

<script>
import { defaultProps, validateProps } from '/src/utils/fields.js'

//import { vuetifyRenderers } from '@jsonforms/vue-vuetify';
import { vanillaRenderers } from '@jsonforms/vue-vanilla';

const renderers = [
  //...vuetifyRenderers,
  ...vanillaRenderers,
];

const requiredFields = {
  json_forms: {type: Object, required: true},
}

export default {
  props: {
    ...defaultProps,
  },
  emits: ["changed"],
  data(props) {
    return {
      renderers: Object.freeze(renderers),
      data: {},
    }
  },
  created() {
    validateProps(this, requiredFields)
  },
  methods: {
    updateFormData(formData) {
      this.data = formData[this.fieldSlug] || {}
    },
    onChange(event) {
      this.data = event.data;
      if (event.errors.length > 0) {
        console.error('JSONForms', event.errors)
        let errorMessage = []
        for (const error of event.errors) {
          errorMessage.push(`<b>${error.instancePath}</b> ${error.message}`)
        }
        console.error(
          `${this.viewname}.${this.fieldSlug} json forms errors: ${errorMessage.join('; ')}`
        )
      }
      this.$emit('changed', this.data)
    },
  },
}
</script>
