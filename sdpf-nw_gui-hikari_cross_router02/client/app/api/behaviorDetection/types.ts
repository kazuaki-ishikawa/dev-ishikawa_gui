import type { BehaviorDetectionPlanTypes } from '@/api/behaviorDetection/constants'

export type BehaviorDetectionPlanType = (typeof BehaviorDetectionPlanTypes)[keyof typeof BehaviorDetectionPlanTypes]

export type BehaviorDetectionResponse = {
  thisMonthBehaviorDetectionPlan: BehaviorDetectionPlanType
  nextMonthBehaviorDetectionPlan: BehaviorDetectionPlanType
}

export type BehaviorDetectionSSOResponse = {
  url: string
  responseTime: string
}
