import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:8080',
    viewportWidth: 1440,
    viewportHeight: 900,
    requestTimeout: 25000,
    retries: { runMode: 2, openMode: 0 }, // 並列実行すると Timeout になることがあるため、リトライするようにする
    specPattern: ['cypress/e2e/**/*.cy.ts', 'cypress/e2e/**/*.cy.nova.ts'],
  },
  allowCypressEnv: false,
  trashAssetsBeforeRuns: false, // 削除するときに競合して warning が起こってしまうため
})
