import { BehaviorDetectionPlanTypes } from '@app/api/behaviorDetection/constants'
import {
  BehaviorDetectionOptionTypes,
  SecurityOptionTypes,
  TrafficReportFlowAnalyzerPlanTypes,
} from '@app/api/constants'
import { CorporateVerificationMethodTypes, PicVerificationMethodTypes } from '@app/api/terminals/constants'
import { generateRandomHex, t, getTerminalPostRequest, nDaysLater } from '@cypress/support/utils'

const testCases = [
  {
    name: 'ワイヤレス（マイナンバーカードによる本人確認）',
    fixturePath: 'terminals/create-mobile.json',
    corporateVerificationMethod: CorporateVerificationMethodTypes.CorporateNumberVerification,
    picVerificationMethod: PicVerificationMethodTypes.MyNumberCard,
    securityHelpDeskStatus: 'unused', // セキュリティオプションなしでヘルプデスク利用なしの場合
    trafficReportFlowAnalyzerTermsOfServiceAccepted: true,
    securityTermsOfServiceAccepted: true,
    behaviorDetectionPlan: BehaviorDetectionPlanTypes.None,
  },
  {
    name: 'IPoE - ワイヤレス（担当営業による対面確認）',
    fixturePath: 'terminals/create-ipoe-mobile.json',
    corporateVerificationMethod: CorporateVerificationMethodTypes.CorporateNumberVerification,
    picVerificationMethod: PicVerificationMethodTypes.InPersonVerification,
    securityHelpDeskStatus: 'creating', // セキュリティオプションなしでヘルプデスク利用ありの場合
    trafficReportFlowAnalyzerTermsOfServiceAccepted: false,
    securityTermsOfServiceAccepted: true,
    behaviorDetectionPlan: BehaviorDetectionPlanTypes.None,
  },
  {
    name: 'ギャランティ - ワイヤレス（担当営業による対面確認）',
    fixturePath: 'terminals/create-guarantee-mobile.json',
    corporateVerificationMethod: CorporateVerificationMethodTypes.InPersonVerification,
    picVerificationMethod: PicVerificationMethodTypes.InPersonVerification,
    securityHelpDeskStatus: 'unused', // セキュリティオプションありでヘルプデスク利用なしの場合
    trafficReportFlowAnalyzerTermsOfServiceAccepted: true,
    securityTermsOfServiceAccepted: false,
    behaviorDetectionPlan: BehaviorDetectionPlanTypes.Lite,
  },
]

