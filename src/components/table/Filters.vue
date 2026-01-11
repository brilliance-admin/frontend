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
              <v-icon icon="mdi-magnify" />
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
      v-on:keydown.enter.prevent="applyFilter"
    >
      <component
        v-if="getFieldComponent(filter)"
        :is="getFieldComponent(filter)"

        density="compact"
        variant="solo"

        :category-schema="categorySchema"

        :field="filter"
        :field-slug="filter_name"
        :loading="false"
        :is-filter="true"

        @changed="value => _updateValue(value, filter_name)"
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
        @click="applyFilter"
        color="secondary"
        prepend-icon="mdi-magnify"
        :disabled="loading"
      >{{ $t('apply') }}</v-btn>
    </div>
  </div>

</template>

<script>
import { normalizeFilters } from '/src/utils/filters'
import { CategorySchema } from '/src/api/schema'
import BooleanFilter from '/src/components/fields/BooleanFilter.vue'
import StringField from '/src/components/fields/String.vue'
import NumberField from '/src/components/fields/Number.vue'
import ChoiceField from '/src/components/fields/Choice.vue'
import RelatedField from '/src/components/fields/Related.vue'
import DateTimeField from '/src/components/fields/DateTime.vue'

export default {
  props: {
    group: {type: String, required: true},
    category: {type: String, required: true},

    categorySchema: {type: CategorySchema, required: true},
    loading: {type: Boolean, required: false},

    searchEnabled: {type: Boolean, required: false},
    searchHelp: {type: String, required: false},
    fieldsInfo: {type: Object, required: true},

    filtersInit: {type: Object, required: false},
    searchInit: {type: String, required: false},
  },
  emits: ["filtered"],
  data() {
    return {
      filters: {},
      search: null,
    }
  },
  created() {
    if (this.initFilters) {
      this.filters = this.initFilters
    }
    if (this.initSearch) {
      this.search = this.initSearch
    }
  },
  methods: {
    getFieldComponent(filter) {
      if (['choice'].indexOf(filter.type) !== -1 || filter.choices) return ChoiceField
      if (['datetime'].indexOf(filter.type) !== -1) return DateTimeField
      if (['related'].indexOf(filter.type) !== -1) return RelatedField
      if (['string'].indexOf(filter.type) !== -1) return StringField
      if (['integer'].indexOf(filter.type) !== -1) return NumberField
      if (['boolean'].indexOf(filter.type) !== -1) return BooleanFilter
    },
    _updateValue(value, filter_name) {
      this.filters[filter_name] = value
    },
    applyFilter() {
      if (this.loading) return
      this.$emit('filtered', normalizeFilters(this.filters), this.search)
    },
    searchHelpHtml () {
      return this.searchHelp.replace(/\n/g, '<br>')
    },
  },
}
</script>
