import { generateRandomHex } from '@cypress/support/utils'

describe('脅威情報共有（受領情報）', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)
  })

  it('セキュリティ規約同意前', function () {
    cy.intercept('GET', '**/ztgict/v1/settings/security', {
      body: { termsOfServiceAccepted: false },
    }).as('getSecurityTermsOfService')

    cy.visit(`/tenants/${this.tenantId}/security-contracts/threat-detection-shared/threat-detections`)
    cy.wait([
      '@getSession',
      '@getMobile',
      '@getTrafficReportFlowAnalyzerTermsOfService',
      '@getSecurityTermsOfService',
      '@getSettingsBehaviorDetection',
      '@getSecurityTermsOfService',
    ])

    // セキュリティ同意画面へ遷移ボタンが表示される
    cy.get('[data-cy="security-contracts-threat-detection-shared-threat-detections-terms-of-service-button"]').should(
      'exist',
    )
    cy.get('[data-cy="security-contracts-threat-detection-shared-threat-detections-terms-of-service-message"]').should(
      'exist',
    )

    // 契約社名／テナントIDが未入力
    cy.get('[data-cy="security-contracts-threat-detection-shared-threat-detections-tenant-id-select-form"]')
      .find('input')
      .should('have.value', '')
    // 各検索項目は選択不可
    cy.get('[data-cy="threat-detection-filter-search-period-date-time"]')
      .find('.radio')
      .each($radio => {
        cy.wrap($radio).should('have.class', 'disabled')
      })
    cy.get('[data-cy="threat-detection-filter-terminal-id"]').find('input').should('be.disabled')
    cy.get('[data-cy="threat-detection-filter-threat-level"]').find('input').should('be.disabled')
    cy.get('[data-cy="threat-detection-filter-threat-type"]').find('input').should('be.disabled')
    cy.get('[data-cy="threat-detection-filter-detection-type"]').find('.checkbox').should('have.class', 'disabled')
    cy.get('[data-cy="threat-detection-filter-blocking-status"]').find('.checkbox').should('have.class', 'disabled')
    cy.get('[data-cy="threat-detection-filter-traffic-direction"]').find('input').should('be.disabled')
    // 非表示項目の確認
    cy.get('[data-cy="threat-detection-filter-circuit-id"]').should('not.exist')

    // ボタンの状態確認
    cy.get('[data-cy="search-filter-clear-button"]').should('be.disabled')
    cy.get('[data-cy="search-filter-search-button"]').should('be.disabled')
    cy.get('[data-cy="threat-detection-table-download-button"]').should('be.disabled')
    cy.get('[data-cy="security-help-desk-button"]').should('not.exist')
  })
})
