<template>
  <div class="field-title-section">
    <span class="field-title">{{ field.label }}</span>
    <span v-if="field.required" class="required-star">*</span>
  </div>

  <ckeditor
    :editor="editor"
    v-model="value"
    :config="editorConfig"
    :disabled="readOnly"
    @input="onChange"
  />

  <div v-if="field.help_text" class="field_help_text text-caption mt-1">
    {{ field.help_text }}
  </div>
</template>

<script>
import { defaultProps, validateProps } from '/src/utils/fields.js'
import CKEditor from '@ckeditor/ckeditor5-vue'

import { ClassicEditor, Bold, Essentials, Italic, Mention, Paragraph, Undo } from 'ckeditor5'

import 'ckeditor5/ckeditor5.css';

export default {
  components: {
    ckeditor: CKEditor.component
  },
  props: {
    ...defaultProps,
  },
  emits: ["changed"],
  data(props) {
    return {
      value: null,
      editor: ClassicEditor,
      editorConfig: {
        plugins: [ Bold, Essentials, Italic, Mention, Paragraph, Undo ],
        toolbar: [ 'undo', 'redo', '|', 'bold', 'italic' ],
      },
    }
  },
  created() {
    validateProps(this)
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
  },
}
</script>
