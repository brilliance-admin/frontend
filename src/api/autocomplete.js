import request from '/src/utils/request'
import { config_dataset } from '/src/utils/settings'
import { getLang } from '/src/utils/language'
import urlJoin from 'url-join'

const tableDataAutocompleteUrl = urlJoin(config_dataset.backend_prefix, 'autocomplete/{group}/{category}/')

export function getTableAutocomplete(kwargs) {
  return new Promise((resolve, reject) => {
    let url = tableDataAutocompleteUrl.replace('{group}', kwargs.group).replace('{category}', kwargs.category)
    const params = new URLSearchParams()
    if (kwargs.subcategory) {
      params.set('subcategory', kwargs.subcategory)
    }
    if (kwargs.parent_pk !== undefined && kwargs.parent_pk !== null && kwargs.parent_pk !== '') {
      params.set('parent_pk', kwargs.parent_pk)
    }
    const query = params.toString()
    if (query) {
      url = `${url}?${query}`
    }

    request({
      url: url,
      data: {
        search_string: kwargs.search_string,
        field_slug: kwargs.field_slug,
        inline_field_slug: kwargs.inline_field_slug,
        is_filter: kwargs.is_filter,
        form_data: kwargs.form_data,
        existed_choices: kwargs.existed_choices,
        action_name: kwargs.action_name,
        limit: kwargs.limit,
        parent_pk: kwargs.parent_pk,
      },
      method: 'post',
      timeout: config_dataset.api_timeout_ms,
      headers: {
        'Accept-Language': getLang(),
        'Cache-Control': 'no-cache',
      },
    }).then(response => {
      resolve(response)
    }).catch(error => reject(error))
  })
}
