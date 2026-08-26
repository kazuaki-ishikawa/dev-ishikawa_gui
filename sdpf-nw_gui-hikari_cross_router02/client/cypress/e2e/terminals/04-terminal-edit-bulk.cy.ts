import { DhcpTypes } from '@app/api/terminals/constants'
import type { ResourceSummaryTerminalResponse } from '@app/api/terminals/types'
import { BehaviorDetectionPlanTypes } from '@app/api/behaviorDetection/constants'
import {
  BehaviorDetectionOptionTypes,
  SecurityOptionTypes,
  TrafficReportFlowAnalyzerPlanTypes,
} from '@app/api/constants'
import {
  generateRandomHex,
  t,
  getTrafficReportFlowAnalyzerPlanInputValue,
  getTrafficReportFlowAnalyzerAlertInputValue,
  getThreatDetectionPlanInputValue,
  getFlowCollectorPlanInputValue,
  getBehaviorDetectionPlanInputValue,
} from '@cypress/support/utils'

const termsOfServiceDialogTestCases = [
  {
    trafficReportFlowAnalyzerPlan: TrafficReportFlowAnalyzerPlanTypes.FreePlan,
    threatDetectionPlan: SecurityOptionTypes.NoSubscription,
    flowCollectorPlan: SecurityOptionTypes.NoSubscription,
    securityTermsOfServiceAccepted: true,
    behaviorDetectionPlan: BehaviorDetectionOptionTypes.NoSubscription,
  },
  {
    trafficReportFlowAnalyzerPlan: TrafficReportFlowAnalyzerPlanTypes.NoSubscription,
    threatDetectionPlan: SecurityOptionTypes.Plan3Months,
    flowCollectorPlan: SecurityOptionTypes.NoSubscription,
    securityTermsOfServiceAccepted: false,
    behaviorDetectionPlan: BehaviorDetectionOptionTypes.NoSubscription,
  },
  {
    trafficReportFlowAnalyzerPlan: TrafficReportFlowAnalyzerPlanTypes.PaidPlan[3],
    threatDetectionPlan: SecurityOptionTypes.NoSubscription,
    flowCollectorPlan: SecurityOptionTypes.Plan3Months,
    securityTermsOfServiceAccepted: true,
    behaviorDetectionPlan: BehaviorDetectionOptionTypes.Subscription,
  },
  {
    trafficReportFlowAnalyzerPlan: TrafficReportFlowAnalyzerPlanTypes.NoSubscription,
    threatDetectionPlan: SecurityOptionTypes.NoSubscription,
    flowCollectorPlan: SecurityOptionTypes.NoSubscription,
    securityTermsOfServiceAccepted: false,
    behaviorDetectionPlan: BehaviorDetectionOptionTypes.Subscription,
  },
]

const terminalSuccessDialogTestCases = [
  {
    name: 'ヘルプデスク利用中でセキュリティオプションを利用しない',
    securityHelpDeskStatus: 'created',
    threatDetectionPlan: SecurityOptionTypes.NoSubscription,
    flowCollectorPlan: SecurityOptionTypes.NoSubscription,
    behaviorDetectionPlan: BehaviorDetectionOptionTypes.NoSubscription,
  },
  {
    name: 'ヘルプデスク利用中でセキュリティオプションを利用する',
    securityHelpDeskStatus: 'deleting',
    threatDetectionPlan: SecurityOptionTypes.Plan3Months,
    flowCollectorPlan: SecurityOptionTypes.NoSubscription,
    behaviorDetectionPlan: BehaviorDetectionOptionTypes.NoSubscription,
  },
  {
    name: 'ヘルプデスク利用なしでセキュリティオプションを利用する',
    securityHelpDeskStatus: 'unused',
    threatDetectionPlan: SecurityOptionTypes.Plan12Months,
    flowCollectorPlan: SecurityOptionTypes.Plan3Months,
    behaviorDetectionPlan: BehaviorDetectionOptionTypes.Subscription,
  },
  {
    name: 'ヘルプデスク申請中でセキュリティオプションを利用しない',
    securityHelpDeskStatus: 'creating',
    threatDetectionPlan: SecurityOptionTypes.NoSubscription,
    flowCollectorPlan: SecurityOptionTypes.NoSubscription,
    behaviorDetectionPlan: BehaviorDetectionOptionTypes.Subscription,
  },
]

