import {
  CircuitTypes,
  SecurityOptionTypes,
  TrafficReportFlowAnalyzerPlanTypes,
  BehaviorDetectionOptionTypes,
} from '@app/api/constants'
import { BehaviorDetectionPlanTypes } from '@app/api/behaviorDetection/constants'
import {
  generateRandomHex,
  t,
  getGuaranteeCustomerNote,
  getTrafficReportFlowAnalyzerPlanInputValue,
  getThreatDetectionPlanInputValue,
  getFlowCollectorPlanInputValue,
  getBehaviorDetectionPlanInputValue,
  getTrafficReportFlowAnalyzerAlertInputValue,
  stripPrefix,
} from '@cypress/support/utils'

const testCases = [
  {
    name: 'ギャランティ（インターネット利用）',
    fixturePath: 'self-terminals/create-internet.json',
    securityHelpDeskStatus: 'created',
    trafficReportFlowAnalyzerTermsOfServiceAccepted: true,
    securityTermsOfServiceAccepted: true,
    behaviorDetectionPlan: BehaviorDetectionPlanTypes.Lite,
  },
  {
    name: 'ギャランティ（VPN利用）',
    fixturePath: 'self-terminals/create-vpn.json',
    securityHelpDeskStatus: 'unused',
    trafficReportFlowAnalyzerTermsOfServiceAccepted: false,
    securityTermsOfServiceAccepted: false,
    behaviorDetectionPlan: BehaviorDetectionPlanTypes.None,
  },
]

