import { AccessTypes } from '@/api/trafficTrends/constants'

export const ColorKeyList = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'interactive'] as const

const HighChartsColors = ['#3169b3', '#07af7b', '#6bc8f3', '#f0908a', '#446c80', '#7e5854'] as const
export const TrafficDetailChartColors = {
  guarantee: {
    [AccessTypes.Vpn]: HighChartsColors[0],
    [AccessTypes.Internet]: HighChartsColors[1],
    [AccessTypes.InternetVpn]: HighChartsColors[2],
  },
  ipoe: HighChartsColors[3],
}
export const TrafficTrendChartColors = {
  guarantee: {
    bpsIn: HighChartsColors[2],
    bpsOut: HighChartsColors[4],
  },
  ipoe: {
    bpsIn: HighChartsColors[3],
    bpsOut: HighChartsColors[5],
  },
}
