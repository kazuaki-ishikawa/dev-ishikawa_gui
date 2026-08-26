// テスト用なので実装の手間を考えて any を許容する
/* eslint-disable @typescript-eslint/no-explicit-any */
import { BehaviorDetectionPlanTypes } from '@app/api/behaviorDetection/constants'
import { CorporateVerificationMethodTypes } from '@app/api/terminals/constants'
import { generateRandomHex, t, getTerminalBulkPostRequest, nDaysLater } from '@cypress/support/utils'

// 両方falseは初期値なので除外
// 両方trueは02-quick-setup-vpn.cy.tsでテストしているので省略
const dialogTestCases = [
  {
    trafficReportFlowAnalyzerTermsOfService: true,
    securityTermsOfService: false,
    behaviorDetectionPlan: BehaviorDetectionPlanTypes.None,
  },
  {
    trafficReportFlowAnalyzerTermsOfService: false,
    securityTermsOfService: true,
    behaviorDetectionPlan: BehaviorDetectionPlanTypes.Lite,
  },
]

describe('かんたん申込（複数端末入力）', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)
    this.bulkOrderId = generateRandomHex(32)

    cy.fixture('quick-setup/vpn-list.json').then(vpns => {
      this.vpn = vpns.vpns[0]
    })
    cy.fixture('quick-setup/terminal-mobile-corporate-number-in-person.json').then(create => {
      this.terminalMobile = create
    })
    cy.fixture('upload-document.json').then(data => {
      this.uploadDocumentId = data.documentId
    })
    cy.fixture('quick-setup/terminals.json').then(terminals => {
      this.terminals = terminals.terminals
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
    cy.intercept('GET', '**/ztgict/v1/settings/behavior-detection', {
      body: {
        thisMonthBehaviorDetectionPlan: BehaviorDetectionPlanTypes.None,
        nextMonthBehaviorDetectionPlan: BehaviorDetectionPlanTypes.None,
      },
    }).as('getBehaviorDetection')

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
  })

  it('VPN選択 -> モバイル入力 -> 端末入力(複数件) -> 確認画面', function () {
    cy.visit(`/tenants/${this.tenantId}/quick-setup`)
    cy.wait([
      '@getSession',
      '@getMobile',
      '@getTrafficReportFlowAnalyzerTermsOfService',
      '@getSecurityTermsOfService',
      '@getBehaviorDetection',
      '@getVpnList',
      '@getIpoeList',
      '@getTerminalList',
      '@getMobileTermsOfService',
      '@getDownloadMobileMonitoringTermsOfService',
      '@getGuaranteeList',
      '@getBreakOutList',
      '@getServiceClosedDaysTerminal',
    ])

    // 01. 作成リソース一覧
    cy.get('[data-cy="quick-step-template-prev-button"]').should('not.exist')
    cy.get('[data-cy="quick-step-template-next-button"]').as('nextButton')
    cy.get('@nextButton').should('have.text', t('common.next')).click()

    // 02-1. VPN選択画面(VPN IDを指定する)
    cy.inputSelectForm({ selector: '[data-cy="quick-setup-vpn-select-vpn"]', value: this.vpn.vpnId })

    cy.get('@nextButton').should('have.text', t('common.next')).click()
    // 02-2. VPN新規作成入力画面が表示されないことを確認
    cy.get('[data-cy="quick-setup-vpn-input-customer-note"]').should('not.exist')

    // 03-1. モバイル情報入力画面
    // 法人番号申告による確認
    cy.get('@nextButton').should('be.disabled')
    cy.get('[data-cy="edit-terminal-mobile-corporate-verification-method"]').find('.radio.checked').should('not.exist')
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

    // 03-2. 本人確認情報入力
    // 担当営業による対面確認
    cy.inputTerminalMobilePicInformationInPerson({
      inputData: {
        ...this.terminalMobile,
        picIdentificationFrontDocumentId: this.uploadDocumentId,
        picIdentificationBackDocumentId: this.uploadDocumentId,
        picIdentificationAdditionalDocumentId: this.uploadDocumentId,
        picAuxiliaryIdentificationDocumentId: this.uploadDocumentId,
      },
      document: { aliasName: '@postUploadDocument', id: this.uploadDocumentId },
    })

    // 一旦戻り、再度進んでも端末数入力へ遷移できることを確認する
    cy.get('@nextButton').should('not.be.disabled')
    cy.get('@cancelButton').should('have.text', t('common.return')).click()

    cy.get('@nextButton').should('have.text', t('common.next')).click()
    cy.confirmTerminalMobilePicInformationInPerson({
      inputData: {
        ...this.terminalMobile,
        picIdentificationFrontDocumentId: this.uploadDocumentId,
        picIdentificationBackDocumentId: this.uploadDocumentId,
        picIdentificationAdditionalDocumentId: this.uploadDocumentId,
        picAuxiliaryIdentificationDocumentId: this.uploadDocumentId,
      },
    })
    // 端末数入力へ進む
    cy.get('@cancelButton').should('have.text', t('common.return'))
    cy.get('@nextButton').click()

    // 03-3. 端末数入力
    const length = this.terminals.length
    cy.inputSelectForm({ selector: '[data-cy="quick-setup-terminal-number-of-terminal"]', value: `${length}` })
    cy.get('@cancelButton').should('have.text', t('common.return'))
    cy.get('@nextButton').should('have.text', t('common.next')).click()

    // 03-4. 端末情報入力
    this.terminals.forEach((terminal: any, index: number) => {
      cy.inputTerminalWithoutMobile({
        inputData: { ...terminal, vpnId: this.vpn.vpnId, deliveryDate: nDaysLater(26 + index) },
        className: `[data-cy="quick-setup-terminal-edit-terminal-data-${index}"]`,
        isBulk: true,
        breakOutList: this.breakOutList,
        guaranteeList: this.guaranteeList,
        ipoeList: this.ipoeList,
      })
      if (index > 0) {
        // 戻った時に入力済みの端末情報が残っていることを確認する
        cy.get('@cancelButton').should('have.text', t('common.return')).click()
        cy.confirmTerminalWithoutMobile({
          inputData: { ...this.terminals[index - 1], vpnId: this.vpn.vpnId, deliveryDate: nDaysLater(26 + index - 1) },
          className: `[data-cy="quick-setup-terminal-edit-terminal-data-${index - 1}"]`,
          isBulk: true,
          guaranteeList: this.guaranteeList,
          ipoeList: this.ipoeList,
        })
        cy.get('[data-cy="quick-step-template-next-button"]').click()
        // 前画面の遷移が完了していない可能性があるので描画を待つ
        cy.get('[data-cy="quick-setup-terminal-message"]').should(
          'have.text',
          `${t('sideBar.terminal')} ${index + 1}/${length}`,
        )
      }
      cy.get('@nextButton').should('have.text', t('common.next')).click()
    })

    cy.wait(['@getTrafficReportFlowAnalyzerTermsOfService', '@getSecurityTermsOfService', '@getBehaviorDetection'])
    // ダイアログにトラフィックレポート（フロー分析）とセキュリティ規約の同意確認が表示されることを確認
    cy.checkTermsOfServiceConfirmDialogContent({
      trafficReportFlowAnalyzer: true,
      securityOptions: true,
      behaviorDetectionPlan: true,
    })

    dialogTestCases.forEach(
      ({ trafficReportFlowAnalyzerTermsOfService, securityTermsOfService, behaviorDetectionPlan }) => {
        // 同意設定のAPIを書き換え
        cy.intercept('GET', '**/ztgict/v1/settings/traffic-report-flow-analyzer', {
          body: { termsOfServiceAccepted: trafficReportFlowAnalyzerTermsOfService },
        }).as('getTrafficReportFlowAnalyzerTermsOfService')

        cy.intercept('GET', '**/ztgict/v1/settings/security', {
          body: { termsOfServiceAccepted: securityTermsOfService },
        }).as('getSecurityTermsOfService')

        cy.intercept('GET', '**/ztgict/v1/settings/behavior-detection', {
          body: {
            thisMonthBehaviorDetectionPlan: behaviorDetectionPlan,
            nextMonthBehaviorDetectionPlan: behaviorDetectionPlan,
          },
        }).as('getBehaviorDetection')

        // 再度次へボタンを押す
        cy.get('@nextButton').should('have.text', t('common.next')).click()
        cy.wait(['@getTrafficReportFlowAnalyzerTermsOfService', '@getSecurityTermsOfService', '@getBehaviorDetection'])

        // ダイアログの内容確認
        cy.checkTermsOfServiceConfirmDialogContent({
          trafficReportFlowAnalyzer: !trafficReportFlowAnalyzerTermsOfService,
          securityOptions: !securityTermsOfService,
          behaviorDetectionPlan: behaviorDetectionPlan === BehaviorDetectionPlanTypes.None,
        })
      },
    )

    cy.intercept('GET', '**/ztgict/v1/settings/traffic-report-flow-analyzer', {
      body: { termsOfServiceAccepted: true },
    }).as('getTrafficReportFlowAnalyzerTermsOfService')
    cy.intercept('GET', '**/ztgict/v1/settings/security', { body: { termsOfServiceAccepted: true } }).as(
      'getSecurityTermsOfService',
    )
    cy.intercept('GET', '**/ztgict/v1/settings/behavior-detection', {
      body: {
        thisMonthBehaviorDetectionPlan: BehaviorDetectionPlanTypes.Lite,
        nextMonthBehaviorDetectionPlan: BehaviorDetectionPlanTypes.Lite,
      },
    }).as('getBehaviorDetection')
    // 再度次へボタンを押す
    cy.get('@nextButton').should('have.text', t('common.next')).click()
    cy.wait(['@getTrafficReportFlowAnalyzerTermsOfService', '@getSecurityTermsOfService', '@getBehaviorDetection'])

    // トラフィックレポート（フロー分析）とセキュリティ規約の同意確認ダイアログが表示されない
    cy.get('[data-cy="terms-of-service-confirm-dialog"]').should('not.exist')
    cy.wait(100)

    // 戻った時に入力済みの端末情報が残っていることを確認する
    cy.get('@cancelButton').should('have.text', t('common.return')).click()
    cy.confirmTerminalWithoutMobile({
      inputData: {
        ...this.terminals.slice(-1)[0],
        vpnId: this.vpn.vpnId,
        deliveryDate: nDaysLater(26 + length - 1),
      },
      className: `[data-cy="quick-setup-terminal-edit-terminal-data-${length - 1}"]`,
      isBulk: true,
      guaranteeList: this.guaranteeList,
      ipoeList: this.ipoeList,
    })
    cy.get('@nextButton').should('have.text', t('common.next')).click()

    // 03-5. 端末確認 - VPN情報
    cy.get('[data-cy="quick-setup-terminal-confirm-vpn"]').should('exist').find('.arrow-up').click()
    cy.get('[data-cy="quick-setup-terminal-confirm-vpn"]')
      .find('.detail-grid')
      .should('have.length', 3)
      .each((row, index) => {
        if (index === 0) {
          cy.wrap(row).find('div').eq(1).should('have.text', this.vpn.vpnId)
        } else if (index === 1) {
          cy.wrap(row).find('div').eq(1).should('have.text', this.vpn.customerNote)
        } else if (index === 2) {
          cy.wrap(row).find('div').eq(1).should('have.text', this.vpn.internalAddress)
        }
      })
    cy.get('[data-cy="quick-setup-terminal-confirm-vpn-not-using"]').should('not.exist')
    // 03-5. 端末確認 - モバイル情報
    cy.get('[data-cy="quick-setup-terminal-confirm-mobile"]').find('.arrow-up').click()
    // 03-5. 端末確認 - 端末情報
    cy.get('[data-cy="quick-setup-terminal-confirm-terminals"]')
      .should('have.length', length)
      .each((selector, index) => {
        cy.wrap(selector).find('.arrow-up').first().click()
        // 内容が描画されるのを待つ
        cy.wrap(selector).find('[data-cy="edit-terminal-data-edit-circuit-types"]').should('be.visible')
        cy.confirmTerminalWithoutMobile({
          inputData: {
            ...this.terminals[index],
            vpnId: this.vpn.vpnId,
            deliveryDate: nDaysLater(26 + index),
          },
          className: `[data-cy="quick-setup-terminal-confirm-terminals-${index}"]`,
          isBulk: true,
          disabled: true,
          guaranteeList: this.guaranteeList,
          ipoeList: this.ipoeList,
        })
      })

    const request = getTerminalBulkPostRequest({
      inputMobile: {
        ...this.terminalMobile,
        picIdentificationFrontDocumentId: this.uploadDocumentId,
        picIdentificationBackDocumentId: this.uploadDocumentId,
        picIdentificationAdditionalDocumentId: this.uploadDocumentId,
        picAuxiliaryIdentificationDocumentId: this.uploadDocumentId,
        picEmploymentDocumentId: this.uploadDocumentId,
      },
      inputTerminals: this.terminals.map((terminal: any, index: number) => ({
        ...terminal,
        vpnId: this.vpn.vpnId,
        deliveryDate: nDaysLater(26 + index),
      })),
    })
    cy.get('@nextButton').should('have.text', t('common.create')).click()
    cy.wait('@postTerminalBulk').then(req => {
      const stringify = JSON.stringify(request)
      expect(req.request.body).to.deep.equal(JSON.parse(stringify))
    })

    // 最初の画面に戻ることを確認する
    cy.get('.card-container').should('contain', t('quickSetup.confirmResourceCreation', { here: t('common.here') }))

    // POST terminals-bulk の成功メッセージ
    cy.checkTerminalSuccessDialog({ bulkOrderId: this.bulkOrderId })

    // オーダー一覧画面に遷移
    cy.get('[data-cy="terminal-success-dialog-move-to-order-detail"]')
      .should('have.text', t('common.moveToOrderList'))
      .click()
    cy.wait(['@getOrderList'])
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/orders?bulkOrderId=${this.bulkOrderId}`)
  })
})
