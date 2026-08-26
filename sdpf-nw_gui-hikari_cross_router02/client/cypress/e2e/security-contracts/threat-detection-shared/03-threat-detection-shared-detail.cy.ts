import {
  ThreatDetectionSharedRequestTypes,
  ThreatDetectionSharedRequestStatusTypes,
  ThreatDetectionSharedRequestDirectionTypes,
  ThreatDetectionSharedBillingMethodTypes,
} from '@app/api/threatDetectionShared/constants'
import { generateRandomHex, t } from '@cypress/support/utils'

const TestData = Object.values(ThreatDetectionSharedRequestDirectionTypes).flatMap(requestDirection =>
  Object.values(ThreatDetectionSharedRequestTypes).flatMap(requestType =>
    Object.values(ThreatDetectionSharedRequestStatusTypes).map((status, index) => {
      const requestTypeLabel = t(`threatDetectionShared.requestType.${requestType}`)
      const requestDirectionLabel =
        requestDirection === ThreatDetectionSharedRequestDirectionTypes.Received
          ? '受信リクエスト詳細'
          : '送信リクエスト詳細'
      return {
        requestType,
        status,
        requestDirection,
        requestDirectionLabel,
        billingMethod:
          requestType === ThreatDetectionSharedRequestTypes.Stop
            ? undefined
            : Object.values(ThreatDetectionSharedBillingMethodTypes)[index % 3],
        name: `[${requestDirectionLabel}] 依頼内容が${requestTypeLabel}、レスポンスステータスが${status}の詳細表示`,
      }
    }),
  ),
)

