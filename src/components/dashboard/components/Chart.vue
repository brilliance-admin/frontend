<template>
  <component
    :is="getComponent(chartData)"

    :options="chartData.options"
    :data="chartData.data"
    :width="chartData.width"
    :height="chartData.height"

    :fill="chartData.fill"
    :pointBorderColor="chartData.pointBorderColor"
    :borderColor="chartData.borderColor"
    :backgroundColor="chartData.backgroundColor"
    :pointBorderWidth="chartData.pointBorderWidth"
    :tension="chartData.tension"
    :borderWidth="chartData.borderWidth"
  />
</template>

<script>
import { toast } from "vue3-toastify"
import { Line as ChartLine, Bar, Bubble, Doughnut, Pie, PolarArea, Radar, Scatter } from "vue-chartjs";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  LinearScale,
  CategoryScale,
  PointElement,
  Filler,
  BarElement,
} from "chart.js";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  LinearScale,
  CategoryScale,
  PointElement,
  Filler,
  BarElement,
);

const CHART_TYPES = {
  line: ChartLine,
  bar: Bar,
  bubble: Bubble,
  doughnut: Doughnut,
  pie: Pie,
  polararea: PolarArea,
  radar: Radar,
  scatter: Scatter,
}

export default {
  props: {
    chartData: {type: Object, required: true},
  },
  components: {
  },
  data() {
  },
  created() {
  },
  methods: {
    getComponent(chartData) {
      const chart_type = CHART_TYPES[chartData.type]
      if (chart_type) return chart_type

      const message = `Inline type "${chartData.type}" not found`
      toast(message, {
        "theme": "auto",
        "type": "error",
        "position": "top-center",
        "dangerouslyHTMLString": true
      })
    },
  },
}
</script>
