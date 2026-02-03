<template>
  <div class="index-page">
    <!-- твой контент или пусто -->
  </div>
</template>

<script>
export default {
  props: {
    adminSchema: {type: Object, required: true},
    settings: {type: Object, required: true},
  },
  mounted() {
    if (this.settings?.main_page && this.settings.main_page !== '/') {
      this.$router.replace(this.settings.main_page)
    }
  },
  watch: {
    settings(val) {
      if (val?.main_page && val.main_page !== '/') {
        this.$router.replace(val.main_page)
      }
    }
  }
}
</script>
