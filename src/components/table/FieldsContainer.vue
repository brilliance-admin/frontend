<template>
  <v-container fluid class="fields-container">

    <v-tabs
      :class="{ 'hide-element': getGroups().length <= 1, 'container-tabs': true }"
      next-icon="mdi-arrow-right-bold-box-outline"
      prev-icon="mdi-arrow-left-bold-box-outline"
      show-arrows
      v-model="tab"
    >
      <v-tab
        v-for="(groupInfo, tab_id) in getGroups()"
        :key="groupInfo.title"
        :text="groupInfo.title"
        slim
        :class="{'tab-error': isTabError(groupInfo)}"
      ></v-tab>
    </v-tabs>

    <template v-if="field_errors">
      <template v-for="error in field_errors['non_field_errors']" v-bind:key="error">
        <v-alert
          :text="error"
          type="error"
        ></v-alert>
      </template>
    </template>

    <v-tabs-window v-model="tab">
      <v-tabs-window-item
        v-for="(groupInfo, tab_id) in getGroups()"
        :key="groupInfo.title"
        :text="groupInfo.title"
        :eager="true"
      >
        <div v-for="(field, field_slug) in tableSchema.fields" v-bind:key="field_slug">

          <v-row class="field-cell">
            <div class="label-col">
              <v-list-subheader>
                <p class="form-title">{{ field.label }}</p> <p v-if="field.required" class="required-title">*</p>
              </v-list-subheader>
            </div>

            <div
              class="form-field-container"
              :class="{ 'is-required': field.required }"
            >

              <!-- Translations -->
              <template v-if="Object.keys(translations).indexOf(field_slug) !== -1">
                <v-tabs
                  v-model="translationsTabs[field_slug]"
                  bg-color="rgb(var(--v-theme-light2))"
                >
                  <v-tab
                    v-for="translation in translations[field_slug]"
                    :key="translation.lang_slug"
                    :text="translation.lang_translation"
                    :value="translation.lang_slug"
                  ></v-tab>
                </v-tabs>

                <v-tabs-window v-model="translationsTabs[field_slug]">
                  <v-tabs-window-item
                    v-for="translation in translations[field_slug]"
                    :key="translation.lang_slug"
                    :value="translation.lang_slug"
                    transition="fade"
                    reverse-transition="fade"
                    :eager="true"
                  >
                    <v-card flat>
                      <component
                        v-if="getFieldComponent(field, translation.slug)"
                        :is="getFieldComponent(field, translation.slug)"

                        :category-schema="categorySchema"

                        density="comfortable"
                        variant="filled"
                        :ref="getRefString(translation.slug)"
                        :field="field"
                        :field-slug="translation.slug"
                        :loading="loading"
                        :action-name="actionName"
                        :read-only="readOnly || field.read_only"

                        @changed="value => _updateValue(value, translation.slug)"
                      />
                      <template v-else>
                        {{ field }}
                      </template>
                    </v-card>
                  </v-tabs-window-item>
                </v-tabs-window>
              </template>

              <template v-else>
                <component
                  v-if="getFieldComponent(field, field_slug)"
                  :is="getFieldComponent(field, field_slug)"

                  :category-schema="categorySchema"

                  density="comfortable"
                  variant="filled"
                  :ref="getRefString(field_slug)"
                  :field="field"
                  :field-slug="field_slug"
                  :loading="loading"
                  :action-name="actionName"
                  :read-only="readOnly || field.read_only"

                  :relation-name-filter="relationNameFilter"
                  :filter-id="filterId"

                  :error="getError(field_slug)"

                  @changed="value => _updateValue(value, field_slug)"
                />
                <template v-else>
                  {{ field }}
                </template>
              </template>

              <template v-if="getError(field_slug)">
                <p class="form-error">
                  {{ formatError(getError(field_slug)) }}
                </p>
              </template>

            </div>
          </v-row>

        </div>
      </v-tabs-window-item>
    </v-tabs-window>

  </v-container>
</template>

<script>
import { CategorySchema } from '/src/api/schema'
import { getCustomField } from '/src/components/custom-fields/index.js'
// Contains a list of tabs and a list of fields

