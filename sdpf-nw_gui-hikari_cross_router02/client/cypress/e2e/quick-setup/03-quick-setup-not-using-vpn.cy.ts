import { CorporateVerificationMethodTypes } from '@app/api/terminals/constants'
import { generateRandomHex, t, getTerminalBulkPostRequest, nDaysLater } from '@cypress/support/utils'

describe('かんたん申込（VPNを使用しない）', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)
    this.bulkOrderId = generateRandomHex(32)

    cy.fixture('quick-setup/terminal-mobile-corporate-number-my-number.json').then(create => {
      this.terminalMobile = create
    })
    cy.fixture('upload-document.json').then(data => {
      this.uploadDocumentId = data.documentId
    })
    cy.fixture('quick-setup/terminals.json').then(data => {
      // threatDetectionPlan/flowCollectorPlan/behaviorDetectionPlan が全部 noSubscription のテストデータ
      this.inputTerminal = Object.assign({}, data.terminals[0], { vpnId: undefined, deliveryDate: nDaysLater(26) })
    })
    cy.fixture('guarantees/circuits/list.json').then(data => {
      this.guaranteeList = data.guarantees
    })
    cy.fixture('ipoes/list.json').then(data => {
      this.ipoeList = data.ipoes
    })
    cy.fixture('break-out-lists/list.json').then(data => {
      this.breakOutList = data.breakOutLists
    })

    cy.intercept('GET', '**/ztgict/v1/service-closed-days/terminal', {
      body: { service: 'terminal', closedDays: [] },
    }).as('getServiceClosedDaysTerminal')
    cy.intercept('GET', '**/ztgict/v1/settings/mobile', { fixture: 'mobile/accepted-mobile' }).as('getMobile')
    cy.intercept('GET', '**/ztgict/v1/settings/mobile/mobile-terms-of-service', {
      fixture: 'mobile/mobile-terms-of-service-1',
    }).as('getMobileTermsOfService')
    cy.intercept('GET', '**/ztgict/v1/download-terms-of-service*', {
      fixture: 'mobile/mobile-download-terms-of-service',
    }).as('getDownloadMobileMonitoringTermsOfService')
    cy.intercept('GET', '**/ztgict/v1/guarantees*', { fixture: 'guarantees/circuits/list' }).as('getGuaranteeList')
    cy.intercept('GET', '**/ztgict/v1/ipoe?*', { fixture: 'quick-setup/ipoe-list' }).as('getIpoeList')
    cy.intercept('GET', '**/ztgict/v1/resource-summary/vpns', { fixture: 'quick-setup/vpn-list' }).as('getVpnList')
    cy.intercept('GET', '**/ztgict/v1/resource-summary/terminals*', { fixture: 'quick-setup/terminal-list' }).as(
      'getTerminalList',
    )
    cy.intercept('GET', '**/ztgict/v1/break-out-lists?resourceStatus=active&resourceStatus=inactive', {
      fixture: 'break-out-lists/list',
    }).as('getBreakOutList')

    cy.intercept('POST', '**/ztgict/v1/upload-document', { fixture: 'upload-document' }).as('postUploadDocument')
    cy.intercept('POST', '**/ztgict/v1/terminals-bulk', { bulkOrderId: this.bulkOrderId }).as('postTerminalBulk')
    cy.intercept('GET', `**/ztgict/v1/resource-summary/orders?bulkOrderId=${this.bulkOrderId}`, {
      fixture: 'orders/list',
    }).as('getOrderList')
    cy.intercept('GET', '**/ztgict/v1/settings/traffic-report-flow-analyzer', {
      body: { termsOfServiceAccepted: false },
    }).as('getTrafficReportFlowAnalyzerTermsOfService')
    cy.intercept('GET', '**/ztgict/v1/settings/security', { body: { termsOfServiceAccepted: false } }).as(
      'getSecurityTermsOfService',
    )
    cy.intercept('GET', '**/ztgict/v1/settings/behavior-detection', {
      fixture: 'behavior-detection/settings',
    }).as('getBehaviorDetection')
  })

  it('VPNを使用しない -> モバイル入力 -> 端末入力(1件) -> 確認画面', function () {
    cy.visit(`/tenants/${this.tenantId}/quick-setup`)
    cy.wait([
      '@getSession',
      '@getTrafficReportFlowAnalyzerTermsOfService',
      '@getSecurityTermsOfService',
      '@getVpnList',
      '@getIpoeList',
      '@getTerminalList',
      '@getMobileTermsOfService',
      '@getMobile',
      '@getDownloadMobileMonitoringTermsOfService',
      '@getGuaranteeList',
      '@getBreakOutList',
      '@getBehaviorDetection',
      '@getServiceClosedDaysTerminal',
    ])

    // 01. 作成リソース一覧
    cy.get('[data-cy="quick-step-template-prev-button"]').should('not.exist')
    cy.get('[data-cy="quick-step-template-next-button"]').as('nextButton')
    cy.get('@nextButton').should('have.text', t('common.next')).click()

    // 02-1. VPN選択画面(今回はVPNを指定しない)
    cy.inputSelectForm({ selector: '[data-cy="quick-setup-vpn-select-vpn"]', value: t('quickSetup.vpnNotUsing') })
    cy.get('@nextButton').should('have.text', t('common.next')).click()
    // 02-2. VPN新規作成入力画面が表示されないことを確認
    cy.get('[data-cy="quick-setup-vpn-input-customer-note"]').should('not.exist')

    // 03-1. モバイル情報入力画面
    // 法人番号申告による確認
    cy.get('@nextButton').should('be.disabled')
    cy.inputTerminalMobile({
      inputData: {
        ...this.terminalMobile,
        corporateVerificationMethod: CorporateVerificationMethodTypes.CorporateNumberVerification,
      },
      document: { aliasName: '@postUploadDocument', id: this.uploadDocumentId },
    })
    cy.get('[data-cy="quick-step-template-prev-button"]').as('cancelButton')
    cy.get('@cancelButton').should('have.text', t('common.return'))
    cy.get('@nextButton').should('have.text', t('common.next')).click()

    // 03-2: 本人確認情報入力
    // マイナンバーカードによる本人確認
    cy.inputTerminalMobilePicInformationMyNumberCard({
      inputData: this.terminalMobile,
    })

    // 一旦戻り、再度進んでも端末数入力へ遷移できることを確認する
    cy.get('@nextButton').should('not.be.disabled')
    cy.get('@cancelButton').should('have.text', t('common.return')).click()

    cy.get('@nextButton').should('have.text', t('common.next')).click()
    cy.confirmTerminalMobilePicInformationMyNumberCard({
      inputData: this.terminalMobile,
    })
    // 端末数入力へ進む
    cy.get('@cancelButton').should('have.text', t('common.return'))
    cy.get('@nextButton').click()

    // 03-3. 端末数入力
    const length = 1
    cy.inputSelectForm({ selector: '[data-cy="quick-setup-terminal-number-of-terminal"]', value: `${length}` })
    cy.get('@cancelButton').should('have.text', t('common.return'))
    cy.get('@nextButton').should('have.text', t('common.next')).click()

    // 03-4-1. 「利用回線選択」の表示確認
    cy.confirmEditCircuitTypes({
      className:
        '[data-cy="quick-setup-terminal-edit-terminal-data-0"] [data-cy="edit-terminal-data-edit-circuit-types"]',
    })
    // 03-4-2. 端末情報入力
    cy.inputTerminalWithoutMobile({
      inputData: this.inputTerminal,
      className: '[data-cy="quick-setup-terminal-edit-terminal-data-0"]',
      isBulk: true,
      breakOutList: this.breakOutList,
      guaranteeList: this.guaranteeList,
      ipoeList: this.ipoeList,
    })
    cy.get('@nextButton').should('have.text', t('common.next')).click()
    // トラフィックレポート（フロー分析）とセキュリティ規約の同意確認ダイアログが表示されない
    cy.wait(['@getTrafficReportFlowAnalyzerTermsOfService', '@getSecurityTermsOfService', '@getBehaviorDetection'])
    cy.get('[data-cy="terms-of-service-confirm-dialog"]').should('not.exist')

    // 03-5. 端末確認 - VPN情報
    cy.get('[data-cy="quick-setup-terminal-confirm-vpn"]').should('not.exist')
    cy.get('[data-cy="quick-setup-terminal-confirm-vpn-not-using"]').should('exist')

    // 03-5. 端末確認 - モバイル情報
    cy.get('[data-cy="quick-setup-terminal-confirm-mobile"]').find('.arrow-up').click()
    cy.confirmTerminalMobile({
      inputData: {
        ...this.terminalMobile,
        corporateVerificationMethod: CorporateVerificationMethodTypes.CorporateNumberVerification,
        contractIdentificationDocumentId: this.uploadDocumentId,
        picEmploymentDocumentId: this.uploadDocumentId,
      },
      disabled: true,
    })
    cy.confirmTerminalMobilePicInformationMyNumberCard({
      inputData: this.terminalMobile,
      disabled: true,
    })

    // 03-5. 端末確認 - 端末情報
    cy.get('[data-cy="quick-setup-terminal-confirm-terminals"]')
      .should('have.length', length)
      .each((selector, index) => {
        cy.wrap(selector).find('.arrow-up').first().click()
        cy.wait(100)
        cy.confirmTerminalWithoutMobile({
          inputData: this.inputTerminal,
          className: `[data-cy="quick-setup-terminal-confirm-terminals-${index}"]`,
          isBulk: true,
          disabled: true,
          guaranteeList: this.guaranteeList,
          ipoeList: this.ipoeList,
        })
      })

    const request = getTerminalBulkPostRequest({
      inputMobile: { ...this.terminalMobile, picEmploymentDocumentId: this.uploadDocumentId },
      inputTerminals: [this.inputTerminal],
    })

    cy.get('@nextButton').should('have.text', t('common.create')).click()
    cy.wait('@postTerminalBulk').then(req => {
      const stringify = JSON.stringify(request)
      expect(req.request.body).to.deep.equal(JSON.parse(stringify))
    })

    // 最初の画面に戻ることを確認する
    cy.get('.card-container').should('contain', t('quickSetup.confirmResourceCreation', { here: t('common.here') }))

    // POST terminals-bulk の成功メッセージ
    cy.checkTerminalSuccessDialog({
      bulkOrderId: this.bulkOrderId,
    })

    // オーダー一覧画面に遷移
    cy.get('[data-cy="terminal-success-dialog-move-to-order-detail"]')
      .should('have.text', t('common.moveToOrderList'))
      .click()
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/orders?bulkOrderId=${this.bulkOrderId}`)
    cy.wait(['@getOrderList'])
  })

  it('getServiceClosedDays が 500 エラーの場合、開始画面の次へボタンが押せない', function () {
    cy.intercept('GET', '**/ztgict/v1/service-closed-days/terminal', {
      statusCode: 500,
      body: { errorCode: 500, errorMessage: '500 Internal Server Error!' },
    }).as('getServiceClosedDaysError')

    cy.visit(`/tenants/${this.tenantId}/quick-setup`)
    cy.wait('@getServiceClosedDaysError')

    // エラーダイアログの表示
    cy.get('[data-cy="notification-dialog-text"]').should(
      'have.text',
      `${t('message.failed')}\n500\n500 Internal Server Error!`,
    )
    cy.get('[data-cy="notification-dialog-submit-button"]').click()

    // 開始画面の次へボタンが disabled になっている
    cy.get('[data-cy="quick-step-template-next-button"]').should('be.disabled')
  })
})
