import type { DownloadTypes } from './constants'

export type CustomButtonIconType =
  | 'right-arrow'
  | 'left-arrow'
  | 'up-right-square'
  | 'search'
  | 'download'
  | 'reload'
  | 'lock'
  | 'light'

export type DownloadType = (typeof DownloadTypes)[keyof typeof DownloadTypes]
export type DownloadChartType = Exclude<DownloadType, typeof DownloadTypes.Csv>
