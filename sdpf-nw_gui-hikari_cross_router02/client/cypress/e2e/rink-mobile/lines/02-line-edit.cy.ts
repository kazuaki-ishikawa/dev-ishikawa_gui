import dayjs from 'dayjs'
import type { RinkLineEditMenuType } from '@app/api/rinkLines/types'
import { RinkLineAdditionalLimitTypes, RinkLineEditMenuTypes, RinkLineStatusTypes } from '@app/api/rinkLines/constants'
import { t, generateRandomHex, stripPrefix } from '@cypress/support/utils'

const RINK_MOBILE_ID = 'Z000000001'
const PLAN_NAME = 'planC'
const AUTHENTICATION_ID_LIST = ['device_a', 'device_b']
const EXTRA_LINE_NUMBER = '02033333333'
const ACT_IP_ADDRESS = '10.138.16.0'
const SBY_IP_ADDRESS = '10.138.17.0'
const CANCEL_ORDER_LINE_NUMBER = '02055555555'
const OUTSIDE_RECEPTION_HOURS_CASES = [
  {
    label: '日本時間(23:59)',
    time: { hour: 23, minute: 59, second: 59, millisecond: 999 },
  },
  {
    label: '日本時間(20:00)',
    time: { hour: 20, minute: 0, second: 0, millisecond: 0 },
  },
] as const

const openLineEdit = (
  tenantId: string,
  editType: RinkLineEditMenuType,
  time: { hour: number; minute: number; second: number; millisecond: number },
) => {
  cy.clock(new Date().setUTCHours(time.hour - 9, time.minute, time.second, time.millisecond), ['Date'])
  // 回線申込画面
  cy.visit(`/tenants/${tenantId}/rink-mobile/lines`)
  cy.wait([
    '@getSession',
    '@getMobile',
    '@getTrafficReportFlowAnalyzerTermsOfService',
    '@getSecurityTermsOfService',
    '@getSettingsBehaviorDetection',
  ])
  // 変更ボタン押下
  cy.get('[data-cy="rink-mobile-lines-index-edit-button"]').click()
  cy.wait(['@getRinkConnectionList'])
  cy.wait('@postRinkLineAvailableDate').then(req => {
    expect(req.request.body).to.deep.equal({})
  })

  // 検索欄の初期値
  cy.get('[data-cy="rink-line-search-filter-rink-mobile-id"]').find('input').should('have.value', '')
  cy.get('[data-cy="rink-line-search-filter-line-number"]').find('input').should('have.value', '')
  cy.get('[data-cy="search-filter-clear-button"]').should('be.disabled')
  cy.get('[data-cy="search-filter-search-button"]').should('be.disabled')

  // テーブル欄の初期表示
  cy.get('[data-cy="rink-mobile-lines-edit-search-empty"]').should('exist')
  cy.get('[data-cy="rink-mobile-lines-edit-rink-mobile-id"]').should('not.exist')
  cy.get('[data-cy="rink-mobile-lines-edit-edit-menu-selector"]').should('not.exist')
  cy.get('[data-cy="rink-mobile-lines-edit-rink-line-suspend-counts"]').should('not.exist')
  cy.get('[data-cy="rink-mobile-lines-edit-rink-line-active-counts"]').should('not.exist')
  cy.get('[data-cy="edit-application-type-application-type"]').should('not.exist')
  cy.get('[data-cy="rink-mobile-lines-edit-line-table"]').should('not.exist')

  // 検索欄のモバイルアクセスIDを選択して検索ボタンを押下する
  cy.inputSelectForm({
    selector: '[data-cy="rink-line-search-filter-rink-mobile-id"]',
    value: RINK_MOBILE_ID,
  })
  cy.get('[data-cy="search-filter-search-button"]').click()

  cy.wait(['@getLineList', '@getAvailablePlanDeviceList', '@getRinkConnectionLinePrefix', '@getRinkLineGroupList'])

  // お申し込み方法はまだ非表示
  cy.get('[data-cy="edit-application-type-application-type"]').should('not.exist')

  // 編集メニューを選択
  cy.get('[data-cy="rink-mobile-lines-edit-edit-menu-selector"]').find(`.label.${editType}`).click()
}

const uploadCsvFile = (editType: RinkLineEditMenuType) => {
  // 「CSVファイルを利用してお申し込み」を選択
  cy.get('[data-cy="edit-application-type-application-type"]').find('.label.csv').click()

  // ファイルアップロードからCSVファイルをアップロードする
  cy.editApplicationFileUpload({
    className: '[data-cy="edit-application-type-file-upload"]',
    filePath: `cypress/fixtures/rink-mobile/lines/edit-${editType}.csv`,
  })

  cy.wait(['@getLineList', '@getRinkLineGroupList', '@getAvailablePlanDeviceList', '@getRinkConnectionLinePrefix'])

  // 「入力フォームからお申し込み」に切り替わっていることを確認する
  cy.get('[data-cy="edit-application-type-application-type"]')
    .find('.radio.checked')
    .find('.label.form')
    .should('have.length', 1)
}

const completeDialogAndMoveToTop = (tenantId: string) => {
  // 完了ダイアログ
  cy.wait(['@getLineList', '@getRinkLineGroupList', '@getAvailablePlanDeviceList', '@getRinkConnectionLinePrefix'])
  cy.url().should('include', `/tenants/${tenantId}/rink-mobile/lines/edit?rinkMobileId=${RINK_MOBILE_ID}`)
  cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('rinkLines.message.accepted'))
  cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
  cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('rinkConnections.moveToTop')).click()
  cy.get('[data-cy="notification-dialog-text"]').should('not.exist')

  // モバイルアクセスTOP画面に遷移する
  cy.wait(['@getRinkConnectionList'])
  cy.url().should('include', `/tenants/${tenantId}/rink-mobile/contracts`)
}

