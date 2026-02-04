<template>
  <v-app>

    <v-main class="login-page">
      <Settings ref="settings" :settings="settings"/>

      <v-container fluid class="fill-height gradient-bg">

        <v-row>

          <v-col class="d-flex justify-center">

            <Loader v-if="settingsLoading"/>

            <v-card
              class="login-window"
              v-if="settings"
            >

              <div class="top-right-icon">
                <template v-if="settings && settings.languages">
                  <Language :langs="settings.languages"/>
                </template>
                <v-btn icon @click.native="$refs.settings.toggle()"><v-icon>mdi-cog-outline</v-icon></v-btn>
              </div>

              <template v-slot:title>
                <v-row justify="center" no-gutters>
                  <v-img
                    class="project-logo"
                    :alt="getTitle()"
                    :src="getLogo()"
                    v-if="getLogo()"
                    max-width="250"
                    :eager="true"
                  />
                  <span class="login-title" v-else>{{ getTitle() }}</span>
                </v-row>
              </template>

              <v-card-text class="bg-surface-light pt-4">

                <template v-if="getDescription()">
                    <v-alert
                      class="login-description"
                      color="primary"
                      variant="tonal"
                      border="start"
                    >
                      <p v-html="getDescription()"></p>
                    </v-alert>
                </template>

                <v-form class="login-form" ref="loginForm" validate-on="submit">
                  <v-text-field
                    density="default"
                    :hideDetails="false"
                    :loading="loading"
                    :disabled="loading"

                    v-model="username"
                    :rules="[rules.required, rules.min_length(5)]"
                    :label="$t('username')"
                    required
                    @keydown.enter.prevent="login"
                  ></v-text-field>
                  <v-text-field
                    density="default"
                    :hideDetails="false"
                    :disabled="loading"

                    v-model="password"
                    :rules="[rules.required, rules.min_length(5)]"
                    :label="$t('password')"
                    :type="show ? 'text' : 'password'"
                    :append-icon="show ? 'mdi-eye' : 'mdi-eye-off'"
                    required
                    @click:append="show = !show"
                    @keydown.enter.prevent="login"
                  ></v-text-field>
                </v-form>

                <v-card
                  color="primary"
                  variant="outlined"
                  class="mx-auto login-description"
                  v-if="getLoginGreetingsMessage()"
                >
                  <v-card-item>
                    <div v-html="getLoginGreetingsMessage()">
                    </div>
                  </v-card-item>
                </v-card>

                <v-row justify="end" no-gutters>
                  <v-btn @click="login" :disabled="loading">{{  $t('login') }}</v-btn>
                </v-row>

              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

      </v-container>

    </v-main>
  </v-app>
</template>

<script>
import { getSettings } from '/src/api/settings'
import { createRules } from '/src/utils/validationRules'
import { login } from '/src/api/user'
import { config_dataset } from '/src/utils/settings'

import Settings from '/src/components/Settings.vue'
import Language from '/src/components/Language.vue'
import Loader from '/src/components/Loader.vue'

export default {
  data () {
    return {
      rules: {},
      username: '',
      password: '',
      show: false,
      loading: false,
      settingsLoading: true,
    }
  },
  watch: {
    $route: {
      immediate: true,
      handler(to, from) {
        document.title = `${this.$t('login')} | Admin Panel`
      }
    },
  },
  async created() {
    this.rules = createRules(this.$t)

    this.settingsLoading = true

    getSettings().then(settings => {
      this.settingsLoading = false
      this.settings = settings

    }).catch(error => {
      this.settingsLoading = false
      console.error('Get admin settings error:', error)

      const errorResult = this.$handleError(error)
      if (errorResult.fieldErrors) {
        this.$refs.fieldscontainer.updateErrors(errorResult.fieldErrors)
      }
      if (errorResult.persistentMessage) {
        this.persistentMessageDialog = true
        this.persistentMessage = errorResult.persistentMessage
      }
    })
  },
  methods: {
    getLogo() {
      return config_dataset.logo_image
    },
    getTitle() {
      return this.settings.title
    },
    getLoginGreetingsMessage() {
      return this.settings.login_greetings_message
    },
    getDescription() {
      return this.settings.description
    },
    async login() {
      const isValid = await this.$refs.loginForm.validate()
      if (!isValid.valid) return

      this.loading = true
      login(this.username, this.password).then(() => {
        this.$router.push(this.settings.main_page || '/')
        this.loading = false
      }).catch(error => {
        this.loading = false
        const errorResult = this.$handleError(error)
        if (errorResult.persistentMessage) {
          this.persistentMessage = errorResult.persistentMessage
        }
      })
    },
  },
}
</script>
