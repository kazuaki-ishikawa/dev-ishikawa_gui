import dayjs from 'dayjs'
import { ResourceStatusTypes } from '@app/api/constants'
import { OperationTypes } from '@app/api/terminals/constants'
import { generateRandomHex, t } from '@cypress/support/utils'

describe('特定通信ブレイクアウト対象 編集', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)
    this.breakOutListId = generateRandomHex(32)

    cy.fixture('break-out-lists/edit.json').then(edit => {
      this.edit = edit
    })
    cy.fixture('break-out-lists/detail.json').then(detail => {
      this.breakOut = detail
      this.orderId = detail.orderId
    })
    cy.fixture('break-out-lists/terminal-list.json').then(({ terminals }) => {
      this.activeTerminalIds = terminals
        .filter((terminal: { resourceStatus: string }) => terminal.resourceStatus === ResourceStatusTypes.Active)
        .map((terminal: { terminalId: string }) => terminal.terminalId)
    })

    cy.intercept('GET', '**/ztgict/v1/resource-summary/terminals*', {
      fixture: 'break-out-lists/terminal-list',
    }).as('getTerminalList')
    cy.intercept('GET', '**/ztgict/v1/break-out-lists?resourceStatus=active&resourceStatus=inactive', {
      fixture: 'break-out-lists/list',
    }).as('getBreakOutList')
    cy.intercept('GET', '**/ztgict/v1/break-out-lists/*', { fixture: 'break-out-lists/detail' }).as('getBreakOut')
    cy.intercept('PUT', `**/ztgict/v1/break-out-lists/${this.breakOutListId}`, { body: { orderId: this.orderId } }).as(
      'putRequest',
    )
    cy.intercept('POST', '**/ztgict/v1/terminals-bulk/operation', {
      fixture: 'break-out-lists/post-terminal-bulk-operation',
    }).as('postOperation')
    cy.intercept('GET', `**/ztgict/v1/orders/${this.orderId}`, { response: { statusCode: 200 } }).as('getOrder')
  })

  it('保存 -> ブレイクアウト設定適用', function () {
    // 詳細画面へ遷移
    cy.visit(`/tenants/${this.tenantId}/break-out-lists/${this.breakOutListId}`)
    cy.wait(['@getTerminalList', '@getBreakOut'])

    // 編集ボタン押下
    cy.get('[data-cy="break-out-lists-id-index-edit-button"]').should('have.text', t('common.edit')).click()
    cy.wait(['@getBreakOutList', '@getBreakOut', '@getTerminalList'])
    cy.url().should('include', `/tenants/${this.tenantId}/break-out-lists/${this.breakOutListId}/edit`)

    cy.get('[data-cy="break-out-lists-id-edit-customer-note"]')
      .find('input')
      .should('have.value', this.breakOut.customerNote)
      .clear()
      .type(this.edit.customerNote)

    cy.get('[data-cy="break-out-lists-id-edit-fqdn-list"]')
      .find('textarea')
      .should('have.value', this.breakOut.fqdnList.join('\n'))
      .clear()
      .type(this.edit.fqdnList.join('\n'))

    cy.get('[data-cy="break-out-lists-id-edit-prefix-list"]')
      .find('textarea')
      .should('have.value', this.breakOut.prefixList.join('\n'))
      .clear()
      .type(this.edit.prefixList.join('\n'))

    cy.get('[data-cy="break-out-lists-id-edit-order-id-link"]').should('have.text', this.breakOut.orderId)
    cy.get('[data-cy="break-out-lists-id-edit-creation-time"]').should(
      'have.text',
      dayjs(this.breakOut.creationTime).format('YYYY/MM/DD HH:mm:ss'),
    )
    cy.get('[data-cy="break-out-lists-id-edit-update-time"]').should(
      'have.text',
      dayjs(this.breakOut.updateTime).format('YYYY/MM/DD HH:mm:ss'),
    )

    // 確認ボタン押下
    cy.get('[data-cy="break-out-lists-id-edit-save-button"]').should('have.text', t('common.confirm')).click()

    // 入力欄がdisabledになっていることを確認
    cy.get('[data-cy="break-out-lists-id-edit-customer-note"]').find('input').should('be.disabled')
    cy.get('[data-cy="break-out-lists-id-edit-fqdn-list"]').find('textarea').should('be.disabled')
    cy.get('[data-cy="break-out-lists-id-edit-prefix-list"]').find('textarea').should('be.disabled')

    // 保存ボタン押下
    cy.get('[data-cy="break-out-lists-id-edit-save-button"]').should('have.text', t('common.save')).click()

    cy.wait('@putRequest').then(req => {
      expect(req.request.body).to.deep.equals(this.edit)
    })
    cy.get('.dialog-card-content').find('div').eq(0).should('have.text', t('message.accepted'))
    cy.get('.dialog-card-content')
      .find('div')
      .eq(1)
      .should('have.text', t('terminals.confirm.operations.breakOutListUpdate'))

    // ブレイクアウト設定適用ボタンを押下
    cy.get('[data-cy="break-out-lists-id-edit-break-out-list-update-button"]')
      .should('have.text', t('terminals.operations.breakOutListUpdate'))
      .click()

    cy.wait('@postOperation').then(req => {
      expect(req.request.body).to.deep.equals({
        terminalIds: this.activeTerminalIds,
        operation: OperationTypes.BreakOutListUpdate,
      })
    })

    cy.wait(['@getBreakOut', '@getTerminalList'])
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/break-out-lists/${this.breakOutListId}`)

    // POST terminals/terminals-bulk/operation の成功メッセージを確認
    cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('terminals.message.breakOutListUpdate'))
    cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
    cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.close')).click()
    cy.get('[data-cy="notification-dialog-text"]').should('not.exist')
  })

  it('保存 -> オーダー詳細', function () {
    // 詳細画面へ遷移
    cy.visit(`/tenants/${this.tenantId}/break-out-lists/${this.breakOutListId}`)
    cy.wait(['@getTerminalList', '@getBreakOut'])

    // 編集ボタン押下
    cy.get('[data-cy="break-out-lists-id-index-edit-button"]').should('have.text', t('common.edit')).click()
    cy.wait(['@getBreakOutList', '@getBreakOut', '@getTerminalList'])
    cy.url().should('include', `/tenants/${this.tenantId}/break-out-lists/${this.breakOutListId}/edit`)

    cy.get('[data-cy="break-out-lists-id-edit-customer-note"]')
      .find('input')
      .should('have.value', this.breakOut.customerNote)
      .clear()
      .type(this.edit.customerNote)

    // 確認ボタン押下
    cy.get('[data-cy="break-out-lists-id-edit-save-button"]').click()
    // 保存ボタン押下
    cy.get('[data-cy="break-out-lists-id-edit-save-button"]').click()

    // 適用ボタンは表示される
    cy.get('[data-cy="break-out-lists-id-edit-break-out-list-update-button"]').should('exist')
    // オーダー詳細画面へ遷移
    cy.get('[data-cy="break-out-lists-id-edit-move-to-order-detail-button"]')
      .should('have.text', t('common.moveToOrderDetail'))
      .click()
    cy.wait('@getOrder')
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/orders/${this.orderId}`)
  })

  it('保存 -> 閉じる', function () {
    // 詳細画面へ遷移
    cy.visit(`/tenants/${this.tenantId}/break-out-lists/${this.breakOutListId}`)
    cy.wait(['@getTerminalList', '@getBreakOut'])

    // 編集ボタン押下
    cy.get('[data-cy="break-out-lists-id-index-edit-button"]').should('have.text', t('common.edit')).click()
    cy.wait(['@getBreakOutList', '@getBreakOut', '@getTerminalList'])
    cy.url().should('include', `/tenants/${this.tenantId}/break-out-lists/${this.breakOutListId}/edit`)

    cy.get('[data-cy="break-out-lists-id-edit-customer-note"]')
      .find('input')
      .should('have.value', this.breakOut.customerNote)
      .clear()
      .type(this.edit.customerNote)

    // 確認ボタン押下
    cy.get('[data-cy="break-out-lists-id-edit-save-button"]').click()
    // 保存ボタン押下
    cy.get('[data-cy="break-out-lists-id-edit-save-button"]').click()

    // 適用ボタンとオーダー詳細遷移ボタンが表示される
    cy.get('[data-cy="break-out-lists-id-edit-break-out-list-update-button"]').should('exist')
    cy.get('[data-cy="break-out-lists-id-edit-move-to-order-detail-button"]').should('exist')
    // 閉じるボタンをクリック
    cy.get('.dialog-card-close').click()
    cy.get('.dialog-main').should('not.exist')

    cy.wait(['@getBreakOut', '@getTerminalList'])
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/break-out-lists/${this.breakOutListId}`)
  })

  it('対象のブレイクアウトと紐づく端末が0件の場合', function () {
    cy.intercept('GET', '**/ztgict/v1/resource-summary/terminals*', {}).as('getTerminalListEmpty')

    // 詳細画面へ遷移
    cy.visit(`/tenants/${this.tenantId}/break-out-lists/${this.breakOutListId}`)
    cy.wait(['@getTerminalListEmpty', '@getBreakOut'])

    // 編集ボタン押下
    cy.get('[data-cy="break-out-lists-id-index-edit-button"]').should('have.text', t('common.edit')).click()
    cy.wait(['@getBreakOutList', '@getBreakOut', '@getTerminalListEmpty'])
    cy.url().should('include', `/tenants/${this.tenantId}/break-out-lists/${this.breakOutListId}/edit`)

    cy.get('[data-cy="break-out-lists-id-edit-customer-note"]')
      .find('input')
      .should('have.value', this.breakOut.customerNote)
      .clear()
      .type(this.edit.customerNote)

    // 確認ボタン押下
    cy.get('[data-cy="break-out-lists-id-edit-save-button"]').click()
    // 保存ボタン押下
    cy.get('[data-cy="break-out-lists-id-edit-save-button"]').click()

    // 適用を確認する文言と適用ボタンが表示されないことを確認する
    cy.get('.dialog-card-content').find('div').should('have.length', 1)
    cy.get('.dialog-card-content').find('div').should('have.text', t('message.accepted'))
    cy.get('[data-cy="break-out-lists-id-edit-break-out-list-update-button"]').should('not.exist')

    // 閉じるボタンをクリック
    cy.get('.dialog-card-close').click()
    cy.get('.dialog-main').should('not.exist')
    cy.wait(['@getBreakOut', '@getTerminalListEmpty'])
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/break-out-lists/${this.breakOutListId}`)
  })
})
