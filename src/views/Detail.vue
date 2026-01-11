<template>
  <FormUpdate :admin-schema="adminSchema" :category-schema="categorySchema" :pk="pk" @closed="updateClosed"/>
</template>

<script>
import { categoryUrl } from '/src/api/schema'
import FormUpdate from '/src/components/table/FormUpdate.vue'

export default {
  props: {
    adminSchema: {type: Object, required: true},
    settings: {type: Object, required: true},

    group: {type: String, required: true},
    category: {type: String, required: true},
    pk: {type: String, required: false},
  },
  components: {
    FormUpdate,
  },
  data() {
    return {
      categorySchema: null,
    }
  },
  created() {
    this.categorySchema = this.adminSchema.get_category(this.group, this.category)
    if (!this.categorySchema.getTableInfo().can_retrieve) {
      console.error(`Page retrieve "${this.group}.${this.category}" is not found`)
      this.$router.push({ path: '/404' })
      return
    }
  },
  watch: {
    $route: {
      immediate: true,
      handler(to, from) {
        const categorySchema = this.adminSchema.get_category(this.group, this.category)
        document.title = `${categorySchema.title} #${this.pk} | ${this.settings?.title}`
      }
    },
  },
  methods: {
    updateClosed() {
        const url = categoryUrl(this.categorySchema.group, this.categorySchema.category)
        this.$router.push({ path: url } )
    }
  },
}
</script>
