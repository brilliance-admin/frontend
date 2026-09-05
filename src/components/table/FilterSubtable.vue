<template>
  <v-card class="filter-subtable">
    <v-card-title class="filter-subtable__header">
      <span>{{ field.label }}</span>
      <div class="filter-subtable__controls">
        <v-btn-toggle v-model="unit" mandatory density="compact" variant="outlined" divided>
          <v-btn value="10min" density="compact">10 min</v-btn>
          <v-btn value="1hour" density="compact">1 hour</v-btn>
          <v-btn value="1day" density="compact">1 day</v-btn>
        </v-btn-toggle>
        <v-btn
          class="filter-subtable__refresh"
          icon
          color="secondary"
          density="compact"
          @click="$emit('refresh')"
        >
          <v-icon icon="mdi-refresh" />
        </v-btn>
      </div>
      <div class="filter-subtable__actions">
        <v-btn
          icon="mdi-close"
          density="compact"
          variant="text"
          @click="$emit('close')"
        />
      </div>
    </v-card-title>
    <v-card-text>
      <div v-if="loading" class="filter-subtable__placeholder">
        <v-progress-circular indeterminate color="primary" />
      </div>
      <Chart v-else-if="chart" :chart-data="chartData" />
      <div v-else-if="hasRange" class="filter-subtable__placeholder">
        {{ $t('filterSubtable.applyFilter') }}
      </div>
      <div v-else class="filter-subtable__placeholder">
        {{ $t('filterSubtable.selectRange') }}
      </div>
      <slot :field="field" :field-slug="fieldSlug" />
    </v-card-text>
  </v-card>
</template>

<script>
import Chart from '/src/components/dashboard/components/Chart.vue'

export default {
  components: {
    Chart,
  },
  props: {
    field: {type: Object, required: true},
    fieldSlug: {type: String, required: true},
    value: {type: Object, required: false},
    chart: {type: Object, required: false},
    loading: {type: Boolean, required: true},
  },
  emits: ['changed', 'close', 'refresh', 'unit-changed'],
  data() {
    return {
      unit: '1hour',
    }
  },
  computed: {
    hasRange() {
      return this.value?.from !== undefined && this.value?.to !== undefined
    },
    chartData() {
      const labels = this.chart.data.labels
      return {
        ...this.chart,
        data: {
          ...this.chart.data,
          datasets: this.chart.data.datasets.map(dataset => ({
            backgroundColor: 'primary',
            ...dataset,
          })),
        },
        options: {
          ...this.chart.options,
          maintainAspectRatio: false,
          plugins: {
            ...this.chart.options?.plugins,
            legend: {display: false, ...this.chart.options?.plugins?.legend},
            zoom: {
              ...this.chart.options?.plugins?.zoom,
              limits: {
                x: {min: 0, max: labels.length - 1, minRange: 1},
              },
              zoom: {
                drag: {
                  enabled: true,
                  backgroundColor: 'rgba(25, 118, 210, 0.2)',
                  borderColor: 'rgb(25, 118, 210)',
                  borderWidth: 1,
                },
                mode: 'x',
                onZoomComplete: ({chart}) => this.updateRange(chart),
              },
            },
          },
        },
      }
    },
  },
  watch: {
    unit(value) {
      this.$emit('unit-changed', value)
    },
  },
  methods: {
    updateRange(chart) {
      const min = Math.max(0, Math.ceil(chart.scales.x.min))
      const labels = this.chart.data.labels
      const max = Math.min(labels.length - 1, Math.floor(chart.scales.x.max))

      this.$emit('changed', {
        from: labels[min],
        to: labels[max],
      })
    },
  },
}
</script>