describe('お客さま自営ルーター新規作成', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)
    this.terminalId = generateRandomHex(32)

    cy.fixture('vpns/list.json').then(data => {
      this.vpnList = data.vpns
    })
    cy.fixture('guarantees/circuits/list.json').then(data => {
      this.guaranteeList = data.guarantees
    })

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
    cy.intercept('GET', '**/ztgict/v1/self-terminals/*', { fixture: 'self-terminals/detail' }).as('getSelfTerminal')

    // POST
    cy.intercept('POST', '**/ztgict/v1/self-terminals', { body: { terminalId: this.terminalId } }).as('postTerminal')
  })

  testCases.forEach((testCase, index) => {
    it(`${testCase.name}`, function () {
      cy.fixture(testCase.fixturePath).then(create => {
        cy.intercept('GET', '**/ztgict/v1/settings/traffic-report-flow-analyzer', {
          body: { termsOfServiceAccepted: testCase.trafficReportFlowAnalyzerTermsOfServiceAccepted },
        }).as('getTrafficReportFlowAnalyzerTermsOfService')
        cy.intercept('GET', '**/ztgict/v1/settings/security', {
          body: { termsOfServiceAccepted: testCase.securityTermsOfServiceAccepted },
        }).as('getSecurityTermsOfService')
        cy.intercept('GET', '**/ztgict/v1/settings/security-help-desk', {
          fixture: `security-contracts/security-help-desk/${testCase.securityHelpDeskStatus}`,
        }).as('getSecurityHelpDesk')
        cy.intercept('GET', '**/ztgict/v1/settings/behavior-detection', {
          body: {
            thisMonthBehaviorDetectionPlan: testCase.behaviorDetectionPlan,
            nextMonthBehaviorDetectionPlan: testCase.behaviorDetectionPlan,
          },
        }).as('getBehaviorDetection')

        const useInternet = index === 0
        const useVpn = index === 1

        cy.visit(`/tenants/${this.tenantId}/terminals`)
        cy.wait(['@getTerminalList'])
        cy.get('[data-cy="terminals-index-create-button"]').should('have.text', t('common.createNew')).click()

        cy.wait([
          '@getMobile',
          '@getMobileTermOfService',
          '@getDownloadMobileMonitoringTermsOfService',
          '@getIpoeList',
          '@getGuaranteeList',
          '@getVpnList',
          '@getTerminalList',
        ])

        // 利用ルーター選択
        cy.get('[data-cy="terminal-create-creation-type"]').should('exist')
        cy.get('[data-cy="terminal-create-rental"]').should('not.exist')
        cy.get('[data-cy="terminal-create-self"]').should('not.exist')
        cy.get('[data-cy="terminal-create-creation-type"]').find('.label.selfTerminal').click()
        cy.get('[data-cy="terminal-create-rental"]').should('not.exist')
        cy.get('[data-cy="terminal-create-self"]').should('exist')

        // ルーター基本設定
        cy.get('[data-cy="self-terminal-create-customer-note"]').find('input').type(create.customerNote)
        cy.get('[data-cy="self-terminal-create-installation-postal-code"]')
          .find('input')
          .type(create.installationPostalCode)
        // 郵便番号入力による住所自動入力の確認
        cy.get('[data-cy="self-terminal-create-installation-address"]')
          .find('input')
          .should('have.value', create.installationAddress)

        // リソース設定
        const guaranteeCustomerNote = getGuaranteeCustomerNote(create.guarantee.guaranteeId, this.guaranteeList)
        cy.inputSelectForm({
          selector: '[data-cy="self-terminal-create-guarantee-guarantee-id"]',
          value: `${create.guarantee.guaranteeId} / ${guaranteeCustomerNote}`,
        })

        // インターネット, VPN どちらも利用しないにした場合に確認ボタンが非活性になっていることを確認する
        cy.get('[data-cy="self-terminal-create-guarantee-internet"]').find('.label.false').click()
        cy.get('[data-cy="self-terminal-create-guarantee-vpn"]').find('.label.false').click()
        cy.get('[data-cy="self-terminal-create-submit-button"]').should('be.disabled')

        if (useInternet) {
          // インターネットを利用する場合
          cy.get('[data-cy="self-terminal-create-guarantee-internet-ping-monitoring"]').should('not.exist')
          cy.get('[data-cy="self-terminal-create-guarantee-internet"]').find('.label.true').click()
          cy.get('[data-cy="self-terminal-create-guarantee-internet-ping-monitoring"]').find('.label.true').click()
          // VPNを利用しない
          cy.get('[data-cy="self-terminal-create-guarantee-vpn"]').find('.label.false').click()
          // VPNを利用しない場合に入力項目が非活性、非表示であることを確認
          cy.get('[data-cy="self-terminal-create-guarantee-vpn-act-connected-ipv4-prefix"]')
            .find('input')
            .should('be.disabled')
            .should('have.value', '')
          cy.get('[data-cy="self-terminal-create-guarantee-vpn-sby-connected-ipv4-prefix"]')
            .find('input')
            .should('be.disabled')
            .should('have.value', '')
          cy.get('[data-cy="self-terminal-create-vpn-route-limit"]').should('not.exist')
          cy.get('[data-cy="self-terminal-create-advertise-networks"]').should('not.exist')
        }
        if (useVpn) {
          // VPNを利用する場合
          cy.get('[data-cy="self-terminal-create-guarantee-vpn"]').find('.label.true').click()
          cy.inputSelectForm({
            selector: '[data-cy="self-terminal-create-vpn-id"]',
            value: create.vpnId,
          })
          cy.get('[data-cy="self-terminal-create-guarantee-vpn-act-connected-ipv4-prefix"]')
            .find('input')
            .type(stripPrefix(create.guarantee.vpn.act.connectedIpv4Prefix))
          cy.get('[data-cy="self-terminal-create-guarantee-vpn-sby-connected-ipv4-prefix"]')
            .find('input')
            .type(stripPrefix(create.guarantee.vpn.sby.connectedIpv4Prefix))
          cy.get('[data-cy="self-terminal-create-vpn-route-limit"]').find(`.label.${create.vpnRouteLimit}`).click()
          create.vpnAdvertiseNetworks.forEach((network: string) => {
            cy.get('[data-cy="edit-vpn-advertise-networks"]').find('.multiple-add').find('button').click()
            cy.get('[data-cy="edit-vpn-advertise-networks"]').find('input').last().type(network)
          })
        }

        // トラフィックレポート（フロー分析）の初期値チェック
        cy.get('[data-cy="edit-traffic-report-flow-analyzer-plan-select-form"]')
          .find('input')
          .should('have.value', getTrafficReportFlowAnalyzerPlanInputValue(TrafficReportFlowAnalyzerPlanTypes.FreePlan))
        cy.get('[data-cy="edit-traffic-report-flow-analyzer-alert-select-form"]')
          .find('input')
          .should('have.value', t('common.use'))

        // トラフィックレポート（フロー分析）- プラン
        cy.inputSelectForm({
          selector: '[data-cy="edit-traffic-report-flow-analyzer-plan-select-form"]',
          value: getTrafficReportFlowAnalyzerPlanInputValue(
            create.trafficReportFlowAnalyzer.trafficReportFlowAnalyzerPlan,
          ),
        })
        // トラフィックレポート（フロー分析）- 閾値超過アラート通知設定
        if (
          create.trafficReportFlowAnalyzer.trafficReportFlowAnalyzerPlan ===
          TrafficReportFlowAnalyzerPlanTypes.NoSubscription
        ) {
          // プランを利用しない場合、入力項目が非活性で「利用しない」が選択されていることを確認
          cy.get('[data-cy="edit-traffic-report-flow-analyzer-alert-select-form"]')
            .find('input')
            .should('be.disabled')
            .should('have.value', t('common.disuse'))
        } else {
          cy.inputSelectForm({
            selector: '[data-cy="edit-traffic-report-flow-analyzer-alert-select-form"]',
            value: getTrafficReportFlowAnalyzerAlertInputValue(
              create.trafficReportFlowAnalyzer.trafficReportFlowAnalyzerAlert,
            ),
          })
        }
        // 脅威検知
        cy.inputSelectForm({
          selector: '[data-cy="edit-security-options-threat-detection-plan"]',
          value: getThreatDetectionPlanInputValue(create.threatDetection.threatDetectionPlan),
        })
        // フローコレクター
        cy.inputSelectForm({
          selector: '[data-cy="edit-security-options-flow-collector-plan"]',
          value: getFlowCollectorPlanInputValue(create.flowCollector.flowCollectorPlan),
        })
        // ふるまい検知
        cy.inputSelectForm({
          selector: '[data-cy="edit-security-options-behavior-detection-plan"]',
          value: getBehaviorDetectionPlanInputValue(create.behaviorDetection.behaviorDetectionPlan),
        })

        // TODO: https://redmine.tok.access-company.com/nwvpn/issues/14474 住所検索が復活したらコメントアウトを戻す
        // // 設置場所郵便番号の住所検索の確認
        // cy.get('[data-cy="self-terminal-create-installation-postal-code"]').click()
        // cy.wait('@postIwanUtilSearchAddress')
        // cy.get('[data-cy="self-terminal-create-installation-postal-code"]')
        //   .find('input')
        //   .should('have.value', create.installationPostalCode)
        // cy.get('[data-cy="self-terminal-create-installation-address"]').find('input').should('have.value', this.address)
        // cy.get('[data-cy="self-terminal-create-submit-button"]').as('submitButton').should('not.be.disabled')

        const hasTermsOfServiceDialogContent = {
          trafficReportFlowAnalyzer:
            create.trafficReportFlowAnalyzer.trafficReportFlowAnalyzerPlan !==
              TrafficReportFlowAnalyzerPlanTypes.NoSubscription &&
            !testCase.trafficReportFlowAnalyzerTermsOfServiceAccepted,
          securityOptions:
            (create.threatDetection.threatDetectionPlan !== SecurityOptionTypes.NoSubscription ||
              create.flowCollector.flowCollectorPlan !== SecurityOptionTypes.NoSubscription ||
              create.behaviorDetection.behaviorDetectionPlan !== SecurityOptionTypes.NoSubscription) &&
            !testCase.securityTermsOfServiceAccepted,
          behaviorDetection:
            create.behaviorDetection.behaviorDetectionPlan !== BehaviorDetectionOptionTypes.NoSubscription &&
            testCase.behaviorDetectionPlan === BehaviorDetectionPlanTypes.None,
        }
        // 同意設定ボタンの表示内容確認
        cy.checkTermsLinkButtonLabel({
          primaryCircuitType: CircuitTypes.Guarantee,
          trafficReportFlowAnalyzerTermsOfServiceAccepted: testCase.trafficReportFlowAnalyzerTermsOfServiceAccepted,
          securityTermsOfServiceAccepted: testCase.securityTermsOfServiceAccepted,
        })

        // 確認ボタン押下
        cy.get('[data-cy="self-terminal-create-cancel-button"]')
          .as('cancelButton')
          .should('have.text', t('common.cancel'))
        cy.get('[data-cy="self-terminal-create-submit-button"]')
          .as('submitButton')
          .should('have.text', t('common.confirm'))
          .click()
        cy.wait(['@getTrafficReportFlowAnalyzerTermsOfService', '@getSecurityTermsOfService', '@getBehaviorDetection'])

        // 規約同意ダイアログが表示されることの確認
        cy.checkTermsOfServiceConfirmDialogContent({
          trafficReportFlowAnalyzer: hasTermsOfServiceDialogContent.trafficReportFlowAnalyzer,
          securityOptions: hasTermsOfServiceDialogContent.securityOptions,
          behaviorDetectionPlan: hasTermsOfServiceDialogContent.behaviorDetection,
        })
        if (
          hasTermsOfServiceDialogContent.trafficReportFlowAnalyzer ||
          hasTermsOfServiceDialogContent.securityOptions ||
          hasTermsOfServiceDialogContent.behaviorDetection
        ) {
          // 書き換えておく
          cy.intercept('GET', '**/ztgict/v1/settings/traffic-report-flow-analyzer', {
            body: { termsOfServiceAccepted: true },
          }).as('getTrafficReportFlowAnalyzerTermsOfService')
          cy.intercept('GET', '**/ztgict/v1/settings/security', {
            body: { termsOfServiceAccepted: true },
          }).as('getSecurityTermsOfService')
          cy.intercept('GET', '**/ztgict/v1/settings/behavior-detection', {
            body: {
              thisMonthBehaviorDetectionPlan: BehaviorDetectionPlanTypes.Lite,
              nextMonthBehaviorDetectionPlan: BehaviorDetectionPlanTypes.Lite,
            },
          }).as('getBehaviorDetection')

          // 再度確認ボタンを押す
          cy.get('@submitButton').should('have.text', t('common.confirm')).click()
          cy.wait([
            '@getTrafficReportFlowAnalyzerTermsOfService',
            '@getSecurityTermsOfService',
            '@getBehaviorDetection',
          ])
        }

        // トラフィックレポート（フロー分析）とセキュリティ規約の同意確認ダイアログが表示されない
        cy.get('[data-cy="terms-of-service-confirm-dialog"]').should('not.exist')

        // VPN ID が設定されている場合、VPN ID のチェックボックスが表示される
        if (useVpn) {
          cy.get('[data-cy="self-terminal-create-checkbox-vpn-id"] .checkbox')
            .should('not.have.class', 'checked')
            .click()
          cy.get('[data-cy="self-terminal-create-checkbox-vpn-id"]').should('have.text', t('terminals.note.vpnId'))
        } else {
          cy.get('[data-cy="self-terminal-create-checkbox-vpn-id"]').should('not.exist')
        }

        // 利用規約の確認
        cy.get('[data-cy="self-terminal-create-terms-of-service-self-terminal"]')
          .find('[data-cy="self-terminal-terms-of-service-agreement"]')
          .find('.checkbox')
          .click()

        // WANセキュリティオプションの規約同意
        const showSecurityOptions =
          create.threatDetection.threatDetectionPlan !== SecurityOptionTypes.NoSubscription ||
          create.flowCollector.flowCollectorPlan !== SecurityOptionTypes.NoSubscription ||
          create.behaviorDetection.behaviorDetectionPlan !== BehaviorDetectionOptionTypes.NoSubscription
        if (showSecurityOptions) {
          cy.get('[data-cy="self-terminal-create-terms-of-service-wan-security-options"]').should('exist')
          cy.get('[data-cy="self-terminal-create-terms-of-service-wan-security-options"]')
            .find('[data-cy="self-terminal-terms-of-service-agreement"]')
            .find('.checkbox')
            .click()
        } else {
          cy.get('[data-cy="self-terminal-create-terms-of-service-wan-security-options"]').should('not.exist')
        }

        // トラフィックレポート（フロー分析）の規約同意
        const showTrafficReportFlowAnalyzer =
          create.trafficReportFlowAnalyzer.trafficReportFlowAnalyzerPlan !==
          TrafficReportFlowAnalyzerPlanTypes.NoSubscription
        if (showTrafficReportFlowAnalyzer) {
          cy.get('[data-cy="self-terminal-create-terms-of-service-traffic-report-flow-analyzer"]').should('exist')
          cy.get('[data-cy="self-terminal-create-terms-of-service-traffic-report-flow-analyzer"]')
            .find('[data-cy="self-terminal-terms-of-service-agreement"]')
            .find('.checkbox')
            .click()
        } else {
          cy.get('[data-cy="self-terminal-create-terms-of-service-traffic-report-flow-analyzer"]').should('not.exist')
        }

        // 保存ボタン押下
        cy.get('@cancelButton').should('have.text', t('common.return'))
        cy.get('@submitButton').should('have.text', t('common.save')).click()

        cy.wait('@postTerminal').then(req => {
          expect(req.request.url).to.include('ztgict/v1/self-terminals')
          expect(req.request.body).to.deep.equal({ ...create, primaryCircuitType: CircuitTypes.Guarantee })
        })

        // POST terminals の成功メッセージを確認
        cy.checkTerminalSuccessDialog({
          terminalId: this.terminalId,
          securityHelpDeskStatus: testCase.securityHelpDeskStatus,
          threatDetectionPlan: create.threatDetection.threatDetectionPlan,
          flowCollectorPlan: create.flowCollector.flowCollectorPlan,
          behaviorDetectionPlan: create.behaviorDetection.behaviorDetectionPlan,
        })

        if (index === 0) {
          // ルーター・ワイヤレスアクセス詳細画面に遷移する
          cy.get('[data-cy="terminal-success-dialog-move-to-detail"]')
            .should('have.text', t('selfTerminals.created.button'))
            .click()
          cy.wait(['@getSelfTerminal'])
          cy.url().should(
            'eq',
            `${Cypress.config().baseUrl}/tenants/${this.tenantId}/self-terminals/${this.terminalId}`,
          )
          // 詳細画面の戻るボタンで一覧画面に遷移する
          cy.get('[data-cy="self-terminals-id-index-return-button"]').should('have.text', t('common.return')).click()
          cy.wait(['@getTerminalList'])
          cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/terminals`)
        }
        if (index === 1) {
          // ダイアログの閉じるボタンを押す
          cy.get('.dialog-card-close').click()
          cy.get('.dialog-main').should('not.exist')
          cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/terminals`)
        }
      })
    })
  })
})
