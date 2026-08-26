import { OperationStatusTypes } from '@app/api/threatDetectionFilters/constants'
import type { ThreatDetectionFiltersResponse } from '@app/api/threatDetectionFilters/types'
import { generateRandomHex, t } from '@cypress/support/utils'

describe('遮断設定画面', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)
    cy.fixture('threat-detection-filters/list.json').then(data => {
      this.threatDetectionFilters = data.filters
    })
    cy.fixture('threat-detection-filters/unblock.json').then(data => {
      this.unblockRequestList = data
    })
    cy.fixture('threat-detection-filters/get-filter-counts.json').then(data => {
      this.postFilterCountsRequest = data
    })
    cy.intercept('GET', '**/ztgict/v1/settings/mobile', {
      fixture: 'mobile/accepted-mobile',
    }).as('getMobile')
    cy.intercept('GET', '**/ztgict/v1/settings/security', {
      body: { termsOfServiceAccepted: true },
    }).as('getSecurityTermsOfService')
    cy.intercept('GET', '**/ztgict/v1/settings/traffic-report-flow-analyzer*', {
      body: { termsOfServiceAccepted: true },
    }).as('getTrafficReportFlowAnalyzerSettings')
    cy.intercept('GET', '**/ztgict/v1/resource-summary/terminals*', {
      fixture: 'threat-detection-filters/terminals',
    }).as('getTerminalList')
    cy.intercept('GET', '**/ztgict/v1/threat-detection-filters*', {
      fixture: 'threat-detection-filters/list',
    }).as('getThreatDetectionFiltersList')
  })

  it('セキュリティ利用契約同意前', function () {
    cy.intercept('GET', '**/ztgict/v1/settings/security', {
      body: { termsOfServiceAccepted: false },
    }).as('getSecurityTermsOfService')

    cy.visit('/security-contracts/threat-detection-filters')
    cy.visit(`/tenants/${this.tenantId}/security-contracts/threat-detection-filters`)
    cy.wait(['@getMobile', '@getTrafficReportFlowAnalyzerSettings', '@getTerminalList', '@getSecurityTermsOfService'])

    // セキュリティ利用契約同意前のボタンの確認
    cy.get('[data-cy="security-contracts-threat-detection-filters-terms-of-service-button"]').should('exist')
  })

  it('遮断解除', function () {
    this.unblockRequestList.forEach((data: { terminalId: string; filterIds: string[] }) => {
      cy.intercept('DELETE', `**/ztgict/v1/threat-detection-filters/${data.terminalId}`, {}).as(
        `unblockFilters_${data.terminalId}`,
      )
    })
    cy.visit(`/tenants/${this.tenantId}/security-contracts/threat-detection-filters`)
    cy.wait(['@getMobile', '@getTrafficReportFlowAnalyzerSettings', '@getTerminalList', '@getSecurityTermsOfService'])
    // getThreatDetectionFiltersList のみ実行タイミングが遅いため wait を分ける
    cy.wait('@getThreatDetectionFiltersList')

    // 遮断解除ボタンと遮断回数データ更新ボタンの存在確認と非活性確認
    cy.get('[data-cy="security-contracts-threat-detection-filters-unblock-button"]')
      .should('have.text', t('threatDetectionFilters.unblock'))
      .as('unblockButton')
      .should('exist')
      .should('be.disabled')
    cy.get('[data-cy="security-contracts-threat-detection-filters-get-filter-counts-button"]')
      .should('have.text', t('threatDetectionFilters.getFilterCount'))
      .should('exist')
      .should('be.disabled')
    // セキュリティヘルプデスクボタンの表示確認
    cy.get('[data-cy="security-help-desk-button"]').should('exist').should('not.be.disabled')

    // 選択できるチェックボックスを全てチェック
    this.threatDetectionFilters.forEach((filter: ThreatDetectionFiltersResponse) => {
      // 非活性化すべきものが非活性化されているか
      const selectable = [OperationStatusTypes.BlockCompleted, OperationStatusTypes.UnblockFailed].includes(
        filter.operationStatus,
      )
      if (selectable) {
        cy.get(`[data-cy="security-contracts-threat-detection-filters-selector-${filter.filterId}"]`)
          .should('not.have.class', 'disabled')
          .click()
      } else {
        cy.get(`[data-cy="security-contracts-threat-detection-filters-selector-${filter.filterId}"]`).should(
          'have.class',
          'disabled',
        )
      }
    })

    // 遮断解除ボタンをクリック
    cy.get('@unblockButton').click()

    // 遮断解除の確認ダイアログの表示、文言、ボタンの確認
    cy.get('.dialog-card-content').should('have.text', t('threatDetectionFilters.message.confirmUnblocking'))
    cy.get('.dialog-base-cancel-button').should('have.text', t('common.cancel'))
    cy.get('.dialog-base-submit-button').should('have.text', t('threatDetectionFilters.executeUnblocking')).click()

    // terminal の件数分確認する
    this.unblockRequestList.forEach((data: { terminalId: string; filterIds: string[] }) => {
      const request = {
        filterIds: data.filterIds,
      }
      cy.wait(`@unblockFilters_${data.terminalId}`).then(req => {
        const stringify = JSON.stringify(request)
        expect(req.request.body).to.deep.equal(JSON.parse(stringify))
      })
    })

    // 遮断一覧取得APIの再実行
    cy.wait('@getThreatDetectionFiltersList')
    cy.url().should(
      'eq',
      `${Cypress.config().baseUrl}/tenants/${this.tenantId}/security-contracts/threat-detection-filters`,
    )

    // 遮断解除完了ダイアログの確認
    cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('threatDetectionFilters.message.unblocked'))
    cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
    cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.close')).click()
    cy.get('[data-cy="notification-dialog-text"]').should('not.exist')

    // チェックボックスが全て空になっていることを確認
    this.threatDetectionFilters.forEach((filter: ThreatDetectionFiltersResponse) => {
      cy.get(`[data-cy="security-contracts-threat-detection-filters-selector-${filter.filterId}"]`).should(
        'not.have.class',
        'checked',
      )
    })
  })

  it('遮断回数データ更新', function () {
    cy.intercept('POST', '**/ztgict/v1/terminals-bulk/get-filter-counts', {}).as('postFilterCounts')

    cy.visit(`/tenants/${this.tenantId}/security-contracts/threat-detection-filters`)
    cy.wait(['@getMobile', '@getTrafficReportFlowAnalyzerSettings', '@getTerminalList', '@getSecurityTermsOfService'])
    // getThreatDetectionFiltersList のみ実行タイミングが遅いため wait を分ける
    cy.wait('@getThreatDetectionFiltersList')

    // 遮断回数データ更新ボタンの取得
    cy.get('[data-cy="security-contracts-threat-detection-filters-get-filter-counts-button"]').as(
      'postFilterCountsButton',
    )

    // 全選択チェックボックスをクリック
    cy.get('[data-cy="security-contracts-threat-detection-filters-select-all"]')
      .should('not.have.class', 'disabled')
      .click()

    // 遮断回数データ更新ボタンをクリック
    cy.get('@postFilterCountsButton').click()

    // 遮断回数データ更新の確認ダイアログの表示、文言、ボタンの確認
    cy.get('.dialog-card-content').should('have.text', t('threatDetectionFilters.message.confirmGettingFilterCounts'))
    cy.get('.dialog-base-cancel-button').should('have.text', t('common.cancel'))
    cy.get('.dialog-base-submit-button').should('have.text', t('threatDetectionFilters.getFilterCountExecute')).click()

    // 遮断回数データ更新APIのリクエスト確認
    cy.wait('@postFilterCounts').then(req => {
      const stringify = JSON.stringify(this.postFilterCountsRequest)
      expect(req.request.body).to.deep.equal(JSON.parse(stringify))
    })

    // 遮断一覧取得APIの再実行
    cy.wait('@getThreatDetectionFiltersList')
    cy.url().should(
      'eq',
      `${Cypress.config().baseUrl}/tenants/${this.tenantId}/security-contracts/threat-detection-filters`,
    )

    // 遮断回数データ更新完了ダイアログの確認
    cy.get('[data-cy="notification-dialog-text"]').should(
      'have.text',
      t('threatDetectionFilters.message.getFilterCount'),
    )
    cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
    cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.close'))
    // 閉じるボタン押下
    cy.get('.dialog-card-close').click()
    cy.get('[data-cy="notification-dialog-text"]').should('not.exist')

    // チェックボックスが全て空になっていることを確認
    this.threatDetectionFilters.forEach((filter: ThreatDetectionFiltersResponse) => {
      cy.get(`[data-cy="security-contracts-threat-detection-filters-selector-${filter.filterId}"]`).should(
        'not.have.class',
        'checked',
      )
    })
  })
})
