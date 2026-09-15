const FILTER_PREFIX = 'f-'

function castValue(value, fieldType) {
  if (value === '' || value === null || value === undefined) return value
  switch (fieldType) {
    case 'integer':
      return isFinite(value) ? Number(value) : value
    case 'boolean':
      if (value === 'true') return true
      if (value === 'false') return false
      return value
    default:
      return value
  }
}

/**
 * Распаковывает фильтры из query (?f-id=1&f-created_at__from=...)
 * в идентичный shape фильтров
 */
export function extractFiltersFromQuery(route, tableFiltersFields) {
  const query = route.query ?? route
  const filters = {}
  for (const [fieldSlug, field] of Object.entries(tableFiltersFields || {})) {
    if (field.type === 'related') {
      const keys = toArray(query[`${FILTER_PREFIX}${fieldSlug}__key`])
      const titles = toArray(query[`${FILTER_PREFIX}${fieldSlug}__title`])
      if (!keys.length) continue

      if (field.many) {
        filters[fieldSlug] = keys.map((key, index) => ({
          key,
          title: titles[index],
        }))
      } else {
        filters[fieldSlug] = {
          key: keys[0],
          title: titles[0],
        }
      }
      continue
    }

    if (field.type === 'datetime') {
      const from = query[`${FILTER_PREFIX}${fieldSlug}__from`]
      const to = query[`${FILTER_PREFIX}${fieldSlug}__to`]
      if (from !== undefined || to !== undefined) {
        filters[fieldSlug] = {from, to}
      }
      continue
    }

    const value = query[`${FILTER_PREFIX}${fieldSlug}`]
    if (value !== undefined) {
      filters[fieldSlug] = castValue(value, field.type)
    }
  }

  return filters
}

/**
 * Упаковывает фильтры в query-формат (f- + __)
 * newQuery всегда новый и только дополняется
 */
export function applyFiltersToQuery(newQuery, filters, tableFiltersFields = {}) {
  for (const [key, value] of Object.entries(filters)) {
    const field = tableFiltersFields[key]

    if (field?.type === 'related') {
      const values = field.many ? value : [value]
      const choices = values.filter(Boolean)
      if (!choices.length) continue

      newQuery[`${FILTER_PREFIX}${key}__key`] = field.many
        ? choices.map(item => item.key)
        : choices[0].key
      newQuery[`${FILTER_PREFIX}${key}__title`] = field.many
        ? choices.map(item => item.title)
        : choices[0].title
      continue
    }

    if (field?.type === 'datetime') {
      if (value?.from !== undefined && value.from !== null) {
        newQuery[`${FILTER_PREFIX}${key}__from`] = value.from
      }
      if (value?.to !== undefined && value.to !== null) {
        newQuery[`${FILTER_PREFIX}${key}__to`] = value.to
      }
      continue
    }

    if (value !== undefined && value !== null) {
      newQuery[`${FILTER_PREFIX}${key}`] = value
    }
  }

  return newQuery
}

function toArray(value) {
  if (value === undefined || value === null) return []
  return Array.isArray(value) ? value : [value]
}

/**
 * Нормализует фильтры перед emit / API:
 * - удаляет пустые значения
 * - удаляет пустые object-фильтры
 * - shape сохраняется
 */
export function normalizeFilters(filters) {
  const normalized = {}

  for (const [key, value] of Object.entries(filters)) {
    // object-фильтр
    if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value)
    ) {
      const obj = {}

      for (const [subKey, subValue] of Object.entries(value)) {
        if (
          subValue !== undefined &&
          subValue !== null &&
          subValue !== ''
        ) {
          obj[subKey] = subValue
        }
      }

      if (Object.keys(obj).length > 0) {
        normalized[key] = obj
      }

      continue
    }

    // примитив
    if (value !== undefined && value !== null && value !== '') {
      normalized[key] = value
    }
  }

  return normalized
}
