<template>
  <div class="list-page">

    <div class="list-above-block" v-if="canCreate() || hasFilters()">
      <div class="header-row-filters">

        <!-- Вариант фильтров под широкие экраны -->
        <div v-if="!isNarrow" class="filters-inline">
          <Filters
            v-if="hasFilters()"
            :category-schema="categorySchema"
            :filters-init="filters"
            :search-init="search"
            @filtered="handleFilter"
            :loading="loading"
            :search-enabled="getTableInfo().search_enabled"
            :fields-info="getTableInfo().table_filters?.fields || {}"
            :search-help="getTableInfo().search_help"
          />
        </div>

        <!-- Фильтры под узкие -->
        <div v-else class="filters-drawer">
          <v-navigation-drawer
            v-model="filtersOpen"
            location="right"
            temporary
            class="filters-drawer-panel"
            width="320"
          >
            <div class="navbar-filters">
              <div class="drawer-header">
                <v-btn
                  icon="mdi-close"
                  @click="filtersOpen = false"
                  color="secondary"
                />
              </div>
              <Filters
                :category-schema="categorySchema"
                :filters-init="filters"
                :search-init="search"
                @filtered="handleFilter"
                :loading="loading"
                :search-enabled="getTableInfo().search_enabled"
                :fields-info="getTableInfo().table_filters?.fields || {}"
                :search-help="getTableInfo().search_help"
              />
            </div>
          </v-navigation-drawer>

          <v-badge
            v-if="getFiltersCount() > 0"
            :content="getFiltersCount()"
            @click="filtersOpen = true"
          >
            <v-btn
              color="secondary"
              icon="mdi-filter-variant"
            />
          </v-badge>

          <v-btn
            v-else
            color="secondary"
            icon="mdi-filter-variant"
            @click="filtersOpen = true"
          />

        </div>
      </div>

      <div class="header-row-actions">
        <div class="table-button" v-if="canCreate()">
          <FormCreate
            :title="categorySchema.title"
            :admin-schema="adminSchema"
            :category-schema="categorySchema"
            :parent-pk="parentPk"
            @created="createdEvent"
          />
        </div>
      </div>
    </div>

    <v-data-table
      :class="{
        'model-table': true,
        'model-table--fit-screen': isFitScreenEnabled(),
        'model-table--fixed-header': isFixedHeaderEnabled(),
      }"
      :style="getTableStyle()"
      color="primary"

      v-model="selected"
      :items="pageData.data || []"
      :headers="headers"
      :loading="loading"
      :show-select="isShowSelect()"
      :density="getTableDensity()"
      :fixed-header="getTableOptions().fixed_header"

      :items-per-page="pageInfo.limit"
      :page="pageInfo.page"

      @update:sortBy="updateSortBy"
      @click:row="clickRow"
    >
      <template
        v-for="(header, index) in headers"
        v-slot:[`item.${header.key}`]="{ item }"
        v-bind:key="index"
      >

        <component
          :is="getCellProps(header, index, item).is"
          :to="getCellProps(header, index, item).to"
          :class="getCellProps(header, index, item).class"
        >

          <template v-if="header.type === 'string'">
            <span
              v-if="header.field.allow_html"
              v-html="item[header.key]"
            />
            <template v-else>
              {{ stripHtml(item[header.key]) }}
            </template>
          </template>

          <template v-else-if="header.type === 'related'">
            <template v-for="rel in formatRelated(item[header.key])" :key="rel.key">
              <v-chip
                v-if="header.field.related_group && header.field.related_category"
                :to="detailUrl(header.field.related_group, header.field.related_category, rel.key)"
                link
                class="related-chip-link"
                @click.stop
                :size="header.field.size || 'default'"
                :title="`#${rel.key} ${rel.title}`"
              >
                {{ truncate(rel.title, 30) }}
              </v-chip>
              <v-chip
                v-else
                :size="header.field.size || 'default'"
                :title="`#${rel.key} ${rel.title}`"
              >
                {{ truncate(rel.title, 30) }}
              </v-chip>
            </template>
          </template>

          <template v-else-if="header.type === 'boolean'">
            <v-icon color="green-darken-2" icon="mdi-check" size="small" v-if="item[header.key]"/>
            <v-icon color="red-darken-2" icon="mdi-close" size="small" v-else/>
          </template>

          <template v-else-if="isChoiceField(header.field)">
            <template v-if="item[header.key] !== null && item[header.key] !== undefined">
              <template v-if="getChoiceColor(item, header)">
                <v-chip
                  class="table-choice-chip"
                  :size="header.field.size || 'default'"
                  :variant="header.field.variant"
                  :color="getChoiceColor(item, header)"
                >{{ getChoiceTitle(item, header) }}</v-chip>
              </template>
              <template v-else>
                {{ getChoiceTitle(item, header) }}
              </template>
            </template>
          </template>

          <template v-else-if="header.type === 'datetime'">
            <span :class="['cell-string', `cell-${header.type}`]">{{ formatDateTime(item[header.key]) }}</span>
          </template>

          <template v-else-if="header.type === 'image'">
            <v-img
              v-if="item[header.key] && item[header.key].url"
              class="image-preview"
              :max-height="header.field.preview_max_height || 100"
              :max-width="header.field.preview_max_width || 100"
              cover
              :src="item[header.key].url"
            />
          </template>

          <template v-else-if="header.type === 'file'">
            <span class="cell-string" v-if="item[header.key]">{{ item[header.key].name }}</span>
            <span class="cell-string" v-else>{{ item[header.key] }}</span>
          </template>

          <template v-else>
            <div :class="header.type" style="display: none" />
            <span class="cell-string">{{ item[header.key] }}</span>
          </template>
        </component>
      </template>

      <template v-slot:bottom></template>

      <template v-slot:header.data-table-select="{ on, props }">
        <v-tooltip :text="`${$t('applyToAllRecords')} ${getTotalCount()}`">
          <template v-slot:activator="{ props }">
            <div v-bind="props" class="select-to-all">
              <v-checkbox
                v-model="actionToAll"
                color="var(--color-darken-2)"
                density="compact"
              />
            </div>
          </template>
        </v-tooltip>
      </template>

    </v-data-table>


    <div class="table-bottom">

      <!-- Счётчик выбранных элеменов -->
      <div class="table-bottom-cell" v-if="hasActons()">
        <v-label class="info">
          <template v-if="!isNarrow">
            {{ $t('selected') }}
          </template>
          <p class="selected-count">{{ getSelectedCount()}}/{{ getTotalCount() }}</p>
        </v-label>
      </div>

      <!-- Админские действия -->
      <div class="table-bottom-cell actions-cell">

        <!-- Выпадающий список для узких экранов -->
        <template v-if="!isNarrow">
          <template
            v-for="(action_info, key) in categorySchema.getTableInfo().actions"
            v-bind:key="key"
          >
            <v-btn
              size="small"
              class="action-button"
              :variant="action_info.variant || 'flat'"
              :prepend-icon="action_info.icon"
              :base-color="action_info.base_color || 'secondary'"
              @click="pressAction(action_info, key)"
              :disabled="actionLoading"
            >
              {{ action_info.title }}
            </v-btn>
          </template>
        </template>

        <!-- Кнопки для широких экранов -->
        <v-menu v-else>
          <template #activator="{ props }">
            <v-btn
              class="action-button-opener"
              v-bind="props"
              color="primary"
              icon="mdi-dots-vertical"
              :disabled="actionLoading"
            />
          </template>

          <v-list>
            <v-list-item
              v-for="(action_info, key) in categorySchema.getTableInfo().actions"
              :key="key"
              @click="pressAction(action_info, key)"
            >
              <v-list-item-title>
                {{ action_info.title }}
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>

      </div>

      <div class="table-bottom-cell">
        <!-- Выпадающий список кол-ва элементов на странице -->
        <v-tooltip location="start" :text="$t('itemsPerPage')">
          <template v-slot:activator="{ props }">
            <div v-bind="props">
              <v-select
                class="list-pagination-per-page"
                v-model="pageInfo.limit"
                :items="perPageOptions"
                @update:modelValue="value => {this.pageInfo.page = 1; changePagination(value)}"
              ></v-select>
            </div>
          </template>
        </v-tooltip>

        <v-label class="info" v-if="!isNarrow && getTotalCount() !== null">{{ getTotalCount() }}</v-label>

        <v-pagination
          v-if="hasPagesCount()"
          class="list-pagination"
          :model-value="pageInfo.page"
          :length="pageData.pages_count"
          :total-visible="isNarrow ? 1 : 5"
          density="compact"
          size="40"
          variant="text"
          @update:modelValue="goToPage"
        >
          <template #item="{ isActive, page, props }">
            <v-text-field
              v-if="isActive && pageInputOpen"
              ref="pageInput"
              v-model="pageInput"
              type="number"
              min="1"
              hide-details
              density="compact"
              height="40"
              variant="plain"
              width="40"
              @blur="pageInputOpen = false"
              @keyup.enter="submitPageInput"
            />
            <v-btn
              v-else-if="isActive"
              v-bind="props"
              :active="false"
              density="compact"
              size="40"
              variant="text"
              @click.stop="openPageInput"
            >
              {{ page }}
            </v-btn>
            <v-btn
              v-else
              v-bind="props"
              density="compact"
              size="40"
              variant="text"
            >
              {{ page }}
            </v-btn>
          </template>
        </v-pagination>

        <template v-else>
          <v-btn
            class="list-pagination"
            icon="mdi-chevron-left"
            variant="text"
            :disabled="pageInfo.page <= 1"
            @click="goToPage(pageInfo.page - 1)"
          />
          <v-text-field
            v-if="pageInputOpen"
            ref="pageInput"
            class="list-pagination"
            v-model="pageInput"
            type="number"
            min="1"
            hide-details
            density="compact"
            height="40"
            variant="plain"
            width="40"
            @blur="pageInputOpen = false"
            @keyup.enter="submitPageInput"
          />
          <v-btn
            v-else
            class="list-pagination"
            variant="text"
            @click="openPageInput"
          >
            {{ pageInfo.page }}
          </v-btn>
          <v-btn
            class="list-pagination"
            icon="mdi-chevron-right"
            variant="text"
            :disabled="!hasNextPage()"
            @click="goToPage(pageInfo.page + 1)"
          />
        </template>
      </div>

    </div>

    <TableActionExecutor
      ref="actionExecutor"
      :admin-schema="adminSchema"
      :category-schema="categorySchema"
      :parent-pk="parentPk"
      @started="actionLoading = true"
      @success="handleActionSuccess"
      @finished="actionLoading = false"
    />

  </div>
