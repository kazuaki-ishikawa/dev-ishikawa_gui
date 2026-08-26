import { generateRandomHex, t } from '@cypress/support/utils'

describe('vpn edit', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)
    this.vpnId = generateRandomHex(32)
    this.orderId = generateRandomHex(32)

    cy.fixture('vpns/edit.json').then(edit => {
      this.editData = edit
    })
    cy.intercept('GET', '**/ztgict/v1/resource-summary/vpns', { fixture: 'vpns/list' }).as('getSummaryVpnList')
    cy.intercept('GET', '**/ztgict/v1/vpns/*', { fixture: 'vpns/detail' }).as('getVpn')
    cy.intercept('PUT', '**/ztgict/v1/vpns/*', { body: { orderId: this.orderId } }).as('putRequest')
    cy.intercept('GET', `**/ztgict/v1/orders/${this.orderId}`, { response: { statusCode: 200 } }).as('getOrder')
  })

  it('vpn edit', function () {
    cy.visit(`/tenants/${this.tenantId}/vpns/${this.vpnId}`)
    cy.wait(['@getVpn'])

    cy.get('[data-cy="vpn-id-index-edit-button"]').click()
    cy.wait(['@getVpn', '@getSummaryVpnList'])
    cy.url().should('include', `/tenants/${this.tenantId}/vpns/${this.vpnId}/edit`)

    cy.get('[data-cy="vpn-id-edit-customer-note"]').find('input').clear().type(this.editData.customerNote)
    cy.get('[data-cy="vpn-id-edit-save-button"]').should('have.text', t('common.confirm')).click()

    cy.get('[data-cy="vpn-id-edit-customer-note"]').find('input').should('be.disabled')
    cy.get('[data-cy="vpn-id-edit-save-button"]').should('have.text', t('common.save')).click()

    cy.wait('@putRequest').then(req => {
      expect(req.request.url).to.include(`/ztgict/v1/vpns/${this.vpnId}`)
      expect(req.request.body.customerNote).to.eq(this.editData.customerNote)
    })

    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/vpns/${this.vpnId}`)
    cy.wait(['@getVpn'])

    // PUT vpns の成功メッセージを確認
    cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('message.accepted'))
    // 「オーダー詳細へ」ボタンを押してオーダー詳細画面に遷移することを確認する
    cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
    cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.moveToOrderDetail')).click()
    cy.get('[data-cy="notification-dialog-text"]').should('not.exist')

    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/orders/${this.orderId}`)
    cy.wait('@getOrder')

    // オーダー詳細画面の戻るボタンを押して詳細画面に戻る
    cy.get('[data-cy="orders-id-index-return-button"]').should('have.text', t('common.return')).click()
    // 詳細画面に戻る
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/vpns/${this.vpnId}`)
    cy.wait(['@getVpn'])
  })
})
