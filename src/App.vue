<template>
  <router-view />
</template>

<script setup>
import { watch } from 'vue'
import { useTheme } from 'vuetify'
import { applyThemeStylesheet } from '/src/styles/themes'

const theme = useTheme()
watch(() => theme.global.name.value, applyThemeStylesheet, { immediate: true })
</script>
