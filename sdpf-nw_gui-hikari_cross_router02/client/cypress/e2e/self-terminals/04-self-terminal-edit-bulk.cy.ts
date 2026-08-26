import {
  t,
  generateRandomHex,
  getFlowCollectorPlanInputValue,
  getThreatDetectionPlanInputValue,
  getTrafficReportFlowAnalyzerPlanInputValue,
  getTrafficReportFlowAnalyzerAlertInputValue,
  getBehaviorDetectionPlanInputValue,
} from '@cypress/support/utils'
import type { ResourceSummaryTerminalResponse } from '@app/api/terminals/types'
import {
  BehaviorDetectionOptionTypes,
  SecurityOptionTypes,
  TrafficReportFlowAnalyzerPlanTypes,
} from '@app/api/constants'

describe('自営ルーター一括変更', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)
    this.bulkOrderId = generateRandomHex(32)

    cy.fixture('self-terminals/edit-bulk.json').then(data => {
      this.terminal = data
    })
    cy.fixture('self-terminals/list-some-items.json').then(data => {
      this.terminalList = data
    })
    cy.intercept('GET', '**/ztgict/v1/resource-summary/terminals*', { fixture: 'self-terminals/list-some-items' }).as(
      'getSelfTerminalList',
    )
    cy.fixture('vpns/list.json').then(vpns => {
      this.vpnList = vpns.vpns
    })
    cy.intercept('GET', '**/ztgict/v1/break-out-lists?resourceStatus=active&resourceStatus=inactive', {
      fixture: 'break-out-lists/list',
    }).as('getBreakOutList')
    cy.intercept('GET', '**/ztgict/v1/resource-summary/vpns', { fixture: 'vpns/list' }).as('getVpnList')
    cy.intercept('GET', '**/ztgict/v1/resource-summary/orders*', {
      fixture: 'orders/list',
    }).as('getOrderList')
    cy.intercept('GET', '**/ztgict/v1/settings/security-help-desk', {
      fixture: 'security-contracts/security-help-desk/created',
    }).as('getSecurityHelpDesk')
    cy.intercept('GET', '**/ztgict/v1/settings/behavior-detection', {
      fixture: 'behavior-detection/settings',
    }).as('getBehaviorDetection')
  })

  it('一括変更', function () {
    // PUT の intercept
    this.terminal.terminalIds.forEach((terminalId: string) => {
      cy.intercept('PUT', `**/ztgict/v1/self-terminals/${terminalId}`, { statusCode: 200 }).as(
        `putSelfTerminal_${terminalId}`,
      )
    })

    // 一括変更画面に遷移
    cy.visit(`/tenants/${this.tenantId}/terminals/edit-bulk`)
    cy.wait(['@getSelfTerminalList', '@getBreakOutList', '@getVpnList'])

    // サービスルーター用の項目をチェックした際に自営ルーターを選択できなくなることを確認
    // ネクストホップネットワークを選択
    cy.get('[data-cy="terminals-edit-bulk-default-gateway-nexthop-network"]')
      .find('[data-cy="edit-bulk-input-checkbox"]')
      .click()

    // 自営ルーターを選択できないことを確認
    this.terminal.terminalIds.forEach((terminalId: string) => {
      cy.get(`[data-cy="terminals-edit-bulk-selector-${terminalId}"]`).should('have.class', 'disabled')
    })
    // サービスルーターを選択できることを確認
    const rentalTerminalId = this.terminalList.terminals.find(
      (terminal: ResourceSummaryTerminalResponse) => terminal.terminalType === 'rentalTerminal',
    ).terminalId
    cy.get(`[data-cy="terminals-edit-bulk-selector-${rentalTerminalId}"]`).should('not.be.disabled')
    // ネクストホップネットワークを選択解除
    cy.get('[data-cy="terminals-edit-bulk-default-gateway-nexthop-network"]')
      .find('[data-cy="edit-bulk-input-checkbox"]')
      .click()

    // 一括変更
    // テーブルから変更する端末を選択
    this.terminal.terminalIds.forEach((terminalId: string) => {
      cy.get(`[data-cy="terminals-edit-bulk-selector-${terminalId}"]`).click()
    })

    // 自営ルーター選択後、サービスルーター専用項目が非活性になることを確認
    // ネクストホップネットワーク
    cy.get('[data-cy="terminals-edit-bulk-default-gateway-nexthop-network"]')
      .find('[data-cy="edit-bulk-input-checkbox"]')
      .should('have.class', 'disabled')
    cy.get('[data-cy="terminals-edit-bulk-default-gateway-nexthop-network"]').find('input').should('be.disabled')
    // 特定通信ブレイクアウト
    cy.get('[data-cy="terminals-edit-bulk-break-out"]')
      .find('[data-cy="edit-bulk-input-checkbox"]')
      .should('have.class', 'disabled')
    cy.get('[data-cy="terminals-edit-bulk-break-out-input"]').find('input').should('be.disabled')
    // ブレイクアウトDNSサーバー
    cy.get('[data-cy="terminals-edit-bulk-break-out-dns-servers"]')
      .find('[data-cy="edit-bulk-input-checkbox"]')
      .should('have.class', 'disabled')
    // WAN向けスタティックルート設定
    cy.get('[data-cy="terminals-edit-bulk-wan-static-routes"]')
      .find('[data-cy="edit-bulk-input-checkbox"]')
      .should('have.class', 'disabled')
    // WANポートフィルタ（VPN→拠点）
    cy.get('[data-cy="terminals-edit-bulk-vpn-in-filters"]')
      .find('[data-cy="edit-bulk-input-checkbox"]')
      .should('have.class', 'disabled')
    cy.get('[data-cy="terminals-edit-bulk-vpn-in-filters-input"]').find('input').should('be.disabled')
    // WANポートフィルタ（拠点→VPN）
    cy.get('[data-cy="terminals-edit-bulk-vpn-out-filters"]')
      .find('[data-cy="edit-bulk-input-checkbox"]')
      .should('have.class', 'disabled')
    cy.get('[data-cy="terminals-edit-bulk-vpn-out-filters-input"]').find('input').should('be.disabled')
    // WANポートフィルタ(拠点→インターネット）
    cy.get('[data-cy="terminals-edit-bulk-inet4-out-filters"]')
      .find('[data-cy="edit-bulk-input-checkbox"]')
      .should('have.class', 'disabled')
    cy.get('[data-cy="terminals-edit-bulk-inet4-out-filters-input"]').find('input').should('be.disabled')
    // DHCPの方式
    cy.get('[data-cy="terminals-edit-bulk-dhcp-type"]')
      .find('[data-cy="edit-bulk-input-checkbox"]')
      .should('have.class', 'disabled')

    // VPN ID を選択
    cy.get('[data-cy="terminals-edit-bulk-vpn-id"]').find('[data-cy="edit-bulk-input-checkbox"]').click()
    cy.get('[data-cy="terminals-edit-bulk-vpn-id"]')
      .find('[data-cy="edit-bulk-input-checkbox"]')
      .should('have.class', 'checked')
    const vpn = this.vpnList.find((vpn: { vpnId: string }) => vpn.vpnId === this.terminal.vpnId)
    const vpnIdName = `${vpn.vpnId} / ${vpn.customerNote}`
    cy.inputSelectForm({ selector: '[data-cy="terminals-edit-bulk-vpn-id-input"]', value: vpnIdName })

    // トラフィックレポート（フロー分析）
    // プラン のチェックボックスをクリック
    cy.get('[data-cy="terminals-edit-bulk-traffic-report-flow-analyzer-plan"]')
      .find('[data-cy="edit-bulk-input-checkbox"]')
      .click()
    cy.get('[data-cy="terminals-edit-bulk-traffic-report-flow-analyzer-plan"]')
      .find('[data-cy="edit-bulk-input-checkbox"]')
      .should('have.class', 'checked')
    // 閾値超過アラート通知設定 のチェックボックスをクリック
    cy.get('[data-cy="terminals-edit-bulk-traffic-report-flow-analyzer-alert"]')
      .find('[data-cy="edit-bulk-input-checkbox"]')
      .click()
    cy.get('[data-cy="terminals-edit-bulk-traffic-report-flow-analyzer-alert"]')
      .find('[data-cy="edit-bulk-input-checkbox"]')
      .should('have.class', 'checked')

    // プラン を選択
    const trafficReportFlowAnalyzerPlanValue = getTrafficReportFlowAnalyzerPlanInputValue(
      this.terminal.trafficReportFlowAnalyzerPlan,
    )
    cy.inputSelectForm({
      selector: '[data-cy="terminals-edit-bulk-traffic-report-flow-analyzer-plan-input"]',
      value: trafficReportFlowAnalyzerPlanValue,
    })

    // 閾値超過アラート通知設定
    if (this.terminal.trafficReportFlowAnalyzerPlan === TrafficReportFlowAnalyzerPlanTypes.NoSubscription) {
      // プランを利用しない場合
      // チェックボックスはdisabledになりチェック済みになる
      cy.get('[data-cy="terminals-edit-bulk-traffic-report-flow-analyzer-alert"]')
        .find('[data-cy="edit-bulk-input-checkbox"]')
        .should('have.class', 'disabled')
        .should('have.class', 'checked')
      // 入力項目はdisabledになり「利用しない」が表示される
      cy.get('[data-cy="terminals-edit-bulk-traffic-report-flow-analyzer-alert-input"]')
        .find('input')
        .should('be.disabled')
        .should('have.value', t('common.disuse'))
    } else {
      // プランを利用する場合、デフォルトで「利用する」が選択される
      cy.get('[data-cy="terminals-edit-bulk-traffic-report-flow-analyzer-alert-input"]')
        .find('input')
        .should('not.have.class', 'disabled')
        .should('have.value', t('common.use'))
      // 閾値超過アラート通知設定を選択
      cy.inputSelectForm({
        selector: '[data-cy="terminals-edit-bulk-traffic-report-flow-analyzer-alert-input"]',
        value: getTrafficReportFlowAnalyzerAlertInputValue(this.terminal.trafficReportFlowAnalyzerAlert),
      })
    }

    // 脅威検知 のチェックボックスをクリック
    cy.get('[data-cy="terminals-edit-bulk-threat-detection-plan"]').find('[data-cy="edit-bulk-input-checkbox"]').click()
    cy.get('[data-cy="terminals-edit-bulk-threat-detection-plan"]')
      .find('[data-cy="edit-bulk-input-checkbox"]')
      .should('have.class', 'checked')
    // プラン を選択
    const threatDetectionPlanValue = getThreatDetectionPlanInputValue(this.terminal.threatDetectionPlan)
    cy.inputSelectForm({
      selector: '[data-cy="terminals-edit-bulk-threat-detection-plan-input"]',
      value: threatDetectionPlanValue,
    })

    // フローコレクター のチェックボックスをクリック
    cy.get('[data-cy="terminals-edit-bulk-flow-collector-plan"]').find('[data-cy="edit-bulk-input-checkbox"]').click()
    cy.get('[data-cy="terminals-edit-bulk-flow-collector-plan"]')
      .find('[data-cy="edit-bulk-input-checkbox"]')
      .should('have.class', 'checked')
    // プラン を選択
    const flowCollectorPlanValue = getFlowCollectorPlanInputValue(this.terminal.flowCollectorPlan)
    cy.inputSelectForm({
      selector: '[data-cy="terminals-edit-bulk-flow-collector-plan-input"]',
      value: flowCollectorPlanValue,
    })

    // ふるまい検知 のチェックボックスをクリック
    cy.get('[data-cy="terminals-edit-bulk-behavior-detection-plan"]')
      .find('[data-cy="edit-bulk-input-checkbox"]')
      .click()
    cy.get('[data-cy="terminals-edit-bulk-behavior-detection-plan"]')
      .find('[data-cy="edit-bulk-input-checkbox"]')
      .should('have.class', 'checked')
    // プラン を選択
    const behaviorDetectionPlanValue = getBehaviorDetectionPlanInputValue(this.terminal.behaviorDetectionPlan)
    cy.inputSelectForm({
      selector: '[data-cy="terminals-edit-bulk-behavior-detection-plan-input"]',
      value: behaviorDetectionPlanValue,
    })

    // 確認ボタンを押下
    cy.get('[data-cy="terminals-edit-bulk-submit-button"]')
      .as('submitButton')
      .should('have.text', t('common.confirm'))
      .click()
    cy.wait(['@getTrafficReportFlowAnalyzerTermsOfService', '@getSecurityTermsOfService', '@getSecurityHelpDesk'])
    // トラフィックレポート（フロー分析）とセキュリティ規約の同意確認ダイアログが表示されない
    cy.get('[data-cy="terms-of-service-confirm-dialog"]').should('not.exist')

    // 入力項目の確認
    // 選択した端末の数と表示されている端末の数が一致していることを確認
    cy.get('[data-cy="terminals-edit-bulk-terminal-id"]').should('have.length', this.terminal.terminalIds.length)
    // 選択した端末が表示されていることを確認
    this.terminal.terminalIds.forEach((terminalId: string) => {
      cy.get('[data-cy="terminals-edit-bulk-terminal-id"]').contains(terminalId).should('exist')
    })

    // VPN ID
    cy.get('[data-cy="terminals-edit-bulk-vpn-id"]').find('input').should('be.disabled').should('have.value', vpnIdName)

    // トラフィックレポート（フロー分析）
    cy.get('[data-cy="terminals-edit-bulk-traffic-report-flow-analyzer-plan"]')
      .find('input')
      .should('be.disabled')
      .should('have.value', trafficReportFlowAnalyzerPlanValue)

    // 脅威検知
    cy.get('[data-cy="terminals-edit-bulk-threat-detection-plan"]')
      .find('input')
      .should('be.disabled')
      .should('have.value', threatDetectionPlanValue)

    // フローコレクター
    cy.get('[data-cy="terminals-edit-bulk-flow-collector-plan"]')
      .find('input')
      .should('be.disabled')
      .should('have.value', flowCollectorPlanValue)

    // ふるまい検知
    cy.get('[data-cy="terminals-edit-bulk-behavior-detection-plan"]')
      .find('input')
      .should('be.disabled')
      .should('have.value', flowCollectorPlanValue)

    // VPN ID の規約同意
    cy.get('[data-cy="terminals-edit-bulk-terminal-terms-of-service-vpn-id"]').should('exist')
    cy.get('[data-cy="terminals-edit-bulk-terminal-terms-of-service-vpn-id"]')
      .find('[data-cy="terminal-terms-of-service-agreement"]')
      .find('.checkbox')
      .click()

    const showWanSecurityOption =
      threatDetectionPlanValue !== SecurityOptionTypes.NoSubscription ||
      flowCollectorPlanValue !== SecurityOptionTypes.NoSubscription ||
      behaviorDetectionPlanValue !== BehaviorDetectionOptionTypes.NoSubscription
    // WANセキュリティオプションの規約同意
    if (showWanSecurityOption) {
      cy.get('[data-cy="terminals-edit-bulk-terminal-terms-of-service-wan-security-options"]').should('exist')
      cy.get('[data-cy="terminals-edit-bulk-terminal-terms-of-service-wan-security-options"]')
        .find('[data-cy="terminal-terms-of-service-agreement"]')
        .find('.checkbox')
        .click()
    } else {
      cy.get('[data-cy="terminals-edit-bulk-terminal-terms-of-service-wan-security-options"]').should('not.exist')
    }

    // トラフィックレポート（フロー分析）の規約同意
    if (this.terminal.trafficReportFlowAnalyzerPlan !== TrafficReportFlowAnalyzerPlanTypes.NoSubscription) {
      cy.get('[data-cy="terminals-edit-bulk-terminal-terms-of-service-traffic-report-flow-analyzer"]').should('exist')
      cy.get('[data-cy="terminals-edit-bulk-terminal-terms-of-service-traffic-report-flow-analyzer"]')
        .find('[data-cy="terminal-terms-of-service-agreement"]')
        .find('.checkbox')
        .click()
    } else {
      cy.get('[data-cy="terminals-edit-bulk-terminal-terms-of-service-traffic-report-flow-analyzer"]').should(
        'not.exist',
      )
    }

    // 更新
    cy.get('[data-cy="terminals-edit-bulk-cancel-button"]').should('have.text', t('common.return'))
    cy.get('@submitButton').should('not.be.disabled').click()

    // PUTリクエスト（選択した端末数分）
    const stringify = JSON.stringify({
      vpnId: this.terminal.vpnId,
      trafficReportFlowAnalyzer: {
        trafficReportFlowAnalyzerPlan: this.terminal.trafficReportFlowAnalyzerPlan,
        trafficReportFlowAnalyzerAlert: this.terminal.trafficReportFlowAnalyzerAlert,
      },
      threatDetection: {
        threatDetectionPlan: this.terminal.threatDetectionPlan,
      },
      flowCollector: {
        flowCollectorPlan: this.terminal.flowCollectorPlan,
      },
      behaviorDetection: {
        behaviorDetectionPlan: this.terminal.behaviorDetectionPlan,
      },
    })

    // terminal の件数分確認する
    this.terminal.terminalIds.forEach((terminalId: string) => {
      cy.wait(`@putSelfTerminal_${terminalId}`).then(req => {
        expect(req.request.body).to.deep.equal(JSON.parse(stringify))
      })
    })

    // Bulk Put terminals の成功メッセージを確認
    cy.checkTerminalSuccessDialog({
      securityHelpDeskStatus: 'created',
      threatDetectionPlan: this.terminal.threatDetectionPlan,
      flowCollectorPlan: this.terminal.flowCollectorPlan,
      behaviorDetectionPlan: this.terminal.behaviorDetectionPlan,
    })
    // オーダー詳細画面に遷移する
    cy.get('[data-cy="terminal-success-dialog-move-to-order-detail"]')
      .should('have.text', t('common.moveToOrderList'))
      .click()
    cy.wait('@getOrderList')
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/orders`)
  })
})
