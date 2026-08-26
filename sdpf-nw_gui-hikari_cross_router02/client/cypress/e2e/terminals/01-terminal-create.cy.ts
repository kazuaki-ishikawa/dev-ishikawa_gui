import { BehaviorDetectionPlanTypes } from '@app/api/behaviorDetection/constants'
import {
  CircuitTypes,
  SecurityOptionTypes,
  TerminalDeviceTypes,
  TrafficReportFlowAnalyzerPlanTypes,
} from '@app/api/constants'
import { HikariPlans } from '@app/api/ipoes/constants'
import type { HikariPlanType } from '@app/api/ipoes/types'
import { generateRandomHex, t, getTerminalPostRequest, nDaysLater } from '@cypress/support/utils'

const testCases = [
  {
    name: 'ギャランティ - IPoE',
    fixturePath: 'terminals/create-guarantee-ipoe.json',
    isEmptyMobileDiscountCode: true,
    securityHelpDeskStatus: 'deleting', // セキュリティオプションありでヘルプデスク利用ありの場合
    trafficReportFlowAnalyzerTermsOfServiceAccepted: false,
    securityTermsOfServiceAccepted: false,
    behaviorDetectionPlan: BehaviorDetectionPlanTypes.Standard,
  },
  {
    name: 'ギャランティ',
    fixturePath: 'terminals/create-guarantee.json',
    isEmptyMobileDiscountCode: false,
    securityHelpDeskStatus: 'deleted',
    trafficReportFlowAnalyzerTermsOfServiceAccepted: true,
    securityTermsOfServiceAccepted: true,
    behaviorDetectionPlan: BehaviorDetectionPlanTypes.None,
  },
  {
    name: 'IPoE',
    fixturePath: 'terminals/create-ipoe.json',
    isEmptyMobileDiscountCode: true,
    securityHelpDeskStatus: 'deleted',
    trafficReportFlowAnalyzerTermsOfServiceAccepted: true,
    securityTermsOfServiceAccepted: true,
    behaviorDetectionPlan: BehaviorDetectionPlanTypes.Standard,
  },
]

