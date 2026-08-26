import type { BpsTypes, GraphContentsTypes, ChartStyleTypes, ChartUnitTypes } from './constants'

export type BpsType = (typeof BpsTypes)[keyof typeof BpsTypes]
export type GraphContentsType = (typeof GraphContentsTypes)[keyof typeof GraphContentsTypes]
export type ChartStyleType = (typeof ChartStyleTypes)[keyof typeof ChartStyleTypes]
export type ChartUnitType = (typeof ChartUnitTypes)[keyof typeof ChartUnitTypes]

export type TrafficChartDataType = {
  bpsIn: Array<[number, number]>
  bpsOut: Array<[number, number]>
  rateLimit: Array<[number, number]>
}
export type UtilizationChartDataType = {
  bpsIn: Array<[number, number]>
  bpsOut: Array<[number, number]>
}
