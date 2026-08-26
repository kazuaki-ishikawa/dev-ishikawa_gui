// テスト用なので実装の手間を考えて any を許容する
/* eslint-disable @typescript-eslint/no-explicit-any */

import { generateRandomHex, t, outsideApplicationRestrictionAt } from '@cypress/support/utils'
import { DocumentServiceTypes, DocumentTypes } from '@app/api/constants'
import { SearchAddressResponseListKeys } from '@app/api/iwanUtil/constants'

function checkInitialViews(this: any, stepNumber?: number) {
  // hasQuery = false のときは query.stepがつかない
  const query = stepNumber ? `?step=${stepNumber}` : ''
  cy.url().should(
    'eq',
    `${Cypress.config().baseUrl}/tenants/${this.tenantId}/guarantees/address-registration-request${query}`,
  )

  // ダイアログが閉じられていること
  cy.get('.dialog-main').should('not.exist')

  // 確認ボタンが非活性になっていること
  cy.get('[data-cy="address-registration-request-submit-button"]')
    .should('have.text', t('common.confirm'))
    .should('be.disabled')
  // 入力欄が全て空の状態
  cy.get('[data-cy="guarantee-search-address-postal-code"]').find('input').should('have.value', '')
  cy.get('[data-cy="guarantee-search-address-postal-code"]').find('.submit-button').should('be.disabled')
  cy.get('[data-cy="guarantee-search-address-address"]').should('not.exist')
  cy.get('[data-cy="guarantee-search-address-selector"]').find('button').should('have.length', 0)
  cy.get('[data-cy="address-registration-request-section"]').find('input').should('have.value', '')
  cy.get('[data-cy="address-registration-request-house-number-1"]').find('input').should('have.value', '')
  cy.get('[data-cy="address-registration-request-house-number-2"]').find('input').should('have.value', '')
  cy.get('[data-cy="address-registration-request-house-number-3"]').find('input').should('have.value', '')
  cy.get('[data-cy="address-registration-request-building-name-1"]').find('input').should('have.value', '')
  cy.get('[data-cy="address-registration-request-building-name-2"]').find('input').should('have.value', '')
  cy.get('[data-cy="address-registration-request-building-name-3"]').find('input').should('have.value', '')
  cy.get('[data-cy="address-registration-request-latitude"]').find('input').should('have.value', '')
  cy.get('[data-cy="address-registration-request-longitude"]').find('input').should('have.value', '')
  cy.get('[data-cy="address-registration-request-map-document-id"]')
    .find('[data-cy="file-upload-display-text"]')
    .should('have.text', '')
  cy.get('[data-cy="address-registration-request-company-name"]').find('input').should('have.value', '')
  cy.get('[data-cy="address-registration-request-person-name"]').find('input').should('have.value', '')
  cy.get('[data-cy="address-registration-request-phone-number"]').find('input').should('have.value', '')
}

function inputRequestData(this: any, address?: string) {
  // 字・丁目の入力
  if (this.create?.section) {
    cy.get('[data-cy="guarantee-search-address-selector"]').should('not.exist')
    cy.inputSelectForm({
      selector: '[data-cy="address-registration-request-section"]',
      value: this.create.section,
    })
  }
  if (this.create?.houseNumber1) {
    // 番地・号１の入力
    cy.get('[data-cy="address-registration-request-house-number-1"]').find('input').type(this.create.houseNumber1)
  }
  if (this.create?.houseNumber2) {
    // 番地・号２の入力
    cy.get('[data-cy="address-registration-request-house-number-2"]').find('input').type(this.create.houseNumber2)
  }
  if (this.create?.houseNumber3) {
    // 番地・号３の入力
    cy.get('[data-cy="address-registration-request-house-number-3"]').find('input').type(this.create.houseNumber3)
  }
  if (this.create?.buildingName1) {
    // 建物名１の入力
    cy.get('[data-cy="address-registration-request-building-name-1"]').find('input').type(this.create.buildingName1)
  }
  if (this.create?.buildingName2) {
    // 建物名２の入力
    cy.get('[data-cy="address-registration-request-building-name-2"]').find('input').type(this.create.buildingName2)
  }
  if (this.create?.buildingName3) {
    // 建物名３の入力
    cy.get('[data-cy="address-registration-request-building-name-3"]').find('input').type(this.create.buildingName3)
  }

  // 選択中住所に largeSection 以降追加されないこと
  cy.get('[data-cy="guarantee-search-address-address"]').should(
    'contain',
    address ?? `${this.create.prefecture}${this.create.municipality}${this.create.largerSection}`,
  )

  // 座標情報（緯度）の入力
  cy.get('[data-cy="address-registration-request-latitude"]').find('input').type(this.create.latitude)
  // 座標情報（経度）の入力
  cy.get('[data-cy="address-registration-request-longitude"]').find('input').type(this.create.longitude)
  // 地図情報ファイル
  cy.pngFileUpload({
    className: '[data-cy="address-registration-request-map-document-id"]',
    aliasName: '@postUploadDocument',
    documentId: this.uploadDocumentId,
    type: DocumentTypes.MapDocument,
    service: DocumentServiceTypes.Guarantee,
  })
  // 事業所名の入力
  cy.get('[data-cy="address-registration-request-company-name"]').find('input').type(this.create.companyName)
  // 担当者氏名の入力
  cy.get('[data-cy="address-registration-request-person-name"]').find('input').type(this.create.personName)
  // 担当者電話番号の入力
  cy.get('[data-cy="address-registration-request-phone-number"]').find('input').type(this.create.phoneNumber)
}

function getAddress(data: { prefecture: string; municipalityList: string[]; largerSectionList: string[] }) {
  return `${data.prefecture}${data.municipalityList[0]}${data.largerSectionList[0]}`
}

