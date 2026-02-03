<template>
  <div class="chart-component">
    <component
      :is="getComponent(chartData)"
      :options="mergedOptions"
      :data="resolvedData"
      :width="chartData.width"
      :height="chartData.height"
    />
  </div>
</template>
<script>
import { toast } from "vue3-toastify"
import { useTheme } from "vuetify"
import { nextTick } from "vue"
import { Line as ChartLine, Bar, Bubble, Doughnut, Pie, PolarArea, Radar, Scatter } from "vue-chartjs";
import gradient from 'chartjs-plugin-gradient'

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
  ArcElement,
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
  ArcElement,
  gradient,
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
const NO_SCALES_TYPES = ['doughnut', 'pie', 'radar', 'polararea']
const COLOR_KEYS = [
  'borderColor', 'backgroundColor', 'pointBorderColor',
  'pointBackgroundColor', 'hoverBackgroundColor', 'hoverBorderColor',
]
const THEME_COLOR_RE = /^(primary|secondary|error|warning|info|success)(-fill|-zero)?$/

function readThemeColors() {
  const style = getComputedStyle(document.documentElement)
  const onSurface = style.getPropertyValue('--v-theme-on-surface').trim()
  const opacity = style.getPropertyValue('--v-medium-emphasis-opacity').trim() || '0.6'
  return {
    text: `rgba(${onSurface}, ${opacity})`,
    textHigh: `rgb(${onSurface})`,
    grid: `rgba(${onSurface}, 0.08)`,
  }
}

function resolveColor(value) {
  if (typeof value !== 'string') return value
  const match = value.match(THEME_COLOR_RE)
  if (!match) return value
  const style = getComputedStyle(document.documentElement)
  const rgb = style.getPropertyValue(`--v-theme-${match[1]}`).trim()
  if (!rgb) return value
  return match[2] === '-fill' ? `rgba(${rgb}, 0.15)` :
         match[2] === '-zero' ? `rgba(${rgb}, 0)` :
         `rgb(${rgb})`
}

function buildOptions(opts, colors, chartType) {
  const c = colors
  const hasScales = !NO_SCALES_TYPES.includes(chartType)
  return {
    ...opts,
    plugins: {
      ...opts.plugins,
      legend: {
        ...opts.plugins?.legend,
        labels: {
          ...opts.plugins?.legend?.labels,
          color: c.text,
        },
      },
      ...(opts.plugins?.title ? {
        title: {
          ...opts.plugins.title,
          color: c.textHigh,
        },
      } : {}),
      ...(opts.plugins?.tooltip ? {
        tooltip: { ...opts.plugins.tooltip },
      } : {}),
    },
    ...(hasScales ? {
      scales: {
        x: {
          ...opts.scales?.x,
          ticks: { ...opts.scales?.x?.ticks, color: c.text },
          ...(opts.scales?.x?.title ? {
            title: { ...opts.scales.x.title, color: c.text },
          } : {}),
        },
        y: {
          ...opts.scales?.y,
          ticks: { ...opts.scales?.y?.ticks, color: c.text },
          grid: { ...opts.scales?.y?.grid, color: c.grid },
          ...(opts.scales?.y?.title ? {
            title: { ...opts.scales.y.title, color: c.text },
          } : {}),
        },
      },
    } : {}),
  }
}

export default {
  props: {
    chartData: {type: Object, required: true},
  },
  setup() {
    const theme = useTheme()
    return { theme }
  },
  data() {
    return {
      colorVersion: 0,
    }
  },
  computed: {
    themeName() {
      return this.theme.global.name.value
    },
    currentColors() {
      void this.colorVersion
      return readThemeColors()
    },
    mergedOptions() {
      return buildOptions(
        this.chartData.options || {},
        this.currentColors,
        this.chartData.type,
      )
    },
    resolvedData() {
      void this.colorVersion
      const data = JSON.parse(JSON.stringify(this.chartData.data))
      for (const ds of (data.datasets || [])) {

        if (ds.gradient) {
          for (const prop of ['backgroundColor', 'borderColor']) {
            const g = ds.gradient[prop]
            if (!g?.colors) continue
            const resolved = {}
            for (const [stop, color] of Object.entries(g.colors)) {
              resolved[stop] = resolveColor(color)
            }
            ds.gradient[prop] = { ...g, colors: resolved }
          }
        }

        for (const key of COLOR_KEYS) {
          if (Array.isArray(ds[key])) {
            ds[key] = ds[key].map(resolveColor)
          } else if (ds[key]) {
            ds[key] = resolveColor(ds[key])
          }
        }
      }
      return data
    },
  },
  watch: {
    themeName() {
      nextTick(() => {
        setTimeout(() => {
          this.colorVersion++
        }, 50)
      })
    },
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
