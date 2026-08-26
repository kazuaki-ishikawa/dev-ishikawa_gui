import { SecurityOptionTypes, TerminalTypes, TrafficReportFlowAnalyzerPlanTypes } from '@app/api/constants'
import type { TerminalThreatDetectionType } from '@app/api/types'
import {
  ThreatDetectionSharedBillingMethodTypes,
  ThreatDetectionSharedRequestTypes,
  ThreatDetectionSharedTerminalDirectionTypes,
} from '@app/api/threatDetectionShared/constants'
import { generateRandomHex, t } from '@cypress/support/utils'

const validAuthKey = generateRandomHex(64)

describe('脅威情報共有 共有開始', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)

    // リクエスト一覧画面のAPIモック
    cy.intercept('GET', '**/ztgict/v1/threat-detection-shared/requests?*', {
      fixture: 'security-contracts/threat-detection-shared/requests',
    }).as('getThreatDetectionSharedRequests')

    // 共有開始画面のAPIモック
    cy.fixture('security-contracts/threat-detection-shared/tenant-reference-auth-key-search').then(
      tenantReferenceAuthKeySearchResponse => {
        // 認証キーの検索APIのレスポンス
        this.tenantReferenceAuthKeySearchResponse = tenantReferenceAuthKeySearchResponse
        cy.intercept('POST', '**/ztgict/v1/settings/tenant-reference-auth-key/search', {
          body: tenantReferenceAuthKeySearchResponse,
        }).as('searchAuthKey')

        cy.fixture('security-contracts/threat-detection-shared/terminal-list').then(terminalList => {
          // 端末一覧APIのレスポンス
          this.terminals = terminalList.terminals
          this.selectableTerminalList = this.terminals.filter(
            (terminal: { threatDetection: TerminalThreatDetectionType }) =>
              terminal.threatDetection.threatDetectionPlan !== SecurityOptionTypes.NoSubscription,
          )
          this.billingMethod = ThreatDetectionSharedBillingMethodTypes.ReceiverPays

          cy.intercept('GET', '**/ztgict/v1/resource-summary/terminals*', {
            body: terminalList,
          }).as('getTerminalList')

          cy.intercept(
            {
              method: 'GET',
              pathname: '**/ztgict/v1/threat-detection-shared/tenants',
              query: {
                sharedTenantId: tenantReferenceAuthKeySearchResponse.tenantId,
                terminalDirection: ThreatDetectionSharedTerminalDirectionTypes.Provided,
              },
            },
            {
              body: {
                total: 1,
                limit: 10,
                offset: 0,
                terminals: this.selectableTerminalList.map((terminal: { terminalId: string }) => ({
                  sharedTenantId: tenantReferenceAuthKeySearchResponse.tenantId,
                  contractorName: tenantReferenceAuthKeySearchResponse.contractorName,
                  terminalDirection: ThreatDetectionSharedTerminalDirectionTypes.Provided,
                  billingMethod: this.billingMethod,
                  terminalId: terminal.terminalId,
                })),
              },
            },
          ).as('getThreatDetectionSharedTenantList')
        })
      },
    )

    cy.intercept('POST', '**/ztgict/v1/threat-detection-shared/requests', {}).as('postThreatDetectionSharedRequest')
  })

  it('セキュリティ規約同意前', function () {
    cy.intercept('GET', '**/ztgict/v1/settings/security', {
      body: { termsOfServiceAccepted: false },
    }).as('getSecurityTermsOfService')

    cy.visit(`/tenants/${this.tenantId}/security-contracts/threat-detection-shared/start-sharing`)
    cy.wait([
      '@getSession',
      '@getMobile',
      '@getTrafficReportFlowAnalyzerTermsOfService',
      '@getSecurityTermsOfService',
      '@getSettingsBehaviorDetection',
    ])

    // セキュリティ同意画面へ遷移ボタンが表示される
    cy.get('[data-cy="security-contracts-threat-detection-shared-start-sharing-terms-of-service-button"]').should(
      'exist',
    )
    cy.get('[data-cy="security-contracts-threat-detection-shared-start-sharing-terms-of-service-message"]').should(
      'exist',
    )

    // 入力欄
    cy.get('[data-cy="security-contracts-threat-detection-shared-start-sharing-auth-key-input"]')
      .find('input')
      .should('be.disabled')
    // ボタンの状態確認
    cy.get('[data-cy="security-contracts-threat-detection-shared-start-sharing-auth-key-search-button"]').should(
      'be.disabled',
    )
  })

  it('認証キー確認APIで403が返ってきた場合', function () {
    cy.intercept('POST', '**/ztgict/v1/settings/tenant-reference-auth-key/search', {
      statusCode: 403,
    }).as('searchAuthKey403')

    cy.visit(`/tenants/${this.tenantId}/security-contracts/threat-detection-shared`)
    cy.wait([
      '@getSession',
      '@getMobile',
      '@getTrafficReportFlowAnalyzerTermsOfService',
      '@getSecurityTermsOfService',
      '@getSettingsBehaviorDetection',
      '@getSecurityTermsOfService',
      '@getThreatDetectionSharedRequests',
      '@getThreatDetectionSharedRequests',
    ])

    // 共有開始ボタンを押下
    cy.get('[data-cy="security-contracts-threat-detection-shared-start-sharing-button"]').click()
    cy.url().should('include', `/tenants/${this.tenantId}/security-contracts/threat-detection-shared/start-sharing`)

    // セキュリティ同意画面へ遷移ボタンが非表示
    cy.get('[data-cy="security-contracts-threat-detection-shared-start-sharing-terms-of-service-button"]').should(
      'not.exist',
    )
    cy.get('[data-cy="security-contracts-threat-detection-shared-start-sharing-terms-of-service-message"]').should(
      'not.exist',
    )

    // 初期状態の確認
    cy.get('[data-cy="security-contracts-threat-detection-shared-start-sharing-auth-key"]').should('not.exist')
    cy.get('[data-cy="security-contracts-threat-detection-shared-start-sharing-auth-key-input"]')
      .find('input')
      .as('inputAuthKey')
      .should('have.value', '')
    cy.get('[data-cy="security-contracts-threat-detection-shared-start-sharing-auth-key-search-button"]')
      .as('searchButton')
      .should('be.disabled')
    cy.get('[data-cy="security-contracts-threat-detection-shared-start-sharing-tenant-id"]').should('not.exist')
    cy.get('[data-cy="security-contracts-threat-detection-shared-start-sharing-contractor-name"]').should('not.exist')
    cy.get('[data-cy="security-contracts-threat-detection-shared-start-sharing-billing-method"]').should('not.exist')
    cy.get('[data-cy="security-contracts-threat-detection-shared-start-sharing-submit-button"]').should('not.exist')

    // 認証キー入力
    const inputAuthKey = validAuthKey
    cy.get('@inputAuthKey').type(inputAuthKey)
    cy.get('@searchButton').click()

    cy.wait('@searchAuthKey403').then(({ request }) => {
      expect(request.body).to.deep.equal({ key: inputAuthKey })
    })

    // 403エラーのメッセージが表示される
    cy.get('[data-cy="notification-dialog-text"]').should('be.visible').and('have.text', '有効期限切れの認証キーです。')
    cy.get('[data-cy="notification-dialog-submit-button"]').click()

    // ダイアログが閉じられていることを確認
    cy.get('[data-cy="notification-dialog-text"]').should('not.exist')
    cy.get('@inputAuthKey').should('have.value', inputAuthKey)
  })

  it('認証キーが64文字未満の場合はエラーを表示し、64文字でエラーが解消される', function () {
    cy.visit(`/tenants/${this.tenantId}/security-contracts/threat-detection-shared`)
    cy.wait([
      '@getSession',
      '@getMobile',
      '@getTrafficReportFlowAnalyzerTermsOfService',
      '@getSecurityTermsOfService',
      '@getSettingsBehaviorDetection',
      '@getSecurityTermsOfService',
      '@getThreatDetectionSharedRequests',
      '@getThreatDetectionSharedRequests',
    ])

    cy.get('[data-cy="security-contracts-threat-detection-shared-start-sharing-button"]').click()

    cy.get('[data-cy="security-contracts-threat-detection-shared-start-sharing-auth-key-input"]')
      .as('inputAuthKeyContainer')
      .find('input')
      .as('inputAuthKey')
      .type(validAuthKey.slice(0, 63))
    cy.get('@inputAuthKeyContainer').should('contain', t('invalid.authKey'))
    cy.get('[data-cy="security-contracts-threat-detection-shared-start-sharing-auth-key-search-button"]')
      .as('searchButton')
      .should('be.disabled')

    cy.get('@inputAuthKey').type(validAuthKey.slice(63))
    cy.get('@inputAuthKeyContainer').should('not.contain', t('invalid.authKey'))
    cy.get('@searchButton').should('not.be.disabled')
  })

  it('未共有のテナントの場合', function () {
    const authKeyTenantId = this.tenantReferenceAuthKeySearchResponse.tenantId
    cy.intercept(
      {
        method: 'GET',
        pathname: '**/ztgict/v1/threat-detection-shared/tenants',
        query: {
          sharedTenantId: authKeyTenantId,
          terminalDirection: ThreatDetectionSharedTerminalDirectionTypes.Provided,
        },
      },
      {
        body: {
          total: 0,
          offset: 0,
          limit: 10,
          terminals: [],
        },
      },
    ).as('getThreatDetectionSharedTenantList')

    cy.visit(`/tenants/${this.tenantId}/security-contracts/threat-detection-shared`)
    cy.wait([
      '@getSession',
      '@getMobile',
      '@getTrafficReportFlowAnalyzerTermsOfService',
      '@getSecurityTermsOfService',
      '@getSettingsBehaviorDetection',
      '@getSecurityTermsOfService',
      '@getThreatDetectionSharedRequests',
      '@getThreatDetectionSharedRequests',
    ])

    // 共有開始ボタンを押下
    cy.get('[data-cy="security-contracts-threat-detection-shared-start-sharing-button"]').click()
    cy.url().should('include', `/tenants/${this.tenantId}/security-contracts/threat-detection-shared/start-sharing`)

    const inputAuthKey = validAuthKey
    cy.get('[data-cy="security-contracts-threat-detection-shared-start-sharing-auth-key-input"]')
      .find('input')
      .type(inputAuthKey)
    cy.get('[data-cy="security-contracts-threat-detection-shared-start-sharing-auth-key-search-button"]')
      .as('searchButton')
      .click()

    cy.wait('@searchAuthKey').then(({ request }) => {
      expect(request.body).to.deep.equal({ key: inputAuthKey })
    })
    cy.wait(['@getThreatDetectionSharedTenantList', '@getTerminalList'])

    // 「共有開始」ボタンの初期値
    cy.get('[data-cy="security-contracts-threat-detection-shared-start-sharing-submit-button"]')
      .as('submitButton')
      .should('be.disabled')

    // 認証キーの入力欄の確認
    cy.get('[data-cy="security-contracts-threat-detection-shared-start-sharing-auth-key-input"]').should('not.exist')
    cy.get('[data-cy="security-contracts-threat-detection-shared-start-sharing-auth-key"]').should(
      'have.text',
      inputAuthKey,
    )
    cy.get('@searchButton').should('not.exist')

    // テナント欄
    cy.get('[data-cy="security-contracts-threat-detection-shared-start-sharing-tenant-id"]').should(
      'have.text',
      authKeyTenantId,
    )
    cy.get('[data-cy="security-contracts-threat-detection-shared-start-sharing-contractor-name"]').should(
      'have.text',
      this.tenantReferenceAuthKeySearchResponse.contractorName,
    )

    // 課金パターン選択
    cy.get('[data-cy="security-contracts-threat-detection-shared-start-sharing-billing-method"]')
      .find('.radio')
      .each($radio => {
        cy.wrap($radio).should('not.have.class', 'checked')
        cy.wrap($radio).should('not.have.class', 'disabled')
      })
    // 課金パターンを Split に設定
    const billingMethod = ThreatDetectionSharedBillingMethodTypes.Split
    cy.get('[data-cy="security-contracts-threat-detection-shared-start-sharing-billing-method"]')
      .find('.radio')
      .find(`.label.${billingMethod}`)
      .click()

    // terminalId を選択していないので「共有開始」ボタンはまだ非活性
    cy.get('@submitButton').should('be.disabled')

    // テーブルのチェックボックス制御
    this.terminals.forEach((terminal: { terminalId: string; threatDetection: TerminalThreatDetectionType }) => {
      const found = this.selectableTerminalList.find(
        ({ terminalId }: { terminalId: string }) => terminal.terminalId === terminalId,
      )
      cy.get(
        `[data-cy="security-contracts-threat-detection-shared-start-sharing-terminal-table-selector-${terminal.terminalId}"]`,
      ).should(!found ? 'have.class' : 'not.have.class', 'disabled')
    })
    // 全件選択
    cy.get(
      '[data-cy="security-contracts-threat-detection-shared-start-sharing-terminal-table-select-all-checkbox"]',
    ).click()

    // 「共有開始」ボタンを押下
    cy.get('@submitButton').click()
    // APIリクエストの内容を確認
    cy.wait('@postThreatDetectionSharedRequest').then(({ request }) => {
      expect(request.body).to.deep.equal({
        key: inputAuthKey,
        sharedTenantId: authKeyTenantId,
        billingMethod,
        terminalIds: this.terminals
          .filter((terminal: { threatDetection: TerminalThreatDetectionType }) => {
            return terminal.threatDetection.threatDetectionPlan !== SecurityOptionTypes.NoSubscription
          })
          .map((terminal: { terminalId: string }) => terminal.terminalId),
        requestType: ThreatDetectionSharedRequestTypes.Start,
      })
    })

    // ダイアログの確認
    cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('threatDetectionStartSharing.message.started'))
    // ダイアログを閉じる
    cy.get('[data-cy="notification-dialog-submit-button"]').click()
    cy.get('[data-cy="notification-dialog-text"]').should('not.exist')
    // 初期化を確認
    cy.get('[data-cy="security-contracts-threat-detection-shared-start-sharing-auth-key-input"]')
      .find('input')
      .should('have.value', '')
  })

  it('共有済みテナントの場合(選択可能なルーターなし)', function () {
    cy.visit(`/tenants/${this.tenantId}/security-contracts/threat-detection-shared`)
    cy.wait([
      '@getSession',
      '@getMobile',
      '@getTrafficReportFlowAnalyzerTermsOfService',
      '@getSecurityTermsOfService',
      '@getSettingsBehaviorDetection',
      '@getSecurityTermsOfService',
      '@getThreatDetectionSharedRequests',
      '@getThreatDetectionSharedRequests',
    ])

    // 共有開始ボタンを押下
    cy.get('[data-cy="security-contracts-threat-detection-shared-start-sharing-button"]').click()
    cy.url().should('include', `/tenants/${this.tenantId}/security-contracts/threat-detection-shared/start-sharing`)

    const inputAuthKey = validAuthKey
    cy.get('[data-cy="security-contracts-threat-detection-shared-start-sharing-auth-key-input"]')
      .find('input')
      .type(inputAuthKey)
    cy.get('[data-cy="security-contracts-threat-detection-shared-start-sharing-auth-key-search-button"]')
      .as('searchButton')
      .click()
    cy.wait(['@searchAuthKey', '@getThreatDetectionSharedTenantList', '@getTerminalList'])

    // 課金パターン選択
    cy.get('[data-cy="security-contracts-threat-detection-shared-start-sharing-billing-method"]')
      .find('.radio')
      .each($radio => {
        cy.wrap($radio).should('have.class', 'disabled')
      })
    // 選択済みなことを確認する
    cy.get('[data-cy="security-contracts-threat-detection-shared-start-sharing-billing-method"]')
      .find('.radio.checked')
      .find(`.label.${this.billingMethod}`)
      .should('have.length', 1)

    // 選択可能なルーターなし
    cy.get(
      '[data-cy="security-contracts-threat-detection-shared-start-sharing-terminal-table-select-all-checkbox"]',
    ).should('have.class', 'disabled')
    this.terminals.forEach((terminal: { terminalId: string; threatDetection: TerminalThreatDetectionType }) => {
      cy.get(
        `[data-cy="security-contracts-threat-detection-shared-start-sharing-terminal-table-selector-${terminal.terminalId}"]`,
      ).should('have.class', 'disabled')
    })

    // 「共有開始」ボタンは非活性
    cy.get('[data-cy="security-contracts-threat-detection-shared-start-sharing-submit-button"]').should('be.disabled')
  })

  it('ルーターID列のリンク先がルーター詳細画面になっている', function () {
    cy.visit(`/tenants/${this.tenantId}/security-contracts/threat-detection-shared/start-sharing`)
    cy.wait([
      '@getSession',
      '@getMobile',
      '@getTrafficReportFlowAnalyzerTermsOfService',
      '@getSecurityTermsOfService',
      '@getSettingsBehaviorDetection',
    ])

    cy.get('[data-cy="security-contracts-threat-detection-shared-start-sharing-auth-key-input"]')
      .find('input')
      .type(validAuthKey)
    cy.get('[data-cy="security-contracts-threat-detection-shared-start-sharing-auth-key-search-button"]').click()
    cy.wait(['@searchAuthKey', '@getThreatDetectionSharedTenantList', '@getTerminalList'])

    this.terminals.forEach((terminal: { terminalId: string; terminalType: string }) => {
      const page = terminal.terminalType === TerminalTypes.Rental ? 'terminals' : 'self-terminals'
      cy.contains('a', terminal.terminalId).should(
        'have.attr',
        'href',
        `/tenants/${this.tenantId}/${page}/${terminal.terminalId}`,
      )
    })
  })

  it('ルーターが100件以上あった場合の挙動', function () {
    const authKeyTenantId = this.tenantReferenceAuthKeySearchResponse.tenantId
    // 100件以上のルーターを用意する
    const terminals = Array.from({ length: 101 }, (_, i) => {
      const padNumber = (i + 1).toString().padStart(3, '0')
      const guaranteeId = `G000000${padNumber}`
      return {
        terminalId: `terminal-${padNumber}`,
        resourceStatus: 'active',
        terminalType: 'rentalTerminal',
        guaranteeId,
        primaryCircuit: {
          circuitType: 'guarantee',
          circuitId: guaranteeId,
        },
        threatDetection: {
          threatDetectionPlan: SecurityOptionTypes.Plan12Months,
        },
        flowCollector: {
          flowCollectorPlan: SecurityOptionTypes.NoSubscription,
        },
        trafficReportFlowAnalyzer: {
          trafficReportFlowAnalyzerPlan: TrafficReportFlowAnalyzerPlanTypes.NoSubscription,
        },
      }
    })

    cy.intercept('GET', '**/ztgict/v1/resource-summary/terminals*', {
      body: {
        total: 101,
        limit: 100,
        offset: 0,
        terminals,
      },
    }).as('getTerminalList100')

    cy.visit(`/tenants/${this.tenantId}/security-contracts/threat-detection-shared`)
    cy.wait([
      '@getSession',
      '@getMobile',
      '@getTrafficReportFlowAnalyzerTermsOfService',
      '@getSecurityTermsOfService',
      '@getSettingsBehaviorDetection',
      '@getSecurityTermsOfService',
      '@getThreatDetectionSharedRequests',
      '@getThreatDetectionSharedRequests',
    ])

    // 共有開始ボタンを押下
    cy.get('[data-cy="security-contracts-threat-detection-shared-start-sharing-button"]').click()
    cy.url().should('include', `/tenants/${this.tenantId}/security-contracts/threat-detection-shared/start-sharing`)

    const inputAuthKey = validAuthKey
    cy.get('[data-cy="security-contracts-threat-detection-shared-start-sharing-auth-key-input"]')
      .find('input')
      .type(inputAuthKey)
    cy.get('[data-cy="security-contracts-threat-detection-shared-start-sharing-auth-key-search-button"]')
      .as('searchButton')
      .click()

    cy.wait(['@searchAuthKey', '@getThreatDetectionSharedTenantList', '@getTerminalList100'])
    // 全件選択
    cy.get(
      '[data-cy="security-contracts-threat-detection-shared-start-sharing-terminal-table-select-all-checkbox"]',
    ).click()

    terminals.forEach(({ terminalId }: { terminalId: string }, index) => {
      const disabled = index === terminals.length - 1 // 101件目の端末のみ選択不可
      cy.get(
        `[data-cy="security-contracts-threat-detection-shared-start-sharing-terminal-table-selector-${terminalId}"]`,
      )
        .should(disabled ? 'have.class' : 'not.have.class', 'disabled')
        .and(disabled ? 'not.have.class' : 'have.class', 'checked')
    })

    // 「共有開始」ボタンを押下
    cy.get('[data-cy="security-contracts-threat-detection-shared-start-sharing-submit-button"]').click()
    // APIリクエストの内容を確認
    cy.wait('@postThreatDetectionSharedRequest').then(({ request }) => {
      expect(request.body).to.deep.equal({
        key: inputAuthKey,
        sharedTenantId: authKeyTenantId,
        billingMethod: this.billingMethod,
        terminalIds: terminals.slice(0, 100).map((terminal: { terminalId: string }) => terminal.terminalId),
        requestType: ThreatDetectionSharedRequestTypes.Start,
      })
    })

    // ダイアログの確認
    cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('threatDetectionStartSharing.message.started'))
    // ダイアログを閉じる
    cy.get('[data-cy="notification-dialog-submit-button"]').click()
    cy.get('[data-cy="notification-dialog-text"]').should('not.exist')
    // 初期化を確認
    cy.get('[data-cy="security-contracts-threat-detection-shared-start-sharing-auth-key-input"]')
      .find('input')
      .should('have.value', '')
  })
})
