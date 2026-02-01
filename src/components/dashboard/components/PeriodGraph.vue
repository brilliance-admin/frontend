<template>
  <v-card rounded="lg" class="pa-6 flex-grow-1 d-flex flex-column">
    <div class="d-flex align-center justify-space-between mb-4">
      <div class="d-flex align-center">
        <v-icon size="20" color="grey-darken-1" class="mr-2">{{ componentData.icon || 'mdi-chart-line' }}</v-icon>
        <span class="text-body-2 text-grey-darken-1">{{ componentData.title }}</span>
      </div>
    </div>

    <div class="d-flex align-center mb-4">
      <span class="text-h4 font-weight-bold">{{ componentData.value }}</span>
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

    <v-row class="mb-6" v-if="componentData.subcards?.length">
      <v-col v-for="(subcard, index) in componentData.subcards" :key="index" cols="6">
        <v-card variant="elevated" rounded="lg" class="bar-subtag pa-4">
          <div class="d-flex align-center mb-1">
            <div class="legend-dot mr-2" :style="{ backgroundColor: subcard.color || colors[index] }"></div>
            <span class="text-body-2 text-grey-darken-1">{{ subcard.title }}</span>
          </div>
          <span class="text-h6 font-weight-medium">{{ subcard.value }}</span>
        </v-card>
      </v-col>
    </v-row>

    <!-- Bar Chart -->
    <div class="chart-container flex-grow-1">
      <div class="chart-y-axis">
        <span v-for="label in componentData.vertical" :key="label">{{ label }}</span>
      </div>
      <div class="chart-bars">
        <div v-for="(item, index) in chartData" :key="index" class="bar-group">
          <div class="bars">
            <v-tooltip
              v-for="(bar, barIndex) in item.bars"
              :key="barIndex"
              location="top"
            >
              <template v-slot:activator="{ props }">
                <div
                  v-bind="props"
                  class="bar"
                  :style="{ height: bar.height + '%', backgroundColor: bar.color || colors[barIndex] }"
                ></div>
              </template>
              {{ bar.value }}
            </v-tooltip>
          </div>
          <span class="day-label">{{ item.label }}</span>
        </div>
      </div>
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
      viewMode: 'sum',
      colors: ['#4CAF50', '#1976D2', '#FF9800', '#E91E63'],
    }
  },
  computed: {
    chartData() {
      const values = this.componentData.values || []
      const horizontal = this.componentData.horizontal || []

      // Находим максимум для расчёта процентов
      const allValues = values.flat()
      const maxValue = Math.max(...allValues)

      return values.map((bars, index) => ({
        label: horizontal[index] || '',
        bars: Array.isArray(bars)
            ? bars.map((val, i) => ({
              height: (val / maxValue) * 100,
              value: val,
              color: this.colors[i]
            }))
            : [{
              height: (bars / maxValue) * 100,
              value: bars,
              color: this.colors[0]
            }]
      }))
    },
  },
}
</script>
