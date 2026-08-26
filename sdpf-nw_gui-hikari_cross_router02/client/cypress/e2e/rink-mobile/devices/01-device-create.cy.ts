import dayjs from 'dayjs'
import { generateRandomHex, t } from '@cypress/support/utils'

const DEVICE_NAME_1 = 'device1'
const DEVICE_NAME_2 = 'device2'
const DEVICE_NAME_ALIAS_1 = 'device_name_noKitting_noInsurance_alias_1'
const DEVICE_NAME_ALIAS_2 = 'device_name_noKitting_noInsurance_alias_2'
const DEVICE_COUNT = '2'
const DEVICE_COUNT_MAX = '254'
const DEVICE_COUNT_EXCEED = '255'
const RINK_MOBILE_ID = 'Z000000002'

type LineListItem = { lineIndex: number; deviceNameAlias: string }

const createLinesList = (devices: { deviceNameAlias: string; count: number }[]): LineListItem[] => {
  return devices.reduce<LineListItem[]>((list, { deviceNameAlias, count }) => {
    const addList = Array.from({ length: count }).map((_, index) => ({
      lineIndex: list.length + index + 1,
      deviceNameAlias,
    }))
    return list.concat(addList)
  }, [])
}

const checkDeviceListCounts = (counts: number) => {
  // 通信機器機種名のセレクトリストの中身確認
  cy.get('[data-cy="rink-mobile-devices-create-device-name"]').find('input').click()
  cy.get('[data-cy="rink-mobile-devices-create-device-name"]').find('li').should('have.length', counts)
  // セレクトリストを閉じる
  cy.get('[data-cy="rink-mobile-devices-create-device-name"]').find('input').type('{esc}')
}

