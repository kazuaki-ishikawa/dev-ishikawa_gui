import {
  BehaviorDetectionOptionTypes,
  SecurityOptionTypes,
  TrafficReportFlowAnalyzerPlanTypes,
} from '@app/api/constants'
import { generateRandomHex, t, getTerminalPostRequest, nDaysLater } from '@cypress/support/utils'

const orderTestCases = [
  // この fixture には lanStaticRoutes/wanStaticRoutes が存在しないため、確認画面で LAN/WAN スタティックルートが 0 件表示であることを検証する
  {
    name: 'ギャランティ - IPoE',
    fixturePath: 'orders/terminal-create-guarantee-ipoe-rejected.json',
    isEmptyMobileDiscountCode: true,
    assertion: {},
  },
  {
    name: 'ギャランティ',
    fixturePath: 'orders/terminal-create-guarantee-rejected.json',
    isEmptyMobileDiscountCode: true,
  },
  {
    name: 'IPoE',
    fixturePath: 'orders/terminal-create-ipoe-rejected.json',
    isEmptyMobileDiscountCode: true,
    assertion: {
      wanStaticRoutes: [
        {
          nexthopNetwork: 'vpn',
          destinationIpv4Prefix: '0.0.0.255/32',
        },
        {
          nexthopNetwork: 'internet',
          destinationIpv4Prefix: '0.0.1.0/0',
        },
        {
          nexthopNetwork: 'vpn',
          destinationIpv4Prefix: '0.0.1.0/0',
        },
      ],
    },
  },
]

