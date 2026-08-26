import { generateRandomHex, t } from '@cypress/support/utils'

const InputData = ['test.1@test.com', 'test.2@test.com', 'test.3@test.com', 'test.4@test.com', 'test.5@test.com']

describe('脅威情報共有 認証キー作成', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)

    // リクエスト一覧画面のAPIモック
    cy.intercept('GET', '**/ztgict/v1/threat-detection-shared/requests?*', {
      fixture: 'security-contracts/threat-detection-shared/requests',
    }).as('getThreatDetectionSharedRequests')
  })

  it('セキュリティ規約同意前', function () {
    cy.intercept('GET', '**/ztgict/v1/settings/security', {
      body: { termsOfServiceAccepted: false },
    }).as('getSecurityTermsOfService')

    cy.visit(`/tenants/${this.tenantId}/security-contracts/threat-detection-shared/create-auth-key`)
    cy.wait([
      '@getSession',
      '@getMobile',
      '@getTrafficReportFlowAnalyzerTermsOfService',
      '@getSecurityTermsOfService',
      '@getSettingsBehaviorDetection',
    ])

    // セキュリティ同意画面へ遷移ボタンが表示される
    cy.get('[data-cy="security-contracts-threat-detection-shared-create-auth-key-terms-of-service-button"]').should(
      'exist',
    )
    cy.get('[data-cy="security-contracts-threat-detection-shared-create-auth-key-terms-of-service-message"]').should(
      'exist',
    )

    // ボタンの状態確認
    cy.get('[data-cy="security-contracts-threat-detection-shared-create-auth-key-mail-address"]').within(() => {
      cy.get('input').should('have.length', 1).and('be.disabled')
    })
  })

  it('認証キー作成', function () {
    // loading 状態の再現のため、APIのレスポンスに遅延を加える
    cy.intercept('POST', '**/ztgict/v1/settings/tenant-reference-auth-key', { delay: 2000 }).as('createAuthKey')

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

    // 認証キー作成ボタンを押下
    cy.get('[data-cy="security-contracts-threat-detection-shared-create-auth-key-button"]').click()
    cy.url().should('include', `/tenants/${this.tenantId}/security-contracts/threat-detection-shared/create-auth-key`)

    // セキュリティ同意画面へ遷移ボタンが表示されない
    cy.get('[data-cy="security-contracts-threat-detection-shared-create-auth-key-terms-of-service-button"]').should(
      'not.exist',
    )
    cy.get('[data-cy="security-contracts-threat-detection-shared-create-auth-key-terms-of-service-message"]').should(
      'not.exist',
    )

    cy.get('[data-cy="security-contracts-threat-detection-shared-create-auth-key-mail-address"]')
      .find('.multiple-add')
      .should('exist')

    // 初期値の状態確認
    cy.get('[data-cy="security-contracts-threat-detection-shared-create-auth-key-mail-address"]')
      .find('input')
      .should('have.length', 1)
      .and('have.value', '')
    cy.get('[data-cy="security-contracts-threat-detection-shared-create-auth-key-submit-button"]').should('be.disabled')

    cy.get('[data-cy="security-contracts-threat-detection-shared-create-auth-key-mail-address"]').within(() => {
      InputData.forEach((input: string, index: number) => {
        cy.get('input').eq(index).type(input)
        if (index < 4) {
          cy.get('.multiple-add').find('button').should('not.be.disabled').click()
        } else {
          cy.get('.multiple-add').find('button').should('be.disabled')
        }
      })
    })

    // 「作成」ボタンを押下
    cy.get('[data-cy="security-contracts-threat-detection-shared-create-auth-key-submit-button"]').click()
    cy.get('.dialog-card-content').should('contain', InputData.join('\n'))
    cy.get('.dialog-base-submit-button').should('have.text', t('common.send')).click()

    // API
    cy.get('.dialog-base-submit-button').should('be.disabled')
    cy.wait('@createAuthKey').then(req => {
      expect(req.request.body).to.deep.equals({
        mailAddress: InputData.filter(Boolean),
        category: 'threatDetectionShared',
      })
    })
    // 完了ダイアログ表示
    cy.get('[data-cy="notification-dialog-text"]').should(
      'have.text',
      t('threatDetectionShared.message.createdAuthKey'),
    )
    cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.close')).click()
    // 画面遷移なし
    cy.url().should('include', `/tenants/${this.tenantId}/security-contracts/threat-detection-shared/create-auth-key`)
    // 初期化なし
    cy.get('[data-cy="security-contracts-threat-detection-shared-create-auth-key-mail-address"]').within(() => {
      InputData.forEach((input: string, index: number) => {
        cy.get('input').eq(index).should('have.value', input)
      })
    })
  })

  it('クリアボタンの有効性を確認', function () {
    cy.intercept('POST', '**/ztgict/v1/settings/tenant-reference-auth-key', {}).as('createAuthKey')

    cy.visit(`/tenants/${this.tenantId}/security-contracts/threat-detection-shared/create-auth-key`)
    cy.wait([
      '@getSession',
      '@getMobile',
      '@getTrafficReportFlowAnalyzerTermsOfService',
      '@getSecurityTermsOfService',
      '@getSettingsBehaviorDetection',
    ])

    // 作成ボタンの初期状態
    cy.get('[data-cy="security-contracts-threat-detection-shared-create-auth-key-submit-button"]')
      .as('submitButton')
      .should('be.disabled')
    // メールアドレスを入力
    cy.get('[data-cy="security-contracts-threat-detection-shared-create-auth-key-mail-address"]')
      .as('inputMailAddress')
      .within(() => {
        cy.get('input').eq(0).type(InputData[0])
      })

    // 作成ボタンが押下可能になる
    cy.get('@submitButton').should('not.be.disabled')

    // メールアドレスを追加（不正値）
    cy.get('@inputMailAddress').within(() => {
      cy.get('.multiple-add').find('button').click()
      cy.get('input').eq(1).type('test@test@email.com')
    })
    // 作成ボタンが押下不可になる
    cy.get('@submitButton').should('be.disabled')

    // クリアボタン押下
    cy.get('[data-cy="security-contracts-threat-detection-shared-create-auth-key-clear-button"]').click()
    cy.get('@inputMailAddress').within(() => {
      cy.get('input').should('have.length', 1).and('have.value', '').type(InputData[0])
      // 2件目は空文字
      cy.get('.multiple-add').find('button').click()
      cy.get('input').should('have.length', 2).eq(1).should('have.value', '')
    })

    // 作成ボタンが押下可能になる
    cy.get('@submitButton').should('not.be.disabled')

    // 「作成」ボタンを押下
    cy.get('@submitButton').click()
    cy.get('.dialog-card-content').should('contain', InputData[0])
    cy.get('.dialog-base-submit-button').should('have.text', t('common.send')).click()
    // 空文字は除外されることを確認
    cy.wait('@createAuthKey').then(req => {
      expect(req.request.body).to.deep.equals({ mailAddress: [InputData[0]], category: 'threatDetectionShared' })
    })
  })
})
