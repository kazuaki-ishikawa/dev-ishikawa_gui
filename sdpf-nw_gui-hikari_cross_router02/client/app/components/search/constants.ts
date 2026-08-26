export const PeriodTypes = {
  Last1Day: 'last1day',
  Last3Days: 'last3days',
  Last1Week: 'last1week',
  Last2Weeks: 'last2weeks',
  Last1Month: 'last1month',
  Free: 'free',
} as const
export const PeriodMinutesGapMap = {
  [PeriodTypes.Last1Day]: 24 * 60,
  [PeriodTypes.Last3Days]: 24 * 60 * 3,
  [PeriodTypes.Last1Week]: 24 * 60 * 7,
  [PeriodTypes.Last2Weeks]: 24 * 60 * 14,
  [PeriodTypes.Last1Month]: 24 * 60 * 30,
} as const
