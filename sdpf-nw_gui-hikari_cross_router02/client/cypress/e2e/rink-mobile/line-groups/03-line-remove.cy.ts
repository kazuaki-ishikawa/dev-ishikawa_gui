import { generateRandomHex, t } from '@cypress/support/utils'

const RINK_MOBILE_ID_MAX = 'Z000000003'
const LINE_GROUP_ID = '1'
const EXISTING_LINE_NUMBER = '0000000001'
const NOT_ASSIGNED_LINE_NUMBER = '0000000002'
const NOT_EXISTING_LINE_NUMBER = '0000000003'

describe('容量シェアグループ内回線削除テスト', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)

    cy.intercept('GET', `**/rink-mobile/v1/tenants/*/line-groups/self-add/${RINK_MOBILE_ID_MAX}`, {
      fixture: 'rink-mobile/line-groups/group-list-max',
    }).as('getRinkLineGroupListMax')

    cy.intercept('GET', '**/rink-mobile/v1/tenants/*/line-groups/usage/*', {
      fixture: 'rink-mobile/line-groups/usage',
    }).as('getRinkLineGroupUsage')

    cy.intercept('DELETE', '**/rink-mobile/v1/tenants/*/line-groups/line-members/*', {
      body: { id: generateRandomHex(32) },
    }).as('deleteRinkLineGroupLineMembers')

    cy.intercept('GET', '**/rink-mobile/v1/tenants/*/lines/self-add/*', {
      fixture: 'rink-mobile/line-groups/line-list',
    }).as('getAllRinkLineList')

    cy.intercept('GET', '**/rink-mobile/v1/tenants/*/rink-connections/self-only', {
      fixture: 'rink-mobile/connections/list',
    }).as('getRinkConnectionList')
  })

  it('回線削除：入力フォーム', function () {
    // 受付時間内に設定
    cy.clock(new Date(new Date().setHours(0, 0, 0, 0)), ['Date'])

    // Rink Mobile ID を指定した容量シェアグループ一覧画面に遷移する
    cy.visit(`/tenants/${this.tenantId}/rink-mobile/line-groups?rinkMobileId=${RINK_MOBILE_ID_MAX}`)
    cy.wait(['@getRinkConnectionList', '@getRinkLineGroupListMax', '@getRinkLineGroupUsage'])

    // 容量シェアグループを選択し、回線削除画面へ遷移する
    cy.get('[data-cy="rink-mobile-line-groups-index-rink-line-table"]').find('.radio .button').first().click()
    cy.get('[data-cy="rink-mobile-line-groups-index-remove-line-button"]')
      .should('have.text', t('rinkLineGroups.deleteLine'))
      .click()
    cy.wait(['@getRinkLineGroupListMax', '@getAllRinkLineList'])

    // メッセージ非表示確認
    cy.get('[data-cy="rink-mobile-line-groups-id-remove-lines-outside-reception-hour"]').should('not.exist')

    // 「入力フォームからお申し込み」が選択されていることを確認する
    cy.get('[data-cy="edit-application-type-application-type"]')
      .find('.radio.checked')
      .find('.label.form')
      .should('have.length', 1)

    // ボタン初期値
    cy.get('[data-cy="rink-mobile-line-groups-id-remove-lines-cancel-button"]')
      .should('have.text', t('common.cancel'))
      .and('not.be.disabled')
    cy.get('[data-cy="rink-mobile-line-groups-id-remove-lines-submit-button"]')
      .should('have.text', t('common.confirm'))
      .as('submitButton')
      .and('be.disabled')

    // 回線一覧が空テーブルであることを確認する
    cy.get('[data-cy="edit-rink-line-line-table"]').find('.row').should('length', 0)

    // 登録されていない回線は表示されないことを確認する
    cy.get('[data-cy="edit-rink-line-current-line-table"]')
      .find(`[data-cy="rink-line-table-checkbox-${NOT_ASSIGNED_LINE_NUMBER}"]`)
      .should('not.exist')

    // 回線番号の検索機能の確認
    cy.get('[data-cy="edit-rink-line-current-line-table"]')
      .find('[data-cy="rink-line-table-search"]')
      .type(EXISTING_LINE_NUMBER)
    cy.get('[data-cy="edit-rink-line-current-line-table"]')
      .find('[data-cy="rink-line-table-search-confirm-button"]')
      .click()
    cy.get('[data-cy="edit-rink-line-current-line-table"]')
      .find(`[data-cy="rink-line-table-checkbox-${EXISTING_LINE_NUMBER}"]`)
      .should('exist')
    cy.get('[data-cy="edit-rink-line-current-line-table"]').find('.row').should('length', 1)

    // 削除する回線を選択
    cy.get('[data-cy="edit-rink-line-current-line-table"]')
      .find(`[data-cy="rink-line-table-checkbox-${EXISTING_LINE_NUMBER}"]`)
      .click()
    cy.get('[data-cy="edit-rink-line-remove-button"]').click()

    // 確認ボタンを押下する
    cy.get('@submitButton').click()

    // 確認画面で削除する回線の情報を表示する
    cy.get('[data-cy="edit-rink-line-confirmation-line-table"]')
      .find(`[data-cy="rink-line-table-checkbox-${EXISTING_LINE_NUMBER}"]`)
      .should('exist')

    // 回線の削除
    cy.get('@submitButton').should('have.text', t('common.remove')).click()
    cy.wait('@deleteRinkLineGroupLineMembers').then(req => {
      expect(req.request.url).to.include(`/line-groups/line-members/${LINE_GROUP_ID}`)
      expect(req.request.body).to.deep.equals({ linesList: [{ lineIndex: 1, lineNumber: EXISTING_LINE_NUMBER }] })
    })

    // 完了ダイアログ
    cy.wait(['@getRinkConnectionList', '@getRinkLineGroupListMax', '@getRinkLineGroupUsage'])
    cy.url().should('include', `/tenants/${this.tenantId}/rink-mobile/line-groups?rinkMobileId=${RINK_MOBILE_ID_MAX}`)
    cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('message.finished'))
    cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
    cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('rinkConnections.moveToTop')).click()
    cy.get('[data-cy="notification-dialog-text"]').should('not.exist')

    // モバイルアクセスTOP画面に遷移する
    cy.wait(['@getRinkConnectionList'])
    cy.url().should('include', `/tenants/${this.tenantId}/rink-mobile/contracts`)
  })

  it('回線削除：入力フォーム(回線数MAX:254の場合)', function () {
    const MAX_LINE_NUMBER = 254
    const lineList = Array.from({ length: MAX_LINE_NUMBER + 1 }, (_, i) => ({
      lineNumber: `test${i.toString().padStart(3, '0')}`,
      lineGroupId: LINE_GROUP_ID,
    }))
    cy.intercept('GET', '**/rink-mobile/v1/tenants/*/lines/self-add/*', {
      body: { total: 10, lineList },
    }).as('getAllRinkLineList')

    // 受付時間内に設定
    cy.clock(new Date(new Date().setHours(0, 0, 0, 0)), ['Date'])

    // Rink Mobile ID を指定した容量シェアグループ一覧画面に遷移する
    cy.visit(`/tenants/${this.tenantId}/rink-mobile/line-groups?rinkMobileId=${RINK_MOBILE_ID_MAX}`)
    cy.wait(['@getRinkConnectionList', '@getRinkLineGroupListMax', '@getRinkLineGroupUsage'])

    // 容量シェアグループを選択し、回線削除画面へ遷移する
    cy.get('[data-cy="rink-mobile-line-groups-index-rink-line-table"]').find('.radio .button').first().click()
    cy.get('[data-cy="rink-mobile-line-groups-index-remove-line-button"]').click()
    cy.wait(['@getRinkLineGroupListMax', '@getAllRinkLineList'])

    // 「入力フォームからお申し込み」が選択されていることを確認する
    cy.get('[data-cy="edit-application-type-application-type"]')
      .find('.radio.checked')
      .find('.label.form')
      .should('have.length', 1)

    // 最初の５件を選択
    Array.from({ length: 5 }, (_, i) => i).forEach(index => {
      cy.get('[data-cy="edit-rink-line-current-line-table"]')
        .find(`[data-cy="rink-line-table-checkbox-${`test${index.toString().padStart(3, '0')}`}"]`)
        .click()
    })
    cy.get('[data-cy="edit-rink-line-remove-button"]').click()

    // 全選択
    cy.get('[data-cy="edit-rink-line-current-line-table"]').find('[data-cy="rink-line-table-checkbox-all"]').click()
    cy.get('[data-cy="edit-rink-line-remove-button"]').click()

    // 容量シェアグループ内の回線一覧 テーブルの確認
    cy.get('[data-cy="edit-rink-line-current-line-table"]')
      .find('[data-cy="rink-line-table-checkbox-all"]')
      .should('have.class', 'disabled')
    cy.get('[data-cy="edit-rink-line-current-line-table"]')
      .find('.row')
      .should('have.length', 1)
      .each($row => {
        cy.wrap($row).find('.checkbox').should('have.class', 'disabled')
      })
    // 回線一覧 テーブルの確認
    cy.get('[data-cy="edit-rink-line-line-table"]').find('.row').should('have.length', MAX_LINE_NUMBER)

    // 確認ボタンを押下する
    cy.get('[data-cy="rink-mobile-line-groups-id-remove-lines-submit-button"]').as('submitButton').click()

    // 確認画面では削除する回線の情報のみ表示する
    cy.get('[data-cy="edit-rink-line-confirmation-line-table"]').find('.row').should('have.length', MAX_LINE_NUMBER)

    // 回線の削除
    cy.get('@submitButton').should('have.text', t('common.remove')).click()
    cy.wait('@deleteRinkLineGroupLineMembers').then(req => {
      expect(req.request.body).to.deep.equals({
        linesList: lineList
          .slice(0, MAX_LINE_NUMBER)
          .map(({ lineNumber }, index) => ({ lineIndex: index + 1, lineNumber })),
      })
    })

    cy.url().then(beforeUrl => {
      // 閉じるボタンを押下する
      cy.get('.dialog-card-close').click()
      cy.get('[data-cy="notification-dialog-text"]').should('not.exist')
      cy.url().should('eq', beforeUrl)
    })
  })

  it('回線削除：CSVファイル', function () {
    // 受付時間内に設定
    cy.clock(new Date(new Date().setHours(19, 59, 59, 59)), ['Date'])

    // Rink Mobile ID を指定した容量シェアグループ一覧画面に遷移する
    cy.visit(`/tenants/${this.tenantId}/rink-mobile/line-groups?rinkMobileId=${RINK_MOBILE_ID_MAX}`)
    cy.wait(['@getRinkConnectionList', '@getRinkLineGroupListMax', '@getRinkLineGroupUsage'])

    // 容量シェアグループを選択し、回線削除画面へ遷移する
    cy.get('[data-cy="rink-mobile-line-groups-index-rink-line-table"]').find('.radio .button').first().click()
    cy.get('[data-cy="rink-mobile-line-groups-index-remove-line-button"]').click()
    cy.wait(['@getRinkLineGroupListMax', '@getAllRinkLineList'])

    // メッセージ非表示確認
    cy.get('[data-cy="rink-mobile-line-groups-id-remove-lines-outside-reception-hour"]').should('not.exist')

    // 「CSVファイルを利用してお申し込み」を選択
    cy.get('[data-cy="edit-application-type-application-type"]').find('.label.csv').click()
    cy.get('[data-cy="edit-application-type-application-type"]')
      .find('.radio.checked')
      .find('.label.csv')
      .should('have.length', 1)

    // ファイルアップロードからCSVファイルをアップロードする
    cy.editApplicationFileUpload({
      className: '[data-cy="edit-application-type-file-upload"]',
      filePath: 'cypress/fixtures/rink-mobile/line-groups/line-remove.csv',
    })

    // 入力フォームからお申し込みになっていることを確認する
    cy.get('[data-cy="edit-application-type-application-type"]')
      .find('.radio.checked')
      .find('.label.form')
      .should('have.length', 1)

    // 左のテーブルに存在しない
    cy.get('[data-cy="edit-rink-line-current-line-table"]')
      .find(`[data-cy="rink-line-table-checkbox-${EXISTING_LINE_NUMBER}"]`)
      .should('not.exist')
    // CSVファイルに記入した回線が表示されていることを確認する
    cy.get('[data-cy="edit-rink-line-line-table"]')
      .find(`[data-cy="rink-line-table-checkbox-${EXISTING_LINE_NUMBER}"]`)
      .should('exist')
    // 該当の容量シェアグループに属さない回線は表示されないことを確認する
    cy.get('[data-cy="edit-rink-line-line-table"]')
      .find(`[data-cy="rink-line-table-checkbox-${NOT_ASSIGNED_LINE_NUMBER}"]`)
      .should('not.exist')
    // 存在しない回線は表示されないことを確認する
    cy.get('[data-cy="edit-rink-line-line-table"]')
      .find(`[data-cy="rink-line-table-checkbox-${NOT_EXISTING_LINE_NUMBER}"]`)
      .should('not.exist')

    // 確認ボタンを押下する
    cy.get('[data-cy="rink-mobile-line-groups-id-remove-lines-submit-button"]')
      .should('have.text', t('common.confirm'))
      .as('submitButton')
      .click()

    // 確認画面：削除する回線の情報を表示する
    cy.get('[data-cy="edit-rink-line-confirmation-line-table"]')
      .find(`[data-cy="rink-line-table-checkbox-${EXISTING_LINE_NUMBER}"]`)
      .should('exist')
    // 確認画面：該当の容量シェアグループに属さない回線の情報は表示しない
    cy.get('[data-cy="edit-rink-line-confirmation-line-table"]')
      .find(`[data-cy="rink-line-table-checkbox-${NOT_ASSIGNED_LINE_NUMBER}"]`)
      .should('not.exist')
    // 確認画面：存在しない回線の情報は表示しない
    cy.get('[data-cy="edit-rink-line-confirmation-line-table"]')
      .find(`[data-cy="rink-line-table-checkbox-${NOT_EXISTING_LINE_NUMBER}"]`)
      .should('not.exist')

    // 回線の削除
    cy.get('@submitButton').should('have.text', t('common.remove')).click()
    cy.wait('@deleteRinkLineGroupLineMembers').then(req => {
      expect(req.request.url).to.include(`/line-groups/line-members/${LINE_GROUP_ID}`)
      expect(req.request.body).to.deep.equals({ linesList: [{ lineIndex: 1, lineNumber: EXISTING_LINE_NUMBER }] })
    })

    // 該当IDの容量シェアグループ一覧画面に遷移する
    cy.wait(['@getRinkConnectionList', '@getRinkLineGroupListMax', '@getRinkLineGroupUsage'])
    cy.url().should('include', `/tenants/${this.tenantId}/rink-mobile/line-groups?rinkMobileId=${RINK_MOBILE_ID_MAX}`)
    cy.url().then(beforeUrl => {
      // 完了ダイアログで閉じるボタンを押下する
      cy.get('.dialog-card-close').should('have.text', t('common.close')).click()
      cy.get('[data-cy="notification-dialog-text"]').should('not.exist')
      cy.url().should('eq', beforeUrl)
    })
  })

  context('受付時間外メッセージの表示を確認', function () {
    it('受付時間外 - 日本時間(20:00)', function () {
      cy.clock(new Date(new Date().setHours(20, 0, 0, 0)), ['Date'])

      // 容量シェアグループ内回線削除画面に直接遷移
      cy.visit(
        `/tenants/${this.tenantId}/rink-mobile/line-groups/${LINE_GROUP_ID}/remove-lines?rinkMobileId=${RINK_MOBILE_ID_MAX}`,
      )
      cy.wait(['@getRinkLineGroupListMax', '@getAllRinkLineList'])

      // メッセージ表示確認
      cy.get('[data-cy="rink-mobile-line-groups-id-remove-lines-outside-reception-hour"]').should('exist')
      // 削除する回線を選択し、回線一覧に移動する
      cy.get('[data-cy="edit-rink-line-current-line-table"]')
        .find(`[data-cy="rink-line-table-checkbox-${EXISTING_LINE_NUMBER}"]`)
        .click()
      cy.get('[data-cy="edit-rink-line-remove-button"]').click()
      // 削除する回線を選択後も確認ボタンが押せないことを確認する
      cy.get('[data-cy="rink-mobile-line-groups-id-remove-lines-submit-button"]').should('be.disabled')
    })

    it('受付時間外 - 日本時間(23:59)', function () {
      cy.clock(new Date(new Date().setHours(23, 59, 59, 59)), ['Date'])

      // 容量シェアグループ内回線削除画面に直接遷移
      cy.visit(
        `/tenants/${this.tenantId}/rink-mobile/line-groups/${LINE_GROUP_ID}/remove-lines?rinkMobileId=${RINK_MOBILE_ID_MAX}`,
      )
      cy.wait(['@getRinkLineGroupListMax', '@getAllRinkLineList'])

      // メッセージ表示確認
      cy.get('[data-cy="rink-mobile-line-groups-id-remove-lines-outside-reception-hour"]').should('exist')
    })
  })
})
