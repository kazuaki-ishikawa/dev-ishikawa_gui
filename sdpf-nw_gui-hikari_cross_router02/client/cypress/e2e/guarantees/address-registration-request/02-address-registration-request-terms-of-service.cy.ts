import { generateRandomHex, t } from '@cypress/support/utils'

describe('住所検索機能に関わる同意事項', () => {
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
    cy.intercept('POST', '**/ztgict/v1/settings/guarantee/terms-of-service/agree', {}).as('postGuaranteeTermsOfService')
  })

  it('規約同意', function () {
    cy.intercept('GET', '**/ztgict/v1/settings/guarantee', { body: { termsOfServiceAccepted: false } }).as(
      'getGuaranteeTermsOfServiceIsNotAccepted',
    )
    cy.visit(`tenants/${this.tenantId}/guarantees/address-registration-request`)

    cy.wait([
      '@getGuaranteeTermsOfServiceIsNotAccepted',
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

    cy.get('[data-cy="snack-bar-text"]').should('have.text', t('message.succeeded'))
  })
  // 同意済みであれば規約画面に遷移しないため、01-address-registration-request.cy.tsのテストで代替
})
