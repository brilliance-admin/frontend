<template>
  <v-data-table
    :class="{
      'model-table': true,
      'model-table--fit-screen': tableOptions.fit_screen === true,
      'model-table--fixed-header': tableOptions.fixed_header === true,
    }"
    :style="tableStyle"
    color="primary"
    :model-value="selected"
    :items="items"
    :headers="headers"
    :loading="loading"
    :show-select="selectable"
    :density="tableOptions.density || 'default'"
    :fixed-header="tableOptions.fixed_header"
    :items-per-page="itemsPerPage"
    :page="page"
    :hide-default-footer="hideDefaultFooter"
    @update:modelValue="$emit('update:selected', $event)"
    @update:sortBy="$emit('update:sort-by', $event)"
    @click:row="(...args) => $emit('click:row', ...args)"
  >
    <template
      v-for="(header, index) in headers"
      v-slot:[`item.${header.key}`]="{ item }"
      :key="header.key"
    >
      <component
        :is="getCellProps(header, index, item).is"
        :to="getCellProps(header, index, item).to"
        :class="getCellProps(header, index, item).class"
      >
        <template v-if="header.type === 'string'">
          <span v-if="header.field.allow_html" v-html="item[header.key]" />
          <template v-else>{{ stripHtml(item[header.key]) }}</template>
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
            >{{ truncate(rel.title, 30) }}</v-chip>
            <v-chip
              v-else
              :size="header.field.size || 'default'"
              :title="`#${rel.key} ${rel.title}`"
            >{{ truncate(rel.title, 30) }}</v-chip>
          </template>
        </template>

        <template v-else-if="header.type === 'boolean'">
          <v-icon color="green-darken-2" icon="mdi-check" size="small" v-if="item[header.key]" />
          <v-icon color="red-darken-2" icon="mdi-close" size="small" v-else />
        </template>

        <template v-else-if="isChoiceField(header.field)">
          <template v-if="item[header.key] !== null && item[header.key] !== undefined">
            <v-chip
              v-if="getChoiceColor(item, header)"
              class="table-choice-chip"
              :size="header.field.size || 'default'"
              :variant="header.field.variant"
              :color="getChoiceColor(item, header)"
            >{{ getChoiceTitle(item, header) }}</v-chip>
            <template v-else>{{ getChoiceTitle(item, header) }}</template>
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

    <template v-if="selectable" v-slot:header.data-table-select="{ props }">
      <v-tooltip :text="`${$t('applyToAllRecords')} ${totalCount}`">
        <template v-slot:activator="{ props: tooltipProps }">
          <div v-bind="tooltipProps" class="select-to-all">
            <v-checkbox
              :model-value="selectAll"
              color="var(--color-darken-2)"
              density="compact"
              @update:modelValue="$emit('update:select-all', $event)"
            />
          </div>
        </template>
      </v-tooltip>
    </template>
  </v-data-table>
</template>

<script>
import moment from 'moment'
import { detailUrl } from '/src/api/schema'
import { truncate } from '/src/utils'
import { isChoiceField } from '/src/utils/fields'

export default {
  props: {
    items: {type: Array, required: true},
    tableSchema: {type: Object, required: true},
    orderingFields: {type: Array, default: () => []},
    tableOptions: {type: Object, default: () => ({})},
    loading: {type: Boolean, required: false},
    selected: {type: Array, default: () => []},
    selectable: {type: Boolean, required: false},
    selectAll: {type: Boolean, required: false},
    totalCount: {type: Number, required: false},
    itemsPerPage: {type: Number, default: -1},
    page: {type: Number, required: false},
    hideDefaultFooter: {type: Boolean, required: false},
    getDetailUrl: {type: Function, required: false},
  },
  emits: ['update:selected', 'update:select-all', 'update:sort-by', 'click:row'],
  computed: {
    headers() {
      return this.tableSchema.list_display.map(slug => {
        const field = this.tableSchema.fields[slug]
        if (!field) {
          throw new Error(`Table field from listDisplay not found: ${slug}`)
        }

        const header = {...(field.header || {})}
        header.field = field
        header.key = slug
        header.type = field.type
        header.title = field.label
        header.headerProps = {
          title: field.help_text ? `${field.label}\n${field.help_text}` : field.label,
        }
        header.align = header.align || 'left'
        header.sortable = this.orderingFields.includes(slug)
        return header
      })
    },
    tableStyle() {
      const style = {}
      if (this.tableOptions.font_size) style['--model-table-font-size'] = this.tableOptions.font_size
      if (this.tableOptions.cell_padding) style['--model-table-cell-padding'] = this.tableOptions.cell_padding
      return style
    },
  },
  methods: {
    detailUrl,
    isChoiceField,
    truncate,
    getCellProps(header, index, item) {
      if (index !== 0 || !this.getDetailUrl || header.type === 'related') {
        return {is: 'div', class: {'table-cell': true, 'table-link': false}}
      }
      return {
        is: 'RouterLink',
        to: this.getDetailUrl(item),
        class: {'table-cell': true, 'table-link': true},
      }
    },
    formatDateTime(value) {
      return value ? moment(value).format('YYYY-MM-DD HH:mm') : undefined
    },
    formatRelated(value) {
      if (!value) return []
      return Array.isArray(value) ? value : [value]
    },
    getChoiceValue(item, header) {
      const value = item[header.key]
      return typeof value === 'object' ? value.value : value
    },
    getChoiceColor(item, header) {
      const value = item[header.key]
      if (typeof value === 'object' && value.tag_color) return value.tag_color
      const choice = header.field.choices?.find(choice => choice.value === this.getChoiceValue(item, header))
      return choice?.tag_color || null
    },
    getChoiceTitle(item, header) {
      const value = item[header.key]
      if (typeof value === 'object') return value.title
      const choice = header.field.choices?.find(choice => choice.value === value)
      return choice ? choice.title : value
    },
    stripHtml(html) {
      const div = document.createElement('div')
      div.innerHTML = html
      return div.textContent?.trim() ?? ''
    },
  },
}
</script>
