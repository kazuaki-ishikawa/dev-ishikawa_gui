import { generateRandomHex, t, stripPrefix } from '@cypress/support/utils'

describe('VPN 新規作成', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)
    cy.fixture('vpns/create.json').then(create => {
      this.createData = create
    })
    cy.fixture('vpns/detail.json').then(detail => {
      this.orderId = detail.orderId
    })
    cy.intercept('GET', '**/ztgict/v1/vpns*', { fixture: 'vpns/list' }).as('getVpnList')
    cy.intercept('GET', '**/ztgict/v1/resource-summary/vpns', { fixture: 'vpns/list' }).as('getSummaryVpnList')
    cy.intercept('POST', '**/ztgict/v1/vpns', { fixture: 'vpns/detail' }).as('postRequest')
    cy.intercept('GET', '**/ztgict/v1/orders/*', { fixture: 'vpns/vpn-create-order' }).as('getOrder')
  })

  it('VPN新規作成 -> オーダー詳細', function () {
    cy.visit(`/tenants/${this.tenantId}/vpns`)
    cy.wait(['@getVpnList'])

    cy.get('[data-cy="vpns-index-create-button"]').click()
    cy.wait('@getSummaryVpnList')

    // 入力画面
    cy.get('[data-cy="card-title-with-border-title"]')
      .as('title')
      .should('have.text', t('nova.applicationForNew.inputTitle'))
    cy.get('[data-cy="card-title-with-border-description"]')
      .as('description')
      .should('have.text', t('nova.vpn.note.create', { linkText: t('common.here') }))

    // ボタン初期値
    cy.get('[data-cy="vpns-create-cancel-button"]')
      .as('cancelButton')
      .should('have.text', t('nova.common.cancel'))
      .and('not.be.disabled')
    cy.get('[data-cy="vpns-create-submit-button"]')
      .as('submitButton')
      .should('have.text', t('nova.common.reviewApplicationDetails'))
      .and('be.disabled')

    cy.get('[data-cy="vpns-create-customer-note"]').find('input').type(this.createData.customerNote)
    cy.get('[data-cy="vpns-create-internal-address"]').find('input').type(stripPrefix(this.createData.internalAddress))
    cy.get('@submitButton').should('not.be.disabled').click()

    // 確認画面
    cy.get('@title').should('have.text', t('nova.applicationForNew.confirmTitle'))
    cy.get('@description').should(
      'have.text',
      `${t('nova.applicationForNew.confirmDescription-1')}${t('nova.vpn.note.internalAddress')}${t('nova.applicationForNew.confirmDescription-2')}`,
    )
    cy.get('[data-cy="vpns-create-customer-note"]').find('input').should('be.disabled')
    cy.get('[data-cy="vpns-create-internal-address"]').find('input').should('be.disabled')

    cy.get('@cancelButton').should('have.text', t('nova.common.return')).and('not.be.disabled')
    cy.get('@submitButton').should('have.text', t('nova.common.apply')).click()

    cy.wait('@postRequest').then(req => {
      expect(req.request.body).to.deep.equals(this.createData)
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

  it('VPN新規作成 -> VPN一覧', function () {
    cy.visit(`/tenants/${this.tenantId}/vpns`)
    cy.wait('@getVpnList')

    cy.get('[data-cy="vpns-index-create-button"]').click()
    cy.wait('@getSummaryVpnList')

    // 入力画面
    cy.get('[data-cy="vpns-create-customer-note"]').find('input').type(this.createData.customerNote)
    cy.get('[data-cy="vpns-create-internal-address"]').find('input').type(stripPrefix(this.createData.internalAddress))
    cy.get('[data-cy="vpns-create-submit-button"]').as('submitButton').click()

    // 確認画面
    cy.get('[data-cy="vpns-create-customer-note"]')
      .find('input')
      .should('have.value', this.createData.customerNote)
      .and('be.disabled')
    cy.get('[data-cy="vpns-create-internal-address"]')
      .find('input')
      .should('have.value', stripPrefix(this.createData.internalAddress))
      .and('be.disabled')
    cy.get('@submitButton').click()

    cy.wait('@postRequest')

    // 完了画面 VPN一覧へボタンを押下
    cy.get('[data-cy="vpns-create-cancel-button"]').click()
    cy.wait('@getVpnList')

    cy.location().should(location => {
      expect(location.pathname).to.eq(`/nova/tenants/${this.tenantId}/vpns`)
      const resourceStatuses = new URLSearchParams(location.search).getAll('resourceStatus')
      expect(resourceStatuses).to.have.members(['active', 'inactive'])
    })

    // ブラウザバックすると最初の画面に戻る（resourceStatusのクエリパラメータが消える）
    cy.go('back')
    cy.wait('@getVpnList')
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/vpns`)
  })
})
