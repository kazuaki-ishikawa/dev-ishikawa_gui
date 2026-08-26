import { generateRandomHex, t } from '@cypress/support/utils'

describe('Arcstar Universal One接続廃止', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)
    this.unoConnectionId = generateRandomHex(32)

    cy.fixture('uno-connections/detail.json').then(data => {
      this.detailData = data
    })

    cy.intercept('GET', '**/ztgict/v1/uno-connections*', { fixture: 'uno-connections/list' }).as('getUnoConnectionList')
    cy.intercept('GET', '**/ztgict/v1/uno-connections/*', { fixture: 'uno-connections/detail' }).as('getUnoConnection')
    cy.intercept('DELETE', '**/ztgict/v1/uno-connections/*', { fixture: 'uno-connections/detail' }).as('deleteRequest')
  })

  it('Arcstar Universal One接続廃止 -> オーダー詳細', function () {
    cy.visit(`/tenants/${this.tenantId}/uno-connections/${this.unoConnectionId}`)
    cy.wait(['@getUnoConnection'])

    // 廃止ボタン押下
    cy.get('[data-cy="delete-card-delete-button"]')
      .should('not.be.disabled')
      .and('have.text', t('nova.common.delete'))
      .click()

    // 廃止ダイアログ
    cy.get('[data-cy="uno-connections-id-index-delete-dialog-description"]').should(
      'have.text',
      t('nova.delete.dialogDescription', {
        resourceName: `${this.detailData.customerNote}（${this.detailData.unoConnectionId}）`,
      }),
    )
    cy.get('.delete-dialog-grid').should('have.length', 2)
    cy.get('.delete-dialog-grid')
      .eq(0)
      .within($el => {
        cy.wrap($el).find('div').eq(0).should('have.text', t('nova.unoConnections.unoConnectionId'))
        cy.wrap($el).find('div').eq(1).should('have.text', this.detailData.unoConnectionId)
      })
    cy.get('.delete-dialog-grid')
      .eq(1)
      .within($el => {
        cy.wrap($el).find('div').eq(0).should('have.text', t('nova.unoConnections.customerNote'))
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

    cy.wait('@deleteRequest').then(req => {
      expect(req.request.url).to.include(`/ztgict/v1/uno-connections/${this.unoConnectionId}`)
    })

    // 廃止画面に遷移
    cy.url().should(
      'eq',
      `${Cypress.config().baseUrl}/tenants/${this.tenantId}/uno-connections/${this.unoConnectionId}/delete`,
    )
    cy.wait('@getUnoConnection')

    cy.get('[data-cy="card-title-with-border-title"]').should('have.text', t('nova.delete.completeTitle'))
    cy.get('[data-cy="card-item-completed-order-id"]').should(
      'have.text',
      t('nova.update.orderId', { orderId: this.detailData.orderId }),
    )

    cy.get('[data-cy="uno-connections-id-delete-cancel-button"]')
      .should('have.text', t('nova.unoConnections.moveToList'))
      .and('not.be.disabled')
    cy.get('[data-cy="uno-connections-id-delete-submit-button"]')
      .should('have.text', t('nova.common.moveToOrderDetail'))
      .click()
  })

  it('Arcstar Universal One接続廃止 -> 一覧', function () {
    cy.visit(`/tenants/${this.tenantId}/uno-connections/${this.unoConnectionId}`)
    cy.wait(['@getUnoConnection'])

    // 廃止ボタン押下
    cy.get('[data-cy="delete-card-delete-button"]').click()
    // 廃止ダイアログの廃止ボタンを押下
    cy.get('[data-cy="delete-dialog-submit-button"]').click()

    cy.wait('@deleteRequest').then(req => {
      expect(req.request.url).to.include(`/ztgict/v1/uno-connections/${this.unoConnectionId}`)
    })

    // 廃止画面に遷移
    cy.url().should(
      'eq',
      `${Cypress.config().baseUrl}/tenants/${this.tenantId}/uno-connections/${this.unoConnectionId}/delete`,
    )
    cy.wait('@getUnoConnection')

    // 一覧へボタンを押下
    cy.get('[data-cy="uno-connections-id-delete-cancel-button"]').click()
    cy.wait(['@getUnoConnectionList'])

    cy.location().should(location => {
      expect(location.pathname).to.eq(`/nova/tenants/${this.tenantId}/uno-connections`)
      const resourceStatuses = new URLSearchParams(location.search).getAll('resourceStatus')
      expect(resourceStatuses).to.have.members(['active', 'inactive'])
    })

    // ブラウザバックすると最初の詳細画面に戻る
    cy.go('back')
    cy.wait(['@getUnoConnection'])
    cy.url().should(
      'eq',
      `${Cypress.config().baseUrl}/tenants/${this.tenantId}/uno-connections/${this.unoConnectionId}`,
    )
  })
})
