<template>
  <div>
    <v-dialog v-model="actionDialogConfirmation" max-width="500">
      <v-card :disabled="actionLoading" :loading="actionLoading">
        <v-card-title class="d-flex justify-space-between align-center">
          <span>{{ $t('confirmation') }}: {{ getActionTitle() }}</span>

          <v-btn
            icon="mdi-close"
            variant="text"
            density="compact"
            @click="actionDialogConfirmation = false"
          />
        </v-card-title>

        <v-card-text>
          <div class="confirmation-text">{{ getActionInfo().confirmation_text }}</div>
          <v-label class="info selected-warning-count">
            {{ $t('selected') }}
            <p class="selected-count">{{ getSelectedCount() }}/{{ actionContext.totalCount || 0 }}</p>
          </v-label>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn
            :text="$t('cancel')"
            variant="elevated"
            @click="actionDialogConfirmation = false"
            :disabled="actionLoading"
          />
          <v-btn
            :text="$t('confirm')"
            variant="tonal"
            color="primary"
            @click="applyAction"
            :disabled="actionLoading"
          />
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog persistent v-model="actionFormDialogOpen" class="action-form-dialog">
      <v-card :disabled="actionLoading" :loading="actionLoading">
        <v-card-title class="d-flex justify-space-between align-center">
          <span>{{ getActionTitle() }}</span>

          <v-btn
            icon="mdi-close"
            variant="text"
            density="compact"
            @click="actionFormDialogOpen = false"
          />
        </v-card-title>

        <div class="action-description" v-html="getActionInfo().description"></div>

        <div v-on:keydown.enter.prevent="applyAction">
          <FieldsContainer
            ref="actionFieldsContainer"
            formType="create"
            :table-schema="getActionInfo().form_schema"
            :loading="actionLoading"
            @changed="value => actionFormData = value"
          />
        </div>

        <v-card-actions>
          <v-spacer />
          <v-btn
            :text="$t('cancel')"
            variant="elevated"
            @click="actionFormDialogOpen = false"
            :disabled="actionLoading"
          />
          <v-btn
            :text="$t('send')"
            variant="tonal"
            color="primary"
            @click="applyAction"
            :disabled="actionLoading"
          />
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="persistentMessageDialog" class="persistent-message-dialog">
      <v-card>
        <v-card-text v-html="persistentMessage"></v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn :text="$t('close')" variant="elevated" @click="persistentMessageDialog = false" />
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import moment from 'moment'
import { toast } from "vue3-toastify"
import { sendTableAction, downloadContent } from '/src/api/table'
import { CategorySchema } from '/src/api/schema'
import FieldsContainer from '/src/components/table/FieldsContainer.vue'

export default {
  props: {
    categorySchema: {type: CategorySchema, required: true},
    parentPk: {type: [String, Number], required: false},
  },
  components: {
    FieldsContainer,
  },
  emits: ['success', 'error', 'finished'],
  expose: ['run'],
  data() {
    return {
      actionDialogConfirmation: false,
      actionFormDialogOpen: false,
      actionLoading: false,
      actionSelected: null,
      actionInfo: null,
      actionFormData: null,
      actionContext: {
        pks: [],
        sendToAll: false,
        filters: {},
        search: null,
        totalCount: 0,
      },

      persistentMessageDialog: false,
      persistentMessage: null,
    }
  },
  methods: {
    run({actionKey, actionInfo, pks = [], sendToAll = false, filters = {}, search = null, totalCount = 0}) {
      if (!actionKey) {
        throw new Error('actionKey is required')
      }
      if (!actionInfo) {
        throw new Error('actionInfo is required')
      }

      if (!actionInfo.allow_empty_selection && !sendToAll && pks.length === 0) {
        toast(this.$t('actionNotAllowEmptySelection'), {
          limit: 3,
          theme: 'auto',
          type: 'warning',
          position: 'top-center',
        })
        return
      }

      this.actionSelected = actionKey
      this.actionInfo = actionInfo
      this.actionFormData = null
      this.actionContext = {
        pks,
        sendToAll,
        filters,
        search,
        totalCount,
      }

      if (this.$refs.actionFieldsContainer) {
        this.$refs.actionFieldsContainer.updateErrors({})
      }

      if (actionInfo.form_schema) {
        this.actionFormDialogOpen = true
        return
      }

      if (actionInfo.confirmation_text) {
        this.actionDialogConfirmation = true
        return
      }

      this.applyAction()
    },
    getActionInfo() {
      if (!this.actionInfo) {
        throw new Error('Action info is not set')
      }
      return this.actionInfo
    },
    getActionTitle() {
      return this.getActionInfo().title || this.actionSelected
    },
    getSelectedCount() {
      if (this.actionContext.sendToAll) {
        return this.actionContext.totalCount || 0
      }
      return this.actionContext.pks.length
    },
    closeActionDialogs() {
      this.actionDialogConfirmation = false
      this.actionFormDialogOpen = false
    },
    applyAction() {
      this.actionLoading = true
      sendTableAction({
        group: this.categorySchema.group,
        category: this.categorySchema.category,
        subcategory: this.categorySchema.subcategory,
        parent_pk: this.parentPk,
        action: this.actionSelected,
        pks: this.actionContext.pks,
        formData: this.actionFormData || {},
        sendToAll: this.actionContext.sendToAll,
        filters: this.actionContext.filters,
        search: this.actionContext.search,
      }).then(response => {
        if (response.headers['content-type'] !== 'application/json') {
          const fileName = response.headers['pragma'] || `${moment().format('DD.MM.YYYY_HH:MM')}.csv`
          downloadContent(response.data, fileName, response.headers['content-type'])
        } else if (response.data.message && typeof response.data.message === 'object') {
          toast(response.data.message.text, {
            type: response.data.message.type,
            position: response.data.message.position,
            dangerouslyHTMLString: true,
          })
        } else if (response.data.message && typeof response.data.message === 'string') {
          toast(response.data.message, {
            type: 'success',
            position: 'top-center',
          })
        } else if (response.data.persistent_message) {
          this.persistentMessageDialog = true
          this.persistentMessage = response.data.persistent_message
        } else {
          toast(this.$t('successAdminAction'))
        }

        this.closeActionDialogs()
        this.actionLoading = false
        this.$emit('success', {
          actionKey: this.actionSelected,
          response,
        })
        this.$emit('finished')
      }).catch(error => {
        this.actionLoading = false
        console.error(`Admin action ${this.actionSelected} error:`, error)

        const errorResult = this.$handleError(error, this.$t('errorTitles.runAction'))
        if (errorResult.fieldErrors && this.$refs.actionFieldsContainer) {
          this.$refs.actionFieldsContainer.updateErrors(errorResult.fieldErrors)
        }
        if (errorResult.persistentMessage) {
          this.persistentMessageDialog = true
          this.persistentMessage = errorResult.persistentMessage
        }

        this.$emit('error', {
          actionKey: this.actionSelected,
          error,
          errorResult,
        })
        this.$emit('finished')
      })
    },
  },
}
</script>
