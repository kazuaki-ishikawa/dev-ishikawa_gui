import { BehaviorDetectionPlanTypes } from '@app/api/behaviorDetection/constants'
import { TerminalDeviceTypes } from '@app/api/constants'
import { generateRandomHex, t, getTerminalPostRequest, nDaysLater } from '@cypress/support/utils'

const testCases = [
  {
    name: 'IPoE',
    fixturePath: 'terminals/create-router02.json',
  },
]

describe('サービスルーター新規作成（RINKルーター02）', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)
    this.orderId = generateRandomHex(32)

    cy.fixture('ipoes/list.json').then(data => {
      this.ipoeList = data.ipoes
    })
    cy.fixture('vpns/list.json').then(data => {
      this.vpnList = data.vpns
    })
    cy.fixture('break-out-lists/list.json').then(data => {
      this.breakOutList = data.breakOutLists
    })

    cy.intercept('GET', '**/ztgict/v1/settings/security-help-desk', {
      fixture: 'security-contracts/security-help-desk/deleted',
    }).as('getSecurityHelpDesk')
    cy.intercept('GET', '**/ztgict/v1/settings/behavior-detection', {
      body: {
        thisMonthBehaviorDetectionPlan: BehaviorDetectionPlanTypes.Lite,
        nextMonthBehaviorDetectionPlan: BehaviorDetectionPlanTypes.Lite,
      },
    }).as('getSettingsBehaviorDetection')

    cy.intercept('GET', '**/ztgict/v1/service-closed-days/terminal', {
      body: { service: 'terminal', closedDays: [] },
    }).as('getServiceClosedDaysTerminal')
    cy.intercept('GET', '**/ztgict/v1/resource-summary/terminals*', { fixture: 'terminals/list' }).as('getTerminalList')
    cy.intercept('GET', '**/ztgict/v1/settings/mobile/mobile-terms-of-service', {
      fixture: 'mobile/mobile-terms-of-service-1',
    }).as('getMobileTermOfService')
    cy.intercept('GET', '**/ztgict/v1/download-terms-of-service*', {
      fixture: 'mobile/mobile-download-terms-of-service',
    }).as('getDownloadMobileMonitoringTermsOfService')
    cy.intercept('GET', '**/ztgict/v1/guarantees*', { fixture: 'guarantees/circuits/list' }).as('getGuaranteeList')
    cy.intercept('GET', '**/ztgict/v1/resource-summary/vpns', { fixture: 'vpns/list' }).as('getVpnList')
    cy.intercept('GET', '**/ztgict/v1/ipoe?*', { fixture: 'ipoes/list' }).as('getIpoeList')
    cy.intercept('GET', '**/ztgict/v1/break-out-lists?resourceStatus=active&resourceStatus=inactive', {
      fixture: 'break-out-lists/list',
    }).as('getBreakOutList')
    cy.intercept('GET', '**/ztgict/v1/break-out-lists', {
      fixture: 'break-out-lists/list',
    }).as('getBreakOutListWithoutQuery')

    cy.intercept('POST', '**/ztgict/v1/iwan-util/search-address', {
      fixture: 'guarantees/circuits/search-address',
    }).as('postIwanUtilSearchAddress')
    cy.intercept('POST', '**/ztgict/v1/upload-document', { fixture: 'upload-document' }).as('postUploadDocument')

    cy.intercept('POST', '**/ztgict/v1/terminals', { body: { orderId: this.orderId } }).as('postTerminal')
  })

  it('利用ルーター機種を変更した時の利用アクセス回線の自動選択', function () {
    cy.visit(`/tenants/${this.tenantId}/terminals/create`)
    cy.wait([
      '@getMobile',
      '@getMobileTermOfService',
      '@getDownloadMobileMonitoringTermsOfService',
      '@getGuaranteeList',
      '@getVpnList',
      '@getIpoeList',
      '@getTerminalList',
    ])

    // サービスルーターを選択
    cy.get('[data-cy="terminal-create-creation-type"]').find('.label.rentalTerminal').click()
    cy.wait(['@getBreakOutList', '@getServiceClosedDaysTerminal'])

    // RINKルーター01 では利用アクセス回線選択が空なことを確認する
    cy.get('[data-cy="edit-terminal-data-terminal-device-type"]')
      .find('.radio.checked')
      .find(`.label.${TerminalDeviceTypes.Router01}`)
      .should('have.length', 1)
    cy.get('[data-cy="edit-terminal-data-edit-circuit-types"]').find('.radio.checked').should('not.exist')

    // RINKルーター02 を選択する
    cy.get('[data-cy="edit-terminal-data-terminal-device-type"]').find(`.label.${TerminalDeviceTypes.Router02}`).click()
    // メインIPoEが自動で選択される
    cy.get('[data-cy="edit-terminal-data-edit-circuit-types"]')
      .find('[data-cy=ipoe-undefined]')
      .parent()
      .should('have.class', 'checked')

    // RINKルーター01に戻る
    cy.get('[data-cy="edit-terminal-data-terminal-device-type"]').find(`.label.${TerminalDeviceTypes.Router01}`).click()
    // メインIPoEが自動で選択されたまま
    cy.get('[data-cy="edit-terminal-data-edit-circuit-types"]')
      .find('[data-cy=ipoe-undefined]')
      .parent()
      .should('have.class', 'checked')
  })

  testCases.forEach(testCase => {
    it(`${testCase.name}の場合`, function () {
      cy.fixture(testCase.fixturePath).then(create => {
        cy.visit(`/tenants/${this.tenantId}/terminals`)
        cy.wait(['@getTerminalList'])
        cy.get('[data-cy="terminals-index-create-button"]')
          .should('have.text', t('common.createNew'))
          .click({ force: true })

        cy.wait([
          '@getMobile',
          '@getMobileTermOfService',
          '@getDownloadMobileMonitoringTermsOfService',
          '@getGuaranteeList',
          '@getVpnList',
          '@getIpoeList',
          '@getTerminalList',
        ])

        // サービスルーターを選択
        cy.get('[data-cy="terminal-create-creation-type"]').should('exist')
        cy.get('[data-cy="terminal-create-creation-type"]').find('.label.rentalTerminal').click()
        cy.wait(['@getBreakOutList', '@getServiceClosedDaysTerminal'])
        cy.get('[data-cy="terminal-create-rental"]').should('exist')

        // ルーター02を選択
        cy.get('[data-cy="edit-terminal-data-terminal-device-type"]')
          .find(`.label.${TerminalDeviceTypes.Router02}`)
          .click()

        const inputTerminal = Object.assign(create.terminal, {
          deliveryDate: nDaysLater(32),
          dhcpRelayServers: create.dhcpRelayServers,
        })

        // 「利用回線選択」の表示確認
        cy.confirmEditCircuitTypes({
          className: '[data-cy="edit-terminal-data-edit-circuit-types"]',
          isRouter02: true,
        })

        // 端末情報入力
        cy.inputTerminalWithoutMobile({
          inputData: inputTerminal,
          breakOutList: this.breakOutList,
          ipoeList: this.ipoeList,
          vpnList: this.vpnList,
        })

        cy.get('[data-cy="edit-terminal-data-mobile-information"]').should('not.exist')

        cy.get('[data-cy="terminal-create-cancel-button"]').as('cancelButton').should('have.text', t('common.cancel'))
        cy.get('[data-cy="terminal-create-submit-button"]')
          .as('submitButton')
          .should('have.text', t('common.confirm'))
          .click()
        cy.wait([
          '@getTrafficReportFlowAnalyzerTermsOfService',
          '@getSecurityTermsOfService',
          '@getSettingsBehaviorDetection',
          '@getSecurityHelpDesk',
        ])

        // トラフィックレポート（フロー分析）とセキュリティ規約の同意確認ダイアログが表示されない
        cy.get('[data-cy="terms-of-service-confirm-dialog"]').should('not.exist')

        // 参照画面でも利用ルーター機種が選択済みで表示される
        cy.get('[data-cy="edit-terminal-data-terminal-device-type"]')
          .find('.radio.checked.disabled')
          .find(`.label.${TerminalDeviceTypes.Router02}`)
          .should('have.length', 1)
        // ルーター直下セグメントの表では LANポートフィルタの列自体が表示されない
        cy.confirmEditLans({
          lans: create.terminal.lans,
          className: '[data-cy="edit-terminal-data-lans"]',
          disabled: true,
          lanType: create.terminal.lanType,
          hideLanInFilters: true,
        })

        // 前画面に戻って入力済みの内容が残っていることを確認する
        cy.get('@cancelButton').should('have.text', t('common.return')).click()
        cy.confirmTerminalWithoutMobile({
          inputData: inputTerminal,
          disabled: false,
          ipoeList: this.ipoeList,
          vpnList: this.vpnList,
        })

        cy.get('@submitButton').click()
        cy.wait([
          '@getTrafficReportFlowAnalyzerTermsOfService',
          '@getSecurityTermsOfService',
          '@getSettingsBehaviorDetection',
          '@getSecurityHelpDesk',
        ])

        // 確認チェックボックス押下前は保存ボタンが非活性になっていることを確認する
        cy.get('@submitButton').should('have.text', t('common.save')).should('be.disabled')
        // 確認チェックボックス
        cy.clickCreateConfirmCheckboxes({ terminal: create.terminal })
        // 規約同意チェックボックス
        cy.clickCreateTermsOfServiceCheckboxes({ terminal: create.terminal })

        // 作成ボタン押下
        cy.get('@submitButton').should('not.be.disabled').click()

        const request = getTerminalPostRequest({
          inputMobile: {},
          inputTerminal,
        })
        cy.wait('@postTerminal').then(req => {
          // undefined 除去のために JSON.parse する
          const stringify = JSON.stringify(request)
          expect(req.request.body).to.deep.equal(JSON.parse(stringify))
        })

        // POST terminals の成功メッセージを確認
        cy.checkTerminalSuccessDialog({
          orderId: this.orderId,
          securityHelpDeskStatus: 'deleted',
          threatDetectionPlan: inputTerminal.threatDetection.threatDetectionPlan,
          flowCollectorPlan: inputTerminal.flowCollector.flowCollectorPlan,
          behaviorDetectionPlan: inputTerminal.behaviorDetection.behaviorDetectionPlan,
        })

        // ダイアログの閉じるボタンを押す
        cy.get('.dialog-card-close').click()
        cy.get('.dialog-main').should('not.exist')
        cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/terminals`)
        cy.wait(['@getTerminalList'])
      })
    })
  })
})
