import request from '/src/utils/request'
import { getToken } from '/src/utils/auth'
import { getLang } from '/src/utils/language'
import { config_dataset } from '/src/utils/settings'
import urlJoin from 'url-join'

const schemeUrl = urlJoin(config_dataset.backend_prefix, 'schema/')

export async function getAdminSchema() {
  return await new Promise((resolve, reject) => {
    if (!getToken()) {
      console.error('getAdminSchema error: getToken is empty')
      return
    }

    request({
      url: schemeUrl,
      method: 'get',
      headers: {
        'Accept-Language': getLang(),
      },
      timeout: config_dataset.api_timeout_ms,
    }).then(response => {
      const contentType = response.headers.get("content-type");
      if (!contentType || contentType.indexOf("application/json") === -1) {
        reject(`Admin schema content-type response is not json: ${contentType}`);
        return
      }

      if (!response.data.categories) {
        reject('Admin schema categories data not found or empty');
        return
      }

      resolve(new AdminSchema(response.data))
    }).catch(error => {
      reject(error)
    })
  })
}

export function categoryUrl(group_slug, category_slug) {
  return `/${group_slug}/${category_slug}/`
}

export function detailUrl(group_slug, category_slug, pk) {
  return `/${group_slug}/${category_slug}/${pk}/`
}

export class CategorySchema {
  constructor(schema, group_slug, category_slug) {
    this.schema = schema
    this.group_slug = group_slug
    this.category_slug = category_slug
  }

  get type() {
    return this.schema['type']
  }

  get group() {
    return this.group_slug
  }

  get category() {
    return this.category_slug
  }

  get title() {
    return this.schema['title']
  }

  getTableInfo() {
    return this.schema['table_info']
  }

  getGraphInfo() {
    return this.schema['graph_info']
  }
}

export class AdminSchema {
  constructor(schema) {
    this.schema = schema
  }

  get_category(group_slug, category_slug) {
    if (!this.schema.categories) {
      console.error('this.schema.categories is none; this.schema:', this.schema)
      return
    }
    const group = this.schema.categories[group_slug]
    if (!group) {
      return
    }
    const category = group.categories[category_slug]
    if (category) {
      return new CategorySchema(category, group_slug, category_slug)
    }
  }

  get_categories() {
    return this.schema.categories
  }
}
