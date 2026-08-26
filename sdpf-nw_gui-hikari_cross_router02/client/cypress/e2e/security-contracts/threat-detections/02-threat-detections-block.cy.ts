import { generateRandomHex, t } from '@cypress/support/utils'
import { IpTypes, PortTypes, ProtocolTypes } from '@app/api/constants'
import type { ThreatDetectionsList } from '@app/api/threatDetections/types'

const SELECTED_TERMINAL_ID = 'Z100000002'
const CommonThreatDetectionsIntercepter = {
  method: 'GET',
  pathname: '**/ztgict/v1/threat-detections',
  query: {
    sortKey: 'timestamp',
    direction: 'desc',
    startTime: '2025-07-31T09:00:00+09:00',
    endTime: '2025-08-01T09:00:00+09:00',
  },
}
const EXPECTED_THREAT_DETECTION_FILTERS_REQUEST = {
  filters: [
    {
      threatDestination: '199.116.37.11/32',
      sourceIp: IpTypes.Any,
      destinationPort: PortTypes.Any,
      sourcePort: PortTypes.Any,
      protocol: ProtocolTypes.Any,
    },
    {
      threatDestination: 'example.com',
      sourceIp: IpTypes.Any,
      destinationPort: PortTypes.Any,
      sourcePort: PortTypes.Any,
      protocol: ProtocolTypes.Any,
    },
    {
      threatDestination: 'Suspicious.Signature.001',
      sourceIp: IpTypes.Any,
      destinationPort: PortTypes.Any,
      sourcePort: PortTypes.Any,
      protocol: ProtocolTypes.Any,
    },
  ],
}