describe('脅威情報共有 リクエスト詳細', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)
    this.requestId = generateRandomHex(32)

    cy.fixture('contractor/detail').then(body => {
      this.contractor = body
      cy.intercept('GET', '**/ztgict/v1/settings/contractor', { body }).as('getContractor')
    })
  })
  TestData.forEach(({ requestType, status, requestDirection, requestDirectionLabel, billingMethod, name }) => {
    it(name, function () {
      cy.fixture('security-contracts/threat-detection-shared/request').then(data => {
        // テストデータの作成
        cy.intercept('GET', `**/ztgict/v1/threat-detection-shared/requests/${this.requestId}`, {
          body: { ...data, requestId: this.requestId, status, requestType, requestDirection, billingMethod },
        }).as('getThreatDetectionSharedRequest')

        // 画面に遷移
        cy.visit(`/tenants/${this.tenantId}/security-contracts/threat-detection-shared/${this.requestId}`)
        cy.wait(['@getThreatDetectionSharedRequest', '@getContractor'])

        // タイトル
        cy.get('[data-cy="inner-card-title"]').eq(0).should('have.text', requestDirectionLabel)

        // 共有開始・共有停止のラベル
        const isStopRequest = requestType === ThreatDetectionSharedRequestTypes.Stop
        const updateTimeLabel = isStopRequest ? '共有停止日時' : '共有開始日時'
        const updateTimeValue =
          isStopRequest || status === ThreatDetectionSharedRequestStatusTypes.Approved
            ? new Date(data.updateTime).toLocaleString('ja-JP', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })
            : ''
        cy.get('[data-cy="request-detail-update-time-label"]').should('have.text', updateTimeLabel)
        cy.get('[data-cy="request-detail-update-time-value"]').should('have.text', updateTimeValue)

        // ステータス
        const statusValue =
          requestType === ThreatDetectionSharedRequestTypes.Stop
            ? '停止済み'
            : t(`threatDetectionShared.status.${status}`)

        cy.get('[data-cy="request-detail-status-value"]').should('have.text', statusValue)

        // 課金パターン
        cy.get('[data-cy="request-detail-billing-method-value"]').should(
          'have.text',
          !billingMethod
            ? t('threatDetectionShared.message.billingMethodNotFound')
            : t(`threatDetectionShared.billingMethod.${billingMethod}`),
        )

        // 承認対象回線の提供社名（テナントID）の表示
        const isReceived = requestDirection === ThreatDetectionSharedRequestDirectionTypes.Received
        const contractorName = isReceived
          ? `${data.contractorName}（${data.sharedTenantId}）`
          : `${this.contractor?.name}（${this.tenantId}）`
        cy.get('[data-cy="request-detail-terminals-table"]').within(() => {
          cy.get('.row').should('have.length', data.terminals.length)
          cy.get('.row').each($el => cy.wrap($el).find('div').eq(1).should('have.text', contractorName))
        })

        // 「戻る」ボタンは常に表示
        cy.get('[data-cy="security-contracts-threat-detection-shared-id-return-button"]')
          .should('exist')
          .and('have.text', '戻る')

        if (isStopRequest || status !== ThreatDetectionSharedRequestStatusTypes.PendingApproval) {
          // ステータスが PendingApproval 以外の場合、承認・却下・取消ボタンが表示されないこと
          cy.get('[data-cy="security-contracts-threat-detection-shared-id-reject-button"]').should('not.exist')
          cy.get('[data-cy="security-contracts-threat-detection-shared-id-approve-button"]').should('not.exist')
          cy.get('[data-cy="security-contracts-threat-detection-shared-id-cancel-button"]').should('not.exist')
        } else if (isReceived) {
          // 受信リクエストの場合、承認・却下ボタンが表示される
          cy.get('[data-cy="security-contracts-threat-detection-shared-id-reject-button"]')
            .should('exist')
            .and('have.text', '却下')
          cy.get('[data-cy="security-contracts-threat-detection-shared-id-approve-button"]')
            .should('exist')
            .and('have.text', '承認')
          cy.get('[data-cy="security-contracts-threat-detection-shared-id-cancel-button"]').should('not.exist')
        } else {
          // 送信リクエストの場合、取下ボタンが表示される
          cy.get('[data-cy="security-contracts-threat-detection-shared-id-reject-button"]').should('not.exist')
          cy.get('[data-cy="security-contracts-threat-detection-shared-id-approve-button"]').should('not.exist')
          cy.get('[data-cy="security-contracts-threat-detection-shared-id-cancel-button"]')
            .should('exist')
            .and('have.text', '取下')
        }
      })
    })
  })

  it('[受信リクエスト詳細] 承認', function () {
    const requestType = ThreatDetectionSharedRequestTypes.Start
    const status = ThreatDetectionSharedRequestStatusTypes.PendingApproval
    const requestDirection = ThreatDetectionSharedRequestDirectionTypes.Received

    cy.fixture('security-contracts/threat-detection-shared/request').then(data => {
      cy.intercept('GET', `**/ztgict/v1/threat-detection-shared/requests/${this.requestId}`, {
        body: { ...data, requestId: this.requestId, status, requestType, requestDirection },
      }).as('getThreatDetectionSharedRequest')
      cy.intercept('PUT', `**/ztgict/v1/threat-detection-shared/requests/${this.requestId}`, {
        body: {
          ...data,
          requestId: this.requestId,
          status: ThreatDetectionSharedRequestStatusTypes.Approved,
          requestType,
          requestDirection,
        },
      }).as('putRequest')

      // 画面に遷移
      cy.visit(`/tenants/${this.tenantId}/security-contracts/threat-detection-shared/${this.requestId}`)
      cy.wait(['@getThreatDetectionSharedRequest', '@getContractor'])

      cy.get('[data-cy="security-contracts-threat-detection-shared-id-approve-button"]').as('approveButton').click()
      cy.wait('@putRequest').then(req => {
        expect(req.request.body).to.deep.equal({ action: 'approve' })
      })

      // ダイアログ文言確認
      cy.get('[data-cy="notification-dialog-text"]').should(
        'have.text',
        'リクエストを承認しました。\n承認したリクエストに対し脅威情報共有機能を開始します。',
      )
      // ダイアログを閉じる
      cy.get('[data-cy="notification-dialog-submit-button"]').click()
      cy.get('[data-cy="notification-dialog-text"]').should('not.exist')

      // ステータスが変更になる
      cy.get('[data-cy="request-detail-status-value"]').should('have.text', '承認済み')
      // ボタンが非表示になる
      cy.get('@approveButton').should('not.exist')
    })
  })

  it('[受信リクエスト詳細] 却下', function () {
    const requestType = ThreatDetectionSharedRequestTypes.Start
    const status = ThreatDetectionSharedRequestStatusTypes.PendingApproval
    const requestDirection = ThreatDetectionSharedRequestDirectionTypes.Received

    cy.fixture('security-contracts/threat-detection-shared/request').then(data => {
      cy.intercept('GET', `**/ztgict/v1/threat-detection-shared/requests/${this.requestId}`, {
        body: { ...data, requestId: this.requestId, status, requestType, requestDirection },
      }).as('getThreatDetectionSharedRequest')
      cy.intercept('PUT', `**/ztgict/v1/threat-detection-shared/requests/${this.requestId}`, {
        body: {
          ...data,
          requestId: this.requestId,
          status: ThreatDetectionSharedRequestStatusTypes.Rejected,
          requestType,
          requestDirection,
        },
      }).as('putRequest')

      // 画面に遷移
      cy.visit(`/tenants/${this.tenantId}/security-contracts/threat-detection-shared/${this.requestId}`)
      cy.wait(['@getThreatDetectionSharedRequest', '@getContractor'])

      cy.get('[data-cy="security-contracts-threat-detection-shared-id-reject-button"]').as('rejectButton').click()
      cy.wait('@putRequest').then(req => {
        expect(req.request.body).to.deep.equal({ action: 'reject' })
      })

      // ダイアログ文言確認
      cy.get('[data-cy="notification-dialog-text"]').should('have.text', 'リクエストを却下しました。')
      // ダイアログを閉じる
      cy.get('[data-cy="notification-dialog-submit-button"]').click()
      cy.get('[data-cy="notification-dialog-text"]').should('not.exist')

      // ステータスが変更になる
      cy.get('[data-cy="request-detail-status-value"]').should('have.text', '却下')
      // ボタンが非表示になる
      cy.get('@rejectButton').should('not.exist')
    })
  })

  it('[送信リクエスト詳細] 取下', function () {
    const requestType = ThreatDetectionSharedRequestTypes.Start
    const status = ThreatDetectionSharedRequestStatusTypes.PendingApproval
    const requestDirection = ThreatDetectionSharedRequestDirectionTypes.Sent

    cy.fixture('security-contracts/threat-detection-shared/request').then(data => {
      cy.intercept('GET', `**/ztgict/v1/threat-detection-shared/requests/${this.requestId}`, {
        body: { ...data, requestId: this.requestId, status, requestType, requestDirection },
      }).as('getThreatDetectionSharedRequest')
      cy.intercept('DELETE', `**/ztgict/v1/threat-detection-shared/requests/${this.requestId}`, {
        body: {
          ...data,
          requestId: this.requestId,
          status: ThreatDetectionSharedRequestStatusTypes.Cancelled,
          requestType,
          requestDirection,
        },
      }).as('deleteRequest')

      // 画面に遷移
      cy.visit(`/tenants/${this.tenantId}/security-contracts/threat-detection-shared/${this.requestId}`)
      cy.wait(['@getThreatDetectionSharedRequest', '@getContractor'])

      cy.get('[data-cy="security-contracts-threat-detection-shared-id-cancel-button"]').as('cancelButton').click()
      cy.wait('@deleteRequest').then(req => {
        expect(req.request.body).to.deep.equal('')
      })

      // ダイアログ文言確認
      cy.get('[data-cy="notification-dialog-text"]').should('have.text', '承認取下を受け付けました。')
      // ダイアログを閉じる
      cy.get('[data-cy="notification-dialog-submit-button"]').click()
      cy.get('[data-cy="notification-dialog-text"]').should('not.exist')

      // ステータスが変更になる
      cy.get('[data-cy="request-detail-status-value"]').should('have.text', '承認取下')
      // ボタンが非表示になる
      cy.get('@cancelButton').should('not.exist')
    })
  })
})
