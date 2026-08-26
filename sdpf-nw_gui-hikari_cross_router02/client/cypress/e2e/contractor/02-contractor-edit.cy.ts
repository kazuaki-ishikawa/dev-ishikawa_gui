import { generateRandomHex, t } from '@cypress/support/utils'

describe('contractor edit', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)
    this.orderId = generateRandomHex(32)

    cy.fixture('contractor/detail.json').then(detail => {
      this.detail = detail
    })
    cy.fixture('contractor/edit.json').then(edit => {
      this.editData = edit
    })
    cy.fixture('ipoes/search-address.json').then(searchAddress => {
      this.searchAddress = searchAddress
    })
    cy.fixture('guarantees/circuits/search-address.json').then(searchAddress => {
      this.iwanUtilSearchAddress = searchAddress
    })
    cy.intercept('GET', '**/ztgict/v1/ipoe/hikari-collabo-util/available', { body: { available: true } }).as(
      'getAvailable',
    )
    cy.intercept('POST', '**/ztgict/v1/ipoe/hikari-collabo-util/search-address', {
      fixture: 'ipoes/search-address',
    }).as('postSearchAddress')
    cy.intercept('POST', '**/ztgict/v1/iwan-util/search-address', {
      fixture: 'guarantees/circuits/search-address',
    }).as('postIwanUtilSearchAddress')

    cy.intercept('GET', '**/ztgict/v1/settings/contractor', { fixture: 'contractor/detail' }).as('getContractor')
    cy.intercept('PUT', '**/ztgict/v1/settings/contractor', { body: { orderId: this.orderId } }).as('putContractor')
    cy.intercept('GET', `**/ztgict/v1/orders/${this.orderId}`, { response: { statusCode: 200 } }).as('getOrder')
  })

  it('光コラボ住所コードを使わず入力する場合', function () {
    cy.visit(`/tenants/${this.tenantId}/contracts/contractor`)
    cy.wait(['@getSession', '@getContractor'])
    cy.get('[data-cy="contracts-contractor-index-edit-button"]').should('have.text', t('common.edit')).click()
    cy.wait(['@getAvailable', '@getContractor'])
    cy.get('[data-cy="contractor-settings-submit-button"]')
      .should('have.text', t('common.confirm'))
      .should('be.disabled')

    // 契約者情報の確認
    cy.get('[data-cy="contractor-settings-name"]').find('input').should('have.value', this.detail.name)
    cy.get('[data-cy="contractor-settings-name-kana"]').find('input').should('have.value', this.detail.nameKana)
    cy.get('[data-cy="contractor-settings-pic-name"]').find('input').should('have.value', this.detail.picName)
    cy.get('[data-cy="contractor-settings-pic-name-kana"]').find('input').should('have.value', this.detail.picNameKana)
    cy.get('[data-cy="contractor-settings-address-code"]')
      .find('input')
      .should('have.value', this.detail.addressCode)
      .should('be.disabled')
    cy.get('[data-cy="contractor-settings-postal-code"]')
      .find('input')
      .should('have.value', this.detail.postalCode)
      .should('be.disabled')
    cy.get('[data-cy="contractor-settings-address"]')
      .find('input')
      .should('have.value', this.detail.address)
      .should('be.disabled')
    cy.get('[data-cy="contractor-settings-house-number"]').find('input').should('have.value', this.detail.houseNumber)
    cy.get('[data-cy="contractor-settings-building-name"]').find('input').should('have.value', this.detail.buildingName)
    cy.get('[data-cy="contractor-settings-address-kana"]').find('input').should('have.value', this.detail.addressKana)
    cy.get('[data-cy="contractor-settings-phone-number"]').find('input').should('have.value', this.detail.phoneNumber)

    // 光回線一括提供型契約者住所コードのクリアボタンを押下した時の確認
    cy.get('[data-cy="edit-address-code-clear-button"]').click()
    cy.get('[data-cy="contractor-settings-address-code"]').find('input').should('have.value', '').should('be.disabled')
    cy.get('[data-cy="contractor-settings-address-code"]')
      .find('[data-cy="edit-address-code-clear-button"]')
      .should('be.disabled')
    cy.get('[data-cy="contractor-settings-postal-code"]')
      .find('input')
      .should('have.value', '')
      .should('not.be.disabled')
    cy.get('[data-cy="contractor-settings-address"]').find('input').should('have.value', '').should('not.be.disabled')

    // 契約者情報の入力
    cy.get('[data-cy="contractor-settings-name"]').find('input').clear().type(this.editData.name)
    cy.get('[data-cy="contractor-settings-name-kana"]').find('input').clear().type(this.editData.nameKana)
    cy.get('[data-cy="contractor-settings-pic-name"]').find('input').clear().type(this.editData.picName)
    cy.get('[data-cy="contractor-settings-pic-name-kana"]').find('input').clear().type(this.editData.picNameKana)
    cy.get('[data-cy="contractor-settings-postal-code"]').find('input').type(this.editData.postalCode)
    // 郵便番号入力による住所自動入力の確認
    cy.get('[data-cy="contractor-settings-address"]').find('input').should('have.value', this.editData.address)
    cy.get('[data-cy="contractor-settings-house-number"]').find('input').clear().type(this.editData.houseNumber)
    cy.get('[data-cy="contractor-settings-building-name"]').find('input').clear().type(this.editData.buildingName)
    cy.get('[data-cy="contractor-settings-address-kana"]').find('input').clear().type(this.editData.addressKana)
    cy.get('[data-cy="contractor-settings-phone-number"]').find('input').clear().type(this.editData.phoneNumber)

    // ボタン
    cy.get('[data-cy="contractor-settings-submit-button"]').should('have.text', t('common.confirm')).click()

    // 確認画面
    cy.get('[data-cy="contractor-settings-name"]')
      .find('input')
      .should('have.value', this.editData.name)
      .should('be.disabled')
    cy.get('[data-cy="contractor-settings-name-kana"]')
      .find('input')
      .should('have.value', this.editData.nameKana)
      .should('be.disabled')
    cy.get('[data-cy="contractor-settings-pic-name"]')
      .find('input')
      .should('have.value', this.editData.picName)
      .should('be.disabled')
    cy.get('[data-cy="contractor-settings-pic-name-kana"]')
      .find('input')
      .should('have.value', this.editData.picNameKana)
      .should('be.disabled')
    cy.get('[data-cy="contractor-settings-postal-code"]')
      .find('input')
      .should('have.value', this.editData.postalCode)
      .should('be.disabled')
    cy.get('[data-cy="contractor-settings-address"]')
      .find('input')
      .should('have.value', this.editData.address)
      .should('be.disabled')
    cy.get('[data-cy="contractor-settings-house-number"]')
      .find('input')
      .should('have.value', this.editData.houseNumber)
      .should('be.disabled')
    cy.get('[data-cy="contractor-settings-building-name"]')
      .find('input')
      .should('have.value', this.editData.buildingName)
      .should('be.disabled')
    cy.get('[data-cy="contractor-settings-address-kana"]')
      .find('input')
      .should('have.value', this.editData.addressKana)
      .should('be.disabled')
    cy.get('[data-cy="contractor-settings-phone-number"]')
      .find('input')
      .should('have.value', this.editData.phoneNumber)
      .should('be.disabled')
    // 住所コード検索のボタンが非活性化してる確認
    cy.get('[data-cy="contractor-settings-address-code"]')
      .find('[data-cy="edit-address-code-register-address-code-button"]')
      .should('be.disabled')
    cy.get('[data-cy="contractor-settings-address-code"]')
      .find('[data-cy="edit-address-code-clear-button"]')
      .should('be.disabled')

    // 確認画面のボタン
    cy.get('[data-cy="contractor-settings-cancel-button"]').should('have.text', t('common.return'))
    cy.get('[data-cy="contractor-settings-submit-button"]').should('have.text', t('common.save')).click()

    // PUT contractor のリクエスト情報を確認
    cy.wait('@putContractor').then(req => {
      const stringify = JSON.stringify({ ...this.editData, addressCode: undefined })
      expect(req.request.url).to.include('ztgict/v1/settings/contractor')
      expect(req.request.body).to.deep.equal(JSON.parse(stringify))
    })

    cy.wait(['@getContractor'])
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/contracts/contractor`)

    // PUT contractor の成功メッセージを確認
    cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('message.accepted'))
    // 「オーダー詳細画面へ」ボタンを押下
    cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
    cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.moveToOrderDetail')).click()
    cy.wait('@getOrder')
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/orders/${this.orderId}`)
    cy.get('[data-cy="notification-dialog-text"]').should('not.exist')

    // オーダー詳細画面の戻るボタンを押してブレイクアウト一覧画面に戻る
    cy.get('[data-cy="orders-id-index-return-button"]').should('have.text', t('common.return')).click()
    // 一覧画面に戻る
    cy.wait(['@getContractor'])
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/contracts/contractor`)
  })

  // TODO: https://redmine.tok.access-company.com/nwvpn/issues/14474 住所検索が復活したらテストのskipを外す
  it.skip('住所検索を使って住所を入力する場合', function () {
    cy.visit(`/tenants/${this.tenantId}/contracts/contractor`)
    cy.wait('@getContractor')
    cy.get('[data-cy="contracts-contractor-index-edit-button"]').should('have.text', t('common.edit')).click()
    cy.wait(['@getAvailable', '@getContractor'])
    cy.get('[data-cy="contractor-settings-submit-button"]').as('submitButton').should('be.disabled')

    // 契約者情報の確認は別のパターンで確認済み
    // 契約者情報の入力
    cy.get('[data-cy="edit-address-code-clear-button"]').click()
    cy.get('[data-cy="contractor-settings-name"]').find('input').clear().type(this.editData.name)
    cy.get('[data-cy="contractor-settings-name-kana"]').find('input').clear().type(this.editData.nameKana)
    cy.get('[data-cy="contractor-settings-pic-name"]').find('input').clear().type(this.editData.picName)
    cy.get('[data-cy="contractor-settings-pic-name-kana"]').find('input').clear().type(this.editData.picNameKana)
    cy.get('[data-cy="contractor-settings-house-number"]').find('input').clear().type(this.editData.houseNumber)
    cy.get('[data-cy="contractor-settings-building-name"]').find('input').clear().type(this.editData.buildingName)
    cy.get('[data-cy="contractor-settings-address-kana"]').find('input').clear().type(this.editData.addressKana)
    cy.get('[data-cy="contractor-settings-phone-number"]').find('input').clear().type(this.editData.phoneNumber)

    // 郵便番号検索のボタンは未入力時は非活性
    cy.get('[data-cy="contractor-settings-postal-code"]').find('input').should('have.value', '')
    cy.get('[data-cy="contractor-settings-postal-code"]').should('be.disabled')
    //  郵便番号検索のボタンは郵便番号のバリデーションに引っかかる場合は非活性
    cy.get('[data-cy="contractor-settings-postal-code"]').find('input').type('9999-999')
    cy.get('[data-cy="contractor-settings-postal-code"]').should('be.disabled')

    // 郵便番号検索の結果が住所に反映されることを確認
    cy.get('[data-cy="contractor-settings-postal-code"]').clear().type(this.editData.postalCode)
    cy.get('[data-cy="contractor-settings-postal-code"]').click()
    cy.wait('@postIwanUtilSearchAddress')
    const address = [
      this.iwanUtilSearchAddress?.prefecture,
      this.iwanUtilSearchAddress?.municipalityList,
      this.iwanUtilSearchAddress?.largerSectionList,
      this.iwanUtilSearchAddress?.sectionList,
    ].join('')
    const houseNumber = [
      this.iwanUtilSearchAddress?.houseNumber1List,
      this.iwanUtilSearchAddress?.houseNumber2List,
      this.iwanUtilSearchAddress?.houseNumber3List,
    ].join('ー')
    const buildingName = [
      this.iwanUtilSearchAddress?.buildingName1List,
      this.iwanUtilSearchAddress?.buildingName2List,
      this.iwanUtilSearchAddress?.buildingName3List,
    ].join('　')
    cy.get('[data-cy="contractor-settings-postal-code"]').find('input').should('have.value', this.editData.postalCode)
    cy.get('[data-cy="contractor-settings-address"]').find('input').should('have.value', address)
    cy.get('[data-cy="contractor-settings-house-number"]').find('input').should('have.value', houseNumber)
    cy.get('[data-cy="contractor-settings-building-name"]').find('input').should('have.value', buildingName)

    // ボタン
    cy.get('@submitButton').should('have.text', t('common.confirm')).click()

    // 確認画面の確認は別のパターンで確認済み
    // 確認画面のボタン
    cy.get('@submitButton').should('have.text', t('common.save')).click()

    // PUT contractor のリクエスト情報を確認
    cy.wait('@putContractor').then(req => {
      const stringify = JSON.stringify({ ...this.editData, addressCode: undefined, address, houseNumber, buildingName })
      expect(req.request.url).to.include('ztgict/v1/settings/contractor')
      expect(req.request.body).to.deep.equal(JSON.parse(stringify))
    })

    cy.wait(['@getContractor'])
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/contracts/contractor`)

    // PUT contractor の成功メッセージを確認
    cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('message.accepted'))
    // 「オーダー詳細画面へ」ボタンを押下
    cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
    cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.moveToOrderDetail')).click()
    cy.wait('@getOrder')
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/orders/${this.orderId}`)
    cy.get('[data-cy="notification-dialog-text"]').should('not.exist')
  })

  it('光コラボ住所コードを使って入力する場合', function () {
    cy.visit(`/tenants/${this.tenantId}/contracts/contractor`)
    cy.wait('@getContractor')
    cy.get('[data-cy="contracts-contractor-index-edit-button"]').should('have.text', t('common.edit')).click()
    cy.wait(['@getAvailable', '@getContractor'])

    // 契約者情報の確認は別のパターンで確認済み
    // 契約者情報の入力
    cy.get('[data-cy="contractor-settings-name"]').find('input').clear().type(this.editData.name)
    cy.get('[data-cy="contractor-settings-name-kana"]').find('input').clear().type(this.editData.nameKana)
    cy.get('[data-cy="contractor-settings-pic-name"]').find('input').clear().type(this.editData.picName)
    cy.get('[data-cy="contractor-settings-pic-name-kana"]').find('input').clear().type(this.editData.picNameKana)
    cy.get('[data-cy="contractor-settings-house-number"]').find('input').clear().type(this.editData.houseNumber)
    cy.get('[data-cy="contractor-settings-building-name"]').find('input').clear().type(this.editData.buildingName)
    cy.get('[data-cy="contractor-settings-address-kana"]').find('input').clear().type(this.editData.addressKana)
    cy.get('[data-cy="contractor-settings-phone-number"]').find('input').clear().type(this.editData.phoneNumber)
    cy.get('[data-cy="contractor-settings-address-code"]')
      .find('[data-cy="edit-address-code-register-address-code-button"]')
      .click()
    cy.get('[data-cy="search-address-building-type"]').find(`.label.${this.searchAddress.buildingType}`).click()
    cy.get('[data-cy="search-address-postal-code"]').find('input').type(this.searchAddress.postalCode)
    cy.get('[data-cy="search-address-postal-code"]').find('.submit-button').click()
    cy.wait('@postSearchAddress')
    cy.get('.dialog-base-submit-button').click()

    // 住所検索で取得した値の反映を確認する
    const address = [
      this.searchAddress?.prefecture,
      this.searchAddress?.municipalityList,
      this.searchAddress?.largerSectionList,
      this.searchAddress?.sectionList,
    ]
      .flat()
      .join('')
    cy.get('[data-cy="contractor-settings-address-code"]')
      .find('input')
      .should('have.value', this.searchAddress.addressCode)
      .should('be.disabled')
    cy.get('[data-cy="contractor-settings-postal-code"]')
      .find('input')
      .should('have.value', this.searchAddress.postalCode)
      .should('be.disabled')
    cy.get('[data-cy="contractor-settings-address"]').find('input').should('have.value', address).should('be.disabled')

    // 確認ボタン
    cy.get('[data-cy="contractor-settings-submit-button"]').should('have.text', t('common.confirm')).click()
    // 確認画面の確認は別のパターンで確認済み
    // 保存ボタン
    cy.get('[data-cy="contractor-settings-submit-button"]').should('have.text', t('common.save')).click()
    // PUT contractor のリクエスト情報を確認
    cy.wait('@putContractor').then(req => {
      const stringify = JSON.stringify({
        ...this.editData,
        addressCode: this.searchAddress.addressCode,
        postalCode: this.searchAddress.postalCode,
        address,
      })
      expect(req.request.url).to.include('ztgict/v1/settings/contractor')
      expect(req.request.body).to.deep.equal(JSON.parse(stringify))
    })
    cy.wait(['@getContractor'])
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/contracts/contractor`)

    // PUT contractor の成功メッセージを確認
    cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('message.accepted'))
    cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
    cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.moveToOrderDetail'))
    // ダイアログの閉じるボタンを押す
    cy.get('.dialog-card-close').click()
    cy.get('[data-cy="notification-dialog-text"]').should('not.exist')
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/contracts/contractor`)
  })
})
