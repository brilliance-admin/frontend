<template>

  <div class="filters-container">

    <div class="filter-element" v-if="searchEnabled">

      <v-text-field
        v-model="search"
        density="compact"
        variant="solo"
        prepend-inner-icon="mdi-magnify"
        :label="$t('search')"
        v-on:keydown.enter.prevent="applyFilter"
      >
        <template #append-inner>
          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <v-icon v-bind="props" icon="mdi-help-circle-outline" v-if="searchHelp"/>
            </template>
            <div v-html="searchHelpHtml()"></div>
          </v-tooltip>
        </template>
      </v-text-field>

    </div>

    <div
      v-for="(filter, filter_name) in fieldsInfo"
      v-bind:key="filter_name"
      class="filter-element"
      :title="filter.help_text || null"
      v-on:keydown.enter.prevent="applyFilter"
    >
      <component
        v-if="getFieldComponent(filter)"
        :is="getFieldComponent(filter)"

        :ref="getRefString(filter_name)"

        density="compact"
        variant="solo"

        :category-schema="categorySchema"

        :field="filter"
        :field-slug="filter_name"
        :loading="false"
        :is-filter="true"

        @changed="value => _updateValue(value, filter_name)"
        @open-subtable="toggleSubtable(filter_name)"
      />
      <template v-else>
        {{ filter }}
      </template>
    </div>

    <!--
    <div class="filter-button">
      <v-btn
        variant="outlined"
        density="compact"
        class="button-icon"
        @click="applyFilter"
        color="secondary"
        icon="mdi-cog-outline"
      />
    </div>
    -->

    <div class="filter-button">
      <v-btn
        v-if="isCompactApply"
        class="filter-button-apply"
        @click="applyFilter"
        color="secondary"
        icon="mdi-magnify"
        :title="$t('apply')"
        :aria-label="$t('apply')"
        :disabled="loading"
      />
      <v-btn
        v-else
        class="filter-button-apply"
        @click="applyFilter"
        color="secondary"
        prepend-icon="mdi-magnify"
        :disabled="loading"
      >{{ $t('apply') }}</v-btn>
    </div>

    <div class="filter-subtables">
      <template v-for="(filter, filter_name) in fieldsInfo" :key="filter_name">
        <FilterSubtable
          v-if="filter.has_filter_subtable && openedSubtableSlugs[filter_name]"
          v-show="activeSubtableSlug === filter_name"
          :field="filter"
          :field-slug="filter_name"
          :value="filters[filter_name]"
          :chart="filterSubtableCharts[filter_name]"
          :loading="filterSubtableLoading[filter_name]"
          @changed="value => updateSubtableValue(value, filter_name)"
          @close="closeSubtable(filter_name)"
          @unit-changed="value => $emit('subtable-unit-changed', filter_name, value)"
          @refresh="$emit('subtable-refresh')"
        >
          <slot
            name="filter-subtable"
            :field="filter"
            :field-slug="filter_name"
            :value="filters[filter_name]"
            :update="value => _updateValue(value, filter_name)"
          />
        </FilterSubtable>
      </template>
    </div>
  </div>

</template>

<script>
import { normalizeFilters } from '/src/utils/filters'
import { isChoiceField } from '/src/utils/fields'
import { CategorySchema } from '/src/api/schema'
import BooleanFilter from '/src/components/fields/BooleanFilter.vue'
import StringField from '/src/components/fields/String.vue'
import NumberField from '/src/components/fields/Number.vue'
import ChoiceField from '/src/components/fields/Choice.vue'
import MultipleChoiceField from '/src/components/fields/MultipleChoice.vue'
import RelatedField from '/src/components/fields/Related.vue'
import DateTimeField from '/src/components/fields/DateTime.vue'
import FilterSubtable from '/src/components/table/FilterSubtable.vue'

export default {
  props: {
    categorySchema: {type: CategorySchema, required: true},
    loading: {type: Boolean, required: false},

    searchEnabled: {type: Boolean, required: false},
    searchHelp: {type: String, required: false},
    fieldsInfo: {type: Object, required: true},

    filtersInit: {type: Object, required: false},
    searchInit: {type: String, required: false},
    filterSubtableCharts: {type: Object, required: true},
    filterSubtableLoading: {type: Object, required: true},
  },
  emits: ["filtered", "active-subtable-changed", "subtable-unit-changed", "subtable-refresh"],
  data() {
    return {
      filters: {},
      search: null,
      activeSubtableSlug: null,
      openedSubtableSlugs: {},
    }
  },
  created() {
    if (this.filtersInit) {
      this.filters = this.filtersInit
    }
    if (this.searchInit) {
      this.search = this.searchInit
    }
    this.$nextTick(() => {
      this.applyFiltersToFields()
    })
  },
  computed: {
    isCompactApply() {
      return Object.keys(this.fieldsInfo).length >= 6
    },
  },
  watch: {
    filtersInit: {
      handler(value) {
        this.filters = value ? {...value} : {}
        this.$nextTick(() => this.applyFiltersToFields())
      },
      deep: true,
    },
    searchInit(value) {
      this.search = value || null
    },
  },
  methods: {
    applyFiltersToFields() {
      if (!this.filters || !Object.keys(this.filters).length) return
      for (const name of Object.keys(this.fieldsInfo)) {
        const ref = this.$refs[this.getRefString(name)]
        if (!ref) continue
        const field = ref[0] || ref
        if (field && field.updateFormData) {
          field.updateFormData(this.filters)
        }
      }
    },
    getFieldComponent(filter) {
      if (filter.type === 'multiple_choice') return MultipleChoiceField
      if (isChoiceField(filter)) return ChoiceField
      if (['datetime'].indexOf(filter.type) !== -1) return DateTimeField
      if (['related'].indexOf(filter.type) !== -1) return RelatedField
      if (['string', 'duration'].indexOf(filter.type) !== -1) return StringField
      if (['integer'].indexOf(filter.type) !== -1) return NumberField
      if (['boolean'].indexOf(filter.type) !== -1) return BooleanFilter
    },
    _updateValue(value, filter_name) {
      this.filters[filter_name] = value
    },
    updateSubtableValue(value, filter_name) {
      this._updateValue(value, filter_name)
      const ref = this.$refs[this.getRefString(filter_name)]
      const field = ref[0] || ref
      field.updateFormData(this.filters)
      this.applyFilter()
    },
    toggleSubtable(filter_name) {
      if (this.activeSubtableSlug === filter_name) {
        this.closeSubtable(filter_name)
        return
      }
      this.openedSubtableSlugs[filter_name] = true
      this.activeSubtableSlug = filter_name
      this.$emit('active-subtable-changed', filter_name)
    },
    closeSubtable(filter_name) {
      if (this.activeSubtableSlug !== filter_name) return
      this.activeSubtableSlug = null
      this.$emit('active-subtable-changed', null)
    },
    applyFilter() {
      if (this.loading) return
      this.$emit('filtered', normalizeFilters(this.filters), this.search)
    },
    searchHelpHtml () {
      return this.searchHelp.replace(/\n/g, '<br>')
    },
    getRefString(slug) {
      return `field_${slug}`
    },
  },
}
</script>
