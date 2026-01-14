import request from '/src/utils/request'
import { config_dataset } from '/src/utils/settings'
import { getLang } from '/src/utils/language'
import urlJoin from 'url-join'

const graphUrl = urlJoin(config_dataset.backend_prefix, 'graph/{group}/{category}/')

export function getGraphData(kwargs) {
  return new Promise((resolve, reject) => {
    const url = graphUrl.replace('{group}', kwargs.group).replace('{category}', kwargs.category)
    request({
      url: url,
      data: {
        filters: kwargs.filters,
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