describe('サービスルーター新規作成', () => {
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

    cy.intercept('GET', '**/ztgict/v1/settings/mobile', {
      fixture: 'mobile/accepted-mobile',
    }).as('getMobile')
    cy.intercept('POST', '**/ztgict/v1/iwan-util/search-address', {
      fixture: 'guarantees/circuits/search-address',
    }).as('postIwanUtilSearchAddress')

    cy.intercept('POST', '**/ztgict/v1/upload-document', { fixture: 'upload-document' }).as('postUploadDocument')
  })

  context('端末作成ページからの作成', function () {
    testCases.forEach(testCase => {
      it(`${testCase.name}の場合`, function () {
        cy.intercept('GET', `**/ztgict/v1/orders/${this.orderId}`, { response: { statusCode: 200 } }).as('getOrder')
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

          const inputTerminal = Object.assign(create.terminal, {
            deliveryDate: nDaysLater(32),
            dhcpRelayServers: create.dhcpRelayServers,
          })

          // ====== Step1: 端末情報 & ワイヤレスアクセス用ドコモ回線申し込み情報入力 ======
          cy.inputTerminalWithoutMobile({
            inputData: inputTerminal,
            breakOutList: this.breakOutList,
            guaranteeList: this.guaranteeList,
            ipoeList: this.ipoeList,
            vpnList: this.vpnList,
          })

          // ワイヤレスアクセス用ドコモ回線申し込み情報入力
          cy.inputTerminalMobile({
            inputData: {
              ...create.mobile,
              corporateVerificationMethod: testCase.corporateVerificationMethod,
            },
            document: { aliasName: '@postUploadDocument', id: this.uploadDocumentId },
          })

          // 同意設定ボタンの表示内容確認
          cy.checkTermsLinkButtonLabel({
            primaryCircuitType: create.terminal.primaryCircuitType,
            trafficReportFlowAnalyzerTermsOfServiceAccepted: testCase.trafficReportFlowAnalyzerTermsOfServiceAccepted,
            securityTermsOfServiceAccepted: testCase.securityTermsOfServiceAccepted,
          })

          // Step1 → Step2 へ進む
          cy.get('[data-cy="terminal-create-cancel-button"]').as('cancelButton').should('have.text', t('common.cancel'))
          cy.get('[data-cy="terminal-create-submit-button"]')
            .as('submitButton')
            .should('have.text', t('common.next'))
            .click()

          // TermsOfServiceConfirmDialog用のAPI
          cy.wait([
            '@getTrafficReportFlowAnalyzerTermsOfService',
            '@getSecurityTermsOfService',
            '@getBehaviorDetection',
          ])

          const hasTermsOfServiceDialogContent = {
            trafficReportFlowAnalyzer:
              create.terminal.trafficReportFlowAnalyzer.trafficReportFlowAnalyzerPlan !==
                TrafficReportFlowAnalyzerPlanTypes.NoSubscription &&
              !testCase.trafficReportFlowAnalyzerTermsOfServiceAccepted,
            securityOptions:
              (create.terminal.threatDetection.threatDetectionPlan !== SecurityOptionTypes.NoSubscription ||
                create.terminal.flowCollector.flowCollectorPlan !== SecurityOptionTypes.NoSubscription ||
                create.terminal.behaviorDetection.behaviorDetectionPlan !==
                  BehaviorDetectionOptionTypes.NoSubscription) &&
              !testCase.securityTermsOfServiceAccepted,
            behaviorDetection:
              create.terminal.behaviorDetection.behaviorDetectionPlan !== BehaviorDetectionOptionTypes.NoSubscription &&
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
            cy.get('@submitButton').should('have.text', t('common.next')).click()
            cy.wait([
              '@getTrafficReportFlowAnalyzerTermsOfService',
              '@getSecurityTermsOfService',
              '@getBehaviorDetection',
            ])
          }

          // ダイアログが表示されないことを確認
          cy.get('[data-cy="terms-of-service-confirm-dialog"]').should('not.exist')

          // ====== Step2: 本人確認情報入力 ======
          if (testCase.picVerificationMethod === PicVerificationMethodTypes.MyNumberCard) {
            // マイナンバーカードによる確認
            cy.inputTerminalMobilePicInformationMyNumberCard({
              inputData: create.mobile,
            })
          } else {
            // 担当営業による対面確認
            cy.inputTerminalMobilePicInformationInPerson({
              inputData: create.mobile,
              document: { aliasName: '@postUploadDocument', id: this.uploadDocumentId },
            })
          }

          // 一旦Step1に戻り、再度Step2に進んでも確認画面へ遷移できることを確認する
          cy.get('@submitButton').should('not.be.disabled')
          cy.get('@cancelButton').should('have.text', t('common.return')).click()
          cy.get('@cancelButton').should('have.text', t('common.cancel'))

          cy.get('@submitButton').should('have.text', t('common.next')).click()
          // Step2 → Step3（確認画面）へ進む
          cy.get('@cancelButton').should('have.text', t('common.return'))
          cy.get('@submitButton').should('have.text', t('common.confirm')).click()

          // ====== Step3: 確認画面 ======
          // 確認チェックボックス押下前は保存ボタンが非活性になっていることを確認
          cy.get('@submitButton').should('have.text', t('common.save')).should('be.disabled')

          // トラフィックレポート（フロー分析）とセキュリティ規約の同意確認ダイアログが表示されない
          cy.get('[data-cy="terms-of-service-confirm-dialog"]').should('not.exist')
          // 確認チェックボックス押下前は保存ボタンが非活性になっていることを確認する
          cy.get('@submitButton').should('have.text', t('common.save')).should('be.disabled')

          // 確認チェックボックス（初回は存在確認も行う）
          cy.clickCreateConfirmCheckboxes({ terminal: create.terminal })

          // 規約同意チェックボックス（初回は存在確認も行う）
          cy.clickCreateTermsOfServiceCheckboxes({ terminal: create.terminal })

          // 本人確認情報へ戻る
          cy.get('@submitButton').should('not.be.disabled')
          cy.get('@cancelButton').should('have.text', t('common.return')).click()
          // 少し待つ
          cy.wait(500)

          // 再度確認画面へ進む
          cy.get('@submitButton').should('have.text', t('common.confirm')).click()

          // 確認・同意チェックボックス押下前は保存ボタンが非活性になっていることを確認する
          cy.get('@submitButton').should('have.text', t('common.save')).should('be.disabled')

          // 確認チェックボックスと規約同意チェックボックスをクリック（2回目はクリックのみ）
          cy.clickCreateConfirmCheckboxes({ terminal: create.terminal })
          cy.clickCreateTermsOfServiceCheckboxes({ terminal: create.terminal })

          // 作成
          cy.get('@submitButton').should('not.be.disabled').click()

          const inputMobile =
            testCase.picVerificationMethod === PicVerificationMethodTypes.MyNumberCard
              ? {
                  // マイナンバーカード本人確認の場合
                  ...create.mobile,
                  picEmploymentDocumentId: this.uploadDocumentId,
                }
              : {
                  // 担当営業による対面確認の場合
                  ...create.mobile,
                  // corporateVerificationMethodがInPersonVerificationの場合のみcontractIdentificationDocumentIdが必要
                  contractIdentificationDocumentId:
                    testCase.corporateVerificationMethod === CorporateVerificationMethodTypes.InPersonVerification
                      ? this.uploadDocumentId
                      : undefined,
                  picIdentificationFrontDocumentId: this.uploadDocumentId,
                  picIdentificationBackDocumentId: this.uploadDocumentId,
                  picIdentificationAdditionalDocumentId: this.uploadDocumentId,
                  picAuxiliaryIdentificationDocumentId: this.uploadDocumentId,
                  picEmploymentDocumentId: this.uploadDocumentId,
                }

          const request = getTerminalPostRequest({
            inputMobile,
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
        })
      })
    })

    it('localStorage から読込した場合は保存済みの法人確認方法をそのまま復元する', function () {
      cy.fixture('terminals/create-mobile.json').then(create => {
        const savedName = '法人確認方法保存テスト'
        const inputTerminal = Object.assign(create.terminal, {
          deliveryDate: nDaysLater(32),
        })

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

        cy.get('[data-cy="terminal-create-creation-type"]').find('.label.rentalTerminal').click()
        cy.wait(['@getBreakOutList', '@getServiceClosedDaysTerminal'])

        cy.inputTerminalWithoutMobile({
          inputData: inputTerminal,
          breakOutList: this.breakOutList,
          guaranteeList: this.guaranteeList,
          ipoeList: this.ipoeList,
          vpnList: this.vpnList,
        })
        cy.inputTerminalMobile({
          inputData: {
            ...create.mobile,
            corporateVerificationMethod: CorporateVerificationMethodTypes.CorporateNumberVerification,
          },
          document: { aliasName: '@postUploadDocument', id: this.uploadDocumentId },
        })

        cy.get('[data-cy="terminal-create-save-local-storage-button"]')
          .should('have.text', t('localStorage.saveCurrentPageDataButton'))
          .click()
        cy.get('[data-cy="local-storage-save-dialog"]').contains(t('localStorage.saveConfirm')).should('exist')
        cy.get('[data-cy="local-storage-save-dialog-name-input"]').find('input').clear().type(savedName)
        cy.get('[data-cy="local-storage-save-dialog-submit-button"]').should('have.text', t('common.save')).click()

        cy.window().then(win => {
          const localStorageKey = `${this.tenantId}_terminalData`
          const savedItems = JSON.parse(win.localStorage.getItem(localStorageKey) ?? '[]')
          const latestItem = savedItems[0]?.[1]

          expect(latestItem).to.not.equal(undefined)

          latestItem.mobile.corporateVerificationMethod = CorporateVerificationMethodTypes.CorporateNumberVerification
          latestItem.mobile.contractIdentificationDocumentType = 'sealCertificate'
          latestItem.mobile.contractIdentificationDocumentId = 'saved-contract-identification-document-id'

          win.localStorage.setItem(localStorageKey, JSON.stringify(savedItems))
        })

        cy.reload()
        cy.wait([
          '@getMobile',
          '@getMobileTermOfService',
          '@getDownloadMobileMonitoringTermsOfService',
          '@getGuaranteeList',
          '@getVpnList',
          '@getIpoeList',
          '@getTerminalList',
        ])
        cy.get('[data-cy="terminal-create-creation-type"]').find('.label.rentalTerminal').click()
        cy.wait(['@getBreakOutList', '@getServiceClosedDaysTerminal'])
        cy.get('[data-cy="edit-terminal-data-edit-circuit-types"]').find('[data-cy=mobile-undefined]').click()
        cy.get('[data-cy="edit-terminal-mobile-corporate-verification-method"]')
          .find('.radio.checked')
          .should('not.exist')
        cy.get('.dialog-base-submit-button').should('have.text', t('common.confirm')).click()

        cy.get('[data-cy="terminal-create-open-local-storage-table-button"]').should('not.be.disabled').click()
        cy.get('[data-cy="local-storage-table-dialog"]').contains(savedName).should('exist')
        cy.get('[data-cy="local-storage-table-dialog-use-button"]').click()

        cy.get('[data-cy="edit-terminal-mobile-corporate-verification-method"]')
          .find('.radio.checked')
          .find(`.label.${CorporateVerificationMethodTypes.CorporateNumberVerification}`)
          .should('have.length', 1)
        cy.get('[data-cy="edit-terminal-mobile-japan-corporate-number"]')
          .find('input')
          .should('have.value', create.mobile.japanCorporateNumber)
        cy.get('[data-cy="edit-terminal-mobile-contract-identification-document-type"]').should('not.exist')
        cy.get('[data-cy="edit-terminal-mobile-contract-identification-document-id"]').should('not.exist')
      })
    })
  })
})
