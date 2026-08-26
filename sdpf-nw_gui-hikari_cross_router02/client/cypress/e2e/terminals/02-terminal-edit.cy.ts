import {
  t,
  generateRandomHex,
  getTerminalPutRequest,
  getGuaranteeCustomerNote,
  getTrafficReportFlowAnalyzerPlanInputValue,
  getTrafficReportFlowAnalyzerAlertInputValue,
  getThreatDetectionPlanInputValue,
  getFlowCollectorPlanInputValue,
  getBehaviorDetectionPlanInputValue,
  convertByteToString,
  formatDate,
  stripPrefix,
} from '@cypress/support/utils'
import {
  CircuitTypes,
  ResourceStatusTypes,
  SecurityOptionTypes,
  TerminalDeviceTypes,
  TrafficReportFlowAnalyzerPlanTypes,
  BehaviorDetectionOptionTypes,
} from '@app/api/constants'
import { BehaviorDetectionPlanTypes } from '@app/api/behaviorDetection/constants'
import { HikariPlans } from '@app/api/ipoes/constants'
import type { HikariPlanType } from '@app/api/ipoes/types'
import { NetworkTypes, DhcpTypes, LansTypes } from '@app/api/terminals/constants'
import type { TerminalWanStaticType, TerminalResponse, TerminalLansType } from '@app/api/terminals/types'

const testCases = [
  {
    name: 'モバイル(SIMあり)->IPoE(SIMあり)',
    fixturePath: 'terminals/detail-mobile',
    isEmptyMobileDiscountCode: true,
    securityHelpDeskStatus: 'unused', // セキュリティオプションなしでヘルプデスク利用なしの場合
    trafficReportFlowAnalyzerTermsOfServiceAccepted: true,
    securityTermsOfServiceAccepted: true,
    behaviorDetectionPlan: BehaviorDetectionPlanTypes.Lite,
  },
  {
    name: 'IPoE(SIMあり)->ギャランティ(SIMあり)',
    fixturePath: 'terminals/detail-ipoe-mobile',
    isEmptyMobileDiscountCode: true,
    securityHelpDeskStatus: 'unused', // セキュリティオプションありでヘルプデスク利用なしの場合
    trafficReportFlowAnalyzerTermsOfServiceAccepted: true,
    securityTermsOfServiceAccepted: false,
    behaviorDetectionPlan: BehaviorDetectionPlanTypes.None,
  },
  {
    name: 'ギャランティ(SIMあり)->モバイル(SIMあり)',
    fixturePath: 'terminals/detail-guarantee-mobile',
    isEmptyMobileDiscountCode: true,
    securityHelpDeskStatus: 'creating', // セキュリティオプションなしでヘルプデスク利用ありの場合
    trafficReportFlowAnalyzerTermsOfServiceAccepted: true,
    securityTermsOfServiceAccepted: true,
    behaviorDetectionPlan: BehaviorDetectionPlanTypes.Lite,
  },
  {
    name: 'ギャランティ-IPoE(SIMなし)->ギャランティ-IPoE(SIMなし)',
    fixturePath: 'terminals/detail-guarantee-ipoe',
    isEmptyMobileDiscountCode: false,
    securityHelpDeskStatus: 'deleting', // セキュリティオプションありでヘルプデスク利用ありの場合
    trafficReportFlowAnalyzerTermsOfServiceAccepted: false,
    securityTermsOfServiceAccepted: false,
    behaviorDetectionPlan: BehaviorDetectionPlanTypes.None,
  },
  {
    name: 'ギャランティ(SIMなし)->ギャランティ(SIMなし)',
    fixturePath: 'terminals/detail-guarantee',
    isEmptyMobileDiscountCode: false,
    securityHelpDeskStatus: 'deleted',
    trafficReportFlowAnalyzerTermsOfServiceAccepted: false,
    securityTermsOfServiceAccepted: false,
    behaviorDetectionPlan: BehaviorDetectionPlanTypes.None,
  },
  {
    name: 'IPoE(SIMなし)->IPoE(SIMなし)',
    fixturePath: 'terminals/detail-ipoe',
    isEmptyMobileDiscountCode: false,
    securityHelpDeskStatus: 'deleted',
    trafficReportFlowAnalyzerTermsOfServiceAccepted: false,
    securityTermsOfServiceAccepted: true,
    behaviorDetectionPlan: BehaviorDetectionPlanTypes.None,
  },
]

const getCircuitTypes = (original: TerminalResponse) => {
  // モバイル(SIMあり)->IPoE(SIMあり)
  if (original.primaryCircuit.circuitType === CircuitTypes.Mobile) {
    return { primaryCircuitType: CircuitTypes.Ipoe, secondaryCircuitType: CircuitTypes.Mobile }
  }
  // IPoE(SIMあり)->ギャランティ(SIMあり)
  if (
    original.primaryCircuit.circuitType === CircuitTypes.Ipoe &&
    original.secondaryCircuit?.circuitType === CircuitTypes.Mobile
  ) {
    return { primaryCircuitType: CircuitTypes.Guarantee, secondaryCircuitType: CircuitTypes.Mobile }
  }
  // ギャランティ(SIMあり)->モバイル(SIMあり)
  if (
    original.primaryCircuit.circuitType === CircuitTypes.Guarantee &&
    original.secondaryCircuit?.circuitType === CircuitTypes.Mobile
  ) {
    return { primaryCircuitType: CircuitTypes.Mobile, secondaryCircuitType: undefined }
  }
  // ギャランティ-IPoE(SIMなし)->ギャランティ-IPoE(SIMなし)
  // ギャランティ(SIMなし)->ギャランティ(SIMなし)
  if (original.primaryCircuit.circuitType === CircuitTypes.Guarantee) {
    return { primaryCircuitType: CircuitTypes.Guarantee, secondaryCircuitType: original.secondaryCircuit?.circuitType }
  }
  // IPoE(SIMなし)->IPoE(SIMなし)
  return { primaryCircuitType: CircuitTypes.Ipoe, secondaryCircuitType: undefined }
}

