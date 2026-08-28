<template>

  <template v-if="!isDualList()">
    <v-autocomplete
      :density="density"
      :variant="variant"
      :clearable="!isReadOnly()"
      v-model="value"
      :label="field.label"
      :messages="getMessages()"
      :readonly="isReadOnly()"
      :placeholder="$t('inputStringForSearch')"

      :items="choices"
      :multiple="isMany()"
      :loading="loading || apiLoading"
      chips
      :closable-chips="!isReadOnly()"
      persistent-hint
      no-filter
      hide-selected

      :return-object="true"
      item-value="key"
      item-title="title"

      :append-inner-icon="isMany() ? 'mdi-relation-many-to-many' : 'mdi-relation-many-to-one'"

      :search="search"
      @update:search="updateSearch"
      @update:menu="onMenuUpdate"
      @update:modelValue="onChange"
    >
      <template #label>
        <span class="field-title">{{ field.label }}</span>
        <span v-if="field.required" class="required-star">*</span>
      </template>

      <template v-slot:chip="{ item }">
        <v-chip
          :class="relatedChipClass(item.raw)"
          :href="relatedDetailUrl(item.raw)"
          :link="hasRelatedDetail(item.raw)"
          :closable="!isReadOnly()"
          @mousedown.stop
          @click.stop="openRelatedDetail($event, item.raw)"
          @click:close="removeChip(item.raw)"
          :text="item.raw.title"
        ></v-chip>
      </template>

      <template v-slot:item="{ props, item }">
        <v-list-item
          v-bind="props"
          :title="item.raw.title"
        ></v-list-item>
      </template>

      <template #append>
        <FormCreate
          v-if="canCreateRelated"
          :title="relatedCategorySchema.title"
          :admin-schema="adminSchema"
          :category-schema="relatedCategorySchema"
          @created="addCreatedRelated"
        >
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              icon="mdi-plus"
              size="small"
              variant="flat"
              color="secondary"
            />
          </template>
        </FormCreate>
      </template>
    </v-autocomplete>
  </template>

  <template v-else>
    <div class="field-title-section">
      <span class="field-title">{{ field.label }}</span>
      <span v-if="field.required" class="required-star">*</span>
    </div>

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
              @focus="refreshChoicesIfFormDataUpdated"
              density="compact"
                :readonly="isReadOnly()"
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
    <div class="field-help-text text-caption mt-1">
      {{ $t('relatedCounter', { shown: shownChoicesCount, total: totalChoicesCount }) }}
    </div>
    <div v-if="!isFilter && field.help_text" class="field-help-text text-caption mt-1">
      {{ field.help_text }}
    </div>
  </template>

</template>

<script>
import { defaultProps, validateProps } from '/src/utils/fields.js'
import { getTableAutocomplete } from '/src/api/autocomplete'
import { detailUrl } from '/src/api/schema'
import FormCreate from '/src/components/table/FormCreate.vue'

export default {
  props: {
    ...defaultProps,
    formType: {type: String, required: false},
  },
  components: {
    FormCreate,
  },
  emits: ["changed"],
  data(props) {
    return {
      value: null,
      formData: null,
      apiLoading: false,
      choices: [],
      totalChoicesCount: 0,
      search: '',
      init: false,
      formDataUpdated: false,
    }
  },
  created() {
    validateProps(this)
    this.value = this.field.default

    if (!this.readOnly && this.formType !== 'edit') {
      this.updateChoices()
    }
  },
  computed: {
    relatedCategorySchema() {
      if (!this.adminSchema) return
      if (!this.field.related_group || !this.field.related_category) return

      return this.adminSchema.get_category(
        this.field.related_group,
        this.field.related_category
      )
    },
    canCreateRelated() {
      // В фильтре и readonly-поле создание связи недоступно.
      if (this.isFilter || this.isReadOnly()) return false

      if (!this.relatedCategorySchema) return false

      return this.relatedCategorySchema.getTableInfo().can_create
    },
    rightChoices() {
      return this.value || []
    },
    leftChoices() {
      const selectedKeys = new Set((this.value || []).map(i => i.key))
      return this.choices.filter(i => !selectedKeys.has(i.key))
    },
    shownChoicesCount() {
      return this.isDualList() ? this.leftChoices.length : this.choices.length
    },
  },
  methods: {
    addCreatedRelated(createResult) {
      const created = createResult.choice
      if (!created) {
        throw new Error('Created related record does not contain choice')
      }

      // В many новая связь добавляется к выбранным.
      if (this.isMany()) {
        this.value = [...(this.value || []), created]
      }

      // В одиночном поле новая связь заменяет текущую.
      else {
        this.value = created
      }

      this.onChange(this.value)
      this.updateChoices()
    },
    relatedChipClass(item) {
      return {
        'autocomplete-chip': true,
        'autocomplete-chip-link': this.hasRelatedDetail(item),
      }
    },
    hasRelatedDetail(item) {
      return Boolean(this.relatedDetailUrl(item))
    },
    openRelatedDetail(event, item) {
      if (event.target.closest('.v-chip__close')) return

      if (event.ctrlKey || event.metaKey || event.shiftKey) return

      const url = this.relatedDetailUrl(item)
      if (!url) return

      event.preventDefault()

      if (
        this.formType === 'edit'
        && !window.confirm(this.$t('leaveEditPage'))
      ) return

      this.$router.push(url)
    },
    relatedDetailUrl(item) {
      // В фильтре ссылка не нужна.
      if (this.isFilter) return undefined

      // Без маршрута переход невозможен.
      if (!this.field.related_group || !this.field.related_category) return undefined

      return detailUrl(
        this.field.related_group,
        this.field.related_category,
        item.key
      )
    },
    isReadOnly() {
      return this.readOnly
    },
    getMessages() {
      if (this.isFilter) return []
      return this.field.help_text || []
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
    updateFormContext(formData) {
      this.formData = formData
      this.formDataUpdated = true
    },
    updateSearch(search) {
      this.search = search
      this.updateChoices()
    },
    onMenuUpdate(isOpen) {
      if (!isOpen) return
      this.refreshChoicesIfFormDataUpdated()
    },
    refreshChoicesIfFormDataUpdated() {
      if (!this.formDataUpdated) return

      this.formDataUpdated = false
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
        subcategory: this.categorySchema.subcategory,
        parent_pk: this.parentPk,

        search_string: this.search || '',
        limit: 30,
        field_slug: this.fieldSlug,
        inline_field_slug: this.inlineFieldSlug,
        is_filter: this.isFilter,
        form_data: this.formData || {},
        existed_choices: existedChoices,
        action_name: this.actionName,
      }).then(response => {
        this.choices = response.data.results
        this.totalChoicesCount = response.data.total_count ?? this.choices.length
        this.apiLoading = false
      }).catch(error => {
        this.apiLoading = false

        const errorResult = this.$handleError(
          error,
          this.$t('errorTitles.loadChoices', { field: this.fieldSlug })
        )
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
    removeChip(item) {
      if (this.isReadOnly()) return

      // У множественного поля удаляется только выбранная связь.
      if (this.isMany()) {
        this.removeItem(item)
        return
      }

      // Одиночное поле очищается целиком.
      this.value = null
      this.onChange(this.value)
    },
  },
}
</script>
