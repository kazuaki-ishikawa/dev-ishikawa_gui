import type { ThreatDetectionsSharedRequestResponse } from '@app/api/threatDetectionShared/types'
import { generateRandomHex, t } from '@cypress/support/utils'

describe('脅威情報共有 リクエスト確認', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)
  })

  it('セキュリティ規約同意前', function () {
    cy.intercept('GET', '**/ztgict/v1/settings/security', {
      body: { termsOfServiceAccepted: false },
    }).as('getSecurityTermsOfService')
    cy.fixture('security-contracts/threat-detection-shared/request').then(data => {
      // 実行はないが検証のため作成しておく
      cy.intercept('GET', '**/ztgict/v1/threat-detection-shared/requests?*', {
        body: { total: 1, offset: 0, limit: 10, threatDetectionsSharedRequests: [data] },
      }).as('getThreatDetectionSharedRequests')

      cy.visit(
        `/tenants/${this.tenantId}/security-contracts/threat-detection-shared/request?requestId=${data.requestId}`,
      )
      cy.wait([
        '@getSession',
        '@getMobile',
        '@getTrafficReportFlowAnalyzerTermsOfService',
        '@getSecurityTermsOfService',
        '@getSettingsBehaviorDetection',
        '@getSecurityTermsOfService',
      ])

      // セキュリティ同意画面へ遷移ボタンが表示される
      cy.get('[data-cy="security-contracts-threat-detection-shared-request-terms-of-service-button"]').should('exist')
      cy.get('[data-cy="security-contracts-threat-detection-shared-request-terms-of-service-message"]').should('exist')

      // GETが実行されないのでデータ表示なし
      cy.get(`[data-cy="security-contracts-threat-detection-shared-request-${data.requestId}"]`).should('not.exist')

      // ボタンの状態確認
      cy.get('[data-cy="security-contracts-threat-detection-shared-request-submit-button"]')
        .should('have.text', t('threatDetectionShared.reject'))
        .should('be.disabled')
    })
  })

  it('[受信トレイ] 承認', function () {
    cy.fixture('security-contracts/threat-detection-shared/requests').then(data => {
      const threatDetectionsSharedRequests = data.threatDetectionsSharedRequests.map(
        (request: ThreatDetectionsSharedRequestResponse) => {
          return {
            ...request,
            requestDirection: 'received',
          }
        },
      )
      const checkedRequestIdList = threatDetectionsSharedRequests
        .filter(
          (request: ThreatDetectionsSharedRequestResponse) =>
            request.status === 'pendingApproval' && request.requestType === 'threatDetectionShareRequest',
        )
        .map((request: ThreatDetectionsSharedRequestResponse) => request.requestId)
      const selectRequestId = checkedRequestIdList[0]

      cy.intercept('GET', '**/ztgict/v1/threat-detection-shared/requests?*', {
        body: { ...data, threatDetectionsSharedRequests },
      }).as('getThreatDetectionSharedRequests')
      const found = threatDetectionsSharedRequests.find(
        (request: ThreatDetectionsSharedRequestResponse) => request.requestId === selectRequestId,
      )
      cy.intercept('PUT', `**/ztgict/v1/threat-detection-shared/requests/${selectRequestId}`, {
        body: { ...found, status: 'approved' },
      }).as('putRequest')

      cy.visit(`/tenants/${this.tenantId}/security-contracts/threat-detection-shared?requestDirection=received`)
      cy.wait([
        '@getSession',
        '@getMobile',
        '@getTrafficReportFlowAnalyzerTermsOfService',
        '@getSecurityTermsOfService',
        '@getSettingsBehaviorDetection',
        '@getSecurityTermsOfService',
        '@getThreatDetectionSharedRequests', // 全件取得用
        '@getThreatDetectionSharedRequests', // テーブル用
      ])

      // セキュリティ同意画面へ遷移ボタンが表示されない
      cy.get('[data-cy="security-contracts-threat-detection-shared-request-terms-of-service-button"]').should(
        'not.exist',
      )
      cy.get('[data-cy="security-contracts-threat-detection-shared-request-terms-of-service-message"]').should(
        'not.exist',
      )

      // 全件選択
      cy.get('[data-cy="security-contracts-threat-detection-shared-action-all-checkbox"]').click()
      // 承認ボタンを押下する
      cy.get('[data-cy="security-contracts-threat-detection-shared-approve-button"]').click()
      cy.wait('@getSecurityTermsOfService')
      cy.wait('@getThreatDetectionSharedRequests').then(req => {
        expect(req.request.query).to.deep.eq({ requestId: checkedRequestIdList, limit: '100', offset: '0' })
      })
      // URL確認
      const query = `?type=approve&requestId=${checkedRequestIdList.join('&requestId=')}`
      cy.url().should('include', `/tenants/${this.tenantId}/security-contracts/threat-detection-shared/request${query}`)

      // リクエスト確認画面の初期値をチェック
      threatDetectionsSharedRequests.forEach((request: ThreatDetectionsSharedRequestResponse) => {
        const selectable = request.status === 'pendingApproval' && request.requestType === 'threatDetectionShareRequest'
        // status=pendingApproval かつ requestType=threatDetectionShareRequest の場合はswitchが有効（true）そうでない場合は無効
        cy.get(`[data-cy="security-contracts-threat-detection-shared-request-${request.requestId}"]`)
          .find('.v-switch')
          .find('input[type="checkbox"]')
          .should(selectable ? 'not.be.disabled' : 'be.disabled')
          .and(selectable ? 'be.checked' : 'not.be.checked')
      })
      // ボタンの初期値
      cy.get('[data-cy="security-contracts-threat-detection-shared-request-cancel-button"]').should(
        'have.text',
        t('common.cancel'),
      )
      cy.get('[data-cy="security-contracts-threat-detection-shared-request-submit-button"]')
        .as('submitButton')
        .should('have.text', t('threatDetectionShared.approve'))
        .and('not.be.disabled')

      // チェックを全部外すと承認ボタンが非活性になる
      checkedRequestIdList.forEach((requestId: string) => {
        cy.get(`[data-cy="security-contracts-threat-detection-shared-request-${requestId}"]`).find('.v-switch').click()
      })
      cy.get('@submitButton').should('be.disabled')

      // 1件だけ選択してPUT実行
      cy.get(`[data-cy="security-contracts-threat-detection-shared-request-${selectRequestId}"]`)
        .find('.v-switch')
        .click()
      cy.get('@submitButton').click()
      cy.wait('@putRequest').then(req => {
        expect(req.request.body).to.deep.eq({ action: 'approve' })
      })

      // ダイアログメッセージ確認して閉じる
      cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('threatDetectionShared.message.approved'))
      cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.close')).click()
      cy.get('[data-cy="notification-dialog-text"]').should('not.exist')
      // 画面遷移なし
      cy.url().should('include', `/tenants/${this.tenantId}/security-contracts/threat-detection-shared/request${query}`)

      // 承認済みのリクエストはswitchが非活性になってチェックが外れることを確認する
      cy.get(`[data-cy="security-contracts-threat-detection-shared-request-${selectRequestId}"]`)
        .find('.v-switch')
        .find('input[type="checkbox"]')
        .should('be.disabled')
        .and('not.be.checked')
      cy.get('@submitButton').should('be.disabled')
    })
  })

  it('[受信トレイ] 却下', function () {
    cy.fixture('security-contracts/threat-detection-shared/requests').then(data => {
      // 3件に固定
      const threatDetectionsSharedRequests = data.threatDetectionsSharedRequests
        .slice(-3)
        .map((request: ThreatDetectionsSharedRequestResponse, index: number) => {
          return {
            ...request,
            requestDirection: 'received',
            status: 'pendingApproval',
            // 却下対象のリクエストのうち1件は停止リクエストにする
            requestType: index === 0 ? 'threatDetectionStopShareRequest' : 'threatDetectionShareRequest',
          }
        })
      const checkedRequestIdList = threatDetectionsSharedRequests
        .slice(-2)
        .map((request: ThreatDetectionsSharedRequestResponse) => request.requestId)

      cy.intercept('GET', '**/ztgict/v1/threat-detection-shared/requests?*', {
        body: { ...data, threatDetectionsSharedRequests },
      }).as('getThreatDetectionSharedRequests')
      checkedRequestIdList.forEach((requestId: string) => {
        cy.intercept('PUT', `**/ztgict/v1/threat-detection-shared/requests/${requestId}`, {
          delay: 1000, // loading 状態の再現のため、APIのレスポンスに遅延を加える
        }).as(`putRequest${requestId}`)
      })

      cy.visit(`/tenants/${this.tenantId}/security-contracts/threat-detection-shared?requestDirection=received`)
      cy.wait([
        '@getSession',
        '@getMobile',
        '@getTrafficReportFlowAnalyzerTermsOfService',
        '@getSecurityTermsOfService',
        '@getSettingsBehaviorDetection',
        '@getSecurityTermsOfService',
        '@getThreatDetectionSharedRequests', // 全件取得用
        '@getThreatDetectionSharedRequests', // テーブル用
      ])

      // 全件選択
      cy.get('[data-cy="security-contracts-threat-detection-shared-action-all-checkbox"]').click()

      // 却下ボタンを押下する
      cy.get('[data-cy="security-contracts-threat-detection-shared-reject-button"]').should('not.be.disabled').click()
      cy.wait('@getSecurityTermsOfService')
      cy.wait('@getThreatDetectionSharedRequests').then(req => {
        expect(req.request.query).to.deep.eq({ requestId: checkedRequestIdList, limit: '100', offset: '0' })
      })
      // URL確認
      const query = `?type=reject&requestId=${checkedRequestIdList.join('&requestId=')}`
      cy.url().should('include', `/tenants/${this.tenantId}/security-contracts/threat-detection-shared/request${query}`)

      // そのまま却下ボタンを押下する
      cy.get('[data-cy="security-contracts-threat-detection-shared-request-submit-button"]')
        .as('submitButton')
        .should('have.text', t('threatDetectionShared.reject'))
        .click()

      // PUT実行中はボタンとswitchが非活性になる
      cy.get('@submitButton').should('be.disabled')
      checkedRequestIdList.forEach((requestId: string) => {
        cy.get(`[data-cy="security-contracts-threat-detection-shared-request-${requestId}"]`)
          .find('.v-switch')
          .find('input[type="checkbox"]')
          .should('be.disabled')
      })
      // request.action の確認
      checkedRequestIdList.forEach((requestId: string) => {
        cy.wait(`@putRequest${requestId}`).then(req => {
          expect(req.request.body).to.deep.eq({ action: 'reject' })
        })
      })

      // ダイアログメッセージ確認して閉じる
      cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('threatDetectionShared.message.rejected'))
      cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.close')).click()
      cy.get('[data-cy="notification-dialog-text"]').should('not.exist')
      // 画面遷移なし
      cy.url().should('include', `/tenants/${this.tenantId}/security-contracts/threat-detection-shared/request${query}`)
    })
  })

  it('[受信トレイ] 却下失敗', function () {
    cy.fixture('security-contracts/threat-detection-shared/requests').then(data => {
      // 3件に固定
      const threatDetectionsSharedRequests = data.threatDetectionsSharedRequests
        .slice(-3)
        .map((request: ThreatDetectionsSharedRequestResponse) => {
          return {
            ...request,
            requestDirection: 'received',
            status: 'pendingApproval',
            requestType: 'threatDetectionShareRequest',
          }
        })

      const failedRequestId = threatDetectionsSharedRequests[0].requestId

      cy.intercept('GET', '**/ztgict/v1/threat-detection-shared/requests?*', {
        body: { ...data, threatDetectionsSharedRequests },
      }).as('getThreatDetectionSharedRequests')

      // PUTリクエストのうち1件は失敗するようにする
      threatDetectionsSharedRequests.slice(-3).forEach((request: ThreatDetectionsSharedRequestResponse) => {
        cy.intercept('PUT', `**/ztgict/v1/threat-detection-shared/requests/${request.requestId}`, {
          statusCode: request.requestId === failedRequestId ? 500 : 200,
          body: { ...request, status: request.requestId === failedRequestId ? 'pendingApproval' : 'rejected' },
        }).as(`putRequest${request.requestId}`)
      })

      cy.visit(`/tenants/${this.tenantId}/security-contracts/threat-detection-shared?requestDirection=received`)
      cy.wait([
        '@getSession',
        '@getMobile',
        '@getTrafficReportFlowAnalyzerTermsOfService',
        '@getSecurityTermsOfService',
        '@getSettingsBehaviorDetection',
        '@getSecurityTermsOfService',
        '@getThreatDetectionSharedRequests', // 全件取得用
        '@getThreatDetectionSharedRequests', // テーブル用
      ])

      // 全件選択
      cy.get('[data-cy="security-contracts-threat-detection-shared-action-all-checkbox"]').click()

      // 却下ボタンを押下する
      cy.get('[data-cy="security-contracts-threat-detection-shared-reject-button"]').should('not.be.disabled').click()
      cy.wait(['@getSecurityTermsOfService', '@getThreatDetectionSharedRequests'])

      // そのまま却下ボタンを押下する
      cy.get('[data-cy="security-contracts-threat-detection-shared-request-submit-button"]')
        .as('submitButton')
        .should('have.text', t('threatDetectionShared.reject'))
        .click()

      cy.wait(threatDetectionsSharedRequests.map(({ requestId }: { requestId: string }) => `@putRequest${requestId}`))

      // 失敗メッセージが表示される
      cy.get('[data-cy="notification-dialog-text"]').should(
        'have.text',
        t('threatDetectionShared.message.requestFailed', {
          action: t('threatDetectionShared.reject'),
          requestId: failedRequestId,
        }),
      )
      cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.close')).click()
      cy.get('[data-cy="notification-dialog-text"]').should('not.exist')

      // 失敗したリクエストはそのまま、成功したリクエストはチェックが外れて非活性なことを確認する
      threatDetectionsSharedRequests.forEach(({ requestId }: { requestId: string }) => {
        cy.get(`[data-cy="security-contracts-threat-detection-shared-request-${requestId}"]`)
          .find('.v-switch')
          .find('input[type="checkbox"]')
          .should(requestId === failedRequestId ? 'not.be.disabled' : 'be.disabled')
          .and(requestId === failedRequestId ? 'be.checked' : 'not.be.checked')
      })
      cy.get('@submitButton').should('not.be.disabled')
    })
  })
})
