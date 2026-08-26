import { generateRandomHex, t } from '@cypress/support/utils'

const RINK_MOBILE_ID = 'Z000000002'
const RINK_MOBILE_ID_MAX = 'Z000000003'

describe('容量シェアグループ新規作成テスト', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)

    cy.intercept('GET', `**/rink-mobile/v1/tenants/*/line-groups/self-add/${RINK_MOBILE_ID}`, {
      fixture: 'rink-mobile/line-groups/group-list',
    }).as('getRinkLineGroupList')
    cy.intercept('GET', `**/rink-mobile/v1/tenants/*/line-groups/self-add/${RINK_MOBILE_ID_MAX}`, {
      fixture: 'rink-mobile/line-groups/group-list-max',
    }).as('getRinkLineGroupListMax')

    cy.intercept('POST', '**/rink-mobile/v1/tenants/*/line-groups/self-add/*', {
      body: { id: generateRandomHex(32) },
    }).as('postRinkLineGroup')

    cy.intercept('GET', '**/rink-mobile/v1/tenants/*/rink-connections/self-only', {
      fixture: 'rink-mobile/connections/list',
    }).as('getRinkConnectionList')
  })

  it('容量シェアグループ新規作成 - 受付時間内(19:59)', function () {
    cy.clock(new Date(new Date().setHours(19, 59, 59, 59)), ['Date'])

    cy.fixture('rink-mobile/line-groups/create').then(createData => {
      cy.visit(`/tenants/${this.tenantId}/rink-mobile/line-groups?rinkMobileId=${RINK_MOBILE_ID}`)
      cy.wait(['@getRinkConnectionList', '@getRinkLineGroupList'])

      // 新規作成画面に遷移
      cy.get('[data-cy="rink-mobile-line-groups-index-create-button"]').click()
      cy.wait(['@getRinkLineGroupList'])

      // 時間外メッセージ非表示確認
      cy.get('[data-cy="rink-mobile-line-groups-create-outside-reception-hour"]').should('not.exist')

      // 入力項目初期値
      cy.get('[data-cy="rink-mobile-line-groups-create-line-group-name"]')
        .find('input')
        .as('lineGroupNameInput')
        .should('have.value', '')

      // ボタン初期値
      cy.get('[data-cy="rink-mobile-line-groups-create-cancel-button"]')
        .should('have.text', t('common.cancel'))
        .and('not.be.disabled')
      cy.get('[data-cy="rink-mobile-line-groups-create-submit-button"]')
        .as('submitButton')
        .should('have.text', t('common.confirm'))
        .and('be.disabled')

      // 入力
      cy.get('@lineGroupNameInput').type(createData.lineGroupName)

      // 確認ボタンを押下
      cy.get('@submitButton').click()

      // 確認画面表示
      cy.get('@submitButton').should('have.text', t('common.create')).click()
      cy.wait('@postRinkLineGroup').then(req => {
        expect(req.request.url).to.include(`/line-groups/self-add/${RINK_MOBILE_ID}`)
        expect(req.request.body).to.deep.equals(createData)
      })

      cy.wait(['@getRinkConnectionList', '@getRinkLineGroupList'])
      cy.url().then(url => {
        expect(url).include(`/tenants/${this.tenantId}/rink-mobile/line-groups?rinkMobileId=${RINK_MOBILE_ID}`)

        // 完了ダイアログの容量シェアグループ一覧へ戻るボタンを押下
        cy.get('[data-cy="notification-dialog-text"]').should('contain', t('message.finished'))
        cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('rinkConnections.moveToTop'))
        cy.get('[data-cy="notification-dialog-cancel-button"]')
          .should('have.text', t('rinkConnections.moveToLineGroups'))
          .click()
        cy.get('[data-cy="notification-dialog-text"]').should('not.exist')

        // url は変わらない
        cy.url().should('eq', url)
      })
    })
  })

  it('容量シェアグループが上限値の時 - 受付時間内(00:00)', function () {
    cy.clock(new Date(new Date().setHours(0, 0, 0, 0)), ['Date'])

    // 直接新規作成画面に遷移
    cy.visit(`/tenants/${this.tenantId}/rink-mobile/line-groups/create?rinkMobileId=${RINK_MOBILE_ID_MAX}`)
    cy.wait(['@getRinkLineGroupListMax'])

    // 時間外メッセージ非表示確認
    cy.get('[data-cy="rink-mobile-line-groups-create-outside-reception-hour"]').should('not.exist')

    // 入力
    cy.get('[data-cy="rink-mobile-line-groups-create-line-group-name"]')
      .find('input')
      .type('容量シェアグループ最大値テスト')
    // 確認ボタンが非活性なことを確認
    cy.get('[data-cy="rink-mobile-line-groups-create-submit-button"]').should('be.disabled')
  })

  context('受付時間外メッセージの表示を確認', function () {
    it('受付時間外 - 日本時間(20:00)', function () {
      cy.clock(new Date(new Date().setHours(20, 0, 0, 0)), ['Date'])

      // 直接新規作成画面に遷移
      cy.visit(`/tenants/${this.tenantId}/rink-mobile/line-groups/create?rinkMobileId=${RINK_MOBILE_ID}`)
      cy.wait(['@getRinkLineGroupList'])

      // メッセージ表示確認
      cy.get('[data-cy="rink-mobile-line-groups-create-outside-reception-hour"]').should('exist')
      // 入力
      cy.get('[data-cy="rink-mobile-line-groups-create-line-group-name"]')
        .find('input')
        .type('容量シェアグループ時間外テスト')
      // 必要な情報を入力後も確認ボタンが押せないことを確認する
      cy.get('[data-cy="rink-mobile-line-groups-create-submit-button"]').should('be.disabled')
    })

    it('受付時間外 - 日本時間(23:59)', function () {
      cy.clock(new Date(new Date().setHours(23, 59, 59, 59)), ['Date'])

      // 直接新規作成画面に遷移
      cy.visit(`/tenants/${this.tenantId}/rink-mobile/line-groups/create?rinkMobileId=${RINK_MOBILE_ID}`)
      cy.wait(['@getRinkLineGroupList'])

      // メッセージ表示確認
      cy.get('[data-cy="rink-mobile-line-groups-create-outside-reception-hour"]').should('exist')
    })
  })
})
