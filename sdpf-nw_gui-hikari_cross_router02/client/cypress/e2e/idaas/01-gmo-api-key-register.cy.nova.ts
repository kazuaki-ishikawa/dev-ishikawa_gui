import { generateRandomHex, t } from '@cypress/support/utils'

describe('register gmo api key', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)
    cy.fixture('idaas/create.json').then(create => {
      this.create = create
    })
    cy.intercept('GET', '**/rink-idaas/v1/gmo-api-key', {
      statusCode: 404,
      body: { errorCode: '404', errorMessage: '404 Not Found!' },
    }).as('getGmoApiKey')
    cy.intercept('POST', '**/rink-idaas/v1/gmo-api-key', { fixture: 'idaas/detail' }).as('postGmoApiKey')
  })

  it('API Key設定 登録成功', function () {
    cy.visit(`/tenants/${this.tenantId}/idaas/api-key`)
    cy.wait('@getGmoApiKey')

    // 非表示要素を確認
    cy.get('[data-cy="idaas-api-key-detail-gmo-api-key"]').should('not.exist')
    cy.get('[data-cy="idaas-api-key-delete-button"]').should('not.exist')

    // 登録ボタンが非活性であることを確認
    cy.get('[data-cy="idaas-api-key-create-button"]')
      .should('have.text', t('nova.apiKeySetting.createButton'))
      .should('be.disabled')

    // 作成時のメッセージが表示されることを確認
    cy.get('[data-cy="idaas-api-key-create-message"]').should('have.text', t('nova.apiKeySetting.note.create'))

    // gmoApiKeyを入力
    cy.get('[data-cy="idaas-api-key-create-gmo-api-key"]').find('input').type(this.create.gmoApiKey)

    // 登録ボタンが活性化されることを確認してクリック
    cy.get('[data-cy="idaas-api-key-create-button"]').click()

    const request = { gmoApiKey: this.create.gmoApiKey }
    cy.wait('@postGmoApiKey').then(req => {
      const stringify = JSON.stringify(request)
      expect(req.request.url).to.include('rink-idaas/v1/gmo-api-key')
      expect(req.request.body).to.deep.equals(JSON.parse(stringify))
    })

    // 登録完了画面の表示確認
    cy.get('[data-cy="card-title-with-border-title"]').should('have.text', t('nova.apiKeySetting.createComplete'))
    cy.get('[data-cy="api-key-result-card-text"]').should('have.text', t('nova.apiKeySetting.note.createComplete'))

    // 「認証リスクレポートへ」ボタンを押下
    cy.get('[data-cy="api-key-result-card-button"]').should('have.text', t('nova.apiKeySetting.moveToReport')).click()

    // 認証リスクレポート画面へ遷移することを確認
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/idaas/authentication-risk-reports`)
  })

  it('API Key設定 登録失敗', function () {
    cy.intercept('POST', '**/rink-idaas/v1/gmo-api-key', {
      statusCode: 500,
      body: { errorCode: '500', errorMessage: '500 Internal Server Error!' },
    }).as('postGmoApiKey')

    cy.visit(`/tenants/${this.tenantId}/idaas/api-key`)
    cy.wait('@getGmoApiKey')

    // gmoApiKeyを入力
    cy.get('[data-cy="idaas-api-key-create-gmo-api-key"]').find('input').type(this.create.gmoApiKey)

    // 登録ボタンが活性化されることを確認してクリック
    cy.get('[data-cy="idaas-api-key-create-button"]').click()

    const request = { gmoApiKey: this.create.gmoApiKey }
    cy.wait('@postGmoApiKey').then(req => {
      const stringify = JSON.stringify(request)
      expect(req.request.url).to.include('rink-idaas/v1/gmo-api-key')
      expect(req.request.body).to.deep.equals(JSON.parse(stringify))
    })

    // 登録失敗画面の表示確認
    cy.get('[data-cy="card-title-with-border-title"]').should('have.text', t('nova.apiKeySetting.createFail'))
    cy.get('[data-cy="api-key-result-card-text"]').should('have.text', t('nova.apiKeySetting.note.createFail'))

    // 「API Key設定画面に戻る」ボタンを押下
    cy.get('[data-cy="api-key-result-card-button"]').should('have.text', t('nova.apiKeySetting.moveToSetting')).click()

    // API Key未設定の詳細画面へ戻ることを確認
    cy.get('[data-cy="idaas-api-key-create-message"]').should('exist')
    cy.get('[data-cy="idaas-api-key-create-gmo-api-key"]').find('input').should('have.value', this.create.gmoApiKey)
    cy.get('[data-cy="idaas-api-key-create-button"]').should('exist')
  })
})
