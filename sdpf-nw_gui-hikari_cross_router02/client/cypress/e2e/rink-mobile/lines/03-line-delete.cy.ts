import dayjs from 'dayjs'
import type { RinkLineListType } from '@app/api/rinkLines/types'
import { generateRandomHex, t } from '@cypress/support/utils'

const RINK_MOBILE_ID = 'Z000000001'
const CSV_REMOVE_LINE_NUMBER_LIST = ['02044444444']
const requestDate = dayjs().add(7, 'day').format('YYYY-MM-DD')

describe('回線廃止テスト', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)
    cy.fixture('rink-mobile/lines/list').then(data => {
      this.listData = data.lineList
    })
    cy.intercept('GET', '**/rink-mobile/v1/tenants/*/rink-connections/self-only', {
      fixture: 'rink-mobile/connections/list',
    }).as('getRinkConnectionList')
    cy.intercept(
      'POST',
      '**/rink-mobile/v1/tenants/*/line-available-date/self-only?orderType=delete-line-lines',
      {},
    ).as('postRinkLineAvailableDate')
    cy.intercept('GET', `**/rink-mobile/v1/tenants/*/lines/self-add/${RINK_MOBILE_ID}?*`, {
      fixture: 'rink-mobile/lines/list',
    }).as('getLineList')
    cy.intercept('DELETE', '**/rink-mobile/v1/tenants/*/lines/self-only', {
      body: { id: 'deleted' },
    }).as('deleteLineList')
  })

  it('回線廃止：入力フォーム', function () {
    // 受付時間内に設定
    cy.clock(new Date(new Date().setHours(0, 0, 0, 0)), ['Date'])

    cy.fixture('rink-mobile/lines/list').then(({ lineList }: { lineList: RinkLineListType[] }) => {
      // 回線申込画面
      cy.visit(`/tenants/${this.tenantId}/rink-mobile/lines`)
      // 廃止ボタンを押下する
      cy.get('[data-cy="rink-mobile-lines-index-remove-button"]').click()
      cy.wait(['@getRinkConnectionList'])
      cy.wait('@postRinkLineAvailableDate').then(req => {
        expect(req.request.body).to.deep.equal({})
      })

      // 受付時間外メッセージの非表示確認
      cy.get('[data-cy="rink-mobile-lines-remove-outside-reception-hour"]').should('not.exist')

      // 検索欄のモバイルアクセスIDを選択して検索ボタンを押下する
      cy.inputSelectForm({
        selector: '[data-cy="rink-line-search-filter-rink-mobile-id"]',
        value: RINK_MOBILE_ID,
      })
      cy.get('[data-cy="search-filter-search-button"]').click()
      cy.wait('@getLineList')

      // モバイルアクセスIDが選択されていることを確認する
      cy.get('[data-cy="rink-mobile-lines-remove-rink-mobile-id"]').find('input').should('have.value', RINK_MOBILE_ID)

      // 「入力フォームからお申し込み」の初期値は空
      cy.get('[data-cy="edit-application-type-application-type"]').find('.checked').should('have.length', 0)
      cy.get('[data-cy="edit-application-type-application-type"]').find('.label.form').click()

      const selectableLineList = lineList
        .filter(row => !row.isLocked)
        .map((row, index) => ({ lineIndex: index + 1, lineNumber: row.lineNumber }))

      // 回線の選択（全件）
      cy.get('[data-cy="rink-mobile-lines-remove-line-table"]').within(() => {
        cy.get('.checkbox.checked').should('have.length', 0)
        cy.get('[data-cy="rink-mobile-lines-remove-selector-all"]').click()
        cy.get('[data-cy="rink-mobile-lines-remove-selector-all"]').should('have.class', 'checked')
        lineList.forEach(({ lineNumber }: { lineNumber: string }) => {
          if (selectableLineList.some((v: { lineNumber: string }) => v.lineNumber === lineNumber)) {
            // オーダー可能の回線が選択されていることを確認
            cy.get(`[data-cy="rink-mobile-lines-remove-line-table-selector-${lineNumber}"]`).should(
              'have.class',
              'checked',
            )
          } else {
            // オーダー不可の回線は選択されないことを確認
            cy.get(`[data-cy="rink-mobile-lines-remove-line-table-selector-${lineNumber}"]`).should(
              'have.class',
              'disabled',
            )
          }
        })
      })
      // 廃止希望日の入力
      cy.inputDatePicker({
        className: '[data-cy="rink-mobile-lines-remove-request-date"]',
        date: requestDate,
      })

      // 確認ボタンを押下する
      cy.get('[data-cy="rink-mobile-lines-remove-submit-button"]').should('have.text', '確認').click()
      // 廃止申し込み
      cy.get('[data-cy="rink-mobile-lines-remove-submit-button"]').should('have.text', '廃止申し込み').click()

      cy.wait('@deleteLineList').then(req => {
        expect(req.request.body).to.deep.equal({
          requestDate,
          linesList: selectableLineList,
        })
      })

      // 回線申込画面に戻ることを確認
      cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/rink-mobile/lines`)

      // 廃止申し込みの成功メッセージ確認
      cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('message.finished'))
      cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
      cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('rinkConnections.moveToTop'))
      // 閉じるボタン押下
      cy.get('.dialog-card-close').click()
      cy.get('[data-cy="notification-dialog-text"]').should('not.exist')
    })
  })

  it('回線廃止：入力フォーム(回線数MAX:254の場合)', function () {
    const MAX_LINE_NUMBER = 254
    const lineList = Array.from({ length: MAX_LINE_NUMBER + 1 }, (_, i) => ({
      lineNumber: `test${i.toString().padStart(3, '0')}`,
    }))
    const counts = Math.ceil((MAX_LINE_NUMBER + 1) / 20)
    Array.from({ length: counts }).forEach((_, index) => {
      cy.intercept(
        'GET',
        `**/rink-mobile/v1/tenants/*/lines/self-add/${RINK_MOBILE_ID}?limit=20&offset=${index * 20}*`,
        {
          body: { total: MAX_LINE_NUMBER + 1, lineList: lineList.slice(index * 20, index * 20 + 20) },
        },
      ).as(`getLineList${index}`)
    })

    // 受付時間内に設定
    cy.clock(new Date(new Date().setHours(0, 0, 0, 0)), ['Date'])

    // 回線申込画面
    cy.visit(`/tenants/${this.tenantId}/rink-mobile/lines`)
    // 廃止ボタンを押下する
    cy.get('[data-cy="rink-mobile-lines-index-remove-button"]').click()
    cy.wait(['@getRinkConnectionList'])
    cy.wait('@postRinkLineAvailableDate').then(req => {
      expect(req.request.body).to.deep.equal({})
    })

    // 検索欄のモバイルアクセスIDを選択して検索ボタンを押下する
    cy.inputSelectForm({
      selector: '[data-cy="rink-line-search-filter-rink-mobile-id"]',
      value: RINK_MOBILE_ID,
    })
    cy.get('[data-cy="search-filter-search-button"]').click()
    cy.wait(Array.from({ length: counts }).map((_, index) => `@getLineList${index}`))

    // 「入力フォームからお申し込み」を選択する
    cy.get('[data-cy="edit-application-type-application-type"]').find('.label.form').click()

    // 回線の選択（全件）
    cy.get('.pagination-footer').find('button').last().click()
    cy.get('[data-cy="rink-mobile-lines-remove-line-table"]').within(() => {
      cy.get('[data-cy="rink-mobile-lines-remove-selector-all"]').click()
      cy.get('[data-cy="rink-mobile-lines-remove-selector-all"]')
        .should('not.have.class', 'checked')
        .and('have.class', 'indeterminate')

      // 最後のページの要素をチェック
      lineList.slice(MAX_LINE_NUMBER - 4).forEach(({ lineNumber }: { lineNumber: string }) => {
        if (lineNumber !== `test${MAX_LINE_NUMBER}`) {
          cy.get(`[data-cy="rink-mobile-lines-remove-line-table-selector-${lineNumber}"]`)
            .should('have.class', 'checked')
            .and('not.have.class', 'disabled')
        } else {
          cy.get(`[data-cy="rink-mobile-lines-remove-line-table-selector-${lineNumber}"]`)
            .should('have.class', 'disabled')
            .and('not.have.class', 'checked')
        }
      })
    })
    // 廃止希望日の入力
    cy.inputDatePicker({
      className: '[data-cy="rink-mobile-lines-remove-request-date"]',
      date: requestDate,
    })

    // 確認ボタンを押下する
    cy.get('[data-cy="rink-mobile-lines-remove-submit-button"]').click()
    // 廃止申し込み
    cy.get('[data-cy="rink-mobile-lines-remove-submit-button"]').click()

    // チェックを入れた要素のみがリクエストされていることを確認
    cy.wait('@deleteLineList').then(req => {
      expect(req.request.body).to.deep.equal({
        requestDate,
        linesList: lineList
          .slice(0, MAX_LINE_NUMBER)
          .map((line, index) => ({ lineIndex: index + 1, lineNumber: line.lineNumber })),
      })
    })
  })

  it('回線廃止：CSVファイル', function () {
    // 受付時間内に設定
    cy.clock(new Date(new Date().setHours(19, 59, 59, 59)), ['Date'])

    // 回線申込画面
    cy.visit(`/tenants/${this.tenantId}/rink-mobile/lines`)
    // 廃止ボタンを押下する
    cy.get('[data-cy="rink-mobile-lines-index-remove-button"]').click()
    cy.wait(['@getRinkConnectionList'])
    cy.wait('@postRinkLineAvailableDate').then(req => {
      expect(req.request.body).to.deep.equal({})
    })

    // 受付時間外メッセージの非表示確認
    cy.get('[data-cy="rink-mobile-lines-remove-outside-reception-hour"]').should('not.exist')

    // 検索欄のモバイルアクセスIDを選択して検索ボタンを押下する
    cy.inputSelectForm({
      selector: '[data-cy="rink-line-search-filter-rink-mobile-id"]',
      value: RINK_MOBILE_ID,
    })
    cy.get('[data-cy="search-filter-search-button"]').click()
    cy.wait('@getLineList')

    // モバイルアクセスIDが選択されていることを確認する
    cy.get('[data-cy="rink-mobile-lines-remove-rink-mobile-id"]').find('input').should('have.value', RINK_MOBILE_ID)

    // 「入力フォームからお申し込み」の初期値は空
    cy.get('[data-cy="edit-application-type-application-type"]').find('.checked').should('have.length', 0)
    // 「CSVファイルを利用してお申し込み」を選択
    cy.get('[data-cy="edit-application-type-application-type"]').find('.label.csv').click()
    cy.get('[data-cy="edit-application-type-application-type"]')
      .find('.radio.checked')
      .find('.label.csv')
      .should('have.length', 1)

    cy.get('[data-cy="rink-mobile-lines-remove-line-table"]').within(() => {
      cy.get('.checkbox').should('have.length', 0)
    })
    // ファイルアップロードからCSVファイルをアップロードする
    cy.editApplicationFileUpload({
      className: '[data-cy="edit-application-type-file-upload"]',
      filePath: 'cypress/fixtures/rink-mobile/lines/delete.csv',
    })
    cy.wait('@getLineList')

    // 入力フォームからお申し込みになっていることを確認する
    cy.get('[data-cy="edit-application-type-application-type"]')
      .find('.radio.checked')
      .find('.label.form')
      .should('have.length', 1)

    // CSVファイルの中身が反映されていることを確認する
    cy.get('[data-cy="rink-mobile-lines-remove-line-table"]').within(() => {
      CSV_REMOVE_LINE_NUMBER_LIST.forEach(lineNumber => {
        cy.get(`[data-cy="rink-mobile-lines-remove-line-table-selector-${lineNumber}"]`).should('have.class', 'checked')
      })
      cy.get('.checkbox.checked').should('have.length', CSV_REMOVE_LINE_NUMBER_LIST.length)
    })

    // 廃止希望日の入力
    cy.inputDatePicker({
      className: '[data-cy="rink-mobile-lines-remove-request-date"]',
      date: requestDate,
    })

    // 確認ボタンを押下する
    cy.get('[data-cy="rink-mobile-lines-remove-submit-button"]').click()
    // 廃止申し込み
    cy.get('[data-cy="rink-mobile-lines-remove-submit-button"]').click()

    cy.wait('@deleteLineList').then(req => {
      expect(req.request.body).to.deep.equal({
        requestDate,
        linesList: CSV_REMOVE_LINE_NUMBER_LIST.map((lineNumber, index) => ({ lineIndex: index + 1, lineNumber })),
      })
    })

    // 回線申込画面に戻ることを確認
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/rink-mobile/lines`)

    // DELETE の成功メッセージを確認
    cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('message.finished'))
    cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
    cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('rinkConnections.moveToTop')).click()
    cy.get('[data-cy="notification-dialog-text"]').should('not.exist')

    // 契約一覧画面に戻ることを確認
    cy.wait(['@getRinkConnectionList'])
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/rink-mobile/contracts`)
  })

  it('回線廃止：表示制御', function () {
    const emptyRinkMobileId = 'Z000000002'
    const LINE_NUMBER_1 = '09012345678'

    cy.intercept('GET', `**/rink-mobile/v1/tenants/*/lines/self-add/${emptyRinkMobileId}?*`, {
      body: { lineList: [], total: 0 },
    }).as('getEmptyLineList')
    cy.intercept('GET', '**/rink-mobile/v1/tenants/*/rink-connections/self-only', {
      body: [
        {
          zId: RINK_MOBILE_ID,
          connectionType: 'vpn-breakout',
          vpnId: 'Z000000138',
        },
        {
          zId: emptyRinkMobileId,
          connectionType: 'internet-only',
        },
      ],
    }).as('getRinkConnectionList')

    // 回線申込画面
    cy.visit(`/tenants/${this.tenantId}/rink-mobile/lines`)
    // 廃止ボタンを押下する
    cy.get('[data-cy="rink-mobile-lines-index-remove-button"]').click()
    cy.wait(['@getRinkConnectionList', '@postRinkLineAvailableDate'])

    // 検索欄の初期値
    cy.get('[data-cy="rink-line-search-filter-rink-mobile-id"]').find('input').should('have.value', '')
    cy.get('[data-cy="rink-line-search-filter-line-number"]').find('input').should('have.value', '')
    cy.get('[data-cy="search-filter-clear-button"]').should('be.disabled')
    cy.get('[data-cy="search-filter-search-button"]').should('be.disabled')

    // テーブル欄の初期表示
    cy.get('[data-cy="rink-mobile-lines-remove-search-empty"]').should('exist')
    cy.get('[data-cy="rink-mobile-lines-remove-rink-mobile-id"]').should('not.exist')
    cy.get('[data-cy="edit-application-type-application-type"]').should('not.exist')
    cy.get('[data-cy="rink-mobile-lines-remove-line-table"]').should('not.exist')
    cy.get('[data-cy="rink-mobile-lines-remove-request-date"]').should('not.exist')

    // 空のデータを取得する
    cy.inputSelectForm({ selector: '[data-cy="rink-line-search-filter-rink-mobile-id"]', value: emptyRinkMobileId })
    cy.get('[data-cy="search-filter-search-button"]').click()
    cy.wait(['@getEmptyLineList'])

    cy.get('[data-cy="rink-mobile-lines-remove-search-empty"]').should('exist')
    cy.get('[data-cy="rink-mobile-lines-remove-rink-mobile-id"]').should('not.exist')
    cy.get('[data-cy="edit-application-type-application-type"]').should('not.exist')
    cy.get('[data-cy="rink-mobile-lines-remove-line-table"]').should('not.exist')
    cy.get('[data-cy="rink-mobile-lines-remove-request-date"]').should('not.exist')

    // 回線番号を入れた状態で検索した時
    cy.get('[data-cy="rink-line-search-filter-line-number"]').find('input').type(LINE_NUMBER_1)
    cy.get('[data-cy="search-filter-search-button"]').click()
    cy.wait('@getEmptyLineList').then(req => {
      expect(req.request.query).to.deep.eq({ limit: '20', offset: '0', lineNumber: LINE_NUMBER_1 })
    })
    cy.get('[data-cy="rink-mobile-lines-remove-search-empty"]').should('exist')
    cy.get('[data-cy="rink-mobile-lines-remove-rink-mobile-id"]').should('not.exist')
    cy.get('[data-cy="edit-application-type-application-type"]').should('not.exist')
    cy.get('[data-cy="rink-mobile-lines-remove-line-table"]').should('not.exist')
    cy.get('[data-cy="rink-mobile-lines-remove-request-date"]').should('not.exist')

    // 回線番号のみで検索した場合、モバイルアクセスID 全件に対して回線取得処理が実行される
    cy.inputSelectForm({ selector: '[data-cy="rink-line-search-filter-rink-mobile-id"]', value: '未選択' })
    cy.get('[data-cy="search-filter-search-button"]').click()
    cy.wait(['@getLineList', '@getEmptyLineList']).then(req => {
      expect(req[0].request.query).to.deep.eq({ lineNumber: LINE_NUMBER_1, limit: '20', offset: '0' })
      expect(req[1].request.query).to.deep.eq({ lineNumber: LINE_NUMBER_1, limit: '20', offset: '0' })
    })

    // 各要素が表示されることを確認
    cy.get('[data-cy="rink-mobile-lines-remove-rink-mobile-id"]').find('input').should('have.value', RINK_MOBILE_ID)
    cy.get('[data-cy="edit-application-type-application-type"]').should('exist')
    cy.get('[data-cy="rink-mobile-lines-remove-line-table"]').should('exist')
    cy.get('[data-cy="rink-mobile-lines-remove-request-date"]').should('exist')
  })

  it('回線廃止：廃止済み、 オーダー中はチェックボックス選択不可になること', function () {
    const unselectableRinkMobileId = 'Z000000003'
    cy.intercept('GET', `**/rink-mobile/v1/tenants/*/lines/self-add/${unselectableRinkMobileId}?*`, {
      fixture: 'rink-mobile/lines/list-unselectable',
    }).as('getUnselectableLineList')

    // 回線申込画面に遷移する
    cy.visit(`/tenants/${this.tenantId}/rink-mobile/lines`)
    // 廃止ボタンを押下する
    cy.get('[data-cy="rink-mobile-lines-index-remove-button"]').click()
    cy.wait(['@getRinkConnectionList', '@postRinkLineAvailableDate'])

    cy.inputSelectForm({
      selector: '[data-cy="rink-line-search-filter-rink-mobile-id"]',
      value: unselectableRinkMobileId,
    })
    cy.get('[data-cy="search-filter-search-button"]').click()
    cy.wait(['@getUnselectableLineList'])

    // お申し込み方法選択
    cy.get('[data-cy="edit-application-type-application-type"]').find('.label.form').click()

    // チェックボックスを確認
    cy.fixture('rink-mobile/lines/list-unselectable').then(
      ({ lineList: unselectableLineList }: { lineList: RinkLineListType[] }) => {
        cy.get('[data-cy="rink-mobile-lines-remove-selector-all"]').should('have.class', 'disabled')
        unselectableLineList.forEach(row => {
          cy.get(`[data-cy="rink-mobile-lines-remove-line-table-selector-${row.lineNumber}"]`).should(
            'have.class',
            'disabled',
          )
        })
      },
    )
  })

  context('受付時間外メッセージの表示を確認', function () {
    it('受付時間外 - 日本時間(23:59)', function () {
      cy.clock(new Date(new Date().setHours(23, 59, 59, 59)), ['Date'])

      // 廃止画面の確認
      cy.visit(`/tenants/${this.tenantId}/rink-mobile/lines/remove`)
      cy.wait(['@getRinkConnectionList', '@postRinkLineAvailableDate'])
      cy.get('[data-cy="rink-mobile-lines-remove-outside-reception-hour"]').should('exist')

      cy.inputSelectForm({
        selector: '[data-cy="rink-line-search-filter-rink-mobile-id"]',
        value: RINK_MOBILE_ID,
      })
      cy.get('[data-cy="search-filter-search-button"]').click()
      cy.wait('@getLineList')

      // お申し込み方法選択
      cy.get('[data-cy="edit-application-type-application-type"]').find('.label.form').click()

      // 適当な値を入力
      CSV_REMOVE_LINE_NUMBER_LIST.forEach(lineNumber => {
        cy.get(`[data-cy="rink-mobile-lines-remove-line-table-selector-${lineNumber}"]`).click()
      })
      // 廃止希望日の入力
      cy.inputDatePicker({
        className: '[data-cy="rink-mobile-lines-remove-request-date"]',
        date: requestDate,
      })

      // 必要な情報を入力後も確認ボタンが押せないことを確認する
      cy.get('[data-cy="rink-mobile-lines-remove-submit-button"]').should('be.disabled')
    })
    it('受付時間外 - 日本時間(20:00)', function () {
      cy.clock(new Date(new Date().setHours(20, 0, 0, 0)), ['Date'])

      // 廃止画面の確認
      cy.visit(`/tenants/${this.tenantId}/rink-mobile/lines/remove`)
      cy.wait(['@getRinkConnectionList', '@postRinkLineAvailableDate'])

      cy.get('[data-cy="rink-mobile-lines-remove-outside-reception-hour"]').should('exist')
      cy.get('[data-cy="rink-mobile-lines-remove-submit-button"]').should('be.disabled')
    })
  })
})
