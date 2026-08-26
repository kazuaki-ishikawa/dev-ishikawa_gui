import dayjs from 'dayjs'
import { generateRandomHex, t } from '@cypress/support/utils'

describe('Arcstar Universal One接続 新規作成', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)
    this.applicationDate = dayjs().format('YYYY-MM-DD')

    cy.fixture('uno-connections/create.json').then(create => {
      this.createData = create
    })
    cy.fixture('uno-connections/detail.json').then(detail => {
      this.orderId = detail.orderId
    })
    cy.fixture('uno-connections/list.json').then(list => {
      // 作成済みリソースと同名は設定できないため、重複チェック用に既存の接続名を保持する
      this.existingCustomerNote = list.unoConnections[0].customerNote
    })
    cy.fixture('uno-connections/summary-vpn-list.json').then(summary => {
      this.activeVpn = summary.vpns.find((vpn: { resourceStatus: string }) => vpn.resourceStatus === 'active')
    })
    cy.intercept('GET', '**/ztgict/v1/uno-connections*', { fixture: 'uno-connections/list' }).as('getUnoConnectionList')
    cy.intercept('GET', '**/ztgict/v1/resource-summary/vpns', { fixture: 'uno-connections/summary-vpn-list' }).as(
      'getSummaryVpnList',
    )
    cy.intercept('POST', '**/ztgict/v1/uno-connections', { fixture: 'uno-connections/detail' }).as('postRequest')
    cy.intercept('GET', '**/ztgict/v1/orders/*', { fixture: 'uno-connections/uno-connection-create-order' }).as(
      'getOrder',
    )
  })

  it('Arcstar Universal One接続新規作成 -> オーダー詳細', function () {
    cy.visit(`/tenants/${this.tenantId}/uno-connections`)
    cy.wait('@getUnoConnectionList')

    cy.get('[data-cy="uno-connections-index-create-button"]').click()
    cy.get('[data-cy="uno-connections-index-create-dialog-move-to-create-button"]').click()
    cy.wait(['@getSummaryVpnList', '@getUnoConnectionList'])

    // 入力画面: ステップ見出しは表示せず、セクション見出しのみ表示する
    cy.get('[data-cy="uno-connections-create-step-title"]').should('not.exist')
    cy.get('[data-cy="uno-connections-create-customer-note-section"] [data-cy="card-title-with-border-title"]').should(
      'have.text',
      t('nova.unoConnections.customerNoteSection'),
    )
    cy.get('[data-cy="uno-connections-create-rink-section"] [data-cy="card-title-with-border-title"]').should(
      'have.text',
      t('nova.unoConnections.rinkSection'),
    )
    cy.get('[data-cy="uno-connections-create-uno-section"] [data-cy="card-title-with-border-title"]').should(
      'have.text',
      t('nova.unoConnections.unoSection'),
    )

    // ボタン初期値
    cy.get('[data-cy="uno-connections-create-cancel-button"]')
      .as('cancelButton')
      .should('have.text', t('nova.common.cancel'))
      .and('not.be.disabled')
    cy.get('[data-cy="uno-connections-create-submit-button"]')
      .as('submitButton')
      .should('have.text', t('nova.common.reviewApplicationDetails'))
      .and('be.disabled')

    // 作成済みリソースと同じ接続名は設定できない
    cy.get('[data-cy="uno-connections-create-customer-note"]').find('input').type(this.existingCustomerNote)
    cy.get('[data-cy="uno-connections-create-customer-note"]')
      .find('.v-messages__message')
      .should('have.text', t('invalid.duplicateCustomerNote'))
    cy.get('[data-cy="uno-connections-create-customer-note"]').find('input').clear()

    cy.get('[data-cy="uno-connections-create-customer-note"]').find('input').type(this.createData.customerNote)

    // 接続元VPN（NovaSelectForm）: 廃止済み・未開通のVPNは選択できない
    cy.get('[data-cy="uno-connections-create-vpn-id"]').find('input').click()
    cy.get('.custom-select-list .v-list-item')
      .should('have.length', 1)
      .and('have.text', `${this.activeVpn.vpnId} / ${this.activeVpn.customerNote}`)
      .click()

    cy.get('[data-cy="uno-connections-create-uno-contract-number"]')
      .find('input')
      .type(this.createData.unoContractNumber)
    cy.get('[data-cy="uno-connections-create-uno-vpn-id"]').find('input').type(this.createData.unoVpnId)

    // 開通希望日（NovaDatePickerForm）: カレンダーを開いて当日のセルを選択する
    cy.get('[data-cy="uno-connections-create-application-date"]').find('input').click()
    cy.get(`[data-test-id="dp-${this.applicationDate}"]`).find('.dp--cell-inner').click()

    cy.get('@submitButton').should('not.be.disabled').click()

    // 確認画面
    cy.get('[data-cy="uno-connections-create-step-title"]').should(
      'have.text',
      t('nova.applicationForNew.confirmTitle'),
    )
    cy.get('[data-cy="card-title-with-border-description"]').should(
      'have.text',
      `${t('nova.applicationForNew.confirmDescription-1')}${t('nova.applicationForNew.confirmDescription-2')}`,
    )
    cy.get('[data-cy="uno-connections-create-customer-note"]')
      .find('input')
      .should('have.value', this.createData.customerNote)
      .and('be.disabled')
    cy.get('[data-cy="uno-connections-create-vpn-id"]').find('input').should('be.disabled')
    cy.get('[data-cy="uno-connections-create-uno-contract-number"]')
      .find('input')
      .should('have.value', this.createData.unoContractNumber)
      .and('be.disabled')
    cy.get('[data-cy="uno-connections-create-uno-vpn-id"]')
      .find('input')
      .should('have.value', this.createData.unoVpnId)
      .and('be.disabled')
    cy.get('[data-cy="uno-connections-create-application-date"]')
      .find('input')
      .should('have.value', dayjs(this.applicationDate).format('YYYY/MM/DD'))
      .and('be.disabled')

    cy.get('@cancelButton').should('have.text', t('nova.common.return')).and('not.be.disabled')
    cy.get('@submitButton').should('have.text', t('nova.common.apply')).click()

    cy.wait('@postRequest').then(req => {
      expect(req.request.body).to.deep.equals({ ...this.createData, unoApplicationDate: this.applicationDate })
    })

    // 完了画面
    cy.get('[data-cy="uno-connections-create-step-title"]').should(
      'have.text',
      t('nova.applicationForNew.completeTitle'),
    )
    cy.get('[data-cy="card-item-completed-order-id"]').should(
      'have.text',
      t('nova.update.orderId', { orderId: this.orderId }),
    )
    cy.get('@cancelButton').should('have.text', t('nova.unoConnections.moveToList')).and('not.be.disabled')
    cy.get('@submitButton').should('have.text', t('nova.common.moveToOrderDetail')).click()

    // オーダー詳細画面に遷移
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/orders/${this.orderId}`)
  })

  it('Arcstar Universal One接続新規作成 -> Arcstar Universal One接続一覧', function () {
    cy.visit(`/tenants/${this.tenantId}/uno-connections`)
    cy.wait('@getUnoConnectionList')

    cy.get('[data-cy="uno-connections-index-create-button"]').click()
    cy.get('[data-cy="uno-connections-index-create-dialog-move-to-create-button"]').click()
    cy.wait(['@getSummaryVpnList', '@getUnoConnectionList'])

    // 入力画面
    cy.get('[data-cy="uno-connections-create-customer-note"]').find('input').type(this.createData.customerNote)

    // 接続元VPN（NovaSelectForm）: 候補をフィルタしてリストから選択する
    cy.get('[data-cy="uno-connections-create-vpn-id"]').find('input').type(this.createData.vpnId)
    cy.get('.custom-select-list .v-list-item').first().click()

    cy.get('[data-cy="uno-connections-create-uno-contract-number"]')
      .find('input')
      .type(this.createData.unoContractNumber)
    cy.get('[data-cy="uno-connections-create-uno-vpn-id"]').find('input').type(this.createData.unoVpnId)

    // 開通希望日（NovaDatePickerForm）: カレンダーを開いて当日のセルを選択する
    cy.get('[data-cy="uno-connections-create-application-date"]').find('input').click()
    cy.get(`[data-test-id="dp-${this.applicationDate}"]`).find('.dp--cell-inner').click()

    cy.get('[data-cy="uno-connections-create-submit-button"]').as('submitButton').click()

    // 確認画面
    cy.get('@submitButton').click()
    cy.wait('@postRequest')

    // 完了画面 一覧へボタンを押下
    cy.get('[data-cy="uno-connections-create-cancel-button"]').click()
    cy.wait('@getUnoConnectionList')

    cy.location().should(location => {
      expect(location.pathname).to.eq(`/nova/tenants/${this.tenantId}/uno-connections`)
      const resourceStatuses = new URLSearchParams(location.search).getAll('resourceStatus')
      expect(resourceStatuses).to.have.members(['active', 'inactive'])
    })

    // ブラウザバックすると最初の画面に戻る（resourceStatusのクエリパラメータが消える）
    cy.go('back')
    cy.wait('@getUnoConnectionList')
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/uno-connections`)
  })
})
