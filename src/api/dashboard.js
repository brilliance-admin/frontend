import request from '/src/utils/request'
import { config_dataset, getBackendApi } from '/src/utils/settings'
import { getLang } from '/src/utils/language'
import urlJoin from 'url-join'

const graphUrl = urlJoin(getBackendApi(), 'dashboard/{group}/{category}/')

function appendQueryParams(url, kwargs) {
  const params = new URLSearchParams()

  if (kwargs.subcategory) {
    params.set('subcategory', kwargs.subcategory)
  }
  if (kwargs.parent_pk !== undefined && kwargs.parent_pk !== null && kwargs.parent_pk !== '') {
    params.set('parent_pk', kwargs.parent_pk)
  }

  const query = params.toString()
  return query ? `${url}?${query}` : url
}

export function getDashboardData(kwargs) {
  return new Promise((resolve, reject) => {
    const url = appendQueryParams(
      graphUrl.replace('{group}', kwargs.group).replace('{category}', kwargs.category),
      kwargs,
    )
    request({
      url: url,
      data: {
        filters: kwargs.filters,
        search: kwargs.search,
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
