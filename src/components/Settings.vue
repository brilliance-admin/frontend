<template>

  <v-navigation-drawer
    class="settings-container"
    v-model="drawer"
    location="right"
    hide-overlay
    temporary
    width="300"
    :touchless="true"
  >
    <Theme/>

    <div class="settings-section">
      <v-label class="mb-2 font-weight-medium">{{ $t('tinyMCETheme') }}</v-label>

      <v-select :value="tinyMCETheme" :items="getTinymcethemes()" @update:modelValue="changeTinymcetheme"></v-select>
    </div>


    <template v-slot:append>
      <div class="settings-append">
        <v-label>Version:</v-label> {{ getConfig().version }}
      </div>

      <div class="settings-append text-caption" v-if="description">
        <p v-if="description" v-html="description"></p>
      </div>
    </template>

  </v-navigation-drawer>

</template>

<script>
import { getLocalSettings, setLocalSettings, tinyMCEThemes, getTinyMCETheme } from '/src/utils/settings'
import { config_dataset } from '/src/utils/settings'
import Theme from '/src/components/Theme.vue'

export default {
  components: {
    Theme,
  },
  props: {
    settings: { type: Object, required: true },
  },
  data(props) {
    return {
      drawer: null,
      tinyMCETheme: getTinyMCETheme(),
    }
  },
  created() {
  },
  computed: {
    description() {
      return this.settings?.description
    },
  },
  methods: {
    getTinymcethemes() {
      return tinyMCEThemes
    },
    toggle() {
      this.drawer = !this.drawer
    },
    getConfig() {
      return config_dataset
    },
    changeTinymcetheme(value) {
      let settings = getLocalSettings()
      settings.tinyMCETheme = value
      setLocalSettings(settings)
      this.emitter.emit("settings-changed", settings);
    },
  },
}
</script>
