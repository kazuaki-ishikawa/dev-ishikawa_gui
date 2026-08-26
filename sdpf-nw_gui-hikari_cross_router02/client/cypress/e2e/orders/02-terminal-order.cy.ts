import { generateRandomHex, t } from '@cypress/support/utils'

const OrderStatusList = ['applied', 'processing', 'completed', 'canceled', 'aborted', 'rejected'] as const

describe('ルーターのオーダー', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)
    this.orderId = generateRandomHex(32)

    cy.fixture('orders/terminal-create-ipoe-rejected.json').then(data => {
      this.createTerminal = data
    })
    cy.intercept('GET', '**/ztgict/v1/break-out-lists', { fixture: 'break-out-lists/list' }).as(
      'getBreakOutListWithoutQuery',
    )
  })

  context('お客さま自営ルーター', function () {
    beforeEach(function () {
      cy.fixture('orders/self-terminal-create-rejected').then(data => {
        this.order = data
      })
    })

    // お客さま自営ルーターの場合はボタン自体が非表示
    it('新規作成オーダー(orderStatus=rejected)で「コピーして再申請」のボタンが非表示になること', function () {
      cy.intercept('GET', '**/ztgict/v1/orders/*', { fixture: 'orders/self-terminal-create-rejected' }).as('getOrder')
      cy.visit(`/tenants/${this.tenantId}/orders/${this.orderId}`)
      cy.wait(['@getOrder'])

      cy.get('[data-cy="orders-id-index-response"]').should('exist')
      cy.get('[data-cy="orders-id-index-reapply-button"]').should('not.exist')
    })

    it('新規作成オーダー(orderStatus: applied)で「オーダー取り消し」のボタンが押下可能なこと', function () {
      const body = { ...this.order, orderStatus: 'applied' }
      cy.intercept('GET', `**/ztgict/v1/orders/${this.orderId}`, { body }).as('getOrder')
      cy.intercept('DELETE', `**/ztgict/v1/orders/${this.orderId}`, {}).as('deleteOrder')

      cy.visit(`/tenants/${this.tenantId}/orders/${this.orderId}`)
      cy.wait(['@getOrder'])

      cy.get('[data-cy="orders-id-index-response"]').should('exist')
      cy.get('[data-cy="orders-id-index-cancel-button"]').should('not.be.disabled').click()

      cy.get('.confirm-dialog-text').should('have.text', t('orders.cancelConfirm'))
      cy.get('.dialog-base-cancel-button').should('have.text', t('common.no'))
      cy.get('.dialog-base-submit-button').should('have.text', t('common.yes')).click()

      cy.wait('@deleteOrder')

      // DELETE orders の成功メッセージ確認
      cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('message.deleted'))
      cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
      cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.close')).click()
      cy.get('[data-cy="notification-dialog-text"]').should('not.exist')
    })

    it('新規作成オーダー(orderStatus: processing)で「オーダー取り消し」のボタンが押下不可なこと', function () {
      const body = { ...this.order, orderStatus: 'processing' }
      cy.intercept('GET', `**/ztgict/v1/orders/${this.orderId}`, { body }).as('getOrder')

      cy.visit(`/tenants/${this.tenantId}/orders/${this.orderId}`)
      cy.wait(['@getOrder'])

      cy.get('[data-cy="orders-id-index-response"]').should('exist')
      cy.get('[data-cy="orders-id-index-cancel-button"]').should('be.disabled')
    })

    it('新規作成オーダー(orderStatus: completed)で「オーダー取り消し」のボタンが押下不可なこと', function () {
      const body = { ...this.order, orderStatus: 'completed' }
      cy.intercept('GET', `**/ztgict/v1/orders/${this.orderId}`, { body }).as('getOrder')

      cy.visit(`/tenants/${this.tenantId}/orders/${this.orderId}`)
      cy.wait(['@getOrder'])

      cy.get('[data-cy="orders-id-index-response"]').should('exist')
      cy.get('[data-cy="orders-id-index-cancel-button"]').should('be.disabled')
    })

    it('新規作成オーダー(orderStatus: canceled)で「オーダー取り消し」のボタンが押下不可なこと', function () {
      const body = { ...this.order, orderStatus: 'canceled' }
      cy.intercept('GET', `**/ztgict/v1/orders/${this.orderId}`, { body }).as('getOrder')

      cy.visit(`/tenants/${this.tenantId}/orders/${this.orderId}`)
      cy.wait(['@getOrder'])

      cy.get('[data-cy="orders-id-index-response"]').should('exist')
      cy.get('[data-cy="orders-id-index-cancel-button"]').should('be.disabled')
    })

    it('新規作成オーダー(orderStatus: rejected)で「オーダー取り消し」のボタンが押下不可なこと', function () {
      cy.intercept('GET', '**/ztgict/v1/orders/*', { fixture: 'orders/self-terminal-create-rejected' }).as('getOrder')
      cy.visit(`/tenants/${this.tenantId}/orders/${this.orderId}`)
      cy.wait(['@getOrder'])

      cy.get('[data-cy="orders-id-index-response"]').should('exist')
      cy.get('[data-cy="orders-id-index-cancel-button"]').should('be.disabled')
    })

    it('新規作成オーダー(orderStatus: aborted)で「オーダー取り消し」のボタンが押下不可なこと', function () {
      const body = { ...this.order, orderStatus: 'aborted' }
      cy.intercept('GET', `**/ztgict/v1/orders/${this.orderId}`, { body }).as('getOrder')

      cy.visit(`/tenants/${this.tenantId}/orders/${this.orderId}`)
      cy.wait(['@getOrder'])

      cy.get('[data-cy="orders-id-index-response"]').should('exist')
      cy.get('[data-cy="orders-id-index-cancel-button"]').should('be.disabled')
    })
  })

  context('サービスルーター', function () {
    // 新規作成で orderStatus=rejected の場合は活性
    it('新規作成オーダー(orderStatus=rejected)で「コピーして再申請」のボタンが活性になること', function () {
      cy.intercept('GET', '**/ztgict/v1/orders/*', this.createTerminal).as('getOrder')
      cy.visit(`/tenants/${this.tenantId}/orders/${this.orderId}`)
      cy.wait(['@getOrder', '@getBreakOutListWithoutQuery'])

      cy.get('[data-cy="orders-id-index-response"]').should('exist')
      cy.get('[data-cy="orders-id-index-reapply-button"]').should('not.be.disabled')
    })
    // 新規作成で orderStatus=rejected 以外の場合はボタン表示された上で非活性
    OrderStatusList.slice(0, -1).forEach(orderStatus => {
      it(`新規作成オーダー(orderStatus=${orderStatus})で「コピーして再申請」のボタンが非活性になること`, function () {
        cy.intercept('GET', '**/ztgict/v1/orders/*', Object.assign(this.createTerminal, { orderStatus })).as('getOrder')
        cy.visit(`/tenants/${this.tenantId}/orders/${this.orderId}`)
        cy.wait(['@getOrder', '@getBreakOutListWithoutQuery'])

        cy.get('[data-cy="orders-id-index-response"]').should('exist')
        cy.get('[data-cy="orders-id-index-reapply-button"]').should('be.disabled')
      })
    })
    // 更新オーダーの場合はボタン自体が非表示
    it('更新オーダー(orderStatus=rejected)で「コピーして再申請」のボタンが非表示になること', function () {
      cy.intercept('GET', '**/ztgict/v1/orders/*', { fixture: 'orders/terminal-update-use-break-out-lists' }).as(
        'getOrder',
      )
      cy.visit(`/tenants/${this.tenantId}/orders/${this.orderId}`)
      cy.wait(['@getOrder', '@getBreakOutListWithoutQuery'])

      cy.get('[data-cy="orders-id-index-response"]').should('exist')
      cy.get('[data-cy="orders-id-index-reapply-button"]').should('not.exist')
    })
    // 廃止オーダーの場合はボタン自体が非表示
    it('廃止オーダー(orderStatus=rejected)で「コピーして再申請」のボタンが非表示になること', function () {
      cy.intercept('GET', '**/ztgict/v1/orders/*', { fixture: 'orders/terminal-delete' }).as('getOrder')
      cy.visit(`/tenants/${this.tenantId}/orders/${this.orderId}`)
      cy.wait(['@getOrder', '@getBreakOutListWithoutQuery'])

      cy.get('[data-cy="orders-id-index-response"]').should('exist')
      cy.get('[data-cy="orders-id-index-reapply-button"]').should('not.exist')
    })
  })
})
