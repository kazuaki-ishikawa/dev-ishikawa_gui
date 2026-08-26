import { generateRandomHex, t, OUTSIDE_APPLICATION_RESTRICTION_AT } from '@cypress/support/utils'

describe('フレッツ別契約の削除テスト', () => {
  beforeEach(function () {
    // 期間限定の申込規制の影響を受けないよう規制期間外の日時に固定する(規制終了後に削除する)
    cy.clock(new Date(OUTSIDE_APPLICATION_RESTRICTION_AT), ['Date'])
    this.tenantId = generateRandomHex(32)
    this.ipoeId = generateRandomHex(32)

    cy.intercept('GET', '**/ztgict/v1/settings/contractor', { fixture: 'contractor/detail' }).as('getContractor')
    cy.intercept('GET', '**/ztgict/v1/ipoe/hikari-collabo-util/available', { body: { available: true } }).as(
      'getAvailable',
    )
    cy.intercept('GET', '**/ztgict/v1/ipoe*', { fixture: 'ipoes/list' }).as('getIpoeList')
    cy.intercept('GET', '**/ztgict/v1/resource-summary/ipoe*', { fixture: 'ipoes/summary-list' }).as(
      'getIpoeSummaryList',
    )
    cy.intercept('GET', `**/ztgict/v1/ipoe?ipoeId=${this.ipoeId}&limit=1`, {
      body: { ipoes: [{ ref: `/v1/ipoe/separate-contract/${this.ipoeId}` }] },
    }).as('getIpoeContractType')
    cy.intercept('GET', '**/ztgict/v1/ipoe/separate-contract/*', { fixture: 'ipoes/flets-separate/detail' }).as(
      'getFletsSeparate',
    )
    cy.intercept('DELETE', '**/ztgict/v1/ipoe/separate-contract/*', {}).as('deleteFletsSeparate')
    cy.visit(`/tenants/${this.tenantId}/ipoes/${this.ipoeId}`)
  })

  it('フレッツ別契約の削除テスト', function () {
    cy.wait(['@getContractor', '@getAvailable', '@getIpoeContractType', '@getFletsSeparate'])

    // 削除ボタン押下
    cy.get('[data-cy="ipoes-id-index-delete-button"]')
      .should('not.be.disabled')
      .should('have.text', t('common.delete'))
      .click()
    // ダイアログ確認
    cy.get('[data-cy="ipoe-id-index-delete-confirmation-dialog"]').should('exist')

    // ボタンの初期表示
    cy.get('.dialog-base-submit-button').as('submitButton')
    cy.get('@submitButton').should('not.be.disabled')
    cy.get('.dialog-base-cancel-button').should('have.text', t('common.cancel'))

    // ボタンクリック
    cy.get('@submitButton').should('have.text', t('common.delete')).click()

    cy.wait('@deleteFletsSeparate').then(req => {
      expect(req.request.url).to.include('ztgict/v1/ipoe/separate-contract')
      expect(req.request.body).to.equal('')
    })

    // DELETE ipoe/separate-contract の成功メッセージを確認
    cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('message.deleted'))
    cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
    cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.close')).click()
    cy.get('[data-cy="notification-dialog-text"]').should('not.exist')

    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/ipoes`)
    cy.wait(['@getIpoeList', '@getIpoeSummaryList'])
  })
})
