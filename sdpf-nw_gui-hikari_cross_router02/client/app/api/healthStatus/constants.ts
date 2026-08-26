export const MAX_LIMIT = 100

export const Situation = {
  Main: 'main',
  Backup: 'backup',
} as const
export const HealthStatus = {
  OK: 'ok',
  NG: 'ng',
  Warning: 'warning',
} as const

export const BgpSessionStatus = {
  Processing: 'processing',
  Completed: 'completed',
  Failed: 'failed',
} as const
