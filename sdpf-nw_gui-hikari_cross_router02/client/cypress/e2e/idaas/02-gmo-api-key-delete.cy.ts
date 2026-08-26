import { generateRandomHex, t } from '@cypress/support/utils'

describe('delete gmo api key', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)
    cy.fixture('idaas/detail.json').then(detail => {
      this.gmoApiKeyId = detail.id
    })
    cy.intercept('GET', '**/rink-idaas/v1/gmo-api-key', { fixture: 'idaas/detail' }).as('getGmoApiKey')
    cy.intercept('DELETE', '**/rink-idaas/v1/gmo-api-key/*', {}).as('deleteGmoApiKey')
  })

  it('API Key削除', function () {
    cy.visit(`/tenants/${this.tenantId}/idaas/api-key`)
    cy.wait('@getGmoApiKey')

    // 非表示要素を確認
    cy.get('[data-cy="idaas-gmo-api-key-create-message"]').should('not.exist')
    cy.get('[data-cy="idaas-gmo-api-key-create-gmo-api-key"]').should('not.exist')
    cy.get('[data-cy="idaas-gmo-api-key-create-button"]').should('not.exist')

    // 登録済みのAPI Keyが表示されていることを確認
    cy.get('[data-cy="idaas-gmo-api-key-detail-gmo-api-key"]').should('have.text', t('idaas.registered'))

    // 登録解除ボタンが活性であることを確認
    cy.get('[data-cy="idaas-gmo-api-key-delete-button"]')
      .should('have.text', t('idaas.delete'))
      .should('not.be.disabled')
      .click()

    // 削除確認ダイアログが表示されることを確認
    cy.get('.dialog-main').should('exist')
    cy.get('[data-cy="idaas-gmo-api-key-delete-confirm-dialog-content"]').should(
      'have.text',
      t('idaas.message.deleteConfirm'),
    )
    cy.get('.dialog-base-cancel-button').should('have.text', t('common.cancel'))

    // 登録解除ボタンをクリック
    cy.get('.dialog-base-submit-button').should('have.text', t('idaas.delete')).click()

    cy.wait('@deleteGmoApiKey').then(req => {
      expect(req.request.url).to.include(`rink-idaas/v1/gmo-api-key/${this.gmoApiKeyId}`)
    })

    // 削除完了ダイアログの表示を確認
    cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('idaas.message.deleted'))
    cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
    cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.close')).click()
  })
})
