import { generateRandomHex, t } from '@cypress/support/utils'

describe('モバイルアクセスオーダーのテスト', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)
    this.orderId = generateRandomHex(32)
    cy.fixture('orders/rink-mobile-connection-create-applied').then(order => {
      this.order = order
    })
  })

  context('ボタン押下可能、DELETE APIが実行されること', function () {
    it('orderStatus: applied', function () {
      cy.intercept('GET', `**/ztgict/v1/orders/${this.orderId}`, {
        fixture: 'orders/rink-mobile-connection-create-applied',
      }).as('getOrder')
      cy.intercept('DELETE', `**/rink-mobile/v1/tenants/${this.tenantId}/mobile-order/self-add/${this.orderId}`, {}).as(
        'deleteOrder',
      )

      cy.visit(`/tenants/${this.tenantId}/orders/${this.orderId}`)
      cy.wait(['@getOrder'])

      cy.get('[data-cy="orders-id-index-response"]').should('not.exist')
      cy.get('[data-cy="orders-id-index-cancel-button"]').should('not.be.disabled').click()

      cy.get('.confirm-dialog-text').should('have.text', t('orders.cancelConfirm'))
      cy.get('.dialog-base-cancel-button').should('have.text', t('common.no'))
      cy.get('.dialog-base-submit-button').should('have.text', t('common.yes')).click()

      // DELETE オーダーの実行
      cy.wait('@deleteOrder')
      // DELETE orders の成功メッセージ確認
      cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('message.deleted'))
      cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
      cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.close')).click()
      cy.get('[data-cy="notification-dialog-text"]').should('not.exist')
    })
  })
  context('ボタン押下不可、オーダー取り消し不可', function () {
    it('案内文表示期間中かつメンテナンス期間外はorderStatus: appliedのオーダー取り下げボタンが活性になる', function () {
      cy.clock(new Date('2026-07-01T10:00:00+09:00'), ['Date'])
      cy.intercept('GET', `**/ztgict/v1/orders/${this.orderId}`, {
        fixture: 'orders/rink-mobile-connection-create-applied',
      }).as('getOrder')

      cy.visit(`/tenants/${this.tenantId}/orders/${this.orderId}`)
      cy.wait(['@getOrder'])

      cy.get('[data-cy="orders-id-index-response"]').should('not.exist')
      cy.get('[data-cy="orders-id-index-rink-mobile-maintenance-notification"]').should('exist')
      cy.get('[data-cy="orders-id-index-cancel-button"]').should('not.be.disabled')
    })

    it('メンテナンス期間中はorderStatus: appliedでもオーダー取り下げボタンが非活性になる', function () {
      cy.clock(new Date('2026-07-18T10:00:00+09:00'), ['Date'])
      cy.intercept('GET', `**/ztgict/v1/orders/${this.orderId}`, {
        fixture: 'orders/rink-mobile-connection-create-applied',
      }).as('getOrder')

      cy.visit(`/tenants/${this.tenantId}/orders/${this.orderId}`)
      cy.wait(['@getOrder'])

      cy.get('[data-cy="orders-id-index-response"]').should('not.exist')
      cy.get('[data-cy="orders-id-index-rink-mobile-maintenance-notification"]').should('exist')
      cy.get('[data-cy="orders-id-index-cancel-button"]').should('be.disabled')
    })

    it('orderStatus: processing', function () {
      const body = {
        ...this.order,
        orderStatus: 'processing',
      }
      cy.intercept('GET', `**/ztgict/v1/orders/${this.orderId}`, {
        body,
      }).as('getOrder')

      cy.visit(`/tenants/${this.tenantId}/orders/${this.orderId}`)
      cy.wait(['@getOrder'])

      cy.get('[data-cy="orders-id-index-response"]').should('not.exist')
      cy.get('[data-cy="orders-id-index-cancel-button"]').should('be.disabled')
    })

    it('orderStatus: completed', function () {
      const body = {
        ...this.order,
        orderStatus: 'completed',
      }
      cy.intercept('GET', `**/ztgict/v1/orders/${this.orderId}`, {
        body,
      }).as('getOrder')

      cy.visit(`/tenants/${this.tenantId}/orders/${this.orderId}`)
      cy.wait(['@getOrder'])

      cy.get('[data-cy="orders-id-index-response"]').should('not.exist')
      cy.get('[data-cy="orders-id-index-cancel-button"]').should('be.disabled')
    })

    it('orderStatus: canceled', function () {
      const body = {
        ...this.order,
        orderStatus: 'canceled',
      }
      cy.intercept('GET', `**/ztgict/v1/orders/${this.orderId}`, {
        body,
      }).as('getOrder')

      cy.visit(`/tenants/${this.tenantId}/orders/${this.orderId}`)
      cy.wait(['@getOrder'])

      cy.get('[data-cy="orders-id-index-response"]').should('not.exist')
      cy.get('[data-cy="orders-id-index-cancel-button"]').should('be.disabled')
    })

    it('orderStatus: rejected', function () {
      const body = {
        ...this.order,
        orderStatus: 'rejected',
      }
      cy.intercept('GET', `**/ztgict/v1/orders/${this.orderId}`, {
        body,
      }).as('getOrder')

      cy.visit(`/tenants/${this.tenantId}/orders/${this.orderId}`)
      cy.wait(['@getOrder'])

      cy.get('[data-cy="orders-id-index-response"]').should('not.exist')
      cy.get('[data-cy="orders-id-index-cancel-button"]').should('be.disabled')
    })

    it('orderStatus: aborted', function () {
      const body = {
        ...this.order,
        orderStatus: 'aborted',
      }
      cy.intercept('GET', `**/ztgict/v1/orders/${this.orderId}`, {
        body,
      }).as('getOrder')

      cy.visit(`/tenants/${this.tenantId}/orders/${this.orderId}`)
      cy.wait(['@getOrder'])

      cy.get('[data-cy="orders-id-index-response"]').should('not.exist')
      cy.get('[data-cy="orders-id-index-cancel-button"]').should('be.disabled')
    })
  })
})
