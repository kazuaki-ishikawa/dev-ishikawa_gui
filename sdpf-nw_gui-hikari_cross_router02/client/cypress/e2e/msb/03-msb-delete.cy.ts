import { generateRandomHex, t } from '@cypress/support/utils'

describe('msb delete', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)
    this.resourceId = generateRandomHex(32)

    cy.fixture('msb/delete').then(data => {
      this.deleteResponse = data.response
      this.deleteRequest = data.request
    })

    cy.intercept('GET', '**/msb/v1/rink-msb-contracts', { fixture: 'msb/detail' }).as('getMsb')
    cy.intercept('GET', '**/msb/v1/threat-notice', { statusCode: 404, body: {} }).as('getThreatNotice')
    cy.intercept('GET', '**/msb/v1/rink-msb-contracts/*/licenses', { fixture: 'msb/detail' }).as('getMsbLicenses')
    cy.intercept('DELETE', '**/msb/v1/rink-msb-contracts/*', { body: this.deleteResponse }).as('deleteMsb')

    // 受付時間内の日時に固定
    cy.clock(new Date('2024-04-22T00:00:00Z'), ['Date'])
  })

  it('MSB廃止', function () {
    cy.visit(`/tenants/${this.tenantId}/msb/${this.resourceId}`)
    cy.wait(['@getMsbLicenses', '@getThreatNotice'])

    // 廃止ボタンをクリック
    cy.get('[data-cy="msb-id-index-delete-button"]').click()
    cy.wait('@getMsb')

    // 廃止情報入力
    cy.get('[data-cy="msb-id-remove-reason"]').find('input').type(this.deleteRequest.reason)
    cy.get('[data-cy="msb-id-remove-email-address"]').find('input').type(this.deleteRequest.emailAddress)
    cy.get('[data-cy="msb-id-remove-customer-special-note"]').find('input').type(this.deleteRequest.customerSpecialNote)

    // 確認ボタンをクリック
    cy.get('[data-cy="msb-id-remove-submit-button"]').should('have.text', t('common.confirm')).click()

    // 確認画面で入力が無効化されていることを確認
    cy.get('[data-cy="msb-id-remove-reason"]').find('input').should('be.disabled')
    cy.get('[data-cy="msb-id-remove-email-address"]').find('input').should('be.disabled')
    cy.get('[data-cy="msb-id-remove-customer-special-note"]').find('input').should('be.disabled')

    // 削除用の intercept を作成 (廃止後は MSB は存在しないため、404が返る。)
    cy.intercept('GET', '**/msb/v1/rink-msb-contracts', { statusCode: 404, body: {} }).as('getMsbAfterDelete')
    // 廃止ボタンをクリック
    cy.get('[data-cy="msb-id-remove-submit-button"]').should('have.text', t('common.delete')).click()

    cy.wait('@deleteMsb').then(req => {
      expect(req.request.body).to.deep.equals(this.deleteRequest)
    })

    // DELETE後は詳細画面に戻る
    cy.wait(['@getThreatNotice', '@getMsbAfterDelete'])
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/msb`)

    // DELETE msb の成功メッセージを確認
    cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('message.accepted'))
    cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
    cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.close'))

    // ダイアログの閉じるボタンを押す
    cy.get('.dialog-card-close').click()
    cy.get('[data-cy="notification-dialog-text"]').should('not.exist')
  })
})
