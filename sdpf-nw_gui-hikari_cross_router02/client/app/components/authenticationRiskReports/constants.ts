import { RiskTypes } from '@/api/threatInfo/constants'

export const ColorMap = new Map<string, string>([
  [RiskTypes.High, '#E53935'],
  [RiskTypes.Medium, '#FB8C00'],
  [RiskTypes.Low, '#FDD835'],
  [RiskTypes.Informational, '#B8D200'],
])
