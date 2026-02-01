<template>
  <v-card rounded="lg" class="pa-6 flex-grow-1 d-flex flex-column">
    <div class="d-flex align-center mb-2">
      <v-icon size="20" color="grey-darken-1" class="mr-2">{{ componentData.icon || 'mdi-wallet-outline' }}</v-icon>
      <span class="text-body-2 text-grey-darken-1">{{ componentData.title }}</span>
    </div>
    <div class="d-flex align-center mb-4">
      <span class="dashboard-value text-h5 font-weight-bold">{{ componentData.value }}</span>
      <v-chip
        v-if="componentData.change !== undefined"
        :color="componentData.change >= 0 ? 'success' : 'error'"
        variant="tonal"
        size="default"
        class="ml-3"
      >
        <v-icon start size="14">{{ componentData.change >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down' }}</v-icon>
        {{ Math.abs(componentData.change) }}%
      </v-chip>
    </div>
    <div class="chart-wrapper">
      <svg class="mini-chart" viewBox="0 0 300 60" preserveAspectRatio="none">
        <polyline
          fill="none"
          :stroke="componentData.line_color || 'rgb(var(--v-theme-primary))'"
          stroke-width="2"
          :points="chartPoints"
        />
      </svg>
      <div
        v-for="(point, index) in chartPointsData"
        :key="index"
        class="chart-point"
        :style="{
          left: point.percentX + '%',
          top: point.percentY + '%'
        }"
        @mouseenter="showTooltip(point)"
        @mouseleave="hideTooltip"
      >
        <div v-if="tooltip.index === index" class="chart-tooltip">
          {{ point.label }}: {{ point.value }}
        </div>
      </div>
    </div>
    <div class="d-flex justify-space-between text-caption text-grey">
      <span v-for="label in pointLabels" :key="label">{{ label }}</span>
    </div>
  </v-card>
</template>

<script>
export default {
  props: {
    componentData: { type: Object, required: true },
  },
  data() {
    return {
      tooltip: {
        index: null,
      },
    }
  },
  computed: {
    pointLabels() {
      return Object.keys(this.componentData.points || {})
    },
    pointValues() {
      return Object.values(this.componentData.points || {})
    },
    chartPoints() {
      return this.chartPointsData
        .map(p => `${p.x},${p.y}`)
        .join(' ')
    },
    chartPointsData() {
      const values = this.pointValues
      const labels = this.pointLabels
      if (!values.length) return []

      const maxY = Math.max(...values)
      const step = 300 / (values.length - 1)

      return values.map((val, i) => ({
        x: i * step,
        y: 60 - (val / maxY) * 50,
        percentX: (i / (values.length - 1)) * 100,
        percentY: ((60 - (val / maxY) * 50) / 60) * 100,
        value: val,
        label: labels[i],
      }))
    },
  },
  methods: {
    showTooltip(point) {
      this.tooltip.index = this.chartPointsData.indexOf(point)
    },
    hideTooltip() {
      this.tooltip.index = null
    },
  },
}
</script>
