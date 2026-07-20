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
    const main_page = this.settings?.main_page || "/navigation";
    if (main_page && main_page !== '/') {
      this.$router.replace(main_page)
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
