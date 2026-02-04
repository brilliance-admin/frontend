import { toast } from "vue3-toastify"

export function createHandleError(t) {
    return function handleError(error) {
        console.error(`API error url=${error.config.url}`)
        console.error(error)

        if (!error?.response) {
            toast(
                t('errorMessage', {'status': '-', 'errorText': String(error)}),
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
            if (data?.message) {
                toast(data.message, { theme: "auto", type: "error", position: "top-center" })
            }
            else if (data?.code) {
                toast(t(data.code), { theme: "auto", type: "error", position: "top-center" })
            }
            else {
                toast(String(data), { theme: "auto", type: "error", position: "top-center" })
            }
        }

        if (status >= 500) {
            console.error('Error:', data?.message ?? String(data))
            toast(
                t('errorMessage', {'status': status, 'errorText': data?.message ?? String(data)}),
                { type: "error", position: "top-center", dangerouslyHTMLString: true }
            )
        }
        return {
            persistentMessage: error.response.data.persistent_message,
            fieldErrors: error.response.data.field_errors,
        }
    }
}
