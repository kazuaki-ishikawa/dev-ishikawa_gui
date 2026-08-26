import { generateRandomHex, t } from '@cypress/support/utils'

describe('VPN変更', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)
    this.vpnId = generateRandomHex(32)
    this.orderId = generateRandomHex(32)

    cy.fixture('vpns/edit.json').then(edit => {
      this.editData = edit
    })
    cy.fixture('vpns/detail.json').then(data => {
      this.detailData = data
    })
    cy.intercept('GET', '**/ztgict/v1/vpns*', { fixture: 'vpns/list' }).as('getVpnList')
    cy.intercept('GET', '**/ztgict/v1/resource-summary/vpns', { fixture: 'vpns/list' }).as('getSummaryVpnList')
    cy.intercept('GET', '**/ztgict/v1/vpns/*', { fixture: 'vpns/detail' }).as('getVpn')
    cy.intercept('PUT', '**/ztgict/v1/vpns/*', { body: { orderId: this.orderId } }).as('putRequest')
    cy.intercept('GET', `**/ztgict/v1/orders/${this.orderId}`, { response: { statusCode: 200 } }).as('getOrder')
  })

  it('VPN変更 -> オーダー詳細', function () {
    cy.visit(`/tenants/${this.tenantId}/vpns/${this.vpnId}`)
    cy.wait(['@getVpn'])

    cy.get('[data-cy="vpns-id-index-edit-button"]').click()
    cy.wait(['@getVpn', '@getSummaryVpnList'])
    cy.url().should('include', `/tenants/${this.tenantId}/vpns/${this.vpnId}/edit`)

    // 入力画面
    cy.get('[data-cy="card-title-with-border-title"]')
      .eq(0)
      .as('title')
      .should('have.text', t('nova.update.inputTitle'))
    cy.get('[data-cy="card-title-with-border-description"]').eq(0).as('description').should('have.text', '')

    // ボタン初期値
    cy.get('[data-cy="vpns-id-edit-cancel-button"]')
      .as('cancelButton')
      .should('have.text', t('nova.common.cancel'))
      .and('not.be.disabled')
    cy.get('[data-cy="vpns-id-edit-submit-button"]')
      .as('submitButton')
      .should('have.text', t('nova.common.reviewApplicationDetails'))
      .and('be.disabled')

    cy.get('[data-cy="vpns-id-edit-customer-note"]').find('input').clear().type(this.editData.customerNote)
    cy.get('@submitButton').should('not.be.disabled').click()

    // 確認画面
    cy.get('@title').should('have.text', t('nova.update.confirmTitle'))
    cy.get('@description').should('have.text', t('nova.update.confirmDescription'))
    cy.get('[data-cy="vpns-id-edit-customer-note"]')
      .find('input')
      .should('have.length', 2)
      .each(input => {
        cy.wrap(input).should('be.disabled')
      })
    cy.get('@cancelButton').should('have.text', t('nova.common.return')).and('not.be.disabled')
    cy.get('@submitButton').should('have.text', t('nova.common.apply')).click()

    cy.wait('@putRequest').then(req => {
      expect(req.request.url).to.include(`/ztgict/v1/vpns/${this.vpnId}`)
      expect(req.request.body).to.deep.equals({ customerNote: this.editData.customerNote })
    })

    // 完了画面
    cy.get('@title').should('have.text', t('nova.applicationForNew.completeTitle'))
    cy.get('[data-cy="card-item-completed-order-id"]').should(
      'have.text',
      t('nova.update.orderId', { orderId: this.orderId }),
    )
    cy.get('@cancelButton').should('have.text', t('nova.vpn.moveToList')).and('not.be.disabled')
    cy.get('@submitButton').should('have.text', t('nova.common.moveToOrderDetail')).click()

    // オーダー詳細画面に遷移
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/orders/${this.orderId}`)

    // TODO: オーダー詳細画面が作成されたら追加する
    // cy.wait('@getOrder')

    // // オーダー詳細画面の戻るボタンを押してVPN一覧画面に戻る
    // cy.get('[data-cy="orders-id-index-return-button"]').should('have.text', t('common.return')).click()
    // // 一覧画面に戻る
    // cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/vpns`)
    // cy.wait('@getVpnList')
  })

  it('VPN変更 -> VPN一覧', function () {
    cy.visit(`/tenants/${this.tenantId}/vpns/${this.vpnId}`)
    cy.wait(['@getVpn'])

    cy.get('[data-cy="vpns-id-index-edit-button"]').click()
    cy.wait(['@getVpn', '@getSummaryVpnList'])
    cy.url().should('include', `/tenants/${this.tenantId}/vpns/${this.vpnId}/edit`)

    // 入力画面
    cy.get('[data-cy="vpns-id-edit-customer-note"]').find('input').clear().type(this.editData.customerNote)
    cy.get('[data-cy="vpns-id-edit-submit-button"]').as('submitButton').should('not.be.disabled').click()

    // 確認画面
    cy.get('[data-cy="vpns-id-edit-customer-note"]')
      .find('input')
      .eq(0)
      .should('have.value', this.detailData.customerNote)
    cy.get('[data-cy="vpns-id-edit-customer-note"]')
      .find('input')
      .eq(1)
      .should('have.value', this.editData.customerNote)
    cy.get('@submitButton').should('have.text', t('nova.common.apply')).click()

    cy.wait(['@putRequest'])

    // 完了画面 VPN一覧へボタンを押下
    cy.get('[data-cy="vpns-id-edit-cancel-button"]').click()
    cy.wait(['@getVpnList'])

    cy.location().should(location => {
      expect(location.pathname).to.eq(`/nova/tenants/${this.tenantId}/vpns`)
      const resourceStatuses = new URLSearchParams(location.search).getAll('resourceStatus')
      expect(resourceStatuses).to.have.members(['active', 'inactive'])
    })

    // ブラウザバックすると最初の詳細画面に戻る
    cy.go('back')
    cy.wait(['@getVpn'])
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/vpns/${this.vpnId}`)
  })
})
