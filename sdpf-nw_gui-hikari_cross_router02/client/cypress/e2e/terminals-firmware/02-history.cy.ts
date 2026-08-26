import type { TerminalsBulkOperationsResponse } from '@app/api/terminalsBulk/types'
import { generateRandomHex, t } from '@cypress/support/utils'

describe('ファームウェア一括更新の結果履歴', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)

    cy.fixture('terminals-firmware/bulk-operations-list.json').then(data => {
      this.bulkOperationsList = data.bulkOperations
    })

    cy.intercept('GET', '**/ztgict/v1/terminals-bulk-operations*', {
      fixture: 'terminals-firmware/bulk-operations-list',
    }).as('getTerminalsBulkOperationsList')

    cy.intercept('DELETE', '**/ztgict/v1/terminals-bulk-operations/*', {
      fixture: 'terminals-firmware/bulk-operations-delete',
    }).as('deleteTerminalsBulkOperations')
  })

  it('ステータスが処理中の場合', function () {
    const processingBulkOperation = this.bulkOperationsList.find(
      (bulkOperation: TerminalsBulkOperationsResponse) => bulkOperation.status === 'processing',
    )
    cy.intercept('GET', `**/ztgict/v1/terminals-bulk-operations/${processingBulkOperation.bulkOperationId}`, {
      fixture: 'terminals-firmware/bulk-operations-processing',
    }).as('getTerminalsBulkOperations')
    cy.intercept('GET', '**/ztgict/v1/terminals?terminalId=*', {
      fixture: 'terminals-firmware/terminal-list-processing',
    }).as('getTerminalList')

    // ファームウェア一括更新の履歴一覧画面に遷移
    cy.visit(`/tenants/${this.tenantId}/terminals-firmware/history`)

    cy.wait('@getTerminalsBulkOperationsList')

    // 処理中の bulkOperationId をクリック
    cy.get(`[data-cy="terminals-firmware-history-link-${processingBulkOperation.bulkOperationId}"]`).click()

    cy.wait(['@getTerminalsBulkOperations', '@getTerminalList'])

    // データ更新ボタン押下
    cy.get('[data-cy="terminals-firmware-history-id-refresh-button"]').click()

    // もう一度 API が呼ばれることを確認
    cy.wait(['@getTerminalsBulkOperations', '@getTerminalList'])

    // 途中キャンセルボタン押下
    cy.get('[data-cy="terminals-firmware-history-id-cancel-in-progress-button"]').click()

    // もう一度 API が呼ばれることを確認
    cy.wait(['@getTerminalsBulkOperations', '@getTerminalList'])

    // ダイアログが表示されることを確認
    cy.get('[data-cy="terminals-firmware-history-id-dialog"]').should('be.visible')

    // 途中キャンセル実行ボタン押下
    cy.get('[data-cy="terminals-firmware-history-id-dialog"] .dialog-base-submit-button').click()

    // deleteTerminalsBulkOperations が実行されることを確認
    cy.wait('@deleteTerminalsBulkOperations')

    // 通知ダイアログが表示されることを確認
    cy.get('[data-cy="notification-dialog-text"]').should(
      'have.text',
      t('firmwareUpdate.message.cancelInProgressCompleted'),
    )

    // ダイアログを閉じる
    cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
    cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.close')).click()
    cy.get('[data-cy="notification-dialog-text"]').should('not.exist')

    // 一括更新の履歴一覧へ戻っていることを確認
    cy.url().should('include', `/tenants/${this.tenantId}/terminals-firmware/history`)
  })

  it('ステータスが完了の場合', function () {
    const completedBulkOperation = this.bulkOperationsList.find(
      (bulkOperation: TerminalsBulkOperationsResponse) => bulkOperation.status === 'completed',
    )
    cy.intercept('GET', `**/ztgict/v1/terminals-bulk-operations/${completedBulkOperation.bulkOperationId}`, {
      fixture: 'terminals-firmware/bulk-operations-completed',
    }).as('getTerminalsBulkOperations')
    cy.intercept('GET', '**/ztgict/v1/terminals?terminalId=*', {
      fixture: 'terminals-firmware/terminal-list-completed',
    }).as('getTerminalList')

    // ファームウェア一括更新の履歴一覧画面に遷移
    cy.visit(`/tenants/${this.tenantId}/terminals-firmware/history`)

    cy.wait('@getTerminalsBulkOperationsList')

    // 完了済みの bulkOperationId をクリック
    cy.get(`[data-cy="terminals-firmware-history-link-${completedBulkOperation.bulkOperationId}"]`).click()
    cy.wait(['@getTerminalsBulkOperations', '@getTerminalList'])

    // データ更新ボタン、途中キャンセルボタンが非活性であることを確認
    cy.get('[data-cy="terminals-firmware-history-id-refresh-button"]').should('be.disabled')
    cy.get('[data-cy="terminals-firmware-history-id-cancel-in-progress-button"]').should('be.disabled')
  })

  it('データ更新でステータスが完了になる場合', function () {
    const processingBulkOperation = this.bulkOperationsList.find(
      (bulkOperation: TerminalsBulkOperationsResponse) => bulkOperation.status === 'processing',
    )
    cy.intercept('GET', `**/ztgict/v1/terminals-bulk-operations/${processingBulkOperation.bulkOperationId}`, {
      fixture: 'terminals-firmware/bulk-operations-processing',
    }).as('getTerminalsBulkOperations')
    cy.intercept('GET', '**/ztgict/v1/terminals?terminalId=*', {
      fixture: 'terminals-firmware/terminal-list-processing',
    }).as('getTerminalList')

    // ファームウェア一括更新の履歴一覧画面に遷移
    cy.visit(`/tenants/${this.tenantId}/terminals-firmware/history`)

    cy.wait('@getTerminalsBulkOperationsList')

    // 処理中の bulkOperationId をクリック
    cy.get(`[data-cy="terminals-firmware-history-link-${processingBulkOperation.bulkOperationId}"]`).click()

    cy.wait(['@getTerminalsBulkOperations', '@getTerminalList'])

    // 途中キャンセルボタン、データ更新ボタンが活性であることを確認
    cy.get('[data-cy="terminals-firmware-history-id-cancel-in-progress-button"]').should('not.be.disabled')
    cy.get('[data-cy="terminals-firmware-history-id-refresh-button"]').should('not.be.disabled')

    // intercept を上書きして status を completed に変更
    cy.intercept('GET', `**/ztgict/v1/terminals-bulk-operations/${processingBulkOperation.bulkOperationId}`, {
      fixture: 'terminals-firmware/bulk-operations-completed',
    }).as('getTerminalsBulkOperations')
    cy.intercept('GET', '**/ztgict/v1/terminals?terminalId=*', {
      fixture: 'terminals-firmware/terminal-list-completed',
    }).as('getTerminalList')

    // データ更新ボタン押下
    cy.get('[data-cy="terminals-firmware-history-id-refresh-button"]').click()
    cy.wait(['@getTerminalsBulkOperations', '@getTerminalList'])

    // 途中キャンセルボタン、データ更新ボタンが非活性になることを確認
    cy.get('[data-cy="terminals-firmware-history-id-cancel-in-progress-button"]').should('be.disabled')
    cy.get('[data-cy="terminals-firmware-history-id-refresh-button"]').should('be.disabled')
  })
})