describe('サービスルーター新規作成', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)
    this.orderId = generateRandomHex(32)
    cy.fixture('ipoes/list.json').then(data => {
      this.ipoeList = data.ipoes
    })
    cy.fixture('vpns/list.json').then(data => {
      this.vpnList = data.vpns
    })
    cy.fixture('guarantees/circuits/list.json').then(data => {
      this.guaranteeList = data.guarantees
    })
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
    cy.intercept('GET', '**/ztgict/v1/settings/traffic-report-flow-analyzer', {
      body: { termsOfServiceAccepted: true },
    }).as('getTrafficReportFlowAnalyzerTermsOfService')
    cy.intercept('GET', '**/ztgict/v1/settings/security-help-desk', {
      fixture: 'security-contracts/security-help-desk/created',
    }).as('getSecurityHelpDesk')
    cy.intercept('GET', '**/ztgict/v1/settings/behavior-detection', {
      fixture: 'behavior-detection/settings',
    }).as('getBehaviorDetection')
  })

  context('オーダー詳細からの遷移', function () {
    orderTestCases.forEach((testCase, index) => {
      it(`${testCase.name}の場合`, function () {
        const createdOrderId = generateRandomHex(32)

        cy.intercept('GET', `**/ztgict/v1/orders/${this.orderId}`, { fixture: testCase.fixturePath }).as('getOrder')
        cy.intercept('GET', '**/ztgict/v1/settings/mobile', {
          fixture: testCase.isEmptyMobileDiscountCode
            ? 'mobile/accepted-mobile-empty-discount-code'
            : 'mobile/accepted-mobile',
        }).as('getMobile')
        cy.intercept('GET', `**/ztgict/v1/orders/${createdOrderId}`, { response: { statusCode: 200 } }).as(
          'getCratedOrder',
        )
        cy.intercept('POST', '**/ztgict/v1/terminals', { body: { orderId: createdOrderId } }).as('postTerminal')

        cy.fixture(testCase.fixturePath).then(order => {
          cy.visit(`/tenants/${this.tenantId}/orders/${this.orderId}`)
          cy.wait(['@getOrder', '@getBreakOutListWithoutQuery'])
          cy.get('[data-cy="orders-id-index-reapply-button"]').should('have.text', t('orders.reapply')).click()

          // 新規作成共通のAPIリクエスト
          cy.wait([
            '@getMobile',
            '@getMobileTermOfService',
            '@getDownloadMobileMonitoringTermsOfService',
            '@getGuaranteeList',
            '@getVpnList',
            '@getIpoeList',
            '@getTerminalList',
          ])
          // サービスルーターの場合のAPIリクエスト
          cy.wait(['@getOrder', '@getBreakOutList', '@getServiceClosedDaysTerminal'])
          // URLのチェック
          cy.url().should(
            'eq',
            `${Cypress.config().baseUrl}/tenants/${this.tenantId}/terminals/create?orderId=${this.orderId}`,
          )

          // 利用ルーター選択の状態
          cy.get('[data-cy="terminal-create-creation-type"]').should('exist')
          cy.get('[data-cy="terminal-create-creation-type"]')
            .find('.radio.checked.disabled')
            .find('.label.rentalTerminal')
            .should('have.length', 1)
          cy.get('[data-cy="terminal-create-rental"]').should('exist')
          cy.get('[data-cy="terminal-create-self"]').should('not.exist')

          // 配送希望日だけ変更する
          const deliveryDate = nDaysLater(25)
          cy.inputDatePicker({
            className: '[data-cy="edit-terminal-data-delivery-date"]',
            date: deliveryDate,
          })

          // ボタンの状態
          cy.get('[data-cy="terminal-create-submit-button"]').as('submitButton')
          cy.get('[data-cy="terminal-create-cancel-button"]').should('not.be.disabled')
          cy.get('@submitButton').should('not.be.disabled').click()
          cy.wait(['@getTrafficReportFlowAnalyzerTermsOfService', '@getSecurityTermsOfService', '@getSecurityHelpDesk'])

          // モバイル情報は非表示
          cy.get('[data-cy="edit-terminal-data-mobile-information"]').should('not.exist')

          // 確認画面 - 端末情報
          cy.confirmTerminalWithoutMobile({
            inputData: Object.assign({}, order.request, { deliveryDate }),
            disabled: true,
            ipoeList: this.ipoeList,
            vpnList: this.vpnList,
            guaranteeList: this.guaranteeList,
            assertion: testCase.assertion,
          })

          // 確認チェックボックス押下前は保存ボタンが非活性になっていることを確認する
          cy.get('@submitButton').should('have.text', t('common.save')).should('be.disabled')

          // 確認チェックボックス
          cy.clickCreateConfirmCheckboxes({ terminal: order.request })

          // ブレイクアウトの規約同意
          const showBreakOut =
            order.request.defaultGateway.nexthopNetwork === 'vpn' && order.request.breakOut.length > 0
          if (showBreakOut) {
            cy.get('[data-cy="terminal-create-terminal-terms-of-service-break-out"]').should('exist')
            cy.get('[data-cy="terminal-create-terminal-terms-of-service-break-out"]')
              .find('[data-cy="terminal-terms-of-service-agreement"]')
              .find('.checkbox')
              .click()
          }
          // VPN ID の規約同意
          if (order.request.vpnId) {
            cy.get('[data-cy="terminal-create-terminal-terms-of-service-vpn-id"]').should('exist')
            cy.get('[data-cy="terminal-create-terminal-terms-of-service-vpn-id"]')
              .find('[data-cy="terminal-terms-of-service-agreement"]')
              .find('.checkbox')
              .click()
          }

          // WANセキュリティオプションの規約同意
          const showSecurityOptions =
            order.request.threatDetection.threatDetectionPlan !== SecurityOptionTypes.NoSubscription ||
            order.request.flowCollector.flowCollectorPlan !== SecurityOptionTypes.NoSubscription ||
            order.request.behaviorDetection.behaviorDetectionPlan !== BehaviorDetectionOptionTypes.NoSubscription
          if (showSecurityOptions) {
            cy.get('[data-cy="terminal-create-terminal-terms-of-service-wan-security-options"]').should('exist')
            cy.get('[data-cy="terminal-create-terminal-terms-of-service-wan-security-options"]')
              .find('[data-cy="terminal-terms-of-service-agreement"]')
              .find('.checkbox')
              .click()
          } else {
            cy.get('[data-cy="terminal-create-terminal-terms-of-service-wan-security-options"]').should('not.exist')
          }

          // トラフィックレポート（フロー分析）の規約同意
          const showTrafficReportFlowAnalyzer =
            order.request.trafficReportFlowAnalyzer.trafficReportFlowAnalyzerPlan !==
            TrafficReportFlowAnalyzerPlanTypes.NoSubscription
          if (showTrafficReportFlowAnalyzer) {
            cy.get('[data-cy="terminal-create-terminal-terms-of-service-traffic-report-flow-analyzer"]').should('exist')
            cy.get('[data-cy="terminal-create-terminal-terms-of-service-traffic-report-flow-analyzer"]')
              .find('[data-cy="terminal-terms-of-service-agreement"]')
              .find('.checkbox')
              .click()
          } else {
            cy.get('[data-cy="terminal-create-terminal-terms-of-service-traffic-report-flow-analyzer"]').should(
              'not.exist',
            )
          }

          // 作成
          cy.get('[data-cy="terminal-create-cancel-button"]').should('have.text', t('common.return'))
          cy.get('@submitButton').should('not.be.disabled').click()

          const request = getTerminalPostRequest({
            inputMobile: order.request.mobile,
            inputTerminal: Object.assign({}, order.request, { deliveryDate }),
          })

          cy.wait('@postTerminal').then(req => {
            // undefined 除去のために JSON.parse する
            const stringify = JSON.stringify(request)
            expect(req.request.url).to.include('ztgict/v1/terminals')
            expect(req.request.body).to.deep.equal(JSON.parse(stringify))
          })

          // POST terminals の成功メッセージを確認
          cy.get('[data-cy="terminal-success-dialog-accepted-message"]').should(
            'have.text',
            `${t('message.accepted')}\n${t('details.orderId')} ${createdOrderId}`,
          )

          if (index === 0) {
            // ダイアログの閉じるボタンを押す
            cy.get('.dialog-card-close').click()
            cy.get('.dialog-main').should('not.exist')
            cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/orders/${this.orderId}`)
          } else {
            // あたらしいオーダー詳細画面に遷移する
            cy.get('[data-cy="terminal-success-dialog-move-to-order-detail"]').click()
            cy.wait(['@getCratedOrder'])
            cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/orders/${createdOrderId}`)
            cy.get('.dialog-main').should('not.exist')

            // オーダー詳細画面の戻るボタンを押して前のオーダー詳細画面に戻る
            cy.get('[data-cy="orders-id-index-return-button"]').should('have.text', t('common.return')).click()
            cy.wait(['@getOrder', '@getBreakOutListWithoutQuery'])
            cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/orders/${this.orderId}`)
          }
        })
      })
    })
  })
})
