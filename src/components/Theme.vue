<template>
  <div class="settings-section">
    <v-label class="mb-2 font-weight-medium">{{ $t('themeSelection') }}</v-label>
    <div class="theme-grid">
      <div
        v-for="name in getThemeList()"
        :key="name"
        :title="name"
        class="theme-switch"
        :class="{ 'theme-switch-active': currentTheme === name }"
        @click="currentTheme = name"
      >
        <div class="switch-half switch-left" :style="{ backgroundColor: getColor(name, 'primary') }" />
        <div class="switch-half switch-right" :style="{ backgroundColor: getColor(name, 'background') }" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useTheme } from 'vuetify'
import { getLocalSettings, setLocalSettings } from '/src/utils/settings'
import { getThemes, getThemeList } from '/src/styles/themes'

const theme = useTheme()
const currentTheme = ref(theme.global.name.value)
const previewThemes = getThemes()

function getColor(name, key) {
  const t = previewThemes[name]
  if (!t) return undefined
  if (key === 'background') {
    return t.colors.background ?? (t.dark ? '#121212' : '#FFFFFF')
  }
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