describe('ルーター一括変更画面', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)
    this.bulkOrderId = generateRandomHex(32)

    cy.fixture('terminals/edit-bulk.json').then(data => {
      this.terminal = data
      this.dhcpType = data.dhcpServer ? DhcpTypes.Server : data.dhcpRelayServers ? DhcpTypes.Relay : DhcpTypes.None
    })
    cy.fixture('terminals/list-some-items.json').then(data => {
      this.terminalList = data.terminals
    })
    cy.fixture('vpns/list.json').then(vpns => {
      this.vpnList = vpns.vpns
    })
    cy.intercept('GET', '**/ztgict/v1/resource-summary/terminals*', { fixture: 'terminals/list-some-items' }).as(
      'getTerminalList',
    )
    cy.intercept('GET', '**/ztgict/v1/break-out-lists?resourceStatus=active&resourceStatus=inactive', {
      fixture: 'break-out-lists/list',
    }).as('getBreakOutList')
    cy.intercept('GET', '**/ztgict/v1/resource-summary/vpns', { fixture: 'vpns/list' }).as('getVpnList')
    cy.intercept('GET', '**/ztgict/v1/settings/mobile', {
      fixture: 'mobile/accepted-mobile',
    }).as('getMobile')
    cy.intercept('PUT', '**/ztgict/v1/terminals-bulk', { body: { bulkOrderId: this.bulkOrderId } }).as(
      'bulkPutTerminal',
    )
    cy.intercept('GET', '**/ztgict/v1/resource-summary/orders', {
      fixture: 'orders/list',
    }).as('getOrderList')
    cy.intercept('GET', '**/ztgict/v1/settings/traffic-report-flow-analyzer', {
      body: { termsOfServiceAccepted: true },
    }).as('getTrafficReportFlowAnalyzerTermsOfService')
    cy.intercept('GET', '**/ztgict/v1/settings/security-help-desk', {
      fixture: 'security-contracts/security-help-desk/created',
    }).as('getSecurityHelpDesk')
    cy.intercept('GET', '**/ztgict/v1/settings/behavior-detection', {
      body: {
        thisMonthBehaviorDetectionPlan: BehaviorDetectionPlanTypes.Lite,
        nextMonthBehaviorDetectionPlan: BehaviorDetectionPlanTypes.Lite,
      },
    }).as('getBehaviorDetection')
  })

  it('トラフィックレポート（フロー分析）とセキュリティ規約の同意確認ダイアログの表示', function () {
    const currentBehaviorDetectionPlan = BehaviorDetectionPlanTypes.None
    cy.intercept('GET', '**/ztgict/v1/settings/traffic-report-flow-analyzer', {
      body: { termsOfServiceAccepted: false },
    }).as('getTrafficReportFlowAnalyzerTermsOfService')
    cy.intercept('GET', '**/ztgict/v1/settings/security', {
      body: { termsOfServiceAccepted: false },
    }).as('getSecurityTermsOfService')
    cy.intercept('GET', '**/ztgict/v1/settings/behavior-detection', {
      body: {
        thisMonthBehaviorDetectionPlan: currentBehaviorDetectionPlan,
        nextMonthBehaviorDetectionPlan: currentBehaviorDetectionPlan,
      },
    }).as('getBehaviorDetection')

    cy.visit(`/tenants/${this.tenantId}/terminals`)
    cy.wait([
      '@getSession',
      '@getTrafficReportFlowAnalyzerTermsOfService',
      '@getSecurityTermsOfService',
      '@getMobile',
      '@getTerminalList',
      '@getBehaviorDetection',
    ])

    cy.get('[data-cy="terminals-index-edit-bulk-button"]').should('have.text', t('terminals.editBulk')).click()
    cy.wait(['@getTerminalList', '@getBreakOutList', '@getVpnList'])

    // テーブルから変更する端末を選択
    cy.get('[data-cy="terminals-edit-bulk-selector-Z123456789"]').click()
    // トラフィックレポート（フロー分析） のチェックボックスをクリック
    cy.get('[data-cy="terminals-edit-bulk-traffic-report-flow-analyzer-plan"]')
      .find('[data-cy="edit-bulk-input-checkbox"]')
      .click()
    cy.get('[data-cy="terminals-edit-bulk-traffic-report-flow-analyzer-plan"]')
      .find('[data-cy="edit-bulk-input-checkbox"]')
      .should('have.class', 'checked')
    // 脅威検知とフローコレクターのチェックボックスをクリック
    cy.get('[data-cy="terminals-edit-bulk-threat-detection-plan"]').find('[data-cy="edit-bulk-input-checkbox"]').click()
    cy.get('[data-cy="terminals-edit-bulk-threat-detection-plan"]')
      .find('[data-cy="edit-bulk-input-checkbox"]')
      .should('have.class', 'checked')
    cy.get('[data-cy="terminals-edit-bulk-flow-collector-plan"]').find('[data-cy="edit-bulk-input-checkbox"]').click()
    cy.get('[data-cy="terminals-edit-bulk-flow-collector-plan"]')
      .find('[data-cy="edit-bulk-input-checkbox"]')
      .should('have.class', 'checked')
    // ふるまい検知のチェックボックスをクリック
    cy.get('[data-cy="terminals-edit-bulk-behavior-detection-plan"]')
      .find('[data-cy="edit-bulk-input-checkbox"]')
      .click()
    cy.get('[data-cy="terminals-edit-bulk-behavior-detection-plan"]')
      .find('[data-cy="edit-bulk-input-checkbox"]')
      .should('have.class', 'checked')

    // 確認ボタン
    cy.get('[data-cy="terminals-edit-bulk-submit-button"]').as('submitButton')

    termsOfServiceDialogTestCases.forEach(
      ({
        trafficReportFlowAnalyzerPlan,
        threatDetectionPlan,
        flowCollectorPlan,
        behaviorDetectionPlan,
        securityTermsOfServiceAccepted,
      }) => {
        const trafficReportFlowAnalyzer = trafficReportFlowAnalyzerPlan !== 'noSubscription'
        const inputBehaviorDetectionPlan = getBehaviorDetectionPlanInputValue(behaviorDetectionPlan)
        const isBehaviorDetectionSubscribed = inputBehaviorDetectionPlan === t('common.use')
        const securityOptions =
          (threatDetectionPlan !== 'noSubscription' ||
            flowCollectorPlan !== 'noSubscription' ||
            isBehaviorDetectionSubscribed) &&
          !securityTermsOfServiceAccepted
        const behaviorDetection =
          isBehaviorDetectionSubscribed && currentBehaviorDetectionPlan === BehaviorDetectionPlanTypes.None

        // 値を選択
        cy.inputSelectForm({
          selector: '[data-cy="terminals-edit-bulk-traffic-report-flow-analyzer-plan"]',
          value: getTrafficReportFlowAnalyzerPlanInputValue(trafficReportFlowAnalyzerPlan),
        })
        cy.inputSelectForm({
          selector: '[data-cy="terminals-edit-bulk-threat-detection-plan"]',
          value: getThreatDetectionPlanInputValue(threatDetectionPlan),
        })
        cy.inputSelectForm({
          selector: '[data-cy="terminals-edit-bulk-flow-collector-plan"]',
          value: getFlowCollectorPlanInputValue(flowCollectorPlan),
        })
        cy.inputSelectForm({
          selector: '[data-cy="terminals-edit-bulk-behavior-detection-plan"]',
          value: getBehaviorDetectionPlanInputValue(behaviorDetectionPlan),
        })

        // 確認ボタンを押下
        cy.get('@submitButton').click()
        cy.wait(['@getTrafficReportFlowAnalyzerTermsOfService', '@getSecurityTermsOfService', '@getBehaviorDetection'])

        // ダイアログの内容を確認
        cy.checkTermsOfServiceConfirmDialogContent({
          trafficReportFlowAnalyzer,
          securityOptions,
          behaviorDetectionPlan: behaviorDetection,
        })
      },
    )

    cy.get('@submitButton').should('have.text', t('common.confirm'))
  })

  it('ギャランティ以外のルーター選択時にトラフィックレポート（フロー分析）が非活性になる', function () {
    cy.visit(`/tenants/${this.tenantId}/terminals/edit-bulk`)
    cy.wait(['@getTerminalList', '@getBreakOutList', '@getVpnList'])

    // ギャランティ以外のルーターを取得
    const terminalId = this.terminalList.find(
      (terminal: ResourceSummaryTerminalResponse) => terminal.primaryCircuit.circuitType !== 'guarantee',
    ).terminalId
    // ルーターを選択
    cy.get(`[data-cy="terminals-edit-bulk-selector-${terminalId}"]`).click()
    // トラフィックレポート（フロー分析）- プランが非活性になることを確認
    cy.get('[data-cy="terminals-edit-bulk-traffic-report-flow-analyzer-plan"]')
      .find('[data-cy="edit-bulk-input-checkbox"]')
      .should('have.class', 'disabled')
    // トラフィックレポート（フロー分析）- 閾値超過アラート通知設定が非活性になることを確認
    cy.get('[data-cy="terminals-edit-bulk-traffic-report-flow-analyzer-alert"]')
      .find('[data-cy="edit-bulk-input-checkbox"]')
      .should('have.class', 'disabled')
  })

  it('トラフィックレポート（フロー分析）- プラン選択時にギャランティ以外のルーターが非活性になる', function () {
    cy.visit(`/tenants/${this.tenantId}/terminals/edit-bulk`)
    cy.wait(['@getTerminalList', '@getBreakOutList', '@getVpnList'])

    // ギャランティ以外のルーターを取得
    const terminalId = this.terminalList.find(
      (terminal: ResourceSummaryTerminalResponse) => terminal.primaryCircuit.circuitType !== 'guarantee',
    ).terminalId
    // トラフィックレポート（フロー分析）のチェックボックスをクリック
    cy.get('[data-cy="terminals-edit-bulk-traffic-report-flow-analyzer-plan"]')
      .find('[data-cy="edit-bulk-input-checkbox"]')
      .click()

    // ギャランティ以外のルーターが非活性になることを確認
    cy.get(`[data-cy="terminals-edit-bulk-selector-${terminalId}"]`).should('have.class', 'disabled')
  })

  it('トラフィックレポート（フロー分析）- 閾値超過アラート通知設定を選択時にギャランティ以外のルーターが非活性になる', function () {
    cy.visit(`/tenants/${this.tenantId}/terminals/edit-bulk`)
    cy.wait(['@getTerminalList', '@getBreakOutList', '@getVpnList'])

    // ギャランティ以外のルーターを取得
    const terminalId = this.terminalList.find(
      (terminal: ResourceSummaryTerminalResponse) => terminal.primaryCircuit.circuitType !== 'guarantee',
    ).terminalId
    // トラフィックレポート（フロー分析）のチェックボックスをクリック
    cy.get('[data-cy="terminals-edit-bulk-traffic-report-flow-analyzer-alert"]')
      .find('[data-cy="edit-bulk-input-checkbox"]')
      .click()

    // ギャランティ以外のルーターが非活性になることを確認
    cy.get(`[data-cy="terminals-edit-bulk-selector-${terminalId}"]`).should('have.class', 'disabled')
  })

  context('成功時のダイアログ', () => {
    terminalSuccessDialogTestCases.forEach(
      ({ name, securityHelpDeskStatus, threatDetectionPlan, flowCollectorPlan, behaviorDetectionPlan }) => {
        it(name, function () {
          cy.intercept('GET', '**/ztgict/v1/settings/security-help-desk', {
            fixture: `security-contracts/security-help-desk/${securityHelpDeskStatus}`,
          }).as('getSecurityHelpDesk')
          cy.intercept('GET', '**/ztgict/v1/settings/behavior-detection', {
            body: {
              thisMonthBehaviorDetectionPlan: BehaviorDetectionPlanTypes.Lite,
              nextMonthBehaviorDetectionPlan: BehaviorDetectionPlanTypes.Lite,
            },
          }).as('getBehaviorDetection')

          cy.visit(`/tenants/${this.tenantId}/terminals/edit-bulk`)
          cy.wait(['@getTerminalList', '@getBreakOutList', '@getVpnList'])

          // ルーターを選択
          this.terminal.terminalIds.forEach((terminalId: string) => {
            cy.get(`[data-cy="terminals-edit-bulk-selector-${terminalId}"]`).click()
          })

          // 脅威検知を入力
          cy.get('[data-cy="terminals-edit-bulk-threat-detection-plan"]')
            .find('[data-cy="edit-bulk-input-checkbox"]')
            .click()
          cy.inputSelectForm({
            selector: '[data-cy="terminals-edit-bulk-threat-detection-plan-input"]',
            value: getThreatDetectionPlanInputValue(threatDetectionPlan),
          })
          // フローコレクターを入力
          cy.get('[data-cy="terminals-edit-bulk-flow-collector-plan"]')
            .find('[data-cy="edit-bulk-input-checkbox"]')
            .click()
          cy.inputSelectForm({
            selector: '[data-cy="terminals-edit-bulk-flow-collector-plan-input"]',
            value: getFlowCollectorPlanInputValue(flowCollectorPlan),
          })
          // ふるまい検知を入力
          cy.get('[data-cy="terminals-edit-bulk-behavior-detection-plan"]')
            .find('[data-cy="edit-bulk-input-checkbox"]')
            .click()
          cy.inputSelectForm({
            selector: '[data-cy="terminals-edit-bulk-behavior-detection-plan-input"]',
            value: getBehaviorDetectionPlanInputValue(behaviorDetectionPlan),
          })

          // 確認ボタンを押下
          cy.get('[data-cy="terminals-edit-bulk-submit-button"]').click()
          cy.wait(['@getSecurityHelpDesk'])

          const showWanSecurityOption =
            threatDetectionPlan !== SecurityOptionTypes.NoSubscription ||
            flowCollectorPlan !== SecurityOptionTypes.NoSubscription ||
            behaviorDetectionPlan !== BehaviorDetectionOptionTypes.NoSubscription

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

          cy.get('[data-cy="terminals-edit-bulk-submit-button"]').click()

          // ダイアログの内容を確認
          cy.checkTerminalSuccessDialog({
            securityHelpDeskStatus,
            threatDetectionPlan,
            flowCollectorPlan,
            behaviorDetectionPlan,
          })
        })
      },
    )
  })
  it('ルーター一括変更', function () {
    cy.visit(`/tenants/${this.tenantId}/terminals`)
    cy.wait(['@getSession', '@getTrafficReportFlowAnalyzerTermsOfService', '@getMobile', '@getTerminalList'])

    cy.get('[data-cy="terminals-index-edit-bulk-button"]').should('have.text', t('terminals.editBulk')).click()
    cy.wait(['@getTerminalList', '@getBreakOutList', '@getVpnList'])

    // テーブルから変更する端末を選択
    this.terminal.terminalIds.forEach((terminalId: string) => {
      cy.get(`[data-cy="terminals-edit-bulk-selector-${terminalId}"]`).click()
    })

    // VPN ID を選択
    cy.get('[data-cy="terminals-edit-bulk-vpn-id"]').find('[data-cy="edit-bulk-input-checkbox"]').click()
    cy.get('[data-cy="terminals-edit-bulk-vpn-id"]')
      .find('[data-cy="edit-bulk-input-checkbox"]')
      .should('have.class', 'checked')
    const vpn = this.vpnList.find((vpn: { vpnId: string }) => vpn.vpnId === this.terminal.vpnId)
    const vpnIdName = `${vpn.vpnId} / ${vpn.customerNote}`
    cy.inputSelectForm({ selector: '[data-cy="terminals-edit-bulk-vpn-id-input"]', value: vpnIdName })
    // ネクストホップネットワーク を選択
    cy.get('[data-cy="terminals-edit-bulk-default-gateway-nexthop-network"]')
      .find('[data-cy="edit-bulk-input-checkbox"]')
      .click()
    cy.get('[data-cy="terminals-edit-bulk-default-gateway-nexthop-network"]')
      .find('[data-cy="edit-bulk-input-checkbox"]')
      .should('have.class', 'checked')
    cy.inputSelectForm({
      selector: '[data-cy="terminals-edit-bulk-default-gateway-nexthop-network-input"]',
      value: this.terminal.defaultGateway.nexthopNetwork,
    })

    // 特定通信ブレイクアウト を選択
    cy.get('[data-cy="terminals-edit-bulk-break-out"]').find('[data-cy="edit-bulk-input-checkbox"]').click()
    cy.get('[data-cy="terminals-edit-bulk-break-out"]')
      .find('[data-cy="edit-bulk-input-checkbox"]')
      .should('have.class', 'checked')
    // 特定通信ブレイクアウトの入力
    cy.get('[data-cy="terminals-edit-bulk-break-out-input"]').find('input').click()
    this.terminal.breakOut.forEach((breakOut: string) => {
      const value = t(`terminals.${breakOut}`)
      cy.get('[data-cy="terminals-edit-bulk-break-out-input"]')
        .find('li')
        .contains(new RegExp(`^${value}$`))
        .click()
    })
    // select form 以外の場所をクリックしてフォーカスを外す
    cy.get('body').click(0, 0)

    // ブレイクアウトDNSサーバー を入力
    cy.get('[data-cy="terminals-edit-bulk-break-out-dns-servers"]').find('[data-cy="edit-bulk-input-checkbox"]').click()
    cy.get('[data-cy="terminals-edit-bulk-break-out-dns-servers"]')
      .find('[data-cy="edit-bulk-input-checkbox"]')
      .should('have.class', 'checked')
    this.terminal.interceptDnsServers.forEach((value: string) => {
      cy.get('[data-cy="terminals-edit-bulk-break-out-dns-servers"]').find('.multiple-add').find('button').click()
      cy.get('[data-cy="terminals-edit-bulk-break-out-dns-servers"]').find('input').last().type(value)
    })

    // WAN向けスタティックルート設定 を入力
    cy.get('[data-cy="terminals-edit-bulk-wan-static-routes"]').find('[data-cy="edit-bulk-input-checkbox"]').click()
    cy.get('[data-cy="terminals-edit-bulk-wan-static-routes"]')
      .find('[data-cy="edit-bulk-input-checkbox"]')
      .should('have.class', 'checked')
    cy.inputEditWanStaticRoutes({
      wanStaticRoutes: this.terminal.wanStaticRoutes,
      className: '[data-cy="terminals-edit-bulk-wan-static-routes-input"]',
    })

    // WANポートフィルタ（VPN → 拠点） を入力
    cy.get('[data-cy="terminals-edit-bulk-vpn-in-filters"]').find('[data-cy="edit-bulk-input-checkbox"]').click()
    cy.get('[data-cy="terminals-edit-bulk-vpn-in-filters"]')
      .find('[data-cy="edit-bulk-input-checkbox"]')
      .should('have.class', 'checked')
    cy.inputEditFilters({
      inputData: this.terminal.vpnInFilters,
      className: '[data-cy="terminals-edit-bulk-vpn-in-filters-input"]',
      destinationIpv4PrefixStaticValue: '0.0.0.0/0',
    })

    // WANポートフィルタ（拠点 → VPN） を入力
    cy.get('[data-cy="terminals-edit-bulk-vpn-out-filters"]').find('[data-cy="edit-bulk-input-checkbox"]').click()
    cy.get('[data-cy="terminals-edit-bulk-vpn-out-filters"]')
      .find('[data-cy="edit-bulk-input-checkbox"]')
      .should('have.class', 'checked')
    cy.inputEditFilters({
      inputData: this.terminal.vpnOutFilters,
      className: '[data-cy="terminals-edit-bulk-vpn-out-filters-input"]',
      sourceIpv4PrefixStaticValue: '0.0.0.0/0',
    })

    // WANポートフィルタ（拠点 → Internet） を入力
    cy.get('[data-cy="terminals-edit-bulk-inet4-out-filters"]').find('[data-cy="edit-bulk-input-checkbox"]').click()
    cy.get('[data-cy="terminals-edit-bulk-inet4-out-filters"]')
      .find('[data-cy="edit-bulk-input-checkbox"]')
      .should('have.class', 'checked')
    cy.inputEditFilters({
      inputData: this.terminal.inet4OutFilters,
      className: '[data-cy="terminals-edit-bulk-inet4-out-filters-input"]',
      sourceIpv4PrefixStaticValue: '0.0.0.0/0',
    })

    // DHCPの方式 のチェックボックスをクリック
    cy.get('[data-cy="terminals-edit-bulk-dhcp-type"]').find('[data-cy="edit-bulk-input-checkbox"]').click()
    cy.get('[data-cy="terminals-edit-bulk-dhcp-type"]')
      .find('[data-cy="edit-bulk-input-checkbox"]')
      .should('have.class', 'checked')

    // DHCPの方式 で DHCPサーバー を選択
    cy.get('[data-cy="terminals-edit-bulk-dhcp-type-input"]').find(`.label.${this.dhcpType}`).click()
    cy.get('[data-cy="terminals-edit-bulk-dhcp-server-domain"]')
      .find('input')
      .clear()
      .type(this.terminal.dhcpServer.domain)
    cy.get('[data-cy="terminals-edit-bulk-dhcp-server-primary-dns-server"]')
      .find('input')
      .clear()
      .type(this.terminal.dhcpServer.primaryDnsServer)
    cy.get('[data-cy="terminals-edit-bulk-dhcp-server-secondary-dns-server"]')
      .find('input')
      .clear()
      .type(this.terminal.dhcpServer.secondaryDnsServer)
    cy.get('[data-cy="terminals-edit-bulk-dhcp-server-primary-wins-server"]')
      .find('input')
      .clear()
      .type(this.terminal.dhcpServer.primaryWinsServer)
    cy.get('[data-cy="terminals-edit-bulk-dhcp-server-secondary-wins-server"]')
      .find('input')
      .clear()
      .type(this.terminal.dhcpServer.secondaryWinsServer)

    // トラフィックレポート（フロー分析）
    // プランのチェックボックスをクリック
    cy.get('[data-cy="terminals-edit-bulk-traffic-report-flow-analyzer-plan"]')
      .find('[data-cy="edit-bulk-input-checkbox"]')
      .click()
    cy.get('[data-cy="terminals-edit-bulk-traffic-report-flow-analyzer-plan"]')
      .find('[data-cy="edit-bulk-input-checkbox"]')
      .should('have.class', 'checked')
    // 閾値超過アラート通知設定のチェックボックスをクリック
    cy.get('[data-cy="terminals-edit-bulk-traffic-report-flow-analyzer-alert"]')
      .find('[data-cy="edit-bulk-input-checkbox"]')
      .click()
    cy.get('[data-cy="terminals-edit-bulk-traffic-report-flow-analyzer-alert"]')
      .find('[data-cy="edit-bulk-input-checkbox"]')
      .should('have.class', 'checked')

    // プラン を選択
    const trafficReportFlowAnalyzerPlanValue = getTrafficReportFlowAnalyzerPlanInputValue(
      this.terminal.trafficReportFlowAnalyzer.trafficReportFlowAnalyzerPlan,
    )
    cy.inputSelectForm({
      selector: '[data-cy="terminals-edit-bulk-traffic-report-flow-analyzer-plan-input"]',
      value: trafficReportFlowAnalyzerPlanValue,
    })

    // 閾値超過アラート通知設定
    if (
      this.terminal.trafficReportFlowAnalyzer.trafficReportFlowAnalyzerPlan ===
      TrafficReportFlowAnalyzerPlanTypes.NoSubscription
    ) {
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
        value: getTrafficReportFlowAnalyzerAlertInputValue(
          this.terminal.trafficReportFlowAnalyzer.trafficReportFlowAnalyzerAlert,
        ),
      })
    }

    // 脅威検知 のチェックボックスをクリック
    cy.get('[data-cy="terminals-edit-bulk-threat-detection-plan"]').find('[data-cy="edit-bulk-input-checkbox"]').click()
    cy.get('[data-cy="terminals-edit-bulk-threat-detection-plan"]')
      .find('[data-cy="edit-bulk-input-checkbox"]')
      .should('have.class', 'checked')
    // プラン を選択
    const threatDetectionPlanValue = getThreatDetectionPlanInputValue(this.terminal.threatDetection.threatDetectionPlan)
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
    const flowCollectorPlanValue = getFlowCollectorPlanInputValue(this.terminal.flowCollector.flowCollectorPlan)
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
    const behaviorDetectionPlanValue = getBehaviorDetectionPlanInputValue(
      this.terminal.behaviorDetection.behaviorDetectionPlan,
    )
    cy.inputSelectForm({
      selector: '[data-cy="terminals-edit-bulk-behavior-detection-plan-input"]',
      value: behaviorDetectionPlanValue,
    })

    // 確認ボタンを押下
    cy.get('[data-cy="terminals-edit-bulk-submit-button"]')
      .as('submitButton')
      .should('have.text', t('common.confirm'))
      .click()
    cy.wait([
      '@getTrafficReportFlowAnalyzerTermsOfService',
      '@getSecurityHelpDesk',
      '@getSecurityTermsOfService',
      '@getBehaviorDetection',
    ])
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

    // ネクストホップネットワーク
    if (this.terminal.defaultGateway.nexthopNetwork === 'Internet') {
      cy.get('[data-cy="terminals-edit-bulk-default-gateway-nexthop-network"]')
        .find('input')
        .should('be.disabled')
        .should('have.value', 'Internet')
    } else if (this.terminal.defaultGateway.nexthopNetwork === 'vpn') {
      cy.get('[data-cy="terminals-edit-bulk-default-gateway-nexthop-network"]')
        .find('input')
        .should('be.disabled')
        .should('have.value', 'VPN')
    }

    // 特定通信ブレイクアウト
    this.terminal.breakOut.forEach((breakOut: string) => {
      const value = t(`terminals.${breakOut}`)
      cy.get('[data-cy="terminals-edit-bulk-break-out"]')
        .contains(new RegExp(`^${value}$`))
        .should('exist')
    })

    // ブレイクアウトDNSサーバー
    cy.get('[data-cy="terminals-edit-bulk-break-out-dns-servers"]').find('.multiple-add').should('not.exist')
    this.terminal.interceptDnsServers.forEach((value: string, index: number) => {
      cy.get('[data-cy="terminals-edit-bulk-break-out-dns-servers"]')
        .find('input')
        .eq(index)
        .should('be.disabled')
        .should('have.value', value)
    })

    // WAN向けスタティックルート設定
    cy.confirmEditWanStaticRoutes({
      wanStaticRoutes: this.terminal.wanStaticRoutes,
      className: '[data-cy="terminals-edit-bulk-wan-static-routes-input"]',
      disabled: true,
    })
    // WANポートフィルタ(VPN → 拠点）
    cy.confirmEditFilters({
      disabled: true,
      inputData: this.terminal.vpnId ? this.terminal.vpnInFilters : null,
      className: '[data-cy="terminals-edit-bulk-vpn-in-filters-input"]',
      destinationIpv4PrefixStaticValue: '0.0.0.0/0',
    })
    // WANポートフィルタ（拠点 → VPN）
    cy.confirmEditFilters({
      disabled: true,
      inputData: this.terminal.vpnId ? this.terminal.vpnOutFilters : null,
      className: '[data-cy="terminals-edit-bulk-vpn-out-filters-input"]',
      sourceIpv4PrefixStaticValue: '0.0.0.0/0',
    })
    // WANポートフィルタ（拠点 → Internet）
    cy.confirmEditFilters({
      disabled: true,
      inputData: this.terminal.inet4OutFilters,
      className: '[data-cy="terminals-edit-bulk-inet4-out-filters-input"]',
      sourceIpv4PrefixStaticValue: '0.0.0.0/0',
    })

    // DHCPの方式
    cy.get('[data-cy="terminals-edit-bulk-dhcp-type-input"]')
      .find('.radio.checked.disabled')
      .find(`.label.${this.dhcpType}`)
      .should('have.length', 1)
    // DHCPサーバー
    cy.get('[data-cy="terminals-edit-bulk-dhcp-server-domain"]')
      .find('input')
      .should('be.disabled')
      .should('have.value', this.terminal.dhcpServer.domain)
    cy.get('[data-cy="terminals-edit-bulk-dhcp-server-primary-dns-server"]')
      .find('input')
      .should('be.disabled')
      .should('have.value', this.terminal.dhcpServer.primaryDnsServer)
    cy.get('[data-cy="terminals-edit-bulk-dhcp-server-secondary-dns-server"]')
      .find('input')
      .should('be.disabled')
      .should('have.value', this.terminal.dhcpServer.secondaryDnsServer)
    cy.get('[data-cy="terminals-edit-bulk-dhcp-server-primary-wins-server"]')
      .find('input')
      .should('be.disabled')
      .should('have.value', this.terminal.dhcpServer.primaryWinsServer)
    cy.get('[data-cy="terminals-edit-bulk-dhcp-server-secondary-wins-server"]')
      .find('input')
      .should('be.disabled')
      .should('have.value', this.terminal.dhcpServer.secondaryWinsServer)
    cy.get('[data-cy="terminals-edit-bulk-dhcp-relay-servers"]').should('not.exist')

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
      .should('have.value', behaviorDetectionPlanValue)

    // 確認チェックボックス押下前は保存ボタンが非活性になっていることを確認する
    cy.get('@submitButton').should('have.text', t('common.save')).should('be.disabled')

    // ブレイクアウトの規約同意
    cy.get('[data-cy="terminals-edit-bulk-terminal-terms-of-service-break-out"]').should('exist')
    cy.get('[data-cy="terminals-edit-bulk-terminal-terms-of-service-break-out"]')
      .find('[data-cy="terminal-terms-of-service-agreement"]')
      .find('.checkbox')
      .click()
    // VPN ID の規約同意
    cy.get('[data-cy="terminals-edit-bulk-terminal-terms-of-service-vpn-id"]').should('exist')
    cy.get('[data-cy="terminals-edit-bulk-terminal-terms-of-service-vpn-id"]')
      .find('[data-cy="terminal-terms-of-service-agreement"]')
      .find('.checkbox')
      .click()

    // WANセキュリティオプションの規約同意
    cy.get('[data-cy="terminals-edit-bulk-terminal-terms-of-service-wan-security-options"]').should('exist')
    cy.get('[data-cy="terminals-edit-bulk-terminal-terms-of-service-wan-security-options"]')
      .find('[data-cy="terminal-terms-of-service-agreement"]')
      .find('.checkbox')
      .click()

    // トラフィックレポート（フロー分析）の規約同意
    cy.get('[data-cy="terminals-edit-bulk-terminal-terms-of-service-traffic-report-flow-analyzer"]').should('exist')
    cy.get('[data-cy="terminals-edit-bulk-terminal-terms-of-service-traffic-report-flow-analyzer"]')
      .find('[data-cy="terminal-terms-of-service-agreement"]')
      .find('.checkbox')
      .click()

    // 更新
    cy.get('[data-cy="terminals-edit-bulk-cancel-button"]').should('have.text', t('common.return'))
    cy.get('@submitButton').should('not.be.disabled').click()

    cy.wait('@bulkPutTerminal').then(req => {
      // undefined 除去のために JSON.parse する
      const stringify = JSON.stringify(this.terminal)
      expect(req.request.url).to.include('ztgict/v1/terminals-bulk')
      expect(req.request.body).to.deep.equal(JSON.parse(stringify))
    })

    // Bulk Put terminals の成功メッセージを確認
    cy.get('[data-cy="terminal-success-dialog-accepted-message"]').should('have.text', t('message.accepted'))
    cy.get('[data-cy="terminal-success-dialog-move-to-order-detail"]')
      .should('have.text', t('common.moveToOrderList'))
      .click()
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/orders`)
    cy.wait('@getOrderList')
  })
})
