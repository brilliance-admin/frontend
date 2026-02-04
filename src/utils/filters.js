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
  const objectKeys = new Set()
  const allowedKeys = Object.keys(tableFiltersFields || {})

  // 1. определяем object-фильтры по наличию __
  for (const key of Object.keys(query)) {
    if (!key.startsWith(FILTER_PREFIX)) continue
    const cleanKey = key.slice(FILTER_PREFIX.length)
    if (!cleanKey.includes('__')) continue
    const root = cleanKey.split('__')[0]
    if (!allowedKeys.length || allowedKeys.includes(root)) {
      objectKeys.add(root)
    }
  }

  // 2. собираем фильтры
  for (const [rawKey, value] of Object.entries(query)) {
    if (!rawKey.startsWith(FILTER_PREFIX)) continue

    const key = rawKey.slice(FILTER_PREFIX.length)
    const parts = key.split('__')
    const root = parts[0]

    if (allowedKeys.length && !allowedKeys.includes(root)) continue

    const fieldType = tableFiltersFields[root]?.type

    // object-фильтр
    if (objectKeys.has(root)) {
      if (!filters[root]) {
        filters[root] = {}
      }
      if (parts.length === 2) {
        filters[root][parts[1]] = castValue(value, fieldType)
      }
      continue
    }

    // примитивный фильтр
    if (parts.length === 1) {
      filters[root] = castValue(value, fieldType)
    }
  }
  return filters
}

/**
 * Упаковывает фильтры в query-формат (f- + __)
 * newQuery всегда новый и только дополняется
 */
export function applyFiltersToQuery(newQuery, filters) {
  for (const [key, value] of Object.entries(filters)) {
    if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value)
    ) {
      // object → f-key__subKey
      for (const [subKey, subValue] of Object.entries(value)) {
        if (subValue !== undefined && subValue !== null) {
          newQuery[`${FILTER_PREFIX}${key}__${subKey}`] = subValue
        }
      }
    } else if (value !== undefined && value !== null) {
      newQuery[`${FILTER_PREFIX}${key}`] = value
    }
  }

  return newQuery
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
