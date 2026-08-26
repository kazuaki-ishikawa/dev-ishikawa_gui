import { generateRandomHex, t } from '@cypress/support/utils'

describe('ギャランティアクセス キャンペーン適用終了', () => {
  // @getGuarantee のレスポンスに tenantId がある場合に @getTerminalList を追加する
  const detailWaitList = ['@getGuarantee', '@getCampaignList']

  before(function () {
    this.tenantId = generateRandomHex(32)
    this.guaranteeId = 'all-status'
    cy.fixture('campaigns/delete.json').then(campaign => {
      this.deleteCampaignRequest = campaign
    })
    cy.intercept('GET', '**/ztgict/v1/guarantees*', { fixture: 'guarantees/circuits/list' }).as('getGuaranteeList')
    cy.intercept('GET', '**/ztgict/v1/guarantees/*', {
      fixture: 'guarantees/circuits/detail-reserve-date-approved',
    }).as('getGuarantee')
    cy.intercept('GET', '**/ztgict/v1/campaigns*', { fixture: 'campaigns/list' }).as('getCampaignList')
    cy.intercept('GET', '**/ztgict/v1/resource-summary/terminals*', { fixture: 'terminals/list-some-items' }).as(
      'getTerminalList',
    )
    cy.intercept('DELETE', '**/ztgict/v1/campaigns', { fixture: 'campaigns/detail' }).as('deleteCampaign')
  })

  it('キャンペーン適用終了', function () {
    cy.clock(new Date('2024-04-22T00:00:00Z'), ['Date'])
    cy.visit(`tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}`)
    cy.wait(detailWaitList)

    cy.get('[data-cy="guarantees-circuits-id-quit-campaign-button"]')
      .should('not.be.disabled')
      .should('have.text', t('campaign.quitCampaign'))
      .click()

    cy.get('.dialog-base-submit-button').should('be.disabled').should('have.text', t('common.finish'))

    cy.get('[data-cy="guarantees-circuits-id-quit-dialog-agreement"]').find('.checkbox').click()

    cy.get('.dialog-base-submit-button').should('not.be.disabled').click()

    const request = {
      ...this.deleteCampaignRequest,
      resourceId: this.guaranteeId,
    }
    cy.wait('@deleteCampaign').then(req => {
      const stringify = JSON.stringify(request)
      expect(req.request.url).to.include('ztgict/v1/campaigns')
      expect(req.request.body).to.deep.equal(JSON.parse(stringify))
    })

    // 成功メッセージを確認
    cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('campaign.quitCampaignMessage'))
    cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
    cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.close')).click()
    cy.get('[data-cy="notification-dialog-text"]').should('not.exist')

    cy.url().should(
      'eq',
      `${Cypress.config().baseUrl}/tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}`,
    )
    cy.wait(detailWaitList)
  })
})
