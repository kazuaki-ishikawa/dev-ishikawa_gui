import { FletsOrderTypes } from '@app/api/ipoes/constants'
import { generateRandomHex, t, OUTSIDE_APPLICATION_RESTRICTION_AT } from '@cypress/support/utils'

describe('光回線一括提供型新設 廃止', () => {
  beforeEach(function () {
    // 工事日予約の基準日を inputReserveDateAndSubmit と揃える(期間限定の申込規制の終了後に削除する)
    cy.clock(new Date(OUTSIDE_APPLICATION_RESTRICTION_AT), ['Date'])
    this.tenantId = generateRandomHex(32)
    this.ipoeId = generateRandomHex(32)

    cy.fixture('ipoes/new/delete.json').then(data => {
      this.deleteKitTrue = { collectType: 'kit', kitSendInstallAddressSame: true }
      this.deleteKitFalse = {
        collectType: 'kit',
        kitSendInstallAddressSame: false,
        kitSendAddress: data.kitSendAddress,
      }
      this.deleteVisit = data.visit
      this.reserveDate = data.reserveDate
    })
    cy.fixture('ipoes/new/detail.json').then(detail => {
      this.detail = detail
    })
    cy.fixture('ipoes/search-address.json').then(searchAddress => {
      this.searchAddress = searchAddress
    })

    cy.intercept('GET', '**/ztgict/v1/settings/contractor', { fixture: 'contractor/detail' })
    cy.intercept('GET', '**/ztgict/v1/ipoe/hikari-collabo-util/available', { body: { available: true } }).as(
      'getAvailable',
    )
    cy.intercept('POST', '**/ztgict/v1/ipoe/hikari-collabo-util/search-address', {
      fixture: 'ipoes/search-address',
    }).as('postSearchAddress')
    cy.intercept('GET', `**/ztgict/v1/ipoe?ipoeId=${this.ipoeId}&limit=1`, {
      body: { ipoes: [{ ref: `/v1/ipoe/hikari-collabo/${this.ipoeId}` }] },
    }).as('getIpoeContractType')
  })

  it('collectType:visit の場合、訪問日再予約あり（fletsOrderType: new）', function () {
    // リクエストをモック
    const fletsOrderType = FletsOrderTypes.New
    cy.intercept('GET', '**/ztgict/v1/ipoe/hikari-collabo/*', {
      body: { ...this.detail, fletsOrderType },
    }).as('getHikariCollaboNew')
    cy.intercept('DELETE', `**/ztgict/v1/ipoe/hikari-collabo/${this.ipoeId}`, {
      body: { ...this.detail, fletsOrderType },
    }).as('deleteHikariCollaboNew')

    cy.visit(`/tenants/${this.tenantId}/ipoes/${this.ipoeId}`)
    cy.wait(['@getAvailable', '@getIpoeContractType', '@getHikariCollaboNew'])
    // 廃止画面に遷移
    cy.get('[data-cy="ipoes-id-index-delete-button"]').click()
    cy.wait(['@getHikariCollaboNew'])

    // collectType
    cy.inputSelectForm({
      selector: '[data-cy="ipoes-id-remove-collect-type"]',
      value: t(`ipoes.${this.deleteVisit.collectType}`),
    })

    // 確認
    cy.get('[data-cy="ipoes-id-remove-cancel-button"]').should('have.text', t('common.cancel'))
    cy.get('[data-cy="ipoes-id-remove-submit-button"]').should('have.text', t('common.confirm')).click()
    // 廃止申し込み
    cy.get('[data-cy="ipoes-id-remove-cancel-button"]').should('have.text', t('common.return'))
    cy.get('[data-cy="ipoes-id-remove-submit-button"]').should('have.text', t('common.abolition')).click()

    cy.wait('@deleteHikariCollaboNew').then(req => {
      expect(req.request.body).to.deep.equal(this.deleteVisit)
    })

    // エラーメッセージは最初は非表示
    cy.get('[data-cy="reserve-date-dialog-reserve-construction-date-error"]').should('not.exist')
    // 訪問日予約用ダイアログの表示 403 エラーを起こす
    cy.inputReserveDateAndSubmit({ inputData: this.reserveDate, errorCode: 403 })
    // 訪問日予約用ダイアログが再表示される
    cy.get('[data-cy="reserve-date-dialog-reserve-construction-date-error"]').should('exist')
    cy.inputReserveDateAndSubmit({ inputData: this.reserveDate, retry: true })

    // 訪問日予約用ダイアログを閉じる
    cy.get('.dialog-base-submit-button').should('have.text', t('common.close')).click()

    // ダイアログが閉じたことを確認
    cy.get('.dialog-main').should('not.exist')
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/ipoes/${this.ipoeId}`)
  })

  it('collectType:kit かつ kitSendInstallAddressSame:true の場合（fletsOrderType: diversion）', function () {
    // リクエストをモック
    const fletsOrderType = FletsOrderTypes.Diversion
    cy.intercept('GET', '**/ztgict/v1/ipoe/hikari-collabo/*', {
      body: { ...this.detail, fletsOrderType },
    }).as('getHikariCollaboNew')
    cy.intercept('DELETE', `**/ztgict/v1/ipoe/hikari-collabo/${this.ipoeId}`, {
      body: { ...this.detail, fletsOrderType },
    }).as('deleteHikariCollaboNew')

    cy.visit(`/tenants/${this.tenantId}/ipoes/${this.ipoeId}`)
    cy.wait(['@getAvailable', '@getIpoeContractType', '@getHikariCollaboNew'])
    // 廃止画面に遷移
    cy.get('[data-cy="ipoes-id-index-delete-button"]').click()
    cy.wait(['@getHikariCollaboNew'])

    // collectType
    cy.inputSelectForm({
      selector: '[data-cy="ipoes-id-remove-collect-type"]',
      value: t(`ipoes.${this.deleteKitTrue.collectType}`),
    })
    // kitSendInstallAddressSame
    cy.get('[data-cy="ipoes-id-remove-kit-send-install-address-same"]')
      .find(`.label.${this.deleteKitTrue.kitSendInstallAddressSame}`)
      .click()

    // 確認
    cy.get('[data-cy="ipoes-id-remove-submit-button"]').should('have.text', t('common.confirm')).click()
    // 廃止申し込み
    cy.get('[data-cy="ipoes-id-remove-submit-button"]').should('have.text', t('common.abolition')).click()
    cy.wait('@deleteHikariCollaboNew').then(req => {
      expect(req.request.body).to.deep.equal(this.deleteKitTrue)
    })

    cy.wait(['@getIpoeContractType', '@getHikariCollaboNew'])
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/ipoes/${this.ipoeId}`)

    // DELETE ipoe/hikari-collabo の成功メッセージを確認
    cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('message.deleted'))
    cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
    cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.close')).click()
    cy.get('[data-cy="notification-dialog-text"]').should('not.exist')
  })

  it('collectType:kit かつ kitSendInstallAddressSame:false の場合（fletsOrderType: migrate）', function () {
    // リクエストをモック
    const fletsOrderType = FletsOrderTypes.Migrate
    cy.intercept('GET', '**/ztgict/v1/ipoe/hikari-collabo/*', {
      body: { ...this.detail, fletsOrderType },
    }).as('getHikariCollaboNew')
    cy.intercept('DELETE', `**/ztgict/v1/ipoe/hikari-collabo/${this.ipoeId}`, {
      body: { ...this.detail, fletsOrderType },
    }).as('deleteHikariCollaboNew')

    cy.visit(`/tenants/${this.tenantId}/ipoes/${this.ipoeId}`)
    cy.wait(['@getAvailable', '@getIpoeContractType', '@getHikariCollaboNew'])
    // 廃止画面に遷移
    cy.get('[data-cy="ipoes-id-index-delete-button"]').click()
    cy.wait(['@getHikariCollaboNew'])

    // collectType
    cy.inputSelectForm({
      selector: '[data-cy="ipoes-id-remove-collect-type"]',
      value: t(`ipoes.${this.deleteKitFalse.collectType}`),
    })
    // kitSendInstallAddressSame
    cy.get('[data-cy="ipoes-id-remove-kit-send-install-address-same"]')
      .find(`.label.${this.deleteKitFalse.kitSendInstallAddressSame}`)
      .click()

    // companyName
    cy.get('[data-cy="ipoes-id-remove-kit-send-address-company-name"]')
      .find('input')
      .type(this.deleteKitFalse.kitSendAddress.companyName)
    // personName
    cy.get('[data-cy="ipoes-id-remove-kit-send-address-person-name"]')
      .find('input')
      .type(this.deleteKitFalse.kitSendAddress.personName)

    // addressCode
    cy.get('[data-cy="ipoes-id-remove-search-address-button"]').click()
    cy.get('[data-cy="search-address-building-type"]').find(`.label.${this.searchAddress.buildingType}`).click()
    cy.get('[data-cy="search-address-postal-code"]').find('input').type(this.searchAddress.postalCode)
    cy.get('[data-cy="search-address-postal-code"]').find('.submit-button').click()
    cy.wait('@postSearchAddress')
    cy.wait(500)
    cy.get('.dialog-base-submit-button').click()
    // 住所作成
    const address = [
      this.searchAddress?.prefecture,
      this.searchAddress?.municipalityList,
      this.searchAddress?.largerSectionList,
      this.searchAddress?.sectionList,
    ]
      .flat()
      .join('')
    // addressCodeの入力内容が反映されていることを確認
    cy.get('[data-cy="ipoes-id-remove-kit-send-address-address-code"]')
      .find('input')
      .should('be.disabled')
      .should('have.value', this.searchAddress.addressCode)
    cy.get('[data-cy="ipoes-id-remove-kit-send-address-address"]')
      .find('input')
      .should('be.disabled')
      .should('have.value', address)

    // houseNumber
    cy.get('[data-cy="ipoes-id-remove-kit-send-address-house-number"]')
      .find('input')
      .type(this.deleteKitFalse.kitSendAddress.houseNumber)
    // buildingName
    cy.get('[data-cy="ipoes-id-remove-kit-send-address-building-name"]')
      .find('input')
      .type(this.deleteKitFalse.kitSendAddress.buildingName)

    // 確認
    cy.get('[data-cy="ipoes-id-remove-submit-button"]').should('have.text', t('common.confirm')).click()
    // 廃止申し込み
    cy.get('[data-cy="ipoes-id-remove-submit-button"]').should('have.text', t('common.abolition')).click()
    cy.wait('@deleteHikariCollaboNew').then(req => {
      const stringify = JSON.stringify({
        ...this.deleteKitFalse,
        kitSendAddress: {
          ...this.deleteKitFalse.kitSendAddress,
          addressCode: this.searchAddress.addressCode,
          address,
        },
      })
      expect(req.request.body).to.deep.equal(JSON.parse(stringify))
    })

    cy.wait(['@getIpoeContractType', '@getHikariCollaboNew'])
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/ipoes/${this.ipoeId}`)

    // DELETE ipoe/hikari-collabo の成功メッセージを確認
    cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('message.deleted'))
    cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
    cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.close')).click()
    cy.get('[data-cy="notification-dialog-text"]').should('not.exist')
  })
})
