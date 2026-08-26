import dayjs from 'dayjs'

// 期間限定の申込規制。期間終了後はこのファイルと参照箇所をまとめて削除する
const IPOE_FLETS_SEPARATE_RESTRICTION_START_AT = '2026-08-28T00:00:00+09:00'
const IPOE_FLETS_SEPARATE_RESTRICTION_END_AT = '2026-09-01T22:00:00+09:00'
const IPOE_RESTRICTION_START_AT = '2026-09-01T22:00:00+09:00'
const IPOE_RESTRICTION_END_AT = '2026-09-05T08:00:00+09:00'
const GUARANTEE_RESTRICTION_START_AT = '2026-08-26T22:00:00+09:00'
const GUARANTEE_RESTRICTION_END_AT = '2026-09-05T08:30:00+09:00'

export const useApplicationRestriction = () => {
  const now = dayjs().tz()

  // フレッツ回線別契約型のみ規制（新設申込・転用・廃止）
  const disabledFletsSeparateApplication =
    now.isSameOrAfter(IPOE_FLETS_SEPARATE_RESTRICTION_START_AT) && now.isBefore(IPOE_FLETS_SEPARATE_RESTRICTION_END_AT)
  // ベストエフォートIPoEアクセス全体の新規作成を規制
  const disabledIpoeApplication = now.isSameOrAfter(IPOE_RESTRICTION_START_AT) && now.isBefore(IPOE_RESTRICTION_END_AT)
  // ギャランティアクセスの新規作成・廃止を規制
  const disabledGuaranteeApplication =
    now.isSameOrAfter(GUARANTEE_RESTRICTION_START_AT) && now.isBefore(GUARANTEE_RESTRICTION_END_AT)

  return {
    disabledFletsSeparateApplication,
    disabledIpoeApplication,
    disabledGuaranteeApplication,
  }
}
