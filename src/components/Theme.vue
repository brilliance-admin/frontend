<template>
  <div class="settings-section">
    <v-label class="mb-2 font-weight-medium">{{ $t('themeSelection') }}</v-label>
    <div class="theme-grid">
      <div
        v-for="name in themeNames"
        :key="name"
        class="theme-swatch"
        :class="{ 'theme-swatch-active': currentTheme === name }"
        @click="currentTheme = name"
      >
        <div class="swatch-half swatch-left" :style="{ backgroundColor: getColor(name, 'primary') }" />
        <div class="swatch-half swatch-right" :style="{ backgroundColor: getColor(name, 'background') }" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useTheme } from 'vuetify'
import { getLocalSettings, setLocalSettings } from '/src/utils/settings'

const theme = useTheme()
const currentTheme = ref(theme.global.name.value)

const themeNames = [
  'blueLight', 'blueDark',
  'greenLight', 'greenDark',
  'deepPurpleLight', 'deepPurpleDark',
]

function getColor(name, key) {
  const t = theme.themes.value[name]
  if (!t) return undefined
  return t.colors[key]
}

watch(currentTheme, (newTheme) => {
  if (!newTheme) return
  theme.global.name.value = newTheme
  const settings = getLocalSettings()
  settings.theme = newTheme
  setLocalSettings(settings)
})
</script>
