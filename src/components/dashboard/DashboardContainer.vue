<template>
  <v-col
    :cols="componentData.cols || 12"
    :md="componentData.md"
    :sm="componentData.sm"
    :lg="componentData.lg"
    class="d-flex flex-column"
  >
    <v-row v-if="componentData.components" class="flex-grow-1 h-100">
      <template v-for="component in componentData.components" :key="component">
        <template v-if="component.component_type === 'container'">
          <DashboardContainer :component-data="component" />
        </template>
        <template v-else-if="component.component_type === 'chart'">
          <v-col cols="12">
            <Chart :chart-data="component" />
          </v-col>
        </template>
        <template v-else-if="component.component_type === 'period_graph'">
          <v-col cols="12" class="d-flex">
            <PeriodGraph :component-data="component" class="flex-grow-1" />
          </v-col>
        </template>
        <template v-else-if="component.component_type === 'small_graph'">
          <v-col cols="12" class="d-flex flex-grow-1">
            <SmallGraph :component-data="component" class="flex-grow-1" />
          </v-col>
        </template>
        <template v-else>
          <v-col cols="12">
            <p>Dashboard component "{{ component.component_type }}" is not supported</p>
          </v-col>
        </template>
      </template>
    </v-row>
  </v-col>
</template>

<script>
import Chart from '/src/components/dashboard/components/Chart.vue'
import SmallGraph from '/src/components/dashboard/components/SmallGraph.vue'
import PeriodGraph from '/src/components/dashboard/components/PeriodGraph.vue'

export default {
  name: 'DashboardContainer',
  props: {
    componentData: {type: Object, required: true},
  },
  components: {
    Chart,
    SmallGraph,
    PeriodGraph,
  },
  data() {
    return {
    }
  },
  created() {
  },
  methods: {
  },
}
</script>
