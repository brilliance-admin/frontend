<template>
  <div class="field-title-section">
    <span class="field-title">{{ field.label }}</span>
    <span v-if="field.required" class="required-star">*</span>
  </div>

  <JsonEditorVue
    ref="editor"
    v-model="value"
    :class="{ 'jse-theme-dark': this.$vuetify.theme.current.dark, 'jse-readonly': readOnly }"
    :read-only="readOnly"
    :stringified="false"
  />

  <div v-if="field.help_text" class="field_help_text text-caption mt-1">
    {{ field.help_text }}
  </div>
</template>

<script>
import { defaultProps, validateProps } from '/src/utils/fields.js'
import 'vanilla-jsoneditor/themes/jse-theme-dark.css'

import JsonEditorVue from 'json-editor-vue'

export default {
  components: {
    JsonEditorVue,
  },
  props: {
    ...defaultProps,
  },
  emits: ["changed"],
  data(props) {
    return {
      value: null,
      heightObserver: null,
    }
  },
  mounted() {
    this.applyEditorHeight()
    this.initHeightObserver()
  },
  beforeUnmount() {
    this.destroyHeightObserver()
  },
  watch: {
    value(val){
      if (typeof val === 'string') {
        try {
          val = JSON.parse(val)
        } catch (e) {
          throw new Error(`JSONEditor invalid JSON for field "${this.fieldSlug}": ${e.message}`)
        }
      }
      this.$emit('changed', val)
    },
    maxHeight() {
      this.applyEditorHeight()
    },
  },
  computed: {
    maxHeight() {
      return this.field.max_height || 250
    },
  },
  methods: {
    initHeightObserver() {
      this.$nextTick(() => {
        const editorRoot = this.$refs.editor?.$el
        if (!editorRoot || typeof MutationObserver === 'undefined') return

        this.destroyHeightObserver()
        this.heightObserver = new MutationObserver(() => {
          window.requestAnimationFrame(() => {
            this.applyEditorHeight()
          })
        })
        this.heightObserver.observe(editorRoot, {
          childList: true,
          subtree: true,
        })
      })
    },
    destroyHeightObserver() {
      if (!this.heightObserver) return
      this.heightObserver.disconnect()
      this.heightObserver = null
    },
    applyEditorHeight() {
      this.$nextTick(() => {
        const editorRoot = this.$refs.editor?.$el
        if (!editorRoot) return

        const scrollContainers = [
          '.jse-contents',
          '.jse-contents-outer',
          '.jse-main',
          '.jse-text-mode',
          '.jse-tree-mode',
          '.jse-table-mode',
        ]
          .map((selector) => editorRoot.querySelector(selector))
          .filter(Boolean)

        editorRoot.style.height = ''
        if (!scrollContainers.length) {
          editorRoot.style.maxHeight = `${this.maxHeight}px`
          editorRoot.style.overflow = 'auto'
          return
        }

        for (const scrollContainer of scrollContainers) {
          scrollContainer.style.maxHeight = `${this.maxHeight}px`
          scrollContainer.style.overflow = 'auto'
        }
      })
    },
    updateFormData(initFormData) {
      this.value = initFormData[this.fieldSlug] || {}

      if (typeof this.value !== 'object') {
        this.value = JSON.parse(this.value)
      }

      this.applyEditorHeight()
    },
  },
}
</script>
