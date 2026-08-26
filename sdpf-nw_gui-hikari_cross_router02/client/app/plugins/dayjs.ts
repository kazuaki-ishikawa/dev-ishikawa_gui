import dayjs, { extend, type PluginFunc, type UnitType } from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

declare module 'dayjs' {
  interface Dayjs {
    ceil(amount: number, unit: Exclude<UnitType, 'date' | 'dates'>): dayjs.Dayjs
    floor(amount: number, unit: Exclude<UnitType, 'date' | 'dates'>): dayjs.Dayjs
  }
}

const ceil: PluginFunc = (_option, dayjsClass) => {
  dayjsClass.prototype.ceil = function (amount, unit) {
    if (this.get(unit) % amount === 0) {
      return this.startOf(unit)
    }
    return this.add(amount - (this.get(unit) % amount), unit).startOf(unit)
  }
}
const floor: PluginFunc = (_option, dayjsClass) => {
  dayjsClass.prototype.floor = function (amount, unit) {
    return this.subtract(this.get(unit) % amount, unit).startOf(unit)
  }
}

export default defineNuxtPlugin(() => {
  extend(isBetween)
  extend(isSameOrAfter)
  extend(isSameOrBefore)
  extend(utc)
  extend(timezone)
  extend(ceil)
  extend(floor)
  dayjs.tz.setDefault('Asia/Tokyo')
})
