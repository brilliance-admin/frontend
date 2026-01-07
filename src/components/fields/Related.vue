<template>

  <template v-if="!isDualList()">
    <v-autocomplete
      :density="density"
      :variant="variant"
      :clearable="true"
      v-model="value"
      :label="field.label"
      :messages="field.help_text || []"
      :disabled="isReadOnly()"
      :placeholder="$t('inputStringForSearch')"

      :items="choices"
      :multiple="isMany()"
      :loading="loading || apiLoading"
      chips
      closable-chips
      persistent-hint
      no-filter
      hide-selected

      :return-object="true"
      item-value="key"
      item-title="title"

      :append-inner-icon="isMany() ? 'mdi-relation-many-to-many' : 'mdi-relation-many-to-one'"

      :search="search"
      @update:search="updateSearch"
      @update:modelValue="onChange"
    >
      <template v-slot:chip="{ props, item }">
        <v-chip
          class="autocomplete-chip"
          v-bind="props"
          :text="item.raw.title"
        ></v-chip>
      </template>

      <template v-slot:item="{ props, item }">
        <v-list-item
          v-bind="props"
          :title="item.raw.title"
        ></v-list-item>
      </template>
    </v-autocomplete>
  </template>

  <template v-else>
    <v-card
      variant="elevated"
      class="dial-list-card"
      :loading="loading || apiLoading"
    >

      <v-card-text>
        <v-row>
          <v-col cols="6 dial-list-col">
            <v-text-field
              v-model="search"
              :label="$t('inputStringForSearch')"
              @update:modelValue="updateSearch"
              density="compact"
              :disabled="isReadOnly()"
            />

            <v-card
              style="height: 320px;"
            >
              <v-list
                style="height: 100%; overflow-y: auto;"
                density="compact"
                :disabled="apiLoading || loading"
                class="dial-list-list-card"
              >
                <v-list-item
                  v-for="item in leftChoices"
                  :key="item.key"
                  :title="item.title"
                  @click="addItem(item)"
                  :disabled="isReadOnly()"
                />
              </v-list>
            </v-card>
          </v-col>

          <v-col cols="6 dial-list-col">
            <div
              class="dial-list-selected-text text-caption"
            >
              <template v-if="!isReadOnly()">
                {{ $t('selected') }}
              </template>
            </div>

            <v-card
              style="height: 320px;"
            >
              <v-list
                style="height: 100%; overflow-y: auto;"
                density="compact"
                :disabled="apiLoading || loading"
                class="dial-list-list-card"
              >
                <v-list-item
                  v-for="item in rightChoices"
                  :key="item.key"
                  :title="item.title"
                  @click="removeItem(item)"
                  :disabled="isReadOnly()"
                />
              </v-list>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </template>

</template>

<script>
import { defaultProps, validateProps } from '/src/utils/fields.js'
import { getTableAutocomplete } from '/src/api/autocomplete'

export default {
  props: {
    ...defaultProps,
  },
  emits: ["changed"],
  data(props) {
    return {
      value: null,
      formData: null,
      apiLoading: false,
      choices: [],
      search: '',
      init: false,
    }
  },
  created() {
    validateProps(this)
    this.value = this.field.initial

    if (!this.readOnly) {
      this.updateChoices()
    }
  },
  computed: {
    rightChoices() {
      return this.value || []
    },
    leftChoices() {
      const selectedKeys = new Set((this.value || []).map(i => i.key))
      return this.choices.filter(i => !selectedKeys.has(i.key))
    },
  },
  methods: {
    isReadOnly() {
      return this.readOnly
    },
    updateFormData(initFormData) {
      this.formData = initFormData
      this.value = initFormData[this.fieldSlug]

      // Update choices to get display text
      if (!this.init) {
        this.init = true
        this.updateChoices()
      }
    },
    updateSearch(search) {
      this.search = search
      this.updateChoices()
    },
    updateChoices() {
      if (this.isReadOnly()) return

      this.apiLoading = true

      var existedChoices = []
      if (this.value) {
        if (this.isMany()) {
          existedChoices = this.value
        }
        else {
          existedChoices = [this.value]
        }
      }

      getTableAutocomplete({
        group: this.categorySchema.group,
        category: this.categorySchema.category,

        search_string: this.search || '',
        limit: 30,
        field_slug: this.fieldSlug,
        is_filter: this.isFilter,
        form_data: this.formData || {},
        existed_choices: existedChoices,
        action_name: this.actionName,
      }).then(response => {
        this.choices = response.data.results
        this.apiLoading = false
      }).catch(error => {
        this.apiLoading = false

        const errorResult = this.$handleError(error)
        if (errorResult.fieldErrors) {
          this.$refs.fieldscontainer.updateErrors(errorResult.fieldErrors)
        }
        if (errorResult.persistentMessage) {
          this.persistentMessageDialog = true
          this.persistentMessage = errorResult.persistentMessage
        }
      })
    },
    onChange(newValue) {
      this.value = newValue
      this.$emit('changed', this.value)
    },
    isMany() {
      return this.field.many
    },
    isDualList() {
      return this.field.dual_list && this.isMany() && !this.isFilter
    },
    addItem(item) {
      if (this.isReadOnly()) return

      if (!this.value) {
        this.value = []
      }
      this.value.push(item)
      this.onChange(this.value)
    },
    removeItem(item) {
      if (this.isReadOnly()) return

      this.value = this.value.filter(i => i.key !== item.key)
      this.onChange(this.value)
    },
  },
}
</script>
