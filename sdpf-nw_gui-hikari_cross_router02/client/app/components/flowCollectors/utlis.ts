import { isEqual } from 'es-toolkit'
import {
  DisplayCircuitTypes,
  DisplayAggregationMethodTypes,
  TrafficFlowCircuitTypes,
} from '@/api/trafficFlow/constants'
import type {
  DisplayCircuitType,
  DisplayAggregationMethodType,
  TrafficFlowUsageType,
  TrafficFlowUsageCircuitDailyUsageType,
} from '@/api/trafficFlow/types'

type SeriesType = {
  type: 'line'
  name: string
  data: Array<[string, number]>
  marker: { symbol: string }
}

const formatDailyUsage = (
  dailyUsage: TrafficFlowUsageCircuitDailyUsageType[],
  aggregationMethod: DisplayAggregationMethodType,
) => {
  return dailyUsage.reduce<Array<[string, number]>>((acc, cur, index) => {
    if (aggregationMethod === DisplayAggregationMethodTypes.Daily) {
      // 日別の場合はそのまま
      acc.push([cur.date, cur.bytes])
    } else {
      // 累積の場合は直前までの値を合計する
      const total = index === 0 ? cur.bytes : acc[index - 1]![1] + cur.bytes
      acc.push([cur.date, total])
    }
    return acc
  }, [])
}

export const formatSeries = (
  usages: TrafficFlowUsageType[],
  displayCircuitType: DisplayCircuitType,
  aggregationMethod: DisplayAggregationMethodType,
) => {
  return usages.flatMap(usage => {
    // main と backup は vpn を除いた circuitType の組み合わせで判定する
    const circuitTypes = usage.circuits
      .filter(c => c.circuitType !== TrafficFlowCircuitTypes.Vpn)
      .map(c => c.circuitType)
      .sort()
    return usage.circuits
      .filter(circuit => {
        // main / backup の場合、vpn は各条件（guarantee/ipoe/mobile）に一致しないため自然に除外される
        // both の場合のみ vpn を含む全回線を返す
        // main の場合
        if (displayCircuitType === DisplayCircuitTypes.Main) {
          if (circuitTypes.includes(TrafficFlowCircuitTypes.Guarantee)) {
            return circuit.circuitType === TrafficFlowCircuitTypes.Guarantee
          }
          if (isEqual(circuitTypes, [TrafficFlowCircuitTypes.Mobile])) {
            return circuit.circuitType === TrafficFlowCircuitTypes.Mobile
          }
          return circuit.circuitType === TrafficFlowCircuitTypes.Ipoe
        }
        // backup の場合
        if (displayCircuitType === DisplayCircuitTypes.Backup) {
          if (isEqual(circuitTypes, [TrafficFlowCircuitTypes.Guarantee, TrafficFlowCircuitTypes.Ipoe])) {
            return circuit.circuitType === TrafficFlowCircuitTypes.Ipoe
          }
          return circuitTypes.length === 2 && circuit.circuitType === TrafficFlowCircuitTypes.Mobile
        }
        // both の場合
        return displayCircuitType === DisplayCircuitTypes.Both
      })
      .reduce<SeriesType[]>((array, circuit) => {
        // 選択肢した circuitType によって、シンボルを決定
        const symbol =
          displayCircuitType === DisplayCircuitTypes.Both
            ? 'diamond'
            : displayCircuitType === DisplayCircuitTypes.Main
              ? 'circle'
              : 'square'

        // 初回の場合はそのままデータを追加して返す
        const formattedData = formatDailyUsage(circuit.dailyUsage, aggregationMethod)
        if (array.length === 0) {
          return [
            {
              type: 'line' as const,
              name: `${usage.customerNote}(${usage.terminalId})`,
              data: formattedData,
              marker: { symbol },
            },
          ]
        }

        // 2回目以降は、既存のデータと dailyUsage.byites を合計して返す
        return array.map(acc => ({
          type: 'line' as const,
          name: `${usage.customerNote}(${usage.terminalId})`,
          data: acc.data.map((d, i) => [d[0], d[1] + (formattedData?.[i]?.[1] ?? 0)]),
          marker: { symbol },
        }))
      }, [])
  })
}

export const defaultChartOptions: Omit<Highcharts.Options, 'series'> = {
  title: { text: undefined },
  chart: {
    height: 450,
  },
  accessibility: { enabled: false },
  yAxis: {
    title: { text: 'bytes' },
  },
  xAxis: { type: 'category' },
  lang: {
    noData: 'no data to display',
  },
  noData: {
    style: {
      fontWeight: 'bold',
      fontSize: '25px',
    },
  },
  navigation: {
    buttonOptions: {
      enabled: false,
    },
  },
  credits: {
    enabled: false,
  },
}