describe('回線一覧（変更）テスト', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)

    cy.fixture('rink-mobile/lines/edit').then(data => {
      this.editData = data
    })
    cy.fixture('rink-mobile/lines/list').then(data => {
      this.lineList = data.lineList
      this.counts = data.lineList.reduce(
        (acc: { active: number; suspend: number }, cur: { lineStatus: string }) => {
          if (cur.lineStatus === RinkLineStatusTypes.Active) {
            acc.active += 1
          } else if (cur.lineStatus === RinkLineStatusTypes.Suspend) {
            acc.suspend += 1
          }
          return acc
        },
        { active: 0, suspend: 0 },
      )
    })

    cy.intercept('GET', '**/rink-mobile/v1/tenants/*/rink-connections/self-only', {
      fixture: 'rink-mobile/connections/list',
    }).as('getRinkConnectionList')

    cy.intercept('GET', `**/rink-mobile/v1/tenants/*/lines/self-add/${RINK_MOBILE_ID}?*`, {
      fixture: 'rink-mobile/lines/list',
    }).as('getLineList')
    cy.intercept('GET', `**/rink-mobile/v1/tenants/*/rink-connections/available-plan-limit/${RINK_MOBILE_ID}`, {
      fixture: 'rink-mobile/connections/available-plan-limit',
    }).as('getAvailablePlanDeviceList')
    cy.intercept('GET', `**/rink-mobile/v1/tenants/*/rink-connections/linePrefix/${RINK_MOBILE_ID}`, {
      fixture: 'rink-mobile/connections/available-line-prefix',
    }).as('getRinkConnectionLinePrefix')
    cy.intercept('GET', `**/rink-mobile/v1/tenants/*/line-groups/self-add/${RINK_MOBILE_ID}`, {
      fixture: 'rink-mobile/line-groups/list',
    }).as('getRinkLineGroupList')
    cy.intercept(
      'POST',
      '**/rink-mobile/v1/tenants/*/line-available-date/self-only?orderType=change-line-reissue',
      {},
    ).as('postRinkLineAvailableDate')

    cy.intercept('PUT', '**/rink-mobile/v1/tenants/*/lines/*', {}).as('putRinkLine')
  })

  context('メンテナンス期間中の表示と変更対象の制御', function () {
    it('案内文表示期間中かつメンテナンス期間外は変更対象が活性になる', function () {
      cy.clock(new Date('2026-07-01T10:00:00+09:00'), ['Date'])

      cy.visit(`/tenants/${this.tenantId}/rink-mobile/lines`)
      cy.wait([
        '@getSession',
        '@getMobile',
        '@getTrafficReportFlowAnalyzerTermsOfService',
        '@getSecurityTermsOfService',
        '@getSettingsBehaviorDetection',
      ])
      cy.get('[data-cy="rink-mobile-lines-index-edit-button"]').click()
      cy.wait(['@getRinkConnectionList', '@postRinkLineAvailableDate'])

      cy.get('[data-cy="rink-mobile-lines-edit-maintenance-notification"]').should('exist')

      cy.inputSelectForm({
        selector: '[data-cy="rink-line-search-filter-rink-mobile-id"]',
        value: RINK_MOBILE_ID,
      })
      cy.get('[data-cy="search-filter-search-button"]').click()
      cy.wait(['@getLineList', '@getAvailablePlanDeviceList', '@getRinkConnectionLinePrefix', '@getRinkLineGroupList'])

      Object.values(RinkLineEditMenuTypes).forEach(value => {
        cy.get('[data-cy="rink-mobile-lines-edit-edit-menu-selector"]')
          .find(`.label.${value}`)
          .parents('.radio')
          .should('not.have.class', 'disabled')
      })
    })

    it('案内文が表示され、容量追加以外の変更対象が非活性になる', function () {
      cy.clock(new Date('2026-07-18T10:00:00+09:00'), ['Date'])

      cy.visit(`/tenants/${this.tenantId}/rink-mobile/lines`)
      cy.wait([
        '@getSession',
        '@getMobile',
        '@getTrafficReportFlowAnalyzerTermsOfService',
        '@getSecurityTermsOfService',
        '@getSettingsBehaviorDetection',
      ])
      cy.get('[data-cy="rink-mobile-lines-index-edit-button"]').click()
      cy.wait(['@getRinkConnectionList', '@postRinkLineAvailableDate'])

      cy.get('[data-cy="rink-mobile-lines-edit-maintenance-notification"]').should('exist')

      cy.inputSelectForm({
        selector: '[data-cy="rink-line-search-filter-rink-mobile-id"]',
        value: RINK_MOBILE_ID,
      })
      cy.get('[data-cy="search-filter-search-button"]').click()
      cy.wait(['@getLineList', '@getAvailablePlanDeviceList', '@getRinkConnectionLinePrefix', '@getRinkLineGroupList'])

      cy.get('[data-cy="rink-mobile-lines-edit-edit-menu-selector"]')
        .find(`.label.${RinkLineEditMenuTypes.AdditionalLimit}`)
        .parents('.radio')
        .should('not.have.class', 'disabled')

      Object.values(RinkLineEditMenuTypes)
        .filter(value => value !== RinkLineEditMenuTypes.AdditionalLimit)
        .forEach(value => {
          cy.get('[data-cy="rink-mobile-lines-edit-edit-menu-selector"]')
            .find(`.label.${value}`)
            .parents('.radio')
            .should('have.class', 'disabled')
        })
    })
  })

  context('料金プラン・コース変更', function () {
    const EditType = RinkLineEditMenuTypes.Plan

    it('入力フォームからお申し込み', function () {
      openLineEdit(this.tenantId, EditType, { hour: 0, minute: 0, second: 0, millisecond: 0 })

      // 受付時間外メッセージの非表示確認
      cy.get('[data-cy="rink-mobile-lines-edit-outside-reception-hour"]').should('not.exist')
      // ボタン初期値の確認
      cy.get('[data-cy="rink-mobile-lines-edit-submit-button"]')
        .as('submitButton')
        .should('have.text', t('common.confirm'))
        .should('be.disabled')

      // 「入力フォームからお申し込み」を選択
      cy.get('[data-cy="edit-application-type-application-type"]').find('.label.form').click()

      const edit = this.editData[EditType]

      // 非表示確認
      cy.get('[data-cy="rink-mobile-lines-edit-rink-line-suspend-counts"]').should('not.exist')
      cy.get('[data-cy="rink-mobile-lines-edit-rink-line-active-counts"]').should('not.exist')

      // 変更する回線を選択
      edit.linesList.forEach(({ lineNumber }: { lineNumber: string }) => {
        cy.get(`[data-cy="rink-mobile-lines-edit-line-table-selector-${lineNumber}"]`).click()
      })

      // 料金プラン・コース未選択時に確認ボタンが押せないことを確認
      cy.get('@submitButton').should('be.disabled')

      // 料金プラン・コースを選択
      edit.linesList.forEach(({ lineNumber }: { lineNumber: string }) => {
        cy.get(`[data-cy="rink-mobile-lines-edit-plan-select-form-${lineNumber}"]`)
          .find('input')
          .should('have.value', '')
        cy.inputSelectForm({
          selector: `[data-cy="rink-mobile-lines-edit-plan-select-form-${lineNumber}"]`,
          value: PLAN_NAME,
        })
      })

      // 確認ボタンを押下
      cy.get('@submitButton').click()
      // 表示確認
      cy.get('[data-cy="rink-mobile-lines-edit-start-ordering-card"]').should('contain', t('rinkLines.reflectionDate'))
      cy.get('[data-cy="rink-mobile-lines-edit-start-ordering-message"]').should(
        'have.text',
        t('rinkLines.message.editMenuPlan'),
      )
      // 保存ボタンを押下
      cy.get('@submitButton').should('have.text', t('common.save')).click()
      cy.wait('@putRinkLine').then(req => {
        expect(req.request.url).to.include(`lines/${EditType}`)
        expect(req.request.body).to.deep.equal(edit)
      })
      completeDialogAndMoveToTop(this.tenantId)
    })

    it('CSVファイルを利用してお申し込み', function () {
      openLineEdit(this.tenantId, EditType, { hour: 0, minute: 0, second: 0, millisecond: 0 })

      uploadCsvFile(EditType)
      const edit = this.editData[EditType]

      this.lineList.forEach(({ lineNumber }: { lineNumber: string }) => {
        const targetCheckbox = `[data-cy="rink-mobile-lines-edit-line-table-selector-${lineNumber}"]`

        const isChanged = edit.linesList.some((v: { lineNumber: string }) => v.lineNumber === lineNumber)
        if (isChanged) {
          // 入力した回線がチェックされていることを確認
          cy.get(targetCheckbox).should('have.class', 'checked')

          // 変更したプラン名が表示されていることを確認
          cy.get(`[data-cy="rink-mobile-lines-edit-plan-select-form-${lineNumber}"]`)
            .find('input')
            .should('have.value', PLAN_NAME)
        } else {
          // 入力していない回線 または 異なる accessType のプランが入力された回線 がチェックされないことを確認
          cy.get(targetCheckbox).should('not.have.class', 'checked')
        }
      })

      // 確認ボタンを押下し、再度保存ボタンを押下
      cy.get('[data-cy="rink-mobile-lines-edit-submit-button"]').click()
      cy.get('[data-cy="rink-mobile-lines-edit-submit-button"]').should('have.text', t('common.save')).click()
      cy.wait('@putRinkLine').then(req => {
        expect(req.request.url).to.include(`lines/${EditType}`)
        expect(req.request.body).to.deep.equal(edit)
      })
      completeDialogAndMoveToTop(this.tenantId)
    })

    it(`営業時間外は申込不可 (${OUTSIDE_RECEPTION_HOURS_CASES[0].label})`, function () {
      openLineEdit(this.tenantId, EditType, OUTSIDE_RECEPTION_HOURS_CASES[0].time)

      // 受付時間外メッセージが表示されることを確認
      cy.get('[data-cy="rink-mobile-lines-edit-outside-reception-hour"]').should('exist')

      // 「入力フォームからお申し込み」を選択
      cy.get('[data-cy="edit-application-type-application-type"]').find('.label.form').click()

      const edit = this.editData[EditType]

      // 変更する回線を選択
      edit.linesList.forEach(({ lineNumber }: { lineNumber: string }) => {
        cy.get(`[data-cy="rink-mobile-lines-edit-line-table-selector-${lineNumber}"]`).click()
      })

      // 料金プラン・コースを選択
      edit.linesList.forEach(({ lineNumber }: { lineNumber: string }) => {
        cy.inputSelectForm({
          selector: `[data-cy="rink-mobile-lines-edit-plan-select-form-${lineNumber}"]`,
          value: PLAN_NAME,
        })
      })

      // 必要な情報を入力後も確認ボタンが押せないことを確認する
      cy.get('[data-cy="rink-mobile-lines-edit-submit-button"]').should('be.disabled')
    })
  })

  context('SIM再発行', function () {
    const EditType = RinkLineEditMenuTypes.Reissue

    it('入力フォームからお申し込み', function () {
      openLineEdit(this.tenantId, EditType, { hour: 0, minute: 0, second: 0, millisecond: 0 })

      // お申し込み方法選択欄が非表示であることを確認
      cy.get('[data-cy="edit-application-type-application-type"]').should('not.exist')

      const edit = this.editData[EditType]

      // 非表示確認
      cy.get('[data-cy="rink-mobile-lines-edit-rink-line-suspend-counts"]').should('not.exist')
      cy.get('[data-cy="rink-mobile-lines-edit-rink-line-active-counts"]').should('not.exist')

      // 変更する回線を選択
      edit.linesList.forEach(({ lineNumber }: { lineNumber: string }) => {
        cy.get(`[data-cy="rink-mobile-lines-edit-line-table-selector-${lineNumber}"]`).click()
      })

      // 配送先を未入力時に確認ボタンが押せないことを確認
      cy.get('[data-cy="rink-mobile-lines-edit-submit-button"]').as('submitButton').should('be.disabled')

      // 配送先情報を入力
      cy.get('[data-cy="edit-shipping-information-shipping-postal-code"]')
        .find('input')
        .should('have.value', '')
        .type(edit.shippingPostalCode)
      cy.get('[data-cy="edit-shipping-information-shipping-prefecture"]').find('input').should('have.value', '')
      cy.inputSelectForm({
        selector: '[data-cy="edit-shipping-information-shipping-prefecture"]',
        value: edit.shippingPrefecture,
      })
      cy.get('[data-cy="edit-shipping-information-shipping-city"]')
        .find('input')
        .should('have.value', '')
        .type(edit.shippingCity)
      cy.get('[data-cy="edit-shipping-information-shipping-city-additional-info"]')
        .find('input')
        .should('have.value', '')
        .type(edit.shippingCityAdditionalInfo)
      cy.get('[data-cy="edit-shipping-information-shipping-address-block"]')
        .find('input')
        .should('have.value', '')
        .type(edit.shippingAddressBlock)
      cy.get('[data-cy="edit-shipping-information-shipping-address-number"]')
        .find('input')
        .should('have.value', '')
        .type(edit.shippingAddressNumber)
      cy.get('[data-cy="edit-shipping-information-shipping-building"]')
        .find('input')
        .should('have.value', '')
        .type(edit.shippingBuilding)
      cy.get('[data-cy="edit-shipping-information-package-recipient"]')
        .find('input')
        .should('have.value', '')
        .type(edit.packageRecipient)
      cy.get('[data-cy="edit-shipping-information-phone-number"]')
        .find('input')
        .should('have.value', '')
        .type(edit.phoneNumber)

      // 利用開始希望日の入力
      const today = dayjs().format('YYYY-MM-DD')
      cy.get('[data-cy="edit-shipping-information-request-date"]').find('input').should('have.value', '')
      cy.inputDatePicker({
        className: '[data-cy="edit-shipping-information-request-date"]',
        date: today,
      })

      // 確認ボタンを押下
      cy.get('@submitButton').click()
      // 非表示確認
      cy.get('[data-cy="rink-mobile-lines-edit-start-ordering-card"]').should('not.exist')
      // 保存ボタンを押下
      cy.get('@submitButton').should('have.text', t('common.save')).click()
      cy.wait('@putRinkLine').then(req => {
        expect(req.request.url).to.include(`lines/${EditType}`)
        expect(req.request.body).to.deep.equal({ ...edit, requestDate: today })
      })
      completeDialogAndMoveToTop(this.tenantId)
    })

    it('過去情報から配送先情報を入力のテスト', function () {
      openLineEdit(this.tenantId, EditType, { hour: 0, minute: 0, second: 0, millisecond: 0 })

      cy.fixture('rink-mobile/connections/shipping-addresses').then(body => {
        cy.intercept('GET', '**/rink-mobile/v1/tenants/*/shipping-address-history/self-only', {
          body,
        }).as('getShippingAddressHistoryList')

        const edit = this.editData[EditType]

        // 変更する回線を選択
        edit.linesList.forEach(({ lineNumber }: { lineNumber: string }) => {
          cy.get(`[data-cy="rink-mobile-lines-edit-line-table-selector-${lineNumber}"]`).click()
        })

        // 配送先情報初期値
        cy.confirmShippingInformation()

        // 送付先リストダイアログを表示
        cy.get('[data-cy="shipping-history-button-history-button"]').click()
        cy.wait('@getShippingAddressHistoryList')
        // 選択前は確認ボタンが押せないことを確認
        cy.get('.dialog-base-submit-button').should('be.disabled')
        // 送付先を選択してダイアログを閉じる
        cy.get('.dialog-card-content .shipping-list-item-button').first().click({ force: true })
        cy.get('.dialog-base-submit-button').click()

        // 入力値の確認
        const latestShippingAddress = body.shippingAddresses[0]
        cy.confirmShippingInformation(latestShippingAddress)

        // 利用開始希望日の入力
        const today = dayjs().format('YYYY-MM-DD')
        cy.get('[data-cy="edit-shipping-information-request-date"]').find('input').should('have.value', '')
        cy.inputDatePicker({
          className: '[data-cy="edit-shipping-information-request-date"]',
          date: today,
        })

        // 他の編集メニューを選択した後に戻った時に初期化されることを確認する
        cy.get('[data-cy="rink-mobile-lines-edit-edit-menu-selector"]')
          .find(`.label.${RinkLineEditMenuTypes.AdditionalLimit}`)
          .click()
        cy.get('[data-cy="shipping-history-button-history-button"]').should('not.exist')

        // SIM再発行を再選択
        cy.get('[data-cy="rink-mobile-lines-edit-edit-menu-selector"]').find(`.label.${EditType}`).click()
        // 配送先情報初期値
        cy.confirmShippingInformation()
      })
    })

    it(`営業時間外は申込不可 (${OUTSIDE_RECEPTION_HOURS_CASES[1].label})`, function () {
      openLineEdit(this.tenantId, EditType, OUTSIDE_RECEPTION_HOURS_CASES[1].time)

      // 受付時間外メッセージが表示されることを確認
      cy.get('[data-cy="rink-mobile-lines-edit-outside-reception-hour"]').should('exist')

      const edit = this.editData[EditType]

      // 変更する回線を選択
      edit.linesList.forEach(({ lineNumber }: { lineNumber: string }) => {
        cy.get(`[data-cy="rink-mobile-lines-edit-line-table-selector-${lineNumber}"]`).click()
      })

      // 配送先情報を入力
      cy.get('[data-cy="edit-shipping-information-shipping-postal-code"]').find('input').type(edit.shippingPostalCode)
      cy.inputSelectForm({
        selector: '[data-cy="edit-shipping-information-shipping-prefecture"]',
        value: edit.shippingPrefecture,
      })
      cy.get('[data-cy="edit-shipping-information-shipping-city"]').find('input').type(edit.shippingCity)
      cy.get('[data-cy="edit-shipping-information-shipping-city-additional-info"]')
        .find('input')
        .type(edit.shippingCityAdditionalInfo)
      cy.get('[data-cy="edit-shipping-information-shipping-address-block"]')
        .find('input')
        .type(edit.shippingAddressBlock)
      cy.get('[data-cy="edit-shipping-information-shipping-address-number"]')
        .find('input')
        .type(edit.shippingAddressNumber)
      cy.get('[data-cy="edit-shipping-information-shipping-building"]').find('input').type(edit.shippingBuilding)
      cy.get('[data-cy="edit-shipping-information-package-recipient"]').find('input').type(edit.packageRecipient)
      cy.get('[data-cy="edit-shipping-information-phone-number"]').find('input').type(edit.phoneNumber)

      // 利用開始希望日の入力
      const today = dayjs().format('YYYY-MM-DD')
      cy.inputDatePicker({
        className: '[data-cy="edit-shipping-information-request-date"]',
        date: today,
      })

      // 必要な情報を入力後も確認ボタンが押せないことを確認する
      cy.get('[data-cy="rink-mobile-lines-edit-submit-button"]').should('be.disabled')
    })
  })

  context('認証情報変更', function () {
    const EditType = RinkLineEditMenuTypes.Authentication

    it('入力フォームからお申し込み', function () {
      openLineEdit(this.tenantId, EditType, { hour: 0, minute: 0, second: 0, millisecond: 0 })

      // 「入力フォームからお申し込み」を選択
      cy.get('[data-cy="edit-application-type-application-type"]').find('.label.form').click()

      const edit = this.editData[EditType] as {
        linesList: Array<{ lineNumber: string; authenticationId: string; authenticationPassword: string }>
      }

      // 非表示確認
      cy.get('[data-cy="rink-mobile-lines-edit-rink-line-suspend-counts"]').should('not.exist')
      cy.get('[data-cy="rink-mobile-lines-edit-rink-line-active-counts"]').should('not.exist')

      // 変更する回線を選択
      edit.linesList.forEach(({ lineNumber }: { lineNumber: string }) => {
        cy.get(`[data-cy="rink-mobile-lines-edit-line-table-selector-${lineNumber}"]`).click()
      })
      // 変更しない回線を追加で選択
      cy.get(`[data-cy="rink-mobile-lines-edit-line-table-selector-${EXTRA_LINE_NUMBER}"]`).click()

      // 未変更時に確認ボタンが押せないことを確認
      cy.get('[data-cy="rink-mobile-lines-edit-submit-button"]').as('submitButton').should('be.disabled')

      edit.linesList.forEach(({ lineNumber, authenticationId, authenticationPassword }, index) => {
        // 認証IDを入力
        cy.get(`[data-cy="rink-mobile-lines-edit-authentication-id-input-form-${lineNumber}"]`)
          .find('input')
          .should('have.value', AUTHENTICATION_ID_LIST[index])
          .clear()
          .type(authenticationId)

        // 認証パスワードがある場合は入力する
        cy.get(`[data-cy="rink-mobile-lines-edit-authentication-password-input-form-${lineNumber}"]`)
          .find('input')
          .as('authorizationPassword')
          .should('have.value', '')
        if (authenticationPassword) {
          cy.get('@authorizationPassword').type(authenticationPassword)
        }
      })

      // 確認ボタンを押下
      cy.get('@submitButton').click()
      // 変更しない回線のチェックが外れていることを確認
      cy.get(`[data-cy="rink-mobile-lines-edit-line-table-selector-${EXTRA_LINE_NUMBER}"]`).should(
        'not.have.class',
        'checked',
      )
      // 非表示確認
      cy.get('[data-cy="rink-mobile-lines-edit-start-ordering-card"]').should('not.exist')
      // 保存ボタンを押下
      cy.get('@submitButton').should('have.text', t('common.save')).click()
      cy.wait('@putRinkLine').then(req => {
        expect(req.request.url).to.include(`lines/${EditType}`)
        expect(req.request.body).to.deep.equal(edit)
      })
      completeDialogAndMoveToTop(this.tenantId)
    })

    it('CSVファイルを利用してお申し込み', function () {
      openLineEdit(this.tenantId, EditType, { hour: 0, minute: 0, second: 0, millisecond: 0 })

      uploadCsvFile(EditType)
      const edit = this.editData[EditType]

      this.lineList.forEach(({ lineNumber }: { lineNumber: string }) => {
        const targetCheckbox = `[data-cy="rink-mobile-lines-edit-line-table-selector-${lineNumber}"]`

        const expected = edit.linesList.find((v: { lineNumber: string }) => v.lineNumber === lineNumber)
        if (expected) {
          // 入力した回線がチェックされていることを確認
          cy.get(targetCheckbox).should('have.class', 'checked')
          // 変更した認証ID・パスワードが表示されていることを確認
          cy.get(`[data-cy="rink-mobile-lines-edit-authentication-id-input-form-${lineNumber}"]`)
            .find('input')
            .should('have.value', expected.authenticationId)
          cy.get(`[data-cy="rink-mobile-lines-edit-authentication-password-input-form-${lineNumber}"]`)
            .find('input')
            .should('have.value', expected.authenticationPassword ?? '')
        } else {
          // 入力していない回線がチェックされないことを確認
          cy.get(targetCheckbox).should('not.have.class', 'checked')
        }
      })

      // 確認ボタンを押下し、再度保存ボタンを押下
      cy.get('[data-cy="rink-mobile-lines-edit-submit-button"]').click()
      cy.get('[data-cy="rink-mobile-lines-edit-submit-button"]').should('have.text', t('common.save')).click()
      cy.wait('@putRinkLine').then(req => {
        expect(req.request.url).to.include(`lines/${EditType}`)
        expect(req.request.body).to.deep.equal(edit)
      })
      completeDialogAndMoveToTop(this.tenantId)
    })

    it(`営業時間外は申込不可 (${OUTSIDE_RECEPTION_HOURS_CASES[0].label})`, function () {
      openLineEdit(this.tenantId, EditType, OUTSIDE_RECEPTION_HOURS_CASES[0].time)

      // 受付時間外メッセージが表示されることを確認
      cy.get('[data-cy="rink-mobile-lines-edit-outside-reception-hour"]').should('exist')

      // 「入力フォームからお申し込み」を選択
      cy.get('[data-cy="edit-application-type-application-type"]').find('.label.form').click()

      const edit = this.editData[EditType] as {
        linesList: Array<{ lineNumber: string; authenticationId: string; authenticationPassword: string }>
      }

      // 変更する回線を選択
      edit.linesList.forEach(({ lineNumber }: { lineNumber: string }) => {
        cy.get(`[data-cy="rink-mobile-lines-edit-line-table-selector-${lineNumber}"]`).click()
      })

      edit.linesList.forEach(({ lineNumber, authenticationId, authenticationPassword }, index) => {
        // 認証IDを入力
        cy.get(`[data-cy="rink-mobile-lines-edit-authentication-id-input-form-${lineNumber}"]`)
          .find('input')
          .should('have.value', AUTHENTICATION_ID_LIST[index])
          .clear()
          .type(authenticationId)

        // 認証パスワードがある場合は入力する
        cy.get(`[data-cy="rink-mobile-lines-edit-authentication-password-input-form-${lineNumber}"]`)
          .find('input')
          .clear()
        if (authenticationPassword) {
          cy.get(`[data-cy="rink-mobile-lines-edit-authentication-password-input-form-${lineNumber}"]`)
            .find('input')
            .type(authenticationPassword)
        }
      })

      // 必要な情報を入力後も確認ボタンが押せないことを確認する
      cy.get('[data-cy="rink-mobile-lines-edit-submit-button"]').should('be.disabled')
    })
  })

  context('容量追加', function () {
    const EditType = RinkLineEditMenuTypes.AdditionalLimit

    it('入力フォームからお申し込み', function () {
      openLineEdit(this.tenantId, EditType, { hour: 0, minute: 0, second: 0, millisecond: 0 })

      // 「入力フォームからお申し込み」を選択
      cy.get('[data-cy="edit-application-type-application-type"]').find('.label.form').click()

      const edit = this.editData[EditType]

      // 非表示確認
      cy.get('[data-cy="rink-mobile-lines-edit-rink-line-suspend-counts"]').should('not.exist')
      cy.get('[data-cy="rink-mobile-lines-edit-rink-line-active-counts"]').should('not.exist')

      // 変更する回線を選択
      edit.linesList.forEach(({ lineNumber }: { lineNumber: string }) => {
        cy.get(`[data-cy="rink-mobile-lines-edit-line-table-selector-${lineNumber}"]`).click()
      })

      // 追加容量未選択時に確認ボタンが押せないことを確認
      cy.get('[data-cy="rink-mobile-lines-edit-submit-button"]').as('submitButton').should('be.disabled')

      // 追加容量を選択
      edit.linesList.forEach(({ lineNumber, additionalLimit }: { lineNumber: string; additionalLimit: number }) => {
        const found = Object.entries(RinkLineAdditionalLimitTypes).find(([_, value]) => value === additionalLimit)?.[0]
        cy.get(`[data-cy="rink-mobile-lines-edit-additional-limit-select-form-${lineNumber}"]`)
          .find('input')
          .should('have.value', '')
        cy.inputSelectForm({
          selector: `[data-cy="rink-mobile-lines-edit-additional-limit-select-form-${lineNumber}"]`,
          value: `${found}`,
        })
      })

      // 確認ボタンを押下
      cy.get('@submitButton').click()
      // 非表示確認
      cy.get('[data-cy="rink-mobile-lines-edit-start-ordering-card"]').should('not.exist')
      // 保存ボタンを押下
      cy.get('@submitButton').should('have.text', t('common.save')).click()
      cy.wait('@putRinkLine').then(req => {
        expect(req.request.url).to.include(`lines/${EditType}`)
        expect(req.request.body).to.deep.equal(edit)
      })
      completeDialogAndMoveToTop(this.tenantId)
    })

    it('CSVファイルを利用してお申し込み', function () {
      openLineEdit(this.tenantId, EditType, { hour: 0, minute: 0, second: 0, millisecond: 0 })

      uploadCsvFile(EditType)
      const edit = this.editData[EditType]

      this.lineList.forEach(({ lineNumber }: { lineNumber: string }) => {
        const targetCheckbox = `[data-cy="rink-mobile-lines-edit-line-table-selector-${lineNumber}"]`

        const expected = edit.linesList.find((v: { lineNumber: string }) => v.lineNumber === lineNumber)
        if (expected) {
          const found = Object.entries(RinkLineAdditionalLimitTypes).find(
            ([_, value]) => value === expected.additionalLimit,
          )?.[0]
          // 入力した回線がチェックされていることを確認
          cy.get(targetCheckbox).should('have.class', 'checked')
          // 選択した追加容量が表示されていることを確認
          cy.get(`[data-cy="rink-mobile-lines-edit-additional-limit-select-form-${lineNumber}"]`)
            .find('input')
            .should('have.value', `${found}`)
        } else {
          // 入力していない回線がチェックされないことを確認
          cy.get(targetCheckbox).should('not.have.class', 'checked')
        }
      })

      // 確認ボタンを押下し、再度保存ボタンを押下
      cy.get('[data-cy="rink-mobile-lines-edit-submit-button"]').click()
      cy.get('[data-cy="rink-mobile-lines-edit-submit-button"]').should('have.text', t('common.save')).click()
      cy.wait('@putRinkLine').then(req => {
        expect(req.request.url).to.include(`lines/${EditType}`)
        expect(req.request.body).to.deep.equal(edit)
      })
      completeDialogAndMoveToTop(this.tenantId)
    })

    it(`営業時間外でも申込可能 (${OUTSIDE_RECEPTION_HOURS_CASES[1].label})`, function () {
      openLineEdit(this.tenantId, EditType, OUTSIDE_RECEPTION_HOURS_CASES[1].time)

      // 受付時間外メッセージが表示されることを確認
      cy.get('[data-cy="rink-mobile-lines-edit-outside-reception-hour"]').should('exist')

      // 「入力フォームからお申し込み」を選択
      cy.get('[data-cy="edit-application-type-application-type"]').find('.label.form').click()

      const edit = this.editData[EditType]

      // 変更する回線を選択
      edit.linesList.forEach(({ lineNumber }: { lineNumber: string }) => {
        cy.get(`[data-cy="rink-mobile-lines-edit-line-table-selector-${lineNumber}"]`).click()
      })

      // 追加容量を選択
      edit.linesList.forEach(({ lineNumber, additionalLimit }: { lineNumber: string; additionalLimit: number }) => {
        const found = Object.entries(RinkLineAdditionalLimitTypes).find(([_, value]) => value === additionalLimit)?.[0]
        cy.inputSelectForm({
          selector: `[data-cy="rink-mobile-lines-edit-additional-limit-select-form-${lineNumber}"]`,
          value: `${found}`,
        })
      })

      // 確認ボタンを押下
      cy.get('[data-cy="rink-mobile-lines-edit-submit-button"]').as('submitButton').should('not.be.disabled').click()
      // 保存ボタンを押下
      cy.get('@submitButton').should('have.text', t('common.save')).click()
      cy.wait('@putRinkLine').then(req => {
        expect(req.request.url).to.include(`lines/${EditType}`)
        expect(req.request.body).to.deep.equal(edit)
      })
    })
  })

  context('通信中断', function () {
    const EditType = RinkLineEditMenuTypes.Deactivate

    it('入力フォームからお申し込み', function () {
      openLineEdit(this.tenantId, EditType, { hour: 19, minute: 59, second: 59, millisecond: 999 })

      // 受付時間外メッセージの非表示確認
      cy.get('[data-cy="rink-mobile-lines-edit-outside-reception-hour"]').should('not.exist')
      // 「入力フォームからお申し込み」を選択
      cy.get('[data-cy="edit-application-type-application-type"]').find('.label.form').click()

      const edit = this.editData[EditType]

      // 表示確認
      cy.get('[data-cy="rink-mobile-lines-edit-rink-line-suspend-counts"]').should('have.text', this.counts.suspend)
      cy.get('[data-cy="rink-mobile-lines-edit-rink-line-active-counts"]').should('have.text', this.counts.active)

      // 変更する回線を選択
      edit.linesList.forEach(({ lineNumber }: { lineNumber: string }) => {
        cy.get(`[data-cy="rink-mobile-lines-edit-line-table-selector-${lineNumber}"]`).click()
      })

      // 確認ボタンを押下
      cy.get('[data-cy="rink-mobile-lines-edit-submit-button"]').as('submitButton').click()
      // 表示確認
      cy.get('[data-cy="rink-mobile-lines-edit-start-ordering-card"]').should('contain', t('rinkLines.suspendDate'))
      cy.get('[data-cy="rink-mobile-lines-edit-start-ordering-message"]').should(
        'have.text',
        t('rinkLines.message.startOrdering'),
      )
      // 保存ボタンを押下
      cy.get('@submitButton').should('have.text', t('common.save')).click()
      cy.wait('@putRinkLine').then(req => {
        expect(req.request.url).to.include(`lines/${EditType}`)
        expect(req.request.body).to.deep.equal(edit)
      })
      completeDialogAndMoveToTop(this.tenantId)
    })

    it(`営業時間外でも申込可能 (${OUTSIDE_RECEPTION_HOURS_CASES[0].label})`, function () {
      openLineEdit(this.tenantId, EditType, OUTSIDE_RECEPTION_HOURS_CASES[0].time)

      // 受付時間外メッセージが表示されることを確認
      cy.get('[data-cy="rink-mobile-lines-edit-outside-reception-hour"]').should('exist')

      // 「入力フォームからお申し込み」を選択
      cy.get('[data-cy="edit-application-type-application-type"]').find('.label.form').click()

      const edit = this.editData[EditType]

      // 変更する回線を選択
      edit.linesList.forEach(({ lineNumber }: { lineNumber: string }) => {
        cy.get(`[data-cy="rink-mobile-lines-edit-line-table-selector-${lineNumber}"]`).click()
      })

      // 確認ボタンを押下
      cy.get('[data-cy="rink-mobile-lines-edit-submit-button"]').as('submitButton').should('not.be.disabled').click()
      // 保存ボタンを押下
      cy.get('@submitButton').should('have.text', t('common.save')).click()
      cy.wait('@putRinkLine').then(req => {
        expect(req.request.url).to.include(`lines/${EditType}`)
        expect(req.request.body).to.deep.equal(edit)
      })
    })

    it('CSVファイルを利用してお申し込み', function () {
      openLineEdit(this.tenantId, EditType, { hour: 0, minute: 0, second: 0, millisecond: 0 })

      uploadCsvFile(EditType)

      const expectedLineNumberList = ['02022222222']
      this.lineList.forEach(({ lineNumber }: { lineNumber: string }) => {
        const targetCheckbox = `[data-cy="rink-mobile-lines-edit-line-table-selector-${lineNumber}"]`

        if (expectedLineNumberList.includes(lineNumber)) {
          // 入力した回線がチェックされていることを確認
          cy.get(targetCheckbox).should('have.class', 'checked')
        } else {
          // 入力していない回線がチェックされないことを確認
          cy.get(targetCheckbox).should('not.have.class', 'checked')
        }
      })

      // 確認ボタンを押下し、再度保存ボタンを押下
      cy.get('[data-cy="rink-mobile-lines-edit-submit-button"]').click()
      cy.get('[data-cy="rink-mobile-lines-edit-submit-button"]').should('have.text', t('common.save')).click()
      cy.wait('@putRinkLine').then(req => {
        expect(req.request.url).to.include(`lines/${EditType}`)
        expect(req.request.body).to.deep.equal({
          linesList: expectedLineNumberList.map((lineNumber, index) => ({
            lineIndex: index + 1,
            lineNumber,
          })),
        })
      })
      completeDialogAndMoveToTop(this.tenantId)
    })
  })

  context('通信中断解除', function () {
    const EditType = RinkLineEditMenuTypes.Reactivate

    it('入力フォームからお申し込み', function () {
      openLineEdit(this.tenantId, EditType, { hour: 19, minute: 59, second: 59, millisecond: 999 })

      // 「入力フォームからお申し込み」を選択
      cy.get('[data-cy="edit-application-type-application-type"]').find('.label.form').click()

      const edit = this.editData[EditType]

      // 表示確認
      cy.get('[data-cy="rink-mobile-lines-edit-rink-line-suspend-counts"]').should('have.text', this.counts.suspend)
      cy.get('[data-cy="rink-mobile-lines-edit-rink-line-active-counts"]').should('have.text', this.counts.active)

      // 変更する回線を選択
      edit.linesList.forEach(({ lineNumber }: { lineNumber: string }) => {
        cy.get(`[data-cy="rink-mobile-lines-edit-line-table-selector-${lineNumber}"]`).click()
      })

      // 確認ボタンを押下
      cy.get('[data-cy="rink-mobile-lines-edit-submit-button"]').as('submitButton').click()
      // 表示確認
      cy.get('[data-cy="rink-mobile-lines-edit-start-ordering-card"]').should('contain', t('rinkLines.activeDate'))
      cy.get('[data-cy="rink-mobile-lines-edit-start-ordering-message"]').should(
        'have.text',
        t('rinkLines.message.startOrdering'),
      )

      // 保存ボタンを押下
      cy.get('@submitButton').should('have.text', t('common.save')).click()
      cy.wait('@putRinkLine').then(req => {
        expect(req.request.url).to.include(`lines/${EditType}`)
        expect(req.request.body).to.deep.equal(edit)
      })
      completeDialogAndMoveToTop(this.tenantId)
    })

    it(`営業時間外でも申込可能 (${OUTSIDE_RECEPTION_HOURS_CASES[1].label})`, function () {
      openLineEdit(this.tenantId, EditType, OUTSIDE_RECEPTION_HOURS_CASES[1].time)

      // 受付時間外メッセージが表示されることを確認
      cy.get('[data-cy="rink-mobile-lines-edit-outside-reception-hour"]').should('exist')

      // 「入力フォームからお申し込み」を選択
      cy.get('[data-cy="edit-application-type-application-type"]').find('.label.form').click()

      const edit = this.editData[EditType]

      // 変更する回線を選択
      edit.linesList.forEach(({ lineNumber }: { lineNumber: string }) => {
        cy.get(`[data-cy="rink-mobile-lines-edit-line-table-selector-${lineNumber}"]`).click()
      })

      // 確認ボタンを押下
      cy.get('[data-cy="rink-mobile-lines-edit-submit-button"]').as('submitButton').should('not.be.disabled').click()
      // 保存ボタンを押下
      cy.get('@submitButton').should('have.text', t('common.save')).click()
      cy.wait('@putRinkLine').then(req => {
        expect(req.request.url).to.include(`lines/${EditType}`)
        expect(req.request.body).to.deep.equal(edit)
      })
    })

    it('CSVファイルを利用してお申し込み', function () {
      openLineEdit(this.tenantId, EditType, { hour: 0, minute: 0, second: 0, millisecond: 0 })

      uploadCsvFile(EditType)

      const expectedLineNumberList = ['02088888888']
      this.lineList.forEach(({ lineNumber }: { lineNumber: string }) => {
        const targetCheckbox = `[data-cy="rink-mobile-lines-edit-line-table-selector-${lineNumber}"]`

        if (expectedLineNumberList.includes(lineNumber)) {
          // 入力した回線がチェックされていることを確認
          cy.get(targetCheckbox).should('have.class', 'checked')
        } else {
          // 入力していない回線がチェックされないことを確認
          cy.get(targetCheckbox).should('not.have.class', 'checked')
        }
      })

      // 確認ボタンを押下し、再度保存ボタンを押下
      cy.get('[data-cy="rink-mobile-lines-edit-submit-button"]').click()
      cy.get('[data-cy="rink-mobile-lines-edit-submit-button"]').should('have.text', t('common.save')).click()
      cy.wait('@putRinkLine').then(req => {
        expect(req.request.url).to.include(`lines/${EditType}`)
        expect(req.request.body).to.deep.equal({
          linesList: expectedLineNumberList.map((lineNumber, index) => ({
            lineIndex: index + 1,
            lineNumber,
          })),
        })
      })
      completeDialogAndMoveToTop(this.tenantId)
    })
  })

  context('国内通信IPアドレス変更', function () {
    const EditType = RinkLineEditMenuTypes.LinePrefix

    it('入力フォームからお申し込み', function () {
      openLineEdit(this.tenantId, EditType, { hour: 19, minute: 59, second: 59, millisecond: 999 })

      // 「入力フォームからお申し込み」を選択
      cy.get('[data-cy="edit-application-type-application-type"]').find('.label.form').click()

      const edit = this.editData[EditType]

      // 非表示確認
      cy.get('[data-cy="rink-mobile-lines-edit-rink-line-suspend-counts"]').should('not.exist')
      cy.get('[data-cy="rink-mobile-lines-edit-rink-line-active-counts"]').should('not.exist')

      // 変更する回線を選択
      edit.linesList.forEach(({ lineNumber }: { lineNumber: string }) => {
        cy.get(`[data-cy="rink-mobile-lines-edit-line-table-selector-${lineNumber}"]`).click()
      })

      // 未変更時に確認ボタンが押せないことを確認
      cy.get('[data-cy="rink-mobile-lines-edit-submit-button"]').as('submitButton').should('be.disabled')

      edit.linesList.forEach(
        ({
          lineNumber,
          actIpAddress,
          sbyIpAddress,
        }: {
          lineNumber: string
          actIpAddress: string
          sbyIpAddress?: string
        }) => {
          // 国内通信IPアドレス(ACT)に既存の値が入力されていること
          cy.get(`[data-cy="rink-mobile-lines-edit-act-ip-address-input-form-${lineNumber}"]`)
            .find('input')
            .as('actIpAddressInputForm')
            .should('have.value', ACT_IP_ADDRESS)

          // 国内通信IPアドレス(SBY)に既存の値が入力されていること
          cy.get(`[data-cy="rink-mobile-lines-edit-sby-ip-address-input-form-${lineNumber}"]`)
            .find('input')
            .as('sbyIpAddressInputForm')
            .should('have.value', SBY_IP_ADDRESS)

          // 国内通信IPアドレス(ACT)の入力
          cy.get('@actIpAddressInputForm').clear().type(stripPrefix(actIpAddress))

          // 国内通信IPアドレス(SBY)の入力
          cy.get('@sbyIpAddressInputForm').clear()
          if (sbyIpAddress) {
            cy.get('@sbyIpAddressInputForm').type(stripPrefix(sbyIpAddress))
          }
        },
      )

      // 確認ボタンを押下
      cy.get('@submitButton').click()
      // 非表示確認
      cy.get('[data-cy="rink-mobile-lines-edit-start-ordering-card"]').should('not.exist')
      // 保存ボタンを押下
      cy.get('@submitButton').should('have.text', t('common.save')).click()
      cy.wait('@putRinkLine').then(req => {
        expect(req.request.url).to.include(`lines/${EditType}`)
        expect(req.request.body).to.deep.equal(edit)
      })
      completeDialogAndMoveToTop(this.tenantId)
    })

    it('CSVファイルを利用してお申し込み', function () {
      openLineEdit(this.tenantId, EditType, { hour: 19, minute: 59, second: 59, millisecond: 999 })

      uploadCsvFile(EditType)
      const edit = this.editData[EditType]

      this.lineList.forEach(({ lineNumber }: { lineNumber: string }) => {
        const targetCheckbox = `[data-cy="rink-mobile-lines-edit-line-table-selector-${lineNumber}"]`

        const expected = edit.linesList.find((v: { lineNumber: string }) => v.lineNumber === lineNumber)
        if (expected) {
          // 入力した回線がチェックされていることを確認
          cy.get(targetCheckbox).should('have.class', 'checked')
          // 変更した国内通信IPアドレス(ACT)・国内通信IPアドレス(SBY)が表示されていることを確認
          cy.get(`[data-cy="rink-mobile-lines-edit-act-ip-address-input-form-${lineNumber}"]`)
            .find('input')
            .should('have.value', stripPrefix(expected.actIpAddress))
          cy.get(`[data-cy="rink-mobile-lines-edit-sby-ip-address-input-form-${lineNumber}"]`)
            .find('input')
            .should('have.value', expected.sbyIpAddress ? stripPrefix(expected.sbyIpAddress) : '')
        } else {
          // 入力していない回線がチェックされないことを確認
          cy.get(targetCheckbox).should('not.have.class', 'checked')
        }
      })

      // 確認ボタンを押下し、再度保存ボタンを押下
      cy.get('[data-cy="rink-mobile-lines-edit-submit-button"]').click()
      cy.get('[data-cy="rink-mobile-lines-edit-submit-button"]').should('have.text', t('common.save')).click()
      cy.wait('@putRinkLine').then(req => {
        expect(req.request.url).to.include(`lines/${EditType}`)
        expect(req.request.body).to.deep.equal(edit)
      })
      completeDialogAndMoveToTop(this.tenantId)
    })

    it(`営業時間外は申込不可 (${OUTSIDE_RECEPTION_HOURS_CASES[0].label})`, function () {
      openLineEdit(this.tenantId, EditType, OUTSIDE_RECEPTION_HOURS_CASES[0].time)

      // 受付時間外メッセージが表示されることを確認
      cy.get('[data-cy="rink-mobile-lines-edit-outside-reception-hour"]').should('exist')

      // 「入力フォームからお申し込み」を選択
      cy.get('[data-cy="edit-application-type-application-type"]').find('.label.form').click()

      const edit = this.editData[EditType]

      // 変更する回線を選択
      edit.linesList.forEach(({ lineNumber }: { lineNumber: string }) => {
        cy.get(`[data-cy="rink-mobile-lines-edit-line-table-selector-${lineNumber}"]`).click()
      })

      edit.linesList.forEach(
        ({
          lineNumber,
          actIpAddress,
          sbyIpAddress,
        }: {
          lineNumber: string
          actIpAddress: string
          sbyIpAddress?: string
        }) => {
          cy.get(`[data-cy="rink-mobile-lines-edit-act-ip-address-input-form-${lineNumber}"]`)
            .find('input')
            .clear()
            .type(stripPrefix(actIpAddress))

          cy.get(`[data-cy="rink-mobile-lines-edit-sby-ip-address-input-form-${lineNumber}"]`).find('input').clear()
          if (sbyIpAddress) {
            cy.get(`[data-cy="rink-mobile-lines-edit-sby-ip-address-input-form-${lineNumber}"]`)
              .find('input')
              .type(stripPrefix(sbyIpAddress))
          }
        },
      )

      // 必要な情報を入力後も確認ボタンが押せないことを確認する
      cy.get('[data-cy="rink-mobile-lines-edit-submit-button"]').should('be.disabled')
    })
  })

  it('入力フォーム(回線数MAX:254の場合):通信中断', function () {
    const MAX_LINE_NUMBER = 254
    const lineList = Array.from({ length: MAX_LINE_NUMBER + 1 }, (_, i) => ({
      lineNumber: `test${i.toString().padStart(3, '0')}`,
      lineStatus: RinkLineStatusTypes.Active,
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

    // 回線変更画面に遷移する
    cy.visit(`/tenants/${this.tenantId}/rink-mobile/lines/edit?rinkMobileId=${RINK_MOBILE_ID}`)
    cy.wait([
      '@getSession',
      '@getMobile',
      '@getTrafficReportFlowAnalyzerTermsOfService',
      '@getSecurityTermsOfService',
      '@getSettingsBehaviorDetection',
      '@getRinkConnectionList',
      '@postRinkLineAvailableDate',
      '@getAvailablePlanDeviceList',
      '@getRinkConnectionLinePrefix',
      '@getRinkLineGroupList',
    ])
    cy.wait(Array.from({ length: counts }).map((_, index) => `@getLineList${index}`))

    // 編集メニューを選択
    cy.get('[data-cy="rink-mobile-lines-edit-edit-menu-selector"]')
      .find(`.label.${RinkLineEditMenuTypes.Deactivate}`)
      .should('be.visible')
      .click()
    // 「入力フォームからお申し込み」を選択
    cy.get('[data-cy="edit-application-type-application-type"]').find('.label.form').click()

    // 回線の選択（全件）
    cy.get('.pagination-footer').find('button').last().click()
    cy.get('[data-cy="rink-mobile-lines-edit-line-table"]').within(() => {
      cy.get('[data-cy="rink-mobile-lines-edit-line-table-selector-all"]').click()
      cy.get('[data-cy="rink-mobile-lines-edit-line-table-selector-all"]')
        .should('not.have.class', 'checked')
        .and('have.class', 'indeterminate')

      // 最後のページの要素をチェック
      lineList.slice(MAX_LINE_NUMBER - 4).forEach(({ lineNumber }: { lineNumber: string }) => {
        if (lineNumber !== `test${MAX_LINE_NUMBER}`) {
          cy.get(`[data-cy="rink-mobile-lines-edit-line-table-selector-${lineNumber}"]`)
            .should('have.class', 'checked')
            .and('not.have.class', 'disabled')
        } else {
          cy.get(`[data-cy="rink-mobile-lines-edit-line-table-selector-${lineNumber}"]`)
            .should('have.class', 'disabled')
            .and('not.have.class', 'checked')
        }
      })
    })

    // 確認ボタンを押下する
    cy.get('[data-cy="rink-mobile-lines-edit-submit-button"]').click()
    // 申し込み
    cy.get('[data-cy="rink-mobile-lines-edit-submit-button"]').click()

    // チェックを入れた要素のみがリクエストされていることを確認
    cy.wait('@putRinkLine').then(req => {
      expect(req.request.url).to.include(`lines/${RinkLineEditMenuTypes.Deactivate}`)
      expect(req.request.body).to.deep.equal({
        linesList: lineList
          .slice(0, MAX_LINE_NUMBER)
          .map((line, index) => ({ lineIndex: index + 1, lineNumber: line.lineNumber })),
      })
    })

    // 再取得処理が実行される
    cy.wait(Array.from({ length: counts }).map((_, index) => `@getLineList${index}`))
    cy.wait(['@getAvailablePlanDeviceList', '@getRinkConnectionLinePrefix'])

    // 完了後のダイアログを閉じられたら編集画面のまま、入力済みの値はリセットされていることを確認する
    cy.get('.dialog-card-close').click()
    cy.get('[data-cy="notification-dialog-text"]').should('not.exist')

    // 回線変更画面のまま遷移なし
    cy.url().should('include', `/tenants/${this.tenantId}/rink-mobile/lines/edit?rinkMobileId=${RINK_MOBILE_ID}`)
    // 編集メニュー初期化
    cy.get('[data-cy="rink-mobile-lines-edit-edit-menu-selector"]').find('.checked').should('have.length', 0)
    cy.get('[data-cy="rink-mobile-lines-edit-submit-button"]').should('be.disabled')
  })

  context('オーダー取り下げ', function () {
    beforeEach(function () {
      cy.intercept('GET', '**/ztgict/v1/resource-summary/orders?*', {
        fixture: 'orders/list',
      }).as('getOrderList')
    })

    it('オーダー取り下げボタンの表示確認', function () {
      openLineEdit(this.tenantId, RinkLineEditMenuTypes.Plan, { hour: 19, minute: 59, second: 59, millisecond: 999 })

      // 「入力フォームからお申し込み」を選択
      cy.get('[data-cy="edit-application-type-application-type"]').find('.label.form').click()

      cy.get('[data-cy="rink-mobile-lines-edit-line-table"]').within(() => {
        this.lineList.forEach(({ lineNumber, isLocked }: { lineNumber: string; isLocked: boolean }) => {
          if (isLocked) {
            // オーダー取り下げボタンが表示されることを確認
            cy.get(`[data-cy="rink-mobile-lines-edit-cancel-order-button-${lineNumber}"]`).should('exist')
          } else {
            // オーダー取り下げボタンが表示されないことを確認
            cy.get(`[data-cy="rink-mobile-lines-edit-cancel-order-button-${lineNumber}"]`).should('not.exist')
          }
        })
      })

      // オーダー取り下げボタンを押下
      cy.get(`[data-cy="rink-mobile-lines-edit-cancel-order-button-${CANCEL_ORDER_LINE_NUMBER}"]`).click()
      // オーダー履歴画面に遷移する
      cy.url().should(
        'include',
        `/tenants/${this.tenantId}/orders?resourceId=${RINK_MOBILE_ID}&resourceType=rink-mobile`,
      )
      cy.wait('@getOrderList')
    })
  })

  context('初期値と初期化処理の確認', function () {
    const RINK_MOBILE_ID_1 = 'selectable-line-list'
    const RINK_MOBILE_ID_2 = 'unselectable-line-list'
    const RINK_MOBILE_ID_3 = 'empty-line-list'
    const LINE_NUMBER_1 = '09012345678'

    beforeEach(function () {
      cy.clock(new Date(new Date().setHours(0, 0, 0, 0)), ['Date'])

      cy.intercept('GET', '**/rink-mobile/v1/tenants/*/rink-connections/self-only', {
        body: [
          {
            zId: RINK_MOBILE_ID_1,
            connectionType: 'vpn-breakout',
            vpnId: 'Z000000138',
          },
          {
            zId: RINK_MOBILE_ID_2,
            connectionType: 'internet-only',
          },
          {
            zId: RINK_MOBILE_ID_3,
            connectionType: 'internet-only',
          },
        ],
      }).as('getRinkConnectionList')
      cy.intercept('GET', `**/rink-mobile/v1/tenants/*/lines/self-add/${RINK_MOBILE_ID_1}?*`, {
        fixture: 'rink-mobile/lines/list',
      }).as('getLineList1')
      cy.intercept('GET', `**/rink-mobile/v1/tenants/*/lines/self-add/${RINK_MOBILE_ID_2}?*`, {
        fixture: 'rink-mobile/lines/list-unselectable',
      }).as('getLineList2')
      cy.intercept('GET', `**/rink-mobile/v1/tenants/*/lines/self-add/${RINK_MOBILE_ID_3}?*`, {
        body: { lineList: [], total: 0 },
      }).as('getLineList3')

      cy.intercept('GET', '**/rink-mobile/v1/tenants/*/rink-connections/available-plan-limit/*', {
        fixture: 'rink-mobile/connections/available-plan-limit',
      }).as('getAvailablePlanDeviceList')
      cy.intercept('GET', '**/rink-mobile/v1/tenants/*/rink-connections/linePrefix/*', {
        fixture: 'rink-mobile/connections/available-line-prefix',
      }).as('getRinkConnectionLinePrefix')
      cy.intercept('GET', '**/rink-mobile/v1/tenants/*/line-groups/self-add/*', {
        fixture: 'rink-mobile/line-groups/list',
      }).as('getRinkLineGroupList')
    })

    it('回線番号ありで遷移、モバイルアクセスIDが確定しない場合', function () {
      // 回線変更画面に遷移する
      cy.visit(`/tenants/${this.tenantId}/rink-mobile/lines/edit?lineNumber=${LINE_NUMBER_1}`)
      cy.wait(['@getRinkConnectionList', '@postRinkLineAvailableDate'])

      // モバイルアクセスID 全件に対して回線取得処理が実行される
      cy.wait(['@getLineList1', '@getLineList2', '@getLineList3']).then(req => {
        expect(req[0].request.query).to.deep.eq({ lineNumber: LINE_NUMBER_1, limit: '20', offset: '0' })
        expect(req[1].request.query).to.deep.eq({ lineNumber: LINE_NUMBER_1, limit: '20', offset: '0' })
        expect(req[2].request.query).to.deep.eq({ lineNumber: LINE_NUMBER_1, limit: '20', offset: '0' })
      })

      // 検索欄の初期値
      cy.get('[data-cy="rink-line-search-filter-rink-mobile-id"]').find('input').should('have.value', '')
      cy.get('[data-cy="rink-line-search-filter-line-number"]').find('input').should('have.value', LINE_NUMBER_1)
      cy.get('[data-cy="search-filter-clear-button"]').should('not.be.disabled')
      cy.get('[data-cy="search-filter-search-button"]').should('not.be.disabled')

      // テーブル欄の初期表示
      cy.get('[data-cy="rink-mobile-lines-edit-search-empty"]').should('not.exist')
      cy.get('[data-cy="rink-mobile-lines-edit-rink-mobile-id"]').find('input').should('have.value', '')
      cy.get('[data-cy="rink-mobile-lines-edit-edit-menu-selector"]').should('not.exist')
      cy.get('[data-cy="rink-mobile-lines-edit-rink-line-suspend-counts"]').should('not.exist')
      cy.get('[data-cy="rink-mobile-lines-edit-rink-line-active-counts"]').should('not.exist')
      cy.get('[data-cy="edit-application-type-application-type"]').should('not.exist')
      cy.get('[data-cy="rink-mobile-lines-edit-line-table"]').should('exist')
      cy.get('[data-cy="rink-mobile-lines-edit-line-table-selector-all"]').should('not.exist')

      // 検索のモバイルアクセスIDのセレクトリスト確認
      cy.get('[data-cy="rink-line-search-filter-rink-mobile-id"]').find('input').click()
      cy.get('[data-cy="rink-line-search-filter-rink-mobile-id"]').within(() => {
        cy.get('li').should('have.length', 4)
        cy.get('li').eq(0).should('have.text', '未選択')
        cy.get('li').eq(1).should('have.text', RINK_MOBILE_ID_1)
        cy.get('li').eq(2).should('have.text', RINK_MOBILE_ID_2)
        cy.get('li').eq(3).should('have.text', RINK_MOBILE_ID_3)
      })
      // 申し込みに使うモバイルアクセスIDのセレクトリスト確認
      cy.get('[data-cy="rink-mobile-lines-edit-rink-mobile-id"]').find('input').click()
      cy.get('[data-cy="rink-mobile-lines-edit-rink-mobile-id"]').within(() => {
        cy.get('li').should('have.length', 2)
        cy.get('li').eq(0).should('have.text', RINK_MOBILE_ID_1)
        cy.get('li').eq(1).should('have.text', RINK_MOBILE_ID_2)
      })
    })

    it('回線番号ありで遷移、モバイルアクセスIDが確定する場合', function () {
      cy.intercept('GET', `**/rink-mobile/v1/tenants/*/lines/self-add/${RINK_MOBILE_ID_2}?*`, {
        body: { lineList: [], total: 0 },
      }).as('getLineList2')

      // 回線変更画面に遷移する
      cy.visit(`/tenants/${this.tenantId}/rink-mobile/lines/edit?lineNumber=${LINE_NUMBER_1}`)
      cy.wait(['@getRinkConnectionList', '@postRinkLineAvailableDate'])

      // モバイルアクセスID 全件に対して回線取得処理が実行される
      cy.wait(['@getLineList1', '@getLineList2', '@getLineList3'])
      // モバイルアクセスID が RINK_MOBILE_ID_1 に確定するためその値でリクエストが実行される
      cy.wait(['@getAvailablePlanDeviceList', '@getRinkConnectionLinePrefix', '@getRinkLineGroupList']).then(req => {
        expect(req[0].request.url).to.match(new RegExp(`/${RINK_MOBILE_ID_1}$`))
      })

      // 検索欄の初期値
      cy.get('[data-cy="rink-line-search-filter-rink-mobile-id"]').find('input').should('have.value', '')
      cy.get('[data-cy="rink-line-search-filter-line-number"]').find('input').should('have.value', LINE_NUMBER_1)
      cy.get('[data-cy="search-filter-clear-button"]').should('not.be.disabled')
      cy.get('[data-cy="search-filter-search-button"]').should('not.be.disabled')

      // テーブル欄の初期表示
      cy.get('[data-cy="rink-mobile-lines-edit-search-empty"]').should('not.exist')
      cy.get('[data-cy="rink-mobile-lines-edit-rink-mobile-id"]').find('input').should('have.value', RINK_MOBILE_ID_1)
      cy.get('[data-cy="rink-mobile-lines-edit-edit-menu-selector"]').should('exist')
      cy.get('[data-cy="rink-mobile-lines-edit-edit-menu-selector"]').find('.checked').should('have.length', 0)
      cy.get('[data-cy="rink-mobile-lines-edit-rink-line-suspend-counts"]').should('not.exist')
      cy.get('[data-cy="rink-mobile-lines-edit-rink-line-active-counts"]').should('not.exist')
      cy.get('[data-cy="edit-application-type-application-type"]').should('not.exist')
      cy.get('[data-cy="rink-mobile-lines-edit-line-table"]').should('exist')
      cy.get('[data-cy="rink-mobile-lines-edit-line-table-selector-all"]').should('not.exist')

      // 申し込みに使うモバイルアクセスIDのセレクトリスト確認
      cy.get('[data-cy="rink-mobile-lines-edit-rink-mobile-id"]').find('input').click()
      cy.get('[data-cy="rink-mobile-lines-edit-rink-mobile-id"]').within(() => {
        cy.get('li').should('have.length', 1)
        cy.get('li').eq(0).should('have.text', RINK_MOBILE_ID_1)
      })
    })

    it('モバイルアクセスIDありで遷移', function () {
      // 回線変更画面に遷移する
      cy.visit(`/tenants/${this.tenantId}/rink-mobile/lines/edit?rinkMobileId=${RINK_MOBILE_ID_1}`)
      cy.wait(['@getRinkConnectionList', '@postRinkLineAvailableDate'])

      // モバイルアクセスID に対してのみ回線取得処理が実行される
      cy.wait('@getLineList1').then(req => {
        expect(req.request.query).to.deep.eq({ limit: '20', offset: '0' })
      })
      // モバイルアクセスID でリクエストが実行される
      cy.wait(['@getAvailablePlanDeviceList', '@getRinkConnectionLinePrefix', '@getRinkLineGroupList']).then(req => {
        expect(req[0].request.url).to.match(new RegExp(`/${RINK_MOBILE_ID_1}$`))
      })

      // 検索欄の初期値
      cy.get('[data-cy="rink-line-search-filter-rink-mobile-id"]').find('input').should('have.value', RINK_MOBILE_ID_1)
      cy.get('[data-cy="rink-line-search-filter-line-number"]').find('input').should('have.value', '')
      cy.get('[data-cy="search-filter-clear-button"]').should('not.be.disabled')
      cy.get('[data-cy="search-filter-search-button"]').should('not.be.disabled')

      // テーブル欄の初期表示
      cy.get('[data-cy="rink-mobile-lines-edit-search-empty"]').should('not.exist')
      cy.get('[data-cy="rink-mobile-lines-edit-rink-mobile-id"]').find('input').should('have.value', RINK_MOBILE_ID_1)
      cy.get('[data-cy="rink-mobile-lines-edit-rink-line-suspend-counts"]').should('not.exist')
      cy.get('[data-cy="rink-mobile-lines-edit-rink-line-active-counts"]').should('not.exist')
      cy.get('[data-cy="edit-application-type-application-type"]').should('not.exist')
      cy.get('[data-cy="rink-mobile-lines-edit-line-table"]').should('exist')
      cy.get('[data-cy="rink-mobile-lines-edit-line-table-selector-all"]').should('not.exist')

      // 編集メニューの初期表示
      cy.get('[data-cy="rink-mobile-lines-edit-edit-menu-selector"]').find('.checked').should('have.length', 0)
      cy.get('[data-cy="rink-mobile-lines-edit-edit-menu-selector"]')
        .find(`.label.${RinkLineEditMenuTypes.Reactivate}`)
        .click()

      // 表示確認
      cy.get('[data-cy="rink-mobile-lines-edit-rink-line-suspend-counts"]').should('exist')
      cy.get('[data-cy="rink-mobile-lines-edit-rink-line-active-counts"]').should('exist')
      cy.get('[data-cy="rink-mobile-lines-edit-line-table-selector-all"]').should('not.exist')

      // お申し込み方法選択の初期値
      cy.get('[data-cy="edit-application-type-application-type"]').find('.checked').should('have.length', 0)
      cy.get('[data-cy="edit-application-type-application-type"]').find('.label.form').click()

      // テーブルのチェックボックス押下
      cy.get('[data-cy="rink-mobile-lines-edit-line-table-selector-all"]').click()
      cy.get('[data-cy="rink-mobile-lines-edit-line-table"]').within(() => {
        cy.get('.checkbox.checked').should('have.length', 3)
      })

      // 検索ボタンを再押下
      cy.get('[data-cy="search-filter-search-button"]').click()
      cy.wait(['@getLineList1'])

      // RINK_MOBILE_ID が変わらないので入力済みの値はそのまま
      cy.get('[data-cy="rink-mobile-lines-edit-rink-mobile-id"]').find('input').should('have.value', RINK_MOBILE_ID_1)
      cy.get('[data-cy="rink-mobile-lines-edit-edit-menu-selector"]')
        .find('.checked')
        .find(`.label.${RinkLineEditMenuTypes.Reactivate}`)
        .should('have.length', 1)
      cy.get('[data-cy="rink-mobile-lines-edit-rink-line-suspend-counts"]').should('exist')
      cy.get('[data-cy="rink-mobile-lines-edit-rink-line-active-counts"]').should('exist')
      cy.get('[data-cy="edit-application-type-application-type"]')
        .find('.checked')
        .find('.label.form')
        .should('have.length', 1)

      // テーブルのチェックボックスは全て外れることを確認
      cy.get('[data-cy="rink-mobile-lines-edit-line-table"]').within(() => {
        cy.get('.checkbox.checked').should('have.length', 0)
      })
    })

    it('検索結果0件の表示', function () {
      // 回線変更画面に遷移する
      cy.visit(`/tenants/${this.tenantId}/rink-mobile/lines/edit?rinkMobileId=${RINK_MOBILE_ID_3}`)
      cy.wait(['@getRinkConnectionList', '@postRinkLineAvailableDate'])

      // モバイルアクセスID に対してのみ回線取得処理が実行される
      cy.wait('@getLineList3').then(req => {
        expect(req.request.query).to.deep.eq({ limit: '20', offset: '0' })
      })

      // 検索欄の初期値
      cy.get('[data-cy="rink-line-search-filter-rink-mobile-id"]').find('input').should('have.value', RINK_MOBILE_ID_3)
      cy.get('[data-cy="rink-line-search-filter-line-number"]').find('input').should('have.value', '')
      cy.get('[data-cy="search-filter-clear-button"]').should('not.be.disabled')
      cy.get('[data-cy="search-filter-search-button"]').should('not.be.disabled')

      // テーブル欄の初期表示
      cy.get('[data-cy="rink-mobile-lines-edit-search-empty"]').should('exist')
      cy.get('[data-cy="rink-mobile-lines-edit-rink-mobile-id"]').should('not.exist')
      cy.get('[data-cy="rink-mobile-lines-edit-edit-menu-selector"]').should('not.exist')
      cy.get('[data-cy="edit-application-type-application-type"]').should('not.exist')
      cy.get('[data-cy="rink-mobile-lines-edit-line-table"]').should('not.exist')
    })

    it('PUT用のモバイルアクセスIDが初期化される時に入力済みの値が初期化されることを確認', function () {
      // 回線変更画面に遷移する
      cy.visit(`/tenants/${this.tenantId}/rink-mobile/lines/edit?rinkMobileId=${RINK_MOBILE_ID_1}`)
      cy.wait(['@getRinkConnectionList', '@postRinkLineAvailableDate'])
      cy.wait(['@getLineList1', '@getAvailablePlanDeviceList', '@getRinkConnectionLinePrefix', '@getRinkLineGroupList'])

      // 申し込みに使うモバイルアクセスID
      cy.get('[data-cy="rink-mobile-lines-edit-rink-mobile-id"]').find('input').should('have.value', RINK_MOBILE_ID_1)
      // 編集メニューの選択
      cy.get('[data-cy="rink-mobile-lines-edit-edit-menu-selector"]')
        .find(`.label.${RinkLineEditMenuTypes.Reactivate}`)
        .click()
      // お申し込み方法の選択
      cy.get('[data-cy="edit-application-type-application-type"]').find('.label.form').click()

      // テーブルのチェックボックス押下
      cy.get('[data-cy="rink-mobile-lines-edit-line-table-selector-all"]').click()

      // 入力値の確認
      cy.get('[data-cy="rink-mobile-lines-edit-edit-menu-selector"]')
        .find('.checked')
        .find(`.label.${RinkLineEditMenuTypes.Reactivate}`)
        .should('have.length', 1)
      cy.get('[data-cy="edit-application-type-application-type"]')
        .find('.checked')
        .find('.label.form')
        .should('have.length', 1)
      cy.get('[data-cy="rink-mobile-lines-edit-line-table"]').within(() => {
        cy.get('.checkbox.checked').should('have.length', 3)
      })
      // 確認ボタンは押下可能
      cy.get('[data-cy="rink-mobile-lines-edit-submit-button"]').should('not.be.disabled')

      ////////////////////////////////////////////////////////////////
      // 検索欄を変更して検索ボタンを押下
      cy.inputSelectForm({
        selector: '[data-cy="rink-line-search-filter-rink-mobile-id"]',
        value: '未選択',
      })
      cy.get('[data-cy="rink-line-search-filter-line-number"]').find('input').type('0000')
      cy.get('[data-cy="search-filter-search-button"]').click()
      cy.wait(['@getLineList1', '@getLineList2', '@getLineList3'])

      // 申し込みに使うモバイルアクセスIDが空になってる
      cy.get('[data-cy="rink-mobile-lines-edit-rink-mobile-id"]').find('input').should('have.value', '')
      // 編集メニュー、お申し込み方法の入力欄が消えてる
      cy.get('[data-cy="rink-mobile-lines-edit-edit-menu-selector"]').should('not.exist')
      cy.get('[data-cy="rink-mobile-lines-edit-rink-line-suspend-counts"]').should('not.exist')
      cy.get('[data-cy="rink-mobile-lines-edit-rink-line-active-counts"]').should('not.exist')
      cy.get('[data-cy="edit-application-type-application-type"]').should('not.exist')
      // テーブルの全件選択チェックボックスが消えてる
      cy.get('[data-cy="rink-mobile-lines-edit-line-table"]').should('exist')
      cy.get('[data-cy="rink-mobile-lines-edit-line-table-selector-all"]').should('not.exist')
      // 確認ボタンは押下不可
      cy.get('[data-cy="rink-mobile-lines-edit-submit-button"]').should('be.disabled')

      ////////////////////////////////////////////////////////////////
      // 申し込みに使うモバイルアクセスIDを選択
      cy.inputSelectForm({
        selector: '[data-cy="rink-mobile-lines-edit-rink-mobile-id"]',
        value: RINK_MOBILE_ID_1,
      })
      // 編集メニューが初期化されて表示される
      cy.get('[data-cy="rink-mobile-lines-edit-edit-menu-selector"]').find('.checked').should('have.length', 0)
      cy.get('[data-cy="edit-application-type-application-type"]').should('not.exist')

      // 編集メニューの選択
      cy.get('[data-cy="rink-mobile-lines-edit-edit-menu-selector"]')
        .find(`.label.${RinkLineEditMenuTypes.Deactivate}`)
        .click()

      // お申し込み方法の選択が初期化されて表示される
      cy.get('[data-cy="edit-application-type-application-type"]').find('.checked').should('have.length', 0)
      cy.get('[data-cy="edit-application-type-application-type"]').find('.label.form').click()
      cy.get('[data-cy="rink-mobile-lines-edit-line-table-selector-all"]').click()
      // 確認ボタンは押下可能
      cy.get('[data-cy="rink-mobile-lines-edit-submit-button"]').should('not.be.disabled')

      ////////////////////////////////////////////////////////////////
      // 申し込みに使うモバイルアクセスIDを変更
      cy.inputSelectForm({
        selector: '[data-cy="rink-mobile-lines-edit-rink-mobile-id"]',
        value: RINK_MOBILE_ID_2,
      })
      // 入力値は初期化されない
      cy.get('[data-cy="rink-mobile-lines-edit-edit-menu-selector"]')
        .find('.checked')
        .find(`.label.${RinkLineEditMenuTypes.Deactivate}`)
        .should('have.length', 1)
      cy.get('[data-cy="edit-application-type-application-type"]')
        .find('.checked')
        .find('.label.form')
        .should('have.length', 1)
      // テーブルのチェックボックスは選択不可になってる(RINK_MOBILE_ID_2のデータは全て選択不可のため)
      cy.get('[data-cy="rink-mobile-lines-edit-line-table"]').within(() => {
        cy.get('.checkbox.checked').should('have.length', 0)
        cy.get('.checkbox.disabled').should('have.length', 3)
      })
      // 確認ボタンは押下不可
      cy.get('[data-cy="rink-mobile-lines-edit-submit-button"]').should('be.disabled')
    })
  })
})
