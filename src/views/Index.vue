<template>
  <div class="index-page">
    <!-- твой контент или пусто -->
  </div>
</template>

<script>
import { getMainPage } from '/src/utils/router'

export default {
  props: {
    adminSchema: {type: Object, required: true},
    settings: {type: Object, required: true},
  },
  mounted() {
    const main_page = getMainPage(this.settings)
    if (main_page && main_page !== '/') {
      this.$router.replace(main_page)
    }
  },
  watch: {
    settings(val) {
      if (val?.main_page && val.main_page !== '/') {
        this.$router.replace(getMainPage(val))
      }
    }
  }
}
</script>
