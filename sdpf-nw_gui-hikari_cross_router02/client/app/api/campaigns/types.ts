import type { CampaignTypes, CampaignResourceType } from '@/api/campaigns/constants'
import type { ConnectionType } from '@/api/guarantees/types'

export type CampaignType = (typeof CampaignTypes)[keyof typeof CampaignTypes]
export type CampaignResourceType = (typeof CampaignResourceType)[keyof typeof CampaignResourceType]

type GuaranteeOneRankUpInfo = {
  networkType: ConnectionType
}

export type CampaignPostRequest = {
  campaignType: CampaignType
  resourceType: CampaignResourceType
  resourceId: string
  startTime?: string
  expirationTime?: string
  campaignInfo?: GuaranteeOneRankUpInfo
}
export type CampaignDeleteRequest = {
  campaignType?: CampaignType
  resourceType?: CampaignResourceType
  resourceId?: string
}
export type CampaignResponse = {
  campaignType: string
  resourceType: string
  resourceId: string
  startTime: string | null
  expirationTime: string | null
  campaignInfo: GuaranteeOneRankUpInfo
}

export type CampaignListQuery = {
  resourceId: string
  campaignType: CampaignType
}
export type CampaignListResponse = {
  campaigns: CampaignResponse[]
}
