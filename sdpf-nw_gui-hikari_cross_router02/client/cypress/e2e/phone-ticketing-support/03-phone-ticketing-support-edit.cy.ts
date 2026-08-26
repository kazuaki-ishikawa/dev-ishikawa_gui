import { generateRandomHex, t } from '@cypress/support/utils'

describe('phone ticketing support update', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)
    this.orderId = generateRandomHex(32)

    cy.fixture('phone-ticketing-support/edit.json').then(edit => {
      this.editData = edit
    })

    cy.intercept('GET', '**/ztgict/v1/settings/phone-ticketing-support', {
      fixture: 'phone-ticketing-support/enabled',
    }).as('getRequest')
    cy.intercept('PUT', '**/ztgict/v1/settings/phone-ticketing-support', {
      body: { orderId: this.orderId },
    }).as('putRequest')
    cy.intercept('GET', `**/ztgict/v1/orders/${this.orderId}`, { response: { statusCode: 200 } }).as('getOrder')
  })

  it('phone ticketing support update', function () {
    // 詳細画面
    cy.visit(`/tenants/${this.tenantId}/supports/phone-ticketing-support`)
    cy.wait('@getRequest')
    // 編集画面
    cy.get('[data-cy="phone-ticketing-support-edit-button"]').click()
    cy.wait('@getRequest')

    cy.get('[data-cy="phone-ticketing-support-edit-save-button"]')
      .should('have.text', t('common.confirm'))
      .should('be.disabled')
    cy.get('[data-cy="phone-ticketing-support-edit-cancel-button"]')
      .should('have.text', t('common.cancel'))
      .should('not.be.disabled')

    cy.get('[data-cy="phone-ticketing-support-edit-pic-name"]').find('input').clear().type(this.editData.picName)
    cy.get('[data-cy="phone-ticketing-support-edit-pic-phone-number"]')
      .find('input')
      .clear()
      .type(this.editData.picPhoneNumber)
    cy.get('[data-cy="phone-ticketing-support-edit-save-button"]').click()

    cy.get('[data-cy="phone-ticketing-support-edit-pic-name"]').find('input').should('be.disabled')
    cy.get('[data-cy="phone-ticketing-support-edit-pic-phone-number"]').find('input').should('be.disabled')
    cy.get('[data-cy="phone-ticketing-support-edit-cancel-button"]')
      .should('have.text', t('common.return'))
      .should('not.be.disabled')
    cy.get('[data-cy="phone-ticketing-support-edit-save-button"]').should('have.text', t('common.save')).click()

    cy.wait('@putRequest').then(req => {
      expect(req.request.body).to.deep.eq(this.editData)
    })

    // PUT phone-ticketing-support の成功メッセージを確認
    cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('message.accepted'))
    // 「オーダー詳細へ」ボタンを押してオーダー詳細画面に遷移することを確認する
    cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
    cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.moveToOrderDetail')).click()
    cy.get('[data-cy="notification-dialog-text"]').should('not.exist')

    cy.wait('@getOrder')
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/orders/${this.orderId}`)

    // オーダー詳細画面の戻るボタンを押して詳細画面に戻る
    cy.get('[data-cy="orders-id-index-return-button"]').should('have.text', t('common.return')).click()
    // 詳細画面に戻る
    cy.wait('@getRequest')
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/supports/phone-ticketing-support`)
  })
})
