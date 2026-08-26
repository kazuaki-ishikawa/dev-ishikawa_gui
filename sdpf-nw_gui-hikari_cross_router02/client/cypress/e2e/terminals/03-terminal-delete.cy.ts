import {
  getShowPicIdentificationNumber,
  getShowPicIdentificationBackDocumentFile,
  getShowPicIdentificationAdditionalDocumentFile,
  getShowPicAuxiliaryIdentificationDocumentType,
  getShowPicEmployeeCode,
  generateRandomHex,
  t,
  getTerminalMobileRequest,
} from '@cypress/support/utils'

const testCases = [
  { name: 'モバイル(SIMあり)', fixturePath: 'terminals/detail-mobile.json' },
  { name: 'IPoE(SIMあり)', fixturePath: 'terminals/detail-ipoe-mobile.json' },
  { name: 'ギャランティ(SIMなし)', fixturePath: 'terminals/detail-guarantee-ipoe.json' },
]

describe('terminal delete', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)
    this.terminalId = generateRandomHex(32)
    cy.fixture('terminals/delete.json').then(data => {
      this.inputData = data
    })
    cy.fixture('upload-document.json').then(data => {
      this.uploadDocumentId = data.documentId
    })
    cy.fixture('guarantees/circuits/search-address.json').then(searchAddress => {
      const houseNumber = [
        searchAddress?.houseNumber1List,
        searchAddress?.houseNumber2List,
        searchAddress?.houseNumber3List,
      ].join('ー')
      const buildingName = [
        searchAddress?.buildingName1List,
        searchAddress?.buildingName2List,
        searchAddress?.buildingName3List,
      ].join('　')
      this.address = [
        searchAddress?.prefecture,
        searchAddress?.municipalityList,
        searchAddress?.largerSectionList,
        searchAddress?.sectionList,
        houseNumber,
        buildingName,
      ].join('')
    })

    cy.intercept('GET', '**/ztgict/v1/resource-summary/terminals*', { fixture: 'terminals/list' }).as('getTerminalList')
    cy.intercept('GET', '**/ztgict/v1/terminals/*/operation', { fixture: 'terminals/operations' }).as(
      'getTerminalsOperation',
    )
    cy.intercept('GET', '**/ztgict/v1/break-out-lists?resourceStatus=active&resourceStatus=inactive', {
      fixture: 'break-out-lists/list',
    }).as('getBreakOutList')
    cy.intercept('GET', '**/ztgict/v1/settings/behavior-detection', {
      fixture: 'behavior-detection/settings',
    }).as('getBehaviorDetection')

    cy.intercept('DELETE', '**/ztgict/v1/terminals/*', {}).as('deleteTerminal')
    cy.intercept('POST', '**/ztgict/v1/upload-document', { fixture: 'upload-document' }).as('postUploadDocument')

    cy.intercept('POST', '**/ztgict/v1/iwan-util/search-address', {
      fixture: 'guarantees/circuits/search-address',
    }).as('postIwanUtilSearchAddress')
  })

  testCases.forEach(testCase => {
    it(`端末廃止画面 - アクセス回線＜メイン＞が${testCase.name}回線の場合`, function () {
      cy.intercept('GET', '**/ztgict/v1/terminals/*', { fixture: testCase.fixturePath }).as('getTerminal')

      cy.fixture(testCase.fixturePath).then(original => {
        // 詳細画面の表示
        cy.visit(`/tenants/${this.tenantId}/terminals/${this.terminalId}`)
        cy.wait(['@getTerminal', '@getTerminalsOperation', '@getBreakOutList'])
        // 廃止画面の表示
        cy.get('[data-cy="terminals-id-index-delete-button"]').should('have.text', t('common.delete')).click()
        cy.wait(['@getTerminal'])

        // ボタン
        cy.get('[data-cy="terminals-id-remove-cancel-button"]')
          .as('cancelButton')
          .should('have.text', t('common.cancel'))
          .should('not.be.disabled')
        cy.get('[data-cy="terminals-id-remove-submit-button"]')
          .as('submitButton')
          .should('have.text', t('common.confirm'))
          .should('be.disabled')
        // 廃止時の注意喚起が表示されないことを確認
        cy.get('[data-cy="terminals-id-remove-abolition-notice').should('not.exist')

        if (original?.mobile) {
          // モバイル情報の初期値確認
          cy.get('[data-cy="terminals-id-remove-mobile-pic-name"]').find('input').should('have.value', original.mobile.picName)
          cy.get('[data-cy="terminals-id-remove-mobile-pic-name-kana"]')
            .find('input')
            .should('have.value', original.mobile.picNameKana)
          cy.get('[data-cy="terminals-id-remove-mobile-pic-phone-number"]')
            .find('input')
            .should('have.value', original.mobile.picPhoneNumber)
        } else {
          cy.get('[data-cy="terminals-id-remove-removal-mobile"]').should('not.exist')
        }

        // 廃止申し込み情報入力
        cy.get('[data-cy="terminals-id-remove-removal-name"]').find('input').type(this.inputData.removalName)
        if (this.inputData.removalCompanyName) {
          cy.get('[data-cy="terminals-id-remove-removal-company-name"]').find('input').type(this.inputData.removalCompanyName)
        }
        cy.get('[data-cy="terminals-id-remove-removal-department-name"]').find('input').type(this.inputData.removalDepartmentName)
        cy.get('[data-cy="terminals-id-remove-removal-postal-code"]').find('input').type(this.inputData.removalPostalCode)
        // 郵便番号入力による住所自動入力の確認
        cy.get('[data-cy="terminals-id-remove-removal-address"]').find('input').should('have.value', this.inputData.removalAddress)
        cy.get('[data-cy="terminals-id-remove-removal-address-kana"]').find('input').type(this.inputData.removalAddressKana)
        cy.get('[data-cy="terminals-id-remove-removal-phone-number"]').find('input').type(this.inputData.removalPhoneNumber)

        // モバイル申し込み情報入力
        if (original?.mobile) {
          cy.get('[data-cy="terminals-id-remove-mobile-japan-corporate-number"]')
            .find('input')
            .clear()
            .type(this.inputData.mobile.japanCorporateNumber)
          cy.inputSelectForm({
            selector: '[data-cy="terminals-id-remove-mobile-contract-identification-document-type"]',
            value: t(`documentType.${this.inputData.mobile.contractIdentificationDocumentType}`),
          })
          cy.pngFileUpload({
            className: '[data-cy="terminals-id-remove-mobile-contract-identification-document-id"]',
            aliasName: '@postUploadDocument',
            documentId: this.uploadDocumentId,
          })
          cy.get('[data-cy="terminals-id-remove-mobile-pic-name"]').find('input').clear().type(this.inputData.mobile.picName)
          cy.get('[data-cy="terminals-id-remove-mobile-pic-name-kana"]')
            .find('input')
            .clear()
            .type(this.inputData.mobile.picNameKana)
          cy.get('[data-cy="terminals-id-remove-mobile-pic-postal-code"]')
            .find('input')
            .clear()
            .type(this.inputData.mobile.picPostalCode)
          // 郵便番号入力による住所自動入力の確認
          cy.get('[data-cy="terminals-id-remove-mobile-pic-address"]')
            .find('input')
            .should('have.value', this.inputData.mobile.picAddress)
          cy.get('[data-cy="terminals-id-remove-mobile-pic-address-kana"]')
            .find('input')
            .clear()
            .type(this.inputData.mobile.picAddressKana)
          cy.get('[data-cy="terminals-id-remove-mobile-pic-phone-number"]')
            .find('input')
            .clear()
            .type(this.inputData.mobile.picPhoneNumber)
          cy.inputDatePicker({
            className: '[data-cy="terminals-id-remove-mobile-pic-date-of-birth"]',
            date: this.inputData.mobile.picDateOfBirth,
          })
          cy.inputSelectForm({
            selector: '[data-cy="terminals-id-remove-mobile-pic-identification-document-type"]',
            value: t(`documentType.${this.inputData.mobile.picIdentificationDocumentType}`),
          })
          cy.pngFileUpload({
            className: '[data-cy="terminals-id-remove-mobile-pic-identification-front-document-id"]',
            aliasName: '@postUploadDocument',
            documentId: this.uploadDocumentId,
          })
          if (getShowPicIdentificationNumber(this.inputData.mobile)) {
            cy.get('[data-cy="terminals-id-remove-mobile-pic-identification-number"]')
              .find('input')
              .clear()
              .type(this.inputData.mobile.picIdentificationNumber)
          }
          if (getShowPicIdentificationBackDocumentFile(this.inputData.mobile)) {
            cy.pngFileUpload({
              className: '[data-cy="terminals-id-remove-mobile-pic-identification-back-document-id"]',
              aliasName: '@postUploadDocument',
              documentId: this.uploadDocumentId,
            })
          }
          if (getShowPicIdentificationAdditionalDocumentFile(this.inputData.mobile)) {
            cy.pngFileUpload({
              className: '[data-cy="terminals-id-remove-mobile-pic-identification-additional-document-id"]',
              aliasName: '@postUploadDocument',
              documentId: this.uploadDocumentId,
            })
          }
          if (getShowPicAuxiliaryIdentificationDocumentType(this.inputData.mobile)) {
            cy.inputSelectForm({
              selector: '[data-cy="terminals-id-remove-mobile-pic-auxiliary-identification-document-type"]',
              value: t(`documentType.${this.inputData.mobile.picAuxiliaryIdentificationDocumentType}`),
            })
            cy.pngFileUpload({
              className: '[data-cy="terminals-id-remove-mobile-pic-auxiliary-identification-document-id"]',
              aliasName: '@postUploadDocument',
              documentId: this.uploadDocumentId,
            })
          }
          cy.inputSelectForm({
            selector: '[data-cy="terminals-id-remove-mobile-pic-employment-document-type"]',
            value: t(`documentType.${this.inputData.mobile.picEmploymentDocumentType}`),
          })
          if (getShowPicEmployeeCode(this.inputData.mobile.picEmploymentDocumentType)) {
            cy.get('[data-cy="terminals-id-remove-mobile-pic-employee-code"]')
              .find('input')
              .clear()
              .type(this.inputData.mobile.picEmployeeCode)
          }
          cy.pngFileUpload({
            className: '[data-cy="terminals-id-remove-mobile-pic-employment-document-id"]',
            aliasName: '@postUploadDocument',
            documentId: this.uploadDocumentId,
          })
          cy.wait(3000)
        }

        // TODO: https://redmine.tok.access-company.com/nwvpn/issues/14474 住所検索が復活したらコメントアウトを戻す
        // // 返却キット送付先郵便番号の住所検索の確認
        // cy.get('[data-cy="terminals-id-remove-removal-postal-code"]').find('button').click()
        // cy.wait('@postIwanUtilSearchAddress')
        // cy.get('[data-cy="terminals-id-remove-removal-postal-code"]')
        //   .find('input')
        //   .should('have.value', this.inputData.removalPostalCode)
        // cy.get('[data-cy="terminals-id-remove-removal-address"]').find('input').should('have.value', this.address)

        // 確認
        cy.get('@cancelButton').should('have.text', t('common.cancel'))
        cy.get('@submitButton').should('have.text', t('common.confirm')).click()

        // 確認チェックボックス
        if (original?.mobile) {
          // 確認チェックボックス押下前は廃止申込ボタンが非活性になっていることを確認する
          cy.get('@submitButton').should('have.text', t('common.abolition')).should('be.disabled')
          cy.get('[data-cy="terminals-id-remove-checkbox-contractor-address"] .checkbox').click()
          cy.get('[data-cy="terminals-id-remove-checkbox-contractor-address"]').should(
            'have.text',
            t('terminals.confirm.checkContractorAddress', { here: t('common.here') }),
          )
          cy.get('[data-cy="terminals-id-remove-checkbox-pic-information"] .checkbox').click()
          cy.get('[data-cy="terminals-id-remove-checkbox-pic-information"]').should(
            'have.text',
            t('terminals.confirm.checkPicInformation', { here: t('common.here') }),
          )
        } else {
          cy.get('[data-cy="terminals-id-remove-checkbox-contractor-address"]').should('not.exist')
          cy.get('[data-cy="terminals-id-remove-checkbox-pic-information"]').should('not.exist')
        }

        // 確認チェックボックスが表示される場合、一旦戻って初期化されることを確認する
        if (original?.mobile) {
          // 一旦戻る
          cy.get('@submitButton').should('not.be.disabled')
          cy.get('@cancelButton').click()
          // 少し待つ
          cy.wait(500)
          cy.get('@submitButton').click()
          // 確認チェックボックス押下前は廃止申込ボタンが非活性になっていることを確認する
          cy.get('@submitButton').should('be.disabled')
          // チェックボックスを埋める
          cy.get('[data-cy="terminals-id-remove-checkbox-contractor-address"] .checkbox').click()
          cy.get('[data-cy="terminals-id-remove-checkbox-pic-information"] .checkbox').click()
        }
        cy.get('[data-cy="terminals-id-remove-abolition-notice')
          .should('be.visible')
          .and('have.text', t('terminals.note.abolitionNotice'))

        // 作成
        cy.get('@cancelButton').should('have.text', t('common.return'))
        cy.get('@submitButton').should('not.be.disabled').click()

        const request = {
          ...this.inputData,
          // removalAddress: this.address,
          mobile: original?.mobile
            ? getTerminalMobileRequest({
                ...this.inputData.mobile,
                contractIdentificationDocumentId: this.uploadDocumentId,
                picIdentificationFrontDocumentId: this.uploadDocumentId,
                picIdentificationBackDocumentId: this.uploadDocumentId,
                picIdentificationAdditionalDocumentId: this.uploadDocumentId,
                picAuxiliaryIdentificationDocumentId: this.uploadDocumentId,
                picEmploymentDocumentId: this.uploadDocumentId,
              })
            : undefined,
        }
        cy.wait('@deleteTerminal').then(req => {
          // undefined 除去のために JSON.parse する
          const stringify = JSON.stringify(request)
          expect(req.request.url).to.include(`ztgict/v1/terminals/${this.terminalId}`)
          expect(req.request.body).to.deep.equal(JSON.parse(stringify))
        })

        // 一覧画面に戻る
        cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/terminals`)
        cy.wait(['@getTerminalList'])

        // DELETE terminals の成功メッセージを確認
        cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('message.deleted'))
        cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
        cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.close')).click()
        cy.get('[data-cy="notification-dialog-text"]').should('not.exist')
      })
    })
  })
})
