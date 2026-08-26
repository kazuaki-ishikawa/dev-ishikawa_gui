import { generateRandomHex, t } from '@cypress/support/utils'

describe('FICコネクション編集', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)
    this.ficConnectionId = generateRandomHex(32)
    this.orderId = generateRandomHex(32)

    cy.fixture('fic-connections/edit.json').then(edit => {
      this.editData = edit
    })

    cy.intercept('GET', '**/ztgict/v1/resource-summary/fic-connections', { fixture: 'fic-connections/list' }).as(
      'getFicConnectionList',
    )
    cy.intercept('GET', '**/ztgict/v1/fic-connections/*', { fixture: 'fic-connections/detail' }).as('getFicConnection')
    cy.intercept('GET', `**/ztgict/v1/orders/${this.orderId}`, { response: { statusCode: 200 } }).as('getOrder')
    cy.intercept('PUT', '**/ztgict/v1/fic-connections/*', { body: { orderId: this.orderId } }).as('putRequest')
  })

  it('FICコネクション編集 -> オーダー詳細', function () {
    cy.visit(`tenants/${this.tenantId}/fic-connections/${this.ficConnectionId}`)
    cy.wait('@getFicConnection')

    cy.get('[data-cy="fic-connection-id-index-edit-button"]').click()
    cy.url().should('include', `/tenants/${this.tenantId}/fic-connections/${this.ficConnectionId}/edit`)
    cy.wait(['@getFicConnection', '@getFicConnectionList'])

    cy.get('[data-cy="fic-connection-id-edit-customer-note"]').find('input').clear().type(this.editData.customerNote)
    cy.inputSelectForm({
      selector: '[data-cy="fic-connection-id-edit-route-advertisement"]',
      value: t(`fic.${this.editData.routeAdvertisement}`),
    })
    cy.contains(t('fic.ficPremium')).should('exist')
    cy.get('[data-cy="fic-connection-id-edit-save-button"]').should('have.text', t('common.confirm')).click()

    cy.get('[data-cy="fic-connection-id-edit-customer-note"]').find('input').should('be.disabled')
    cy.get('[data-cy="fic-connection-id-edit-route-advertisement"]').find('input').should('be.disabled')
    cy.get('[data-cy="fic-connection-id-edit-save-button"]').should('have.text', t('common.save')).click()

    cy.wait('@putRequest').then(req => {
      expect(req.request.url).to.include(`ztgict/v1/fic-connections/${this.ficConnectionId}`)
      expect(req.request.body.customerNote).to.eq(this.editData.customerNote)
      expect(req.request.body.routeAdvertisement).to.eq(this.editData.routeAdvertisement)
      expect(req.request.body).to.not.have.property('ficPremium')
    })

    cy.url().should(
      'eq',
      `${Cypress.config().baseUrl}/tenants/${this.tenantId}/fic-connections/${this.ficConnectionId}`,
    )
    cy.wait('@getFicConnection')

    // PUT fic-connections の成功メッセージを確認
    cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('message.accepted'))
    // 「オーダー詳細に遷移」ボタンを押してオーダー詳細画面に遷移することを確認する
    cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
    cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.moveToOrderDetail')).click()
    cy.get('[data-cy="notification-dialog-text"]').should('not.exist')

    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/orders/${this.orderId}`)
    cy.wait('@getOrder')

    // オーダー詳細画面の戻るボタンを押してFIC詳細画面に戻る
    cy.get('[data-cy="orders-id-index-return-button"]').should('have.text', t('common.return')).click()
    // 一覧画面に戻る
    cy.url().should(
      'eq',
      `${Cypress.config().baseUrl}/tenants/${this.tenantId}/fic-connections/${this.ficConnectionId}`,
    )
    cy.wait('@getFicConnection')
  })
})
