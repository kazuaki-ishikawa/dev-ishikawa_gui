import { generateRandomHex, t } from '@cypress/support/utils'

describe('特定通信ブレイクアウト対象 新規作成', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)
    this.orderId = generateRandomHex(32)

    cy.fixture('break-out-lists/create.json').then(create => {
      this.createData = create
    })
    cy.intercept('GET', '**/ztgict/v1/break-out-lists?resourceStatus=active&resourceStatus=inactive', {
      fixture: 'break-out-lists/list',
    }).as('getBreakOutList')
    cy.intercept('GET', '**/ztgict/v1/break-out-lists', { fixture: 'break-out-lists/list' }).as(
      'getBreakOutListWithoutQuery',
    )
    cy.intercept('POST', '**/ztgict/v1/break-out-lists', { body: { orderId: this.orderId } }).as('postRequest')
    cy.intercept('GET', `**/ztgict/v1/orders/${this.orderId}`, { response: { statusCode: 200 } }).as('getOrder')
  })

  it('新規作成 -> オーダー詳細', function () {
    cy.visit(`/tenants/${this.tenantId}/break-out-lists`)
    cy.wait('@getBreakOutListWithoutQuery')
    cy.get('[data-cy="break-out-lists-index-create-button"]').click()
    cy.wait('@getBreakOutList')

    cy.get('[data-cy="break-out-lists-create-customer-note"]').find('input').type(this.createData.customerNote)
    cy.get('[data-cy="break-out-lists-create-fqdn-list"]').find('textarea').type(this.createData.fqdnList.join('\n'))
    cy.get('[data-cy="break-out-lists-create-prefix-list"]')
      .find('textarea')
      .type(this.createData.prefixList.join('\n'))

    // 確認ボタンを押下
    cy.get('[data-cy="break-out-lists-create-submit-button"]').should('have.text', t('common.confirm')).click()

    // 確認画面のチェック
    cy.get('[data-cy="break-out-lists-create-customer-note"]')
      .find('input')
      .should('have.value', this.createData.customerNote)
      .should('be.disabled')
    cy.get('[data-cy="break-out-lists-create-fqdn-list"]')
      .find('textarea')
      .should('have.value', this.createData.fqdnList.join('\n'))
      .should('be.disabled')
    cy.get('[data-cy="break-out-lists-create-prefix-list"]')
      .find('textarea')
      .should('have.value', this.createData.prefixList.join('\n'))
      .should('be.disabled')

    // 作成ボタンを押下
    cy.get('[data-cy="break-out-lists-create-submit-button"]').should('have.text', t('common.create')).click()

    cy.wait('@postRequest').then(req => {
      expect(req.request.url).to.include('ztgict/v1/break-out-lists')
      expect(req.request.body).to.deep.equals(this.createData)
    })
    // POST後は一律で一覧画面に戻る
    cy.wait('@getBreakOutListWithoutQuery')
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/break-out-lists`)

    // POST break-out-lists の成功メッセージを確認
    cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('message.accepted'))
    // 「オーダー詳細画面へ」ボタンを押下
    cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
    cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.moveToOrderDetail')).click()
    cy.wait('@getOrder')
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/orders/${this.orderId}`)
    cy.get('[data-cy="notification-dialog-text"]').should('not.exist')

    // オーダー詳細画面の戻るボタンを押してブレイクアウト一覧画面に戻る
    cy.get('[data-cy="orders-id-index-return-button"]').should('have.text', t('common.return')).click()
    // 一覧画面に戻る
    cy.wait('@getBreakOutListWithoutQuery')
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/break-out-lists`)
  })

  it('新規作成 -> 閉じる', function () {
    cy.visit(`/tenants/${this.tenantId}/break-out-lists`)
    cy.wait('@getBreakOutListWithoutQuery')
    cy.get('[data-cy="break-out-lists-index-create-button"]').click()
    cy.wait('@getBreakOutList')

    cy.get('[data-cy="break-out-lists-create-customer-note"]').find('input').type(this.createData.customerNote)
    cy.get('[data-cy="break-out-lists-create-fqdn-list"]').find('textarea').type(this.createData.fqdnList.join('\n'))
    cy.get('[data-cy="break-out-lists-create-prefix-list"]')
      .find('textarea')
      .type(this.createData.prefixList.join('\n'))
    // 確認ボタンを押下
    cy.get('[data-cy="break-out-lists-create-submit-button"]').click()
    // 作成ボタンを押下
    cy.get('[data-cy="break-out-lists-create-submit-button"]').click()
    cy.wait('@postRequest')
    // POST後は一律で一覧画面に戻る
    cy.wait('@getBreakOutListWithoutQuery')
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/break-out-lists`)

    // ダイアログの閉じるボタンを押す
    cy.get('.dialog-card-close').click()
    cy.get('.dialog-main').should('not.exist')
  })
})
