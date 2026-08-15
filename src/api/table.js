import request from '/src/utils/request'
import { config_dataset, getBackendApi } from '/src/utils/settings'
import { getLang } from '/src/utils/language'
import urlJoin from 'url-join'

const tableDataListUrl = urlJoin(getBackendApi(), 'table/{group}/{category}/list/')
const tableDataRetriveUrl = urlJoin(getBackendApi(), 'table/{group}/{category}/retrieve/{pk}/')
const tableDataCreateUrl = urlJoin(getBackendApi(), 'table/{group}/{category}/create/')
const tableDataUpdateUrl = urlJoin(getBackendApi(), 'table/{group}/{category}/update/{pk}/')
const tableDataActionUrl = urlJoin(getBackendApi(), 'table/{group}/{category}/action/{action}/')

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

function getDebugCategory(kwargs) {
  if (kwargs.subcategory) {
    return `${kwargs.group}/${kwargs.category}/${kwargs.subcategory}`
  }
  return `${kwargs.group}/${kwargs.category}`
}

function logDebugInfo(action, kwargs, data) {
  const debugInfo = data?.debug_info
  if (!debugInfo) return

  const category = getDebugCategory(kwargs)
  const serializeText = debugInfo.serialize_ms !== null && debugInfo.serialize_ms !== undefined
    ? ` (serialize: ${debugInfo.serialize_ms}ms)`
    : ''
  console.log(`${action} ${category} SQL query count: ${debugInfo.db_query_count}${serializeText}`)
  for (const query of debugInfo.queries || []) {
    console.log(`${action} ${category} [${query.time_ms}ms] SQL: ${query.sql}`)
  }
}

export function getDataList(kwargs) {
  return new Promise((resolve, reject) => {
    const pageInfo = kwargs.pageInfo || {}
    let url = tableDataListUrl.replace('{group}', kwargs.group).replace('{category}', kwargs.category)
    url = appendQueryParams(url, kwargs)
    request({
      url: url,
      method: 'post',
      data: {
        ordering: kwargs.ordering,
        search: kwargs.search,
        filters: kwargs.filters,
        inline_action: kwargs.inline_action || false,
        page: pageInfo.page,
        limit: pageInfo.limit,
      },
      headers: {
        'Accept-Language': getLang(),
        'Cache-Control': 'no-cache',
      },
      timeout: config_dataset.api_timeout_ms,
    }).then(response => {
      logDebugInfo('List', kwargs, response.data)
      resolve(response.data)
    }).catch(error => reject(error))
  })
}

export function getTableCreate(kwargs) {
  return new Promise((resolve, reject) => {
    let url = tableDataCreateUrl.replace('{group}', kwargs.group).replace('{category}', kwargs.category)
    url = appendQueryParams(url, kwargs)
    request({
      url: url,
      method: 'post',
      data: kwargs.data,
      timeout: config_dataset.api_timeout_ms,
      headers: {
        'Accept-Language': getLang(),
        'Cache-Control': 'no-cache',
      },
    }).then(response => {
      logDebugInfo('Create', kwargs, response.data)
      resolve(response)
    }).catch(error => reject(error))
  })
}

export function getTableRetrieve(kwargs) {
  return new Promise((resolve, reject) => {
    let url = tableDataRetriveUrl.replace('{group}', kwargs.group).replace('{category}', kwargs.category).replace('{pk}', kwargs.pk)
    url = appendQueryParams(url, kwargs)
    request({
      url: url,
      method: 'post',
      timeout: config_dataset.api_timeout_ms,
      headers: {
        'Accept-Language': getLang(),
        'Cache-Control': 'no-cache',
      },
    }).then(response => {
      logDebugInfo('Retrieve', kwargs, response.data)
      resolve(response)
    }).catch(error => reject(error))
  })
}

export function downloadContent(data, fileName, type) {
  const eElelent = document.createEvent('MouseEvents')
  const aElement = document.createElement('a')
  aElement.download = fileName
  const blob = new Blob([data], {type: type})
  aElement.href = window.URL.createObjectURL(blob)
  aElement.dataset.downloadurl = [type, aElement.download, aElement.href].join(':')
  eElelent.initEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
  aElement.dispatchEvent(eElelent)
}

export async function sendTableUpdate(kwargs) {
  return new Promise((resolve, reject) => {
    let url = tableDataUpdateUrl.replace('{group}', kwargs.group).replace('{category}', kwargs.category).replace('{pk}', kwargs.pk)
    url = appendQueryParams(url, kwargs)
    request({
      url: url,
      method: 'patch',
      data: kwargs.data,
      headers: {
        'Accept-Language': getLang(),
        'Cache-Control': 'no-cache',
      },
      timeout: config_dataset.api_timeout_ms,
    }).then(response => {
      logDebugInfo('Update', kwargs, response.data)
      resolve(response)
    }).catch(error => {
      reject(error)
    })
  })
}


export async function sendTableAction(kwargs) {
  return new Promise((resolve, reject) => {
    console.log(`${kwargs.group}.${kwargs.category} Action "${kwargs.action}"`)
    let url = tableDataActionUrl.replace('{group}', kwargs.group).replace('{category}', kwargs.category).replace('{action}', kwargs.action)
    url = appendQueryParams(url, kwargs)
    request({
      url: url,
      method: 'post',
      data: {
        pks: kwargs.pks,
        form_data: kwargs.formData,

        filters: kwargs.filters,
        search: kwargs.search,

        send_to_all: kwargs.sendToAll,
      },
      headers: {
        'Accept-Language': getLang(),
        'Cache-Control': 'no-cache',
      },
      timeout: config_dataset.api_timeout_ms,
    }).then(response => {
      resolve(response)
    }).catch(error => {
      reject(error)
    })
  })
}
