import { generateRandomHex, t } from '@cypress/support/utils'

describe('fic-connection create', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)
    cy.fixture('fic-connections/create.json').then(create => {
      this.createData = {
        customerNote: create.customerNote,
        vpnId: create.vpnId,
        routeAdvertisement: create.routeAdvertisement,
        ficPremium: create.ficPremium,
      }
      this.publicServiceKey = create.publicServiceKey
      this.orderId = create.orderId
    })
    cy.fixture('vpns/list.json').then(data => {
      this.vpnList = data.vpns
    })
    cy.intercept('GET', '**/ztgict/v1/resource-summary/fic-connections', { fixture: 'fic-connections/list' }).as(
      'getFicConnectionList',
    )
    cy.intercept('GET', '**/ztgict/v1/resource-summary/vpns', { fixture: 'vpns/list' }).as('getVpnList')
    cy.intercept('POST', '**/ztgict/v1/fic-connections', { fixture: 'fic-connections/create' }).as('postRequest')
    cy.intercept('GET', '**/ztgict/v1/orders/*', { fixture: 'fic-connections/fic-connection-create-order' }).as(
      'getOrder',
    )

    cy.visit(`/tenants/${this.tenantId}/fic-connections`)
  })

  it('Flexible InterConnectと接続 -> オーダー詳細', function () {
    cy.wait('@getFicConnectionList')
    // 新規作成画面に遷移
    cy.get('[data-cy="fic-connections-index-create-button"]').click()
    cy.wait('@getVpnList')
    cy.get('[data-cy="fic-connections-create-request-type-radio-button"]').should('exist')

    // 非表示項目の確認
    cy.get('[data-cy="fic-connection-image"]').should('not.exist')
    cy.get('[data-cy="simple-fic-connection-image"]').should('not.exist')
    cy.get('[data-cy="fic-connection-create-customer-note"]').should('not.exist')
    cy.get('[data-cy="fic-connection-create-vpn-id"]').should('not.exist')
    cy.get('[data-cy="fic-connection-create-route-advertisement"]').should('not.exist')
    cy.get('[data-cy="fic-connection-create-cancel-button"]').should('not.exist')
    cy.get('[data-cy="fic-connection-create-submit-button"]').should('not.exist')

    // 申込種別(fic-connection)を選択
    cy.get('[data-cy="fic-connections-create-request-type-radio-button"]').find('.label.fic-connection').click()
    // 表示・非表示項目の確認
    cy.get('[data-cy="fic-connection-image"]').should('exist')
    cy.get('[data-cy="simple-fic-connection-image"]').should('not.exist')
    cy.get('[data-cy="fic-connection-create-customer-note"]').should('not.exist')
    cy.get('[data-cy="fic-connection-create-vpn-id"]').should('not.exist')
    cy.get('[data-cy="fic-connection-create-route-advertisement"]').should('not.exist')
    cy.get('[data-cy="fic-connection-create-cancel-button"]').should('not.exist')
    cy.get('[data-cy="fic-connection-create-submit-button"]').should('not.exist')

    // STEP1をクリック
    cy.get('[data-cy="fic-connection-image"]').find('[data-cy="step-box"]').first().click()

    // 入力画面に遷移
    cy.get('[data-cy="fic-connections-create-request-type-radio-button"]').should('not.exist')
    // 非表示項目の確認
    cy.get('[data-cy="fic-connection-image"]').should('not.exist')
    cy.get('[data-cy="simple-fic-connection-image"]').should('not.exist')
    // 入力
    cy.get('[data-cy="fic-connection-create-customer-note"]').find('input').type(this.createData.customerNote)
    cy.inputSelectForm({
      selector: '[data-cy="fic-connection-create-vpn-id"]',
      value: this.createData.vpnId,
    })
    cy.inputSelectForm({
      selector: '[data-cy="fic-connection-create-route-advertisement"]',
      value: t(`fic.${this.createData.routeAdvertisement}`),
    })
    cy.get('[data-cy="fic-connection-create-fic-premium"]')
      .find('.radio')
      .find(`.label.${this.createData.ficPremium}`)
      .click()

    // 確認画面に遷移
    cy.get('[data-cy="fic-connection-create-cancel-button"]').should('have.text', t('common.cancel'))
    cy.get('[data-cy="fic-connection-create-submit-button"]').should('have.text', t('common.confirm')).click()

    // 確認画面の表示確認
    cy.get('[data-cy="fic-connection-create-customer-note"]').find('input').should('be.disabled')
    cy.get('[data-cy="fic-connection-create-vpn-id"]').find('input').should('be.disabled')
    cy.get('[data-cy="fic-connection-create-route-advertisement"]').find('input').should('be.disabled')
    cy.get('[data-cy="fic-connection-create-fic-premium"]').find('.radio').should('have.class', 'disabled')

    // 作成ボタン押下
    cy.get('[data-cy="fic-connection-create-cancel-button"]').should('have.text', t('common.return'))
    cy.get('[data-cy="fic-connection-create-submit-button"]').should('have.text', t('common.create')).click()

    cy.wait('@postRequest').then(req => {
      expect(req.request.url).to.include('ztgict/v1/fic-connections')
      expect(req.request.body).to.deep.eq(this.createData)
    })

    // POST fic-connections の成功メッセージを確認
    cy.get('.dialog-card-content').should(
      'have.text',
      t('fic.message.created', {
        sellerKey: this.publicServiceKey,
      }),
    )
    // 「FICコンソールに遷移」ボタンが表示されることを確認する
    cy.get('[data-cy="fic-connection-create-dialog-move-to-fic-console-button"]').should(
      'have.text',
      t('fic.moveToConnectionCreation'),
    )
    // 「オーダー詳細に遷移」ボタンを押してオーダー詳細画面に遷移することを確認する
    cy.get('[data-cy="fic-connection-create-dialog-move-to-order-detail-button"]')
      .should('have.text', t('common.moveToOrderDetail'))
      .click()
    cy.wait('@getOrder')
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/orders/${this.orderId}`)
    cy.get('.dialog-main').should('not.exist')

    // オーダー詳細画面の戻るボタンを押してFIC一覧画面に戻る
    cy.get('[data-cy="orders-id-index-return-button"]').should('have.text', t('common.return')).click()
    // 一覧画面に戻る
    cy.wait('@getFicConnectionList')
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/fic-connections`)
  })

  it('[かんたん接続]を利用して接続 を選択した時の画面表示', function () {
    // 新規作成画面に遷移
    cy.get('[data-cy="fic-connections-index-create-button"]').click()
    cy.get('[data-cy="fic-connections-create-request-type-radio-button"]').should('exist')

    // 非表示項目の確認
    cy.get('[data-cy="fic-connection-image"]').should('not.exist')
    cy.get('[data-cy="simple-fic-connection-image"]').should('not.exist')
    cy.get('[data-cy="fic-connection-create-customer-note"]').should('not.exist')
    cy.get('[data-cy="fic-connection-create-vpn-id"]').should('not.exist')
    cy.get('[data-cy="fic-connection-create-route-advertisement"]').should('not.exist')
    cy.get('[data-cy="fic-connection-create-cancel-button"]').should('not.exist')
    cy.get('[data-cy="fic-connection-create-submit-button"]').should('not.exist')

    // 申込種別(simple-fic-connection)を選択
    cy.get('[data-cy="fic-connections-create-request-type-radio-button"]').find('.label.simple-fic-connection').click()
    // 表示・非表示項目の確認
    cy.get('[data-cy="fic-connection-image"]').should('not.exist')
    cy.get('[data-cy="simple-fic-connection-image"]').should('exist')
    cy.get('[data-cy="fic-connection-create-customer-note"]').should('not.exist')
    cy.get('[data-cy="fic-connection-create-vpn-id"]').should('not.exist')
    cy.get('[data-cy="fic-connection-create-route-advertisement"]').should('not.exist')
    cy.get('[data-cy="fic-connection-create-cancel-button"]').should('not.exist')
    cy.get('[data-cy="fic-connection-create-submit-button"]').should('not.exist')
  })
})
