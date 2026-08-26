import dayjs from 'dayjs'
import { generateRandomHex, t, stripPrefix } from '@cypress/support/utils'

type InputType = {
  accessType: string
  planLimit: string
  deviceName: string
  authenticationId: string
  authenticationPassword: string
  actIpAddress: string
  sbyIpAddress?: string
}

const RINK_MOBILE_ID = 'Z000000001'

const LINE_ACT_PREFIX = ['192.168.0.4/31', '192.168.0.0/31']
const LINE_SBY_PREFIX = [] as string[]
const ACT_IP_ADDRESS_LIST = ['192.168.0.0', '192.168.0.1', '192.168.0.4', '192.168.0.5', '192.168.0.6']

const inputLine = (data: InputType) => {
  cy.inputSelectForm({
    selector: '[data-cy="edit-line-input-access-type"]',
    value: t(`rinkLines.accessTypes.${data.accessType}`),
  })
  cy.inputSelectForm({
    selector: '[data-cy="edit-line-input-plan-limit-alias"]',
    value: data.planLimit,
  })
  cy.inputSelectForm({
    selector: '[data-cy="edit-line-input-device-name-alias"]',
    value: data.deviceName,
  })
  cy.get('[data-cy="edit-line-input-authentication-id"]').find('input').clear().type(data.authenticationId)
  cy.get('[data-cy="edit-line-input-authentication-password"]').find('input').clear().type(data.authenticationPassword)
  cy.get('[data-cy="edit-line-input-act-ip-address"]').find('input').clear().type(stripPrefix(data.actIpAddress))
  if (data.sbyIpAddress) {
    cy.get('[data-cy="edit-line-input-sby-ip-address"]').find('input').clear().type(stripPrefix(data.sbyIpAddress))
  } else {
    cy.get('[data-cy="edit-line-input-sby-ip-address"]').find('input').clear()
  }
}