</template>

<script>
import { applyFiltersToQuery, extractFiltersFromQuery } from '/src/utils/filters'
import { CategorySchema, detailUrl, subDetailUrl } from '/src/api/schema'
import { getLocalSettings, setLocalSettings } from '/src/utils/settings'
import { getDataList } from '/src/api/table'
import { truncate } from '/src/utils'
import { isChoiceField } from '/src/utils/fields'
import moment from 'moment'
import FormCreate from '/src/components/table/FormCreate.vue'
import TableActionExecutor from '/src/components/table/TableActionExecutor.vue'

export default {
  props: {
    adminSchema: {type: Object, required: true},
    categorySchema: {type: CategorySchema, required: true},
    parentPk: {type: [String, Number], required: false},
  },
  components: {
    FormCreate,
    TableActionExecutor,
  },
  data() {
    return {
      filtersOpen: false,
      loading: false,
      pageData: {},
      pageInfo: {},
      headers: {},
      selected: [],
      search: null,
      filters: {},
      perPageOptions: [25, 50, 100, 150],

      actionToAll: false,
      actionLoading: false,

      isNarrow: false,
      pageInputOpen: false,
      pageInput: '',
    }
  },
  mounted () {
    const mq = window.matchMedia('(max-width: 1280px)')
    this.isNarrow = mq.matches

    mq.addEventListener('change', e => {
      this.isNarrow = e.matches
    })
  },
  created() {
    this.headers = this.getHeaders()

    this.pageInfo = {
      page: 1,
      limit: getLocalSettings().page_size || 25,
    }

    this.deserializeQuery()
    this.getListData()
  },
  methods: {
    detailUrl,
    getCellProps(header, index, item) {
      const props = {
        is: 'div',
        class: {'table-cell': true, 'table-link': false},
      }

      // A row detail link belongs only to its first non-related cell.
      if (index !== 0 || !this.canRetrieve() || header.type === 'related') return props

      props.is = 'RouterLink'
      props.to = this.getDetailUrl(item)
      props.class['table-link'] = true
      return props
    },
    getHeaders() {
      let result = []

      const tableInfo = this.categorySchema.getTableInfo()

      for (const slug of tableInfo.table_schema.list_display) {
        const field = tableInfo.table_schema.fields[slug]
        if (!field) {
          console.error('Table field from listDisplay not found:', slug)
          continue
        }

        const headerData = field.header || {}
        headerData['field'] = field
        headerData['key'] = slug
        headerData['type'] = field.type
        headerData['title'] = field.label
        headerData['headerProps'] = {
          title: field.help_text ? `${field.label}\n${field.help_text}` : field.label,
        }
        headerData['align'] = headerData['align'] || 'left'
        headerData['sortable'] = tableInfo.ordering_fields.indexOf(slug) >= 0
        result.push(headerData)
      }
      return result
    },
    clickRow(event, row) {
      if (event.ctrlKey) {
        if (!this.selected.includes(row.item.id)) {
          this.selected.push(row.item.id)
        } else {
          this.selected.splice(this.selected.indexOf(row.item.id), 1);
        }
      }
    },
    getSelectedCount() {
      if (this.actionToAll) return this.getTotalCount()
      return this.selected ? this.selected.length : 0
    },
    hasFilters() {
      const table_filters = this.categorySchema.getTableInfo().table_filters
      return (
        this.categorySchema.getTableInfo().search_enabled ||
        (table_filters?.fields && Object.keys(table_filters.fields).length > 0)
      )
    },
    getTotalCount() {
      return this.pageData.total_count ?? null
    },
    canCreate() {
      return this.categorySchema.getTableInfo().can_create
    },
    canRetrieve() {
      return this.categorySchema.getTableInfo().can_retrieve
    },
    getDetailUrl(row) {
      const pkName = this.categorySchema.getTableInfo().pk_name
      const pkValue = row[pkName]

      if (!pkName || !pkValue) {
        console.error(`PK value "${pkName}" not found in row:`, row)
        return ''
      }

      if (this.categorySchema.subcategory && this.parentPk) {
        return subDetailUrl(
          this.categorySchema.group,
          this.categorySchema.category,
          this.parentPk,
          this.categorySchema.subcategory,
          pkValue,
        )
      }

      return detailUrl(this.categorySchema.group, this.categorySchema.category, pkValue)
    },
    deserializeQuery() {
      // Change url params only if group presented
      if (!this.categorySchema.group) return

      const page = this.$route.query.page
      if (page) this.pageInfo.page = parseInt(page)
      const limit = this.$route.query.limit

      if (limit) {
        let parsed = parseInt(limit)
        this.pageInfo.limit = Math.min(150, Math.max(25, parsed))
      }

      const ordering = this.$route.query.ordering
      if (ordering) this.ordering = ordering

      const search = this.$route.query.search
      if (search) this.search = search

      // Deserialize filters
      const table_filters = this.categorySchema.getTableInfo().table_filters || {}
      this.filters = extractFiltersFromQuery(this.$route, table_filters.fields || {})
    },
    serializeQuery() {
      // Change url params only if group presented
      if (!this.categorySchema.group) return

      let newQuery = {}
      if (this.categorySchema.subcategory) {
        newQuery.subtab = this.categorySchema.subcategory
      }
      if (this.pageInfo.page) newQuery.page = this.pageInfo.page
      if (this.pageInfo.limit) newQuery.limit = this.pageInfo.limit

      if (this.ordering) newQuery.ordering = this.ordering
      if (this.search) newQuery.search = this.search

      // Serialize filters
      const tableFilters = this.categorySchema.getTableInfo().table_filters || {}
      newQuery = applyFiltersToQuery(newQuery, this.filters, tableFilters.fields || {})

      this.$router.push({name: this.$route.name, query: newQuery})
    },
    async getListData() {
      this.loading = true
      getDataList({
        group: this.categorySchema.group,
        category: this.categorySchema.category,
        subcategory: this.categorySchema.subcategory,
        parent_pk: this.parentPk,

        pageInfo: this.pageInfo,
        filters: this.filters,
        search: this.search,
        ordering: this.ordering,
      }).then(responseData => {
        this.pageData = responseData
        this.loading = false
      }).catch(error => {
        this.loading = false
        console.error('Get list error:', error)

        const errorResult = this.$handleError(error, this.$t('errorTitles.loadList'))
        if (errorResult.fieldErrors && this.$refs.fieldscontainer) {
          this.$refs.fieldscontainer.updateErrors(errorResult.fieldErrors)
        }
      })
    },
    handleFilter(filters, search) {
      this.pageInfo.page = 1
      this.filters = filters
      this.search = search
      this.serializeQuery()
      this.getListData()
    },
    hasActons() {
      if (!this.categorySchema.getTableInfo().actions) {
        return false
      }
      return Object.keys(this.categorySchema.getTableInfo().actions).length > 0
    },
    isShowSelect() {
      return this.hasActons()
    },
    changePagination() {
      let settings = getLocalSettings()
      settings.page_size = this.pageInfo.limit
      setLocalSettings(settings)

      this.selected = []
      this.serializeQuery()
      this.getListData()
    },
    hasNextPage() {
      return (this.pageData.data || []).length === this.pageInfo.limit
    },
    hasPagesCount() {
      return this.pageData.pages_count !== null && this.pageData.pages_count !== undefined
    },
    openPageInput() {
      this.pageInput = String(this.pageInfo.page)
      this.pageInputOpen = true
      this.$nextTick(() => this.$refs.pageInput.focus())
    },
    submitPageInput() {
      this.pageInputOpen = false
      this.goToPage(Number(this.pageInput))
    },
    goToPage(page) {
      if (!Number.isInteger(page) || page < 1) return
      if (this.hasPagesCount()) {
        page = Math.min(page, this.pageData.pages_count)
      }
      if (page === this.pageInfo.page) return
      this.pageInfo.page = page
      this.changePagination()
    },
    pressAction(actionInfo, actionKey) {
      this.$refs.actionExecutor.run({
        actionKey,
        actionInfo,
        pks: [...this.selected],
        sendToAll: this.actionToAll,
        filters: this.filters,
        search: this.search,
        totalCount: this.getTotalCount(),
      })
    },
    handleActionSuccess() {
      this.selected = []
      this.getListData()
    },
    updateSortBy(options) {
      if (!options[0]) {
        this.ordering = null
      } else {
        const desc = options[0].order === 'desc'? '-' : ''
        const field_slug = options[0].key
        this.ordering = `${desc}${field_slug}`
      }

      this.serializeQuery()
      this.getListData()
    },
    formatDateTime(dateString) {
      if (dateString) {
        return moment(dateString).format('YYYY-MM-DD HH:mm')
      }
    },
    getTableInfo() {
      return this.categorySchema.getTableInfo()
    },
    getTableOptions() {
      return this.getTableInfo().options || {}
    },
    isFitScreenEnabled() {
      return this.getTableOptions().fit_screen === true
    },
    isFixedHeaderEnabled() {
      return this.getTableOptions().fixed_header === true
    },
    getTableDensity() {
      return this.getTableOptions().density || 'default'
    },
    getTableStyle() {
      const options = this.getTableOptions()
      const style = {}

      if (options.font_size) {
        style['--model-table-font-size'] = options.font_size
      }

      if (options.cell_padding) {
        style['--model-table-cell-padding'] = options.cell_padding
      }

      return style
    },
    getChoiceValue(item, header) {
      const value = item[header.key]
      if (typeof value === 'object') return value.value
      return value
    },
    getChoiceColor(item, header) {
      const value = item[header.key]
      if (typeof value === 'object' && value.tag_color) return value.tag_color

      if (header.field.choices) {
        const value = this.getChoiceValue(item, header);
        const choice = header.field.choices.find(c => c.value === value)
        if (choice) return choice.tag_color
      }

      return null
    },
    getChoiceTitle(item, header) {
      const value = item[header.key]
      if (typeof value === 'object') return value.title
      if (header.field.choices) {
        const choice = header.field.choices.find(c => c.value === value)
        if (choice) return choice.title
      }
      return value
    },
    isChoiceField,
    formatRelated(value) {
      if (!value) { return [] }
      if (Array.isArray(value)) { return value }
      return [value]
    },
    createdEvent() {
      this.serializeQuery()
      this.getListData()
    },
    stripHtml(html) {
      const div = document.createElement('div')
      div.innerHTML = html
      return div.textContent?.trim() ?? ''
    },
    truncate,
    getFiltersCount() {
      var count = 0
      if (this.search) {
        count += 1
      }
      if (this.filters) {
        count += Object.values(this.filters).filter(v => v !== null && v !== undefined).length
      }
      return count
    },
  },
}
</script>
