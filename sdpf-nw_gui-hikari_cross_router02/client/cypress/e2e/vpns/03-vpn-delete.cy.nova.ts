import { generateRandomHex, t } from '@cypress/support/utils'

describe('VPN廃止', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)
    this.vpnId = generateRandomHex(32)

    cy.fixture('vpns/detail.json').then(data => {
      this.detailData = data
    })

    cy.intercept('GET', '**/ztgict/v1/vpns*', { fixture: 'vpns/list' }).as('getVpnList')
    cy.intercept('GET', '**/ztgict/v1/vpns/*', { fixture: 'vpns/detail' }).as('getVpn')
    cy.intercept('DELETE', '**/ztgict/v1/vpns/*', { fixture: 'vpns/detail' }).as('deleteRequest')
  })

  it('VPN廃止 -> オーダー詳細', function () {
    cy.visit(`/tenants/${this.tenantId}/vpns/${this.vpnId}`)
    cy.wait(['@getVpn'])

    // 廃止ボタン押下
    cy.get('[data-cy="delete-card-delete-button"]')
      .should('not.be.disabled')
      .and('have.text', t('nova.common.delete'))
      .click()

    // 廃止ダイアログ
    cy.get('[data-cy="vpns-id-index-delete-dialog-description"]').should(
      'have.text',
      t('nova.delete.dialogDescription', {
        resourceName: `${this.detailData.customerNote}（${this.detailData.vpnId}）`,
      }),
    )
    cy.get('.delete-dialog-grid').should('have.length', 2)
    cy.get('.delete-dialog-grid')
      .eq(0)
      .within($el => {
        cy.wrap($el).find('div').eq(0).should('have.text', 'VPN ID')
        cy.wrap($el).find('div').eq(1).should('have.text', this.detailData.vpnId)
      })
    cy.get('.delete-dialog-grid')
      .eq(1)
      .within($el => {
        cy.wrap($el).find('div').eq(0).should('have.text', t('nova.vpn.name'))
        cy.wrap($el).find('div').eq(1).should('have.text', this.detailData.customerNote)
      })

    // ボタンの確認
    cy.get('[data-cy="delete-dialog-cancel-button"]')
      .should('not.be.disabled')
      .and('have.text', t('nova.common.cancel'))
    cy.get('[data-cy="delete-dialog-submit-button"]')
      .should('not.be.disabled')
      .and('have.text', t('nova.common.applicationForDelete'))
      .click()

    cy.wait('@deleteRequest').then(req => {
      expect(req.request.url).to.include(`/ztgict/v1/vpns/${this.vpnId}`)
    })

    // 廃止画面に遷移
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/vpns/${this.vpnId}/delete`)
    cy.wait('@getVpn')

    cy.get('[data-cy="card-title-with-border-title"]').should('have.text', t('nova.delete.completeTitle'))
    cy.get('[data-cy="card-item-completed-order-id"]').should(
      'have.text',
      t('nova.update.orderId', { orderId: this.detailData.orderId }),
    )

    cy.get('[data-cy="vpns-id-delete-cancel-button"]')
      .should('have.text', t('nova.vpn.moveToList'))
      .and('not.be.disabled')
    cy.get('[data-cy="vpns-id-delete-submit-button"]').should('have.text', t('nova.common.moveToOrderDetail')).click()
  })

  it('VPN廃止 -> VPN一覧', function () {
    cy.visit(`/tenants/${this.tenantId}/vpns/${this.vpnId}`)
    cy.wait(['@getVpn'])

    // 廃止ボタン押下
    cy.get('[data-cy="delete-card-delete-button"]').click()
    // 廃止ダイアログの廃止ボタンを押下
    cy.get('[data-cy="delete-dialog-submit-button"]').click()

    cy.wait('@deleteRequest').then(req => {
      expect(req.request.url).to.include(`/ztgict/v1/vpns/${this.vpnId}`)
    })

    // 廃止画面に遷移
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/vpns/${this.vpnId}/delete`)
    cy.wait('@getVpn')

    // VPN一覧へボタンを押下
    cy.get('[data-cy="vpns-id-delete-cancel-button"]').click()
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
