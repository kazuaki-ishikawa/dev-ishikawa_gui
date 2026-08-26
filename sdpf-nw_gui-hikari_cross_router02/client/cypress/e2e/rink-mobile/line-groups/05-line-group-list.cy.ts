import { generateRandomHex } from '@cypress/support/utils'

const RINK_MOBILE_ID = 'Z000000001'
const RINK_MOBILE_ID_MAX = 'Z000000002'
const RINK_MOBILE_ID_LINE_COUNT_ZERO = 'Z000000003'

describe('容量シェアグループ一覧画面テスト', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)

    cy.intercept('GET', `**/rink-mobile/v1/tenants/*/line-groups/self-add/${RINK_MOBILE_ID}`, {
      fixture: 'rink-mobile/line-groups/group-list',
    }).as('getRinkLineGroupList')
    cy.intercept('GET', `**/rink-mobile/v1/tenants/*/line-groups/self-add/${RINK_MOBILE_ID_MAX}`, {
      fixture: 'rink-mobile/line-groups/group-list-max',
    }).as('getRinkLineGroupListMax')
    cy.intercept('GET', `**/rink-mobile/v1/tenants/*/line-groups/self-add/${RINK_MOBILE_ID_LINE_COUNT_ZERO}`, {
      fixture: 'rink-mobile/line-groups/group-list-line-count-zero',
    }).as('getRinkLineGroupListLineCountZero')

    cy.intercept('GET', '**/rink-mobile/v1/tenants/*/line-groups/usage/*', {
      fixture: 'rink-mobile/line-groups/usage',
    }).as('getRinkLineGroupUsage')

    cy.intercept('GET', '**/rink-mobile/v1/tenants/*/rink-connections/self-only', {
      fixture: 'rink-mobile/connections/list',
    }).as('getRinkConnectionList')
  })

  it('容量シェアグループの作成が可能な場合 - 受付時間内(19:59)', function () {
    cy.clock(new Date(new Date().setHours(19, 59, 59, 59)), ['Date'])

    cy.visit(`/tenants/${this.tenantId}/rink-mobile/line-groups`)
    cy.wait(['@getRinkConnectionList'])

    // 時間外メッセージ非表示確認
    cy.get('[data-cy="rink-mobile-line-groups-index-outside-reception-hour"]').should('not.exist')

    // 設備IDを選択するまでは新規作成ボタンが押せないことを確認する
    cy.get('[data-cy="rink-mobile-line-groups-index-create-button"]').should('be.disabled')
    cy.get('[data-cy="rink-mobile-line-groups-index-rink-line-table"]').should('not.exist')

    // 設備IDを選択
    cy.inputSelectForm({
      selector: '[data-cy="rink-mobile-line-groups-index-rink-mobile-id"]',
      value: RINK_MOBILE_ID,
    })
    cy.wait(['@getRinkLineGroupList'])

    // 件数上限メッセージ非表示確認
    cy.get('[data-cy="rink-mobile-line-groups-index-reached-limit-message"]').should('not.exist')
    // テーブルが表示されることを確認する
    cy.get('[data-cy="rink-mobile-line-groups-index-rink-line-table"]').should('exist')
    cy.get('[data-cy="rink-mobile-line-groups-index-rink-line-table"]').get('.row').should('have.length', 0)
    // 新規作成ボタンが押せることを確認する
    cy.get('[data-cy="rink-mobile-line-groups-index-create-button"]').should('not.be.disabled')
  })

  it('容量シェアグループの件数が上限値の時 - 受付時間内(00:00)', function () {
    cy.clock(new Date(new Date().setHours(0, 0, 0, 0)), ['Date'])
    cy.visit(`/tenants/${this.tenantId}/rink-mobile/line-groups?rinkMobileId=${RINK_MOBILE_ID_MAX}`)
    cy.wait(['@getRinkConnectionList', '@getRinkLineGroupListMax', '@getRinkLineGroupUsage'])

    // 該当のIDが選択されていることを確認する
    cy.get('[data-cy="rink-mobile-line-groups-index-rink-mobile-id"] input[type="text"]').should(
      'have.value',
      RINK_MOBILE_ID_MAX,
    )

    // 時間外メッセージ非表示確認
    cy.get('[data-cy="rink-mobile-line-groups-index-outside-reception-hour"]').should('not.exist')
    // 件数上限メッセージ表示確認
    cy.get('[data-cy="rink-mobile-line-groups-index-reached-limit-message"]').should('exist')

    // テーブルが表示されることを確認する
    cy.get('[data-cy="rink-mobile-line-groups-index-rink-line-table"]').should('exist')
    cy.get('[data-cy="rink-mobile-line-groups-index-rink-line-table"]').get('.row').should('have.length', 1)
    // 新規作成ボタンが非活性なことを確認
    cy.get('[data-cy="rink-mobile-line-groups-index-create-button"]').should('be.disabled')
    // 容量シェアグループ編集ボタンの初期値確認（全て非活性）
    cy.get('[data-cy="rink-mobile-line-groups-index-add-line-button"]').should('be.disabled')
    cy.get('[data-cy="rink-mobile-line-groups-index-remove-line-button"]').should('be.disabled')
    cy.get('[data-cy="rink-mobile-line-groups-index-delete-line-group-button"]').should('be.disabled')
    // ラジオボタン選択
    cy.get('[data-cy="rink-mobile-line-groups-index-rink-line-table"]').find('.radio .button').first().click()
    // 容量シェアグループ編集ボタンの確認（全て活性）
    cy.get('[data-cy="rink-mobile-line-groups-index-add-line-button"]').should('not.be.disabled')
    cy.get('[data-cy="rink-mobile-line-groups-index-remove-line-button"]').should('not.be.disabled')
    cy.get('[data-cy="rink-mobile-line-groups-index-delete-line-group-button"]').should('not.be.disabled')
  })

  it('容量シェアグループに紐づく回線がゼロの場合', function () {
    cy.clock(new Date(new Date().setHours(0, 0, 0, 0)), ['Date'])

    cy.visit(`/tenants/${this.tenantId}/rink-mobile/line-groups`)
    cy.wait(['@getRinkConnectionList'])

    // 件数上限メッセージ非表示確認
    cy.get('[data-cy="rink-mobile-line-groups-index-reached-limit-message"]').should('not.exist')

    // 設備IDを選択
    cy.inputSelectForm({
      selector: '[data-cy="rink-mobile-line-groups-index-rink-mobile-id"]',
      value: RINK_MOBILE_ID_LINE_COUNT_ZERO,
    })
    cy.wait(['@getRinkLineGroupListLineCountZero', '@getRinkLineGroupUsage'])

    // 件数上限メッセージ表示確認
    cy.get('[data-cy="rink-mobile-line-groups-index-reached-limit-message"]').should('exist')
    // ラジオボタン選択
    cy.get('[data-cy="rink-mobile-line-groups-index-rink-line-table"]').find('.radio .button').first().click()
    // 容量シェアグループ編集ボタンの確認（回線削除ボタンのみ非活性）
    cy.get('[data-cy="rink-mobile-line-groups-index-add-line-button"]').should('not.be.disabled')
    cy.get('[data-cy="rink-mobile-line-groups-index-remove-line-button"]').should('be.disabled')
    cy.get('[data-cy="rink-mobile-line-groups-index-delete-line-group-button"]').should('not.be.disabled')
  })

  context('受付時間外メッセージの表示を確認', function () {
    it('受付時間外 - 日本時間(20:00)', function () {
      cy.clock(new Date(new Date().setHours(20, 0, 0, 0)), ['Date'])

      // 一覧画面の確認
      cy.visit(`/tenants/${this.tenantId}/rink-mobile/line-groups`)
      cy.wait(['@getRinkConnectionList'])

      // 時間外メッセージ表示確認
      cy.get('[data-cy="rink-mobile-line-groups-index-outside-reception-hour"]').should('exist')

      // 容量シェアグループが追加可能な設備IDを選択
      cy.inputSelectForm({
        selector: '[data-cy="rink-mobile-line-groups-index-rink-mobile-id"]',
        value: RINK_MOBILE_ID,
      })
      cy.wait('@getRinkLineGroupList')
      // 容量シェアグループ作成ボタンが非活性なことを確認する
      cy.get('[data-cy="rink-mobile-line-groups-index-create-button"]').should('be.disabled')
    })

    it('受付時間外 - 日本時間(23:59)', function () {
      cy.clock(new Date(new Date().setHours(23, 59, 59, 59)), ['Date'])

      // 容量シェアグループの編集が可能な設備IDを使って一覧画面に遷移
      cy.visit(`/tenants/${this.tenantId}/rink-mobile/line-groups?rinkMobileId=${RINK_MOBILE_ID_MAX}`)
      cy.wait(['@getRinkConnectionList', '@getRinkLineGroupListMax', '@getRinkLineGroupUsage'])

      // 時間外メッセージ表示確認
      cy.get('[data-cy="rink-mobile-line-groups-index-outside-reception-hour"]').should('exist')
      cy.get('[data-cy="rink-mobile-line-groups-index-create-button"]').should('be.disabled')
      // ラジオボタン選択
      cy.get('[data-cy="rink-mobile-line-groups-index-rink-line-table"]').find('.radio .button').first().click()
      // 容量シェアグループ編集ボタンの確認
      cy.get('[data-cy="rink-mobile-line-groups-index-add-line-button"]').should('be.disabled')
      cy.get('[data-cy="rink-mobile-line-groups-index-remove-line-button"]').should('be.disabled')
      cy.get('[data-cy="rink-mobile-line-groups-index-delete-line-group-button"]').should('be.disabled')
    })
  })
})
