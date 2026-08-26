import { OperationTypes } from '@app/api/terminals/constants'
import type { TerminalResponse } from '@app/api/terminals/types'
import { generateRandomHex, t } from '@cypress/support/utils'

describe('ファームウェア一括更新画面', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)

    cy.fixture('terminals-firmware/terminal-list.json').then(data => {
      this.terminalList = data.terminals
    })

    cy.intercept('GET', '**/ztgict/v1/resource-summary/terminals*', {
      fixture: 'terminals/list-some-items',
    }).as('getAllResourceSummaryTerminalList')

    cy.intercept('GET', '**/ztgict/v1/terminals-bulk/operation', {
      fixture: 'terminals-firmware/terminals-bulk-operation',
    }).as('getTerminalsBulkOperation')
    cy.intercept('POST', '**/ztgict/v1/terminals-bulk/operation', {
      fixture: 'terminals-firmware/post-bulk-operation',
    }).as('postTerminalBulkOperation')
  })

  it('ファームウェア一括更新実施', function () {
    cy.intercept('GET', '**/ztgict/v1/terminals?*', {
      fixture: 'terminals-firmware/terminal-list',
    }).as('getTerminalList')
    // ファームウェア一括確認・更新画面へ遷移
    cy.visit(`/tenants/${this.tenantId}/terminals-firmware/update-bulk`)

    // onBeforeMountで実行されるAPIを待つ
    cy.wait(['@getTerminalList', '@getAllResourceSummaryTerminalList', '@getTerminalsBulkOperation'])

    // 確認メッセージが表示されていないことを確認
    cy.get('[data-cy="terminals-firmware-update-bulk-confirm-message"]').should('not.exist')

    // 確認ボタンが非活性であることを確認
    cy.get('[data-cy="terminals-firmware-update-bulk-submit-button"]')
      .should('have.text', t('common.confirm'))
      .should('be.disabled')

    // .body .rowのエイリアスを作成
    cy.get('[data-cy="terminals-firmware-update-bulk-table"] .body .row').as('tableRows')

    // 無効なチェックボックスの確認
    // ファームウェアが全て最新
    const latestFirmwareVersionIndex = this.terminalList.findIndex((terminal: TerminalResponse) =>
      terminal.terminalDevices?.every(device => device.firmwareVersion?.attribute === 'latest'),
    )
    cy.get('@tableRows').eq(latestFirmwareVersionIndex).find('.checkbox').should('have.class', 'disabled')

    // orderStatus が applied
    const orderStatusAppliedIndex = this.terminalList.findIndex(
      (terminal: TerminalResponse) => terminal.orderStatus === 'applied',
    )
    cy.get('@tableRows').eq(orderStatusAppliedIndex).find('.checkbox').should('have.class', 'disabled')

    // firmwareUpdate が processing なのは配列の最後の要素
    cy.get('@tableRows')
      .eq(this.terminalList.length - 1)
      .find('.checkbox')
      .should('have.class', 'disabled')

    // テーブルの最初の3件のチェックボックスをクリック
    cy.get('@tableRows').eq(0).find('.checkbox').click()
    cy.get('@tableRows').eq(1).find('.checkbox').click()
    cy.get('@tableRows').eq(2).find('.checkbox').click()

    // 確認ボタン押下
    cy.get('[data-cy="terminals-firmware-update-bulk-submit-button"]').should('have.text', t('common.confirm')).click()

    // 確認メッセージが表示されていることを確認
    cy.get('[data-cy="terminals-firmware-update-bulk-confirm-message"]').should('exist')
    // 確認画面でテーブルに3件表示されていることを確認
    cy.get('@tableRows').should('have.length', 3)
    // 更新ボタン押下
    cy.get('[data-cy="terminals-firmware-update-bulk-submit-button"]').should('have.text', t('common.update')).click()

    // POSTリクエストの内容を確認
    cy.wait('@postTerminalBulkOperation').then(req => {
      expect(req.request.body).to.deep.equal({
        terminalIds: this.terminalList.slice(0, 3).map((terminal: { terminalId: string }) => terminal.terminalId),
        operation: OperationTypes.FirmwareUpdate,
      })
    })

    // 成功メッセージが表示されていることを確認
    cy.get('[data-cy="notification-dialog-text"]').should(
      'have.text',
      t('firmwareUpdate.message.firmwareUpdateBulkSubmit'),
    )
    // ダイアログを閉じる
    cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
    cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.close')).click()
    cy.get('[data-cy="notification-dialog-text"]').should('not.exist')
  })
})
