import { generateRandomHex, t } from '@cypress/support/utils'

describe('お客さま自営ルーター削除', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)
    this.selfTerminalId = generateRandomHex(32)
    cy.fixture('self-terminals/detail.json').then(data => {
      this.selfTerminal = data
    })

    cy.intercept('GET', '**/ztgict/v1/self-terminals/*', { fixture: 'self-terminals/detail' }).as('getSelfTerminal')
    cy.intercept('GET', '**/ztgict/v1/resource-summary/terminals*', { fixture: 'terminals/list' }).as('getTerminalList')
    cy.intercept('DELETE', '**/ztgict/v1/self-terminals/*', {}).as('deleteRequest')
    cy.intercept('GET', '**/ztgict/v1/settings/behavior-detection', {
      fixture: 'behavior-detection/settings',
    }).as('getBehaviorDetection')
  })
  it('お客さま自営ルーター削除', function () {
    // 詳細画面に遷移
    cy.visit(`/tenants/${this.tenantId}/self-terminals/${this.selfTerminalId}`)
    cy.wait(['@getSelfTerminal'])

    // 削除ボタン押下
    cy.get('[data-cy="self-terminals-id-index-delete-button"]')
      .should('not.be.disabled')
      .should('have.text', t('common.delete'))
      .click()

    // ダイアログ確認
    cy.get('[data-cy="self-terminals-id-index-delete-confirmation-dialog"]').should('exist')
    cy.get('[data-cy="delete-confirmation-dialog-abolition-notice"]')
      .should('exist')
      .should('have.text', t('terminals.note.abolitionNotice'))

    // ダイアログの削除ボタン押下
    cy.get('.dialog-base-submit-button').as('submitButton')
    cy.get('@submitButton').should('not.be.disabled')
    cy.get('@submitButton').should('have.text', t('common.delete')).click()

    cy.wait('@deleteRequest').then(req => {
      expect(req.request.url).to.include(`ztgict/v1/self-terminals/${this.selfTerminalId}`)
    })
    // 一覧画面に戻る
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/terminals`)
    cy.wait(['@getTerminalList'])

    // DELETE vpns の成功メッセージを確認
    cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('message.deleted'))
    cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
    cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.close')).click()
    cy.get('[data-cy="notification-dialog-text"]').should('not.exist')
  })
})