describe('回線新規申込テスト', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)
    this.today = dayjs().format('YYYY-MM-DD')

    cy.intercept('GET', '**/rink-mobile/v1/tenants/*/rink-connections/self-only', {
      fixture: 'rink-mobile/connections/list',
    }).as('getRinkConnectionList')
    // 新規作成画面では未開通の設備も含めて取得するpre-self-onlyのAPIを使用する
    cy.intercept('GET', '**/rink-mobile/v1/tenants/*/rink-connections/pre-self-only', {
      fixture: 'rink-mobile/connections/pre-self-only-list',
    }).as('getRinkConnectionListIncludingScheduled')
    cy.intercept('GET', `**/rink-mobile/v1/tenants/*/rink-connections/available-plan-limit/${RINK_MOBILE_ID}`, {
      fixture: 'rink-mobile/lines/available-plan-device-list',
    }).as('getAvailablePlanLimit')
    cy.intercept('GET', `**/rink-mobile/v1/tenants/*/rink-connections/linePrefix/${RINK_MOBILE_ID}`, {
      fixture: 'rink-mobile/connections/available-line-prefix',
    }).as('getRinkConnectionLinePrefix')
    cy.intercept(
      'POST',
      `**/rink-mobile/v1/tenants/*/line-available-date/self-only?orderType=create-line-lines&zId=${RINK_MOBILE_ID}`,
      {},
    ).as('postRinkLineAvailableDateForCreate')
    cy.intercept('POST', `**/rink-mobile/v1/tenants/*/lines/self-add/${RINK_MOBILE_ID}`, {
      body: { id: generateRandomHex(32) },
    }).as('postRinkLines')
    cy.intercept('GET', '**/rink-mobile/v1/tenants/*/lines/self-add/*', { fixture: 'rink-mobile/lines/list' }).as(
      'getRinkLineList',
    )

    // 回線変更画面用
    cy.intercept(
      'POST',
      '**/rink-mobile/v1/tenants/*/line-available-date/self-only?orderType=change-line-reissue',
      {},
    ).as('postRinkLineAvailableDateForEdit')
    cy.intercept('GET', `**/rink-mobile/v1/tenants/*/line-groups/self-add/${RINK_MOBILE_ID}`, {
      fixture: 'rink-mobile/line-groups/list',
    }).as('getRinkLineGroupList')

    // 回線申込画面
    cy.visit(`/tenants/${this.tenantId}/rink-mobile/lines`)
    cy.wait(['@getSession', '@getMobile', '@getSecurityTermsOfService', '@getSettingsBehaviorDetection'])
  })

  context('メンテナンス期間中の表示とボタン制御', function () {
    it('案内文表示期間中かつメンテナンス期間外はボタンが活性になる', function () {
      cy.clock(new Date('2026-07-01T10:00:00+09:00'), ['Date'])

      cy.visit(`/tenants/${this.tenantId}/rink-mobile/lines`)
      cy.wait(['@getSession', '@getMobile', '@getSecurityTermsOfService', '@getSettingsBehaviorDetection'])

      cy.get('[data-cy="rink-mobile-lines-index-maintenance-notification"]').should('exist')
      cy.get('[data-cy="rink-mobile-lines-index-application-button"]').should('not.be.disabled')
      cy.get('[data-cy="rink-mobile-lines-index-edit-button"]').should('not.be.disabled')
      cy.get('[data-cy="rink-mobile-lines-index-remove-button"]').should('not.be.disabled')
    })

    it('案内文が表示され、新規作成と廃止ボタンが非活性になる', function () {
      cy.clock(new Date('2026-07-18T10:00:00+09:00'), ['Date'])

      cy.visit(`/tenants/${this.tenantId}/rink-mobile/lines`)
      cy.wait(['@getSession', '@getMobile', '@getSecurityTermsOfService', '@getSettingsBehaviorDetection'])

      cy.get('[data-cy="rink-mobile-lines-index-maintenance-notification"]').should('exist')
      cy.get('[data-cy="rink-mobile-lines-index-application-button"]').should('be.disabled')
      cy.get('[data-cy="rink-mobile-lines-index-edit-button"]').should('not.be.disabled')
      cy.get('[data-cy="rink-mobile-lines-index-remove-button"]').should('be.disabled')
    })
  })

  it('回線新規申込：入力フォーム', function () {
    cy.clock(new Date(new Date().setHours(0, 0, 0, 0)), ['Date'])

    // 新規申込ボタン押下
    cy.get('[data-cy="rink-mobile-lines-index-application-button"]').click()
    cy.wait(['@getRinkConnectionListIncludingScheduled'])

    // RINK Mobile ID を選択
    cy.inputSelectForm({ selector: '[data-cy="rink-mobile-lines-create-rink-mobile-id"]', value: RINK_MOBILE_ID })
    cy.wait(['@getAvailablePlanLimit', '@getRinkConnectionLinePrefix'])

    cy.fixture('rink-mobile/lines/create-lines').then(fixtureData => {
      const { shippingInfo, linesList, applicationInfo } = fixtureData

      // 受付時間外メッセージが非表示であることを確認
      cy.get('[data-cy="rink-mobile-lines-create-outside-reception-hour"]').should('not.exist')

      // 申込種別を選択
      cy.get('[data-cy="edit-application-type-application-type"]').find('.label.form').click()
      cy.get('[data-cy="rink-mobile-lines-create-submit-button"]')
        .as('submitButton')
        .should('have.text', t('common.next'))
        .should('be.disabled')

      cy.fixture('rink-mobile/connections/available-line-prefix.json').then(list => {
        // prefixのリストが表示されることを確認
        list.lineActPrefix.forEach((prefix: string) => {
          cy.get('[data-cy="edit-line-input-act-ip-address-available-prefix"]').should('contain.text', prefix)
        })
        list.lineSbyPrefix.forEach((prefix: string) => {
          cy.get('[data-cy="edit-line-input-sby-ip-address-available-prefix"]').should('contain.text', prefix)
        })
      })

      // 最初の入力
      inputLine(linesList[0])
      // 申し込み予定の回線数を選択
      cy.inputSelectForm({
        selector: '[data-cy="rink-mobile-lines-create-line-counts"]',
        value: linesList.length.toString(),
      })

      // 「次へ」ボタンをクリック
      cy.get('@submitButton').click()
      cy.wait('@postRinkLineAvailableDateForCreate').then(req => {
        expect(req.request.body).to.deep.equals({ applicationInfo: applicationInfo[0] })
      })

      // モバイルアクセスIDのセレクトボックスが無効化されていることを確認
      cy.get('[data-cy="rink-mobile-lines-create-rink-mobile-id"]').find('input').should('be.disabled')
      // 回線情報のテーブルの件数を確認
      cy.get('[data-cy="edit-line-list-edit-table"]').find('.row').should('have.length', linesList.length)

      // 回線情報編集
      linesList.forEach((data: InputType, index: number) => {
        cy.get('[data-cy="edit-line-list-edit-table"]').find('.row').eq(index).find('.edit-table-edit-button').click()
        inputLine(data)
        cy.get('.dialog-base-submit-button').click()
        cy.wait('@postRinkLineAvailableDateForCreate')
          .its('request.body')
          .should('deep.equal', { applicationInfo: applicationInfo[index] })
      })

      // 配送先情報
      cy.inputShippingInformation(shippingInfo)
      // 利用開始希望日の入力
      cy.inputDatePicker({
        className: '[data-cy="edit-shipping-information-request-date"]',
        date: this.today,
      })

      // 確認ボタンをクリック
      cy.get('[data-cy="rink-mobile-lines-create-submit-button"]').should('have.text', t('common.confirm')).click()
      cy.get('[data-cy="rink-mobile-lines-create-rink-mobile-id"]').find('input').should('be.disabled')

      // 申込ボタンをクリック
      cy.get('[data-cy="rink-mobile-lines-create-submit-button"]').should('have.text', t('common.application')).click()

      // API リクエストを検証
      cy.wait('@postRinkLines').then(req => {
        expect(req.request.body).to.deep.equals({
          ...shippingInfo,
          requestDate: this.today,
          linesList: linesList.map(({ deviceName, planLimit, ...rest }: InputType) => rest),
        })
      })

      // POST完了後の画面遷移
      cy.wait([
        '@getRinkConnectionList',
        '@postRinkLineAvailableDateForEdit',
        '@getRinkLineList',
        '@getRinkLineGroupList',
        '@getRinkConnectionLinePrefix',
      ])
      cy.url().should('include', `/tenants/${this.tenantId}/rink-mobile/lines/edit?rinkMobileId=${RINK_MOBILE_ID}`)
      // 完了ダイアログ
      cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('message.finished'))
      cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
      cy.get('[data-cy="notification-dialog-submit-button"]')
        .should('have.text', t('rinkConnections.moveToTop'))
        .click()
      cy.get('[data-cy="notification-dialog-text"]').should('not.exist')

      // モバイルアクセスTOP画面に遷移する
      cy.wait(['@getRinkConnectionList'])
      cy.url().should('include', `/tenants/${this.tenantId}/rink-mobile/contracts`)
    })
  })

  it('回線新規申込：CSVファイル', function () {
    cy.clock(new Date(new Date().setHours(19, 59, 59, 59)), ['Date'])

    // 新規申込ボタン押下
    cy.get('[data-cy="rink-mobile-lines-index-application-button"]').click()
    cy.wait(['@getRinkConnectionListIncludingScheduled'])

    // RINK Mobile ID を選択
    cy.inputSelectForm({ selector: '[data-cy="rink-mobile-lines-create-rink-mobile-id"]', value: RINK_MOBILE_ID })
    cy.wait(['@getAvailablePlanLimit', '@getRinkConnectionLinePrefix'])

    cy.fixture('rink-mobile/lines/create-lines').then(fixtureData => {
      const { shippingInfo, linesList, csvApplicationInfo } = fixtureData

      // 受付時間外メッセージが非表示であることを確認
      cy.get('[data-cy="rink-mobile-lines-create-outside-reception-hour"]').should('not.exist')

      // 申込種別を選択
      cy.get('[data-cy="edit-application-type-application-type"]').find('.label.csv').click()

      // CSV ファイルをアップロード
      cy.editApplicationFileUpload({
        className: '[data-cy="edit-application-type-file-upload"]',
        filePath: 'cypress/fixtures/rink-mobile/lines/create.csv',
      })

      // CSV アップロード後、自動的に Form モードに切り替わり、回線データが表示される
      // CSV ファイルの状態がテストデータの2件目までの内容と一致することを確認
      cy.wait('@postRinkLineAvailableDateForCreate').then(req => {
        expect(req.request.body).to.deep.equals({ applicationInfo: csvApplicationInfo })
      })

      // 入力画面になっていること確認
      cy.get('[data-cy="edit-application-type-application-type"]').should('not.exist')
      // 配送先情報
      cy.inputShippingInformation(shippingInfo)
      // 利用開始希望日の入力
      cy.inputDatePicker({
        className: '[data-cy="edit-shipping-information-request-date"]',
        date: this.today,
      })

      // 確認ボタンをクリック
      cy.get('[data-cy="rink-mobile-lines-create-submit-button"]').should('have.text', t('common.confirm')).click()
      cy.get('[data-cy="rink-mobile-lines-create-rink-mobile-id"]').find('input').should('be.disabled')

      // 申込ボタンをクリック
      cy.get('[data-cy="rink-mobile-lines-create-submit-button"]').should('have.text', t('common.application')).click()

      // API リクエストの検証
      cy.wait('@postRinkLines').then(req => {
        expect(req.request.body).to.deep.equals({
          ...shippingInfo,
          requestDate: this.today,
          // CSV ファイルの状態がテストデータの2件目までの内容と一致することを確認
          linesList: [linesList[0], linesList[1]].map(({ deviceName, planLimit, ...rest }) => rest),
        })
      })

      // POST完了後の画面遷移
      cy.wait([
        '@getRinkConnectionList',
        '@postRinkLineAvailableDateForEdit',
        '@getRinkLineList',
        '@getRinkLineGroupList',
        '@getRinkConnectionLinePrefix',
      ])
      cy.url().should('include', `/tenants/${this.tenantId}/rink-mobile/lines/edit?rinkMobileId=${RINK_MOBILE_ID}`)
      // 完了ダイアログ
      cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('message.finished'))
      cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
      cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('rinkConnections.moveToTop'))

      cy.url().then(beforeUrl => {
        // 完了ダイアログで閉じるボタンを押下する
        cy.get('.dialog-card-close').should('have.text', t('common.close')).click()
        cy.get('[data-cy="notification-dialog-text"]').should('not.exist')
        cy.url().should('eq', beforeUrl)
      })
    })
  })

  it('回線の最大件数254件を超過した場合、追加ボタンが非活性', function () {
    cy.clock(new Date(new Date().setHours(0, 0, 0, 0)), ['Date'])

    // 新規申込ボタン押下
    cy.get('[data-cy="rink-mobile-lines-index-application-button"]').click()
    cy.wait(['@getRinkConnectionListIncludingScheduled'])

    cy.inputSelectForm({ selector: '[data-cy="rink-mobile-lines-create-rink-mobile-id"]', value: RINK_MOBILE_ID })
    cy.wait(['@getAvailablePlanLimit', '@getRinkConnectionLinePrefix'])
    // 申込種別を選択
    cy.get('[data-cy="edit-application-type-application-type"]').find('.label.csv').click()
    // CSVで254件アップロード
    cy.editApplicationFileUpload({
      className: '[data-cy="edit-application-type-file-upload"]',
      filePath: 'cypress/fixtures/rink-mobile/lines/create-254.csv',
    })
    cy.wait('@postRinkLineAvailableDateForCreate')
    cy.get('[data-cy="edit-line-list-edit-table"]').find('.edit-table-add-button').should('be.disabled')
  })

  it('回線を削除して0件になった場合、確認ボタンが非活性', function () {
    cy.clock(new Date(new Date().setHours(0, 0, 0, 0)), ['Date'])

    // 新規申込ボタン押下
    cy.get('[data-cy="rink-mobile-lines-index-application-button"]').click()
    cy.wait(['@getRinkConnectionListIncludingScheduled'])

    cy.inputSelectForm({ selector: '[data-cy="rink-mobile-lines-create-rink-mobile-id"]', value: RINK_MOBILE_ID })
    cy.wait(['@getAvailablePlanLimit', '@getRinkConnectionLinePrefix'])

    cy.fixture('rink-mobile/lines/create-lines').then(fixtureData => {
      const { shippingInfo, linesList } = fixtureData

      // 申込種別を選択
      cy.get('[data-cy="edit-application-type-application-type"]').find('.label.form').click()

      // 最初の入力
      inputLine(linesList[0])
      // 申し込み予定の回線数を選択
      cy.inputSelectForm({
        selector: '[data-cy="rink-mobile-lines-create-line-counts"]',
        value: '1',
      })

      // 「次へ」ボタンをクリック
      cy.get('[data-cy="rink-mobile-lines-create-submit-button"]').as('submitButton').click()
      cy.wait('@postRinkLineAvailableDateForCreate').then(req => {
        expect(req.request.body).to.deep.equals({ applicationInfo: [{ quantity: 1 }] })
      })

      // 配送先情報
      cy.inputShippingInformation(shippingInfo)
      // 利用開始希望日の入力
      cy.inputDatePicker({
        className: '[data-cy="edit-shipping-information-request-date"]',
        date: this.today,
      })

      // 確認ボタンは押下可能
      cy.get('@submitButton').should('not.be.disabled')

      // 回線情報のテーブルから回線を削除
      cy.get('[data-cy="edit-line-list-edit-table"]').find('.edit-table-trush-button').should('have.length', 1).click()

      // 回線数が0件になっていることを確認
      cy.get('[data-cy="edit-line-list-edit-table"]').find('.row').should('have.length', 0)

      // 確認ボタンは押下不可になる
      cy.get('@submitButton').should('be.disabled')
    })
  })

  it('IPアドレスの自動割り当て', function () {
    cy.clock(new Date(new Date().setHours(0, 0, 0, 0)), ['Date'])

    cy.intercept('GET', `**/rink-mobile/v1/tenants/*/rink-connections/linePrefix/${RINK_MOBILE_ID}`, {
      body: {
        lineActPrefix: LINE_ACT_PREFIX,
        lineSbyPrefix: LINE_SBY_PREFIX,
      },
    }).as('getRinkConnectionLinePrefix')

    // 新規申込ボタン押下
    cy.get('[data-cy="rink-mobile-lines-index-application-button"]').click()
    cy.wait(['@getRinkConnectionListIncludingScheduled'])

    // RINK Mobile ID を選択
    cy.inputSelectForm({ selector: '[data-cy="rink-mobile-lines-create-rink-mobile-id"]', value: RINK_MOBILE_ID })
    cy.wait(['@getAvailablePlanLimit', '@getRinkConnectionLinePrefix'])

    cy.fixture('rink-mobile/lines/create-lines').then(fixtureData => {
      const { linesList } = fixtureData

      // 申込種別を選択
      cy.get('[data-cy="edit-application-type-application-type"]').find('.label.form').click()

      // prefixのリストが表示されることを確認
      LINE_ACT_PREFIX.forEach((prefix: string) => {
        cy.get('[data-cy="edit-line-input-act-ip-address-available-prefix"]').should('contain.text', prefix)
      })
      // prefixがない場合 (なし) と表示される
      cy.get('[data-cy="edit-line-input-sby-ip-address-available-prefix"]').should('contain.text', t('orders.none'))

      // 最初の入力
      inputLine({ ...linesList[0], actIpAddress: '192.168.0.0', sbyIpAddress: '' })
      // 申し込み予定の回線数を選択
      cy.inputSelectForm({
        selector: '[data-cy="rink-mobile-lines-create-line-counts"]',
        value: '5',
      })

      // 「次へ」ボタンをクリック
      cy.get('[data-cy="rink-mobile-lines-create-submit-button"]').click()
      cy.wait('@postRinkLineAvailableDateForCreate')

      // 回線情報確認
      ACT_IP_ADDRESS_LIST.forEach((ipAddress, index) => {
        // ダイアログを開く
        cy.get('[data-cy="edit-line-list-edit-table"]').find('.row').eq(index).find('.edit-table-edit-button').click()
        // IPアドレスが自動で割り当てられていることを確認
        cy.get('[data-cy="edit-line-input-act-ip-address"]').find('input').should('have.value', ipAddress)
        cy.get('[data-cy="edit-line-input-sby-ip-address"]').find('input').should('have.value', '')
        if (index === 4) {
          // 5件目は利用可能なIPアドレスがないためエラーメッセージが表示される
          cy.get('[data-cy="edit-line-input-act-ip-address"]').should(
            'contain.text',
            t('invalid.notAvailableIpAddress'),
          )
          // 保存ボタンは押下不可
          cy.get('.dialog-base-submit-button').should('be.disabled')
          cy.get('.dialog-card-close').click()
        } else {
          cy.get('[data-cy="edit-line-input-act-ip-address"]').should(
            'not.contain.text',
            t('invalid.notAvailableIpAddress'),
          )
          cy.get('.dialog-base-submit-button').click()
        }
      })
    })
  })

  context('受付時間外メッセージの表示を確認', function () {
    it('受付時間外 - 日本時間(23:59)', function () {
      cy.clock(new Date(new Date().setHours(23, 59, 59, 59)), ['Date'])

      // 新規申込ボタン押下
      cy.get('[data-cy="rink-mobile-lines-index-application-button"]').click()
      cy.wait(['@getRinkConnectionListIncludingScheduled'])

      // RINK Mobile ID を選択
      cy.inputSelectForm({ selector: '[data-cy="rink-mobile-lines-create-rink-mobile-id"]', value: RINK_MOBILE_ID })
      cy.wait(['@getAvailablePlanLimit', '@getRinkConnectionLinePrefix'])

      cy.fixture('rink-mobile/lines/create-lines').then(fixtureData => {
        cy.get('[data-cy="rink-mobile-lines-create-outside-reception-hour"]').should('exist')
        const { linesList } = fixtureData

        // 申込種別を選択
        cy.get('[data-cy="edit-application-type-application-type"]').find('.label.form').click()

        // 最初の入力
        inputLine(linesList[0])
        // 申し込み予定の回線数を選択
        cy.inputSelectForm({
          selector: '[data-cy="rink-mobile-lines-create-line-counts"]',
          value: linesList.length.toString(),
        })

        // 確認ボタンをクリック不可を確認
        cy.get('[data-cy="rink-mobile-lines-create-submit-button"]')
          .should('have.text', t('common.next'))
          .should('be.disabled')
      })
    })

    it('受付時間外 - 日本時間(20:00)', function () {
      cy.clock(new Date(new Date().setHours(20, 0, 0, 0)), ['Date'])

      // 新規申込ボタン押下
      cy.get('[data-cy="rink-mobile-lines-index-application-button"]').click()
      cy.wait(['@getRinkConnectionListIncludingScheduled'])

      cy.get('[data-cy="rink-mobile-lines-create-outside-reception-hour"]').should('exist')
    })
  })
})
