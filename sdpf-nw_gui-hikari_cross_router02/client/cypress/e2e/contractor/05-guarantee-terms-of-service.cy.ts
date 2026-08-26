import { generateRandomHex, t } from '@cypress/support/utils'

describe('住居検索機能利用に関わる同意事項', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)

    cy.fixture('guarantees/circuits/terms-of-service.json').then(guaranteeTermsOfService => {
      this.guaranteeTermsOfService = guaranteeTermsOfService
    })
    cy.fixture('guarantees/circuits/guarantee-download-terms-of-service.json').then(downloadedTermsOfService => {
      this.downloadedTermsOfService = downloadedTermsOfService.decodedContent
    })
    cy.intercept('GET', '**/ztgict/v1/settings/guarantee/terms-of-service', {
      fixture: 'guarantees/circuits/terms-of-service',
    }).as('getGuaranteeTermsOfService')
    cy.intercept('GET', '**/ztgict/v1/download-terms-of-service*', {
      fixture: 'guarantees/circuits/guarantee-download-terms-of-service',
    }).as('getDownloadGuaranteeMonitoringTermsOfService')
  })

  it('規約同意', function () {
    cy.intercept('GET', '**/ztgict/v1/settings/guarantee', {
      fixture: 'guarantees/circuits/terms-of-service-rejected',
    }).as('getGuaranteeTermsOfServiceIsRejected')

    cy.intercept('POST', '**/ztgict/v1/settings/guarantee/terms-of-service/agree', {}).as('postGuaranteeTermsOfService')

    cy.visit(`tenants/${this.tenantId}/contracts/guarantee-terms-of-service`)
    cy.wait([
      '@getSession',
      '@getMobile',
      '@getGuaranteeTermsOfServiceIsRejected',
      '@getGuaranteeTermsOfService',
      '@getDownloadGuaranteeMonitoringTermsOfService',
    ])

    this.guaranteeTermsOfService.listedTermsOfService.forEach((_: { name: string; uuid: string }, index: number) => {
      cy.get(`[data-cy="contractor-terms-and-conditions-terms-of-service-${index}"]`).should(
        'have.text',
        this.downloadedTermsOfService + '\n',
      )
      cy.get(`[data-cy="contractor-contractor-terms-and-conditions-agreement-${index}"]`).find('.checkbox').click()
      cy.get(`[data-cy="contractor-contractor-terms-and-conditions-agreement-${index}"]`).should(
        'contain',
        t('terms.agreement'),
      )
    })
    cy.get('[data-cy="contractor-contractor-terms-and-conditions-submit-button"]')
      .should('have.text', t('terms.agreement'))
      .should('not.be.disabled')
      .click()
    cy.wait('@postGuaranteeTermsOfService')

    // 同意ボタンが非活性になっていることを確認
    cy.get('[data-cy="contractor-contractor-terms-and-conditions-submit-button"]')
      .should('have.text', t('terms.agreed'))
      .should('be.disabled')
  })
  it('規約同意済み', function () {
    cy.intercept('GET', '**/ztgict/v1/settings/guarantee', {
      fixture: 'guarantees/circuits/terms-of-service-accepted',
    }).as('getGuaranteeTermsOfServiceIsAccepted')

    cy.visit(`tenants/${this.tenantId}/contracts/guarantee-terms-of-service`)
    cy.wait([
      '@getSession',
      '@getMobile',
      '@getGuaranteeTermsOfServiceIsAccepted',
      '@getGuaranteeTermsOfService',
      '@getDownloadGuaranteeMonitoringTermsOfService',
    ])
    this.guaranteeTermsOfService.listedTermsOfService.forEach((_: { name: string; uuid: string }, index: number) => {
      cy.get(`[data-cy="contractor-terms-and-conditions-terms-of-service-${index}"]`).should(
        'have.text',
        this.downloadedTermsOfService + '\n',
      )

      cy.get(`[data-cy="contractor-contractor-terms-and-conditions-agreement-${index}"]`).should(
        'contain',
        t('terms.agreed'),
      )
    })
    cy.get('[data-cy="contractor-contractor-terms-and-conditions-submit-button"]')
      .should('have.text', t('terms.agreed'))
      .should('be.disabled')
  })
})
