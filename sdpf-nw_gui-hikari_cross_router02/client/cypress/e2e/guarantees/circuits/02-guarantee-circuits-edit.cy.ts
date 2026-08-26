import { DurationTypes, NotificationIntervalTypes, ThresholdTypes } from '@app/api/guarantees/constants'
import { generateRandomHex, t } from '@cypress/support/utils'

describe('ギャランティ編集', () => {
  // @getGuarantee のレスポンスに tenantId がある場合に @getTerminalList を追加する
  const detailWaitList = ['@getGuarantee', '@getCampaignList']
  const editWaitList = ['@getResourceSummaryGuaranteeList', '@getGuarantee', '@getCampaignList']

  beforeEach(function () {
    // 確認ボタンが押せるように時間固定
    cy.clock(new Date(new Date().setHours(9, 0, 0, 0)), ['Date'])

    this.tenantId = generateRandomHex(32)
    this.guaranteeId = generateRandomHex(32)
    this.orderId = generateRandomHex(32)

    cy.fixture('guarantees/circuits/detail-reserve-date-approved').then(detail => {
      this.detailData = detail
    })
    cy.fixture('guarantees/circuits/edit').then(edit => {
      this.editData = edit
    })

    cy.intercept('GET', '**/ztgict/v1/resource-summary/guarantees?limit=1000*', {
      fixture: 'guarantees/circuits/list',
    }).as('getResourceSummaryGuaranteeList')
    cy.intercept('GET', '**/ztgict/v1/guarantees/*', {
      fixture: 'guarantees/circuits/detail-reserve-date-approved',
    }).as('getGuarantee')
    cy.intercept('GET', '**/ztgict/v1/campaigns*', { fixture: 'campaigns/list-empty' }).as('getCampaignList')
    cy.intercept('PUT', '**/ztgict/v1/guarantees/*', { body: { orderId: this.orderId } }).as('putRequest')
    cy.intercept('GET', `**/ztgict/v1/orders/${this.orderId}`, { response: { statusCode: 200 } }).as('getOrder')
    cy.intercept('GET', '**/ztgict/v1/resource-summary/terminals*', { fixture: 'terminals/list-some-items' }).as(
      'getTerminalList',
    )
  })

  it('ギャランティ編集 -> オーダー詳細', function () {
    cy.visit(`tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}`)
    cy.wait(detailWaitList)

    cy.get('[data-cy="guarantees-circuits-id-index-reserve-field-survey-construction-date-button"]').should(
      'be.disabled',
    )
    cy.get('[data-cy="guarantees-circuits-id-index-reserve-removal-date-button"]').should('not.exist')
    cy.get('[data-cy="guarantees-circuits-id-index-edit-button"]').click()
    cy.url().should(
      'eq',
      `${Cypress.config().baseUrl}/tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}/edit`,
    )
    cy.wait(editWaitList)

    // 更新値を入力して確認ボタンを押下
    cy.get('[data-cy="guarantees-circuits-id-edit-customer-note"]')
      .find('input')
      .clear()
      .type(this.editData.customerNote)

    cy.inputSelectForm({
      selector: '[data-cy="guarantees-circuits-id-edit-internet-rate-limit"]',
      value: this.editData.internet.rateLimit,
    })
    const internetThreshold = t('guarantees.thresholdOptionText', {
      value: this.editData.internet.alertSetting.threshold as string,
    })
    cy.inputSelectForm({
      selector: '[data-cy="guarantees-circuits-id-edit-internet-threshold"]',
      value: internetThreshold,
    })
    const internetDuration = t(`guarantees.${this.editData.internet.alertSetting.duration}`)
    cy.inputSelectForm({
      selector: '[data-cy="guarantees-circuits-id-edit-internet-duration"]',
      value: internetDuration,
    })
    const internetNotificationInterval = t(
      `guarantees.notificationInterval${this.editData.internet.alertSetting.notificationInterval}`,
    )
    cy.inputSelectForm({
      selector: '[data-cy="guarantees-circuits-id-edit-internet-notification-interval"]',
      value: internetNotificationInterval,
    })
    cy.inputSelectForm({
      selector: '[data-cy="guarantees-circuits-id-edit-vpn-rate-limit"]',
      value: this.editData.vpn.rateLimit,
    })
    const vpnThreshold = t('guarantees.thresholdOptionText', {
      value: this.editData.vpn.alertSetting.threshold as string,
    })
    cy.inputSelectForm({
      selector: '[data-cy="guarantees-circuits-id-edit-vpn-threshold"]',
      value: vpnThreshold,
    })
    const vpnDuration = t(`guarantees.${this.editData.vpn.alertSetting.duration}`)
    cy.inputSelectForm({
      selector: '[data-cy="guarantees-circuits-id-edit-vpn-duration"]',
      value: vpnDuration,
    })
    const vpnNotificationInterval = t(
      `guarantees.notificationInterval${this.editData.vpn.alertSetting.notificationInterval}`,
    )
    cy.inputSelectForm({
      selector: '[data-cy="guarantees-circuits-id-edit-vpn-notification-interval"]',
      value: vpnNotificationInterval,
    })
    cy.get('[data-cy="guarantees-circuits-id-edit-save-button"]')
      .should('have.text', t('common.confirm'))
      .should('be.not.disabled')
      .click()

    // 入力値を確認して保存ボタンを押下
    cy.get('[data-cy="guarantees-circuits-id-edit-customer-note"]')
      .find('input')
      .should('have.value', this.editData.customerNote)
      .should('be.disabled')
    cy.get('[data-cy="guarantees-circuits-id-edit-internet-rate-limit"]')
      .find('input')
      .should('have.value', this.editData.internet.rateLimit)
      .should('be.disabled')
    cy.get('[data-cy="guarantees-circuits-id-edit-internet-threshold"]')
      .find('input')
      .should('have.value', internetThreshold)
      .should('be.disabled')
    cy.get('[data-cy="guarantees-circuits-id-edit-internet-duration"]')
      .find('input')
      .should('have.value', internetDuration)
      .should('be.disabled')
    cy.get('[data-cy="guarantees-circuits-id-edit-internet-notification-interval"]')
      .find('input')
      .should('have.value', internetNotificationInterval)
      .should('be.disabled')
    cy.get('[data-cy="guarantees-circuits-id-edit-vpn-rate-limit"]')
      .find('input')
      .should('have.value', this.editData.vpn.rateLimit)
      .should('be.disabled')
    cy.get('[data-cy="guarantees-circuits-id-edit-vpn-threshold"]')
      .find('input')
      .should('have.value', vpnThreshold)
      .should('be.disabled')
    cy.get('[data-cy="guarantees-circuits-id-edit-vpn-duration"]')
      .find('input')
      .should('have.value', vpnDuration)
      .should('be.disabled')
    cy.get('[data-cy="guarantees-circuits-id-edit-vpn-notification-interval"]')
      .find('input')
      .should('have.value', vpnNotificationInterval)
      .should('be.disabled')
    cy.get('[data-cy="guarantees-circuits-id-edit-save-button"]').should('have.text', t('common.save')).click()

    cy.wait('@putRequest').then(req => {
      expect(req.request.url).to.include(`ztgict/v1/guarantees/${this.guaranteeId}`)
      expect(req.request.body).to.deep.equal(this.editData)
    })

    // 直前の画面に戻る
    cy.url().should(
      'eq',
      `${Cypress.config().baseUrl}/tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}`,
    )
    cy.wait(detailWaitList)

    // PUT guarantees の成功メッセージを確認
    cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('message.accepted'))
    // 「オーダー詳細に遷移」ボタンを押してオーダー詳細画面に遷移することを確認する
    cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
    cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.moveToOrderDetail')).click()
    cy.get('[data-cy="notification-dialog-text"]').should('not.exist')

    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/orders/${this.orderId}`)
    cy.wait('@getOrder')

    // オーダー詳細画面の戻るボタンを押して詳細画面に戻る
    cy.get('[data-cy="orders-id-index-return-button"]').should('have.text', t('common.return')).click()
    // 詳細画面に戻る
    cy.url().should(
      'eq',
      `${Cypress.config().baseUrl}/tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}`,
    )
    cy.wait(detailWaitList)
  })

  it('インターネットとVPNの契約帯域を変更した時の画面動作確認 -> 閉じる', function () {
    cy.visit(`tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}`)
    cy.wait(detailWaitList)

    cy.get('[data-cy="guarantees-circuits-id-index-edit-button"]').click()
    cy.url().should('include', `/tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}/edit`)
    cy.wait(editWaitList)

    // 確認ボタンが disabled になっていることを確認
    cy.get('[data-cy="guarantees-circuits-id-edit-save-button"]')
      .as('confirmButton')
      .should('have.text', t('common.confirm'))
      .should('be.disabled')

    // アラート通知設定の「閾値」を未選択にしたときに「閾値条件の継続時間」と「通知頻度」が空になって非活性になることを確認する
    cy.inputSelectForm({
      selector: '[data-cy="guarantees-circuits-id-edit-internet-threshold"]',
      value: t('common.unselected'),
    })
    cy.get('[data-cy="guarantees-circuits-id-edit-internet-duration"]')
      .find('input')
      .should('have.value', '')
      .should('be.disabled')
    cy.get('[data-cy="guarantees-circuits-id-edit-internet-notification-interval"]')
      .find('input')
      .should('have.value', '')
      .should('be.disabled')
    cy.inputSelectForm({
      selector: '[data-cy="guarantees-circuits-id-edit-vpn-threshold"]',
      value: t('common.unselected'),
    })
    cy.get('[data-cy="guarantees-circuits-id-edit-vpn-duration"]')
      .find('input')
      .should('be.disabled')
      .should('have.value', '')
    cy.get('[data-cy="guarantees-circuits-id-edit-vpn-notification-interval"]')
      .find('input')
      .should('have.value', '')
      .should('be.disabled')
    cy.get('@confirmButton').should('not.be.disabled')

    // 契約帯域を両方未選択にすると入力必須項目のエラーメッセージが表示されることを確認
    cy.inputSelectForm({
      selector: '[data-cy="guarantees-circuits-id-edit-internet-rate-limit"]',
      value: t('common.unselected'),
    })
    cy.inputSelectForm({
      selector: '[data-cy="guarantees-circuits-id-edit-vpn-rate-limit"]',
      value: t('common.unselected'),
    })
    cy.get('[data-cy="guarantees-circuits-id-edit-internet-rate-limit"]').should('contain', t('invalid.required'))
    cy.get('[data-cy="guarantees-circuits-id-edit-vpn-rate-limit"]').should('contain', t('invalid.required'))
    cy.get('@confirmButton').should('be.disabled')

    // rateLimit を入力してエラーが表示されないことを確認
    cy.inputSelectForm({
      selector: '[data-cy="guarantees-circuits-id-edit-internet-rate-limit"]',
      value: this.editData.internet.rateLimit,
    })
    cy.inputSelectForm({
      selector: '[data-cy="guarantees-circuits-id-edit-vpn-rate-limit"]',
      value: this.editData.vpn.rateLimit,
    })
    cy.get('@confirmButton').should('not.be.disabled')

    // threshold に適当な値を入れた時に duration と notification-interval の入力欄が活性になることを確認
    // 確認ボタンは非活性になる
    cy.inputSelectForm({
      selector: '[data-cy="guarantees-circuits-id-edit-internet-threshold"]',
      value: t('guarantees.thresholdOptionText', { value: ThresholdTypes[0] }),
    })
    cy.get('[data-cy="guarantees-circuits-id-edit-internet-duration"]').find('input').should('not.be.disabled')
    cy.get('[data-cy="guarantees-circuits-id-edit-internet-notification-interval"]')
      .find('input')
      .should('not.be.disabled')
    cy.inputSelectForm({
      selector: '[data-cy="guarantees-circuits-id-edit-vpn-threshold"]',
      value: t('guarantees.thresholdOptionText', { value: ThresholdTypes[1] }),
    })
    cy.get('[data-cy="guarantees-circuits-id-edit-vpn-duration"]').find('input').should('not.be.disabled')
    cy.get('[data-cy="guarantees-circuits-id-edit-vpn-notification-interval"]').find('input').should('not.be.disabled')
    cy.get('@confirmButton').should('be.disabled')

    // duration と notification-interval を入力すると確認ボタンは活性になる
    cy.inputSelectForm({
      selector: '[data-cy="guarantees-circuits-id-edit-internet-duration"]',
      value: t(`guarantees.${DurationTypes.Duration1Hour}`),
    })
    cy.inputSelectForm({
      selector: '[data-cy="guarantees-circuits-id-edit-internet-notification-interval"]',
      value: t(`guarantees.notificationInterval${NotificationIntervalTypes.Interval1Day}`),
    })
    cy.get('@confirmButton').should('be.disabled')
    cy.inputSelectForm({
      selector: '[data-cy="guarantees-circuits-id-edit-vpn-duration"]',
      value: t(`guarantees.${DurationTypes.Duration15Minutes}`),
    })
    cy.inputSelectForm({
      selector: '[data-cy="guarantees-circuits-id-edit-vpn-notification-interval"]',
      value: t(`guarantees.notificationInterval${NotificationIntervalTypes.Interval1Day}`),
    })
    cy.get('@confirmButton').should('not.be.disabled')
    // インターネットの契約帯域だけ更新する
    cy.inputSelectForm({
      selector: '[data-cy="guarantees-circuits-id-edit-vpn-rate-limit"]',
      value: t('common.unselected'),
    })
    // VPN契約帯域を未選択になると閾値を非活性になる
    cy.get('[data-cy="guarantees-circuits-id-edit-vpn-threshold"]')
      .find('input')
      .should('have.value', '')
      .should('be.disabled')
    cy.inputSelectForm({
      selector: '[data-cy="guarantees-circuits-id-edit-internet-threshold"]',
      value: t('common.unselected'),
    })

    // 確認ボタンを押下
    cy.get('@confirmButton').click()
    // 更新ボタンを押下
    cy.get('[data-cy="guarantees-circuits-id-edit-vpn-rate-limit"]')
      .find('input')
      .should('have.value', '')
      .should('be.disabled')
    cy.get('[data-cy="guarantees-circuits-id-edit-internet-duration"]')
      .find('input')
      .should('have.value', '')
      .should('be.disabled')
    cy.get('[data-cy="guarantees-circuits-id-edit-internet-notification-interval"]')
      .find('input')
      .should('have.value', '')
      .should('be.disabled')
    cy.get('[data-cy="guarantees-circuits-id-edit-vpn-duration"]')
      .find('input')
      .should('be.disabled')
      .should('have.value', '')
    cy.get('[data-cy="guarantees-circuits-id-edit-vpn-notification-interval"]')
      .find('input')
      .should('have.value', '')
      .should('be.disabled')
    cy.get('@confirmButton').should('have.text', t('common.save')).click()

    cy.wait('@putRequest').then(req => {
      expect(req.request.url).to.include(`ztgict/v1/guarantees/${this.guaranteeId}`)
      expect(req.request.body).to.deep.equal({
        customerNote: this.detailData.customerNote,
        internet: {
          rateLimit: this.editData.internet.rateLimit,
          alertSetting: null,
        },
        vpn: {
          rateLimit: null,
          alertSetting: null,
        },
      })
    })

    // 直前の画面に戻る
    cy.url().should(
      'eq',
      `${Cypress.config().baseUrl}/tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}`,
    )
    cy.wait(detailWaitList)

    // PUT guarantees の成功メッセージを確認
    cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('message.accepted'))
    cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
    cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.moveToOrderDetail'))

    // ダイアログの閉じるボタンを押す
    cy.get('.dialog-card-close').click()
    cy.get('[data-cy="notification-dialog-text"]').should('not.exist')
    cy.url().should(
      'eq',
      `${Cypress.config().baseUrl}/tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}`,
    )
  })

  it('キャンペーン適用中はインターネットとVPNの契約帯域を変更できない', function () {
    cy.clock(new Date('2024-04-22T00:00:00Z'), ['Date'])
    cy.intercept('GET', '**/ztgict/v1/campaigns*', { fixture: 'campaigns/list' }).as('getCampaignList')

    cy.visit(`tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}`)
    cy.wait(detailWaitList)

    cy.get('[data-cy="guarantees-circuits-id-index-edit-button"]').click()
    cy.url().should('include', `/tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}/edit`)
    cy.wait(editWaitList)

    // 注意書きが表示されていることを確認
    cy.get('[data-cy="guarantees-circuits-id-edit-rate-limit-disabled"]')
      .should('be.visible')
      .should('have.text', t('guarantees.rateLimitDisabled'))
    // インターネット契約帯域の入力欄が disabled になっていることを確認
    cy.get('[data-cy="guarantees-circuits-id-edit-internet-rate-limit"]').find('input').should('be.disabled')
    // VPN契約帯域の入力欄が disabled になっていることを確認
    cy.get('[data-cy="guarantees-circuits-id-edit-vpn-rate-limit"]').find('input').should('be.disabled')
  })
})
