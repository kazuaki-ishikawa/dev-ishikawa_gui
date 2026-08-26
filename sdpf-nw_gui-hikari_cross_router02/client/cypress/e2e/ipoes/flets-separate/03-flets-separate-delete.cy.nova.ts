import { generateRandomHex, t } from '@cypress/support/utils'

describe('フレッツ別契約型IPoE廃止', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)
    this.ipoeId = generateRandomHex(32)

    cy.fixture('ipoes/flets-separate/detail.json').then(data => {
      this.detailData = data
    })

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
    cy.intercept('DELETE', '**/ztgict/v1/ipoe/separate-contract/*', { fixture: 'ipoes/flets-separate/detail' }).as(
      'deleteFletsSeparate',
    )
  })

  it('フレッツ別契約型IPoE廃止 -> オーダー詳細', function () {
    cy.visit(`/tenants/${this.tenantId}/ipoes/${this.ipoeId}`)
    cy.wait(['@getContractor', '@getAvailable', '@getIpoeContractType', '@getFletsSeparate'])

    // 廃止ボタン押下
    cy.get('[data-cy="delete-card-delete-button"]')
      .should('not.be.disabled')
      .and('have.text', t('nova.common.delete'))
      .click()

    // 廃止ダイアログ
    cy.get('[data-cy="ipoes-id-index-delete-dialog-description"]').should(
      'have.text',
      t('nova.delete.dialogDescription', {
        resourceName: `${this.detailData.customerNote}（${this.detailData.ipoeId}）`,
      }),
    )
    cy.get('.delete-dialog-grid').should('have.length', 2)
    cy.get('.delete-dialog-grid')
      .eq(0)
      .within($el => {
        cy.wrap($el).find('div').eq(0).should('have.text', t('nova.ipoe.accessCircuitId'))
        cy.wrap($el).find('div').eq(1).should('have.text', this.detailData.ipoeId)
      })
    cy.get('.delete-dialog-grid')
      .eq(1)
      .within($el => {
        cy.wrap($el).find('div').eq(0).should('have.text', t('nova.ipoe.accessCircuitName'))
        cy.wrap($el).find('div').eq(1).should('have.text', this.detailData.customerNote)
      })

    // ボタンの確認
    cy.get('[data-cy="delete-dialog-cancel-button"]')
      .should('not.be.disabled')
      .and('have.text', t('nova.common.cancel'))
    cy.get('[data-cy="delete-dialog-submit-button"]')
      .should('not.be.disabled')
      .and('have.text', t('nova.common.applicationForDelete'))
      .click()

    cy.wait('@deleteFletsSeparate').then(req => {
      expect(req.request.url).to.include(`/ztgict/v1/ipoe/separate-contract/${this.ipoeId}`)
      expect(req.request.body).to.equal('')
    })

    // 廃止画面に遷移
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/ipoes/${this.ipoeId}/delete`)
    cy.wait(['@getIpoeContractType', '@getFletsSeparate'])

    cy.get('[data-cy="card-title-with-border-title"]').should('have.text', t('nova.delete.completeTitle'))
    cy.get('[data-cy="card-item-completed-order-id"]').should(
      'have.text',
      t('nova.update.orderId', { orderId: this.detailData.orderId }),
    )

    cy.get('[data-cy="ipoes-id-delete-cancel-button"]')
      .should('have.text', t('nova.ipoe.moveToList'))
      .and('not.be.disabled')
    cy.get('[data-cy="ipoes-id-delete-submit-button"]').should('have.text', t('nova.common.moveToOrderDetail')).click()

    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/orders/${this.detailData.orderId}`)
  })

  it('フレッツ別契約型IPoE廃止 -> IPoE一覧', function () {
    cy.visit(`/tenants/${this.tenantId}/ipoes/${this.ipoeId}`)
    cy.wait(['@getContractor', '@getAvailable', '@getIpoeContractType', '@getFletsSeparate'])

    // 廃止ボタン押下
    cy.get('[data-cy="delete-card-delete-button"]').click()
    // 廃止ダイアログの廃止ボタンを押下
    cy.get('[data-cy="delete-dialog-submit-button"]').click()

    cy.wait('@deleteFletsSeparate').then(req => {
      expect(req.request.url).to.include(`/ztgict/v1/ipoe/separate-contract/${this.ipoeId}`)
    })

    // 廃止画面に遷移
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/ipoes/${this.ipoeId}/delete`)
    cy.wait(['@getIpoeContractType', '@getFletsSeparate'])

    // IPoE一覧へボタンを押下
    cy.get('[data-cy="ipoes-id-delete-cancel-button"]').click()
    cy.wait(['@getIpoeList', '@getIpoeSummaryList'])

    cy.location().should(location => {
      expect(location.pathname).to.eq(`/nova/tenants/${this.tenantId}/ipoes`)
      const resourceStatuses = new URLSearchParams(location.search).getAll('resourceStatus')
      expect(resourceStatuses).to.have.members(['active', 'inactive'])
    })

    // ブラウザバックすると最初の詳細画面に戻る
    cy.go('back')
    cy.wait(['@getIpoeContractType', '@getFletsSeparate'])
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/ipoes/${this.ipoeId}`)
  })
})
