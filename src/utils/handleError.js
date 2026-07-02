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

    if (!error?.response) {
      toast(
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

      toast(t('validationErrors', {'errors': messages.join('\n')}), {
        theme: "auto",
        type: "error",
        position: "top-center",
      })
    }
    else if (status >= 400 && status < 500) {
      let message = data?.message || data?.detail
      if (message) {
        toast(message, { theme: "auto", type: "error", position: "top-center" })
      }
      else if (data?.code) {
        toast(t(data.code), { theme: "auto", type: "error", position: "top-center" })
      }
      else {
        toast(JSON.stringify(data), { theme: "auto", type: "error", position: "top-center" })
      }
    }

    if (status >= 500) {
      let message = data?.message || data?.detail
      console.error('Error:', message ?? JSON.stringify(data))
      toast(
        buildErrorMessage(status, message ?? JSON.stringify(data)),
        { type: "error", position: "top-center", dangerouslyHTMLString: true }
      )
    }
    return {
      persistentMessage: error.response.data.persistent_message,
      fieldErrors: error.response.data.field_errors,
    }
  }
}
