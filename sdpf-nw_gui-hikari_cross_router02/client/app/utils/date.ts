import dayjs from 'dayjs'

// NOTE: アロー関数で export すると Nuxt の自動インポートスキャナーがパラメータ名を誤ってエクスポートとして認識するため function 宣言を使用
export function calcMinDate(days: number, disabledDates: (date: Date) => boolean) {
  const findWorkDay = (currentDate: dayjs.Dayjs, remainingDays: number): string => {
    const nextDate = currentDate.add(1, 'day')
    const isWorkDay = !disabledDates(nextDate.toDate())
    return remainingDays === 1 && isWorkDay
      ? nextDate.format('YYYY-MM-DD')
      : findWorkDay(nextDate, isWorkDay ? remainingDays - 1 : remainingDays)
  }
  return findWorkDay(dayjs(), days)
}