describe('設置場所住所登録依頼画面', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)

    cy.fixture('guarantees/address-registration-request/create').then(create => {
      this.create = create
    })
    cy.fixture('upload-document.json').then(data => {
      this.uploadDocumentId = data.documentId
    })

    cy.intercept('GET', '**/ztgict/v1/settings/guarantee', {
      body: { termsOfServiceAccepted: true },
    }).as('getGuaranteeTermsOfServiceAccepted')
    cy.intercept('GET', '**/ztgict/v1/settings/guarantee/terms-of-service', {
      fixture: 'guarantees/circuits/terms-of-service',
    }).as('getGuaranteeTermsOfService')
    cy.intercept('GET', '**/ztgict/v1/download-terms-of-service*', {
      fixture: 'guarantees/circuits/guarantee-download-terms-of-service',
    }).as('getDownloadGuaranteeMonitoringTermsOfService')

    cy.intercept('GET', '**/ztgict/v1/resource-summary/guarantees?limit=1000*', {
      fixture: 'guarantees/circuits/list',
    }).as('getResourceSummaryGuaranteeList')
    cy.intercept('GET', '**/ztgict/v1/resource-summary/terminals?limit=1000*', { fixture: 'terminals/list' }).as(
      'getTerminalList',
    )
    cy.intercept('GET', '**/ztgict/v1/guarantees*', {
      fixture: 'guarantees/circuits/list',
    }).as('getGuaranteeList')
    cy.intercept('POST', '**/ztgict/v1/iwan-util/judge', { fixture: 'guarantees/circuits/judge' }).as('postJudge')
    cy.intercept('POST', '**/ztgict/v1/upload-document', { fixture: 'upload-document' }).as('postUploadDocument')

    cy.intercept('POST', '**/ztgict/v1/iwan-util/registration-address', {
      fixture: 'guarantees/address-registration-request/registration-address',
    }).as('postRequest')
    cy.intercept('GET', '**/ztgict/v1/orders/*', { response: { statusCode: 200 } }).as('getOrder')
  })

  context('初期値が入っていないパターン', function () {
    beforeEach(function () {
      // 確認ボタンが押せるように時間固定
      cy.clock(outsideApplicationRestrictionAt(9, 0, 0, 0), ['Date'])
    })
    it('正常系入力テスト', function () {
      cy.visit(`tenants/${this.tenantId}/guarantees/address-registration-request`)
      cy.wait([
        '@getGuaranteeTermsOfServiceAccepted',
        '@getGuaranteeTermsOfService',
        '@getDownloadGuaranteeMonitoringTermsOfService',
      ])

      // 字・丁目欄の次の候補を表示ボタンが非表示なこと
      cy.get('[data-cy="address-registration-request-section-next-request-button"]').should('not.exist')
      // 確認ボタンが非活性になっていること
      cy.get('[data-cy="address-registration-request-submit-button"]')
        .should('have.text', t('common.confirm'))
        .should('be.disabled')

      // 住所検索１回目
      cy.intercept('POST', '**/ztgict/v1/iwan-util/search-address', {
        fixture: 'guarantees/circuits/search-address-1',
      }).as('postSearchAddress')
      cy.get('[data-cy="guarantee-search-address-postal-code"]').find('input').type(this.create.postalCode)
      cy.get('[data-cy="guarantee-search-address-postal-code"]').find('.submit-button').click()
      cy.wait('@postSearchAddress')
      cy.get('[data-cy="guarantee-search-address-address"]').should('contain', `${this.create.prefecture}`)
      // 字・丁目欄の次の候補を表示ボタンが非表示なこと
      cy.get('[data-cy="address-registration-request-section-next-request-button"]').should('not.exist')

      // 住所検索２回目
      cy.intercept('POST', '**/ztgict/v1/iwan-util/search-address', {
        fixture: 'guarantees/circuits/search-address-2',
      }).as('postSearchAddress')
      cy.get('[data-cy="guarantee-search-address-selector"]').contains(this.create.municipality).click()
      cy.wait('@postSearchAddress')
      cy.get('[data-cy="guarantee-search-address-address"]').should(
        'contain',
        `${this.create.prefecture}${this.create.municipality}`,
      )
      // 字・丁目欄の次の候補を表示ボタンが非表示なこと
      cy.get('[data-cy="address-registration-request-section-next-request-button"]').should('not.exist')

      // 住所検索３回目
      cy.intercept('POST', '**/ztgict/v1/iwan-util/search-address', {
        fixture: 'guarantees/circuits/search-address-3',
      }).as('postSearchAddress')
      cy.get('[data-cy="guarantee-search-address-selector"]').contains(this.create.largerSection).click()
      cy.wait('@postSearchAddress')
      cy.get('[data-cy="guarantee-search-address-address"]').should(
        'contain',
        `${this.create.prefecture}${this.create.municipality}${this.create.largerSection}`,
      )
      // 字・丁目欄の次の候補を表示ボタンが表示されること
      cy.get('[data-cy="address-registration-request-section-next-request-button"]').should('be.disabled')

      // 入力
      inputRequestData.call(this)

      // 確認ボタン押下
      cy.get('[data-cy="address-registration-request-submit-button"]').should('not.be.disabled').click()

      // 確認画面
      cy.get('[data-cy="guarantee-search-address-postal-code"]')
        .find('input')
        .should('be.disabled')
        .should('have.value', this.create.postalCode)
      cy.get('[data-cy="guarantee-search-address-postal-code"]').find('.submit-button').should('be.disabled')
      cy.get('[data-cy="address-registration-request-section"]')
        .find('input')
        .should('be.disabled')
        .should('have.value', this.create.section)
      cy.get('[data-cy="address-registration-request-house-number-1"]')
        .find('input')
        .should('be.disabled')
        .should('have.value', this.create.houseNumber1)
      cy.get('[data-cy="address-registration-request-house-number-2"]')
        .find('input')
        .should('be.disabled')
        .should('have.value', this.create.houseNumber2)
      cy.get('[data-cy="address-registration-request-house-number-3"]')
        .find('input')
        .should('be.disabled')
        .should('have.value', this.create.houseNumber3)
      cy.get('[data-cy="address-registration-request-building-name-1"]')
        .find('input')
        .should('be.disabled')
        .should('have.value', this.create.buildingName1)
      cy.get('[data-cy="address-registration-request-building-name-2"]')
        .find('input')
        .should('be.disabled')
        .should('have.value', this.create.buildingName2)
      cy.get('[data-cy="address-registration-request-building-name-3"]')
        .find('input')
        .should('be.disabled')
        .should('have.value', this.create.buildingName3)
      cy.get('[data-cy="address-registration-request-latitude"]')
        .find('input')
        .should('be.disabled')
        .should('have.value', this.create.latitude)
      cy.get('[data-cy="address-registration-request-longitude"]')
        .find('input')
        .should('be.disabled')
        .should('have.value', this.create.longitude)
      cy.get('[data-cy="address-registration-request-map-document-id"]')
        .find('[data-cy="file-upload-display-text"]')
        .should('have.text', this.uploadDocumentId)
      cy.get('[data-cy="address-registration-request-company-name"]')
        .find('input')
        .should('be.disabled')
        .should('have.value', this.create.companyName)
      cy.get('[data-cy="address-registration-request-person-name"]')
        .find('input')
        .should('be.disabled')
        .should('have.value', this.create.personName)
      cy.get('[data-cy="address-registration-request-phone-number"]')
        .find('input')
        .should('be.disabled')
        .should('have.value', this.create.phoneNumber)

      // 住所登録依頼ボタン押下
      cy.get('[data-cy="address-registration-request-submit-button"]')
        .should('have.text', t('addressRegistrationRequest.submit'))
        .click()
      cy.wait('@postRequest').then(req => {
        const stringify = JSON.stringify({ ...this.create, mapDocumentId: this.uploadDocumentId })
        expect(req.request.body).to.deep.equal(JSON.parse(stringify))
      })
      // ダイアログ確認
      cy.get('[data-cy="notification-dialog-text"]').should('contain', t('addressRegistrationRequest.createdMessage'))
      cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
      cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.moveToOrderDetail')).click()
      cy.get('[data-cy="notification-dialog-text"]').should('not.exist')

      // オーダー詳細画面に遷移する
      cy.wait('@getOrder')
      cy.url().should(
        'eq',
        `${Cypress.config().baseUrl}/tenants/${this.tenantId}/orders/550e8400e29b41d4a716446655440000`,
      )
      // オーダー詳細画面の戻るボタンを押して住所登録依頼画面に戻る
      cy.get('[data-cy="orders-id-index-return-button"]').should('have.text', t('common.return')).click()
      // 入力欄が初期状態になってることを確認する
      checkInitialViews.call(this)
    })

    it('１回目の住所検索で「建物名２」まで埋まる場合(「番地・号２」と「建物名１」は null)の正常系', function () {
      delete this.create.section
      delete this.create.houseNumber1
      delete this.create.houseNumber2
      delete this.create.houseNumber3
      delete this.create.buildingName1
      delete this.create.buildingName2

      cy.fixture('guarantees/circuits/search-address-10').then(data => {
        cy.intercept('POST', '**/ztgict/v1/iwan-util/search-address', {
          body: { ...data, nextRequestNumber: generateRandomHex(32) },
        }).as('postSearchAddress')
        cy.visit(`tenants/${this.tenantId}/guarantees/address-registration-request`)
        cy.wait([
          '@getGuaranteeTermsOfServiceAccepted',
          '@getGuaranteeTermsOfService',
          '@getDownloadGuaranteeMonitoringTermsOfService',
        ])

        cy.get('[data-cy="guarantee-search-address-postal-code"]').find('input').type(data.postalCode)
        cy.get('[data-cy="guarantee-search-address-postal-code"]').find('.submit-button').click()
        cy.wait('@postSearchAddress')

        // 表示項目
        const address = getAddress(data)
        cy.get('[data-cy="guarantee-search-address-postal-code"]').find('input').should('have.value', data.postalCode)
        cy.get('[data-cy="guarantee-search-address-address"]').should('have.text', address)
        cy.get('[data-cy="guarantee-search-address-selector"]').should('not.exist')
        cy.get('[data-cy="address-registration-request-section"]')
          .find('input')
          .should('have.value', data.sectionList[0])
        cy.get('[data-cy="address-registration-request-house-number-1"]')
          .find('input')
          .should('have.value', data.houseNumber1List[0])
        cy.get('[data-cy="address-registration-request-house-number-2"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-house-number-3"]')
          .find('input')
          .should('have.value', data.houseNumber3List[0])
        cy.get('[data-cy="address-registration-request-building-name-1"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-building-name-2"]')
          .find('input')
          .should('have.value', data.buildingName2List[0])
        cy.get('[data-cy="address-registration-request-building-name-3"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-latitude"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-longitude"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-map-document-id"]')
          .find('[data-cy="file-upload-display-text"]')
          .should('have.text', '')
        cy.get('[data-cy="address-registration-request-company-name"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-person-name"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-phone-number"]').find('input').should('have.value', '')

        // 字・丁目欄の次の候補を表示ボタンが非表示
        cy.get('[data-cy="address-registration-request-section-next-request-button"]').should('not.exist')
        // 入力
        inputRequestData.call(this, address)
        // 確認ボタン押下
        cy.get('[data-cy="address-registration-request-submit-button"]').click()

        // 確認画面
        cy.get('[data-cy="guarantee-search-address-postal-code"]')
          .find('input')
          .should('be.disabled')
          .should('have.value', data.postalCode)
        cy.get('[data-cy="guarantee-search-address-postal-code"]').find('.submit-button').should('be.disabled')
        cy.get('[data-cy="address-registration-request-section"]')
          .find('input')
          .should('be.disabled')
          .should('have.value', data.sectionList[0])
        cy.get('[data-cy="address-registration-request-house-number-1"]')
          .find('input')
          .should('be.disabled')
          .should('have.value', data.houseNumber1List[0])
        cy.get('[data-cy="address-registration-request-house-number-2"]')
          .find('input')
          .should('be.disabled')
          .should('have.value', '')
        cy.get('[data-cy="address-registration-request-house-number-3"]')
          .find('input')
          .should('be.disabled')
          .should('have.value', data.houseNumber3List[0])
        cy.get('[data-cy="address-registration-request-building-name-1"]')
          .find('input')
          .should('be.disabled')
          .should('have.value', '')
        cy.get('[data-cy="address-registration-request-building-name-2"]')
          .find('input')
          .should('be.disabled')
          .should('have.value', data.buildingName2List[0])
        cy.get('[data-cy="address-registration-request-building-name-3"]')
          .find('input')
          .should('be.disabled')
          .should('have.value', this.create.buildingName3)
        cy.get('[data-cy="address-registration-request-latitude"]')
          .find('input')
          .should('be.disabled')
          .should('have.value', this.create.latitude)
        cy.get('[data-cy="address-registration-request-longitude"]')
          .find('input')
          .should('be.disabled')
          .should('have.value', this.create.longitude)
        cy.get('[data-cy="address-registration-request-map-document-id"]')
          .find('[data-cy="file-upload-display-text"]')
          .should('have.text', this.uploadDocumentId)
        cy.get('[data-cy="address-registration-request-company-name"]')
          .find('input')
          .should('be.disabled')
          .should('have.value', this.create.companyName)
        cy.get('[data-cy="address-registration-request-person-name"]')
          .find('input')
          .should('be.disabled')
          .should('have.value', this.create.personName)
        cy.get('[data-cy="address-registration-request-phone-number"]')
          .find('input')
          .should('be.disabled')
          .should('have.value', this.create.phoneNumber)

        // 住所登録依頼ボタン押下
        cy.get('[data-cy="address-registration-request-submit-button"]').click()
        cy.wait('@postRequest').then(req => {
          const stringify = JSON.stringify({
            ...this.create,
            prefecture: data.prefecture,
            municipality: data.municipalityList[0],
            largerSection: data.largerSectionList[0],
            section: data.sectionList[0],
            houseNumber1: data.houseNumber1List[0],
            houseNumber2: undefined,
            houseNumber3: data.houseNumber3List[0],
            buildingName1: undefined,
            buildingName2: data.buildingName2List[0],
            mapDocumentId: this.uploadDocumentId,
          })
          expect(req.request.body).to.deep.equal(JSON.parse(stringify))
        })
        // ダイアログを閉じる
        cy.get('.dialog-card-close').click()
        cy.get('.dialog-main').should('not.exist')

        // 入力欄が初期状態になってることを確認する
        checkInitialViews.call(this)
      })
    })

    it('１回目の住所検索で installationPlaceCode が返ってくる場合の正常系', function () {
      delete this.create.section
      delete this.create.houseNumber1
      delete this.create.houseNumber2
      delete this.create.houseNumber3
      delete this.create.buildingName1
      delete this.create.buildingName2
      delete this.create.buildingName3

      cy.fixture('guarantees/circuits/search-address').then(data => {
        cy.intercept('POST', '**/ztgict/v1/iwan-util/search-address', data).as('postSearchAddress')
        cy.visit(`tenants/${this.tenantId}/guarantees/address-registration-request`)
        cy.wait([
          '@getGuaranteeTermsOfServiceAccepted',
          '@getGuaranteeTermsOfService',
          '@getDownloadGuaranteeMonitoringTermsOfService',
        ])

        cy.get('[data-cy="guarantee-search-address-postal-code"]').find('input').type(data.postalCode)
        cy.get('[data-cy="guarantee-search-address-postal-code"]').find('.submit-button').click()
        cy.wait('@postSearchAddress')

        // 表示項目
        const address = getAddress(data)
        cy.get('[data-cy="guarantee-search-address-postal-code"]').find('input').should('have.value', data.postalCode)
        cy.get('[data-cy="guarantee-search-address-address"]').should('have.text', address)
        cy.get('[data-cy="guarantee-search-address-selector"]').should('not.exist')
        cy.get('[data-cy="address-registration-request-section"]')
          .find('input')
          .should('have.value', data.sectionList[0])
        cy.get('[data-cy="address-registration-request-house-number-1"]')
          .find('input')
          .should('have.value', data.houseNumber1List[0])
        cy.get('[data-cy="address-registration-request-house-number-2"]')
          .find('input')
          .should('have.value', data.houseNumber2List[0])
        cy.get('[data-cy="address-registration-request-house-number-3"]')
          .find('input')
          .should('have.value', data.houseNumber3List[0])
        cy.get('[data-cy="address-registration-request-building-name-1"]')
          .find('input')
          .should('have.value', data.buildingName1List[0])
        cy.get('[data-cy="address-registration-request-building-name-2"]')
          .find('input')
          .should('have.value', data.buildingName2List[0])
        cy.get('[data-cy="address-registration-request-building-name-3"]')
          .find('input')
          .should('have.value', data.buildingName3List[0])
        cy.get('[data-cy="address-registration-request-latitude"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-longitude"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-map-document-id"]')
          .find('[data-cy="file-upload-display-text"]')
          .should('have.text', '')
        cy.get('[data-cy="address-registration-request-company-name"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-person-name"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-phone-number"]').find('input').should('have.value', '')

        // 入力
        inputRequestData.call(this, address)
        // 確認ボタン押下
        cy.get('[data-cy="address-registration-request-submit-button"]').click()

        // 確認画面
        cy.get('[data-cy="guarantee-search-address-postal-code"]')
          .find('input')
          .should('be.disabled')
          .should('have.value', data.postalCode)
        cy.get('[data-cy="guarantee-search-address-postal-code"]').find('.submit-button').should('be.disabled')
        cy.get('[data-cy="address-registration-request-section"]')
          .find('input')
          .should('be.disabled')
          .should('have.value', data.sectionList[0])
        cy.get('[data-cy="address-registration-request-house-number-1"]')
          .find('input')
          .should('be.disabled')
          .should('have.value', data.houseNumber1List[0])
        cy.get('[data-cy="address-registration-request-house-number-2"]')
          .find('input')
          .should('be.disabled')
          .should('have.value', data.houseNumber2List[0])
        cy.get('[data-cy="address-registration-request-house-number-3"]')
          .find('input')
          .should('be.disabled')
          .should('have.value', data.houseNumber3List[0])
        cy.get('[data-cy="address-registration-request-building-name-1"]')
          .find('input')
          .should('be.disabled')
          .should('have.value', data.buildingName1List[0])
        cy.get('[data-cy="address-registration-request-building-name-2"]')
          .find('input')
          .should('be.disabled')
          .should('have.value', data.buildingName2List[0])
        cy.get('[data-cy="address-registration-request-building-name-3"]')
          .find('input')
          .should('be.disabled')
          .should('have.value', data.buildingName3List[0])
        cy.get('[data-cy="address-registration-request-latitude"]')
          .find('input')
          .should('be.disabled')
          .should('have.value', this.create.latitude)
        cy.get('[data-cy="address-registration-request-longitude"]')
          .find('input')
          .should('be.disabled')
          .should('have.value', this.create.longitude)
        cy.get('[data-cy="address-registration-request-map-document-id"]')
          .find('[data-cy="file-upload-display-text"]')
          .should('have.text', this.uploadDocumentId)
        cy.get('[data-cy="address-registration-request-company-name"]')
          .find('input')
          .should('be.disabled')
          .should('have.value', this.create.companyName)
        cy.get('[data-cy="address-registration-request-person-name"]')
          .find('input')
          .should('be.disabled')
          .should('have.value', this.create.personName)
        cy.get('[data-cy="address-registration-request-phone-number"]')
          .find('input')
          .should('be.disabled')
          .should('have.value', this.create.phoneNumber)

        // 住所登録依頼ボタン押下
        cy.get('[data-cy="address-registration-request-submit-button"]').click()
        cy.wait('@postRequest').then(req => {
          const stringify = JSON.stringify({
            ...this.create,
            prefecture: data.prefecture,
            municipality: data.municipalityList[0],
            largerSection: data.largerSectionList[0],
            section: data.sectionList[0],
            houseNumber1: data.houseNumber1List[0],
            houseNumber2: data.houseNumber2List[0],
            houseNumber3: data.houseNumber3List[0],
            buildingName1: data.buildingName1List[0],
            buildingName2: data.buildingName2List[0],
            buildingName3: data.buildingName3List[0],
            mapDocumentId: this.uploadDocumentId,
          })
          expect(req.request.body).to.deep.equal(JSON.parse(stringify))
        })
        // ダイアログを閉じる
        cy.get('.dialog-card-close').click()
        cy.get('.dialog-main').should('not.exist')

        // 入力欄が初期状態になってることを確認する
        checkInitialViews.call(this)
      })
    })

    it('ギャランティアクセス 新規作成画面 の住所検索の途中でサイドバーから遷移した時の初期値を確認', function () {
      cy.intercept('POST', '**/ztgict/v1/iwan-util/search-address', {
        fixture: 'guarantees/circuits/search-address-3',
      }).as('postSearchAddress')

      cy.visit(`tenants/${this.tenantId}/guarantees/circuits/create`)
      cy.wait(['@getGuaranteeTermsOfServiceAccepted', '@getResourceSummaryGuaranteeList'])
      // 住所検索
      cy.get('[data-cy="guarantee-search-address-postal-code"]').find('input').type(this.create.postalCode)
      cy.get('[data-cy="guarantee-search-address-postal-code"]').find('.submit-button').click()
      cy.wait('@postSearchAddress')

      // サイドバーから画面遷移
      cy.window().then(win => {
        cy.stub(win, 'confirm').returns(true)
      })
      cy.get('.sidebar .menu').contains(t('sideBar.guarantee')).click()
      cy.get('.sub-menu-guarantees').find('.box').contains(t('sideBar.addressRegistrationRequest')).click()

      // 初期値が空なことを確認する
      checkInitialViews.call(this)
    })

    it('住所検索してから、ギャランティアクセス 一覧画面に戻って、サイドバーから遷移した時の初期値を確認', function () {
      cy.intercept('POST', '**/ztgict/v1/iwan-util/search-address', {
        fixture: 'guarantees/circuits/search-address',
      }).as('postSearchAddress')

      // 一覧画面から新規作成画面に遷移
      cy.visit(`tenants/${this.tenantId}/guarantees/circuits`)
      cy.wait(['@getResourceSummaryGuaranteeList', '@getGuaranteeList', '@getTerminalList'])
      cy.get('[data-cy="guarantees-circuits-index-create-new-button"]').click()
      cy.wait(['@getGuaranteeTermsOfServiceAccepted', '@getResourceSummaryGuaranteeList'])

      // 住所検索
      cy.get('[data-cy="guarantee-search-address-postal-code"]').find('input').type(this.create.postalCode)
      cy.get('[data-cy="guarantee-search-address-postal-code"]').find('.submit-button').click()
      cy.wait(['@postSearchAddress', '@postJudge'])

      // 一覧画面に戻る
      cy.window().then(win => {
        cy.stub(win, 'confirm').returns(true)
      })
      cy.get('button').contains(t('common.cancel')).click()
      cy.wait(['@getResourceSummaryGuaranteeList', '@getGuaranteeList', '@getTerminalList'])

      // サイドバーから画面遷移
      cy.get('.sidebar .menu').contains(t('sideBar.guarantee')).click()
      cy.get('.sub-menu-guarantees').find('.box').contains(t('sideBar.addressRegistrationRequest')).click()

      // 初期値が空なことを確認する
      checkInitialViews.call(this)
    })

    it('「次の候補を表示」ボタンのテスト', function () {
      const postalCode = '100-0000'
      const nextRequestNumber = generateRandomHex(32)
      const commonBody = {
        postalCode,
        prefecture: '東京都',
        municipalityList: ['新宿区'],
        largerSectionList: ['愛住町', '赤城下町', '赤城元町', '揚場町'],
      }

      // １回目の住所検索
      cy.intercept('POST', '**/ztgict/v1/iwan-util/search-address', {
        body: {
          ...commonBody,
          nextRequestNumber,
        },
      }).as('postSearchAddress')

      cy.visit(`tenants/${this.tenantId}/guarantees/address-registration-request`)
      cy.wait([
        '@getGuaranteeTermsOfServiceAccepted',
        '@getGuaranteeTermsOfService',
        '@getDownloadGuaranteeMonitoringTermsOfService',
      ])

      cy.get('[data-cy="guarantee-search-address-postal-code"]').find('input').type(postalCode)
      cy.get('[data-cy="guarantee-search-address-postal-code"]').find('.submit-button').click()
      cy.wait('@postSearchAddress').then(req => {
        expect(req.request.body).to.deep.equal({ postalCode })
      })

      // 表示項目
      cy.get('[data-cy="guarantee-search-address-larger-section-list-button"]').find('button').should('have.length', 4)
      cy.get('[data-cy="address-registration-request-section-next-request-button"]').should('not.exist')

      // ２回目の住所検索
      cy.intercept('POST', '**/ztgict/v1/iwan-util/search-address', {
        body: {
          ...commonBody,
          largerSectionList: ['市谷加賀町', '市谷甲良町', '市谷砂土原町', '市谷左内町', '市谷鷹匠町'],
        },
      }).as('postSearchAddress')

      // 住所検索の「次の候補を表示」ボタン押下
      cy.get('[data-cy="guarantee-search-address-next-request-button"]').click()
      cy.wait('@postSearchAddress').then(req => {
        expect(req.request.body).to.deep.equal({
          postalCode,
          prefecture: '東京都',
          municipality: '新宿区',
          nextRequestNumber,
        })
      })

      // 表示項目
      cy.get('[data-cy="guarantee-search-address-larger-section-list-button"]').find('button').should('have.length', 9)
      cy.get('[data-cy="address-registration-request-section-next-request-button"]').should('not.exist')
      cy.get('[data-cy="guarantee-search-address-next-request-button"]').should('not.exist')

      // ３回目の住所検索
      cy.intercept('POST', '**/ztgict/v1/iwan-util/search-address', {
        body: {
          ...commonBody,
          largerSectionList: ['愛住町'],
          sectionList: ['１丁目', '２丁目', '３丁目'],
          nextRequestNumber,
        },
      }).as('postSearchAddress')

      // 一つ目の候補[愛住町]を選択
      cy.get('[data-cy="guarantee-search-address-larger-section-list-button"]').find('button').eq(0).click()
      cy.wait('@postSearchAddress').then(req => {
        expect(req.request.body).to.deep.equal({
          postalCode,
          prefecture: '東京都',
          municipality: '新宿区',
          largerSection: '愛住町',
        })
      })

      // 表示項目
      cy.get('[data-cy="guarantee-search-address-selector"]').should('not.exist')
      cy.get('[data-cy="address-registration-request-section"]').within(() => {
        cy.get('input').click()
        cy.get('li').should('have.length', 4)
      })

      // ４回目の住所検索
      cy.intercept('POST', '**/ztgict/v1/iwan-util/search-address', {
        body: {
          ...commonBody,
          largerSectionList: ['愛住町'],
          sectionList: ['４丁目', '５丁目', '６丁目'],
        },
      }).as('postSearchAddress')

      // 字・丁目の「次の候補を表示」ボタン押下
      cy.get('[data-cy="address-registration-request-section-next-request-button"]').click()
      cy.wait('@postSearchAddress').then(req => {
        expect(req.request.body).to.deep.equal({
          postalCode,
          prefecture: '東京都',
          municipality: '新宿区',
          largerSection: '愛住町',
          nextRequestNumber,
        })
      })

      // 表示項目
      cy.get('[data-cy="address-registration-request-section-next-request-button"]').should('be.disabled')
      cy.get('[data-cy="address-registration-request-section"]').within(() => {
        cy.get('input').click()
        cy.get('li').should('have.length', 7).eq(6).click()
        cy.get('input').should('have.value', '６丁目')
      })
    })
  })

  context('初期値が入っているパターン', function () {
    beforeEach(function () {
      // 確認ボタンが押せるように時間固定
      cy.clock(outsideApplicationRestrictionAt(9, 0, 0, 0), ['Date'])
    })
    it('「字・丁目」の選択時にリンクから遷移した時の初期値を確認', function () {
      cy.fixture('guarantees/circuits/search-address-3').then(data => {
        cy.intercept('POST', '**/ztgict/v1/iwan-util/search-address', data).as('postSearchAddress')
        cy.visit(`tenants/${this.tenantId}/guarantees/circuits/create`)
        cy.wait(['@getGuaranteeTermsOfServiceAccepted', '@getResourceSummaryGuaranteeList'])

        // 住所検索
        cy.get('[data-cy="guarantee-search-address-postal-code"]').find('input').type(data.postalCode)
        cy.get('[data-cy="guarantee-search-address-postal-code"]').find('.submit-button').click()
        cy.wait('@postSearchAddress')

        // リンクをクリックして画面遷移
        cy.get('[data-cy="guarantees-circuits-create-search-address-not-found"]').click()
        cy.get('.dialog-base-submit-button').click()
        cy.wait('@postSearchAddress')

        // 初期値
        const address = getAddress(data)
        cy.get('[data-cy="guarantee-search-address-postal-code"]').find('input').should('have.value', data.postalCode)
        cy.get('[data-cy="guarantee-search-address-address"]').should('have.text', address)
        cy.get('[data-cy="guarantee-search-address-selector"]').should('not.exist')
        cy.get('[data-cy="address-registration-request-section"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-house-number-1"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-house-number-2"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-house-number-3"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-building-name-1"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-building-name-2"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-building-name-3"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-latitude"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-longitude"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-map-document-id"]')
          .find('[data-cy="file-upload-display-text"]')
          .should('have.text', '')
        cy.get('[data-cy="address-registration-request-company-name"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-person-name"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-phone-number"]').find('input').should('have.value', '')

        // 入力
        inputRequestData.call(this, address)
        // 確認ボタン押下
        cy.get('[data-cy="address-registration-request-submit-button"]').click()
        // 住所登録依頼ボタン押下
        cy.get('[data-cy="address-registration-request-submit-button"]').click()
        // リクエスト内容を確認
        cy.wait('@postRequest').then(req => {
          const stringify = JSON.stringify({
            ...this.create,
            prefecture: data.prefecture,
            municipality: data.municipalityList[0],
            largerSection: data.largerSectionList[0],
            mapDocumentId: this.uploadDocumentId,
          })
          expect(req.request.body).to.deep.equal(JSON.parse(stringify))
        })
        // ダイアログを閉じる
        cy.get('.dialog-card-close').click()
        cy.get('.dialog-main').should('not.exist')

        // 初期値が空なことを確認する
        checkInitialViews.call(this, SearchAddressResponseListKeys.sectionList)
      })
    })

    it('「番地・号１」の選択時にリンクから遷移した時の初期値を確認', function () {
      delete this.create.section

      cy.fixture('guarantees/circuits/search-address-4').then(data => {
        cy.intercept('POST', '**/ztgict/v1/iwan-util/search-address', data).as('postSearchAddress')

        cy.visit(`tenants/${this.tenantId}/guarantees/circuits/create`)
        cy.wait(['@getGuaranteeTermsOfServiceAccepted', '@getResourceSummaryGuaranteeList'])

        // 住所検索
        cy.get('[data-cy="guarantee-search-address-postal-code"]').find('input').type(data.postalCode)
        cy.get('[data-cy="guarantee-search-address-postal-code"]').find('.submit-button').click()
        cy.wait('@postSearchAddress')

        // リンクをクリックして画面遷移
        cy.get('[data-cy="guarantees-circuits-create-search-address-not-found"]').click()
        cy.get('.dialog-base-submit-button').click()
        cy.wait('@postSearchAddress')

        // 初期値
        const address = getAddress(data)
        cy.get('[data-cy="guarantee-search-address-postal-code"]').find('input').should('have.value', data.postalCode)
        cy.get('[data-cy="guarantee-search-address-address"]').should('contain', address)
        cy.get('[data-cy="guarantee-search-address-selector"]').should('not.exist')
        cy.get('[data-cy="address-registration-request-section"]')
          .find('input')
          .should('have.value', data.sectionList[0])
        cy.get('[data-cy="address-registration-request-house-number-1"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-house-number-2"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-house-number-3"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-building-name-1"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-building-name-2"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-building-name-3"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-latitude"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-longitude"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-map-document-id"]')
          .find('[data-cy="file-upload-display-text"]')
          .should('have.text', '')
        cy.get('[data-cy="address-registration-request-company-name"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-person-name"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-phone-number"]').find('input').should('have.value', '')

        // 入力
        inputRequestData.call(this, address)
        // 確認ボタン押下
        cy.get('[data-cy="address-registration-request-submit-button"]').click()
        // 住所登録依頼ボタン押下
        cy.get('[data-cy="address-registration-request-submit-button"]').click()
        // リクエスト内容を確認
        cy.wait('@postRequest').then(req => {
          const stringify = JSON.stringify({
            ...this.create,
            prefecture: data.prefecture,
            municipality: data.municipalityList[0],
            largerSection: data.largerSectionList[0],
            section: data.sectionList[0],
            mapDocumentId: this.uploadDocumentId,
          })
          expect(req.request.body).to.deep.equal(JSON.parse(stringify))
        })
        // ダイアログを閉じる
        cy.get('.dialog-card-close').click()
        cy.get('.dialog-main').should('not.exist')

        // 初期値が空なことを確認する
        checkInitialViews.call(this, SearchAddressResponseListKeys.houseNumber1List)
      })
    })

    it('「番地・号２」の選択時にリンクから遷移した時の初期値を確認', function () {
      delete this.create.section
      delete this.create.houseNumber1

      cy.fixture('guarantees/circuits/search-address-5').then(data => {
        cy.intercept('POST', '**/ztgict/v1/iwan-util/search-address', data).as('postSearchAddress')

        cy.visit(`tenants/${this.tenantId}/guarantees/circuits/create`)
        cy.wait(['@getGuaranteeTermsOfServiceAccepted', '@getResourceSummaryGuaranteeList'])

        // 住所検索
        cy.get('[data-cy="guarantee-search-address-postal-code"]').find('input').type(data.postalCode)
        cy.get('[data-cy="guarantee-search-address-postal-code"]').find('.submit-button').click()
        cy.wait('@postSearchAddress')

        // リンクをクリックして画面遷移
        cy.get('[data-cy="guarantees-circuits-create-search-address-not-found"]').click()
        cy.get('.dialog-base-submit-button').click()
        cy.wait('@postSearchAddress')

        // 初期値
        const address = getAddress(data)
        cy.get('[data-cy="guarantee-search-address-postal-code"]').find('input').should('have.value', data.postalCode)
        cy.get('[data-cy="guarantee-search-address-address"]').should('have.text', address)
        cy.get('[data-cy="guarantee-search-address-selector"]').should('not.exist')
        cy.get('[data-cy="address-registration-request-section"]')
          .find('input')
          .should('have.value', data.sectionList[0])
        cy.get('[data-cy="address-registration-request-house-number-1"]')
          .find('input')
          .should('have.value', data.houseNumber1List[0])
        cy.get('[data-cy="address-registration-request-house-number-2"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-house-number-3"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-building-name-1"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-building-name-2"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-building-name-3"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-latitude"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-longitude"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-map-document-id"]')
          .find('[data-cy="file-upload-display-text"]')
          .should('have.text', '')
        cy.get('[data-cy="address-registration-request-company-name"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-person-name"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-phone-number"]').find('input').should('have.value', '')

        // 入力
        inputRequestData.call(this, address)
        // 確認ボタン押下
        cy.get('[data-cy="address-registration-request-submit-button"]').click()
        // 住所登録依頼ボタン押下
        cy.get('[data-cy="address-registration-request-submit-button"]').click()
        // リクエスト内容を確認
        cy.wait('@postRequest').then(req => {
          const stringify = JSON.stringify({
            ...this.create,
            prefecture: data.prefecture,
            municipality: data.municipalityList[0],
            largerSection: data.largerSectionList[0],
            section: data.sectionList[0],
            houseNumber1: data.houseNumber1List[0],
            mapDocumentId: this.uploadDocumentId,
          })
          expect(req.request.body).to.deep.equal(JSON.parse(stringify))
        })
        // ダイアログを閉じる
        cy.get('.dialog-card-close').click()
        cy.get('.dialog-main').should('not.exist')

        // 初期値が空なことを確認する
        checkInitialViews.call(this, SearchAddressResponseListKeys.houseNumber2List)
      })
    })

    it('「番地・号３」の選択時にリンクから遷移した時の初期値を確認', function () {
      delete this.create.section
      delete this.create.houseNumber1
      delete this.create.houseNumber2

      cy.fixture('guarantees/circuits/search-address-6').then(data => {
        cy.intercept('POST', '**/ztgict/v1/iwan-util/search-address', data).as('postSearchAddress')

        cy.visit(`tenants/${this.tenantId}/guarantees/circuits/create`)
        cy.wait(['@getGuaranteeTermsOfServiceAccepted', '@getResourceSummaryGuaranteeList'])

        // 住所検索
        cy.get('[data-cy="guarantee-search-address-postal-code"]').find('input').type(data.postalCode)
        cy.get('[data-cy="guarantee-search-address-postal-code"]').find('.submit-button').click()
        cy.wait('@postSearchAddress')

        // リンクをクリックして画面遷移
        cy.get('[data-cy="guarantees-circuits-create-search-address-not-found"]').click()
        cy.get('.dialog-base-submit-button').click()
        cy.wait('@postSearchAddress')

        // 初期値
        const address = getAddress(data)
        cy.get('[data-cy="guarantee-search-address-postal-code"]').find('input').should('have.value', data.postalCode)
        cy.get('[data-cy="guarantee-search-address-address"]').should('have.text', address)
        cy.get('[data-cy="guarantee-search-address-selector"]').should('not.exist')
        cy.get('[data-cy="address-registration-request-section"]')
          .find('input')
          .should('have.value', data.sectionList[0])
        cy.get('[data-cy="address-registration-request-house-number-1"]')
          .find('input')
          .should('have.value', data.houseNumber1List[0])
        cy.get('[data-cy="address-registration-request-house-number-2"]')
          .find('input')
          .should('have.value', data.houseNumber2List[0])
        cy.get('[data-cy="address-registration-request-house-number-3"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-building-name-1"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-building-name-2"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-building-name-3"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-latitude"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-longitude"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-map-document-id"]')
          .find('[data-cy="file-upload-display-text"]')
          .should('have.text', '')
        cy.get('[data-cy="address-registration-request-company-name"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-person-name"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-phone-number"]').find('input').should('have.value', '')

        // 入力
        inputRequestData.call(this, address)
        // 確認ボタン押下
        cy.get('[data-cy="address-registration-request-submit-button"]').click()
        // 住所登録依頼ボタン押下
        cy.get('[data-cy="address-registration-request-submit-button"]').click()
        // リクエスト内容を確認
        cy.wait('@postRequest').then(req => {
          const stringify = JSON.stringify({
            ...this.create,
            prefecture: data.prefecture,
            municipality: data.municipalityList[0],
            largerSection: data.largerSectionList[0],
            section: data.sectionList[0],
            houseNumber1: data.houseNumber1List[0],
            houseNumber2: data.houseNumber2List[0],
            mapDocumentId: this.uploadDocumentId,
          })
          expect(req.request.body).to.deep.equal(JSON.parse(stringify))
        })
        // ダイアログを閉じる
        cy.get('.dialog-card-close').click()
        cy.get('.dialog-main').should('not.exist')

        // 初期値が空なことを確認する
        checkInitialViews.call(this, SearchAddressResponseListKeys.houseNumber3List)
      })
    })

    it('「建物名１」の選択時にリンクから遷移した時の初期値を確認', function () {
      delete this.create.section
      delete this.create.houseNumber1
      delete this.create.houseNumber2
      delete this.create.houseNumber3

      cy.fixture('guarantees/circuits/search-address-7').then(data => {
        cy.intercept('POST', '**/ztgict/v1/iwan-util/search-address', data).as('postSearchAddress')

        cy.visit(`tenants/${this.tenantId}/guarantees/circuits/create`)
        cy.wait(['@getGuaranteeTermsOfServiceAccepted', '@getResourceSummaryGuaranteeList'])

        // 住所検索
        cy.get('[data-cy="guarantee-search-address-postal-code"]').find('input').type(data.postalCode)
        cy.get('[data-cy="guarantee-search-address-postal-code"]').find('.submit-button').click()
        cy.wait('@postSearchAddress')

        // リンクをクリックして画面遷移
        cy.get('[data-cy="guarantees-circuits-create-search-address-not-found"]').click()
        cy.get('.dialog-base-submit-button').click()
        cy.wait('@postSearchAddress')

        // 初期値
        const address = getAddress(data)
        cy.get('[data-cy="guarantee-search-address-postal-code"]').find('input').should('have.value', data.postalCode)
        cy.get('[data-cy="guarantee-search-address-address"]').should('have.text', address)
        cy.get('[data-cy="guarantee-search-address-selector"]').should('not.exist')
        cy.get('[data-cy="address-registration-request-section"]')
          .find('input')
          .should('have.value', data.sectionList[0])
        cy.get('[data-cy="address-registration-request-house-number-1"]')
          .find('input')
          .should('have.value', data.houseNumber1List[0])
        cy.get('[data-cy="address-registration-request-house-number-2"]')
          .find('input')
          .should('have.value', data.houseNumber2List[0])
        cy.get('[data-cy="address-registration-request-house-number-3"]')
          .find('input')
          .should('have.value', data.houseNumber3List[0])
        cy.get('[data-cy="address-registration-request-building-name-1"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-building-name-2"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-building-name-3"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-latitude"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-longitude"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-map-document-id"]')
          .find('[data-cy="file-upload-display-text"]')
          .should('have.text', '')
        cy.get('[data-cy="address-registration-request-company-name"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-person-name"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-phone-number"]').find('input').should('have.value', '')

        // 入力
        inputRequestData.call(this, address)
        // 確認ボタン押下
        cy.get('[data-cy="address-registration-request-submit-button"]').click()
        // 住所登録依頼ボタン押下
        cy.get('[data-cy="address-registration-request-submit-button"]').click()
        // リクエスト内容を確認
        cy.wait('@postRequest').then(req => {
          const stringify = JSON.stringify({
            ...this.create,
            prefecture: data.prefecture,
            municipality: data.municipalityList[0],
            largerSection: data.largerSectionList[0],
            section: data.sectionList[0],
            houseNumber1: data.houseNumber1List[0],
            houseNumber2: data.houseNumber2List[0],
            houseNumber3: data.houseNumber3List[0],
            mapDocumentId: this.uploadDocumentId,
          })
          expect(req.request.body).to.deep.equal(JSON.parse(stringify))
        })
        // ダイアログを閉じる
        cy.get('.dialog-card-close').click()
        cy.get('.dialog-main').should('not.exist')

        // 初期値が空なことを確認する
        checkInitialViews.call(this, SearchAddressResponseListKeys.buildingName1List)
      })
    })

    it('「建物名２」の選択時にリンクから遷移した時の初期値を確認', function () {
      delete this.create.section
      delete this.create.houseNumber1
      delete this.create.houseNumber2
      delete this.create.houseNumber3
      delete this.create.buildingName1

      cy.fixture('guarantees/circuits/search-address-8').then(data => {
        cy.intercept('POST', '**/ztgict/v1/iwan-util/search-address', data).as('postSearchAddress')

        cy.visit(`tenants/${this.tenantId}/guarantees/circuits/create`)
        cy.wait(['@getGuaranteeTermsOfServiceAccepted', '@getResourceSummaryGuaranteeList'])

        // 住所検索
        cy.get('[data-cy="guarantee-search-address-postal-code"]').find('input').type(data.postalCode)
        cy.get('[data-cy="guarantee-search-address-postal-code"]').find('.submit-button').click()
        cy.wait('@postSearchAddress')

        // リンクをクリックして画面遷移
        cy.get('[data-cy="guarantees-circuits-create-search-address-not-found"]').click()
        cy.get('.dialog-base-submit-button').click()
        cy.wait('@postSearchAddress')

        // 初期値
        const address = getAddress(data)
        cy.get('[data-cy="guarantee-search-address-postal-code"]').find('input').should('have.value', data.postalCode)
        cy.get('[data-cy="guarantee-search-address-address"]').should('have.text', address)
        cy.get('[data-cy="guarantee-search-address-selector"]').should('not.exist')
        cy.get('[data-cy="address-registration-request-section"]')
          .find('input')
          .should('have.value', data.sectionList[0])
        cy.get('[data-cy="address-registration-request-house-number-1"]')
          .find('input')
          .should('have.value', data.houseNumber1List[0])
        cy.get('[data-cy="address-registration-request-house-number-2"]')
          .find('input')
          .should('have.value', data.houseNumber2List[0])
        cy.get('[data-cy="address-registration-request-house-number-3"]')
          .find('input')
          .should('have.value', data.houseNumber3List[0])
        cy.get('[data-cy="address-registration-request-building-name-1"]')
          .find('input')
          .should('have.value', data.buildingName1List[0])
        cy.get('[data-cy="address-registration-request-building-name-2"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-building-name-3"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-latitude"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-longitude"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-map-document-id"]')
          .find('[data-cy="file-upload-display-text"]')
          .should('have.text', '')
        cy.get('[data-cy="address-registration-request-company-name"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-person-name"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-phone-number"]').find('input').should('have.value', '')

        // 入力
        inputRequestData.call(this, address)
        // 確認ボタン押下
        cy.get('[data-cy="address-registration-request-submit-button"]').click()
        // 住所登録依頼ボタン押下
        cy.get('[data-cy="address-registration-request-submit-button"]').click()
        // リクエスト内容を確認
        cy.wait('@postRequest').then(req => {
          const stringify = JSON.stringify({
            ...this.create,
            prefecture: data.prefecture,
            municipality: data.municipalityList[0],
            largerSection: data.largerSectionList[0],
            section: data.sectionList[0],
            houseNumber1: data.houseNumber1List[0],
            houseNumber2: data.houseNumber2List[0],
            houseNumber3: data.houseNumber3List[0],
            buildingName1: data.buildingName1List[0],
            mapDocumentId: this.uploadDocumentId,
          })
          expect(req.request.body).to.deep.equal(JSON.parse(stringify))
        })
        // ダイアログを閉じる
        cy.get('.dialog-card-close').click()
        cy.get('.dialog-main').should('not.exist')

        // 初期値が空なことを確認する
        checkInitialViews.call(this, SearchAddressResponseListKeys.buildingName2List)
      })
    })

    it('「建物名３」の選択時にリンクから遷移した時の初期値を確認', function () {
      delete this.create.section
      delete this.create.houseNumber1
      delete this.create.houseNumber2
      delete this.create.houseNumber3
      delete this.create.buildingName1
      delete this.create.buildingName2

      cy.fixture('guarantees/circuits/search-address-9').then(data => {
        cy.intercept('POST', '**/ztgict/v1/iwan-util/search-address', data).as('postSearchAddress')

        cy.visit(`tenants/${this.tenantId}/guarantees/circuits/create`)
        cy.wait(['@getGuaranteeTermsOfServiceAccepted', '@getResourceSummaryGuaranteeList'])

        // 住所検索
        cy.get('[data-cy="guarantee-search-address-postal-code"]').find('input').type(data.postalCode)
        cy.get('[data-cy="guarantee-search-address-postal-code"]').find('.submit-button').click()
        cy.wait('@postSearchAddress')

        // リンクをクリックして画面遷移
        cy.get('[data-cy="guarantees-circuits-create-search-address-not-found"]').click()
        cy.get('.dialog-base-submit-button').click()
        cy.wait('@postSearchAddress')

        // 初期値
        const address = getAddress(data)
        cy.get('[data-cy="guarantee-search-address-postal-code"]').find('input').should('have.value', data.postalCode)
        cy.get('[data-cy="guarantee-search-address-address"]').should('have.text', address)
        cy.get('[data-cy="guarantee-search-address-selector"]').should('not.exist')
        cy.get('[data-cy="address-registration-request-section"]')
          .find('input')
          .should('have.value', data.sectionList[0])
        cy.get('[data-cy="address-registration-request-house-number-1"]')
          .find('input')
          .should('have.value', data.houseNumber1List[0])
        cy.get('[data-cy="address-registration-request-house-number-2"]')
          .find('input')
          .should('have.value', data.houseNumber2List[0])
        cy.get('[data-cy="address-registration-request-house-number-3"]')
          .find('input')
          .should('have.value', data.houseNumber3List[0])
        cy.get('[data-cy="address-registration-request-building-name-1"]')
          .find('input')
          .should('have.value', data.buildingName1List[0])
        cy.get('[data-cy="address-registration-request-building-name-2"]')
          .find('input')
          .should('have.value', data.buildingName2List[0])
        cy.get('[data-cy="address-registration-request-building-name-3"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-latitude"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-longitude"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-map-document-id"]')
          .find('[data-cy="file-upload-display-text"]')
          .should('have.text', '')
        cy.get('[data-cy="address-registration-request-company-name"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-person-name"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-phone-number"]').find('input').should('have.value', '')

        // 入力
        inputRequestData.call(this, address)
        // 確認ボタン押下
        cy.get('[data-cy="address-registration-request-submit-button"]').click()
        // 住所登録依頼ボタン押下
        cy.get('[data-cy="address-registration-request-submit-button"]').click()
        // リクエスト内容を確認
        cy.wait('@postRequest').then(req => {
          const stringify = JSON.stringify({
            ...this.create,
            prefecture: data.prefecture,
            municipality: data.municipalityList[0],
            largerSection: data.largerSectionList[0],
            section: data.sectionList[0],
            houseNumber1: data.houseNumber1List[0],
            houseNumber2: data.houseNumber2List[0],
            houseNumber3: data.houseNumber3List[0],
            buildingName1: data.buildingName1List[0],
            buildingName2: data.buildingName2List[0],
            mapDocumentId: this.uploadDocumentId,
          })
          expect(req.request.body).to.deep.equal(JSON.parse(stringify))
        })
        // ダイアログを閉じる
        cy.get('.dialog-card-close').click()
        cy.get('.dialog-main').should('not.exist')

        // 初期値が空なことを確認する
        checkInitialViews.call(this, SearchAddressResponseListKeys.buildingName3List)
      })
    })

    it('「番地・号２」と「建物名１」 で「なし」を選択したときに 「建物名３」の途中遷移で初期値が正しく表示されること', function () {
      delete this.create.section
      delete this.create.houseNumber1
      delete this.create.houseNumber2
      delete this.create.houseNumber3
      delete this.create.buildingName1
      delete this.create.buildingName2

      cy.fixture('guarantees/circuits/search-address-10').then(data => {
        cy.intercept('POST', '**/ztgict/v1/iwan-util/search-address', data).as('postSearchAddress')

        cy.visit(`tenants/${this.tenantId}/guarantees/circuits/create`)
        cy.wait(['@getGuaranteeTermsOfServiceAccepted', '@getResourceSummaryGuaranteeList'])

        // 住所検索
        cy.get('[data-cy="guarantee-search-address-postal-code"]').find('input').type(data.postalCode)
        cy.get('[data-cy="guarantee-search-address-postal-code"]').find('.submit-button').click()
        cy.wait('@postSearchAddress')

        // リンクをクリックして画面遷移
        cy.get('[data-cy="guarantees-circuits-create-search-address-not-found"]').click()
        cy.get('.dialog-base-submit-button').click()
        cy.wait('@postSearchAddress')

        // 初期値
        const address = getAddress(data)
        cy.get('[data-cy="guarantee-search-address-postal-code"]').find('input').should('have.value', data.postalCode)
        cy.get('[data-cy="guarantee-search-address-address"]').should('have.text', address)
        cy.get('[data-cy="guarantee-search-address-selector"]').should('not.exist')
        cy.get('[data-cy="address-registration-request-section"]')
          .find('input')
          .should('have.value', data.sectionList[0])
        cy.get('[data-cy="address-registration-request-house-number-1"]')
          .find('input')
          .should('have.value', data.houseNumber1List[0])
        cy.get('[data-cy="address-registration-request-house-number-2"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-house-number-3"]')
          .find('input')
          .should('have.value', data.houseNumber3List[0])
        cy.get('[data-cy="address-registration-request-building-name-1"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-building-name-2"]')
          .find('input')
          .should('have.value', data.buildingName2List[0])
        cy.get('[data-cy="address-registration-request-building-name-3"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-latitude"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-longitude"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-map-document-id"]')
          .find('[data-cy="file-upload-display-text"]')
          .should('have.text', '')
        cy.get('[data-cy="address-registration-request-company-name"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-person-name"]').find('input').should('have.value', '')
        cy.get('[data-cy="address-registration-request-phone-number"]').find('input').should('have.value', '')

        // 入力
        inputRequestData.call(this, address)
        // 確認ボタン押下
        cy.get('[data-cy="address-registration-request-submit-button"]').click()
        // 住所登録依頼ボタン押下
        cy.get('[data-cy="address-registration-request-submit-button"]').click()
        // リクエスト内容を確認
        cy.wait('@postRequest').then(req => {
          const stringify = JSON.stringify({
            ...this.create,
            prefecture: data.prefecture,
            municipality: data.municipalityList[0],
            largerSection: data.largerSectionList[0],
            section: data.sectionList[0],
            houseNumber1: data.houseNumber1List[0],
            houseNumber2: undefined,
            houseNumber3: data.houseNumber3List[0],
            buildingName1: undefined,
            buildingName2: data.buildingName2List[0],
            mapDocumentId: this.uploadDocumentId,
          })
          expect(req.request.body).to.deep.equal(JSON.parse(stringify))
        })
        // ダイアログを閉じる
        cy.get('.dialog-card-close').click()
        cy.get('.dialog-main').should('not.exist')

        // 初期値が空なことを確認する
        checkInitialViews.call(this, SearchAddressResponseListKeys.buildingName3List)
      })
    })
  })

  context('受付時間外メッセージの表示を確認', function () {
    beforeEach(function () {
      this.postalCode = '160-0023'
      cy.intercept('POST', '**/ztgict/v1/iwan-util/search-address', {
        fixture: 'guarantees/circuits/search-address',
      }).as('postSearchAddress')
    })
    it('第３月曜日以外 - 受付時間外 - 日本時間(8:59)', function () {
      cy.clock(new Date('2024-04-21T23:59:59Z'), ['Date'])

      // 画面に遷移
      cy.visit(`tenants/${this.tenantId}/guarantees/address-registration-request`)
      cy.wait([
        '@getGuaranteeTermsOfServiceAccepted',
        '@getGuaranteeTermsOfService',
        '@getDownloadGuaranteeMonitoringTermsOfService',
      ])
      // メッセージが表示されることを確認
      cy.get('[data-cy="address-registration-request-outside-reception-hour"]').should('exist')

      // 住所検索 ができないことを確認
      cy.get('[data-cy="guarantee-search-address-postal-code"]').find('input').should('be.disabled')
      cy.get('[data-cy="guarantee-search-address-postal-code"]').find('.submit-button').should('be.disabled')

      // 座標情報（緯度）の入力
      cy.get('[data-cy="address-registration-request-latitude"]').find('input').type(this.create.latitude)
      // 座標情報（経度）の入力
      cy.get('[data-cy="address-registration-request-longitude"]').find('input').type(this.create.longitude)
      // 地図情報ファイル
      cy.pngFileUpload({
        className: '[data-cy="address-registration-request-map-document-id"]',
        aliasName: '@postUploadDocument',
        documentId: this.uploadDocumentId,
        type: DocumentTypes.MapDocument,
        service: DocumentServiceTypes.Guarantee,
      })
      // 事業所名の入力
      cy.get('[data-cy="address-registration-request-company-name"]').find('input').type(this.create.companyName)
      // 担当者氏名の入力
      cy.get('[data-cy="address-registration-request-person-name"]').find('input').type(this.create.personName)
      // 担当者電話番号の入力
      cy.get('[data-cy="address-registration-request-phone-number"]').find('input').type(this.create.phoneNumber)

      // 入力可能項目を埋めた場合でも、確認ボタンが非活性なことを確認
      cy.get('[data-cy="address-registration-request-submit-button"]').should('be.disabled')
    })
    it('第３月曜日以外 - 受付時間内 - 日本時間(9:00)', function () {
      cy.clock(new Date('2024-04-22T00:00:00Z'), ['Date'])

      // 画面に遷移
      cy.visit(`tenants/${this.tenantId}/guarantees/address-registration-request`)
      cy.wait([
        '@getGuaranteeTermsOfServiceAccepted',
        '@getGuaranteeTermsOfService',
        '@getDownloadGuaranteeMonitoringTermsOfService',
      ])
      // メッセージが表示されないことを確認
      cy.get('[data-cy="address-registration-request-outside-reception-hour"]').should('not.exist')

      // 住所検索
      cy.get('[data-cy="guarantee-search-address-postal-code"]').find('input').type(this.postalCode)
      cy.get('[data-cy="guarantee-search-address-postal-code"]').find('.submit-button').click()
      cy.wait('@postSearchAddress')
      // 座標情報（緯度）の入力
      cy.get('[data-cy="address-registration-request-latitude"]').find('input').type(this.create.latitude)
      // 座標情報（経度）の入力
      cy.get('[data-cy="address-registration-request-longitude"]').find('input').type(this.create.longitude)
      // 地図情報ファイル
      cy.pngFileUpload({
        className: '[data-cy="address-registration-request-map-document-id"]',
        aliasName: '@postUploadDocument',
        documentId: this.uploadDocumentId,
        type: DocumentTypes.MapDocument,
        service: DocumentServiceTypes.Guarantee,
      })
      // 事業所名の入力
      cy.get('[data-cy="address-registration-request-company-name"]').find('input').type(this.create.companyName)
      // 担当者氏名の入力
      cy.get('[data-cy="address-registration-request-person-name"]').find('input').type(this.create.personName)
      // 担当者電話番号の入力
      cy.get('[data-cy="address-registration-request-phone-number"]').find('input').type(this.create.phoneNumber)

      // 必須項目を埋めた場合、確認ボタンが活性なことを確認
      cy.get('[data-cy="address-registration-request-submit-button"]').should('not.be.disabled')
    })
    it('第３月曜日以外 - 受付時間内 - 日本時間(19:59)', function () {
      cy.clock(new Date('2024-04-22T10:59:59Z'), ['Date'])

      // 画面に遷移
      cy.visit(`tenants/${this.tenantId}/guarantees/address-registration-request`)
      cy.wait([
        '@getGuaranteeTermsOfServiceAccepted',
        '@getGuaranteeTermsOfService',
        '@getDownloadGuaranteeMonitoringTermsOfService',
      ])
      // 表示要素の確認
      cy.get('[data-cy="address-registration-request-submit-button"]').should('be.disabled')
      // メッセージが表示されないことを確認
      cy.get('[data-cy="address-registration-request-outside-reception-hour"]').should('not.exist')
    })
    it('第３月曜日以外 - 受付時間外 - 日本時間(20:00)', function () {
      cy.clock(new Date('2024-04-22T11:00:00Z'), ['Date'])

      // 画面に遷移
      cy.visit(`tenants/${this.tenantId}/guarantees/address-registration-request`)
      cy.wait([
        '@getGuaranteeTermsOfServiceAccepted',
        '@getGuaranteeTermsOfService',
        '@getDownloadGuaranteeMonitoringTermsOfService',
      ])
      // メッセージが表示されることを確認
      cy.get('[data-cy="address-registration-request-outside-reception-hour"]').should('exist')
    })
    it('第３月曜日 - 受付時間外 - 日本時間(8:59)', function () {
      cy.clock(new Date('2024-04-14T23:59:59Z'), ['Date'])

      // 画面に遷移
      cy.visit(`tenants/${this.tenantId}/guarantees/address-registration-request`)
      cy.wait([
        '@getGuaranteeTermsOfServiceAccepted',
        '@getGuaranteeTermsOfService',
        '@getDownloadGuaranteeMonitoringTermsOfService',
      ])
      // メッセージが表示されることを確認
      cy.get('[data-cy="address-registration-request-outside-reception-hour"]').should('exist')
    })
    it('第３月曜日 - 受付時間内 - 日本時間(9:00)', function () {
      cy.clock(new Date('2024-04-15T00:00:00Z'), ['Date'])

      // 画面に遷移
      cy.visit(`tenants/${this.tenantId}/guarantees/address-registration-request`)
      cy.wait([
        '@getGuaranteeTermsOfServiceAccepted',
        '@getGuaranteeTermsOfService',
        '@getDownloadGuaranteeMonitoringTermsOfService',
      ])
      // 表示要素の確認
      cy.get('[data-cy="address-registration-request-submit-button"]').should('be.disabled')
      // メッセージが表示されないことを確認
      cy.get('[data-cy="address-registration-request-outside-reception-hour"]').should('not.exist')
    })
    it('第３月曜日 - 受付時間内 - 日本時間(16:59)', function () {
      cy.clock(new Date('2024-04-15T07:59:59Z'), ['Date'])

      // 画面に遷移
      cy.visit(`tenants/${this.tenantId}/guarantees/address-registration-request`)
      cy.wait([
        '@getGuaranteeTermsOfServiceAccepted',
        '@getGuaranteeTermsOfService',
        '@getDownloadGuaranteeMonitoringTermsOfService',
      ])
      // 表示要素の確認
      cy.get('[data-cy="address-registration-request-submit-button"]').should('be.disabled')
      // メッセージが表示されないことを確認
      cy.get('[data-cy="address-registration-request-outside-reception-hour"]').should('not.exist')
    })
    it('第３月曜日 - 受付時間外 - 日本時間(17:00)', function () {
      cy.clock(new Date('2024-04-15T08:00:00Z'), ['Date'])

      // 画面に遷移
      cy.visit(`tenants/${this.tenantId}/guarantees/address-registration-request`)
      cy.wait([
        '@getGuaranteeTermsOfServiceAccepted',
        '@getGuaranteeTermsOfService',
        '@getDownloadGuaranteeMonitoringTermsOfService',
      ])
      // メッセージが表示されることを確認
      cy.get('[data-cy="address-registration-request-outside-reception-hour"]').should('exist')
    })
  })
})
