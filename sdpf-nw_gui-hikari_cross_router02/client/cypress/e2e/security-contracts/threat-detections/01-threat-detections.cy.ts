import { generateRandomHex } from '@cypress/support/utils'

describe('脅威検知一覧', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)
    this.visitUrl = `/tenants/${this.tenantId}/security-contracts/threat-detections`
    cy.intercept('GET', '**/ztgict/v1/resource-summary/terminals?*', { fixture: 'terminals/list' }).as(
      'getTerminalList',
    )
    cy.intercept('GET', '**/ztgict/v1/resource-summary/ipoe?*', { fixture: 'ipoes/list' }).as('getIpoeList')
    cy.intercept('GET', '**/ztgict/v1/resource-summary/guarantees?*', { fixture: 'guarantees/circuits/list' }).as(
      'getGuaranteeList',
    )
  })

  it('セキュリティ規約同意前', function () {
    cy.intercept('GET', '**/ztgict/v1/settings/security', {
      body: { termsOfServiceAccepted: false },
    }).as('getSecurityTermsOfService')

    cy.visit(this.visitUrl)
    cy.wait(['@getSession', '@getMobile', '@getTrafficReportFlowAnalyzerTermsOfService', '@getSecurityTermsOfService'])
    cy.wait(['@getIpoeList', '@getGuaranteeList', '@getTerminalList', '@getSecurityTermsOfService'])

    // セキュリティ同意画面へ遷移ボタンが表示される
    cy.get('[data-cy="security-contracts-threat-detections-terms-of-service-button"]').should('exist')
    // ボタンの状態確認
    cy.get('[data-cy="search-filter-clear-button"]').should('be.disabled')
    cy.get('[data-cy="search-filter-search-button"]').should('be.disabled')
    cy.get('[data-cy="threat-detection-table-download-button"]').should('be.disabled')
    cy.get('[data-cy="security-help-desk-button"]').should('not.be.disabled')
  })
})
