import dayjs, { extend } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { generateRandomHex, t, OUTSIDE_APPLICATION_RESTRICTION_AT } from '@cypress/support/utils'

extend(utc)

// ワイドプラス for Web会議 と規約同意は、ワイド・スーパーワイドで表示される
const isWidePlan = (ipoeType: string) => ['wide', 'superWide'].includes(ipoeType)

describe('フレッツ別契約の新規作成テスト', () => {
  beforeEach(function () {
    // 期間限定の申込規制の影響を受けないよう規制期間外の日時に固定する(規制終了後に削除する)
    cy.clock(new Date(OUTSIDE_APPLICATION_RESTRICTION_AT), ['Date'])
    this.tenantId = generateRandomHex(32)
    this.orderId = generateRandomHex(32)
    this.fletsOpenDate = dayjs(OUTSIDE_APPLICATION_RESTRICTION_AT).add(1, 'd').utc().format('YYYY-MM-DD')
    this.ipoeApplicationDate = dayjs(OUTSIDE_APPLICATION_RESTRICTION_AT).add(1, 'd').format('YYYY-MM-DD')
    cy.fixture('ipoes/flets-separate/create.json').then(create => {
      this.withoutCustomerInformationCreateData = create.withoutCustomerInformation
      this.createData = create.default
      this.hikariCrossCreateData = create.hikariCross
    })
    cy.intercept('GET', '**/ztgict/v1/settings/contractor', { fixture: 'contractor/detail' }).as('getContractor')
    cy.intercept('GET', '**/ztgict/v1/ipoe/hikari-collabo-util/available', { body: { available: true } }).as(
      'getAvailable',
    )
    cy.intercept('GET', '**/ztgict/v1/ipoe*', { fixture: 'ipoes/list' }).as('getIpoeList')
    cy.intercept('GET', '**/ztgict/v1/resource-summary/ipoe*', { fixture: 'ipoes/summary-list' }).as(
      'getSummaryIpoeList',
    )

    cy.intercept('POST', '**/ztgict/v1/ipoe/separate-contract', { body: { orderId: this.orderId } }).as('postRequest')
    cy.intercept('GET', `**/ztgict/v1/orders/${this.orderId}`, { response: { statusCode: 200 } }).as('getOrder')
  })

  it('顧客情報の入力なし -> オーダー詳細', function () {
    // 一覧画面から新規作成画面に遷移
    cy.visit(`/tenants/${this.tenantId}/ipoes`)
    cy.wait(['@getIpoeList', '@getSummaryIpoeList'])
    cy.get('[data-cy="ipoes-index-create-button"]').should('have.text', t('common.createNew')).click()
    cy.wait(['@getAvailable', '@getContractor'])

    // キャンペーンページ画面を経由せずに遷移することを確認する
    cy.get(`[data-cy="ipoe-${this.withoutCustomerInformationCreateData.ipoeType}-plan-button"]`).should('not.exist')
    cy.get('[data-cy="ipoe-create-request-type-radio-button"]').should('exist')

    // 申込種別選択
    cy.get('[data-cy="ipoe-create-request-type-radio-button"]')
      .find(`.label.${this.withoutCustomerInformationCreateData.requestType}`)
      .click()

    cy.get('[data-cy="flets-separate-customer-note"]')
      .find('input')
      .type(this.withoutCustomerInformationCreateData.customerNote)
    cy.get('[data-cy="flets-separate-flets-id"]').find('input').type(this.withoutCustomerInformationCreateData.fletsId)
    // 回線プランは初期状態でフレッツ光ネクストが選択されている
    cy.get('[data-cy="flets-separate-hikari-plan"]')
      .find(`.radio.checked .label.${this.withoutCustomerInformationCreateData.hikariPlan}`)
      .should('exist')
    // 17683: キャンペーンページ画面を経由しなくなったため、この画面で ipoeType を選択する
    cy.get('[data-cy="flets-separate-ipoe-type"]').find('input').should('have.value', '')
    cy.inputSelectForm({
      selector: '[data-cy="flets-separate-ipoe-type"]',
      value: t(`ipoes.${this.withoutCustomerInformationCreateData.ipoeType}`),
    })

    // appControl
    if (!isWidePlan(this.withoutCustomerInformationCreateData.ipoeType)) {
      cy.get('[data-cy="flets-separate-app-control"]').should('not.exist')
    } else {
      cy.get('[data-cy="flets-separate-app-control"]')
        .find(`.label.${this.withoutCustomerInformationCreateData.appControl}`)
        .click()
    }
    // accessKey
    cy.get('[data-cy="flets-separate-access-key"]')
      .find('input')
      .type(this.withoutCustomerInformationCreateData.accessKey)
    // ipoeApplicationDate
    cy.inputDatePicker({
      className: '[data-cy="flets-separate-ipoe-application-date"]',
      date: this.ipoeApplicationDate,
    })
    // fletsOpen
    cy.get('[data-cy="flets-separate-flets-open"]')
      .find(`.label.${this.withoutCustomerInformationCreateData.fletsOpen}`)
      .click()
    // fletsOpenDate
    if (this.withoutCustomerInformationCreateData.fletsOpen) {
      cy.get('[data-cy="flets-separate-flets-open-date"]').should('not.exist')
    } else {
      cy.inputDatePicker({
        className: '[data-cy="flets-separate-flets-open-date"]',
        date: this.fletsOpenDate,
      })
    }

    // customer information
    cy.get('[data-cy="flets-separate-origin-contractor-name"]').should('not.exist')
    cy.get('[data-cy="flets-separate-origin-contractor-name-kana"]').should('not.exist')
    cy.get('[data-cy="flets-separate-applicant-name"]').should('not.exist')
    cy.get('[data-cy="flets-separate-applicant-name-kana"]').should('not.exist')

    cy.get('[data-cy="flets-separate-origin-contractor-postal-code"]').should('not.exist')
    cy.get('[data-cy="flets-separate-installation-place-postal-code"]').should('not.exist')

    cy.get('[data-cy="flets-separate-applicant-phone-number"]').should('not.exist')
    cy.get('[data-cy="flets-separate-origin-contractor-phone-number"]').should('not.exist')
    cy.get('[data-cy="flets-separate-installation-place-phone-number"]').should('not.exist')
    cy.get('[data-cy="flets-separate-origin-contractor-mail-address"]').should('not.exist')
    cy.get('[data-cy="flets-separate-applicant-mail-address"]').should('not.exist')

    // 確認
    cy.get('[data-cy="flets-separate-cancel-button"]').should('have.text', t('common.cancel'))
    cy.get('[data-cy="flets-separate-submit-button"]').should('have.text', t('common.confirm')).click()

    // 規約同意
    if (isWidePlan(this.withoutCustomerInformationCreateData.ipoeType)) {
      cy.get('[data-cy="hikari-collabo-terms-of-service-agreement"]').find('.checkbox').click()
    } else {
      cy.get('[data-cy="hikari-collabo-terms-of-service"]').should('not.exist')
    }

    // 作成
    cy.get('[data-cy="flets-separate-cancel-button"]').should('have.text', t('common.return'))
    cy.get('[data-cy="flets-separate-submit-button"]').should('have.text', t('common.create')).click()

    const request = {
      ...this.withoutCustomerInformationCreateData,
      requestType: undefined,
      appControl: isWidePlan(this.withoutCustomerInformationCreateData.ipoeType)
        ? this.withoutCustomerInformationCreateData.appControl
        : false,
      ipoeApplicationDate: this.ipoeApplicationDate,
      fletsOpenDate: this.withoutCustomerInformationCreateData.fletsOpen ? undefined : this.fletsOpenDate,
    }
    cy.wait('@postRequest').then(req => {
      const stringify = JSON.stringify(request)
      expect(req.request.url).to.include('ztgict/v1/ipoe/separate-contract')
      expect(req.request.body).to.deep.equal(JSON.parse(stringify))
    })

    // 一旦一覧画面に遷移する
    cy.get('@getIpoeList')
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/ipoes`)

    // POST ipoe/separate-contract の成功メッセージを確認
    cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('message.accepted'))
    cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
    cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.moveToOrderDetail')).click()
    cy.get('[data-cy="notification-dialog-text"]').should('not.exist')

    // オーダー詳細の画面に遷移する
    cy.wait('@getOrder')
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/orders/${this.orderId}`)
    // オーダー詳細画面の戻るボタンを押して一覧画面に戻る
    cy.get('[data-cy="orders-id-index-return-button"]').should('have.text', t('common.return')).click()
    cy.get('@getIpoeList')
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/ipoes`)
  })

  // 17683: キャンペーンページ画面は不要になったが、必要になる可能性があるため削除はしない
  it.skip('ワイドプランで必須項目を入力後、ワイドプラス for Web会議を未入力のまま標準プランに戻すと確認ボタンが有効になる', function () {
    // 一覧画面から新規作成画面に遷移
    cy.visit(`/tenants/${this.tenantId}/ipoes`)
    cy.wait(['@getIpoeList', '@getSummaryIpoeList'])
    cy.get('[data-cy="ipoes-index-create-button"]').should('have.text', t('common.createNew')).click()
    cy.wait(['@getAvailable', '@getContractor'])
    cy.get(`[data-cy="ipoe-${this.createData.ipoeType}-plan-button"]`).click()
    cy.get('[data-cy="ipoe-create-request-type-radio-button"]').should('exist')

    // 申込種別選択
    cy.get('[data-cy="ipoe-create-request-type-radio-button"]').find(`.label.${this.createData.requestType}`).click()
    cy.get('[data-cy="flets-separate-customer-note"]').find('input').type(this.createData.customerNote)
    // 回線プランは初期状態でフレッツ光ネクストが選択されている
    cy.get('[data-cy="flets-separate-hikari-plan"]')
      .find(`.radio.checked .label.${this.createData.hikariPlan}`)
      .should('exist')
    cy.get('[data-cy="flets-separate-ipoe-type"]')
      .click()
      .contains(t(`ipoes.${this.createData.ipoeType}`))
      .parent()
      .should('have.class', 'selected')

    // ワイドプラス for Web会議は未入力のままにする
    cy.get('[data-cy="flets-separate-app-control"]').find('.radio.checked').should('have.length', 0)

    // ipoeApplicationDate
    cy.inputDatePicker({
      className: '[data-cy="flets-separate-ipoe-application-date"]',
      date: this.ipoeApplicationDate,
    })
    // fletsOpen
    cy.get('[data-cy="flets-separate-flets-open"]').find(`.label.${this.createData.fletsOpen}`).click()
    // fletsOpenDate
    if (this.createData.fletsOpen) {
      cy.get('[data-cy="flets-separate-flets-open-date"]').should('not.exist')
    } else {
      cy.inputDatePicker({
        className: '[data-cy="flets-separate-flets-open-date"]',
        date: this.fletsOpenDate,
      })
    }

    // customer information
    cy.get('[data-cy="flets-separate-origin-contractor-name"]')
      .find('input')
      .type(this.createData.originContractor.name)
    cy.get('[data-cy="flets-separate-origin-contractor-name-kana"]')
      .find('input')
      .type(this.createData.originContractor.nameKana)
    cy.get('[data-cy="flets-separate-applicant-name"]').find('input').type(this.createData.applicant.name)
    cy.get('[data-cy="flets-separate-applicant-name-kana"]').find('input').type(this.createData.applicant.nameKana)

    cy.get('[data-cy="flets-separate-origin-contractor-postal-code"]')
      .find('input')
      .type(this.createData.originContractor.postalCode)
    cy.get('[data-cy="flets-separate-installation-place-postal-code"]')
      .find('input')
      .type(this.createData.installationPlace.postalCode)

    cy.get('[data-cy="flets-separate-applicant-phone-number"]')
      .find('input')
      .type(this.createData.applicant.phoneNumber)
    cy.get('[data-cy="flets-separate-origin-contractor-phone-number"]')
      .find('input')
      .type(this.createData.originContractor.phoneNumber)
    cy.get('[data-cy="flets-separate-installation-place-phone-number"]')
      .find('input')
      .type(this.createData.installationPlace.phoneNumber)
    cy.get('[data-cy="flets-separate-origin-contractor-mail-address"]')
      .find('input')
      .type(this.createData.originContractor.mailAddress)
    cy.get('[data-cy="flets-separate-applicant-mail-address"]')
      .find('input')
      .type(this.createData.applicant.mailAddress)

    // appControl未入力のため確認ボタンは無効
    cy.get('[data-cy="flets-separate-submit-button"]').should('have.text', t('common.confirm')).should('be.disabled')

    // IPoEアクセスプランを標準に変更
    cy.inputSelectForm({ selector: '[data-cy="flets-separate-ipoe-type"]', value: t('ipoes.normal') })

    cy.get('[data-cy="flets-separate-ipoe-type"]').find('input').should('have.value', t('ipoes.normal'))
    cy.get('[data-cy="flets-separate-app-control"]').should('not.exist')
    cy.get('[data-cy="flets-separate-submit-button"]')
      .should('have.text', t('common.confirm'))
      .should('not.be.disabled')
  })

  it('顧客情報の入力あり -> 一覧画面に遷移', function () {
    // 一覧画面から新規作成画面に遷移
    cy.visit(`/tenants/${this.tenantId}/ipoes`)
    cy.wait(['@getIpoeList', '@getSummaryIpoeList'])
    cy.get('[data-cy="ipoes-index-create-button"]').should('have.text', t('common.createNew')).click()
    cy.wait(['@getAvailable', '@getContractor'])

    // キャンペーンページ画面を経由せずに遷移することを確認する
    cy.get(`[data-cy="ipoe-${this.createData.ipoeType}-plan-button"]`).should('not.exist')
    cy.get('[data-cy="ipoe-create-request-type-radio-button"]').should('exist')

    // 申込種別選択
    cy.get('[data-cy="ipoe-create-request-type-radio-button"]').find(`.label.${this.createData.requestType}`).click()
    cy.get('[data-cy="flets-separate-customer-note"]').find('input').type(this.createData.customerNote)
    // 回線プランは初期状態でフレッツ光ネクストが選択されている
    cy.get('[data-cy="flets-separate-hikari-plan"]')
      .find(`.radio.checked .label.${this.createData.hikariPlan}`)
      .should('exist')
    // 17683: キャンペーンページ画面を経由しなくなったため、この画面で ipoeType を選択する
    cy.get('[data-cy="flets-separate-ipoe-type"]').find('input').should('have.value', '')
    cy.inputSelectForm({
      selector: '[data-cy="flets-separate-ipoe-type"]',
      value: t(`ipoes.${this.createData.ipoeType}`),
    })

    // appControl
    if (!isWidePlan(this.createData.ipoeType)) {
      cy.get('[data-cy="flets-separate-app-control"]').should('not.exist')
    } else {
      cy.get('[data-cy="flets-separate-app-control"]').find(`.label.${this.createData.appControl}`).click()
    }
    // ipoeApplicationDate
    cy.inputDatePicker({
      className: '[data-cy="flets-separate-ipoe-application-date"]',
      date: this.ipoeApplicationDate,
    })
    // fletsOpen
    cy.get('[data-cy="flets-separate-flets-open"]').find(`.label.${this.createData.fletsOpen}`).click()
    // fletsOpenDate
    if (this.createData.fletsOpen) {
      cy.get('[data-cy="flets-separate-flets-open-date"]').should('not.exist')
    } else {
      cy.inputDatePicker({
        className: '[data-cy="flets-separate-flets-open-date"]',
        date: this.fletsOpenDate,
      })
    }

    // customer information
    cy.get('[data-cy="flets-separate-origin-contractor-name"]')
      .find('input')
      .type(this.createData.originContractor.name)
    cy.get('[data-cy="flets-separate-origin-contractor-name-kana"]')
      .find('input')
      .type(this.createData.originContractor.nameKana)
    cy.get('[data-cy="flets-separate-applicant-name"]').find('input').type(this.createData.applicant.name)
    cy.get('[data-cy="flets-separate-applicant-name-kana"]').find('input').type(this.createData.applicant.nameKana)

    cy.get('[data-cy="flets-separate-origin-contractor-postal-code"]')
      .find('input')
      .type(this.createData.originContractor.postalCode)
    cy.get('[data-cy="flets-separate-installation-place-postal-code"]')
      .find('input')
      .type(this.createData.installationPlace.postalCode)

    cy.get('[data-cy="flets-separate-applicant-phone-number"]')
      .find('input')
      .type(this.createData.applicant.phoneNumber)
    cy.get('[data-cy="flets-separate-origin-contractor-phone-number"]')
      .find('input')
      .type(this.createData.originContractor.phoneNumber)
    cy.get('[data-cy="flets-separate-installation-place-phone-number"]')
      .find('input')
      .type(this.createData.installationPlace.phoneNumber)
    cy.get('[data-cy="flets-separate-origin-contractor-mail-address"]')
      .find('input')
      .type(this.createData.originContractor.mailAddress)
    cy.get('[data-cy="flets-separate-applicant-mail-address"]')
      .find('input')
      .type(this.createData.applicant.mailAddress)

    // 確認
    cy.get('[data-cy="flets-separate-submit-button"]').click()

    // 規約同意
    if (isWidePlan(this.createData.ipoeType)) {
      cy.get('[data-cy="hikari-collabo-terms-of-service-agreement"]').find('.checkbox').click()
    } else {
      cy.get('[data-cy="hikari-collabo-terms-of-service"]').should('not.exist')
    }
    // 作成
    cy.get('[data-cy="flets-separate-submit-button"]').click()

    const request = {
      ...this.createData,
      requestType: undefined,
      appControl: isWidePlan(this.createData.ipoeType) ? this.createData.appControl : false,
      ipoeApplicationDate: this.ipoeApplicationDate,
      fletsOpenDate: this.createData.fletsOpen ? undefined : this.fletsOpenDate,
    }
    cy.wait('@postRequest').then(req => {
      const stringify = JSON.stringify(request)
      expect(req.request.url).to.include('ztgict/v1/ipoe/separate-contract')
      expect(req.request.body).to.deep.equal(JSON.parse(stringify))
    })

    // 一旦一覧画面に遷移する
    cy.get('@getIpoeList')
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/ipoes`)

    // POST ipoe/separate-contract の成功メッセージを確認
    cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('message.accepted'))
    cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
    cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.moveToOrderDetail'))

    // ダイアログの閉じるボタンを押す
    cy.get('.dialog-card-close').click()
    cy.get('[data-cy="notification-dialog-text"]').should('not.exist')
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/ipoes`)
  })

  it('フレッツ光クロスはスーパーワイドのみ選択できる', function () {
    // 一覧画面から新規作成画面に遷移
    cy.visit(`/tenants/${this.tenantId}/ipoes`)
    cy.wait(['@getIpoeList', '@getSummaryIpoeList'])
    cy.get('[data-cy="ipoes-index-create-button"]').click()
    cy.wait(['@getAvailable', '@getContractor'])

    // キャンペーンページ画面を経由せずに遷移することを確認する
    cy.get('[data-cy="ipoe-normal-plan-button"]').should('not.exist')
    cy.get('[data-cy="ipoe-create-request-type-radio-button"]').should('exist')

    // 申込種別選択
    cy.get('[data-cy="ipoe-create-request-type-radio-button"]')
      .find(`.label.${this.hikariCrossCreateData.requestType}`)
      .click()

    cy.get('[data-cy="flets-separate-customer-note"]').find('input').type(this.hikariCrossCreateData.customerNote)
    cy.get('[data-cy="flets-separate-flets-id"]').find('input').type(this.hikariCrossCreateData.fletsId)

    // 回線プランの初期値はフレッツ光ネクストで、標準・ワイドが選択できる
    cy.get('[data-cy="flets-separate-hikari-plan"]').find('.radio.checked .label.next').should('exist')
    cy.get('[data-cy="flets-separate-ipoe-type"]').find('input').should('have.value', '')
    cy.get('[data-cy="flets-separate-ipoe-type"]')
      .find('li')
      .should('have.length', 2)
      .then(options => {
        expect(options.eq(0).text()).to.equal(t('ipoes.normal'))
        expect(options.eq(1).text()).to.equal(t('ipoes.wide'))
      })
    cy.get('[data-cy="flets-separate-wide-note"]').should('not.exist')

    // フレッツ光クロスに変更するとスーパーワイドが選択され、他のプランは選択できなくなる
    cy.get('[data-cy="flets-separate-hikari-plan"]').find(`.label.${this.hikariCrossCreateData.hikariPlan}`).click()
    cy.get('[data-cy="flets-separate-ipoe-type"]').find('input').should('have.value', t('ipoes.superWide'))
    cy.get('[data-cy="flets-separate-ipoe-type"]')
      .find('li')
      .should('have.length', 1)
      .then(options => {
        expect(options.eq(0).text()).to.equal(t('ipoes.superWide'))
      })

    // 注意事項の文言がスーパーワイドになる
    cy.get('[data-cy="flets-separate-wide-note"]')
      .should('contain.text', t('ipoes.wideNote.title'))
      .should(
        'contain.text',
        t('ipoes.wideNote.text', { plan: t('ipoes.superWide'), linkText: t('ipoes.wideNote.linkText') }),
      )

    // appControl
    cy.get('[data-cy="flets-separate-app-control"]').find(`.label.${this.hikariCrossCreateData.appControl}`).click()
    // accessKey
    cy.get('[data-cy="flets-separate-access-key"]').find('input').type(this.hikariCrossCreateData.accessKey)
    // ipoeApplicationDate
    cy.inputDatePicker({
      className: '[data-cy="flets-separate-ipoe-application-date"]',
      date: this.ipoeApplicationDate,
    })
    // fletsOpen
    cy.get('[data-cy="flets-separate-flets-open"]').find(`.label.${this.hikariCrossCreateData.fletsOpen}`).click()
    // fletsOpenDate
    cy.inputDatePicker({
      className: '[data-cy="flets-separate-flets-open-date"]',
      date: this.fletsOpenDate,
    })

    // フレッツ回線IDとアクセスキーが入力されているため顧客情報は表示されない
    cy.get('[data-cy="flets-separate-origin-contractor-name"]').should('not.exist')
    cy.get('[data-cy="flets-separate-applicant-name"]').should('not.exist')

    // 確認
    cy.get('[data-cy="flets-separate-submit-button"]').should('have.text', t('common.confirm')).click()

    // スーパーワイドもワイドと同様に規約同意が必要
    cy.get('[data-cy="hikari-collabo-terms-of-service-agreement"]').find('.checkbox').click()

    // 作成
    cy.get('[data-cy="flets-separate-submit-button"]').should('have.text', t('common.create')).click()

    const request = {
      ...this.hikariCrossCreateData,
      requestType: undefined,
      ipoeApplicationDate: this.ipoeApplicationDate,
      fletsOpenDate: this.fletsOpenDate,
    }
    cy.wait('@postRequest').then(req => {
      expect(req.request.url).to.include('ztgict/v1/ipoe/separate-contract')
      expect(req.request.body).to.deep.equal(JSON.parse(JSON.stringify(request)))
    })
  })
})
