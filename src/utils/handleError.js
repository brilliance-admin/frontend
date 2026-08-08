import { h } from "vue"
import { toast } from "vue3-toastify"

export function createHandleError(t) {
  return function handleError(error, topMessage = null) {
    const errorUrl = error?.config?.url
    if (errorUrl) {
      console.error(`API error url=${errorUrl}`)
    } else {
      console.error(`Error: ${error?.message || String(error)}`)
    }

    const buildErrorMessage = (status, errorText) => {
      return t('errorMessage', {
        'title': topMessage ?? t('errorUnexpectedTitle'),
        'status': status,
        'errorText': errorText,
      })
    }

    const copyText = async (event, fallbackText) => {
      event.stopPropagation()
      await navigator.clipboard.writeText(fallbackText)
    }

    const normalizeTracebackText = text => {
      return String(text)
        .replaceAll('\\n', '\n')
        .replace(/\n{2,}/g, '\n')
    }

    const formatToastText = (text, asHtml = false) => {
      const lines = text.split('\n')
      if (lines.length <= 15) {
        return asHtml ? lines.join('<br>') : text
      }

      const hiddenLinesCount = lines.length - 14
      const moreText = `... ${hiddenLinesCount} more ...`
      const moreLine = asHtml
        ? `<div style="text-align: center; font-weight: 700; white-space: nowrap;">${moreText}</div>`
        : moreText

      if (asHtml) {
        return [
          lines.slice(0, 7).join('<br>'),
          moreLine,
          lines.slice(-7).join('<br>'),
        ].join('')
      }

      return [
        ...lines.slice(0, 7),
        moreLine,
        ...lines.slice(-7),
      ].join('\n')
    }

    const showToast = (message, options) => {
      const { dangerouslyHTMLString = false, skipFormat = false, ...toastOptions } = options
      const text = String(message)
      const displayText = skipFormat
        ? (dangerouslyHTMLString ? text.split('\n').join('<br>') : text)
        : formatToastText(text, dangerouslyHTMLString)
      const content = dangerouslyHTMLString
        ? h('div', { innerHTML: displayText })
        : h('span', displayText)

      toast(content, toastOptions)
    }

    const showCopyableServerErrorToast = (message, sourceText, options) => {
      const content = h('div', [
        h('div', { innerHTML: String(message).split('\n').join('<br>') }),
        h('div', {
          class: 'toast-copy-text',
          style: {
            fontWeight: 700,
            marginTop: '8px',
          },
          onClick: event => copyText(event, sourceText),
        }, t('copyErrorText')),
      ])

      toast(content, options)
    }

    if (!error?.response) {
      showToast(
        buildErrorMessage('-', String(error)),
        { type: "error", position: "top-center", dangerouslyHTMLString: true }
      )
      return {}
    }

    const { status, data } = error.response

    if (status === 422 && Array.isArray(data?.detail)) {
      const messages = data.detail.map(err => {
        const field = err.loc?.slice(1).join('.')
        return field ? `${field}: ${err.msg}` : err.msg
      })

      showToast(t('validationErrors', {'errors': messages.join('\n')}), {
        theme: "auto",
        type: "error",
        position: "top-center",
      })
    }
    else if (status >= 400 && status < 500) {
      let message = data?.message || data?.detail
      if (message) {
        showToast(message, { theme: "auto", type: "error", position: "top-center" })
      }
      else if (data?.code) {
        showToast(t(data.code), { theme: "auto", type: "error", position: "top-center" })
      }
      else {
        showToast(JSON.stringify(data), { theme: "auto", type: "error", position: "top-center" })
      }
    }

    if (status >= 500) {
      let message = data?.message || data?.detail
      const sourceText = String(message ?? JSON.stringify(data))
      const errorText = normalizeTracebackText(sourceText)
      const formattedErrorText = `<div style="white-space: pre-wrap; overflow-wrap: anywhere; text-align: left;">${formatToastText(errorText, true)}</div>`
      console.error('Error:', message ?? JSON.stringify(data))
      showCopyableServerErrorToast(
        buildErrorMessage(status, formattedErrorText),
        sourceText,
        { type: "error", position: "top-center" }
      )
    }
    return {
      persistentMessage: error.response.data.persistent_message,
      fieldErrors: error.response.data.field_errors,
    }
  }
}
