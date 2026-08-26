// テスト用なので実装の手間を考えて any を許容する
/* eslint-disable @typescript-eslint/no-explicit-any */

import { CorporateVerificationMethodTypes } from '@app/api/terminals/constants'
import { generateRandomHex, t, getTerminalBulkPostRequest, nDaysLater, stripPrefix } from '@cypress/support/utils'

describe('かんたん申込（VPN新規作成する）', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)
    this.bulkOrderId = generateRandomHex(32)

    cy.fixture('quick-setup/vpn-created-detail.json').then(detail => {
      this.vpnCreateData = {
        vpnId: detail.vpnId,
        customerNote: detail.customerNote,
        internalAddress: detail.internalAddress,
      }
    })
    cy.fixture('quick-setup/terminal-mobile-in-person-my-number.json').then(create => {
      this.terminalMobile = create
    })
    cy.fixture('quick-setup/terminal-mobile-corporate-number-in-person.json').then(edit => {
      this.terminalMobileEdit = edit
    })
    cy.fixture('upload-document.json').then(data => {
      this.uploadDocumentId = data.documentId
    })
    cy.fixture('quick-setup/terminals.json').then(data => {
      this.inputTerminals1st = [data.terminals[0], data.terminals[1]].map((terminal: any, index: number) =>
        Object.assign({}, terminal, {
          vpnId: this.vpnCreateData.vpnId,
          deliveryDate: nDaysLater(25 + index),
        }),
      )
      this.inputTerminals2nd = [data.terminals[2], data.terminals[3]].map((terminal: any, index: number) =>
        Object.assign({}, terminal, {
          vpnId: this.vpnCreateData.vpnId,
          deliveryDate: nDaysLater(30 + index),
        }),
      )
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
    cy.fixture('quick-setup/vpn-list').then(data => {
      this.vpnList = data.vpns
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
      fixture: 'behavior-detection/settings',
    }).as('getBehaviorDetection')

    cy.intercept('POST', '**/ztgict/v1/vpns', { fixture: 'quick-setup/vpn-created-detail' }).as('postVpn')
    cy.intercept('POST', '**/ztgict/v1/upload-document', { fixture: 'upload-document' }).as('postUploadDocument')
    cy.intercept('POST', '**/ztgict/v1/terminals-bulk', { bulkOrderId: this.bulkOrderId }).as('postTerminalBulk')
    cy.intercept('GET', `**/ztgict/v1/resource-summary/orders?bulkOrderId=${this.bulkOrderId}`, {
      fixture: 'orders/list',
    }).as('getOrderList')
  })

  it('VPN新規作成を選択 -> モバイル入力 -> 端末入力(1件) -> 確認画面(モバイル情報の更新)', function () {
    cy.visit(`/tenants/${this.tenantId}/quick-setup`)
    cy.wait([
      '@getSession',
      '@getMobile',
      '@getTrafficReportFlowAnalyzerTermsOfService',
      '@getSecurityTermsOfService',
      '@getVpnList',
      '@getIpoeList',
      '@getTerminalList',
      '@getMobileTermsOfService',
      '@getDownloadMobileMonitoringTermsOfService',
      '@getGuaranteeList',
      '@getBreakOutList',
      '@getBehaviorDetection',
      '@getServiceClosedDaysTerminal',
    ])

    // 01. 作成リソース一覧
    cy.get('[data-cy="quick-step-template-prev-button"]').should('not.exist')
    cy.get('[data-cy="quick-step-template-next-button"]').as('nextButton').should('have.text', t('common.next')).click()

    // 02-1. VPN選択画面(今回はVPN新規作成を選択する)
    cy.get('[data-cy="quick-step-template-next-button"]').should('have.text', t('common.next')).click()

    cy.get('[data-cy="quick-step-template-prev-button"]').as('cancelButton')
    // 02-2. VPN新規作成入力画面
    cy.get('[data-cy="quick-setup-vpn-input-customer-note"]').find('input').type(this.vpnCreateData.customerNote)
    cy.get('[data-cy="quick-setup-vpn-input-internal-address"]')
      .find('input')
      .type(stripPrefix(this.vpnCreateData.internalAddress))
    cy.get('@cancelButton').should('have.text', t('common.return'))
    cy.get('@nextButton').should('have.text', t('common.confirm')).click()
    // 02-3. VPN新規作成確認画面
    cy.get('@nextButton').should('have.text', t('common.create')).click()
    cy.wait('@postVpn').then(req => {
      expect(req.request.body).to.deep.equal({
        customerNote: this.vpnCreateData.customerNote,
        internalAddress: this.vpnCreateData.internalAddress,
      })
    })
    // POST vpns の成功メッセージ確認
    cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('message.created'))
    cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
    cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.close')).click()
    cy.get('[data-cy="notification-dialog-text"]').should('not.exist')
    cy.wait(100)

    // 03-1. モバイル情報入力画面
    cy.get('[data-cy="quick-step-template-next-button"]').should('be.disabled')
    cy.inputTerminalMobile({
      inputData: {
        ...this.terminalMobile,
        corporateVerificationMethod: CorporateVerificationMethodTypes.InPersonVerification,
      },
      document: { aliasName: '@postUploadDocument', id: this.uploadDocumentId },
    })
    cy.get('@cancelButton').should('have.text', t('common.return'))
    cy.get('@nextButton').should('have.text', t('common.next')).click()

    // 戻った時に入力済みのモバイル情報が残っていることを確認する
    cy.get('@cancelButton').should('have.text', t('common.return')).click()
    cy.confirmTerminalMobile({
      inputData: {
        ...this.terminalMobile,
        corporateVerificationMethod: CorporateVerificationMethodTypes.InPersonVerification,
        contractIdentificationDocumentId: this.uploadDocumentId,
        picEmploymentDocumentId: this.uploadDocumentId,
      },
    })
    cy.get('[data-cy="quick-step-template-next-button"]').should('have.text', t('common.next')).click()

    // 03-2 本人確認情報入力
    cy.inputTerminalMobilePicInformationMyNumberCard({
      inputData: this.terminalMobile,
    })

    // 一旦戻り、再度進んでも端末数入力へ遷移できることを確認する
    cy.get('@nextButton').should('not.be.disabled')
    cy.get('@cancelButton').should('have.text', t('common.return')).click()

    cy.get('@nextButton').should('have.text', t('common.next')).click()

    // 戻った時に入力済みの本人確認情報が残っていることを確認する
    cy.confirmTerminalMobilePicInformationMyNumberCard({
      inputData: this.terminalMobile,
    })
    // 端末数入力へ進む
    cy.get('@cancelButton').should('have.text', t('common.return'))
    cy.get('@nextButton').click()

    // 03-3. 端末数入力
    const length = 2
    cy.inputSelectForm({ selector: '[data-cy="quick-setup-terminal-number-of-terminal"]', value: `${length}` })
    cy.get('@cancelButton').should('have.text', t('common.return'))
    cy.get('@nextButton').should('have.text', t('common.next')).click()

    // 03-4. 端末情報入力
    this.inputTerminals1st.forEach((inputData: any, index: number) => {
      cy.inputTerminalWithoutMobile({
        inputData,
        className: `[data-cy="quick-setup-terminal-edit-terminal-data-${index}"]`,
        isBulk: true,
        breakOutList: this.breakOutList,
        guaranteeList: this.guaranteeList,
        ipoeList: this.ipoeList,
      })
      cy.get('[data-cy="quick-step-template-next-button"]').should('have.text', t('common.next')).click()
    })

    // トラフィックレポート（フロー分析）とセキュリティ規約の同意確認ダイアログが表示されない
    cy.wait(['@getTrafficReportFlowAnalyzerTermsOfService', '@getSecurityTermsOfService'])
    cy.get('[data-cy="terms-of-service-confirm-dialog"]').should('not.exist')

    // 03-5. 端末確認 - VPN情報
    cy.get('[data-cy="quick-setup-terminal-confirm-vpn"]').should('exist').find('.arrow-up').click()
    cy.get('[data-cy="quick-setup-terminal-confirm-vpn"]')
      .find('.detail-grid')
      .should('have.length', 3)
      .each((row, index) => {
        if (index === 0) {
          cy.wrap(row).find('div').eq(1).should('have.text', this.vpnCreateData.vpnId)
        } else if (index === 1) {
          cy.wrap(row).find('div').eq(1).should('have.text', this.vpnCreateData.customerNote)
        } else if (index === 2) {
          cy.wrap(row).find('div').eq(1).should('have.text', this.vpnCreateData.internalAddress)
        }
      })
    cy.get('[data-cy="quick-setup-terminal-confirm-vpn-not-using"]').should('not.exist')
    // 03-5. 端末確認 - 端末情報
    cy.get('[data-cy="quick-setup-terminal-confirm-terminals"]').should('have.length', length)

    // 03-6. 情報更新 - モバイル情報
    cy.get('[data-cy="quick-setup-terminal-confirm-mobile"]').find('.arrow-up').click()
    cy.get('[data-cy="quick-setup-terminal-confirm-mobile-button"]').as('mobileButton')
    cy.get('@mobileButton').should('not.be.disabled').should('have.text', t('common.edit')).click()
    cy.inputTerminalMobile({
      inputData: {
        ...this.terminalMobileEdit,
        corporateVerificationMethod: CorporateVerificationMethodTypes.CorporateNumberVerification,
      },
      document: { aliasName: '@postUploadDocument', id: this.uploadDocumentId },
      originalRat: this.terminalMobile.rat,
    })
    cy.inputTerminalMobilePicInformationInPerson({
      inputData: {
        ...this.terminalMobileEdit,
        picIdentificationFrontDocumentId: this.uploadDocumentId,
        picIdentificationBackDocumentId: this.uploadDocumentId,
        picIdentificationAdditionalDocumentId: this.uploadDocumentId,
        picAuxiliaryIdentificationDocumentId: this.uploadDocumentId,
      },
      document: { aliasName: '@postUploadDocument', id: this.uploadDocumentId },
    })
    cy.get('@mobileButton').should('not.be.disabled').should('have.text', t('common.save')).click()
    cy.confirmTerminalMobile({
      inputData: {
        ...this.terminalMobileEdit,
        corporateVerificationMethod: CorporateVerificationMethodTypes.CorporateNumberVerification,
        picEmploymentDocumentId: this.uploadDocumentId,
      },
      disabled: true,
    })
    cy.confirmTerminalMobilePicInformationInPerson({
      inputData: {
        ...this.terminalMobileEdit,
        picIdentificationFrontDocumentId: this.uploadDocumentId,
        picIdentificationBackDocumentId: this.uploadDocumentId,
        picIdentificationAdditionalDocumentId: this.uploadDocumentId,
        picAuxiliaryIdentificationDocumentId: this.uploadDocumentId,
      },
      disabled: true,
    })

    // 03-6. 情報更新 - 端末情報
    this.inputTerminals2nd.forEach((inputData: any, index: number) => {
      cy.get('[data-cy="quick-setup-terminal-confirm-terminals"]').eq(index).find('.arrow-up').click()
      cy.get(`[data-cy="quick-setup-terminal-confirm-terminals-button-${index}"]`).as('terminalButton')
      cy.get('@terminalButton').should('not.be.disabled').should('have.text', t('common.edit')).click()

      // 先にDHCPリーレーサーバーを削除しておく
      this.inputTerminals1st[index]?.dhcpRelayServers?.forEach(() => {
        cy.removeRow({
          className: `[data-cy="quick-setup-terminal-confirm-terminals-${index}"] [data-cy="edit-terminal-data-dhcp-relay-servers"]`,
          buttonClassName: '.multiple-input-form-trush-button',
        })
      })
      cy.inputTerminalWithoutMobile({
        inputData,
        className: `[data-cy="quick-setup-terminal-confirm-terminals-${index}"]`,
        isEdit: true,
        isBulk: true,
        breakOutList: this.breakOutList,
        guaranteeList: this.guaranteeList,
        ipoeList: this.ipoeList,
        originalData: this.inputTerminals1st[index],
      })
      cy.get('@terminalButton').should('not.be.disabled').should('have.text', t('common.save')).click()
      cy.wait(100)

      cy.confirmTerminalWithoutMobile({
        inputData,
        className: `[data-cy="quick-setup-terminal-confirm-terminals-${index}"]`,
        isBulk: true,
        disabled: true,
        guaranteeList: this.guaranteeList,
        ipoeList: this.ipoeList,
      })
    })

    // 03-7. POST terminals-bulk のリクエスト情報
    // CorporateNumberVerification の場合、contractIdentificationDocumentType/Id は不要
    const request = getTerminalBulkPostRequest({
      inputMobile: {
        ...this.terminalMobileEdit,
        picIdentificationFrontDocumentId: this.uploadDocumentId,
        picIdentificationBackDocumentId: this.uploadDocumentId,
        picIdentificationAdditionalDocumentId: this.uploadDocumentId,
        picAuxiliaryIdentificationDocumentId: this.uploadDocumentId,
        picEmploymentDocumentId: this.uploadDocumentId,
      },
      inputTerminals: this.inputTerminals2nd,
    })
    cy.get('[data-cy="quick-step-template-next-button"]').should('have.text', t('common.create')).click()
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
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/orders?bulkOrderId=${this.bulkOrderId}`)
    cy.wait(['@getOrderList'])
  })
})
