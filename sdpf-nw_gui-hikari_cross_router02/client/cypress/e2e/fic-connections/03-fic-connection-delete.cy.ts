import { generateRandomHex, t } from '@cypress/support/utils'

describe('fic-connection delete', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)
    this.ficConnectionId = generateRandomHex(32)

    cy.intercept('GET', '**/ztgict/v1/fic-connections/*', { fixture: 'fic-connections/detail' }).as('getFicConnection')
    cy.intercept('GET', '**/ztgict/v1/resource-summary/fic-connections', { fixture: 'fic-connections/list' })
    cy.intercept('DELETE', '**/ztgict/v1/fic-connections/*', {}).as('deleteRequest')
    cy.visit(`/tenants/${this.tenantId}/fic-connections/${this.ficConnectionId}`)
  })
  it('fic-connection delete', function () {
    cy.wait('@getFicConnection')

    // 廃止ボタン押下
    cy.get('[data-cy="fic-connection-id-index-delete-button"]')
      .should('not.be.disabled')
      .should('have.text', t('common.delete'))
      .click()

    // ダイアログの廃止ボタン押下
    cy.get('.dialog-base-submit-button').as('submitButton')
    cy.get('@submitButton').should('not.be.disabled')
    cy.get('@submitButton').should('have.text', t('common.delete')).click()

    cy.wait('@deleteRequest').then(req => {
      expect(req.request.url).to.include(`ztgict/v1/fic-connections/${this.ficConnectionId}`)
    })

    // DELETE fic-connections の成功メッセージを確認
    cy.get('.dialog-card-content').should('have.text', `${t('message.deleted')}${t('fic.message.moveToDeleted')}`)
    cy.get('@submitButton').should('have.text', t('fic.moveToDeleted'))
    cy.get('.dialog-card-close').click()
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/fic-connections`)
  })
})
