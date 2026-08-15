import request from '/src/utils/request'
import { getLang, setLang } from '/src/utils/language'
import { config_dataset, getBackendApi } from '/src/utils/settings'
import urlJoin from 'url-join'

const loginUrl = urlJoin(getBackendApi(), 'get-settings/')

export async function getSettings() {
  return await new Promise((resolve, reject) => {
    request({
      url: loginUrl,
      method: 'post',
      headers: {
        'Accept-Language': getLang(),
      },
      timeout: config_dataset.api_timeout_ms,
    }).then(response => {

      // Установка языка по умолчанию или сброс если его нет в списке
      if (response.data.languages) {
        const langs = Object.keys(response.data.languages)
        const current = getLang()
        if (!current || !langs.includes(current)) {
          if (langs.length > 0) {
            setLang(langs[0])
          } else {
            setLang(null)
          }
        }
      } else {
        setLang(null)
      }

      resolve(response.data)
    }).catch(error => {
      reject(error)
    })
  })
}
