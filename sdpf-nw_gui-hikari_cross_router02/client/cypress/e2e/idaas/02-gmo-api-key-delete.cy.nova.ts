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
    cy.get('[data-cy="idaas-api-key-create-message"]').should('not.exist')
    cy.get('[data-cy="idaas-api-key-create-gmo-api-key"]').should('not.exist')
    cy.get('[data-cy="idaas-api-key-create-button"]').should('not.exist')

    // 登録済みのAPI Keyが表示されていることを確認
    cy.get('[data-cy="idaas-api-key-detail-gmo-api-key"]').should('have.text', t('nova.apiKeySetting.registered'))

    // 登録解除ボタンが活性であることを確認
    cy.get('[data-cy="idaas-api-key-delete-button"]')
      .should('have.text', t('nova.apiKeySetting.deleteButton'))
      .should('not.be.disabled')
      .click()

    // 削除確認ダイアログが表示されることを確認
    cy.get('.v-dialog').should('exist')
    cy.get('[data-cy="idaas-api-key-delete-confirm-dialog"]').should(
      'have.text',
      t('nova.apiKeySetting.note.deleteDialogConfirm'),
    )
    cy.get('[data-cy="idaas-api-key-delete-confirm-dialog-cancel-button"]').should('have.text', t('nova.common.cancel'))

    // 登録解除ボタンをクリック
    cy.get('[data-cy="idaas-api-key-delete-confirm-dialog-delete-button"]')
      .should('have.text', t('nova.apiKeySetting.deleteButton'))
      .click()

    cy.wait('@deleteGmoApiKey').then(req => {
      expect(req.request.url).to.include(`rink-idaas/v1/gmo-api-key/${this.gmoApiKeyId}`)
    })

    // 解除完了画面の表示確認
    cy.get('[data-cy="card-title-with-border-title"]').should('have.text', t('nova.apiKeySetting.deleteComplete'))
    cy.get('[data-cy="api-key-result-card-text"]').should('have.text', t('nova.apiKeySetting.note.deleteComplete'))

    // 「API Key設定画面に戻る」ボタンを押下
    cy.get('[data-cy="api-key-result-card-button"]').should('have.text', t('nova.apiKeySetting.moveToSetting')).click()

    // API Key未設定の詳細画面へ戻ることを確認
    cy.get('[data-cy="idaas-api-key-create-message"]').should('exist')
    cy.get('[data-cy="idaas-api-key-create-gmo-api-key"]').find('input').should('have.value', '')
    cy.get('[data-cy="idaas-api-key-create-button"]').should('exist')
  })
})
