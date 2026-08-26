import { generateRandomHex, t } from '@cypress/support/utils'

describe('vpn delete', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)
    this.vpnId = generateRandomHex(32)

    cy.intercept('GET', '**/ztgict/v1/vpns/*', { fixture: 'vpns/detail' }).as('getVpn')
    cy.intercept('DELETE', '**/ztgict/v1/vpns/*', { fixture: 'vpns/detail' }).as('deleteRequest')
  })
  it('vpn delete', function () {
    cy.visit(`/tenants/${this.tenantId}/vpns/${this.vpnId}`)
    cy.wait(['@getVpn'])

    // 廃止ボタン押下
    cy.get('[data-cy="vpn-id-index-delete-button"]')

      .should('not.be.disabled')
      .should('have.text', t('common.delete'))
      .click()

    // ダイアログの廃止ボタン押下
    cy.get('.dialog-base-submit-button').as('submitButton')
    cy.get('@submitButton').should('not.be.disabled')
    cy.get('@submitButton').should('have.text', t('common.delete')).click()

    cy.wait('@deleteRequest').then(req => {
      expect(req.request.url).to.include(`/ztgict/v1/vpns/${this.vpnId}`)
    })

    // DELETE vpns の成功メッセージを確認
    cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('message.deleted'))
    cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
    cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.close')).click()
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/vpns`)
  })
})