describe('通信機器購入テスト', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)
    this.today = dayjs().format('YYYY-MM-DD')

    cy.intercept('GET', '**/rink-mobile/v1/tenants/*/rink-connections/self-add/*', {
      fixture: 'rink-mobile/connections/detail-internet-only',
    }).as('getRinkConnection')

    cy.intercept('GET', '**/rink-mobile/v1/tenants/*/devices/self-add/*', {
      fixture: 'rink-mobile/connections/device-list',
    }).as('getRinkDeviceTableList')

    cy.intercept('POST', '**/rink-mobile/v1/tenants/*/devices/self-add/*', {
      body: { id: generateRandomHex(32) },
    }).as('postRinkDevices')

    cy.intercept('GET', '**/rink-mobile/v1/tenants/*/rink-connections/available-plan-limit/*', {
      fixture: 'rink-mobile/connections/available-plan-limit',
    }).as('getAvailablePlanDeviceList')

    cy.intercept(
      'POST',
      '**/rink-mobile/v1/tenants/*/line-available-date/self-only?orderType=create-line-devices',
      {},
    ).as('postRinkLineAvailableDate')

    cy.intercept('GET', '**/rink-mobile/v1/tenants/*/shipping-address-history/self-only', {
      fixture: 'rink-mobile/connections/shipping-addresses',
    }).as('getShippingAddressHistoryList')

    cy.intercept('GET', '**/rink-mobile/v1/tenants/*/rink-connections/self-only', {
      fixture: 'rink-mobile/connections/list',
    }).as('getRinkConnectionList')

    cy.intercept('GET', '**/rink-mobile/v1/tenants/*/line-groups/self-add/*', {
      fixture: 'rink-mobile/line-groups/list',
    }).as('getRinkLineGroupList')
    cy.intercept('GET', '**/rink-mobile/v1/tenants/*/lines/self-add/*', {
      fixture: 'rink-mobile/lines/list',
    }).as('getRinkLineList')
  })

  it('入力フォームから住所入力 - 受付時間内(00:00)', function () {
    cy.clock(new Date(new Date().setHours(0, 0, 0, 0)), ['Date'])

    // 通信機購入画面へ遷移
    cy.visit(`/tenants/${this.tenantId}/rink-mobile/devices/create`)
    cy.wait(['@getRinkConnectionList'])
    // 通信機器購入画面で時間外文言が非表示であることを確認
    cy.get('[data-cy="rink-mobile-devices-create-outside-reception-hour"]').should('not.exist')
    // モバイルアクセスIDを選択
    cy.inputSelectForm({
      selector: '[data-cy="rink-mobile-devices-create-rink-mobile-id"]',
      value: RINK_MOBILE_ID,
    })
    cy.wait(['@getAvailablePlanDeviceList'])

    // ボタン初期値
    cy.get('[data-cy="rink-mobile-devices-create-cancel-button"]').should('not.exist')
    cy.get('[data-cy="rink-mobile-devices-create-submit-button"]')
      .as('submitButton')
      .should('have.text', t('common.confirm'))
      .and('be.disabled')

    cy.fixture('rink-mobile/connections/device-purchase').then(purchaseData => {
      // 購入機器選択ダイアログを開く
      cy.get('[data-cy="rink-mobile-devices-create-edit-table"]').as('editTable').find('.edit-table-add-button').click()
      // ボタン初期値
      cy.get('.dialog-base-submit-button').should('have.text', t('common.add')).and('be.disabled')
      // 通信機器機種名のセレクトリストの中身確認
      checkDeviceListCounts(2)
      // 通信機器機種名を選択
      cy.inputSelectForm({
        selector: '[data-cy="rink-mobile-devices-create-device-name"]',
        value: DEVICE_NAME_1,
      })
      // 台数を入力
      cy.get('[data-cy="rink-mobile-devices-create-count"]').find('input').type(DEVICE_COUNT)
      // ダイアログを閉じる
      cy.get('.dialog-base-submit-button').click()
      cy.wait('@postRinkLineAvailableDate')
      // 通信機器購入欄に追加されたことを確認
      cy.get('@editTable').find('.row').should('have.length', 1)

      // 編集の確認
      cy.get('@editTable').find('.row').eq(0).find('.edit-table-edit-button').click()
      checkDeviceListCounts(2)
      cy.get('[data-cy="rink-mobile-devices-create-count"]').find('input').should('have.value', DEVICE_COUNT)
      cy.get('.dialog-base-submit-button').should('have.text', t('common.save')).click()

      // 再度通信機器を追加する
      cy.get('@editTable').find('.edit-table-add-button').click()
      // 通信機器機種名のセレクトリストの中身確認
      checkDeviceListCounts(1)
      // 通信機器機種名を選択
      cy.inputSelectForm({
        selector: '[data-cy="rink-mobile-devices-create-device-name"]',
        value: DEVICE_NAME_2,
      })
      cy.get('[data-cy="rink-mobile-devices-create-count"]').find('input').type(DEVICE_COUNT)
      cy.get('.dialog-base-submit-button').click()
      cy.wait('@postRinkLineAvailableDate')
      // 通信機器購入欄に2件目が追加されたことを確認
      cy.get('@editTable').find('.row').should('have.length', 2)

      // 送付先情報の入力
      cy.inputShippingInformation(purchaseData)
      // 利用開始希望日の入力
      cy.inputDatePicker({
        className: '[data-cy="edit-shipping-information-request-date"]',
        date: this.today,
      })

      // 確認画面へ遷移
      cy.get('@submitButton').click()

      // 戻るボタンが表示される
      cy.get('[data-cy="rink-mobile-devices-create-cancel-button"]')
        .should('have.text', t('common.return'))
        .and('not.be.disabled')
      cy.get('@submitButton').should('have.text', t('rinkDevices.purchaseOrder')).click()
      const linesList = createLinesList([
        {
          deviceNameAlias: DEVICE_NAME_ALIAS_1,
          count: Number(DEVICE_COUNT),
        },
        {
          deviceNameAlias: DEVICE_NAME_ALIAS_2,
          count: Number(DEVICE_COUNT),
        },
      ])
      cy.wait('@postRinkDevices').then(req => {
        expect(req.request.url).to.include(`/devices/self-add/${RINK_MOBILE_ID}`)
        expect(req.request.body).to.deep.equals({ ...purchaseData, requestDate: this.today, linesList })
      })

      // 完了ダイアログ
      cy.url().should('include', `/tenants/${this.tenantId}/rink-mobile/devices/create`)
      cy.get('[data-cy="notification-dialog-text"]').should('contain', t('message.finished'))
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

  it('送付先リストから住所入力 - 受付時間内(19:59)', function () {
    cy.clock(new Date(new Date().setHours(19, 59, 59, 59)), ['Date'])

    // 通信機購入画面へ遷移
    cy.visit(`/tenants/${this.tenantId}/rink-mobile/devices/create`)
    cy.wait(['@getRinkConnectionList'])
    // 通信機器購入画面で時間外文言が非表示であることを確認
    cy.get('[data-cy="rink-mobile-devices-create-outside-reception-hour"]').should('not.exist')
    // モバイルアクセスIDを選択
    cy.inputSelectForm({
      selector: '[data-cy="rink-mobile-devices-create-rink-mobile-id"]',
      value: RINK_MOBILE_ID,
    })
    cy.wait(['@getAvailablePlanDeviceList'])
    // 通信機器購入画面で時間外文言が非表示であることを確認
    cy.get('[data-cy="rink-mobile-devices-create-outside-reception-hour"]').should('not.exist')

    cy.fixture('rink-mobile/connections/device-purchase').then(purchaseData => {
      // 購入機器選択ダイアログを開く
      cy.get('[data-cy="rink-mobile-devices-create-edit-table"]').find('.edit-table-add-button').click()
      // 通信機器機種名を選択
      cy.inputSelectForm({
        selector: '[data-cy="rink-mobile-devices-create-device-name"]',
        value: DEVICE_NAME_1,
      })
      // 台数を入力（最大個数を超過）
      cy.get('[data-cy="rink-mobile-devices-create-count"]').find('input').type(DEVICE_COUNT_EXCEED)
      // エラーメッセージの表示を確認
      cy.get('[data-cy="rink-mobile-devices-create-count"]').should(
        'contain',
        t('invalid.maxDeviceCount', { max: DEVICE_COUNT_MAX }),
      )
      // 入力した値を削除し再度台数を入力（最大個数）
      cy.get('[data-cy="rink-mobile-devices-create-count"]').find('input').clear().type(DEVICE_COUNT_MAX)
      // ダイアログを閉じる
      cy.get('.dialog-base-submit-button').click()
      cy.wait('@postRinkLineAvailableDate')
      // これ以上購入機器を追加できないことを確認
      cy.get('[data-cy="rink-mobile-devices-create-edit-table"]').find('.edit-table-add-button').should('be.disabled')
      cy.get('[data-cy="rink-mobile-devices-create-edit-table"]')
        .find('.edit-table-trush-button')
        .should('have.length', 1)
        .eq(0)
        .should('be.not.disabled')

      // 送付先リストダイアログを表示
      cy.get('[data-cy="shipping-history-button-history-button"]').click()
      cy.wait('@getShippingAddressHistoryList')
      // 選択前は確認ボタンが押せないことを確認
      cy.get('.dialog-base-submit-button').should('be.disabled')
      // 送付先を選択してダイアログを閉じる
      cy.get('.dialog-card-content .shipping-list-item-button').first().click({ force: true })
      cy.get('.dialog-base-submit-button').click()

      // フォームに正しい値が入力されたか確認
      cy.confirmShippingInformation(purchaseData)

      // 利用開始希望日の入力
      const today = dayjs().format('YYYY-MM-DD')
      cy.inputDatePicker({
        className: '[data-cy="edit-shipping-information-request-date"]',
        date: today,
      })

      // 確認画面へ遷移
      cy.get('[data-cy="rink-mobile-devices-create-submit-button"]').as('submitButton').click()
      cy.get('@submitButton').should('have.text', t('rinkDevices.purchaseOrder')).click()
      const linesList = createLinesList([
        {
          deviceNameAlias: DEVICE_NAME_ALIAS_1,
          count: Number(DEVICE_COUNT_MAX),
        },
      ])
      cy.wait('@postRinkDevices').then(req => {
        expect(req.request.url).to.include(`/devices/self-add/${RINK_MOBILE_ID}`)
        expect(req.request.body).to.deep.equals({ ...purchaseData, requestDate: today, linesList })
      })

      // 完了ダイアログ
      cy.url().should('include', `/tenants/${this.tenantId}/rink-mobile/devices/create`)

      cy.get('[data-cy="notification-dialog-text"]').should('contain', t('message.finished'))
      // 閉じるボタンを押す
      cy.get('.dialog-card-close').should('have.text', t('common.close')).click()
      cy.get('[data-cy="notification-dialog-text"]').should('not.exist')

      // 入力欄が空になっていることを確認する
      cy.get('[data-cy="rink-mobile-devices-create-rink-mobile-id"]').find('input').should('have.value', RINK_MOBILE_ID)
      cy.get('[data-cy="rink-mobile-devices-create-edit-table"]').find('.row').should('have.length', 0)
      cy.confirmShippingInformation()
      cy.confirmDatePicker({
        className: '[data-cy="edit-shipping-information-request-date"]',
        date: '',
        disabled: false,
      })
      cy.get('[data-cy="rink-mobile-devices-create-cancel-button"]').should('not.exist')
      cy.get('@submitButton').should('have.text', t('common.confirm')).and('be.disabled')
    })
  })

  context('メンテナンス期間中の表示とボタン制御', function () {
    it('案内文表示期間中かつメンテナンス期間外はモバイルアクセスIDが活性になる', function () {
      cy.clock(new Date('2026-07-01T10:00:00+09:00'), ['Date'])

      cy.visit(`/tenants/${this.tenantId}/rink-mobile/devices/create`)
      cy.wait(['@getRinkConnectionList'])

      cy.get('[data-cy="rink-mobile-devices-create-maintenance-notification"]').should('exist')
      cy.get('[data-cy="rink-mobile-devices-create-rink-mobile-id"]').find('input').should('not.be.disabled')
    })

    it('案内文が表示され、モバイルアクセスIDと確認ボタンが非活性になる', function () {
      cy.clock(new Date('2026-07-18T10:00:00+09:00'), ['Date'])

      cy.visit(`/tenants/${this.tenantId}/rink-mobile/devices/create`)
      cy.wait(['@getRinkConnectionList'])

      cy.get('[data-cy="rink-mobile-devices-create-maintenance-notification"]').should('exist')
      cy.get('[data-cy="rink-mobile-devices-create-rink-mobile-id"]').find('input').should('be.disabled')
      cy.get('[data-cy="rink-mobile-devices-create-submit-button"]').should('be.disabled')
    })
  })

  context('受付時間外メッセージの表示を確認', function () {
    it('受付時間外 - 日本時間(23:59)', function () {
      cy.clock(new Date(new Date().setHours(23, 59, 59, 59)), ['Date'])

      // 通信機購入画面へ遷移
      cy.visit(`/tenants/${this.tenantId}/rink-mobile/devices/create`)
      cy.wait(['@getRinkConnectionList'])

      // 時間外メッセージの表示
      cy.get('[data-cy="rink-mobile-devices-create-outside-reception-hour"]').should('exist')

      // モバイルアクセスIDを選択
      cy.inputSelectForm({
        selector: '[data-cy="rink-mobile-devices-create-rink-mobile-id"]',
        value: RINK_MOBILE_ID,
      })
      cy.wait(['@getAvailablePlanDeviceList'])

      cy.fixture('rink-mobile/connections/device-purchase').then(purchaseData => {
        // 購入機器選択ダイアログを開く
        cy.get('[data-cy="rink-mobile-devices-create-edit-table"]').find('.edit-table-add-button').click()
        // 通信機器機種名を選択
        cy.inputSelectForm({
          selector: '[data-cy="rink-mobile-devices-create-device-name"]',
          value: DEVICE_NAME_1,
        })
        // 台数を入力
        cy.get('[data-cy="rink-mobile-devices-create-count"]').find('input').type(DEVICE_COUNT)
        cy.get('.dialog-base-submit-button').click()
        cy.wait('@postRinkLineAvailableDate')

        // 入力
        cy.inputShippingInformation(purchaseData)

        // 利用開始希望日の入力
        const today = dayjs().format('YYYY-MM-DD')
        cy.inputDatePicker({
          className: '[data-cy="edit-shipping-information-request-date"]',
          date: today,
        })

        // 必要な情報を入力後も確認ボタンが押せないことを確認する
        cy.get('[data-cy="rink-mobile-devices-create-submit-button"]').should('be.disabled')
      })
    })

    it('受付時間外 - 日本時間(20:00)', function () {
      cy.clock(new Date(new Date().setHours(20, 0, 0, 0)), ['Date'])

      // 通信機購入画面へ遷移
      cy.visit(`/tenants/${this.tenantId}/rink-mobile/devices/create`)
      cy.wait(['@getRinkConnectionList'])

      // 時間外メッセージの表示
      cy.get('[data-cy="rink-mobile-devices-create-outside-reception-hour"]').should('exist')
    })
  })
})
