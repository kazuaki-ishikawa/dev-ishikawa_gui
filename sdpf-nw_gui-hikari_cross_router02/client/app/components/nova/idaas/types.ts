import type { ButtonTypes } from '@/components/nova/idaas/constants.ts'

export type ButtonType = (typeof ButtonTypes)[keyof typeof ButtonTypes]
