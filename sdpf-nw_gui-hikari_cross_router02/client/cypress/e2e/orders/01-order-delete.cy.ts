import dayjs from 'dayjs'
import { FletsOrderTypes } from '@app/api/ipoes/constants'
import { generateRandomHex, t } from '@cypress/support/utils'

const testCases = [
  { fletsOrderType: FletsOrderTypes.New },
  { fletsOrderType: FletsOrderTypes.Migrate },
  { fletsOrderType: FletsOrderTypes.Diversion },
]

describe('オーダー取り下げボタンのテスト', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)
    this.orderId = generateRandomHex(32)

    cy.visit(`/tenants/${this.tenantId}/orders/${this.orderId}`)
  })

  context('光コラボの新規作成オーダー', function () {
    it('光コラボの新規作成オーダーで、orderStatus:applied の場合', function () {
      cy.fixture('orders/ipoe-delete-new-visit-applied.json').then(body => {
        // 削除レスポンスの orderStatus を canceled に変更
        this.canceled = { ...body, orderStatus: 'canceled', tenantId: this.tenantId, orderId: this.orderId }
        cy.intercept('DELETE', `**/ztgict/v1/orders/${this.orderId}`, this.canceled).as('deleteOrder')
      })

      cy.fixture('orders/ipoe-create-new-applied.json').then(body => {
        cy.intercept('GET', `**/ztgict/v1/ipoe?ipoeId=${body.resourceId}&limit=1`, {
          body: { ipoes: [{ ipoeId: body.resourceId, ref: `/v1/ipoe/hikari-collabo/${body.resourceId}` }] },
        }).as('getIpoeList')
        cy.intercept('GET', `**/ztgict/v1/ipoe/hikari-collabo/${body.resourceId}`, {}).as('getHikariCollabo')

        cy.intercept('GET', `**/ztgict/v1/orders/${this.orderId}`, { body }).as('getOrderNewCreateApplied')
      })

      cy.wait(['@getOrderNewCreateApplied', '@getIpoeList', '@getHikariCollabo'])

      cy.get('[data-cy="orders-id-index-response"]').should('exist')
      cy.get('[data-cy="orders-id-index-cancel-button"]').should('have.text', t('orders.cancel')).click()

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

    it('光コラボの新規作成オーダーで、orderStatus:canceled の場合', function () {
      cy.fixture('orders/ipoe-delete-new-visit-applied.json').then(body => {
        // 削除レスポンスの orderStatus を canceled に変更
        this.canceled = { ...body, orderStatus: 'canceled', tenantId: this.tenantId, orderId: this.orderId }
        cy.intercept('GET', '**/ztgict/v1/orders/*', { body: this.canceled }).as('getIpoeCreateNewCanceled')
        cy.intercept('GET', `**/ztgict/v1/ipoe?ipoeId=${body.resourceId}&limit=1`, {
          body: { ipoes: [{ ipoeId: body.resourceId, ref: `/v1/ipoe/hikari-collabo/${body.resourceId}` }] },
        }).as('getIpoeList')
        cy.intercept('GET', `**/ztgict/v1/ipoe/hikari-collabo/${body.resourceId}`, {}).as('getHikariCollabo')
      })

      cy.wait(['@getIpoeCreateNewCanceled', '@getIpoeList', '@getHikariCollabo'])

      // レスポンス内容欄が表示されていること
      cy.get('[data-cy="orders-id-index-response"]').should('exist')
      // 「オーダー取り下げ」ボタンの非活性確認
      cy.get('[data-cy="orders-id-index-cancel-button"]').should('have.text', t('orders.cancel')).should('be.disabled')
    })

    it('光コラボの新規作成オーダーで、orderStatus:processing の場合', function () {
      cy.fixture('orders/ipoe-create-new-processing.json').then(body => {
        cy.intercept('GET', '**/ztgict/v1/orders/*', { body }).as('getIpoeCreateNewProcessing')
        cy.intercept('GET', `**/ztgict/v1/ipoe?ipoeId=${body.resourceId}&limit=1`, {
          body: { ipoes: [{ ipoeId: body.resourceId, ref: `/v1/ipoe/hikari-collabo/${body.resourceId}` }] },
        }).as('getIpoeList')
        cy.intercept('GET', `**/ztgict/v1/ipoe/hikari-collabo/${body.resourceId}`, {}).as('getHikariCollabo')
      })

      cy.wait(['@getIpoeCreateNewProcessing', '@getIpoeList', '@getHikariCollabo'])

      // レスポンス内容欄が表示されていること
      cy.get('[data-cy="orders-id-index-response"]').should('exist')
      // 「オーダー取り下げ」ボタンの非活性確認
      cy.get('[data-cy="orders-id-index-cancel-button"]').should('have.text', t('orders.cancel')).should('be.disabled')
    })
  })

  context('光コラボの廃止オーダー', function () {
    testCases.forEach(({ fletsOrderType }) => {
      it(`光コラボ（fletsOrderType: ${fletsOrderType}）の廃止オーダーで orderStatus:applied の場合`, function () {
        cy.fixture(`orders/ipoe-delete-${fletsOrderType}-visit-applied.json`).then(body => {
          // 削除レスポンスの orderStatus を canceled に変更
          this.canceled = { ...body, orderStatus: 'canceled', tenantId: this.tenantId, orderId: this.orderId }
          cy.intercept('DELETE', `**/ztgict/v1/orders/${this.orderId}`, this.canceled).as('deleteOrder')
          cy.intercept('GET', `**/ztgict/v1/orders/${this.orderId}`, { body }).as('getOrderNewDeleteApplied')
          cy.intercept('GET', `**/ztgict/v1/ipoe?ipoeId=${body.resourceId}&limit=1`, {
            body: { ipoes: [{ ipoeId: body.resourceId, ref: `/v1/ipoe/hikari-collabo/${body.resourceId}` }] },
          }).as('getIpoeList')
          cy.intercept('GET', `**/ztgict/v1/ipoe/hikari-collabo/${body.resourceId}`, {
            body: { fletsOrderType, removal: { date: '', time: '' } },
          }).as('getHikariCollabo')
        })

        cy.wait(['@getOrderNewDeleteApplied', '@getIpoeList', '@getHikariCollabo'])

        cy.get('[data-cy="orders-id-index-response"]').should('exist')
        cy.get('[data-cy="orders-id-index-cancel-button"]').should('have.text', t('orders.cancel')).click()

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

    it('光コラボの廃止オーダーで、collectType:kit の場合はボタン表示されない', function () {
      cy.fixture('orders/ipoe-delete-new-kit-applied.json').then(body => {
        cy.intercept('GET', `**/ztgict/v1/ipoe?ipoeId=${body.resourceId}&limit=1`, {
          body: { ipoes: [{ ipoeId: body.resourceId, ref: `/v1/ipoe/hikari-collabo/${body.resourceId}` }] },
        }).as('getIpoeList')
        cy.intercept('GET', `**/ztgict/v1/ipoe/hikari-collabo/${body.resourceId}`, {}).as('getHikariCollabo')
        cy.intercept('GET', `**/ztgict/v1/orders/${this.orderId}`, { body }).as('getOrderNewKitDeleteApplied')
      })

      cy.wait(['@getOrderNewKitDeleteApplied', '@getIpoeList', '@getHikariCollabo'])

      // レスポンス内容欄が表示されていること
      cy.get('[data-cy="orders-id-index-response"]').should('exist')
      // 「オーダー取り下げ」ボタンの非表示
      cy.get('[data-cy="orders-id-index-cancel-button"]').should('not.exist')
    })

    it('光コラボの廃止オーダーで、hikariCollabo.removal.date に値が入っている場合はボタン表示されない', function () {
      cy.fixture('orders/ipoe-delete-new-visit-applied.json').then(body => {
        cy.intercept('GET', `**/ztgict/v1/ipoe?ipoeId=${body.resourceId}&limit=1`, {
          body: { ipoes: [{ ipoeId: body.resourceId, ref: `/v1/ipoe/hikari-collabo/${body.resourceId}` }] },
        }).as('getIpoeList')
        cy.intercept('GET', `**/ztgict/v1/ipoe/hikari-collabo/${body.resourceId}`, {
          body: { removal: { date: '2025-12-12', time: '9-10' } },
        }).as('getHikariCollabo')
        cy.intercept('GET', `**/ztgict/v1/orders/${this.orderId}`, {
          body,
        }).as('getOrderNewDeleteApplied')
      })

      cy.wait(['@getOrderNewDeleteApplied', '@getIpoeList', '@getHikariCollabo'])

      // レスポンス内容欄が表示されていること
      cy.get('[data-cy="orders-id-index-response"]').should('exist')
      // 「オーダー取り下げ」ボタンの非表示
      cy.get('[data-cy="orders-id-index-cancel-button"]').should('not.exist')
    })
  })

  context('転用オーダー', function () {
    it('転用オーダーで、orderStatus:applied の場合', function () {
      cy.fixture('orders/ipoe-diversion-applied.json').then(body => {
        cy.intercept('GET', `**/ztgict/v1/ipoe?ipoeId=${body.resourceId}&limit=1`, {
          body: { ipoes: [{ ipoeId: body.resourceId, ref: `/v1/ipoe/hikari-collabo/${body.resourceId}` }] },
        }).as('getIpoeList')
        cy.intercept('GET', `**/ztgict/v1/ipoe/hikari-collabo/${body.resourceId}`, {}).as('getHikariCollabo')
        cy.intercept('GET', `**/ztgict/v1/orders/${this.orderId}`, {
          body,
        }).as('getOrderDiversionApplied')
        cy.intercept('DELETE', `**/ztgict/v1/orders/${this.orderId}`, {}).as('deleteOrder')
      })

      cy.wait(['@getOrderDiversionApplied', '@getIpoeList', '@getHikariCollabo'])

      cy.get('[data-cy="orders-id-index-response"]').should('exist')
      cy.get('[data-cy="orders-id-index-cancel-button"]').should('have.text', t('orders.cancel')).click()
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

    it('転用オーダーで、orderStatus:processing の場合', function () {
      cy.fixture('orders/ipoe-diversion-processing.json').then(body => {
        cy.intercept('GET', `**/ztgict/v1/ipoe?ipoeId=${body.resourceId}&limit=1`, {
          body: { ipoes: [{ ipoeId: body.resourceId, ref: `/v1/ipoe/hikari-collabo/${body.resourceId}` }] },
        }).as('getIpoeList')
        cy.intercept('GET', `**/ztgict/v1/ipoe/hikari-collabo/${body.resourceId}`, {}).as('getHikariCollabo')
        cy.intercept('GET', `**/ztgict/v1/orders/${this.orderId}`, {
          body,
        }).as('getOrderDiversionProcessing')
      })

      cy.wait(['@getOrderDiversionProcessing', '@getIpoeList', '@getHikariCollabo'])

      // レスポンス内容欄が表示されていること
      cy.get('[data-cy="orders-id-index-response"]').should('exist')
      // ボタン非活性
      cy.get('[data-cy="orders-id-index-cancel-button"]').should('have.text', t('orders.cancel')).should('be.disabled')
    })
  })

  context('フレッツ別契約の新規作成オーダー', function () {
    it('フレッツ別契約の新規作成オーダーで、orderStatus:applied かつ ipoeApplicationDate が4日後の場合', function () {
      // orderStatus 関係なく日付の範囲内であれば取り下げ可能
      cy.clock(new Date(new Date().setHours(9, 0, 0, 0)), ['Date'])

      cy.fixture('orders/ipoe-create-flets-applied.json').then(body => {
        cy.intercept('GET', `**/ztgict/v1/ipoe?ipoeId=${body.resourceId}&limit=1`, {
          body: { ipoes: [{ ipoeId: body.resourceId, ref: `/v1/ipoe/separate-contract/${body.resourceId}` }] },
        }).as('getIpoeList')
        cy.intercept('GET', `**/ztgict/v1/ipoe/separate-contract/${body.resourceId}`, {
          body: { ipoeApplicationDate: dayjs().add(4, 'day').format('YYYY-MM-DD') },
        }).as('getFlets')
        cy.intercept('GET', `**/ztgict/v1/orders/${this.orderId}`, {
          body,
        }).as('getOrderFletsCreateApplied')
        cy.intercept('DELETE', `**/ztgict/v1/orders/${this.orderId}`, {}).as('deleteOrder')
      })

      cy.wait(['@getOrderFletsCreateApplied', '@getIpoeList', '@getFlets'])

      cy.get('[data-cy="orders-id-index-response"]').should('exist')
      cy.get('[data-cy="orders-id-index-cancel-button"]').should('have.text', t('orders.cancel')).click()

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

    it('フレッツ別契約の新規作成オーダーで、orderStatus:rejected かつ ipoeApplicationDate が3日後の場合', function () {
      // orderStatus 関係なく日付の範囲内であれば取り下げ可能
      cy.clock(new Date(new Date().setHours(9, 0, 0, 0)), ['Date'])

      cy.fixture('orders/ipoe-create-flets-applied.json').then(body => {
        cy.intercept('GET', `**/ztgict/v1/ipoe?ipoeId=${body.resourceId}&limit=1`, {
          body: { ipoes: [{ ipoeId: body.resourceId, ref: `/v1/ipoe/separate-contract/${body.resourceId}` }] },
        }).as('getIpoeList')
        cy.intercept('GET', `**/ztgict/v1/ipoe/separate-contract/${body.resourceId}`, {
          body: { ipoeApplicationDate: dayjs().add(3, 'day').format('YYYY-MM-DD') },
        }).as('getFlets')
        cy.intercept('GET', `**/ztgict/v1/orders/${this.orderId}`, {
          body: { ...body, orderStatus: 'rejected' },
        }).as('getOrderFletsCreateRejected')
        cy.intercept('DELETE', `**/ztgict/v1/orders/${this.orderId}`, {}).as('deleteOrder')
      })

      cy.wait(['@getOrderFletsCreateRejected', '@getIpoeList', '@getFlets'])

      cy.get('[data-cy="orders-id-index-response"]').should('exist')
      cy.get('[data-cy="orders-id-index-cancel-button"]').should('have.text', t('orders.cancel')).click()

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

    it('フレッツ別契約の新規作成オーダーで、orderStatus:applied かつ ipoeApplicationDate が2日後の場合', function () {
      // ボタン非活性
      cy.clock(new Date(new Date().setHours(9, 0, 0, 0)), ['Date'])

      cy.fixture('orders/ipoe-create-flets-applied.json').then(body => {
        cy.intercept('GET', `**/ztgict/v1/ipoe?ipoeId=${body.resourceId}&limit=1`, {
          body: { ipoes: [{ ipoeId: body.resourceId, ref: `/v1/ipoe/separate-contract/${body.resourceId}` }] },
        }).as('getIpoeList')
        cy.intercept('GET', `**/ztgict/v1/ipoe/separate-contract/${body.resourceId}`, {
          body: { ipoeApplicationDate: dayjs().add(2, 'day').format('YYYY-MM-DD') },
        }).as('getFlets')
        cy.intercept('GET', `**/ztgict/v1/orders/${this.orderId}`, {
          body,
        }).as('getOrderFletsCreateApplied')
        cy.intercept('DELETE', `**/ztgict/v1/orders/${this.orderId}`, {}).as('deleteOrder')
      })

      cy.wait(['@getOrderFletsCreateApplied', '@getIpoeList', '@getFlets'])

      cy.get('[data-cy="orders-id-index-response"]').should('exist')
      cy.get('[data-cy="orders-id-index-cancel-button"]').should('have.text', t('orders.cancel')).should('be.disabled')
    })

    it('フレッツ別契約の新規作成オーダーで、orderStatus:processing かつ ipoeApplicationDate が空の場合', function () {
      // ボタン非活性
      cy.clock(new Date(new Date().setHours(9, 0, 0, 0)), ['Date'])

      cy.fixture('orders/ipoe-create-flets-applied.json').then(body => {
        cy.intercept('GET', `**/ztgict/v1/ipoe?ipoeId=${body.resourceId}&limit=1`, {
          body: { ipoes: [{ ipoeId: body.resourceId, ref: `/v1/ipoe/separate-contract/${body.resourceId}` }] },
        }).as('getIpoeList')
        cy.intercept('GET', `**/ztgict/v1/ipoe/separate-contract/${body.resourceId}`, {
          body: { ipoeApplicationDate: '' },
        }).as('getFlets')
        cy.intercept('GET', `**/ztgict/v1/orders/${this.orderId}`, {
          body: { ...body, orderStatus: 'processing' },
        }).as('getOrderFletsCreateProcessing')
        cy.intercept('DELETE', `**/ztgict/v1/orders/${this.orderId}`, {}).as('deleteOrder')
      })

      cy.wait(['@getOrderFletsCreateProcessing', '@getIpoeList', '@getFlets'])

      cy.get('[data-cy="orders-id-index-response"]').should('exist')
      cy.get('[data-cy="orders-id-index-cancel-button"]').should('have.text', t('orders.cancel')).should('be.disabled')
    })
  })

  context('FICの新規作成オーダー', function () {
    it('FICの新規作成オーダーで、orderStatus:applied の場合', function () {
      cy.intercept('GET', `**/ztgict/v1/orders/${this.orderId}`, { fixture: 'orders/fic-create-applied' }).as(
        'getOrderFicCreateApplied',
      )
      cy.intercept('DELETE', `**/ztgict/v1/orders/${this.orderId}`, {}).as('deleteOrder')

      cy.wait(['@getOrderFicCreateApplied'])

      cy.get('[data-cy="orders-id-index-response"]').should('exist')
      cy.get('[data-cy="orders-id-index-cancel-button"]').should('have.text', t('orders.cancel')).click()

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

    it('FICの新規作成オーダーで、orderStatus:canceled の場合', function () {
      cy.fixture('orders/fic-create-applied.json').then(body => {
        // 削除レスポンスの orderStatus を canceled に変更
        const canceled = { ...body, orderStatus: 'canceled', tenantId: this.tenantId, orderId: this.orderId }
        cy.intercept('GET', '**/ztgict/v1/orders/*', { body: canceled }).as('getOrderFicCreateCancelled')
      })
      cy.wait(['@getOrderFicCreateCancelled'])

      // レスポンス内容欄が表示されていること
      cy.get('[data-cy="orders-id-index-response"]').should('exist')
      // 「オーダー取り下げ」ボタンの非活性確認
      cy.get('[data-cy="orders-id-index-cancel-button"]').should('have.text', t('orders.cancel')).should('be.disabled')
    })

    it('FICの新規作成オーダーで、orderStatus:processing の場合', function () {
      cy.fixture('orders/fic-create-applied.json').then(body => {
        // 削除レスポンスの orderStatus を processing に変更
        const processing = { ...body, orderStatus: 'processing', tenantId: this.tenantId, orderId: this.orderId }
        cy.intercept('GET', '**/ztgict/v1/orders/*', { body: processing }).as('getOrderFicCreateProcessing')
        cy.intercept('DELETE', `**/ztgict/v1/orders/${this.orderId}`, {}).as('deleteOrder')
      })
      cy.wait(['@getOrderFicCreateProcessing'])

      cy.get('[data-cy="orders-id-index-response"]').should('exist')
      cy.get('[data-cy="orders-id-index-cancel-button"]').should('have.text', t('orders.cancel')).click()

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
  })
})
