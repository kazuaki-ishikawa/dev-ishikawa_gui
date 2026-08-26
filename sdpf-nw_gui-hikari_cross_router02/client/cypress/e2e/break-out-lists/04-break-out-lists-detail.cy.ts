import dayjs from 'dayjs'
import { ResourceStatusTypes } from '@app/api/constants'
import type { OrderStatusType } from '@app/api/types'
import { OperationTypes } from '@app/api/terminals/constants'
import { generateRandomHex, orderStatusTypeTranslation, t } from '@cypress/support/utils'

describe('特定通信ブレイクアウト対象 詳細', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)

    cy.fixture('break-out-lists/list.json').then(list => {
      this.breakOut1 = list.breakOutLists[0]
      this.breakOut2 = list.breakOutLists[1]
      this.breakOut3 = list.breakOutLists[2]
    })
    cy.fixture('break-out-lists/terminal-list.json').then(({ terminals }) => {
      this.activeTerminalIds = terminals
        .filter((terminal: { resourceStatus: string }) => terminal.resourceStatus === ResourceStatusTypes.Active)
        .map((terminal: { terminalId: string }) => terminal.terminalId)
    })

    cy.intercept('GET', '**/ztgict/v1/break-out-lists?resourceStatus=active&resourceStatus=inactive', {
      fixture: 'break-out-lists/list',
    }).as('getBreakOutList')
    cy.intercept('GET', '**/ztgict/v1/resource-summary/terminals*', {
      fixture: 'break-out-lists/terminal-list',
    }).as('getTerminalList')
    cy.intercept('POST', '**/ztgict/v1/terminals-bulk/operation', {
      fixture: 'break-out-lists/post-terminal-bulk-operation',
    }).as('postOperation')
  })

  it('ブレアクアウト設定を適用するボタンの押下', function () {
    cy.intercept('GET', `**/ztgict/v1/break-out-lists/${this.breakOut1.breakOutListId}`, this.breakOut1).as(
      'getBreakOut',
    )
    // 詳細画面へ遷移
    cy.visit(`/tenants/${this.tenantId}/break-out-lists/${this.breakOut1.breakOutListId}`)
    cy.wait(['@getTerminalList', '@getBreakOut'])

    // ブレアクアウト設定を適用するボタンの押下
    cy.get('[data-cy="break-out-lists-id-index-apply-break-out-list-button"]').click()
    cy.get('.dialog-card-content').should('have.text', t('terminals.confirm.operations.breakOutListUpdate'))
    cy.get('.dialog-base-cancel-button').should('have.text', t('common.cancel')).click()
    cy.get('.dialog-card-main').should('not.exist')

    // 適用ボタンの押下
    cy.get('[data-cy="break-out-lists-id-index-apply-break-out-list-button"]').click()
    cy.get('.dialog-base-submit-button').should('have.text', t('common.apply')).click()

    cy.wait('@postOperation').then(req => {
      expect(req.request.body).to.deep.equals({
        terminalIds: this.activeTerminalIds,
        operation: OperationTypes.BreakOutListUpdate,
      })
    })

    // 適用完了ダイアログの確認
    cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('terminals.message.breakOutListUpdate'))
    cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
    cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.close')).click()
    cy.get('[data-cy="notification-dialog-text"]').should('not.exist')
  })

  context('表示確認', function () {
    it('対象のブレイクアウトと紐づく端末が1件以上の場合', function () {
      cy.intercept('GET', `**/ztgict/v1/break-out-lists/${this.breakOut1.breakOutListId}`, this.breakOut1).as(
        'getBreakOut',
      )
      // 詳細画面へ遷移
      cy.visit(`/tenants/${this.tenantId}/break-out-lists/${this.breakOut1.breakOutListId}`)
      cy.wait(['@getTerminalList', '@getBreakOut'])

      // 表示項目の確認
      cy.get('[data-cy="break-out-detail-customer-note').should('have.text', this.breakOut1.customerNote)
      cy.get('[data-cy="break-out-detail-fqdn-list').should('have.text', this.breakOut1.fqdnList.join(''))
      cy.get('[data-cy="break-out-detail-prefix-list').should('have.text', this.breakOut1.prefixList.join(''))
      cy.get('[data-cy="break-out-detail-order-id-link').should('have.text', this.breakOut1.orderId)
      cy.get('[data-cy="break-out-detail-order-status').should(
        'have.text',
        orderStatusTypeTranslation[this.breakOut1.orderStatus as OrderStatusType],
      )
      cy.get('[data-cy="break-out-detail-creation-time').should(
        'have.text',
        dayjs(this.breakOut1.creationTime).format('YYYY/MM/DD HH:mm:ss'),
      )
      cy.get('[data-cy="break-out-detail-update-time"]').should(
        'have.text',
        dayjs(this.breakOut1.updateTime).format('YYYY/MM/DD HH:mm:ss'),
      )

      // 廃止ボタンが無効になっていることを確認
      cy.get('[data-cy="break-out-lists-id-index-delete-button"]').should('be.disabled')
      // ブレイクアウト設定適用ボタンが有効になっていることを確認
      cy.get('[data-cy="break-out-lists-id-index-apply-break-out-list-button"]').should('not.be.disabled')
    })

    it('対象のブレイクアウトと紐づく端末が0件の場合', function () {
      cy.intercept('GET', '**/ztgict/v1/resource-summary/terminals*', {}).as('getTerminalListEmpty')
      cy.intercept('GET', `**/ztgict/v1/break-out-lists/${this.breakOut2.breakOutListId}`, this.breakOut2).as(
        'getBreakOut',
      )

      // 詳細画面へ遷移
      cy.visit(`/tenants/${this.tenantId}/break-out-lists/${this.breakOut2.breakOutListId}`)
      cy.wait(['@getTerminalListEmpty', '@getBreakOut'])

      // 廃止ボタンが有効になっていることを確認
      cy.get('[data-cy="break-out-lists-id-index-delete-button"]').should('not.be.disabled')
      // ブレイクアウト設定適用ボタンが無効になっていることを確認
      cy.get('[data-cy="break-out-lists-id-index-apply-break-out-list-button"]').should('be.disabled')
    })

    it('対象のブレイクアウトの resourceStatus が terminated の場合', function () {
      cy.intercept('GET', `**/ztgict/v1/break-out-lists/${this.breakOut3.breakOutListId}`, this.breakOut3).as(
        'getBreakOut',
      )

      // 詳細画面へ遷移
      cy.visit(`/tenants/${this.tenantId}/break-out-lists/${this.breakOut3.breakOutListId}`)
      cy.wait(['@getTerminalList', '@getBreakOut'])

      // 廃止ボタンが無効になっていることを確認
      cy.get('[data-cy="break-out-lists-id-index-delete-button"]').should('be.disabled')
      // ブレイクアウト設定適用ボタンが無効になっていることを確認
      cy.get('[data-cy="break-out-lists-id-index-apply-break-out-list-button"]').should('be.disabled')
    })
  })
})
