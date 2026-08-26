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

import {
  BehaviorDetectionOptionTypes,
  SecurityOptionTypes,
  TrafficReportFlowAnalyzerPlanTypes,
} from '@app/api/constants'

import { BehaviorDetectionPlanTypes } from '@app/api/behaviorDetection/constants'
import { VpnRouteLimitList } from '@app/api/selfTerminals/constants'

const dialogTestCases = [
  {
    name: 'トラフィックレポート（フロー分析）のみ表示される',
    trafficReportFlowAnalyzerPlan: TrafficReportFlowAnalyzerPlanTypes.FreePlan,
    threatDetectionPlan: SecurityOptionTypes.NoSubscription,
    flowCollectorPlan: SecurityOptionTypes.NoSubscription,
    behaviorDetectionPlan: BehaviorDetectionOptionTypes.NoSubscription,
  },
  {
    name: 'セキュリティオプションのみ表示される',
    trafficReportFlowAnalyzerPlan: TrafficReportFlowAnalyzerPlanTypes.NoSubscription,
    threatDetectionPlan: SecurityOptionTypes.Plan3Months,
    flowCollectorPlan: SecurityOptionTypes.NoSubscription,
    behaviorDetectionPlan: BehaviorDetectionOptionTypes.Subscription,
  },
]

