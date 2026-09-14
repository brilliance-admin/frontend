<template>

  <div class="filters-container">

    <div class="filter-element filter-element--search" v-if="searchEnabled">

      <label class="filter-label"><span>{{ $t('search') }}</span></label>

      <v-text-field
        v-model="search"
        density="compact"
        variant="solo"
        prepend-inner-icon="mdi-magnify"
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
      <label class="filter-label"><span>{{ filter.label }}</span></label>

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
          :unit-size="filterSubtableUnits[filter_name] || '1hour'"
          :chart="filterSubtableCharts[filter_name]"
          :loading="filterSubtableLoading[filter_name]"
          :error="filterSubtableErrors[filter_name]"
          @changed="value => updateSubtableValue(value, filter_name)"
          @close="closeSubtable(filter_name)"
          @unit-changed="value => setFilterSubtableUnit(filter_name, value)"
          @refresh="refreshFilterSubtable"
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
import { applyFiltersToQuery, extractFiltersFromQuery, normalizeFilters } from '/src/utils/filters'
import { isChoiceField } from '/src/utils/fields'
import { CategorySchema } from '/src/api/schema'
import { getFilterSubtable } from '/src/api/table'
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
    parentPk: {type: [String, Number], required: false},
    loading: {type: Boolean, required: false},

    searchEnabled: {type: Boolean, required: false},
    searchHelp: {type: String, required: false},
    fieldsInfo: {type: Object, required: true},

  },
  emits: ["filtered"],
  data() {
    return {
      filters: {},
      search: null,
      activeSubtableSlug: null,
      openedSubtableSlugs: {},
      filterSubtableCharts: {},
      filterSubtableUnits: {},
      filterSubtableLoading: {},
      filterSubtableErrors: {},
      filterSubtableAbortController: null,
    }
  },
  mounted() {
    this.deserializeQuery(this.$route)
  },
  computed: {
    isCompactApply() {
      return Object.keys(this.fieldsInfo).length >= 6
    },
    filterQuery() {
      return this.getFilterQuery(this.$route.query)
    },
  },
  watch: {
    filterQuery() {
      this.deserializeQuery(this.$route)
    },
  },
  methods: {
    getFilterQuery(query) {
      return Object.keys(query)
        .filter(key => (
          key === 'search' ||
          key === 'filter_subtable' ||
          key === 'filter_subtable_unit' ||
          key.startsWith('f-')
        ))
        .sort()
        .map(key => `${key}:${JSON.stringify(query[key])}`)
        .join('&')
    },
    deserializeQuery(route) {
      const search = route.query.search || null
      const filters = extractFiltersFromQuery(route, this.fieldsInfo)

      const slug = route.query.filter_subtable
      const unitSize = route.query.filter_subtable_unit
      const field = typeof slug === 'string' ? this.fieldsInfo[slug] : null
      const activeSubtableSlug = field?.has_filter_subtable ? slug : null
      const filterSubtableUnit = activeSubtableSlug && ['10min', '1hour', '1day'].includes(unitSize)
        ? unitSize
        : '1hour'

      this.search = search
      this.filters = filters

      if (activeSubtableSlug) {
        this.openedSubtableSlugs[slug] = true
        this.activeSubtableSlug = slug
        this.filterSubtableUnits[slug] = filterSubtableUnit
      } else {
        this.activeSubtableSlug = null
      }

      this.$nextTick(() => this.applyFiltersToFields())
      return this.loadFilterSubtable()
    },
    serializeQuery() {
      let query = {}
      if (this.search) query.search = this.search

      query = applyFiltersToQuery(query, this.filters, this.fieldsInfo)

      if (this.activeSubtableSlug) {
        query.filter_subtable = this.activeSubtableSlug
        query.filter_subtable_unit = this.filterSubtableUnits[this.activeSubtableSlug] || '1hour'
      }

      return query
    },
    getFilters() {
      return normalizeFilters(this.filters)
    },
    getSearch() {
      return this.search
    },
    getFiltersCount() {
      let count = this.search ? 1 : 0
      count += Object.values(this.getFilters()).length
      return count
    },
    applyFiltersToFields() {
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
    refreshFilterSubtable() {
      const queryChanged = this.filterQuery !== this.getFilterQuery(this.serializeQuery())
      if (queryChanged) {
        this.applyFilter()
        return
      }

      this.loadFilterSubtable()
    },
    toggleSubtable(filter_name) {
      if (this.activeSubtableSlug === filter_name) {
        this.closeSubtable(filter_name)
        return
      }
      this.openedSubtableSlugs[filter_name] = true
      this.activeSubtableSlug = filter_name
    },
    closeSubtable(filter_name) {
      if (this.activeSubtableSlug !== filter_name) return
      this.activeSubtableSlug = null
    },
    setFilterSubtableUnit(fieldSlug, unitSize) {
      this.filterSubtableUnits[fieldSlug] = unitSize
    },
    loadFilterSubtable() {
      this.filterSubtableAbortController?.abort()
      this.filterSubtableAbortController = null

      for (const [fieldSlug, field] of Object.entries(this.fieldsInfo)) {
        if (field.has_filter_subtable && fieldSlug !== this.activeSubtableSlug) {
          this.filterSubtableCharts[fieldSlug] = null
          this.filterSubtableLoading[fieldSlug] = false
          this.filterSubtableErrors[fieldSlug] = null
        }
      }

      const fieldSlug = this.activeSubtableSlug
      const filters = this.getFilters()
      const value = filters[fieldSlug]
      if (!fieldSlug || !value?.from || !value?.to) {
        if (fieldSlug) {
          this.filterSubtableCharts[fieldSlug] = null
          this.filterSubtableLoading[fieldSlug] = false
          this.filterSubtableErrors[fieldSlug] = null
        }
        return Promise.resolve()
      }

      this.filterSubtableCharts[fieldSlug] = null
      this.filterSubtableLoading[fieldSlug] = true
      this.filterSubtableErrors[fieldSlug] = null
      const controller = new AbortController()
      this.filterSubtableAbortController = controller

      return getFilterSubtable({
        group: this.categorySchema.group,
        category: this.categorySchema.category,
        subcategory: this.categorySchema.subcategory,
        parent_pk: this.parentPk,
        fieldSlug,
        unitSize: this.filterSubtableUnits[fieldSlug] || '1hour',
        filters,
        search: this.search,
        signal: controller.signal,
      }).then(responseData => {
        if (this.filterSubtableAbortController !== controller) return
        this.filterSubtableCharts[fieldSlug] = responseData.chart
      }).catch(error => {
        if (controller.signal.aborted) return
        console.error('Get filter subtable error:', error)
        this.filterSubtableErrors[fieldSlug] = error.response?.data?.message || error.message
      }).finally(() => {
        if (this.filterSubtableAbortController !== controller) return
        this.filterSubtableLoading[fieldSlug] = false
        this.filterSubtableAbortController = null
      })
    },
    applyFilter() {
      if (this.loading) return
      this.filters = this.getFilters()
      this.$emit('filtered')
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
