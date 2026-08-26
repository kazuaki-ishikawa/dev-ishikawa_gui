import { parse, type ParseResult } from 'papaparse'

export type PostalCodeItem = {
  prefecture: string
  city: string
  additionalInfo: string
}

type PostalCodeCsvRow = PostalCodeItem & { postalCode: string }

export const usePostalCode = () => {
  const postalCodeMap = useState<Map<string, PostalCodeItem>>('postalCodeMap', () => new Map())
  const fetchPromise = useState<Promise<PostalCodeCsvRow[]> | null>('postalCodeMapFetch', () => null)

  const fetchPostalCodeCsv = () => {
    return new Promise<PostalCodeCsvRow[]>((resolve, reject) => {
      parse('/postal-code.csv', {
        download: true,
        header: true,
        complete: (results: ParseResult<PostalCodeCsvRow>) => resolve(results.data),
        error: () => reject(),
      })
    })
  }

  const loadPostalCodeMap = async () => {
    if (postalCodeMap.value.size > 0) {
      return
    }
    // すでに読み込み中の場合はそのPromiseを返し、再度CSVを読み込まないようにする
    if (!fetchPromise.value) {
      fetchPromise.value = fetchPostalCodeCsv()
    }
    try {
      const rows = await fetchPromise.value
      postalCodeMap.value = new Map(
        rows.map(({ postalCode, ...item }) => [postalCode, item]),
      )
    } catch {
      postalCodeMap.value = new Map()
    }
  }

  return { postalCodeMap, loadPostalCodeMap }
}