describe('脅威検知一覧 - 遮断設定', () => {
  beforeEach(function () {
    cy.clock(new Date(CommonThreatDetectionsIntercepter.query.endTime), ['Date'])

    this.tenantId = generateRandomHex(32)
    this.visitUrl = `/tenants/${this.tenantId}/security-contracts/threat-detections`
    cy.intercept('GET', '**/ztgict/v1/resource-summary/terminals?*', {
      fixture: 'security-contracts/threat-detections/terminals',
    }).as('getTerminalList')
    cy.intercept('GET', '**/ztgict/v1/resource-summary/ipoe?*', { fixture: 'ipoes/list' }).as('getIpoeList')
    cy.intercept('GET', '**/ztgict/v1/resource-summary/guarantees?*', { fixture: 'guarantees/circuits/list' }).as(
      'getGuaranteeList',
    )
    cy.fixture('security-contracts/threat-detections/list').then((body: ThreatDetectionsList) => {
      const threatDetections = body.threatDetections.filter(
        b => b.blockingStatus === 'noBlocked' && b.terminalId === SELECTED_TERMINAL_ID,
      )
      this.threatDetectionFiltersRequest = EXPECTED_THREAT_DETECTION_FILTERS_REQUEST
      // 脅威検知一覧画面のテーブルデータ
      cy.intercept(CommonThreatDetectionsIntercepter, { body }).as('getThreatDetectionsTableList')
      // 遮断設定画面のテーブルデータ
      cy.intercept(
        {
          ...CommonThreatDetectionsIntercepter,
          query: {
            ...CommonThreatDetectionsIntercepter.query,
            terminalId: SELECTED_TERMINAL_ID,
            blockingStatus: 'noBlocked',
          },
        },
        { body: { ...body, threatDetections } },
      ).as('getThreatDetectionsTableListOnBlock')

      cy.intercept('PUT', `**/ztgict/v1/threat-detection-filters/${SELECTED_TERMINAL_ID}`, {
        body: EXPECTED_THREAT_DETECTION_FILTERS_REQUEST,
      }).as('putThreatDetectionFilters')
    })
  })

  it('セキュリティ規約同意前', function () {
    cy.intercept('GET', '**/ztgict/v1/settings/security', {
      body: { termsOfServiceAccepted: false },
    }).as('getSecurityTermsOfService')

    cy.visit(`${this.visitUrl}/block`)
    cy.wait(['@getSession', '@getMobile', '@getTrafficReportFlowAnalyzerTermsOfService', '@getSecurityTermsOfService'])
    cy.wait(['@getTerminalList', '@getSecurityTermsOfService'])

    // セキュリティ同意画面へ遷移ボタンが表示される
    cy.get('[data-cy="security-contracts-threat-detections-block-terms-of-service-button"]').should('exist')

    // 共通コンポーネントの非表示要素
    cy.get('[data-cy="threat-detection-table-download-button"]').should('not.exist')
    cy.get('[data-cy="security-help-desk-button"]').should('not.exist')

    // ボタンの状態確認
    cy.get('[data-cy="search-filter-clear-button"]').should('be.disabled')
    cy.get('[data-cy="search-filter-search-button"]').should('be.disabled')
  })

  it('action=block 以外の要素はチェックボックスが disabled になる', function () {
    const FILTER_TERMINAL_ID = 'Z100000003'
    cy.fixture('security-contracts/threat-detections/list').then((body: ThreatDetectionsList) => {
      const threatDetections = body.threatDetections.filter(
        b => b.blockingStatus === 'noBlocked' && b.terminalId === FILTER_TERMINAL_ID,
      )
      // 遮断設定画面のテーブルデータ
      cy.intercept(
        {
          ...CommonThreatDetectionsIntercepter,
          query: {
            ...CommonThreatDetectionsIntercepter.query,
            terminalId: FILTER_TERMINAL_ID,
            blockingStatus: 'noBlocked',
          },
        },
        { body: { ...body, threatDetections } },
      ).as('getThreatDetectionsTableListOnBlock')
    })

    // 遮断設定画面に遷移する
    cy.visit(`${this.visitUrl}/block?terminalId=${FILTER_TERMINAL_ID}`)
    cy.wait(['@getSession', '@getMobile', '@getTrafficReportFlowAnalyzerTermsOfService', '@getSecurityTermsOfService'])
    cy.wait(['@getTerminalList', '@getSecurityTermsOfService', '@getThreatDetectionsTableListOnBlock'])

    cy.get('[data-cy="threat-detection-table-select-all-checkbox"]').should('have.class', 'disabled')
    cy.get('[data-cy="threat-detection-table-checkbox"]')
      .should('have.length', 1)
      .eq(0)
      .should('have.class', 'disabled')
  })

  it('遮断設定実行', function () {
    // 脅威検知一覧画面に遷移する
    cy.visit(this.visitUrl)
    cy.wait(['@getSession', '@getMobile', '@getTrafficReportFlowAnalyzerTermsOfService', '@getSecurityTermsOfService'])
    cy.wait([
      '@getIpoeList',
      '@getGuaranteeList',
      '@getTerminalList',
      '@getSecurityTermsOfService',
      '@getThreatDetectionsTableList',
    ])
    // セキュリティ同意画面へ遷移ボタンが非表示
    cy.get('[data-cy="security-contracts-threat-detections-block-terms-of-service-button"]').should('not.exist')

    // テーブルのボタン確認
    cy.get('[data-cy="threat-detection-table-confirm-blocking-status-button"]').should('have.length', 2)
    cy.get('[data-cy="threat-detection-table-block-button"]').should('have.length', 5).eq(0).click()

    // 遮断設定画面に遷移する
    cy.wait(['@getTerminalList', '@getSecurityTermsOfService', '@getThreatDetectionsTableListOnBlock'])
    cy.url().should('eq', `${Cypress.config().baseUrl}${this.visitUrl}/block?terminalId=${SELECTED_TERMINAL_ID}`)

    // 遮断確認ボタンが非活性になってる
    cy.get('[data-cy="threat-detections-block-submit-button"]')
      .as('submitButton')
      .should('have.text', t('threatDetections.confirmBlocking'))
      .should('be.disabled')

    // 全件選択をして確認ボタンを押す
    cy.get('[data-cy="threat-detection-table-select-all-checkbox"]').click()
    cy.get('@submitButton').click()

    // 遮断実行
    cy.get('@submitButton').should('have.text', t('threatDetections.blocking')).click()
    cy.wait('@putThreatDetectionFilters').then(req => {
      expect(req.request.body).to.deep.equal(this.threatDetectionFiltersRequest)
    })
    // 脅威権威一覧画面に戻る
    cy.wait([
      '@getIpoeList',
      '@getGuaranteeList',
      '@getTerminalList',
      '@getSecurityTermsOfService',
      '@getThreatDetectionsTableList',
    ])
    cy.url().should('eq', `${Cypress.config().baseUrl}${this.visitUrl}`)

    // ダイアログの確認
    cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('threatDetections.message.acceptedBlocking'))
    cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
    cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.close')).click()
    cy.get('[data-cy="notification-dialog-text"]').should('not.exist')
  })
})
