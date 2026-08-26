import { generateRandomHex, t } from '@cypress/support/utils'

describe('特定通信ブレイクアウト対象 削除', () => {
  before(function () {
    this.tenantId = generateRandomHex(32)
    this.breakOutListId = generateRandomHex(32)

    cy.intercept('GET', '**/ztgict/v1/break-out-lists', { fixture: 'break-out-lists/list' }).as(
      'getBreakOutListWithoutQuery',
    )
    cy.intercept('GET', '**/ztgict/v1/break-out-lists/*', { fixture: 'break-out-lists/detail' }).as('getBreakOut')
    cy.intercept('DELETE', `**/ztgict/v1/break-out-lists/${this.breakOutListId}`, {}).as('deleteRequest')
    cy.intercept('GET', '**/ztgict/v1/resource-summary/terminals*', { fixture: 'terminals/list' }).as('getTerminalList')
  })

  it('削除', function () {
    // 詳細画面へ遷移
    cy.visit(`/tenants/${this.tenantId}/break-out-lists/${this.breakOutListId}`)
    cy.wait(['@getTerminalList', '@getBreakOut'])
    // 削除ボタン押下
    cy.get('[data-cy="break-out-lists-id-index-delete-button"]').should('have.text', t('common.delete')).click()

    // ダイアログの廃止ボタン押下
    cy.get('.dialog-base-submit-button').as('submitButton')
    cy.get('@submitButton').should('not.be.disabled')
    cy.get('@submitButton').should('have.text', t('common.delete')).click()

    cy.wait('@deleteRequest')
    cy.wait('@getBreakOutListWithoutQuery')
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/break-out-lists`)

    // 削除の成功メッセージを確認
    cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('message.deleted'))
    cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
    cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.close')).click()
    cy.get('[data-cy="notification-dialog-text"]').should('not.exist')
  })
})
