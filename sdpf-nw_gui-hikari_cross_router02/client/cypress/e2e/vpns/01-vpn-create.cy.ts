import { generateRandomHex, t, stripPrefix } from '@cypress/support/utils'

describe('vpn create', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)
    cy.fixture('vpns/create.json').then(create => {
      this.createData = create
    })
    cy.fixture('vpns/detail.json').then(detail => {
      this.orderId = detail.orderId
    })
    cy.intercept('GET', '**/ztgict/v1/vpns', { fixture: 'vpns/list' }).as('getVpnList')
    cy.intercept('GET', '**/ztgict/v1/resource-summary/vpns', { fixture: 'vpns/list' }).as('getSummaryVpnList')
    cy.intercept('POST', '**/ztgict/v1/vpns', { fixture: 'vpns/detail' }).as('postRequest')
    cy.intercept('GET', '**/ztgict/v1/orders/*', { fixture: 'vpns/vpn-create-order' }).as('getOrder')
  })

  it('VPN新規作成 -> オーダー詳細', function () {
    cy.visit(`/tenants/${this.tenantId}/vpns`)
    cy.wait('@getVpnList')
    cy.get('.vpn-create-button').click()
    cy.wait('@getSummaryVpnList')
    cy.get('[data-cy="vpn-create-customer-note"]').find('input').type(this.createData.customerNote)
    cy.get('[data-cy="vpn-create-internal-address"]').find('input').type(stripPrefix(this.createData.internalAddress))
    cy.get('[data-cy="vpn-create-submit"]').should('have.text', t('common.confirm')).click()

    cy.get('[data-cy="vpn-create-customer-note"]').find('input').should('be.disabled')
    cy.get('[data-cy="vpn-create-internal-address"]').find('input').should('be.disabled')
    cy.get('[data-cy="vpn-create-submit"]').should('have.text', t('common.create')).click()

    cy.wait('@postRequest').then(req => {
      expect(req.request.url).to.include('ztgict/v1/vpns')
      expect(req.request.body).to.deep.equals(this.createData)
    })
    // POST後は一律で一覧画面に戻る
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/vpns`)
    cy.wait('@getVpnList')

    // POST vpns の成功メッセージを確認
    cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('message.accepted'))
    // 「オーダー詳細画面へ」ボタンを押下
    cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
    cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.moveToOrderDetail')).click()
    cy.get('[data-cy="notification-dialog-text"]').should('not.exist')

    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/orders/${this.orderId}`)
    cy.wait('@getOrder')

    // オーダー詳細画面の戻るボタンを押してVPN一覧画面に戻る
    cy.get('[data-cy="orders-id-index-return-button"]').should('have.text', t('common.return')).click()
    // 一覧画面に戻る
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/vpns`)
    cy.wait('@getVpnList')
  })

  it('VPN新規作成 -> 閉じる', function () {
    cy.visit(`/tenants/${this.tenantId}/vpns`)
    cy.wait('@getVpnList')
    cy.get('.vpn-create-button').click()
    cy.wait('@getSummaryVpnList')
    cy.get('[data-cy="vpn-create-customer-note"]').find('input').type(this.createData.customerNote)
    cy.get('[data-cy="vpn-create-internal-address"]').find('input').type(stripPrefix(this.createData.internalAddress))
    cy.get('[data-cy="vpn-create-submit"]').should('have.text', t('common.confirm')).click()

    cy.get('[data-cy="vpn-create-customer-note"]').find('input').should('be.disabled')
    cy.get('[data-cy="vpn-create-internal-address"]').find('input').should('be.disabled')
    cy.get('[data-cy="vpn-create-submit"]').should('have.text', t('common.create')).click()

    cy.wait('@postRequest')
    // POST後は一律で一覧画面に戻る
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/vpns`)
    cy.wait('@getVpnList')

    // POST vpns の成功メッセージを確認
    cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('message.accepted'))
    cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
    cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.moveToOrderDetail'))
    // ダイアログの閉じるボタンを押す
    cy.get('.dialog-card-close').click()
    cy.get('[data-cy="notification-dialog-text"]').should('not.exist')
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/vpns`)
  })
})