describe('端末編集画面', () => {
  const detailWaitList = ['@getOperation', '@getBreakOutList', '@getTerminal']
  const editWaitList = [
    '@getGuaranteeList',
    '@getVpnList',
    '@getIpoeList',
    '@getTerminalList',
    '@getTerminal',
    '@getBreakOutList',
  ]

  beforeEach(function () {
    this.tenantId = generateRandomHex(32)
    this.terminalId = generateRandomHex(32)
    this.orderId = generateRandomHex(32)

    cy.fixture('terminals/edit.json').then(edit => {
      this.terminal = edit.terminal
      this.dhcpServer = edit.dhcpServer
      this.dhcpRelayServers = edit.dhcpRelayServers
      this.trafficReportFlowAnalyzer = edit.trafficReportFlowAnalyzer
      this.mobile = edit.mobile
    })
    cy.fixture('guarantees/circuits/search-address.json').then(searchAddress => {
      const houseNumber = [
        searchAddress?.houseNumber1List,
        searchAddress?.houseNumber2List,
        searchAddress?.houseNumber3List,
      ].join('ー')
      const buildingName = [
        searchAddress?.buildingName1List,
        searchAddress?.buildingName2List,
        searchAddress?.buildingName3List,
      ].join('　')
      this.address = [
        searchAddress?.prefecture,
        searchAddress?.municipalityList,
        searchAddress?.largerSectionList,
        searchAddress?.sectionList,
        houseNumber,
        buildingName,
      ].join('')
    })
    cy.fixture('guarantees/circuits/list.json').then(data => {
      this.guaranteeList = data.guarantees
    })
    cy.fixture('ipoes/list.json').then(data => {
      this.ipoeList = data.ipoes
    })
    cy.fixture('vpns/list.json').then(data => {
      this.vpnList = data.vpns
    })
    cy.fixture('break-out-lists/list.json').then(data => {
      this.breakOutList = data.breakOutLists
    })

    cy.intercept('GET', '**/ztgict/v1/resource-summary/terminals*', { fixture: 'terminals/list' }).as('getTerminalList')
    cy.intercept('PUT', '**/ztgict/v1/terminals/*', { body: { orderId: this.orderId } }).as('putTerminal')
    cy.intercept('GET', '**/ztgict/v1/guarantees*', { fixture: 'guarantees/circuits/list' }).as('getGuaranteeList')
    cy.intercept('GET', '**/ztgict/v1/resource-summary/vpns', { fixture: 'vpns/list' }).as('getVpnList')
    cy.intercept('GET', '**/ztgict/v1/ipoe?*', { fixture: 'ipoes/list' }).as('getIpoeList')
    cy.intercept('GET', '**/ztgict/v1/terminals/*/operation', { body: { operations: [] } }).as('getOperation')
    cy.intercept('GET', '**/ztgict/v1/break-out-lists?resourceStatus=active&resourceStatus=inactive', {
      fixture: 'break-out-lists/list',
    }).as('getBreakOutList')

    cy.intercept('POST', '**/ztgict/v1/iwan-util/search-address', {
      fixture: 'guarantees/circuits/search-address',
    }).as('postIwanUtilSearchAddress')
    cy.intercept('GET', `**/ztgict/v1/orders/${this.orderId}`, { response: { statusCode: 200 } }).as('getOrder')
  })

  testCases.forEach(testCase => {
    it(`${testCase.name}の場合`, function () {
      const ipoeCustomerNote = this.ipoeList.find(
        (ipoe: { ipoeId: string }) => ipoe.ipoeId === this.terminal.ipoeId,
      )?.customerNote
      const ipoeIdName = `${this.terminal.ipoeId} / ${ipoeCustomerNote}`

      cy.intercept('GET', `**/ztgict/v1/terminals/${this.terminalId}`, { fixture: testCase.fixturePath }).as(
        'getTerminal',
      )
      cy.intercept('GET', '**/ztgict/v1/settings/mobile', {
        fixture: testCase.isEmptyMobileDiscountCode
          ? 'mobile/accepted-mobile-empty-discount-code'
          : 'mobile/accepted-mobile',
      }).as('getMobile')
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

      cy.fixture(testCase.fixturePath).then(original => {
        // 詳細画面の表示
        cy.visit(`/tenants/${this.tenantId}/terminals/${this.terminalId}`)
        cy.wait(detailWaitList)
        cy.get('[data-cy="terminals-id-index-edit-button"]')
          .should('have.text', t('common.edit'))
          .should('not.be.disabled')
          .click()
        // 編集画面の表示
        cy.wait(editWaitList)
        cy.get('[data-cy="terminals-id-edit-submit-button"]')
          .as('submitButton')
          .should('have.text', t('common.confirm'))
          .should('be.disabled')

        // 「利用回線選択」の表示確認
        cy.confirmEditCircuitTypes({
          className: '[data-cy="terminals-id-edit-circuit-types"]',
          circuitType: {
            primary: original.primaryCircuit.circuitType,
            secondary: original.secondaryCircuit?.circuitType,
          },
        })

        // 利用回線選択
        const { primaryCircuitType, secondaryCircuitType } = getCircuitTypes(original)
        cy.get('[data-cy="terminals-id-edit-circuit-types"]')
          .get(`[data-cy=${primaryCircuitType}-${secondaryCircuitType}]`)
          .click()

        // ルーター基本設定 - ルーター名
        cy.get('[data-cy="terminals-id-edit-customer-note"]').find('input').clear().type(this.terminal.customerNote)
        // ルーター基本設定 - 設置場所住所をクリア（自動入力を有効にする）
        cy.get('[data-cy="terminals-id-edit-installation-address"]').find('input').clear()
        // ルーター基本設定 - 設置場所郵便番号
        cy.get('[data-cy="terminals-id-edit-installation-postal-code"]')
          .find('input')
          .clear()
          .type(this.terminal.installationPostalCode)
        // ルーター基本設定 - 設置場所住所
        // 郵便番号入力による住所自動入力の確認
        cy.get('[data-cy="terminals-id-edit-installation-address"]')
          .find('input')
          .should('have.value', this.terminal.installationAddress)

        // リソース設定
        const vpnId =
          original.vpnId && original.defaultGateway.nexthopNetwork !== NetworkTypes.Vpn ? null : this.terminal.vpnId
        const vpnIdName = vpnId ? vpnId : t('vpn.unselected')
        cy.inputSelectForm({ selector: '[data-cy="terminals-id-edit-vpn-id"]', value: vpnIdName })
        const guarantee = this.terminal.guarantee
        const guaranteeCustomerNote = getGuaranteeCustomerNote(guarantee.guaranteeId, this.guaranteeList)
        const guaranteeIdName = `${guarantee.guaranteeId} / ${guaranteeCustomerNote}`

        if (primaryCircuitType === CircuitTypes.Ipoe) {
          cy.get('[data-cy="terminals-id-edit-guarantee-guarantee-id"]').find('input').should('be.disabled')
          cy.get('[data-cy="terminals-id-edit-guarantee-vpn-act-connected-ipv4-prefix"]').should('not.exist')
          cy.get('[data-cy="terminals-id-edit-guarantee-vpn-sby-connected-ipv4-prefix"]').should('not.exist')
          if (!secondaryCircuitType) {
            cy.get('[data-cy="terminals-id-edit-ipoe-id"]').find('input').should('be.disabled')
          } else {
            cy.inputSelectForm({ selector: '[data-cy="terminals-id-edit-ipoe-id"]', value: ipoeIdName })
          }
        } else if (primaryCircuitType === CircuitTypes.Guarantee && secondaryCircuitType === CircuitTypes.Mobile) {
          cy.get('[data-cy="terminals-id-edit-ipoe-id"]').find('input').should('be.disabled')
          cy.inputSelectForm({
            selector: '[data-cy="terminals-id-edit-guarantee-guarantee-id"]',
            value: guaranteeIdName,
          })

          if (vpnId) {
            cy.get('[data-cy="terminals-id-edit-guarantee-vpn-act-connected-ipv4-prefix"]')
              .find('input')
              .clear()
              .type(stripPrefix(guarantee.vpn.act.connectedIpv4Prefix))
            cy.get('[data-cy="terminals-id-edit-guarantee-vpn-sby-connected-ipv4-prefix"]')
              .find('input')
              .clear()
              .type(stripPrefix(guarantee.vpn.sby.connectedIpv4Prefix))
          } else {
            // vpnId が空の場合 VPN の接続アドレスは入力不可
            cy.get('[data-cy="terminals-id-edit-guarantee-vpn-act-connected-ipv4-prefix"]')
              .find('input')
              .should('be.disabled')
              .should('have.value', '')
            cy.get('[data-cy="terminals-id-edit-guarantee-vpn-sby-connected-ipv4-prefix"]')
              .find('input')
              .should('be.disabled')
              .should('have.value', '')
          }
        } else if (primaryCircuitType === CircuitTypes.Mobile) {
          cy.get('[data-cy="terminals-id-edit-guarantee-guarantee-id"]').find('input').should('be.disabled')
          cy.get('[data-cy="terminals-id-edit-guarantee-vpn-act-connected-ipv4-prefix"]').should('not.exist')
          cy.get('[data-cy="terminals-id-edit-guarantee-vpn-sby-connected-ipv4-prefix"]').should('not.exist')
          cy.get('[data-cy="terminals-id-edit-ipoe-id"]').find('input').should('be.disabled')
        } else {
          if (!secondaryCircuitType) {
            cy.get('[data-cy="terminals-id-edit-ipoe-id"]').find('input').should('be.disabled')
          } else {
            cy.inputSelectForm({ selector: '[data-cy="terminals-id-edit-ipoe-id"]', value: ipoeIdName })
          }
          cy.inputSelectForm({
            selector: '[data-cy="terminals-id-edit-guarantee-guarantee-id"]',
            value: guaranteeIdName,
          })
          if (vpnId) {
            cy.get('[data-cy="terminals-id-edit-guarantee-vpn-act-connected-ipv4-prefix"]')
              .find('input')
              .clear()
              .type(stripPrefix(guarantee.vpn.act.connectedIpv4Prefix))
            cy.get('[data-cy="terminals-id-edit-guarantee-vpn-sby-connected-ipv4-prefix"]')
              .find('input')
              .clear()
              .type(stripPrefix(guarantee.vpn.sby.connectedIpv4Prefix))
          } else {
            // vpnId が空の場合 VPN の接続アドレスは入力不可
            cy.get('[data-cy="terminals-id-edit-guarantee-vpn-act-connected-ipv4-prefix"]')
              .find('input')
              .should('be.disabled')
              .should('have.value', '')
            cy.get('[data-cy="terminals-id-edit-guarantee-vpn-sby-connected-ipv4-prefix"]')
              .find('input')
              .should('be.disabled')
              .should('have.value', '')
          }
        }
        // ネットワーク設定 - Loopbackアドレス
        cy.get('[data-cy="terminals-id-edit-loopback-ipv4-address"]')
          .find('input')
          .clear()
          .type(this.terminal.loopbackIpv4Address)
        // ネットワーク設定 - LANタイプ
        cy.inputSelectForm({
          selector: '[data-cy="terminals-id-edit-lan-type"]',
          value: t(`terminals.${this.terminal.lanType}`),
        })
        // ネットワーク設定 - デフォルトルート設定
        const defaultGateway = vpnId ? this.terminal.defaultGateway : { nexthopNetwork: NetworkTypes.Internet }
        cy.inputSelectForm({
          selector: '[data-cy="terminals-id-edit-default-gateway-nexthop-network"]',
          value: defaultGateway.nexthopNetwork,
        })
        if (defaultGateway.nexthopNetwork === NetworkTypes.Lan) {
          cy.get('[data-cy="terminals-id-edit-default-gateway-nexthop-ipv4-address"]')
            .find('input')
            .type(this.terminal.defaultGateway.nexthopIpv4Address)
          cy.get('[data-cy="terminals-id-edit-default-gateway-vpn-routing"]')
            .find(`.label.${this.terminal.defaultGateway.vpnRouting}`)
            .click()
        }
        if (defaultGateway.nexthopNetwork === NetworkTypes.Vpn) {
          // 特定通信ブレイクアウトとブレイクアウトDNSサーバーが入力されてた場合は削除
          if (original.defaultGateway.nexthopNetwork === NetworkTypes.Vpn) {
            original.breakOut.forEach((value: string) => {
              cy.get('[data-cy="terminals-id-edit-break-out"]')
                .find(`[data-cy="multiple-select-form-${value}"] svg`)
                .click()
            })
            cy.removeRow({
              className: '[data-cy="terminals-id-edit-break-out-dns-servers"]',
              buttonClassName: '.multiple-input-form-trush-button',
            })
          }
          // 特定通信ブレイクアウトとブレイクアウトDNSサーバーの入力
          cy.inputBreakOut({
            breakOut: this.terminal.breakOut ?? [],
            interceptDnsServers: this.terminal.interceptDnsServers ?? [],
            breakOutList: this.breakOutList,
            breakOutClassName: '[data-cy="terminals-id-edit-break-out"]',
            breakOutDnsServersClassName: '[data-cy="terminals-id-edit-break-out-dns-servers"]',
          })
        }

        // 詳細設定 - 拠点内セグメント（非直下セグメント）
        cy.inputEditLanStaticRoutes({
          lanStaticRoutes: this.terminal.lanStaticRoutes,
          className: '[data-cy="terminals-id-edit-lan-static-routes"]',
        })

        // 端末詳細設定 - WAN向けスタティックルート設定
        const wanStaticRoutes = this.terminal.wanStaticRoutes?.filter(
          (wan: TerminalWanStaticType) => !!vpnId || wan.nexthopNetwork === NetworkTypes.Internet,
        )
        cy.inputEditWanStaticRoutes({
          wanStaticRoutes,
          className: '[data-cy="terminals-id-edit-wan-static-routes"]',
        })
        if (vpnId) {
          // 端末詳細設定 - WANポートフィルタ（VPN → 拠点）
          cy.inputEditFilters({
            inputData: this.terminal.vpnInFilters,
            className: '[data-cy="terminals-id-edit-vpn-in-filters"]',
          })
          // 端末詳細設定 - WANポートフィルタ（拠点 → VPN）
          cy.inputEditFilters({
            inputData: this.terminal.vpnOutFilters,
            className: '[data-cy="terminals-id-edit-vpn-out-filters"]',
          })
        } else {
          cy.confirmEditFilters({
            inputData: null,
            disabled: true,
            className: '[data-cy="terminals-id-edit-vpn-in-filters"]',
          })
          // 端末詳細設定 - WANポートフィルタ（拠点 → VPN）
          cy.confirmEditFilters({
            inputData: null,
            disabled: true,
            className: '[data-cy="terminals-id-edit-vpn-out-filters"]',
          })
        }
        // 端末詳細設定 - WANポートフィルタ（拠点 → Internet）
        cy.inputEditFilters({
          inputData: this.terminal.inet4OutFilters,
          className: '[data-cy="terminals-id-edit-inet4-out-filters"]',
        })

        // DHCP の設定
        // dhcpServer -> dhcpRelayServers
        // dhcpRelayServers -> none
        // none -> dhcpServer
        const originalDhcpType = original.lans.some(
          (lan: TerminalLansType) => lan.type === LansTypes.Primary && !!lan.dhcpServer,
        )
          ? DhcpTypes.Server
          : original?.dhcpRelayServers
            ? DhcpTypes.Relay
            : DhcpTypes.None
        const lans = this.terminal.lans.map((lan: TerminalLansType) => {
          if (lan.type === LansTypes.Primary) {
            if (originalDhcpType === DhcpTypes.None) {
              return { ...lan, dhcpServer: this.dhcpServer }
            } else {
              return { ...lan, dhcpServer: null }
            }
          }
          return lan
        })
        // 存在する場合は DHCP Relay を削除しておく
        cy.removeRow({
          className: '[data-cy="terminals-id-edit-dhcp-relay-servers"]',
          buttonClassName: '.multiple-input-form-trush-button',
        })
        // ネットワーク設定 - 直下セグメント
        cy.inputEditLans({
          lans,
          className: '[data-cy="terminals-id-edit-lans"]',
          lanType: this.terminal.lanType,
        })
        // 端末詳細設定 - DHCP Relay
        if (originalDhcpType === DhcpTypes.Server) {
          this.dhcpRelayServers.forEach(({ serverIpv4Address }: { serverIpv4Address: string }) => {
            cy.get('[data-cy="terminals-id-edit-dhcp-relay-servers"]').find('.multiple-add').find('button').click()
            cy.get('[data-cy="terminals-id-edit-dhcp-relay-servers"]').find('input').last().type(serverIpv4Address)
          })
        }

        // トラフィックレポート（フロー分析）
        const trafficReportFlowAnalyzerPlan =
          primaryCircuitType === CircuitTypes.Guarantee
            ? this.trafficReportFlowAnalyzer.trafficReportFlowAnalyzerPlan
            : TrafficReportFlowAnalyzerPlanTypes.NoSubscription
        const trafficReportFlowAnalyzerAlert =
          primaryCircuitType === CircuitTypes.Guarantee
            ? !!this.trafficReportFlowAnalyzer.trafficReportFlowAnalyzerAlert
            : false
        if (primaryCircuitType === CircuitTypes.Guarantee) {
          // 初期値チェック - プラン
          cy.get('[data-cy="edit-traffic-report-flow-analyzer-plan-select-form"]')
            .find('input')
            .should(
              'have.value',
              getTrafficReportFlowAnalyzerPlanInputValue(
                original.trafficReportFlowAnalyzer.trafficReportFlowAnalyzerPlan,
              ),
            )
          // 初期値チェック - アラート
          cy.get('[data-cy="edit-traffic-report-flow-analyzer-alert-select-form"]')
            .find('input')
            .should(
              'have.value',
              getTrafficReportFlowAnalyzerAlertInputValue(
                original.trafficReportFlowAnalyzer.trafficReportFlowAnalyzerAlert,
              ),
            )
          // 入力 - プラン
          cy.inputSelectForm({
            selector: '[data-cy="edit-traffic-report-flow-analyzer-plan-select-form"]',
            value: getTrafficReportFlowAnalyzerPlanInputValue(trafficReportFlowAnalyzerPlan),
          })
          // 入力 - アラート
          if (trafficReportFlowAnalyzerPlan === TrafficReportFlowAnalyzerPlanTypes.NoSubscription) {
            // プランを利用しない場合、入力項目が非活性で「利用しない」が選択されていることを確認
            cy.get('[data-cy="edit-traffic-report-flow-analyzer-alert-select-form"]')
              .find('input')
              .should('be.disabled')
              .should('have.value', t('common.disuse'))
          } else {
            cy.inputSelectForm({
              selector: '[data-cy="edit-traffic-report-flow-analyzer-alert-select-form"]',
              value: getTrafficReportFlowAnalyzerAlertInputValue(trafficReportFlowAnalyzerAlert),
            })
          }
        } else {
          cy.get('[data-cy="edit-traffic-report-flow-analyzer-plan-select-form"]').should('not.exist')
          cy.get('[data-cy="edit-traffic-report-flow-analyzer-plan-value"]').should('not.exist')
        }

        // WANセキュリティ
        // 初期値チェック
        cy.get('[data-cy="edit-security-options-threat-detection-plan"]')
          .find('input')
          .should('have.value', getThreatDetectionPlanInputValue(original.threatDetection.threatDetectionPlan))
        cy.get('[data-cy="edit-security-options-flow-collector-plan"]')
          .find('input')
          .should('have.value', getFlowCollectorPlanInputValue(original.flowCollector.flowCollectorPlan))
        cy.get('[data-cy="edit-security-options-behavior-detection-plan"]')
          .find('input')
          .should('have.value', getBehaviorDetectionPlanInputValue(original.behaviorDetection.behaviorDetectionPlan))

        // フローコレクターを使用している場合は、フローコレクターの使用量と開始日も表示される
        if (original.flowCollector.flowCollectorPlan !== SecurityOptionTypes.NoSubscription) {
          cy.get('[data-cy="edit-security-options-flow-collector-usage-value"]').should(
            'have.text',
            convertByteToString(original.flowCollector.flowCollectorUsage),
          )
          cy.get('[data-cy="edit-security-options-flow-collector-start-date-value"]').should(
            'have.text',
            formatDate(original.flowCollector.flowCollectorStartDate),
          )
        }

        // 入力
        cy.inputSelectForm({
          selector: '[data-cy="edit-security-options-threat-detection-plan"]',
          value: getThreatDetectionPlanInputValue(this.terminal.threatDetection.threatDetectionPlan),
        })
        cy.inputSelectForm({
          selector: '[data-cy="edit-security-options-flow-collector-plan"]',
          value: getFlowCollectorPlanInputValue(this.terminal.flowCollector.flowCollectorPlan),
        })
        cy.inputSelectForm({
          selector: '[data-cy="edit-security-options-behavior-detection-plan"]',
          value: getBehaviorDetectionPlanInputValue(this.terminal.behaviorDetection.behaviorDetectionPlan),
        })

        // 同意設定ボタンの表示内容確認
        cy.checkTermsLinkButtonLabel({
          primaryCircuitType,
          trafficReportFlowAnalyzerTermsOfServiceAccepted: testCase.trafficReportFlowAnalyzerTermsOfServiceAccepted,
          securityTermsOfServiceAccepted: testCase.securityTermsOfServiceAccepted,
        })

        // モバイル通信方式の優先順位
        if (
          secondaryCircuitType === CircuitTypes.Ipoe ||
          (primaryCircuitType === CircuitTypes.Ipoe && !secondaryCircuitType) ||
          (primaryCircuitType === CircuitTypes.Guarantee && !secondaryCircuitType)
        ) {
          cy.get('[data-cy="terminals-id-edit-mobile-rat"]').should('not.exist')
        } else {
          cy.get('[data-cy="terminals-id-edit-mobile-rat"]').find(`.label.${this.mobile.rat}`).click()
        }

        // TODO: https://redmine.tok.access-company.com/nwvpn/issues/14474 住所検索が復活したらコメントアウトを戻す
        // // 設置場所郵便番号の住所検索の確認
        // cy.get('[data-cy="terminals-id-edit-installation-postal-code"]').find('button').click()
        // cy.wait('@postIwanUtilSearchAddress')
        // cy.get('[data-cy="terminals-id-edit-installation-postal-code"]')
        //   .find('input')
        //   .should('have.value', this.terminal.installationPostalCode)
        // cy.get('[data-cy="terminals-id-edit-installation-address"]').find('input').should('have.value', this.address)

        // 確認
        cy.get('[data-cy="terminals-id-edit-cancel-button"]').should('have.text', t('common.cancel'))
        cy.get('@submitButton').click()
        cy.wait(['@getTrafficReportFlowAnalyzerTermsOfService', '@getSecurityTermsOfService', '@getBehaviorDetection'])

        const hasTermsOfServiceDialogContent = {
          trafficReportFlowAnalyzer:
            trafficReportFlowAnalyzerPlan !== TrafficReportFlowAnalyzerPlanTypes.NoSubscription &&
            !testCase.trafficReportFlowAnalyzerTermsOfServiceAccepted,
          securityOptions:
            (this.terminal.threatDetection.threatDetectionPlan !== SecurityOptionTypes.NoSubscription ||
              this.terminal.flowCollector.flowCollectorPlan !== SecurityOptionTypes.NoSubscription ||
              this.terminal.behaviorDetection.behaviorDetectionPlan !== SecurityOptionTypes.NoSubscription) &&
            !testCase.securityTermsOfServiceAccepted,
          behaviorDetection:
            this.terminal.behaviorDetection.behaviorDetectionPlan !== BehaviorDetectionOptionTypes.NoSubscription &&
            testCase.behaviorDetectionPlan === BehaviorDetectionPlanTypes.None,
        }

        if (
          hasTermsOfServiceDialogContent.trafficReportFlowAnalyzer ||
          hasTermsOfServiceDialogContent.securityOptions ||
          hasTermsOfServiceDialogContent.behaviorDetection
        ) {
          cy.checkTermsOfServiceConfirmDialogContent({
            trafficReportFlowAnalyzer: hasTermsOfServiceDialogContent.trafficReportFlowAnalyzer,
            securityOptions: hasTermsOfServiceDialogContent.securityOptions,
            behaviorDetectionPlan: hasTermsOfServiceDialogContent.behaviorDetection,
          })

          // 同意設定取得APIの戻り値を同意済みに書き換える
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

        // 同意設定ボタンの表示内容を再確認
        cy.checkTermsLinkButtonLabel({
          primaryCircuitType,
          trafficReportFlowAnalyzerTermsOfServiceAccepted: true,
          securityTermsOfServiceAccepted: true,
        })

        // トラフィックレポート（フロー分析）とセキュリティ規約の同意確認ダイアログが表示されない
        cy.get('[data-cy="terms-of-service-confirm-dialog"]').should('not.exist')

        // ブレイクアウトの規約同意
        const terminalBreakOut = defaultGateway.nexthopNetwork === NetworkTypes.Vpn ? this.terminal.breakOut : []
        const showBreakOut = (original.breakOut ?? []).length === 0 && terminalBreakOut.length > 0
        if (showBreakOut) {
          cy.get('[data-cy="terminal-id-edit-terminal-terms-of-service-break-out"]').should('exist')
          cy.get('[data-cy="terminal-id-edit-terminal-terms-of-service-break-out"]')
            .find('[data-cy="terminal-terms-of-service-agreement"]')
            .find('.checkbox')
            .click()
        } else {
          cy.get('[data-cy="terminal-id-edit-terminal-terms-of-service-break-out"]').should('not.exist')
        }
        // VPN ID の規約同意
        const showVpnId = !original.vpnId && !!vpnId
        if (showVpnId) {
          cy.get('[data-cy="terminal-id-edit-terminal-terms-of-service-vpn-id"]').should('exist')
          cy.get('[data-cy="terminal-id-edit-terminal-terms-of-service-vpn-id"]')
            .find('[data-cy="terminal-terms-of-service-agreement"]')
            .find('.checkbox')
            .click()
        } else {
          cy.get('[data-cy="terminal-id-edit-terminal-terms-of-service-vpn-id"]').should('not.exist')
        }

        // WANセキュリティオプションの規約同意
        const showWanSecurityOption =
          (original.threatDetection.threatDetectionPlan === SecurityOptionTypes.NoSubscription &&
            this.terminal.threatDetection.threatDetectionPlan &&
            this.terminal.threatDetection.threatDetectionPlan !== SecurityOptionTypes.NoSubscription) ||
          (original.flowCollector.flowCollectorPlan === SecurityOptionTypes.NoSubscription &&
            this.terminal.flowCollector.flowCollectorPlan &&
            this.terminal.flowCollector.flowCollectorPlan !== SecurityOptionTypes.NoSubscription) ||
          (original.behaviorDetection.behaviorDetectionPlan === BehaviorDetectionOptionTypes.NoSubscription &&
            this.terminal.behaviorDetection.behaviorDetectionPlan &&
            this.terminal.behaviorDetection.behaviorDetectionPlan !== BehaviorDetectionOptionTypes.NoSubscription)
        if (showWanSecurityOption) {
          cy.get('[data-cy="terminal-id-edit-terminal-terms-of-service-wan-security-options"]').should('exist')
          cy.get('[data-cy="terminal-id-edit-terminal-terms-of-service-wan-security-options"]')
            .find('[data-cy="terminal-terms-of-service-agreement"]')
            .find('.checkbox')
            .click()
        } else {
          cy.get('[data-cy="terminal-id-edit-terminal-terms-of-service-wan-security-options"]').should('not.exist')
        }

        // トラフィックレポート（フロー分析）の規約同意
        const showTrafficReportFlowAnalyzer =
          original.trafficReportFlowAnalyzer.trafficReportFlowAnalyzerPlan ===
            TrafficReportFlowAnalyzerPlanTypes.NoSubscription &&
          trafficReportFlowAnalyzerPlan !== TrafficReportFlowAnalyzerPlanTypes.NoSubscription
        if (showTrafficReportFlowAnalyzer) {
          cy.get('[data-cy="terminal-id-edit-terminal-terms-of-service-traffic-report-flow-analyzer"]').should('exist')
          cy.get('[data-cy="terminal-id-edit-terminal-terms-of-service-traffic-report-flow-analyzer"]')
            .find('[data-cy="terminal-terms-of-service-agreement"]')
            .find('.checkbox')
            .click()
        } else {
          cy.get('[data-cy="terminal-id-edit-terminal-terms-of-service-traffic-report-flow-analyzer"]').should(
            'not.exist',
          )
        }

        // VPN接続アドレス変更の確認
        const originalVpnActConnectedIpv4Prefix = original?.guarantee?.vpn?.act?.connectedIpv4Prefix || ''
        const originalVpnSbyConnectedIpv4Prefix = original?.guarantee?.vpn?.sby?.connectedIpv4Prefix || ''
        const inputVpnActConnectedIpv4Prefix =
          primaryCircuitType === CircuitTypes.Guarantee ? guarantee?.vpn?.act?.connectedIpv4Prefix : ''
        const inputVpnSbyConnectedIpv4Prefix =
          primaryCircuitType === CircuitTypes.Guarantee ? guarantee?.vpn?.sby?.connectedIpv4Prefix : ''
        const showVpnConnection =
          originalVpnActConnectedIpv4Prefix !== inputVpnActConnectedIpv4Prefix ||
          originalVpnSbyConnectedIpv4Prefix !== inputVpnSbyConnectedIpv4Prefix
        if (showVpnConnection) {
          cy.get('[data-cy="terminals-id-edit-update-guarantee-message"]').find('.checkbox').click()
        } else {
          cy.get('[data-cy="terminals-id-edit-update-guarantee-message"]').should('not.exist')
        }

        // 一旦戻る
        cy.get('@submitButton').should('have.text', t('common.save')).should('not.be.disabled')
        cy.get('[data-cy="terminals-id-edit-cancel-button"]').should('have.text', t('common.return')).click()
        // 少し待つ
        cy.wait(500)
        cy.get('@submitButton').should('have.text', t('common.confirm')).click()
        cy.wait(['@getTrafficReportFlowAnalyzerTermsOfService'])

        // 確認・同意チェックボックス押下前は保存ボタンが非活性になっていることを確認する
        if (showBreakOut || showVpnConnection || showWanSecurityOption || showTrafficReportFlowAnalyzer) {
          cy.get('@submitButton').should('have.text', t('common.save')).should('be.disabled')
        } else {
          cy.get('@submitButton').should('have.text', t('common.save')).should('not.be.disabled')
        }

        // 確認チェックボックスを埋める
        if (showBreakOut) {
          cy.get('[data-cy="terminal-id-edit-terminal-terms-of-service-break-out"]').should('exist')
          cy.get('[data-cy="terminal-id-edit-terminal-terms-of-service-break-out"]')
            .find('[data-cy="terminal-terms-of-service-agreement"]')
            .find('.checkbox')
            .click()
        }
        if (showVpnId) {
          cy.get('[data-cy="terminal-id-edit-terminal-terms-of-service-vpn-id"]').should('exist')
          cy.get('[data-cy="terminal-id-edit-terminal-terms-of-service-vpn-id"]')
            .find('[data-cy="terminal-terms-of-service-agreement"]')
            .find('.checkbox')
            .click()
        }
        if (showVpnConnection) {
          cy.get('[data-cy="terminals-id-edit-update-guarantee-message"]').find('.checkbox').click()
        }
        if (showWanSecurityOption) {
          cy.get('[data-cy="terminal-id-edit-terminal-terms-of-service-wan-security-options"]').should('exist')
          cy.get('[data-cy="terminal-id-edit-terminal-terms-of-service-wan-security-options"]')
            .find('[data-cy="terminal-terms-of-service-agreement"]')
            .find('.checkbox')
            .click()
        } else {
          cy.get('[data-cy="terminal-id-edit-terminal-terms-of-service-wan-security-options"]').should('not.exist')
        }
        if (showTrafficReportFlowAnalyzer) {
          cy.get('[data-cy="terminal-id-edit-terminal-terms-of-service-traffic-report-flow-analyzer"]').should('exist')
          cy.get('[data-cy="terminal-id-edit-terminal-terms-of-service-traffic-report-flow-analyzer"]')
            .find('[data-cy="terminal-terms-of-service-agreement"]')
            .find('.checkbox')
            .click()
        } else {
          cy.get('[data-cy="terminal-id-edit-terminal-terms-of-service-traffic-report-flow-analyzer"]').should(
            'not.exist',
          )
        }

        // 作成
        cy.get('@submitButton').click()

        const request = getTerminalPutRequest({
          input: {
            ...this.terminal,
            // installationAddress: this.address,
            primaryCircuitType,
            secondaryCircuitType,
            guarantee,
            ipoeId:
              primaryCircuitType === CircuitTypes.Ipoe && !secondaryCircuitType ? undefined : this.terminal.ipoeId,
            vpnId,
            defaultGateway,
            wanStaticRoutes: wanStaticRoutes.length > 0 ? wanStaticRoutes : null,
            vpnInFilters: vpnId ? this.terminal.vpnInFilters : null,
            vpnOutFilters: vpnId ? this.terminal.vpnOutFilters : null,
            lans,
            trafficReportFlowAnalyzer: {
              trafficReportFlowAnalyzerPlan,
              trafficReportFlowAnalyzerAlert,
            },
            threatDetection: this.terminal.threatDetection,
            flowCollector: this.terminal.flowCollector,
            behaviorDetection: this.terminal.behaviorDetection,
            dhcpRelayServers: originalDhcpType === DhcpTypes.Server ? this.dhcpRelayServers : null,
            mobile: this.mobile,
          },
          original,
        })
        cy.wait('@putTerminal').then(req => {
          // undefined 除去のために JSON.parse する
          const stringify = JSON.stringify(request)
          expect(req.request.url).to.include('ztgict/v1/terminals')
          expect(req.request.body).to.deep.equal(JSON.parse(stringify))
        })

        // ダイアログの確認
        cy.checkTerminalSuccessDialog({
          securityHelpDeskStatus: testCase.securityHelpDeskStatus,
          threatDetectionPlan: this.terminal.threatDetection.threatDetectionPlan,
          flowCollectorPlan: this.terminal.flowCollector.flowCollectorPlan,
          behaviorDetectionPlan: this.terminal.behaviorDetection.behaviorDetectionPlan,
          orderId: this.orderId,
        })

        // 「オーダー詳細へ」ボタンを押してオーダー詳細画面に遷移することを確認する
        cy.get('[data-cy="terminal-success-dialog-move-to-order-detail"]').click()
        cy.wait('@getOrder')
        cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/orders/${this.orderId}`)
        cy.get('.dialog-main').should('not.exist')

        // オーダー詳細画面の戻るボタンを押して詳細画面に戻る
        cy.get('[data-cy="orders-id-index-return-button"]').should('have.text', t('common.return')).click()
        // 詳細画面に戻る
        cy.wait('@getTerminal')
        cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/terminals/${this.terminalId}`)
      })
    })
  })

  context('その他個別の入力制御のテスト', function () {
    beforeEach(function () {
      cy.intercept('GET', '**/ztgict/v1/settings/mobile', {
        fixture: 'mobile/accepted-mobile',
      }).as('getMobile')
      cy.intercept('GET', '**/ztgict/v1/settings/traffic-report-flow-analyzer', {
        body: { termsOfServiceAccepted: true },
      }).as('getTrafficReportFlowAnalyzerTermsOfService')
      cy.intercept('GET', '**/ztgict/v1/settings/security', {
        body: { termsOfServiceAccepted: true },
      }).as('getSecurityTermsOfService')
      cy.intercept('GET', '**/ztgict/v1/settings/security-help-desk', {
        fixture: 'security-contracts/security-help-desk/deleted',
      }).as('getSecurityHelpDesk')
      cy.intercept('GET', '**/ztgict/v1/settings/behavior-detection', {
        body: {
          thisMonthBehaviorDetectionPlan: BehaviorDetectionPlanTypes.None,
          nextMonthBehaviorDetectionPlan: BehaviorDetectionPlanTypes.None,
        },
      }).as('getBehaviorDetection')
    })

    it('IPoE(SIMなし)の場合にIPoE IDを変更した場合、それ以外の入力欄は非活性となる', function () {
      const ipoeCustomerNote = this.ipoeList.find(
        (ipoe: { ipoeId: string }) => ipoe.ipoeId === this.terminal.ipoeId,
      )?.customerNote
      const ipoeIdName = `${this.terminal.ipoeId} / ${ipoeCustomerNote}`

      cy.fixture('terminals/detail-ipoe').then(original => {
        const body = {
          ...original,
          vpnId: this.vpnList[0].vpnId,
          defaultGateway: {
            nexthopNetwork: 'vpn',
          },
          breakOut: ['zoom', 'teams'],
          interceptDnsServers: ['1.1.1.1', '2.2.2.2'],
          lans: [
            {
              type: 'primary',
              ipv4Address: '123.123.123.222',
              ipv4PrefixLength: '22',
              vpnRouting: true,
              vpnNats: [
                {
                  type: 'partialNat',
                  innerIpv4Prefix: '3.3.3.3/21',
                  outerIpv4Prefix: '2.2.2.2/22',
                },
              ],
            },
          ],
          dhcpRelayServers: [{ serverIpv4Address: '192.168.1.5' }, { serverIpv4Address: '192.168.1.6' }],
        }
        cy.intercept('GET', `**/ztgict/v1/terminals/${this.terminalId}`, {
          body,
        }).as('getTerminal')

        // 詳細画面の表示
        cy.visit(`/tenants/${this.tenantId}/terminals/${this.terminalId}`)
        cy.wait(detailWaitList)
        cy.get('[data-cy="terminals-id-index-edit-button"]')
          .should('have.text', t('common.edit'))
          .should('not.be.disabled')
          .click()
        // 編集画面の表示
        cy.wait(editWaitList)
        cy.get('[data-cy="terminals-id-edit-submit-button"]')
          .as('submitButton')
          .should('have.text', t('common.confirm'))
          .should('be.disabled')

        // IPoE ID だけ変更する
        cy.inputSelectForm({
          selector: '[data-cy="terminals-id-edit-ipoe-id"]',
          value: ipoeIdName,
        })

        // 他の要素が disabled になることを確認する
        // 利用アクセス回線
        cy.get('[data-cy="terminals-id-edit-circuit-types"]')
          .find('.row')
          .should('have.length', 1)
          .find('.radio.checked')
          .should('have.class', 'disabled')

        // ルーター基本設定 - ルーター名
        cy.get('[data-cy="terminals-id-edit-customer-note"]').find('input').should('be.disabled')
        // ルーター基本設定 - 設置場所郵便番号
        cy.get('[data-cy="terminals-id-edit-installation-postal-code"]').find('input').should('be.disabled')
        // ルーター基本設定 - 設置場所住所
        cy.get('[data-cy="terminals-id-edit-installation-address"]').find('input').should('be.disabled')

        // リソース設定 - VPN ID
        cy.get('[data-cy="terminals-id-edit-vpn-id"]').find('input').should('be.disabled')

        // ネットワーク設定 - Loopbackアドレス
        cy.get('[data-cy="terminals-id-edit-loopback-ipv4-address"]').find('input').should('be.disabled')
        // ネットワーク設定 - LANタイプ
        cy.get('[data-cy="terminals-id-edit-lan-type"]').find('input').should('be.disabled')
        // ルーター直下セグメント
        cy.get('[data-cy="terminals-id-edit-lans"]').within(() => {
          cy.get('.edit-table-add-button').should('not.exist')
          cy.get('.edit-table-trush-button').should('have.length', 0)
          cy.get('.edit-table-edit-button').should('have.length', 0)
          cy.get('.edit-table-search-button').should('have.length', body.lans.length)
        })
        // デフォルトルート設定 - ネクストホップネットワーク
        cy.get('[data-cy="terminals-id-edit-default-gateway-nexthop-network"]').find('input').should('be.disabled')
        // デフォルトルート設定 - 特定通信ブレイクアウト
        cy.get('[data-cy="terminals-id-edit-break-out"]').find('input').should('be.disabled')
        // デフォルトルート設定 - ブレイクアウトDNSサーバー
        cy.get('[data-cy="terminals-id-edit-break-out-dns-servers"]').within(() => {
          cy.get('input').should('be.disabled')
          cy.get('.multiple-input-form-trush-button').should('have.length', 0)
          cy.get('.multiple-add').should('not.exist')
        })

        // WANセキュリティ
        cy.get('[data-cy="edit-security-options-threat-detection-plan"]').find('input').should('be.disabled')
        cy.get('[data-cy="edit-security-options-flow-collector-plan"]').find('input').should('be.disabled')
        cy.get('[data-cy="edit-security-options-behavior-detection-plan"]').find('input').should('be.disabled')

        // 詳細設定 - 拠点内セグメント（非直下セグメント）
        cy.get('[data-cy="terminals-id-edit-lan-static-routes"]').within(() => {
          cy.get('.edit-table-add-button').should('not.exist')
          cy.get('.edit-table-trush-button').should('have.length', 0)
          cy.get('.edit-table-edit-button').should('have.length', 0)
          cy.get('.edit-table-search-button').should('have.length', body.lanStaticRoutes.length)
        })
        // 端末詳細設定 - WAN向けスタティックルート設定
        cy.get('[data-cy="terminals-id-edit-wan-static-routes"]').within(() => {
          cy.get('.edit-table-add-button').should('not.exist')
          cy.get('.edit-table-trush-button').should('have.length', 0)
          cy.get('.edit-table-edit-button').should('have.length', 0)
          cy.get('.edit-table-search-button').should('have.length', body.wanStaticRoutes.length)
        })
        // 端末詳細設定 - パケットフィルタ（VPN → 拠点）
        cy.get('[data-cy="terminals-id-edit-vpn-in-filters"]').within(() => {
          cy.get('input').should('be.disabled')
          cy.get('.edit-table-add-button').should('not.exist')
          cy.get('.edit-table-trush-button').should('have.length', 0)
          cy.get('.edit-table-edit-button').should('have.length', 0)
          const length = body.vpnInFilters?.accessControlList?.length || 0
          cy.get('.edit-table-search-button').should('have.length', length)
        })
        // 端末詳細設定 - パケットフィルタ（拠点 → VPN）
        cy.get('[data-cy="terminals-id-edit-vpn-out-filters"]').within(() => {
          cy.get('input').should('be.disabled')
          cy.get('.edit-table-add-button').should('not.exist')
          cy.get('.edit-table-trush-button').should('have.length', 0)
          cy.get('.edit-table-edit-button').should('have.length', 0)
          const length = body.vpnOutFilters?.accessControlList?.length || 0
          cy.get('.edit-table-search-button').should('have.length', length)
        })
        // 端末詳細設定 - パケットフィルタ（拠点 → Internet）
        cy.get('[data-cy="terminals-id-edit-inet4-out-filters"]').within(() => {
          cy.get('input').should('be.disabled')
          cy.get('.edit-table-add-button').should('not.exist')
          cy.get('.edit-table-trush-button').should('have.length', 0)
          cy.get('.edit-table-edit-button').should('have.length', 0)
          const length = body.inet4OutFilters?.accessControlList?.length || 0
          cy.get('.edit-table-search-button').should('have.length', length)
        })
        // 端末詳細設定 - DHCP Relay
        cy.get('[data-cy="terminals-id-edit-dhcp-relay-servers"]').within(() => {
          cy.get('input').should('be.disabled')
        })

        // 確認
        cy.get('@submitButton').click()
        cy.wait(['@getTrafficReportFlowAnalyzerTermsOfService', '@getSecurityTermsOfService', '@getBehaviorDetection'])
        // 作成
        cy.get('@submitButton').click()

        // ipoeId だけ変更されることを確認する
        cy.wait('@putTerminal').then(req => {
          expect(req.request.body).to.deep.equal({ ipoeId: this.terminal.ipoeId })
        })

        // ダイアログの閉じるボタンを押す
        cy.get('.dialog-card-close').click()
        cy.get('.dialog-main').should('not.exist')

        // 詳細画面に戻る
        cy.wait(detailWaitList)
        cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/terminals/${this.terminalId}`)
      })
    })

    it('迂回実行中の場合、ギャランティ回線とVPNIDは変更不可になる', function () {
      cy.fixture('terminals/detail-guarantee-mobile').then(original => {
        const body = {
          ...original,
          guarantee: {
            ...original.guarantee,
            routeSwitch: {
              switchover: true,
              lastUpdateTime: '2026-02-17T15:26:29+09:00',
            },
          },
        }
        cy.intercept('GET', `**/ztgict/v1/terminals/${this.terminalId}`, {
          body,
        }).as('getTerminal')

        // 詳細画面の表示
        cy.visit(`/tenants/${this.tenantId}/terminals/${this.terminalId}`)
        cy.wait(detailWaitList)
        cy.get('[data-cy="terminals-id-index-edit-button"]')
          .should('have.text', t('common.edit'))
          .should('not.be.disabled')
          .click()
        // 編集画面の表示
        cy.wait(editWaitList)
        cy.get('[data-cy="terminals-id-edit-submit-button"]')
          .as('submitButton')
          .should('have.text', t('common.confirm'))
          .should('be.disabled')

        // 利用アクセス回線
        cy.get('[data-cy="terminals-id-edit-circuit-types"]').find('.radio.disabled').should('have.length', 3)
        // リソース設定 - ギャランティアクセスID
        cy.get('[data-cy="terminals-id-edit-guarantee-guarantee-id"]').find('input').should('be.disabled')
        // リソース設定 - VPN ID
        cy.get('[data-cy="terminals-id-edit-vpn-id"]').find('input').should('be.disabled')

        // ルーター基本設定 - ルーター名
        cy.get('[data-cy="terminals-id-edit-customer-note"]').find('input').clear().type('test')
        // VPN - 接続アドレス(Act)
        cy.get('[data-cy="terminals-id-edit-guarantee-vpn-act-connected-ipv4-prefix"]')
          .find('input')
          .clear()
          .type('1.1.1.1')
        // VPN - 接続アドレス(Sby)
        cy.get('[data-cy="terminals-id-edit-guarantee-vpn-sby-connected-ipv4-prefix"]')
          .find('input')
          .clear()
          .type('2.2.2.2')

        // 確認
        cy.get('@submitButton').click()
        cy.wait(['@getTrafficReportFlowAnalyzerTermsOfService', '@getSecurityTermsOfService', '@getBehaviorDetection'])
        // 作成
        cy.get('[data-cy="terminals-id-edit-update-guarantee-message"]').find('.checkbox').click()
        cy.get('@submitButton').click()

        // customerNote と vpn の接続アドレスが変更されることを確認する
        cy.wait('@putTerminal').then(req => {
          expect(req.request.body).to.deep.equal({
            customerNote: 'test',
            guarantee: {
              guaranteeId: original.guarantee.guaranteeId,
              vpn: {
                act: {
                  connectedIpv4Prefix: '1.1.1.1/30',
                },
                sby: {
                  connectedIpv4Prefix: '2.2.2.2/30',
                },
              },
            },
          })
        })

        // ダイアログの閉じるボタンを押す
        cy.get('.dialog-card-close').click()
        cy.get('.dialog-main').should('not.exist')

        // 詳細画面に戻る
        cy.wait(detailWaitList)
        cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/terminals/${this.terminalId}`)
      })
    })

    it('RINKルーター01 の場合、光クロスのIPoEアクセス回線は選択できない', function () {
      const ipoeIdSelector = '[data-cy="terminals-id-edit-ipoe-id"]'
      const ipoeList: Array<{ ipoeId: string; customerNote: string; hikariPlan?: HikariPlanType }> = this.ipoeList
      // 変更時に紐付け可能なIPoE回線は active のもののみのため、全ての回線を active にする
      const ipoes = ipoeList.map(ipoe => ({ ...ipoe, resourceStatus: ResourceStatusTypes.Active }))
      const crossIpoe = ipoes.find(ipoe => ipoe.hikariPlan === HikariPlans.Cross)
      const selectableIpoes = ipoes.filter(ipoe => ipoe.hikariPlan !== HikariPlans.Cross)

      // fixture の利用ルーター機種は RINKルーター01
      cy.intercept('GET', `**/ztgict/v1/terminals/${this.terminalId}`, { fixture: 'terminals/detail-ipoe' }).as(
        'getTerminal',
      )
      cy.intercept('GET', '**/ztgict/v1/ipoe?*', { body: { total: ipoes.length, offset: 0, ipoes } }).as('getIpoeList')

      // 詳細画面の表示
      cy.visit(`/tenants/${this.tenantId}/terminals/${this.terminalId}`)
      cy.wait(detailWaitList)
      cy.get('[data-cy="terminals-id-index-edit-button"]')
        .should('have.text', t('common.edit'))
        .should('not.be.disabled')
        .click()
      // 編集画面の表示
      cy.wait(editWaitList)
      cy.get('[data-cy="terminals-id-edit-submit-button"]')
        .should('have.text', t('common.confirm'))
        .should('be.disabled')

      // RINKルーター01 では光クロスの回線は選択肢に表示されない
      cy.get(ipoeIdSelector).find('li').should('have.length', selectableIpoes.length)
      selectableIpoes.forEach(({ ipoeId, customerNote }) => {
        cy.get(ipoeIdSelector).find('li').should('contain', `${ipoeId} / ${customerNote}`)
      })
      cy.get(ipoeIdSelector).find('li').should('not.contain', crossIpoe?.ipoeId)
    })

    it('RINKルーター02 の場合、LANタイプは変更できずLANポートフィルタは表示されない', function () {
      cy.fixture('terminals/detail-ipoe').then(original => {
        const body = { ...original, terminalDeviceType: TerminalDeviceTypes.Router02 }
        cy.intercept('GET', `**/ztgict/v1/terminals/${this.terminalId}`, { body }).as('getTerminal')

        // 詳細画面の表示
        cy.visit(`/tenants/${this.tenantId}/terminals/${this.terminalId}`)
        cy.wait(detailWaitList)
        cy.get('[data-cy="terminals-id-index-edit-button"]')
          .should('have.text', t('common.edit'))
          .should('not.be.disabled')
          .click()
        // 編集画面の表示
        cy.wait(editWaitList)
        cy.get('[data-cy="terminals-id-edit-submit-button"]')
          .should('have.text', t('common.confirm'))
          .should('be.disabled')

        // ネットワーク設定 - LANタイプは変更不可
        cy.get('[data-cy="terminals-id-edit-lan-type"]').find('input').should('be.disabled')

        // ルーター直下セグメントの表では LANポートフィルタの列自体が表示されない
        cy.confirmEditLans({
          lans: body.lans,
          className: '[data-cy="terminals-id-edit-lans"]',
          lanType: body.lanType,
          hideLanInFilters: true,
        })

        // ルーター直下セグメントの入力欄でも LANポートフィルタは設定できない
        cy.get('[data-cy="terminals-id-edit-lans"]').find('.edit-table-edit-button').first().click()
        cy.get('[data-cy="edit-lans-lan-in-filters"]').should('not.exist')
        cy.get('.dialog-card-close').click()
        cy.get('.dialog-main').should('not.exist')
      })
    })
  })
})