describe('お客さま自営ルーター編集', () => {
  const detailWaitList = ['@getSelfTerminal']
  const editWaitList = ['@getTerminalList', '@getGuaranteeList', '@getVpnList', '@getSelfTerminal']

  beforeEach(function () {
    this.tenantId = generateRandomHex(32)
    this.selfTerminalId = generateRandomHex(32)
    this.orderId = generateRandomHex(32)

    cy.fixture('self-terminals/detail.json').then(data => {
      this.original = data
    })
    cy.fixture('guarantees/circuits/list.json').then(data => {
      this.guaranteeList = data.guarantees
    })

    cy.intercept('GET', '**/ztgict/v1/resource-summary/terminals*', { fixture: 'terminals/list' }).as('getTerminalList')
    cy.intercept('GET', '**/ztgict/v1/self-terminals/*', { fixture: 'self-terminals/detail' }).as('getSelfTerminal')
    cy.intercept('GET', '**/ztgict/v1/resource-summary/vpns', { fixture: 'vpns/list' }).as('getVpnList')
    cy.intercept('GET', '**/ztgict/v1/guarantees*', { fixture: 'guarantees/circuits/list' }).as('getGuaranteeList')
    cy.intercept('PUT', '**/ztgict/v1/self-terminals/*', { body: { orderId: this.orderId } }).as('putSelfTerminal')
    cy.intercept('GET', `**/ztgict/v1/orders/${this.orderId}`, { response: { statusCode: 200 } }).as('getOrder')
    cy.intercept('GET', '**/ztgict/v1/settings/traffic-report-flow-analyzer', {
      body: { termsOfServiceAccepted: true },
    }).as('getTrafficReportFlowAnalyzerTermsOfService')

    cy.intercept('GET', '**/ztgict/v1/settings/security-help-desk', {
      fixture: 'security-contracts/security-help-desk/created',
    }).as('getSecurityHelpDesk')
    cy.intercept('GET', '**/ztgict/v1/settings/behavior-detection', {
      body: {
        thisMonthBehaviorDetectionPlan: BehaviorDetectionPlanTypes.None,
        nextMonthBehaviorDetectionPlan: BehaviorDetectionPlanTypes.None,
      },
    }).as('getBehaviorDetection')
  })

  context('トラフィックレポート（フロー分析）の同意確認ダイアログ', function () {
    beforeEach(function () {
      cy.intercept('GET', '**/ztgict/v1/settings/traffic-report-flow-analyzer', {
        body: { termsOfServiceAccepted: false },
      }).as('getTrafficReportFlowAnalyzerTermsOfService')
      cy.intercept('GET', '**/ztgict/v1/settings/security', {
        body: { termsOfServiceAccepted: false },
      }).as('getSecurityTermsOfService')
    })

    dialogTestCases.forEach(
      ({ name, trafficReportFlowAnalyzerPlan, threatDetectionPlan, flowCollectorPlan, behaviorDetectionPlan }) => {
        const trafficReportFlowAnalyzer = trafficReportFlowAnalyzerPlan !== 'noSubscription'
        const securityOptions = [threatDetectionPlan, flowCollectorPlan, behaviorDetectionPlan].some(
          plan => plan !== 'noSubscription',
        )
        const behaviorDetection = behaviorDetectionPlan !== 'noSubscription'

        it(name, function () {
          // 詳細画面に遷移
          cy.visit(`/tenants/${this.tenantId}/self-terminals/${this.selfTerminalId}`)
          cy.wait(detailWaitList)

          // 編集ボタンを押下
          cy.get('[data-cy="self-terminals-id-index-edit-button"]').should('have.text', t('common.edit')).click()
          cy.wait(editWaitList)

          // トラフィックレポート（フロー分析）・セキュリティオプションの変更なし
          cy.get('[data-cy="self-terminals-id-edit-customer-note"]').find('input').clear().type('test')
          cy.get('[data-cy="self-terminals-id-edit-submit-button"]').as('submitButton').click()
          cy.wait([
            '@getTrafficReportFlowAnalyzerTermsOfService',
            '@getSecurityTermsOfService',
            '@getBehaviorDetection',
          ])
          // トラフィックレポート（フロー分析）とセキュリティ規約の同意確認ダイアログが表示される、ふるまい検知ダイアログは表示さ
          cy.checkTermsOfServiceConfirmDialogContent({
            trafficReportFlowAnalyzer: true,
            securityOptions: true,
            behaviorDetectionPlan: false,
          })

          // 値を選択
          cy.inputSelectForm({
            selector: '[data-cy="edit-traffic-report-flow-analyzer-plan-select-form"]',
            value: getTrafficReportFlowAnalyzerPlanInputValue(trafficReportFlowAnalyzerPlan),
          })
          cy.inputSelectForm({
            selector: '[data-cy="edit-security-options-threat-detection-plan"]',
            value: getThreatDetectionPlanInputValue(threatDetectionPlan),
          })
          cy.inputSelectForm({
            selector: '[data-cy="edit-security-options-flow-collector-plan"]',
            value: getFlowCollectorPlanInputValue(flowCollectorPlan),
          })
          cy.inputSelectForm({
            selector: '[data-cy="edit-security-options-behavior-detection-plan"]',
            value: getBehaviorDetectionPlanInputValue(behaviorDetectionPlan),
          })

          // 確認ボタンを押下
          cy.get('@submitButton').click()
          cy.wait([
            '@getTrafficReportFlowAnalyzerTermsOfService',
            '@getSecurityTermsOfService',
            '@getSecurityHelpDesk',
            '@getBehaviorDetection',
          ])

          // ダイアログの内容を確認
          cy.checkTermsOfServiceConfirmDialogContent({
            trafficReportFlowAnalyzer,
            securityOptions,
            behaviorDetectionPlan: behaviorDetection,
          })
        })
      },
    )
  })

  it('お客さま自営ルーター編集（インターネット利用あり）', function () {
    // 詳細画面に遷移
    cy.visit(`/tenants/${this.tenantId}/self-terminals/${this.selfTerminalId}`)
    cy.wait(detailWaitList)

    // 編集ボタンを押下
    cy.get('[data-cy="self-terminals-id-index-edit-button"]').should('have.text', t('common.edit')).click()
    cy.wait(editWaitList)

    // ルーター基本設定の表示確認
    cy.get('[data-cy="self-terminals-id-edit-customer-note"]')
      .find('input')
      .should('have.value', this.original.customerNote)
    cy.get('[data-cy="self-terminals-id-edit-installation-postal-code"]')
      .find('input')
      .should('have.value', this.original.installationPostalCode)
    cy.get('[data-cy="self-terminals-id-edit-installation-address"]')
      .find('input')
      .should('have.value', this.original.installationAddress)

    // リソース設定の表示確認
    const originalGuaranteeCustomerNote = getGuaranteeCustomerNote(
      this.original.guarantee.guaranteeId,
      this.guaranteeList,
    )
    cy.get('[data-cy="self-terminals-id-edit-guarantee-guarantee-id"]')
      .find('input')
      .should('have.value', `${this.original.guarantee.guaranteeId} / ${originalGuaranteeCustomerNote}`)
    cy.get('[data-cy="self-terminals-id-edit-guarantee-internet"]')
      .find(`.label.${this.original.guarantee.internet.advertise}`)
      .parent()
      .should('have.class', 'checked')
    cy.get('[data-cy="self-terminals-id-edit-guarantee-internet-ping-monitoring"]')
      .find(`.label.${this.original.guarantee.internet.pingMonitoring}`)
      .parent()
      .should('have.class', 'checked')
    cy.get('[data-cy="self-terminals-id-edit-guarantee-vpn-act-connected-ipv4-prefix"]')
      .find('input')
      .should('have.value', stripPrefix(this.original.guarantee.vpn.act.connectedIpv4Prefix))
    cy.get('[data-cy="self-terminals-id-edit-guarantee-vpn-sby-connected-ipv4-prefix"]')
      .find('input')
      .should('have.value', stripPrefix(this.original.guarantee.vpn.sby.connectedIpv4Prefix))
    cy.get('[data-cy="self-terminals-id-edit-vpn-id"]').find('input').should('have.value', this.original.vpnId)
    cy.get('[data-cy="self-terminals-id-edit-vpn-route-limit"]')
      .find(`.label.${this.original.vpnRouteLimit}`)
      .parent()
      .should('have.class', 'checked')
    cy.get('[data-cy="self-terminals-id-edit-as-number"]').should('have.text', this.original.asNumber)

    // インターネット, VPN どちらも利用しないにした場合に確認ボタンが非活性になっていることを確認する
    cy.get('[data-cy="self-terminals-id-edit-guarantee-internet').find('.label.false').click()
    cy.get('[data-cy="self-terminals-id-edit-guarantee-vpn').find('.label.false').click()
    cy.get('[data-cy="self-terminals-id-edit-submit-button"]').as('submitButton').should('be.disabled')

    // VPNを利用しないを選択して入力フォームが非活性・非表示になることを確認
    cy.get('[data-cy="self-terminals-id-edit-guarantee-vpn-act-connected-ipv4-prefix"]')
      .find('input')
      .should('be.disabled')
      .should('have.value', '')
    cy.get('[data-cy="self-terminals-id-edit-guarantee-vpn-sby-connected-ipv4-prefix"]')
      .find('input')
      .should('be.disabled')
      .should('have.value', '')
    cy.get('[data-cy="self-terminals-id-edit-vpn-id"]').find('input').should('be.disabled').should('have.value', '')
    // VPN網内登録経路数上限 が非表示
    cy.get('[data-cy="self-terminals-id-edit-vpn-route-limit"]').should('not.exist')
    // VPN広告経路フィルタ が非表示
    cy.get('[data-cy="edit-vpn-advertise-networks"]').should('not.exist')

    // インターネット利用ありにする
    cy.get('[data-cy="self-terminals-id-edit-guarantee-internet').find('.label.true').click()

    // 確認ボタン押下
    cy.get('@submitButton').should('have.text', t('common.confirm')).should('not.be.disabled').click()
    cy.wait([
      '@getTrafficReportFlowAnalyzerTermsOfService',
      '@getSecurityTermsOfService',
      '@getSecurityHelpDesk',
      '@getBehaviorDetection',
    ])
    // 同意確認ダイアログが表示されない
    cy.get('[data-cy="terms-of-service-confirm-dialog"]').should('not.exist')

    // 保存ボタン押下
    cy.get('@submitButton').should('have.text', t('common.save')).should('not.be.disabled').click()

    cy.wait('@putSelfTerminal').then(req => {
      expect(req.request.body).to.deep.equal({
        vpnId: null,
        vpnAdvertiseNetworks: [],
        guarantee: {
          guaranteeId: this.original.guarantee.guaranteeId,
          internet: {
            advertise: true,
            pingMonitoring: false,
          },
        },
      })
    })

    // 成功メッセージの確認
    cy.checkTerminalSuccessDialog({
      securityHelpDeskStatus: 'created',
      threatDetectionPlan: this.original.threatDetection.threatDetectionPlan,
      flowCollectorPlan: this.original.flowCollector.flowCollectorPlan,
      behaviorDetectionPlan: this.original.behaviorDetection.behaviorDetectionPlan,
      orderId: this.orderId,
    })

    // ダイアログの閉じるボタンを押す
    cy.get('.dialog-card-close').click()
    cy.get('.dialog-main').should('not.exist')
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/self-terminals/${this.selfTerminalId}`)
  })

  it('お客さま自営ルーター編集（VPN利用あり）', function () {
    cy.intercept('GET', '**/ztgict/v1/settings/security-help-desk', {
      fixture: 'security-contracts/security-help-desk/deleted',
    }).as('getSecurityHelpDesk')
    cy.intercept('GET', '**/ztgict/v1/settings/behavior-detection', {
      body: {
        thisMonthBehaviorDetectionPlan: BehaviorDetectionPlanTypes.Lite,
        nextMonthBehaviorDetectionPlan: BehaviorDetectionPlanTypes.Lite,
      },
    }).as('getBehaviorDetection')

    cy.fixture('self-terminals/edit.json').then(edit => {
      // 詳細画面に遷移
      cy.visit(`/tenants/${this.tenantId}/self-terminals/${this.selfTerminalId}`)
      cy.wait(detailWaitList)

      // 編集ボタンを押下
      cy.get('[data-cy="self-terminals-id-index-edit-button"]')
        .should('not.be.disabled')
        .should('have.text', t('common.edit'))
        .click()
      cy.wait(editWaitList)

      // ルーター基本設定の編集
      cy.get('[data-cy="self-terminals-id-edit-customer-note"]').find('input').clear().type(edit.customerNote)
      // 設置場所住所をクリア（自動入力を有効にする）
      cy.get('[data-cy="self-terminals-id-edit-installation-address"]').find('input').clear()
      cy.get('[data-cy="self-terminals-id-edit-installation-postal-code"]')
        .find('input')
        .clear()
        .type(edit.installationPostalCode)
      // 郵便番号入力による住所自動入力の確認
      cy.get('[data-cy="self-terminals-id-edit-installation-address"]')
        .find('input')
        .should('have.value', edit.installationAddress)

      // リソース設定の編集
      cy.inputSelectForm({
        selector: '[data-cy="self-terminals-id-edit-guarantee-guarantee-id"]',
        value: edit.guarantee.guaranteeId,
      })
      // インターネットを利用しない
      cy.get('[data-cy="self-terminals-id-edit-guarantee-internet-ping-monitoring"]').should('exist')
      cy.get('[data-cy="self-terminals-id-edit-guarantee-internet"]').find('.label.false').click()
      cy.get('[data-cy="self-terminals-id-edit-guarantee-internet-ping-monitoring"]').should('not.exist')

      // VPNを利用する場合の入力欄を入力
      cy.get('[data-cy="self-terminals-id-edit-guarantee-vpn-act-connected-ipv4-prefix"]')
        .find('input')
        .clear()
        .type(stripPrefix(edit.guarantee.vpn.act.connectedIpv4Prefix))
      cy.get('[data-cy="self-terminals-id-edit-guarantee-vpn-sby-connected-ipv4-prefix"]')
        .find('input')
        .clear()
        .type(stripPrefix(edit.guarantee.vpn.sby.connectedIpv4Prefix))
      cy.inputSelectForm({
        selector: '[data-cy="self-terminals-id-edit-vpn-id"]',
        value: edit.vpnId,
      })
      cy.get('[data-cy="self-terminals-id-edit-vpn-route-limit"]').find(`.label.${edit.vpnRouteLimit}`).click()

      cy.removeRow({
        className: '[data-cy="edit-vpn-advertise-networks"]',
        buttonClassName: '[data-cy="multiple-form-trash-button"]',
      })
      edit.vpnAdvertiseNetworks.forEach((network: string) => {
        cy.get('[data-cy="edit-vpn-advertise-networks"]').find('.multiple-add').find('button').click()
        cy.get('[data-cy="edit-vpn-advertise-networks"]').find('input').last().type(network)
      })

      // トラフィックレポート（フロー分析）- プラン
      cy.inputSelectForm({
        selector: '[data-cy="edit-traffic-report-flow-analyzer-plan-select-form"]',
        value: getTrafficReportFlowAnalyzerPlanInputValue(edit.trafficReportFlowAnalyzer.trafficReportFlowAnalyzerPlan),
      })
      // トラフィックレポート（フロー分析）- 閾値超過アラート通知設定
      if (
        edit.trafficReportFlowAnalyzer.trafficReportFlowAnalyzerPlan ===
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
            edit.trafficReportFlowAnalyzer.trafficReportFlowAnalyzerAlert,
          ),
        })
      }
      cy.get('[data-cy="edit-traffic-report-flow-analyzer-plan-value"]').should('not.exist')

      // 脅威検知
      cy.inputSelectForm({
        selector: '[data-cy="edit-security-options-threat-detection-plan"]',
        value: getThreatDetectionPlanInputValue(edit.threatDetection.threatDetectionPlan),
      })
      cy.get('[data-cy="edit-security-options-threat-detection-plan-value"]').should('not.exist')

      // フローコレクター
      cy.inputSelectForm({
        selector: '[data-cy="edit-security-options-flow-collector-plan"]',
        value: getFlowCollectorPlanInputValue(edit.flowCollector.flowCollectorPlan),
      })
      cy.get('[data-cy="edit-security-options-flow-collector-plan-value"]').should('not.exist')

      // ふるまい検知
      cy.inputSelectForm({
        selector: '[data-cy="edit-security-options-behavior-detection-plan"]',
        value: getBehaviorDetectionPlanInputValue(edit.behaviorDetection.behaviorDetectionPlan),
      })
      cy.get('[data-cy="edit-security-options-behavior-detection-plan-value"]').should('not.exist')

      // 確認ボタン押下
      cy.get('[data-cy="self-terminals-id-edit-submit-button"]').as('submitButton').click()
      cy.wait([
        '@getTrafficReportFlowAnalyzerTermsOfService',
        '@getSecurityTermsOfService',
        '@getSecurityHelpDesk',
        '@getBehaviorDetection',
      ])
      // 同意確認ダイアログが表示されない
      cy.get('[data-cy="terms-of-service-confirm-dialog"]').should('not.exist')

      // WANセキュリティオプションの規約同意
      const showWanSecurityOption =
        (this.original.threatDetection.threatDetectionPlan === SecurityOptionTypes.NoSubscription &&
          edit.threatDetection.threatDetectionPlan &&
          edit.threatDetection.threatDetectionPlan !== SecurityOptionTypes.NoSubscription) ||
        (this.original.flowCollector.flowCollectorPlan === SecurityOptionTypes.NoSubscription &&
          edit.flowCollector.flowCollectorPlan &&
          edit.flowCollector.flowCollectorPlan !== SecurityOptionTypes.NoSubscription) ||
        (this.original.behaviorDetection.behaviorDetectionPlan === BehaviorDetectionOptionTypes.NoSubscription &&
          edit.behaviorDetection.behaviorDetectionPlan &&
          edit.behaviorDetection.behaviorDetectionPlan !== BehaviorDetectionOptionTypes.NoSubscription)
      if (showWanSecurityOption) {
        cy.get('[data-cy="self-terminals-id-edit-terminal-terms-of-service-wan-security-options"]').should('exist')
        cy.get('[data-cy="self-terminals-id-edit-terminal-terms-of-service-wan-security-options"]')
          .find('[data-cy="self-terminal-terms-of-service-agreement"]')
          .find('.checkbox')
          .click()
      } else {
        cy.get('[data-cy="self-terminals-id-edit-terminal-terms-of-service-wan-security-options"]').should('not.exist')
      }

      // トラフィックレポート（フロー分析）の規約同意
      const showTrafficReportFlowAnalyzer =
        this.original.trafficReportFlowAnalyzer.trafficReportFlowAnalyzerPlan ===
          TrafficReportFlowAnalyzerPlanTypes.NoSubscription &&
        edit.trafficReportFlowAnalyzer.trafficReportFlowAnalyzerPlan !==
          TrafficReportFlowAnalyzerPlanTypes.NoSubscription
      if (showTrafficReportFlowAnalyzer) {
        cy.get('[data-cy="self-terminals-id-edit-terminal-terms-of-service-traffic-report-flow-analyzer"]').should(
          'exist',
        )
        cy.get('[data-cy="self-terminals-id-edit-terminal-terms-of-service-traffic-report-flow-analyzer"]')
          .find('[data-cy="self-terminal-terms-of-service-agreement"]')
          .find('.checkbox')
          .click()
      } else {
        cy.get('[data-cy="self-terminals-id-edit-terminal-terms-of-service-traffic-report-flow-analyzer"]').should(
          'not.exist',
        )
      }

      // 保存ボタン押下
      cy.get('@submitButton').should('have.text', t('common.save')).click()
      cy.wait('@putSelfTerminal').then(req => {
        expect(req.request.body).to.deep.equal(edit)
      })

      // 成功メッセージの確認
      cy.checkTerminalSuccessDialog({
        securityHelpDeskStatus: 'deleted',
        threatDetectionPlan: edit.threatDetection.threatDetectionPlan,
        flowCollectorPlan: edit.flowCollector.flowCollectorPlan,
        behaviorDetectionPlan: edit.behaviorDetection.behaviorDetectionPlan,
        orderId: this.orderId,
      })

      // 「オーダー詳細へ」ボタンを押してオーダー詳細画面に遷移することを確認する
      cy.get('[data-cy="terminal-success-dialog-move-to-order-detail"]')
        .should('have.text', t('common.moveToOrderDetail'))
        .click()
      cy.wait('@getOrder')
      cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/orders/${this.orderId}`)
      cy.get('.dialog-main').should('not.exist')

      // オーダー詳細画面の戻るボタンを押して詳細画面に戻る
      cy.get('[data-cy="orders-id-index-return-button"]').should('have.text', t('common.return')).click()
      // 詳細画面に戻る
      cy.wait(detailWaitList)
      cy.url().should(
        'eq',
        `${Cypress.config().baseUrl}/tenants/${this.tenantId}/self-terminals/${this.selfTerminalId}`,
      )
    })
  })

  it('VPN広告経路フィルタのテスト', function () {
    cy.fixture('self-terminals/detail').then(data => {
      const vpnRouteLimit = VpnRouteLimitList[1] // 100経路
      const body = {
        ...data,
        vpnRouteLimit,
        vpnAdvertiseNetworks: [...Array(vpnRouteLimit)].map((_, i) => `192.0.2.${i}/32`),
      }
      cy.intercept('GET', '**/ztgict/v1/self-terminals/*', { body }).as('getSelfTerminal')

      // 詳細画面に遷移
      cy.visit(`/tenants/${this.tenantId}/self-terminals/${this.selfTerminalId}`)
      cy.wait(detailWaitList)

      // 編集ボタンを押下
      cy.get('[data-cy="self-terminals-id-index-edit-button"]').click()
      cy.wait(editWaitList)

      // 変更なしなので、確認ボタンが非活性
      cy.get('[data-cy="self-terminals-id-edit-submit-button"]').as('submitButton').should('be.disabled')

      // VPN広告経路フィルタの入力値確認
      cy.get('[data-cy="edit-vpn-advertise-networks"]').within(() => {
        cy.get('input').should('have.length', body.vpnRouteLimit)
        // 追加ボタン押下不可
        cy.get('.multiple-add').find('button').should('be.disabled')
        // 1件削除する
        cy.get('[data-cy="multiple-form-trash-button"]').eq(0).click()
        // 追加ボタン押下可能
        cy.get('.multiple-add').find('button').should('not.be.disabled')
      })

      // 変更ありなので、確認ボタンが活性
      cy.get('@submitButton').should('not.be.disabled')

      // VPN広告経路フィルタの最後の入力欄を invalid にする
      cy.get('[data-cy="edit-vpn-advertise-networks"]').find('input').last().clear().type('invalid')

      // invalid ありなので、確認ボタンが非活性
      cy.get('@submitButton').should('be.disabled')

      // VPN網内登録経路数上限を35経路に変更する
      cy.get('[data-cy="self-terminals-id-edit-vpn-route-limit"]').find(`.label.${VpnRouteLimitList[0]}`).click()

      // VPN広告経路フィルタの入力値確認
      cy.get('[data-cy="edit-vpn-advertise-networks"]').within(() => {
        // 35件になっていることを確認
        cy.get('input').should('have.length', VpnRouteLimitList[0])
        // 追加ボタン押下不可
        cy.get('.multiple-add').find('button').should('be.disabled')
      })

      // 確認ボタン押下
      cy.get('@submitButton').click()
      // 保存ボタン押下
      cy.get('@submitButton').should('have.text', t('common.save')).click()
      cy.wait('@putSelfTerminal').then(req => {
        expect(req.request.body).to.deep.equal({
          vpnRouteLimit: VpnRouteLimitList[0],
          vpnAdvertiseNetworks: body.vpnAdvertiseNetworks.slice(1, VpnRouteLimitList[0] + 1),
        })
      })
    })
  })
})
