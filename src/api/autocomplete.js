import request from '/src/utils/request'
import { config_dataset } from '/src/utils/settings'
import { getLang } from '/src/utils/language'
import urlJoin from 'url-join'

const tableDataAutocompleteUrl = urlJoin(config_dataset.backend_prefix, 'autocomplete/{group}/{category}/')

export function getTableAutocomplete(kwargs) {
  return new Promise((resolve, reject) => {
    const url = tableDataAutocompleteUrl.replace('{group}', kwargs.group).replace('{category}', kwargs.category)
    request({
      url: url,
      data: {
        search_string: kwargs.search_string,
        field_slug: kwargs.field_slug,
        is_filter: kwargs.is_filter,
        form_data: kwargs.form_data,
        existed_choices: kwargs.existed_choices,
        action_name: kwargs.action_name,
        limit: kwargs.limit,
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
