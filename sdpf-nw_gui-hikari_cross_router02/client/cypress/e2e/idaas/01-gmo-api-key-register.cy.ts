import { generateRandomHex, t } from '@cypress/support/utils'

describe('register gmo api key', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)
    cy.fixture('idaas/create.json').then(create => {
      this.create = create
    })
    cy.intercept('GET', '**/rink-idaas/v1/gmo-api-key', {
      statusCode: 404,
      body: { errorCode: 404, errorMessage: '404 Not Found!' },
    }).as('getGmoApiKey')
    cy.intercept('POST', '**/rink-idaas/v1/gmo-api-key', { fixture: 'idaas/detail' }).as('postGmoApiKey')
  })

  it('API Key設定', function () {
    cy.visit(`/tenants/${this.tenantId}/idaas/api-key`)
    cy.wait('@getGmoApiKey')

    // 非表示要素を確認
    cy.get('[data-cy="idaas-gmo-api-key-detail-gmo-api-key"]').should('not.exist')
    cy.get('[data-cy="idaas-gmo-api-key-delete-button"]').should('not.exist')

    // 登録ボタンが非活性であることを確認
    cy.get('[data-cy="idaas-gmo-api-key-create-button"]')
      .should('have.text', t('common.register'))
      .should('be.disabled')

    // 作成時のメッセージが表示されることを確認
    const expectedMessage = t('idaas.message.create.text', {
      linkText: t('idaas.message.create.linkText'),
    })
    cy.get('[data-cy="idaas-gmo-api-key-create-message"]').should('have.text', expectedMessage)

    // gmoApiKeyを入力
    cy.get('[data-cy="idaas-gmo-api-key-create-gmo-api-key"]').find('input').type(this.create.gmoApiKey)

    // 登録ボタンが活性化されることを確認してクリック
    cy.get('[data-cy="idaas-gmo-api-key-create-button"]').should('have.text', t('common.register')).click()

    const request = { gmoApiKey: this.create.gmoApiKey }
    cy.wait('@postGmoApiKey').then(req => {
      const stringify = JSON.stringify(request)
      expect(req.request.url).to.include('rink-idaas/v1/gmo-api-key')
      expect(req.request.body).to.deep.equals(JSON.parse(stringify))
    })

    // 登録完了ダイアログの表示を確認
    cy.get('.dialog-main').should('exist')
    cy.get('[data-cy="idaas-gmo-api-key-create-dialog-content"]').should('have.text', t('idaas.message.created'))
    cy.get('.dialog-base-cancel-button').should('have.text', t('common.close'))
    // 認証リスクレポート画面へボタンを押下
    cy.get('.dialog-base-submit-button').should('have.text', t('idaas.authenticationRiskReports')).click()

    // 認証リスクレポート画面へ遷移することを確認
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/idaas/authentication-risk-reports`)
  })
})
