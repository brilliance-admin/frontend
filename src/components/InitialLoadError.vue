<template>
  <v-container fluid class="h-screen d-flex align-center justify-center">
    <v-alert
      prominent
      class="initial-load-error"
      type="error"
      variant="tonal"
      :title="title"
    >
      <div v-if="error.response" class="text-caption mb-2">HTTP {{ error.response.status }}</div>
      <div class="initial-load-error-message">{{ message }}</div>
      <p class="initial-load-error-help mt-4 mb-0">{{ $t('initialLoadErrorHelp') }}</p>
    </v-alert>
  </v-container>
</template>

<script>
export default {
  props: {
    error: { type: Object, required: true },
    title: { type: String, required: true },
  },
  computed: {
    message() {
      const data = this.error.response?.data
      if (data?.message) return data.message
      if (typeof data?.detail === 'string') return data.detail
      if (data?.code) return this.$t(data.code)
      if (data !== undefined) return typeof data === 'string' ? data : JSON.stringify(data)
      return this.error.message || this.$t('errorUnexpectedTitle')
    },
  },
}
</script>

<style scoped>
.initial-load-error {
  width: 100%;
  max-width: 640px;
}
.initial-load-error-message {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  max-height: 50dvh;
  overflow-y: auto;
}
.initial-load-error-help {
  white-space: pre-line;
}
</style>