import BooleanField from '/src/components/fields/Boolean.vue'
import StringField from '/src/components/fields/String.vue'
import NumberField from '/src/components/fields/Number.vue'
import ChoiceField from '/src/components/fields/Choice.vue'
import FileField from '/src/components/fields/File.vue'
import JSONFormsField from '/src/components/fields/JSONForms.vue'
import JSONEditorField from '/src/components/fields/JSONEditor.vue'
import RelatedField from '/src/components/fields/Related.vue'
import DateTimeField from '/src/components/fields/DateTime.vue'
import ArrayField from '/src/components/fields/ArrayField.vue'

import TinyMCEField from '/src/components/fields/TinyMCE/index.vue'
import CKEditor from '/src/components/fields/CKEditor.vue'

const wysiwyg = TinyMCEField;

export default {
  props: {
    categorySchema: {type: CategorySchema, required: true},
    tableSchema: {type: Object, required: true},
    loading: {type: Boolean, required: false},
    readOnly: {type: Boolean, required: false},
    formType: {
      type: String,
      required: true,
      validator: function (value) {
          return ['create', 'edit'].indexOf(value) !== -1
      }
    },
  },
  emits: ["changed"],
  data() {
    return {
      tab: null,
      field_errors: {},
      formData: {},
      translationsTabs: {},
      fieldGroups: null,
      translations: {},
    }
  },
  created() {
  },
  methods: {
    getFieldComponent(field, field_slug) {
      const custom_field = getCustomField(this.viewname, field_slug)
      if (custom_field) return custom_field

      if (['boolean'].indexOf(field.type) !== -1) return BooleanField
      if (['integer'].indexOf(field.type) !== -1) {
        if (field.choices) return ChoiceField
        return NumberField
      }
      if (['field', 'string', 'email', 'url', 'slug'].indexOf(field.type) !== -1) {
        if (field.tinymce) return TinyMCEField
        if (field.ckeditor) return CKEditor
        if (field.choices) return ChoiceField
        return StringField
      }

      if (['list', 'choice'].indexOf(field.type) !== -1) return ChoiceField

      if (['image', 'file'].indexOf(field.type) !== -1) return FileField
      if (['datetime', 'date', 'time'].indexOf(field.type) !== -1) return DateTimeField
      if (['related'].indexOf(field.type) !== -1) return RelatedField
      if (['array'].indexOf(field.type) !== -1) return ArrayField

      if (field.type === 'json') {
        if (field.json_forms) return JSONFormsField
        return JSONEditorField
      }

      return
    },
    getGroups() {
      if (this.fieldGroups) return this.fieldGroups
      return [{"title": ""}]
    },
    isTranslation(field_slug) {
      for (const [slug, translations] of Object.entries(this.translations)) {
        for (var i = 0; i < translations.length; i++) {
          if (translations[i].slug === field_slug) return true
        }
      }
      return false
    },
    getRefString(slug) {
      return `field_${slug}`
    },
    updateErrors(field_errors) {
      this.field_errors = field_errors
    },
    updateFormData(newData) {
      // Update form date from outside
      this.formData = newData

      for (const [field_slug, value] of Object.entries(this.tableSchema.fields)) {
        const ref = this.getRefString(field_slug)
        const field = this.$refs[ref]

        if (field === undefined) continue

        field[0].updateFormData(this.formData)
      }
    },
    _updateValue(value, field_slug) {
      if (this.formData[field_slug] === value) return

      this.formData[field_slug] = value

      for (const slug of Object.keys(this.tableSchema.fields)) {
        const target_field = this.$refs[this.getRefString(slug)]
        if (!target_field) continue

        // Update all other fields
        if (field_slug !== slug) {
          const field = target_field[0]

          if (!field) {
            // Не понимаю почему поля иногда нет, но работает
            return
          }

          field.updateFormData(this.formData)
        }
      }
      this.$emit('changed', this.formData)
    },
    isTabError(groupInfo) {
      if (!groupInfo.fields) return false

      for (const error_field of Object.keys(this.field_errors)) {
        if (groupInfo.fields.indexOf(error_field) !== -1) {
          return true
        }
      }
      return false
    },
    formatError(error) {
      if (error.code) {
        return this.$t(error.code)
      }
      return error.message
    },
    getError(field_slug) {
      if (this.field_errors) {
        return this.field_errors[field_slug]
      }
    },
  },
}
</script>
