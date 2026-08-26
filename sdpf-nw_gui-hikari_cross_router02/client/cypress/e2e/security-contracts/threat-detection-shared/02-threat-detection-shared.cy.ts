import type { ThreatDetectionsSharedRequestResponse } from '@app/api/threatDetectionShared/types'
import { generateRandomHex } from '@cypress/support/utils'

const testData = [
  { requestDirection: 'received', trayLabel: '受信' },
  { requestDirection: 'sent', trayLabel: '送信' },
] as const

describe('脅威情報共有 契約状況確認／変更', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)
  })

  it('セキュリティ規約同意前', function () {
    cy.intercept('GET', '**/ztgict/v1/settings/security', {
      body: { termsOfServiceAccepted: false },
    }).as('getSecurityTermsOfService')

    cy.visit(`/tenants/${this.tenantId}/security-contracts/threat-detection-shared`)
    cy.wait([
      '@getSession',
      '@getMobile',
      '@getTrafficReportFlowAnalyzerTermsOfService',
      '@getSecurityTermsOfService',
      '@getSettingsBehaviorDetection',
      '@getSecurityTermsOfService',
    ])

    // セキュリティ同意画面へ遷移ボタンが表示される
    cy.get('[data-cy="security-contracts-threat-detection-shared-terms-of-service-button"]').should('exist')
    cy.get('[data-cy="security-contracts-threat-detection-shared-terms-of-service-message"]').should('exist')

    // ボタンの状態確認
    cy.get('[data-cy="search-filter-clear-button"]').should('be.disabled')
    cy.get('[data-cy="search-filter-search-button"]').should('be.disabled')
    cy.get('[data-cy="security-contracts-threat-detection-shared-create-auth-key-button"]').should('be.disabled')
    cy.get('[data-cy="security-contracts-threat-detection-shared-received-list-button"]').should('be.disabled')
    cy.get('[data-cy="security-contracts-threat-detection-shared-start-sharing-button"]').should('be.disabled')
    cy.get('[data-cy="security-contracts-threat-detection-shared-provided-list-button"]').should('be.disabled')

    cy.get('[data-cy="security-contracts-threat-detection-shared-approve-button"]').should('be.disabled')
    cy.get('[data-cy="security-contracts-threat-detection-shared-reject-button"]').should('be.disabled')
  })

  it('[受信トレイ] チェックボックスと承認・却下ボタンが存在すること', function () {
    cy.fixture('security-contracts/threat-detection-shared/requests').then(data => {
      const threatDetectionsSharedRequests = data.threatDetectionsSharedRequests.map(
        (request: ThreatDetectionsSharedRequestResponse) => {
          return {
            ...request,
            requestDirection: 'received',
          }
        },
      )
      cy.intercept('GET', '**/ztgict/v1/threat-detection-shared/requests?*', {
        body: { ...data, threatDetectionsSharedRequests },
      }).as('getThreatDetectionSharedRequests')

      cy.visit(`/tenants/${this.tenantId}/security-contracts/threat-detection-shared?requestDirection=received`)
      cy.wait([
        '@getSession',
        '@getMobile',
        '@getTrafficReportFlowAnalyzerTermsOfService',
        '@getSecurityTermsOfService',
        '@getSettingsBehaviorDetection',
        '@getSecurityTermsOfService',
        '@getThreatDetectionSharedRequests', // 全件取得用
        '@getThreatDetectionSharedRequests', // テーブル用
      ])

      // セキュリティ同意画面へ遷移ボタンが表示されない
      cy.get('[data-cy="security-contracts-threat-detection-shared-terms-of-service-button"]').should('not.exist')
      cy.get('[data-cy="security-contracts-threat-detection-shared-terms-of-service-message"]').should('not.exist')

      // ボタンの初期値
      cy.get('[data-cy="security-contracts-threat-detection-shared-approve-button"]')
        .as('approveButton')
        .should('be.disabled')
      cy.get('[data-cy="security-contracts-threat-detection-shared-reject-button"]')
        .as('rejectButton')
        .should('be.disabled')

      // チェックボックスの件数
      cy.get('[data-cy^="security-contracts-threat-detection-shared-action-"]').should(
        'have.length',
        threatDetectionsSharedRequests.length + 1,
      )
      // 全件選択
      cy.get('[data-cy="security-contracts-threat-detection-shared-action-all-checkbox"]').as('allCheckbox').click()
      cy.get('@allCheckbox').should('have.class', 'checked')
      // 承認・却下ボタンが有効になること
      cy.get('@approveButton').should('not.be.disabled')
      cy.get('@rejectButton').should('not.be.disabled')

      // チェックボックスの状態確認
      threatDetectionsSharedRequests.forEach((request: ThreatDetectionsSharedRequestResponse) => {
        const selectable = request.status === 'pendingApproval' && request.requestType === 'threatDetectionShareRequest'
        // status=pendingApproval かつ requestType=threatDetectionShareRequest の場合はチェックボックスが有効（true）そうでない場合は無効
        cy.get(`[data-cy="security-contracts-threat-detection-shared-action-${request.requestId}-checkbox"]`)
          .should(selectable ? 'not.have.class' : 'have.class', 'disabled')
          .and(selectable ? 'have.class' : 'not.have.class', 'checked')
      })
    })
  })

  it('[送信トレイ] チェックボックスと承認・却下ボタンが非表示になっていること', function () {
    cy.fixture('security-contracts/threat-detection-shared/requests').then(data => {
      const threatDetectionsSharedRequests = data.threatDetectionsSharedRequests.map(
        (request: ThreatDetectionsSharedRequestResponse) => {
          return {
            ...request,
            requestDirection: 'sent',
          }
        },
      )
      cy.intercept('GET', '**/ztgict/v1/threat-detection-shared/requests?*', {
        body: { ...data, threatDetectionsSharedRequests },
      }).as('getThreatDetectionSharedRequests')
    })

    cy.visit(`/tenants/${this.tenantId}/security-contracts/threat-detection-shared?requestDirection=sent`)
    cy.wait([
      '@getSession',
      '@getMobile',
      '@getTrafficReportFlowAnalyzerTermsOfService',
      '@getSecurityTermsOfService',
      '@getSettingsBehaviorDetection',
      '@getSecurityTermsOfService',
      '@getThreatDetectionSharedRequests',
    ])

    // チェックボックスの非表示
    cy.get('[data-cy^="security-contracts-threat-detection-shared-action-"]').should('not.exist')
    cy.get('[data-cy="security-contracts-threat-detection-shared-approve-button"]').should('not.exist')
    cy.get('[data-cy="security-contracts-threat-detection-shared-reject-button"]').should('not.exist')
  })

  testData.forEach(({ requestDirection, trayLabel }) => {
    it(`[${trayLabel}トレイ] 承認済みで検索すると停止済みが除外されること`, function () {
      cy.fixture('security-contracts/threat-detection-shared/requests').then(data => {
        const threatDetectionsSharedRequests = data.threatDetectionsSharedRequests.map(
          (request: ThreatDetectionsSharedRequestResponse) => ({
            ...request,
            requestDirection,
          }),
        )
        cy.intercept('GET', '**/ztgict/v1/threat-detection-shared/requests?*', {
          body: { ...data, threatDetectionsSharedRequests },
        }).as('getThreatDetectionSharedRequests')

        cy.visit(
          `/tenants/${this.tenantId}/security-contracts/threat-detection-shared?requestDirection=${requestDirection}`,
        )
        cy.wait([
          '@getSession',
          '@getMobile',
          '@getTrafficReportFlowAnalyzerTermsOfService',
          '@getSecurityTermsOfService',
          '@getSettingsBehaviorDetection',
          '@getSecurityTermsOfService',
          '@getThreatDetectionSharedRequests', // 全件取得用
          '@getThreatDetectionSharedRequests', // テーブル用
        ])

        cy.inputSelectForm({
          selector: '[data-cy="security-contracts-threat-detection-shared-status-select"]',
          value: '承認済み',
        })
        cy.get('[data-cy="search-filter-search-button"]').click()
        cy.wait('@getThreatDetectionSharedRequests').then(({ request }) => {
          expect(request.query).to.deep.eq({
            direction: 'desc',
            limit: '10',
            offset: '0',
            requestDirection,
            sortKey: 'creationTime',
            status: 'approved',
            requestType: 'threatDetectionShareRequest',
          })
        })
      })
    })

    it(`[${trayLabel}トレイ] 承認済み以外で検索すると停止済みが除外されないこと`, function () {
      cy.fixture('security-contracts/threat-detection-shared/requests').then(data => {
        const threatDetectionsSharedRequests = data.threatDetectionsSharedRequests.map(
          (request: ThreatDetectionsSharedRequestResponse) => ({
            ...request,
            requestDirection,
          }),
        )
        cy.intercept('GET', '**/ztgict/v1/threat-detection-shared/requests?*', {
          body: { ...data, threatDetectionsSharedRequests },
        }).as('getThreatDetectionSharedRequests')

        cy.visit(
          `/tenants/${this.tenantId}/security-contracts/threat-detection-shared?requestDirection=${requestDirection}`,
        )
        cy.wait([
          '@getSession',
          '@getMobile',
          '@getTrafficReportFlowAnalyzerTermsOfService',
          '@getSecurityTermsOfService',
          '@getSettingsBehaviorDetection',
          '@getSecurityTermsOfService',
          '@getThreatDetectionSharedRequests', // 全件取得用
          '@getThreatDetectionSharedRequests', // テーブル用
        ])

        cy.inputSelectForm({
          selector: '[data-cy="security-contracts-threat-detection-shared-status-select"]',
          value: '却下',
        })
        cy.get('[data-cy="search-filter-search-button"]').click()
        cy.wait('@getThreatDetectionSharedRequests').then(({ request }) => {
          expect(request.query).to.deep.eq({
            direction: 'desc',
            limit: '10',
            offset: '0',
            requestDirection,
            sortKey: 'creationTime',
            status: 'rejected',
          })
        })
      })
    })
  })
})
