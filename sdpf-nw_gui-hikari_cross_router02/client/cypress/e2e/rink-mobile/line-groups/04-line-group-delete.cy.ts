import { generateRandomHex, t } from '@cypress/support/utils'

const RINK_MOBILE_ID = 'Z000000001'

describe('容量シェアグループ削除テスト', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)

    cy.intercept('GET', `**/rink-mobile/v1/tenants/*/line-groups/self-add/${RINK_MOBILE_ID}`, {
      fixture: 'rink-mobile/line-groups/group-list-max',
    }).as('getRinkLineGroupList')
    cy.intercept('GET', '**/rink-mobile/v1/tenants/*/line-groups/usage/*', {
      fixture: 'rink-mobile/line-groups/usage',
    }).as('getRinkLineGroupUsage')
    cy.intercept('GET', '**/rink-mobile/v1/tenants/*/rink-connections/self-only', {
      fixture: 'rink-mobile/connections/list',
    }).as('getRinkConnectionList')

    cy.intercept('DELETE', '**/rink-mobile/v1/tenants/*/line-groups/self-only', {
      body: { id: generateRandomHex(32) },
    }).as('deleteRinkLineGroups')
  })

  it('容量シェアグループの削除', function () {
    cy.clock(new Date(new Date().setHours(0, 0, 0, 0)), ['Date'])
    cy.visit(`/tenants/${this.tenantId}/rink-mobile/line-groups?rinkMobileId=${RINK_MOBILE_ID}`)
    cy.wait(['@getRinkConnectionList', '@getRinkLineGroupList', '@getRinkLineGroupUsage'])

    // ラジオボタン選択
    cy.get('[data-cy="rink-mobile-line-groups-index-rink-line-table"]')
      .find('.row')
      .as('tableRows')
      .should('have.length', 1)
    cy.get('@tableRows').eq(0).find('.radio').click()
    // 削除ボタン押下
    cy.get('[data-cy="rink-mobile-line-groups-index-delete-line-group-button"]').click()
    cy.get('[data-cy="delete-confirmation-dialog-confirmation-message"]').should(
      'have.text',
      t('confirm.delete', { resource: t('service.rinkLineGroups') }),
    )
    cy.get('[data-cy="delete-confirmation-dialog-id"]').should('not.exist')
    cy.get('[data-cy="delete-confirmation-dialog-customer-note"]').should('have.text', 'group')

    cy.get('.dialog-base-submit-button').should('have.text', t('common.remove')).click()
    cy.wait('@deleteRinkLineGroups').then(req => {
      expect(req.request.body).to.deep.equal({ lineGroupId: '1' })
    })

    cy.url().then(beforeUrl => {
      // ダイアログの確認
      cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('message.deleted'))
      cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('rinkConnections.moveToTop'))
      // 閉じるボタンを押下する
      cy.get('.dialog-card-close').click()
      cy.get('[data-cy="notification-dialog-text"]').should('not.exist')
      cy.url().should('eq', beforeUrl)
    })

    // 該当のIDが選択されていることを確認する
    cy.get('[data-cy="rink-mobile-line-groups-index-rink-mobile-id"]')
      .find('input')
      .should('have.value', RINK_MOBILE_ID)
    // テーブル要素が更新されていることを確認する
    cy.get('@tableRows').should('have.length', 0)
    // 容量シェアグループ作成は活性
    cy.get('[data-cy="rink-mobile-line-groups-index-create-button"]').should('not.be.disabled')
    // 容量シェアグループ編集ボタンはすべて非活性
    cy.get('[data-cy="rink-mobile-line-groups-index-add-line-button"]').should('be.disabled')
    cy.get('[data-cy="rink-mobile-line-groups-index-remove-line-button"]').should('be.disabled')
    cy.get('[data-cy="rink-mobile-line-groups-index-delete-line-group-button"]').should('be.disabled')
  })
})