describe('サービスルーター新規作成（RINKルーター01）', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)
    this.orderId = generateRandomHex(32)
    cy.fixture('upload-document.json').then(data => {
      this.uploadDocumentId = data.documentId
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
    cy.fixture('ipoes/list.json').then(data => {
      this.ipoeList = data.ipoes
    })
    cy.fixture('vpns/list.json').then(data => {
      this.vpnList = data.vpns
    })
    cy.fixture('guarantees/circuits/list.json').then(data => {
      this.guaranteeList = data.guarantees
    })
    cy.fixture('break-out-lists/list.json').then(data => {
      this.breakOutList = data.breakOutLists
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

    cy.intercept('POST', '**/ztgict/v1/iwan-util/search-address', {
      fixture: 'guarantees/circuits/search-address',
    }).as('postIwanUtilSearchAddress')
    cy.intercept('POST', '**/ztgict/v1/upload-document', { fixture: 'upload-document' }).as('postUploadDocument')
  })

  context('端末一覧からの遷移', function () {
    testCases.forEach((testCase, index) => {
      it(`${testCase.name}の場合`, function () {
        cy.intercept('GET', `**/ztgict/v1/orders/${this.orderId}`, { response: { statusCode: 200 } }).as('getOrder')
        cy.intercept('GET', '**/ztgict/v1/settings/mobile', {
          fixture: testCase.isEmptyMobileDiscountCode
            ? 'mobile/accepted-mobile-empty-discount-code'
            : 'mobile/accepted-mobile',
        }).as('getMobile')
        cy.intercept('POST', '**/ztgict/v1/terminals', { body: { orderId: this.orderId } }).as('postTerminal')
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

          // 利用ルーター選択
          cy.get('[data-cy="terminal-create-creation-type"]').should('exist')
          cy.get('[data-cy="terminal-create-rental"]').should('not.exist')
          cy.get('[data-cy="terminal-create-self"]').should('not.exist')
          cy.get('[data-cy="terminal-create-creation-type"]').find('.label.rentalTerminal').click()

          cy.wait(['@getBreakOutList', '@getServiceClosedDaysTerminal'])
          cy.get('[data-cy="terminal-create-rental"]').should('exist')

          // 利用ルーター機種は RINKルーター01 が選択されていることを確認する
          cy.get('[data-cy="edit-terminal-data-terminal-device-type"]')
            .find('.radio.checked')
            .find(`.label.${TerminalDeviceTypes.Router01}`)
            .should('have.length', 1)

          const inputTerminal = Object.assign(create.terminal, {
            deliveryDate: nDaysLater(32),
            dhcpRelayServers: create.dhcpRelayServers,
          })
          // 「利用回線選択」の表示確認
          cy.confirmEditCircuitTypes({
            className: '[data-cy="edit-terminal-data-edit-circuit-types"]',
          })
          // 端末情報入力
          cy.inputTerminalWithoutMobile({
            inputData: inputTerminal,
            breakOutList: this.breakOutList,
            guaranteeList: this.guaranteeList,
            ipoeList: this.ipoeList,
            vpnList: this.vpnList,
          })
          if (
            create.terminal.primaryCircuitType === CircuitTypes.Mobile ||
            create.terminal.secondaryCircuitType === CircuitTypes.Mobile
          ) {
            // モバイル情報入力
            cy.inputTerminalMobile({
              inputData: create.mobile,
              document: { aliasName: '@postUploadDocument', id: this.uploadDocumentId },
            })
          } else {
            cy.get('[data-cy="edit-terminal-data-mobile-information"]').should('not.exist')
          }

          // TODO: https://redmine.tok.access-company.com/nwvpn/issues/14474 住所検索が復活したらコメントアウトを戻す
          // // 設置場所郵便番号の住所検索の確認
          // cy.get('[data-cy="edit-terminal-data-installation-postal-code"]').find('button').click()
          // cy.wait('@postIwanUtilSearchAddress')
          // cy.get('[data-cy="edit-terminal-data-installation-postal-code"]')
          //   .find('input')
          //   .should('have.value', inputTerminal.installationPostalCode)
          // cy.get('[data-cy="edit-terminal-data-installation-address"]').find('input').should('have.value', this.address)
          // cy.get('[data-cy="terminal-create-submit-button"]')
          //   .as('submitButton')
          //   .should('not.be.disabled')

          // // 配送先情報の郵便番号の住所検索の確認
          // cy.get('[data-cy="edit-terminal-data-delivery-postal-code"]').find('button').click()
          // cy.wait('@postIwanUtilSearchAddress')
          // cy.get('[data-cy="edit-terminal-data-delivery-postal-code"]')
          //   .find('input')
          //   .should('have.value', inputTerminal.deliveryPostalCode)
          // cy.get('[data-cy="edit-terminal-data-delivery-address"]').find('input').should('have.value', this.address)
          // cy.get('@submitButton').should('not.be.disabled')

          // if (
          //   create.terminal.primaryCircuitType === CircuitTypes.Mobile ||
          //   create.terminal.secondaryCircuitType === CircuitTypes.Mobile
          // ) {
          //   // モバイル情報の担当者郵便番号の住所検索の確認
          //   cy.get('[data-cy="edit-terminal-mobile-pic-postal-code"]').find('button').click()
          //   cy.wait('@postIwanUtilSearchAddress')
          //   cy.get('[data-cy="edit-terminal-mobile-pic-postal-code"]')
          //     .find('input')
          //     .should('have.value', create.mobile.picPostalCode)
          //   cy.get('[data-cy="edit-terminal-mobile-pic-address"]').find('input').should('have.value', this.address)
          // }

          const hasTermsOfServiceDialogContent = {
            trafficReportFlowAnalyzer:
              create.terminal.trafficReportFlowAnalyzer.trafficReportFlowAnalyzerPlan !==
                TrafficReportFlowAnalyzerPlanTypes.NoSubscription &&
              !testCase.trafficReportFlowAnalyzerTermsOfServiceAccepted,
            securityOptions:
              (create.terminal.threatDetection.threatDetectionPlan !== SecurityOptionTypes.NoSubscription ||
                create.terminal.flowCollector.flowCollectorPlan !== SecurityOptionTypes.NoSubscription ||
                create.terminal.behaviorDetection.behaviorDetectionPlan !== SecurityOptionTypes.NoSubscription) &&
              !testCase.securityTermsOfServiceAccepted,
            behaviorDetection: false,
          }
          // 同意設定ボタンの表示内容確認
          cy.checkTermsLinkButtonLabel({
            primaryCircuitType: create.terminal.primaryCircuitType,
            trafficReportFlowAnalyzerTermsOfServiceAccepted: testCase.trafficReportFlowAnalyzerTermsOfServiceAccepted,
            securityTermsOfServiceAccepted: testCase.securityTermsOfServiceAccepted,
          })

          // 確認
          cy.get('[data-cy="terminal-create-cancel-button"]').should('have.text', t('common.cancel'))
          cy.get('[data-cy="terminal-create-submit-button"]')
            .as('submitButton')
            .should('have.text', t('common.confirm'))
            .click()

          // GET /settings/traffic-report-flow-analyzer, GET /settings/security が実行される
          cy.wait([
            '@getTrafficReportFlowAnalyzerTermsOfService',
            '@getSecurityTermsOfService',
            '@getBehaviorDetection',
          ])
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
            primaryCircuitType: create.terminal.primaryCircuitType,
            trafficReportFlowAnalyzerTermsOfServiceAccepted: true,
            securityTermsOfServiceAccepted: true,
          })

          // トラフィックレポート（フロー分析）とセキュリティ規約の同意確認ダイアログが表示されない
          cy.get('[data-cy="terms-of-service-confirm-dialog"]').should('not.exist')
          // 確認チェックボックス押下前は保存ボタンが非活性になっていることを確認する
          cy.get('@submitButton').should('have.text', t('common.save')).should('be.disabled')

          // 確認チェックボックス
          cy.clickCreateConfirmCheckboxes({ terminal: create.terminal })
          // 規約同意チェックボックス
          cy.clickCreateTermsOfServiceCheckboxes({ terminal: create.terminal })

          // 一旦戻る
          cy.get('@submitButton').should('not.be.disabled')
          cy.get('[data-cy="terminal-create-cancel-button"]').should('have.text', t('common.return')).click()
          // 少し待つ
          cy.wait(500)
          cy.get('@submitButton').click()
          cy.wait(['@getTrafficReportFlowAnalyzerTermsOfService'])

          // 確認・同意チェックボックス押下前は保存ボタンが非活性になっていることを確認する
          cy.get('@submitButton').should('have.text', t('common.save')).should('be.disabled')

          // 確認チェックボックスと規約同意チェックボックスをクリック
          cy.clickCreateConfirmCheckboxes({ terminal: create.terminal })
          cy.clickCreateTermsOfServiceCheckboxes({ terminal: create.terminal })

          // 作成
          cy.get('@submitButton').should('not.be.disabled').click()

          const request = getTerminalPostRequest({
            inputMobile: {
              ...create.mobile,
              // picAddress: this.address,
              contractIdentificationDocumentId: this.uploadDocumentId,
              picIdentificationFrontDocumentId: this.uploadDocumentId,
              picIdentificationBackDocumentId: this.uploadDocumentId,
              picIdentificationAdditionalDocumentId: this.uploadDocumentId,
              picAuxiliaryIdentificationDocumentId: this.uploadDocumentId,
              picEmploymentDocumentId: this.uploadDocumentId,
            },
            // inputTerminal: { ...inputTerminal, installationAddress: this.address, deliveryAddress: this.address },
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
            securityHelpDeskStatus: testCase.securityHelpDeskStatus,
            threatDetectionPlan: inputTerminal.threatDetection.threatDetectionPlan,
            flowCollectorPlan: inputTerminal.flowCollector.flowCollectorPlan,
            behaviorDetectionPlan: inputTerminal.behaviorDetection.behaviorDetectionPlan,
          })

          if (index === 0) {
            // ダイアログの閉じるボタンを押す
            cy.get('.dialog-card-close').click()
            cy.get('.dialog-main').should('not.exist')
            cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/terminals`)
            cy.wait(['@getTerminalList'])
          } else {
            // オーダー詳細の画面に遷移する
            cy.get('[data-cy="terminal-success-dialog-move-to-order-detail"]')
              .should('have.text', t('common.moveToOrderDetail'))
              .click()
            cy.wait('@getOrder')
            cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/orders/${this.orderId}`)
            cy.get('.dialog-main').should('not.exist')

            // オーダー詳細画面の戻るボタンを押して一覧画面に戻る
            cy.get('[data-cy="orders-id-index-return-button"]').should('have.text', t('common.return')).click()
            cy.wait(['@getTerminalList'])
            cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/terminals`)
          }
        })
      })
    })
  })

  it('getServiceClosedDays が 500 エラーの場合、DatePicker が disabled になる', function () {
    cy.intercept('GET', '**/ztgict/v1/service-closed-days/terminal', {
      statusCode: 500,
      body: { errorCode: 500, errorMessage: '500 Internal Server Error!' },
    }).as('getServiceClosedDaysError')
    cy.intercept('GET', '**/ztgict/v1/settings/mobile', {
      fixture: 'mobile/accepted-mobile',
    }).as('getMobile')

    cy.fixture('terminals/create-ipoe.json').then(create => {
      cy.visit(`/tenants/${this.tenantId}/terminals`)
      cy.wait(['@getTerminalList'])
      cy.get('[data-cy="terminals-index-create-button"]').click({ force: true })
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
      cy.wait(['@getBreakOutList', '@getServiceClosedDaysError'])

      // エラーダイアログの表示
      cy.get('[data-cy="notification-dialog-text"]').should(
        'have.text',
        `${t('message.failed')}\n500\n500 Internal Server Error!`,
      )
      cy.get('[data-cy="notification-dialog-submit-button"]').click()

      // deliveryDate 以外の必須項目を入力する
      cy.get('[data-cy="edit-terminal-data-edit-circuit-types"]').find(`[data-cy=ipoe-${undefined}]`).click()
      cy.get('[data-cy="edit-terminal-data-customer-note"]').find('input').type(create.terminal.customerNote)
      cy.get('[data-cy="edit-terminal-data-installation-postal-code"]')
        .find('input')
        .type(create.terminal.installationPostalCode)
      cy.get('[data-cy="edit-terminal-data-installation-address"]')
        .find('input')
        .should('have.value', create.terminal.installationAddress)
      cy.inputSelectForm({ selector: '[data-cy="edit-terminal-data-vpn-id"]', value: t('vpn.unselected') })
      cy.inputSelectForm({
        selector: '[data-cy="edit-terminal-data-ipoe-id"]',
        value: create.terminal.ipoeId,
      })
      cy.get('[data-cy="edit-terminal-data-loopback-ipv4-address"]')
        .find('input')
        .type(create.terminal.loopbackIpv4Address)
      cy.inputSelectForm({
        selector: '[data-cy="edit-terminal-data-lan-type"]',
        value: t(`terminals.${create.terminal.lanType}`),
      })
      cy.inputEditLans({
        lans: create.terminal.lans,
        className: '[data-cy="edit-terminal-data-lans"]',
        lanType: create.terminal.lanType,
      })
      cy.inputSelectForm({
        selector: '[data-cy="edit-terminal-data-default-gateway-nexthop-network"]',
        value: 'Internet',
      })

      // 配送先情報
      cy.get('[data-cy="edit-terminal-data-delivery-name"]').find('input').type(create.terminal.deliveryName)
      cy.get('[data-cy="edit-terminal-data-delivery-department-name"]')
        .find('input')
        .type(create.terminal.deliveryDepartmentName)
      cy.get('[data-cy="edit-terminal-data-delivery-phone-number"]')
        .find('input')
        .type(create.terminal.deliveryPhoneNumber)
      cy.get('[data-cy="edit-terminal-data-delivery-postal-code"]')
        .find('input')
        .clear()
        .type(create.terminal.deliveryPostalCode)
      // 郵便番号入力による住所自動入力の確認
      cy.get('[data-cy="edit-terminal-data-delivery-address"]')
        .find('input')
        .should('have.value', create.terminal.deliveryAddress)
      cy.get('[data-cy="edit-terminal-data-delivery-address-kana"]')
        .find('input')
        .type(create.terminal.deliveryAddressKana)

      // DatePicker が disabled になっている
      cy.get('[data-cy="edit-terminal-data-delivery-date"]').find('input').should('be.disabled')
      // 確認ボタンが disabled になっている
      cy.get('[data-cy="terminal-create-submit-button"]').should('be.disabled')
    })
  })

  it('RINKルーター01 では光クロスのIPoEアクセス回線を選択できない', function () {
    cy.intercept('GET', '**/ztgict/v1/settings/mobile', { fixture: 'mobile/accepted-mobile' }).as('getMobile')

    const ipoeIdSelector = '[data-cy="edit-terminal-data-ipoe-id"]'
    const ipoeList: Array<{ ipoeId: string; customerNote: string; hikariPlan?: HikariPlanType }> = this.ipoeList
    const crossIpoe = ipoeList.find(ipoe => ipoe.hikariPlan === HikariPlans.Cross)
    const selectableIpoes = ipoeList.filter(ipoe => ipoe.hikariPlan !== HikariPlans.Cross)

    cy.visit(`/tenants/${this.tenantId}/terminals`)
    cy.wait(['@getTerminalList'])
    cy.get('[data-cy="terminals-index-create-button"]').click({ force: true })
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

    // 利用アクセス回線でベストエフォートIPoEアクセスを選択する
    cy.get('[data-cy="edit-terminal-data-edit-circuit-types"]').find(`[data-cy=ipoe-${undefined}]`).click()

    // RINKルーター01 では光クロスの回線は選択肢に表示されない
    cy.get(ipoeIdSelector).find('li').should('have.length', selectableIpoes.length)
    selectableIpoes.forEach(({ ipoeId, customerNote }) => {
      cy.get(ipoeIdSelector).find('li').should('contain', `${ipoeId} / ${customerNote}`)
    })

    expect(crossIpoe, '光クロスのIPoE回線（hikariPlan: Cross）がfixturesに含まれていること').to.not.equal(undefined)
    cy.get(ipoeIdSelector).find('li').should('not.contain', crossIpoe!.ipoeId)
  })
})
