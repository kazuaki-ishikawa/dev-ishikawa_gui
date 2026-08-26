import { ScheduledTime } from '@app/api/hikariCollaboUtil/constants'
import dayjs from 'dayjs'
import {
  GuaranteeReserveDateAddCount,
  generateRandomHex,
  nDaysLater,
  t,
  outsideApplicationRestrictionAt,
  OUTSIDE_APPLICATION_RESTRICTION_AT,
} from '@cypress/support/utils'

describe('ギャランティアクセス 新規作成', () => {
  const time = Object.keys(ScheduledTime)[0] as keyof typeof ScheduledTime
  const fieldSurveyMinDate = nDaysLater(
    GuaranteeReserveDateAddCount.fieldSurvey,
    dayjs(OUTSIDE_APPLICATION_RESTRICTION_AT),
  )
  const constructionMinDate = nDaysLater(
    GuaranteeReserveDateAddCount.fieldSurvey + GuaranteeReserveDateAddCount.construction,
    dayjs(OUTSIDE_APPLICATION_RESTRICTION_AT),
  )

  beforeEach(function () {
    this.tenantId = generateRandomHex(32)

    cy.fixture('guarantees/circuits/create-physical-bandwidth-1G').then(data => {
      this.create1G = data
    })
    cy.fixture('guarantees/circuits/create-physical-bandwidth-100M').then(data => {
      this.create100M = data
    })
    cy.fixture('guarantees/circuits/search-address.json').then(searchAddress => {
      this.searchAddress = searchAddress
    })
    cy.fixture('guarantees/circuits/terms-of-service.json').then(guaranteeTermsOfService => {
      this.guaranteeTermsOfService = guaranteeTermsOfService
    })
    cy.fixture('guarantees/circuits/guarantee-download-terms-of-service.json').then(downloadedTermsOfService => {
      this.downloadedTermsOfService = downloadedTermsOfService.decodedContent
    })
    cy.fixture('upload-document.json').then(data => {
      this.uploadDocumentId = data.documentId
    })

    cy.intercept('GET', '**/ztgict/v1/guarantees*', { fixture: 'guarantees/circuits/list' }).as('getGuaranteeList')
    cy.intercept('GET', '**/ztgict/v1/resource-summary/guarantees?limit=1000*', {
      fixture: 'guarantees/circuits/list',
    }).as('getResourceSummaryGuaranteeList')
    cy.intercept('GET', '**/ztgict/v1/resource-summary/terminals?limit=1000*', { fixture: 'terminals/list' }).as(
      'getTerminalList',
    )
    cy.intercept('POST', '**/ztgict/v1/iwan-util/search-address', {
      fixture: 'guarantees/circuits/search-address',
    }).as('postSearchAddress')
    cy.intercept('POST', '**/ztgict/v1/iwan-util/judge', { fixture: 'guarantees/circuits/judge' }).as('postJudge')
    cy.intercept('POST', '**/ztgict/v1/guarantees', {
      fixture: 'guarantees/circuits/detail-reserve-date-approved',
    }).as('postRequest')
    cy.intercept('GET', '**/ztgict/v1/orders/*', { response: { statusCode: 200 } }).as('getOrder')

    cy.intercept('GET', '**/ztgict/v1/settings/guarantee', {
      body: { termsOfServiceAccepted: true },
    }).as('getGuaranteeTermsOfServiceAccepted')
    cy.intercept('GET', '**/ztgict/v1/settings/guarantee/terms-of-service', {
      fixture: 'guarantees/circuits/terms-of-service',
    }).as('getGuaranteeTermsOfService')
    cy.intercept('GET', '**/ztgict/v1/download-terms-of-service*', {
      fixture: 'guarantees/circuits/guarantee-download-terms-of-service',
    }).as('getDownloadGuaranteeMonitoringTermsOfService')
    cy.intercept('POST', '**/ztgict/v1/upload-document', { fixture: 'upload-document' }).as('postUploadDocument')
  })

  it('規約同意', function () {
    cy.clock(outsideApplicationRestrictionAt(9, 0, 0, 0), ['Date'])

    cy.intercept('GET', '**/ztgict/v1/settings/guarantee', {
      body: { termsOfServiceAccepted: false },
    }).as('getGuaranteeTermsOfServiceIsNotAccepted')
    cy.intercept('POST', '**/ztgict/v1/settings/guarantee/terms-of-service/agree', {}).as('postGuaranteeTermsOfService')

    cy.visit(`tenants/${this.tenantId}/guarantees/circuits`)
    cy.wait(['@getSession', '@getMobile', '@getResourceSummaryGuaranteeList', '@getGuaranteeList'])
    cy.get('[data-cy="guarantees-circuits-index-create-new-button"]').click()
    cy.wait([
      '@getResourceSummaryGuaranteeList',
      '@getGuaranteeTermsOfServiceIsNotAccepted',
      '@getGuaranteeTermsOfService',
      '@getDownloadGuaranteeMonitoringTermsOfService',
    ])

    // 規約同意画面に遷移
    this.guaranteeTermsOfService.listedTermsOfService.forEach((_: { name: string; uuid: string }, index: number) => {
      cy.get(`[data-cy="contractor-terms-and-conditions-terms-of-service-${index}"]`).should(
        'have.text',
        this.downloadedTermsOfService + '\n',
      )
      cy.get(`[data-cy="contractor-contractor-terms-and-conditions-agreement-${index}"]`).find('.checkbox').click()
      cy.get(`[data-cy="contractor-contractor-terms-and-conditions-agreement-${index}"]`).should(
        'contain',
        t('terms.agreement'),
      )
    })
    cy.get('[data-cy="contractor-contractor-terms-and-conditions-submit-button"]')
      .should('have.text', t('terms.agreement'))
      .should('not.be.disabled')
      .click()
    cy.wait('@postGuaranteeTermsOfService')
  })

  context('住所検索のテスト', function () {
    beforeEach(function () {
      cy.clock(outsideApplicationRestrictionAt(9, 0, 0, 0), ['Date'])
    })

    it('「次の候補を表示」ボタンを押した時のリクエスト値の確認', function () {
      const postalCode = '100-0000'
      const nextRequestNumber = generateRandomHex(32)
      const commonBody = {
        postalCode,
        prefecture: '東京都',
        municipalityList: ['新宿区'],
        largerSectionList: ['市谷田町'],
      }

      // 「字・丁目」のリストを取得するインターセプト
      cy.intercept('POST', '**/ztgict/v1/iwan-util/search-address', {
        body: { ...commonBody, sectionList: ['１４丁目'] },
      }).as('postSearchAddress')

      // 新規作成画面に遷移
      cy.visit(`tenants/${this.tenantId}/guarantees/circuits/create`)
      cy.wait(['@getResourceSummaryGuaranteeList', '@getGuaranteeTermsOfServiceAccepted'])

      // 住所検索
      cy.get('[data-cy="guarantee-search-address-postal-code"]').find('input').type(postalCode)
      cy.get('[data-cy="guarantee-search-address-postal-code"]').find('.submit-button').click()
      cy.wait(['@postSearchAddress'])

      // 「番地・号２」のリストを取得するインターセプト
      cy.intercept('POST', '**/ztgict/v1/iwan-util/search-address', {
        body: {
          ...commonBody,
          houseNumber2List: ['１１', '１２', '１３'],
          nextRequestNumber,
        },
      }).as('postSearchAddress')

      // 「なし」ボタンを押下
      cy.get('[data-cy="guarantee-search-address-section-list-button"]')
        .find('button')
        .contains(t('ipoes.none'))
        .click()
      cy.wait('@postSearchAddress').then(req => {
        expect(req.request.body).to.deep.equal({
          postalCode,
          prefecture: '東京都',
          municipality: '新宿区',
          largerSection: '市谷田町',
          section: null,
        })
      })

      // セレクトボタンの表示確認
      cy.get('[data-cy="guarantee-search-address-municipality-list-button"]').should('not.exist')
      cy.get('[data-cy="guarantee-search-address-larger-section-list-button"]').should('not.exist')
      cy.get('[data-cy="guarantee-search-address-section-list-button"]').should('not.exist')
      cy.get('[data-cy="guarantee-search-address-house-number1-list-button"]').should('not.exist')
      cy.get('[data-cy="guarantee-search-address-house-number2-list-button"]').find('button').should('have.length', 4)
      cy.get('[data-cy="guarantee-search-address-house-number3-list-button"]').should('not.exist')
      cy.get('[data-cy="guarantee-search-address-building-name1-list-button"]').should('not.exist')
      cy.get('[data-cy="guarantee-search-address-building-name2-list-button"]').should('not.exist')
      cy.get('[data-cy="guarantee-search-address-building-name3-list-button"]').should('not.exist')
      cy.get('[data-cy="guarantee-search-address-building-facility-name-list-button"]').should('not.exist')

      // 「番地・号２」の追加リストを取得するインターセプト
      cy.intercept('POST', '**/ztgict/v1/iwan-util/search-address', {
        body: {
          ...commonBody,
          houseNumber2List: ['１１', '１４', '１５', '１６'],
        },
      }).as('postSearchAddress')

      // 「次の候補を表示」ボタンを押下
      // 「なし」を選択したプロパティが追加されていること確認する
      cy.get('[data-cy="guarantee-search-address-next-request-button"]').click()
      cy.wait('@postSearchAddress').then(req => {
        expect(req.request.body).to.deep.equal({
          postalCode,
          prefecture: '東京都',
          municipality: '新宿区',
          largerSection: '市谷田町',
          section: null,
          houseNumber1: null,
          nextRequestNumber,
        })
      })

      // ボタンの表示確認
      cy.get('[data-cy="guarantee-search-address-house-number2-list-button"]').find('button').should('have.length', 7)
      cy.get('[data-cy="guarantee-search-address-next-request-button"]').should('not.exist')

      // 次のインターセプト
      cy.intercept('POST', '**/ztgict/v1/iwan-util/search-address', {
        body: {
          ...commonBody,
          houseNumber2List: ['１１'],
          buildingName1List: ['ビルＡ', 'ビルＢ', 'ビルＣ'],
        },
      }).as('postSearchAddress')

      // 「番地・号２」を選択
      cy.get('[data-cy="guarantee-search-address-house-number2-list-button"]').find('button').eq(0).click()
      cy.wait('@postSearchAddress').then(req => {
        expect(req.request.body).to.deep.equal({
          postalCode,
          prefecture: '東京都',
          municipality: '新宿区',
          largerSection: '市谷田町',
          section: null,
          houseNumber1: null,
          houseNumber2: '１１',
        })
      })

      // ボタンの表示確認
      cy.get('[data-cy="guarantee-search-address-house-number1-list-button"]').should('not.exist')
      cy.get('[data-cy="guarantee-search-address-house-number2-list-button"]').should('not.exist')
      cy.get('[data-cy="guarantee-search-address-house-number3-list-button"]').should('not.exist')
      cy.get('[data-cy="guarantee-search-address-building-name1-list-button"]').find('button').should('have.length', 4)

      // 次のインターセプト
      cy.intercept('POST', '**/ztgict/v1/iwan-util/search-address', {
        body: {
          postalCode,
          prefecture: '東京都',
          municipalityList: ['港区', '大田区'],
        },
      }).as('postSearchAddress')
      // 住所検索でリセット用のリクエストが実行されることを確認する
      cy.get('[data-cy="guarantee-search-address-postal-code"]').find('.submit-button').click()
      cy.wait('@postSearchAddress').then(req => {
        expect(req.request.body).to.deep.equal({
          postalCode,
        })
      })

      // ボタンの表示確認
      cy.get('[data-cy="guarantee-search-address-section-list-button"]').should('not.exist')
      cy.get('[data-cy="guarantee-search-address-municipality-list-button"]').find('button').should('have.length', 2)
    })

    it('住所検索のエラー', function () {
      const postalCode = '100-0000'
      const commonBody = {
        postalCode,
        prefecture: '東京都',
        municipalityList: ['新宿区'],
        largerSectionList: ['愛住町', '赤城下町', '赤城元町', '揚場町', '荒木町'],
      }

      // １回目の住所検索
      cy.intercept('POST', '**/ztgict/v1/iwan-util/search-address', {
        body: commonBody,
      }).as('postSearchAddress')

      // 新規作成画面に遷移
      cy.visit(`tenants/${this.tenantId}/guarantees/circuits/create`)
      cy.wait(['@getResourceSummaryGuaranteeList', '@getGuaranteeTermsOfServiceAccepted'])

      // 住所検索
      cy.get('[data-cy="guarantee-search-address-postal-code"]').find('input').type(postalCode)
      cy.get('[data-cy="guarantee-search-address-postal-code"]').find('.submit-button').click()
      cy.wait(['@postSearchAddress'])

      // 表示確認
      cy.get('[data-cy="guarantee-search-address-municipality-list-button"]').should('not.exist')
      cy.get('[data-cy="guarantee-search-address-larger-section-list-button"]')
        .find('button')
        .should('have.length', commonBody.largerSectionList.length)
      cy.get('[data-cy="guarantee-search-address-section-list-button"]').should('not.exist')
      cy.get('[data-cy="guarantee-search-address-house-number1-list-button"]').should('not.exist')
      cy.get('[data-cy="guarantee-search-address-house-number2-list-button"]').should('not.exist')
      cy.get('[data-cy="guarantee-search-address-house-number3-list-button"]').should('not.exist')
      cy.get('[data-cy="guarantee-search-address-building-name1-list-button"]').should('not.exist')
      cy.get('[data-cy="guarantee-search-address-building-name2-list-button"]').should('not.exist')
      cy.get('[data-cy="guarantee-search-address-building-name3-list-button"]').should('not.exist')
      cy.get('[data-cy="guarantee-search-address-building-facility-name-list-button"]').should('not.exist')

      // ２回目の住所検索
      cy.intercept('POST', '**/ztgict/v1/iwan-util/search-address', {
        statusCode: 500,
        body: { errorCode: 500, errorMessage: '500 Internal Server Error!' },
      }).as('postSearchAddress')

      // 住所検索を実行（500エラー）
      cy.get('[data-cy="guarantee-search-address-larger-section-list-button"]').find('button').eq(0).click()
      cy.wait('@postSearchAddress').then(req => {
        expect(req.request.body).to.deep.equal({
          postalCode,
          prefecture: commonBody.prefecture,
          municipality: commonBody.municipalityList[0],
          largerSection: commonBody.largerSectionList[0],
        })
      })

      // エラーダイアログの表示
      cy.get('[data-cy="notification-dialog-text"]').should(
        'have.text',
        `${t('message.failed')}\n500\n500 Internal Server Error!`,
      )
      cy.get('[data-cy="notification-dialog-submit-button"]').click()

      // 表示確認
      cy.get('[data-cy="guarantee-search-address-municipality-list-button"]').should('not.exist')
      cy.get('[data-cy="guarantee-search-address-larger-section-list-button"]')
        .find('button')
        .should('have.length', commonBody.largerSectionList.length)
      cy.get('[data-cy="guarantee-search-address-section-list-button"]').should('not.exist')
      cy.get('[data-cy="guarantee-search-address-house-number1-list-button"]').should('not.exist')
      cy.get('[data-cy="guarantee-search-address-house-number2-list-button"]').should('not.exist')
      cy.get('[data-cy="guarantee-search-address-house-number3-list-button"]').should('not.exist')
      cy.get('[data-cy="guarantee-search-address-building-name1-list-button"]').should('not.exist')
      cy.get('[data-cy="guarantee-search-address-building-name2-list-button"]').should('not.exist')
      cy.get('[data-cy="guarantee-search-address-building-name3-list-button"]').should('not.exist')
      cy.get('[data-cy="guarantee-search-address-building-facility-name-list-button"]').should('not.exist')

      // そのまま実行して同じリクエストが行われることを確認する
      cy.get('[data-cy="guarantee-search-address-larger-section-list-button"]').find('button').eq(1).click()
      cy.wait('@postSearchAddress').then(req => {
        expect(req.request.body).to.deep.equal({
          postalCode,
          prefecture: commonBody.prefecture,
          municipality: commonBody.municipalityList[0],
          largerSection: commonBody.largerSectionList[1],
        })
      })
    })
  })

  context('正常系', function () {
    beforeEach(function () {
      // 確認ボタンが押せるように時間固定
      cy.clock(outsideApplicationRestrictionAt(9, 0, 0, 0), ['Date'])

      // 共通の画面遷移
      cy.visit(`tenants/${this.tenantId}/guarantees/circuits`)
      cy.wait([
        '@getSession',
        '@getMobile',
        '@getResourceSummaryGuaranteeList',
        '@getGuaranteeList',
        '@getTerminalList',
      ])
      cy.get('[data-cy="guarantees-circuits-index-create-new-button"]').click()
      cy.wait(['@getResourceSummaryGuaranteeList', '@getGuaranteeTermsOfServiceAccepted'])
      cy.wait(1000)
    })

    it('ルーター種別: rentalTerminal, 物理帯域: 100M -> オーダー詳細', function () {
      cy.inputGuaranteeCreate({
        inputData: this.create100M,
        terminalType: 'rentalTerminal',
        reserveDate: { time, fieldSurveyMinDate, constructionMinDate },
        postalCode: this.searchAddress.postalCode,
      })

      // 確認ボタンが活性なことを確認する
      cy.get('@submitButton').should('not.be.disabled')
      // 全て入力後にアラート通知設定の threshold を未選択にした時 duration と notification-interval が 非活性 で 空になる
      cy.inputSelectForm({
        selector: '[data-cy="guarantees-circuits-create-internet-threshold"]',
        value: t('common.unselected'),
      })
      cy.get('[data-cy="guarantees-circuits-create-internet-duration"]')
        .find('input')
        .should('be.disabled')
        .should('have.value', '')
      cy.get('[data-cy="guarantees-circuits-create-internet-notification-interval"]')
        .find('input')
        .should('be.disabled')
        .should('have.value', '')
      cy.inputSelectForm({
        selector: '[data-cy="guarantees-circuits-create-vpn-threshold"]',
        value: t('common.unselected'),
      })
      cy.get('[data-cy="guarantees-circuits-create-vpn-duration"]')
        .find('input')
        .should('be.disabled')
        .should('have.value', '')
      cy.get('[data-cy="guarantees-circuits-create-vpn-notification-interval"]')
        .find('input')
        .should('be.disabled')
        .should('have.value', '')

      // 確認ボタンを押下
      cy.get('@submitButton').should('have.text', t('common.confirm')).click()
      // 保存ボタンを押下
      cy.get('@submitButton').should('have.text', t('common.create')).click()

      const request = {
        ...this.create100M,
        internet: { rateLimit: this.create100M.internet.rateLimit, alertSetting: undefined },
        vpn: { rateLimit: this.create100M.vpn.rateLimit, alertSetting: undefined },
        installationPlaceCode: this.searchAddress.installationPlaceCode,
        fieldSurvey: { ...this.create100M.fieldSurvey, date: fieldSurveyMinDate, time },
        construction: { ...this.create100M.construction, date: constructionMinDate, time },
      }
      cy.wait('@postRequest').then(req => {
        const stringify = JSON.stringify(request)
        expect(req.request.url).to.include('ztgict/v1/guarantees')
        expect(req.request.body).to.deep.equal(JSON.parse(stringify))
      })

      cy.get('.dialog-card-content').should(
        'have.text',
        t('guarantees.createdMessage', { detail: t('guarantees.circuitDetail') }),
      )
      cy.get('.dialog-base-submit-button').should('have.text', t('common.moveToOrderDetail')).click()
      // オーダー詳細画面に遷移する
      cy.wait('@getOrder')
      cy.url().should(
        'eq',
        `${Cypress.config().baseUrl}/tenants/${this.tenantId}/orders/550e8400e29b41d4a716446655440000`,
      )
      // オーダー詳細画面の戻るボタンを押して一覧画面に戻る
      cy.get('[data-cy="orders-id-index-return-button"]').should('have.text', t('common.return')).click()
      cy.wait(['@getResourceSummaryGuaranteeList', '@getGuaranteeList', '@getTerminalList'])
      cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/guarantees/circuits`)
    })

    it('ルーター種別: rentalTerminal, 物理帯域: 1G, (同じ連絡先) -> 閉じる', function () {
      cy.inputGuaranteeCreate({
        inputData: { ...this.create1G },
        terminalType: 'rentalTerminal',
        reserveDate: { time, fieldSurveyMinDate, constructionMinDate },
        postalCode: this.searchAddress.postalCode,
      })

      // 「事前連絡先と同じ」にチェック
      cy.get('[data-cy="edit-field-survey-and-construction-field-survey-attendance-information-label"]')
        .find('.checkbox')
        .click()
      cy.get('[data-cy="edit-field-survey-and-construction-construction-attendance-information-label"]')
        .find('.checkbox')
        .click()
      // 立会者情報 が 事前連絡先 の情報で上書きされて disabled になることを確認する
      cy.get('[data-cy="edit-field-survey-and-construction-field-survey-attendance-company-name"]')
        .find('input')
        .should('be.disabled')
        .should('have.value', this.create1G.fieldSurvey.preContactCompanyName)
      cy.get('[data-cy="edit-field-survey-and-construction-field-survey-attendance-person-name"]')
        .find('input')
        .should('be.disabled')
        .should('have.value', this.create1G.fieldSurvey.preContactPersonName)
      cy.get('[data-cy="edit-field-survey-and-construction-field-survey-attendance-phone-number"]')
        .find('input')
        .should('be.disabled')
        .should('have.value', this.create1G.fieldSurvey.preContactPhoneNumber)
      cy.get('[data-cy="edit-field-survey-and-construction-construction-attendance-company-name"]')
        .find('input')
        .should('be.disabled')
        .should('have.value', this.create1G.construction.preContactCompanyName)
      cy.get('[data-cy="edit-field-survey-and-construction-construction-attendance-person-name"]')
        .find('input')
        .should('be.disabled')
        .should('have.value', this.create1G.construction.preContactPersonName)
      cy.get('[data-cy="edit-field-survey-and-construction-construction-attendance-phone-number"]')
        .find('input')
        .should('be.disabled')
        .should('have.value', this.create1G.construction.preContactPhoneNumber)

      // 確認ボタンを押下
      cy.get('@submitButton').should('have.text', t('common.confirm')).click()
      // 保存ボタンを押下
      cy.get('@submitButton').should('have.text', t('common.create')).click()

      const request = {
        ...this.create1G,
        userInterfaceType: '1000BASE-T', // レンタルルーターの場合の固定値
        communicationMode: 'auto-nego', // レンタルルーターの場合の固定値
        installationPlaceCode: this.searchAddress.installationPlaceCode,
        fieldSurvey: {
          ...this.create1G.fieldSurvey,
          date: fieldSurveyMinDate,
          time,
          attendanceCompanyName: this.create1G.fieldSurvey.preContactCompanyName,
          attendancePersonName: this.create1G.fieldSurvey.preContactPersonName,
          attendancePhoneNumber: this.create1G.fieldSurvey.preContactPhoneNumber,
        },
        construction: {
          ...this.create1G.construction,
          date: constructionMinDate,
          time,
          attendanceCompanyName: this.create1G.construction.preContactCompanyName,
          attendancePersonName: this.create1G.construction.preContactPersonName,
          attendancePhoneNumber: this.create1G.construction.preContactPhoneNumber,
        },
      }
      cy.wait('@postRequest').then(req => {
        const stringify = JSON.stringify(request)
        expect(req.request.url).to.include('ztgict/v1/guarantees')
        expect(req.request.body).to.deep.equal(JSON.parse(stringify))
      })

      cy.get('.dialog-card-content').should(
        'have.text',
        t('guarantees.createdMessage', { detail: t('guarantees.circuitDetail') }),
      )
      cy.get('.dialog-base-submit-button').should('have.text', t('common.moveToOrderDetail'))

      // ダイアログの閉じるボタンを押す
      cy.get('.dialog-card-close').click()
      cy.get('.dialog-main').should('not.exist')

      // 一覧画面に戻る
      cy.wait(['@getResourceSummaryGuaranteeList', '@getGuaranteeList', '@getTerminalList'])
      cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/guarantees/circuits`)
    })

    it('ルーター種別: selfTerminal, 物理帯域: 100M, 現調レス希望: true', function () {
      cy.inputGuaranteeCreate({
        inputData: this.create100M,
        terminalType: 'selfTerminal',
        reserveDate: { time, fieldSurveyMinDate, constructionMinDate },
        postalCode: this.searchAddress.postalCode,
      })

      // 非表示確認
      cy.get('[data-cy="guarantees-circuits-create-field-survey-less"]')
        .find('[data-cy="guarantee-checkbox-with-terms-note"]')
        .should('not.exist')
      cy.get('[data-cy="guarantees-circuits-create-field-survey-less-file-id"]').should('not.exist')
      // 全て入力した後に fieldSurveyLess を true にする
      cy.get('[data-cy="guarantees-circuits-create-field-survey-less"]')
        .find('[data-cy="guarantee-checkbox-with-terms-checkbox-base"]')
        .click()
      // 確認事項をチェックするまでは確認ボタンが押せないことを確認する
      cy.get('@submitButton').should('be.disabled')
      // 現調レス希望のチェックボックスをクリック
      cy.get('[data-cy="guarantees-circuits-create-field-survey-less"]')
        .find('[data-cy="guarantee-checkbox-with-terms-checkbox"]')
        .should('have.length', 2)
        .each($el => {
          cy.wrap($el).find('.checkbox').click()
        })
      // 現調レスファイルの入力
      cy.fieldSurveyLessFileUpload({
        className: '[data-cy="guarantees-circuits-create-field-survey-less-file-id"]',
        aliasName: '@postUploadDocument',
        documentId: this.uploadDocumentId,
      })

      // 現地調査日の値が空になることを確認する
      cy.get('@fieldSurveyButton').should('be.disabled')
      cy.get('[data-cy="guarantees-circuits-create-field-survey-date-time"]')
        .find('input')
        .should('be.disabled')
        .should('have.value', '  ')
      // 宅内工事日の値はそのままになることを確認する
      cy.get('@constructionButton').should('not.be.disabled')
      cy.get('[data-cy="guarantees-circuits-create-construction-date-time"]')
        .find('input')
        .should('be.disabled')
        .should('have.value', `${constructionMinDate.replaceAll('-', '/')}  ${ScheduledTime[time] || ''}`)
      // 現地調査・宅内工事詳細情報の確認
      cy.assertEditFieldSurveyAndConstruction({
        fieldSurvey: { disabled: true },
        construction: this.create100M.construction,
      })

      // 確認ボタンを押下
      cy.get('@submitButton').should('have.text', t('common.confirm')).click()
      // 保存ボタンを押下
      cy.get('@submitButton').should('have.text', t('common.create')).click()

      const request = {
        ...this.create100M,
        installationPlaceCode: this.searchAddress.installationPlaceCode,
        fieldSurveyLess: true,
        fieldSurvey: undefined,
        construction: { ...this.create100M.construction, time, date: constructionMinDate },
        fieldSurveyLessInfo: {
          fieldSurveyLessFileId: this.uploadDocumentId,
        },
      }
      cy.wait('@postRequest').then(req => {
        const stringify = JSON.stringify(request)
        expect(req.request.url).to.include('ztgict/v1/guarantees')
        expect(req.request.body).to.deep.equal(JSON.parse(stringify))
      })

      cy.get('.dialog-card-content').should(
        'have.text',
        t('guarantees.createdMessageFieldSurveyLess', {
          detail: t('guarantees.circuitDetail'),
        }),
      )
      cy.get('.dialog-base-submit-button').should('have.text', t('common.moveToOrderDetail'))

      // ダイアログの閉じるボタンを押す
      cy.get('.dialog-card-close').click()
      cy.get('.dialog-main').should('not.exist')

      // 一覧画面に戻る
      cy.wait(['@getResourceSummaryGuaranteeList', '@getGuaranteeList', '@getTerminalList'])
      cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/guarantees/circuits`)
    })

    it('ルーター種別: selfTerminal, 物理帯域: 1G（稼働調整依頼・訪問時刻指定: fieldSurvey true, construction true）', function () {
      cy.inputGuaranteeCreate({
        inputData: { ...this.create1G, internet: { rateLimit: null }, vpn: { rateLimit: '1G' } },
        terminalType: 'selfTerminal',
        reserveDate: { time, fieldSurveyMinDate, constructionMinDate },
        postalCode: this.searchAddress.postalCode,
      })

      // 非表示確認
      cy.get('[data-cy="guarantees-circuits-create-field-survey-operation-adjustment"]')
        .find('[data-cy="guarantee-checkbox-with-terms-note"]')
        .should('not.exist')
      cy.get('[data-cy="guarantees-circuits-create-construction-operation-adjustment"]')
        .find('[data-cy="guarantee-checkbox-with-terms-note"]')
        .should('not.exist')
      // 全て入力した後に 稼働調整依頼・訪問時刻指定 を true にする
      // 稼働調整依頼・訪問時刻指定
      cy.get('[data-cy="guarantees-circuits-create-field-survey-operation-adjustment"]')
        .find('[data-cy="guarantee-checkbox-with-terms-checkbox-base"]')
        .click()
      cy.get('[data-cy="guarantees-circuits-create-construction-operation-adjustment"]')
        .find('[data-cy="guarantee-checkbox-with-terms-checkbox-base"]')
        .click()
      // 確認事項をチェックするまでは確認ボタンが押せないことを確認する
      cy.get('@submitButton').should('be.disabled')
      // 稼働調整依頼・訪問時刻指定のチェックボックスをクリック
      cy.get('[data-cy="guarantee-checkbox-with-terms-checkbox"]')
        .should('have.length', 2)
        .each($el => {
          cy.wrap($el).find('.checkbox').click()
        })

      // 現地調査日の値が空になっていることを確認する
      cy.get('@fieldSurveyButton').should('be.disabled')
      cy.get('[data-cy="guarantees-circuits-create-field-survey-date-time"]')
        .find('input')
        .should('be.disabled')
        .should('have.value', '  ')
      // 宅内工事日の値が空になっていることを確認する
      cy.get('@constructionButton').should('be.disabled')
      cy.get('[data-cy="guarantees-circuits-create-construction-date-time"]')
        .find('input')
        .should('be.disabled')
        .should('have.value', '  ')
      // 現地調査・宅内工事詳細情報の確認
      cy.assertEditFieldSurveyAndConstruction({
        fieldSurvey: this.create1G.fieldSurvey,
        construction: this.create1G.construction,
      })

      // 確認ボタンを押下
      cy.get('@submitButton').should('have.text', t('common.confirm')).click()
      // 保存ボタンを押下
      cy.get('@submitButton').should('have.text', t('common.create')).click()

      const request = {
        ...this.create1G,
        internet: {},
        vpn: { rateLimit: '1G' },
        installationPlaceCode: this.searchAddress.installationPlaceCode,
        fieldSurvey: { ...this.create1G.fieldSurvey, operationAdjustment: true, date: undefined, time: undefined },
        construction: { ...this.create1G.construction, operationAdjustment: true, date: undefined, time: undefined },
      }
      cy.wait('@postRequest').then(req => {
        const stringify = JSON.stringify(request)
        expect(req.request.url).to.include('ztgict/v1/guarantees')
        expect(req.request.body).to.deep.equal(JSON.parse(stringify))
      })

      cy.get('.dialog-card-content').should(
        'have.text',
        t('guarantees.createTicketMessage', {
          menu: t('common.create'),
          angora1: t('common.here'),
          angora2: t('common.here'),
        }),
      )
      cy.get('.dialog-base-submit-button').should('have.text', t('common.moveToOrderDetail'))

      // ダイアログの閉じるボタンを押す
      cy.get('.dialog-card-close').click()
      cy.get('.dialog-main').should('not.exist')

      // 一覧画面に戻る
      cy.wait(['@getResourceSummaryGuaranteeList', '@getGuaranteeList', '@getTerminalList'])
      cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/guarantees/circuits`)
    })

    it('ルーター種別: rentalTerminal, 物理帯域: 100M（稼働調整依頼・訪問時刻指定: fieldSurvey true, construction false)', function () {
      cy.inputGuaranteeCreate({
        inputData: this.create100M,
        terminalType: 'rentalTerminal',
        reserveDate: { time, fieldSurveyMinDate, constructionMinDate },
        postalCode: this.searchAddress.postalCode,
      })

      // 全て入力した後に fieldSurvey の 稼働調整依頼・訪問時刻指定 を true にする
      // 稼働調整依頼・訪問時刻指定
      cy.get('[data-cy="guarantees-circuits-create-field-survey-operation-adjustment"]')
        .find('[data-cy="guarantee-checkbox-with-terms-checkbox-base"]')
        .click()
      // 確認事項をチェックするまでは確認ボタンが押せないことを確認する
      cy.get('@submitButton').should('be.disabled')
      // 稼働調整依頼・訪問時刻指定のチェックボックスをクリック
      cy.get('[data-cy="guarantees-circuits-create-field-survey-operation-adjustment"]')
        .find('[data-cy="guarantee-checkbox-with-terms-checkbox"]')
        .find('.checkbox')
        .click()

      // 現地調査日の値が空になっていることを確認する
      cy.get('@fieldSurveyButton').should('be.disabled')
      cy.get('[data-cy="guarantees-circuits-create-field-survey-date-time"]')
        .find('input')
        .should('be.disabled')
        .should('have.value', '  ')
      // 宅内工事日の値が空になっていることを確認する
      cy.get('@constructionButton').should('be.disabled')
      cy.get('[data-cy="guarantees-circuits-create-construction-date-time"]')
        .find('input')
        .should('be.disabled')
        .should('have.value', '  ')
      // 現地調査・宅内工事詳細情報の確認
      cy.assertEditFieldSurveyAndConstruction({
        fieldSurvey: this.create100M.fieldSurvey,
        construction: this.create100M.construction,
      })

      // 確認ボタンを押下
      cy.get('@submitButton').should('have.text', t('common.confirm')).click()
      // 保存ボタンを押下
      cy.get('@submitButton').should('have.text', t('common.create')).click()

      const request = {
        ...this.create100M,
        installationPlaceCode: this.searchAddress.installationPlaceCode,
        fieldSurvey: { ...this.create100M.fieldSurvey, operationAdjustment: true, date: undefined, time: undefined },
        construction: { ...this.create100M.construction, operationAdjustment: false, date: undefined, time: undefined },
      }
      cy.wait('@postRequest').then(req => {
        const stringify = JSON.stringify(request)
        expect(req.request.url).to.include('ztgict/v1/guarantees')
        expect(req.request.body).to.deep.equal(JSON.parse(stringify))
      })

      cy.get('.dialog-card-content').should(
        'have.text',
        t('guarantees.createTicketMessage', {
          menu: t('common.create'),
          angora1: t('common.here'),
          angora2: t('common.here'),
        }),
      )
      cy.get('.dialog-base-submit-button').should('have.text', t('common.moveToOrderDetail'))

      // ダイアログの閉じるボタンを押す
      cy.get('.dialog-card-close').click()
      cy.get('.dialog-main').should('not.exist')

      // 一覧画面に戻る
      cy.wait(['@getResourceSummaryGuaranteeList', '@getGuaranteeList', '@getTerminalList'])
      cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/guarantees/circuits`)
    })

    it('ルーター種別: selfTerminal, 物理帯域: 1G（稼働調整依頼・訪問時刻指定: fieldSurvey false, construction true)', function () {
      cy.inputGuaranteeCreate({
        inputData: {
          ...this.create1G,
          userInterfaceType: '1000BASE-T',
          internet: { rateLimit: '1G' },
          vpn: { rateLimit: null },
        },
        terminalType: 'selfTerminal',
        reserveDate: { time, fieldSurveyMinDate, constructionMinDate },
        postalCode: this.searchAddress.postalCode,
      })

      // 全て入力した後に construction の 稼働調整依頼・訪問時刻指定 を true にする
      // 稼働調整依頼・訪問時刻指定
      cy.get('[data-cy="guarantees-circuits-create-construction-operation-adjustment"]')
        .find('[data-cy="guarantee-checkbox-with-terms-checkbox-base"]')
        .click()
      // 確認事項をチェックするまでは確認ボタンが押せないことを確認する
      cy.get('@submitButton').should('be.disabled')
      // 稼働調整依頼・訪問時刻指定のチェックボックスをクリック
      cy.get('[data-cy="guarantees-circuits-create-construction-operation-adjustment"]')
        .find('[data-cy="guarantee-checkbox-with-terms-checkbox"]')
        .find('.checkbox')
        .click()

      // 宅内工事日の値が空になっていることを確認する
      cy.get('@constructionButton').should('be.disabled')
      cy.get('[data-cy="guarantees-circuits-create-construction-date-time"]')
        .find('input')
        .should('be.disabled')
        .should('have.value', '  ')
      // 現地調査・宅内工事詳細情報の確認
      cy.assertEditFieldSurveyAndConstruction({
        fieldSurvey: this.create1G.fieldSurvey,
        construction: this.create1G.construction,
      })

      // 確認ボタンを押下
      cy.get('@submitButton').should('have.text', t('common.confirm')).click()
      // 保存ボタンを押下
      cy.get('@submitButton').should('have.text', t('common.create')).click()

      const request = {
        ...this.create1G,
        internet: { rateLimit: '1G' },
        vpn: {},
        userInterfaceType: '1000BASE-T',
        installationPlaceCode: this.searchAddress.installationPlaceCode,
        fieldSurvey: { ...this.create1G.fieldSurvey, operationAdjustment: false, date: fieldSurveyMinDate, time },
        construction: { ...this.create1G.construction, operationAdjustment: true, date: undefined, time: undefined },
      }
      cy.wait('@postRequest').then(req => {
        const stringify = JSON.stringify(request)
        expect(req.request.url).to.include('ztgict/v1/guarantees')
        expect(req.request.body).to.deep.equal(JSON.parse(stringify))
      })

      cy.get('.dialog-card-content').should(
        'have.text',
        t('guarantees.createTicketMessage', {
          menu: t('common.create'),
          angora1: t('common.here'),
          angora2: t('common.here'),
        }),
      )
      cy.get('.dialog-base-submit-button').should('have.text', t('common.moveToOrderDetail'))

      // ダイアログの閉じるボタンを押す
      cy.get('.dialog-card-close').click()
      cy.get('.dialog-main').should('not.exist')

      // 一覧画面に戻る
      cy.wait(['@getResourceSummaryGuaranteeList', '@getGuaranteeList', '@getTerminalList'])
      cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/guarantees/circuits`)
    })
  })

  context('ギャランティアクセス 新規作成画面の住所検索画面の動作', function () {
    const postalCode = '160-0023'

    beforeEach(function () {
      // 確認ボタンが押せるように時間固定
      cy.clock(outsideApplicationRestrictionAt(9, 0, 0, 0), ['Date'])
      // 共通の画面遷移
      cy.visit(`tenants/${this.tenantId}/guarantees/circuits/create`)
      cy.wait(['@getGuaranteeTermsOfServiceAccepted', '@getResourceSummaryGuaranteeList'])
    })

    it('「市区郡町村」の選択のときはリンクが表示されないこと', function () {
      cy.intercept('POST', '**/ztgict/v1/iwan-util/search-address', {
        fixture: 'guarantees/circuits/search-address-1',
      }).as('postSearchAddress')

      // 住所検索
      cy.get('[data-cy="guarantee-search-address-postal-code"]').find('input').type(postalCode)
      cy.get('[data-cy="guarantee-search-address-postal-code"]').find('.submit-button').click()
      cy.wait('@postSearchAddress')
      // 選択中住所
      cy.get('[data-cy="guarantee-search-address-address"]').should('have.text', '東京都')

      // ボタン非活性
      cy.get('[data-cy="guarantees-circuits-create-applicant-input-button"]')
        .should('have.text', t('ipoes.moveToApplicantInput'))
        .should('be.disabled')

      // メッセージ非表示
      cy.get('[data-cy="guarantee-search-address-unable-to-service"]').should('not.exist')
      // リンク非表示
      cy.get('[data-cy="guarantees-circuits-create-search-address-not-found"]').should('not.exist')
    })

    it('「大字・通称」の選択のときはリンクが表示されないこと', function () {
      cy.intercept('POST', '**/ztgict/v1/iwan-util/search-address', {
        fixture: 'guarantees/circuits/search-address-2',
      }).as('postSearchAddress')

      // 住所検索
      cy.get('[data-cy="guarantee-search-address-postal-code"]').find('input').type(postalCode)
      cy.get('[data-cy="guarantee-search-address-postal-code"]').find('.submit-button').click()
      cy.wait('@postSearchAddress')
      // 選択中住所
      cy.get('[data-cy="guarantee-search-address-address"]').should('have.text', '東京都千代田区')

      // ボタン非活性
      cy.get('[data-cy="guarantees-circuits-create-applicant-input-button"]')
        .should('have.text', t('ipoes.moveToApplicantInput'))
        .should('be.disabled')

      // メッセージ非表示
      cy.get('[data-cy="guarantee-search-address-unable-to-service"]').should('not.exist')
      // リンク非表示
      cy.get('[data-cy="guarantees-circuits-create-search-address-not-found"]').should('not.exist')
    })

    it('「字・丁目」の選択のときはリンクが表示されること', function () {
      cy.intercept('POST', '**/ztgict/v1/iwan-util/search-address', {
        fixture: 'guarantees/circuits/search-address-3',
      }).as('postSearchAddress')

      // 住所検索
      cy.get('[data-cy="guarantee-search-address-postal-code"]').find('input').type(postalCode)
      cy.get('[data-cy="guarantee-search-address-postal-code"]').find('.submit-button').click()
      cy.wait('@postSearchAddress')
      // 選択中住所
      cy.get('[data-cy="guarantee-search-address-address"]').should('have.text', '東京都千代田区大手町')

      // ボタン非活性
      cy.get('[data-cy="guarantees-circuits-create-applicant-input-button"]')
        .should('have.text', t('ipoes.moveToApplicantInput'))
        .should('be.disabled')

      // メッセージ非表示
      cy.get('[data-cy="guarantee-search-address-unable-to-service"]').should('not.exist')
      // リンク表示
      cy.get('[data-cy="guarantees-circuits-create-search-address-not-found"]').should(
        'have.text',
        t('guarantees.searchAddressNotFound'),
      )
    })

    it('「番地・号１」の選択のときはリンクが表示されること', function () {
      cy.intercept('POST', '**/ztgict/v1/iwan-util/search-address', {
        fixture: 'guarantees/circuits/search-address-4',
      }).as('postSearchAddress')

      // 住所検索
      cy.get('[data-cy="guarantee-search-address-postal-code"]').find('input').type(postalCode)
      cy.get('[data-cy="guarantee-search-address-postal-code"]').find('.submit-button').click()
      cy.wait('@postSearchAddress')
      // 選択中住所
      cy.get('[data-cy="guarantee-search-address-address"]').should('have.text', '東京都新宿区西新宿３丁目')

      // ボタン非活性
      cy.get('[data-cy="guarantees-circuits-create-applicant-input-button"]')
        .should('have.text', t('ipoes.moveToApplicantInput'))
        .should('be.disabled')

      // メッセージ非表示
      cy.get('[data-cy="guarantee-search-address-unable-to-service"]').should('not.exist')
      // リンク表示
      cy.get('[data-cy="guarantees-circuits-create-search-address-not-found"]').should(
        'have.text',
        t('guarantees.searchAddressNotFound'),
      )
    })

    it('「番地・号２」の選択のときはリンクが表示されること', function () {
      cy.intercept('POST', '**/ztgict/v1/iwan-util/search-address', {
        fixture: 'guarantees/circuits/search-address-5',
      }).as('postSearchAddress')

      // 住所検索
      cy.get('[data-cy="guarantee-search-address-postal-code"]').find('input').type(postalCode)
      cy.get('[data-cy="guarantee-search-address-postal-code"]').find('.submit-button').click()
      cy.wait('@postSearchAddress')
      // 選択中住所
      cy.get('[data-cy="guarantee-search-address-address"]').should('have.text', '東京都新宿区西新宿３丁目 １９')

      // ボタン非活性
      cy.get('[data-cy="guarantees-circuits-create-applicant-input-button"]')
        .should('have.text', t('ipoes.moveToApplicantInput'))
        .should('be.disabled')

      // メッセージ非表示
      cy.get('[data-cy="guarantee-search-address-unable-to-service"]').should('not.exist')
      // リンク表示
      cy.get('[data-cy="guarantees-circuits-create-search-address-not-found"]').should(
        'have.text',
        t('guarantees.searchAddressNotFound'),
      )
    })

    it('「番地・号３」の選択のときはリンクが表示されること', function () {
      cy.intercept('POST', '**/ztgict/v1/iwan-util/search-address', {
        fixture: 'guarantees/circuits/search-address-6',
      }).as('postSearchAddress')

      // 住所検索
      cy.get('[data-cy="guarantee-search-address-postal-code"]').find('input').type(postalCode)
      cy.get('[data-cy="guarantee-search-address-postal-code"]').find('.submit-button').click()
      cy.wait('@postSearchAddress')
      // 選択中住所
      cy.get('[data-cy="guarantee-search-address-address"]').should('have.text', '東京都新宿区西新宿３丁目 １９ー２０')

      // ボタン非活性
      cy.get('[data-cy="guarantees-circuits-create-applicant-input-button"]')
        .should('have.text', t('ipoes.moveToApplicantInput'))
        .should('be.disabled')

      // メッセージ非表示
      cy.get('[data-cy="guarantee-search-address-unable-to-service"]').should('not.exist')
      // リンク表示
      cy.get('[data-cy="guarantees-circuits-create-search-address-not-found"]').should(
        'have.text',
        t('guarantees.searchAddressNotFound'),
      )
    })

    it('「建物名１」の選択のときはリンクが表示されること', function () {
      cy.intercept('POST', '**/ztgict/v1/iwan-util/search-address', {
        fixture: 'guarantees/circuits/search-address-7',
      }).as('postSearchAddress')

      // 住所検索
      cy.get('[data-cy="guarantee-search-address-postal-code"]').find('input').type(postalCode)
      cy.get('[data-cy="guarantee-search-address-postal-code"]').find('.submit-button').click()
      cy.wait('@postSearchAddress')
      // 選択中住所
      cy.get('[data-cy="guarantee-search-address-address"]').should(
        'have.text',
        '東京都新宿区西新宿３丁目 １９ー２０ー１',
      )

      // ボタン非活性
      cy.get('[data-cy="guarantees-circuits-create-applicant-input-button"]')
        .should('have.text', t('ipoes.moveToApplicantInput'))
        .should('be.disabled')

      // メッセージ非表示
      cy.get('[data-cy="guarantee-search-address-unable-to-service"]').should('not.exist')
      // リンク表示
      cy.get('[data-cy="guarantees-circuits-create-search-address-not-found"]').should(
        'have.text',
        t('guarantees.searchAddressNotFound'),
      )
    })

    it('「建物名２」の選択のときはリンクが表示される', function () {
      cy.intercept('POST', '**/ztgict/v1/iwan-util/search-address', {
        fixture: 'guarantees/circuits/search-address-8',
      }).as('postSearchAddress')

      // 住所検索
      cy.get('[data-cy="guarantee-search-address-postal-code"]').find('input').type(postalCode)
      cy.get('[data-cy="guarantee-search-address-postal-code"]').find('.submit-button').click()
      cy.wait('@postSearchAddress')
      // 選択中住所
      cy.get('[data-cy="guarantee-search-address-address"]').should(
        'have.text',
        '東京都新宿区西新宿３丁目 １９ー２０ー１ 山田ビル',
      )

      // ボタン非活性
      cy.get('[data-cy="guarantees-circuits-create-applicant-input-button"]')
        .should('have.text', t('ipoes.moveToApplicantInput'))
        .should('be.disabled')

      // メッセージ非表示
      cy.get('[data-cy="guarantee-search-address-unable-to-service"]').should('not.exist')
      // リンク表示
      cy.get('[data-cy="guarantees-circuits-create-search-address-not-found"]').should(
        'have.text',
        t('guarantees.searchAddressNotFound'),
      )
    })

    it('「建物名３」の選択のときはリンクが表示されること', function () {
      cy.intercept('POST', '**/ztgict/v1/iwan-util/search-address', {
        fixture: 'guarantees/circuits/search-address-9',
      }).as('postSearchAddress')

      // 住所検索
      cy.get('[data-cy="guarantee-search-address-postal-code"]').find('input').type(postalCode)
      cy.get('[data-cy="guarantee-search-address-postal-code"]').find('.submit-button').click()
      cy.wait('@postSearchAddress')
      // 選択中住所
      cy.get('[data-cy="guarantee-search-address-address"]').should(
        'have.text',
        '東京都新宿区西新宿３丁目 １９ー２０ー１ 山田ビル ２階',
      )

      // ボタン非活性
      cy.get('[data-cy="guarantees-circuits-create-applicant-input-button"]')
        .should('have.text', t('ipoes.moveToApplicantInput'))
        .should('be.disabled')

      // メッセージ非表示
      cy.get('[data-cy="guarantee-search-address-unable-to-service"]').should('not.exist')
      // リンク表示
      cy.get('[data-cy="guarantees-circuits-create-search-address-not-found"]').should(
        'have.text',
        t('guarantees.searchAddressNotFound'),
      )
    })

    it('judgeで失敗したとき次へのボタンが非活性でメッセージが表示されること', function () {
      cy.intercept('POST', '**/ztgict/v1/iwan-util/judge', { serviceAvailable: false }).as('postJudge')

      // 住所検索
      cy.get('[data-cy="guarantee-search-address-postal-code"]').find('input').type(postalCode)
      cy.get('[data-cy="guarantee-search-address-postal-code"]').find('.submit-button').click()
      cy.wait(['@postSearchAddress', '@postJudge'])
      // 選択中住所
      cy.get('[data-cy="guarantee-search-address-address"]').should(
        'have.text',
        '東京都新宿区西新宿３丁目 １９ー２ー５ 山田ビル１ 山田ビル２ 大和ハイツ',
      )

      // ボタン非活性
      cy.get('[data-cy="guarantees-circuits-create-applicant-input-button"]')
        .should('have.text', t('ipoes.moveToApplicantInput'))
        .should('be.disabled')

      // メッセージ表示
      cy.get('[data-cy="guarantee-search-address-unable-to-service"]').should(
        'have.text',
        t('message.unableToProvideServices'),
      )
      // リンクは非表示
      cy.get('[data-cy="guarantees-circuits-create-search-address-not-found"]').should('not.exist')
    })

    it('「住所が見つからない場合」をクリックした時にダイアログが表示されて設置場所住所登録依頼画面に遷移すること', function () {
      cy.intercept('POST', '**/ztgict/v1/iwan-util/search-address', {
        fixture: 'guarantees/circuits/search-address-3',
      }).as('postSearchAddress')

      // 住所検索
      cy.get('[data-cy="guarantee-search-address-postal-code"]').find('input').type(postalCode)
      cy.get('[data-cy="guarantee-search-address-postal-code"]').find('.submit-button').click()
      cy.wait('@postSearchAddress')

      // リンクをクリック
      cy.get('[data-cy="guarantees-circuits-create-search-address-not-found"]').click()
      cy.get('.dialog-card-content').should('contain', t('guarantees.moveToAddressRegistrationRequestMessage'))

      // 「閉じる」ボタンを押下すると元の画面に戻る
      cy.get('.dialog-base-cancel-button').should('have.text', t('common.close')).click()
      cy.get('.dialog-card-content').should('not.exist')

      // 「住所登録依頼へ」ボタンを押下すると画面遷移することを確認する
      cy.get('[data-cy="guarantees-circuits-create-search-address-not-found"]').click()
      cy.get('.dialog-base-submit-button').should('have.text', t('guarantees.moveToAddressRegistrationRequest')).click()
      // query.stepがつく
      cy.url().should(
        'eq',
        `${Cypress.config().baseUrl}/tenants/${this.tenantId}/guarantees/address-registration-request?step=3`,
      )
    })
  })

  context('受付時間外メッセージの表示を確認', function () {
    beforeEach(function () {
      // 共通の画面遷移
      cy.visit(`tenants/${this.tenantId}/guarantees/circuits`)
      cy.wait(['@getSession', '@getMobile', '@getResourceSummaryGuaranteeList', '@getGuaranteeList'])
    })

    it('第３月曜日以外 - 受付時間外 - 日本時間(8:59)', function () {
      cy.clock(new Date('2024-04-21T23:59:59Z'), ['Date'])

      // 新規作成画面に遷移
      cy.get('[data-cy="guarantees-circuits-index-create-new-button"]').click()
      cy.wait(['@getResourceSummaryGuaranteeList', '@getGuaranteeTermsOfServiceAccepted'])

      // メッセージの表示確認
      cy.get('[data-cy="guarantees-circuits-create-outside-reception-hour"]').should('exist')
      // 住所検索 ができないことを確認
      cy.get('[data-cy="guarantee-search-address-postal-code"]').find('input').should('be.disabled')
      cy.get('[data-cy="guarantee-search-address-postal-code"]').find('.submit-button').should('be.disabled')

      // 次に進むボタンが非活性なことを確認する
      cy.get('[data-cy="guarantees-circuits-create-applicant-input-button"]').should('be.disabled')
    })
    it('第３月曜日以外 - 受付時間内 - 日本時間(9:00)', function () {
      cy.clock(new Date('2024-04-22T00:00:00Z'), ['Date'])

      // 新規作成画面に遷移
      cy.get('[data-cy="guarantees-circuits-index-create-new-button"]').click()
      cy.wait(['@getResourceSummaryGuaranteeList', '@getGuaranteeTermsOfServiceAccepted'])

      // メッセージの表示確認
      cy.get('[data-cy="guarantees-circuits-create-outside-reception-hour"]').should('not.exist')
      // 住所検索
      cy.get('[data-cy="guarantee-search-address-postal-code"]').find('input').type(this.searchAddress.postalCode)
      cy.get('[data-cy="guarantee-search-address-postal-code"]').find('.submit-button').click()
      cy.wait(['@postSearchAddress', '@postJudge'])

      // 次に進むボタンが活性なことを確認する
      cy.get('[data-cy="guarantees-circuits-create-applicant-input-button"]').should('not.be.disabled')
    })
    it('第３月曜日以外 - 受付時間内 - 日本時間(19:59)', function () {
      cy.clock(new Date('2024-04-22T10:59:59Z'), ['Date'])

      // 新規作成画面に遷移
      cy.get('[data-cy="guarantees-circuits-index-create-new-button"]').click()
      cy.wait(['@getResourceSummaryGuaranteeList', '@getGuaranteeTermsOfServiceAccepted'])

      // メッセージの表示確認
      cy.get('[data-cy="guarantees-circuits-create-outside-reception-hour"]').should('not.exist')
      // 住所検索
      cy.get('[data-cy="guarantee-search-address-postal-code"]').find('input').type(this.searchAddress.postalCode)
      cy.get('[data-cy="guarantee-search-address-postal-code"]').find('.submit-button').click()
      cy.wait(['@postSearchAddress', '@postJudge'])

      // 次に進むボタンが活性なことを確認する
      cy.get('[data-cy="guarantees-circuits-create-applicant-input-button"]').should('not.be.disabled')
    })
    it('第３月曜日以外 - 受付時間外 - 日本時間(20:00)', function () {
      cy.clock(new Date('2024-04-22T11:00:00Z'), ['Date'])

      // 新規作成画面に遷移
      cy.get('[data-cy="guarantees-circuits-index-create-new-button"]').click()
      cy.wait(['@getResourceSummaryGuaranteeList', '@getGuaranteeTermsOfServiceAccepted'])

      // メッセージの表示確認
      cy.get('[data-cy="guarantees-circuits-create-outside-reception-hour"]').should('exist')
      // 住所検索 ができないことを確認
      cy.get('[data-cy="guarantee-search-address-postal-code"]').find('input').should('be.disabled')
      cy.get('[data-cy="guarantee-search-address-postal-code"]').find('.submit-button').should('be.disabled')

      // 次に進むボタンが非活性なことを確認する
      cy.get('[data-cy="guarantees-circuits-create-applicant-input-button"]').should('be.disabled')
    })

    it('第３月曜日 - 受付時間外 - 日本時間(8:59)', function () {
      cy.clock(new Date('2024-04-14T23:59:59Z'), ['Date'])

      // 新規作成画面に遷移
      cy.get('[data-cy="guarantees-circuits-index-create-new-button"]').click()
      cy.wait(['@getResourceSummaryGuaranteeList', '@getGuaranteeTermsOfServiceAccepted'])

      // メッセージの表示確認
      cy.get('[data-cy="guarantees-circuits-create-outside-reception-hour"]').should('exist')
      // 住所検索 ができないことを確認
      cy.get('[data-cy="guarantee-search-address-postal-code"]').find('input').should('be.disabled')
      cy.get('[data-cy="guarantee-search-address-postal-code"]').find('.submit-button').should('be.disabled')

      // 次に進むボタンが非活性なことを確認する
      cy.get('[data-cy="guarantees-circuits-create-applicant-input-button"]').should('be.disabled')
    })
    it('第３月曜日 - 受付時間内 - 日本時間(9:00)', function () {
      cy.clock(new Date('2024-04-15T00:00:00Z'), ['Date'])

      // 新規作成画面に遷移
      cy.get('[data-cy="guarantees-circuits-index-create-new-button"]').click()
      cy.wait(['@getResourceSummaryGuaranteeList', '@getGuaranteeTermsOfServiceAccepted'])

      // メッセージの表示確認
      cy.get('[data-cy="guarantees-circuits-create-outside-reception-hour"]').should('not.exist')
      // 住所検索
      cy.get('[data-cy="guarantee-search-address-postal-code"]').find('input').type(this.searchAddress.postalCode)
      cy.get('[data-cy="guarantee-search-address-postal-code"]').find('.submit-button').click()
      cy.wait(['@postSearchAddress', '@postJudge'])

      // 次に進むボタンが活性なことを確認する
      cy.get('[data-cy="guarantees-circuits-create-applicant-input-button"]').should('not.be.disabled')
    })
    it('第３月曜日 - 受付時間内 - 日本時間(16:59)', function () {
      cy.clock(new Date('2024-04-15T07:59:59Z'), ['Date'])

      // 新規作成画面に遷移
      cy.get('[data-cy="guarantees-circuits-index-create-new-button"]').click()
      cy.wait(['@getResourceSummaryGuaranteeList', '@getGuaranteeTermsOfServiceAccepted'])

      // メッセージの表示確認
      cy.get('[data-cy="guarantees-circuits-create-outside-reception-hour"]').should('not.exist')
      // 住所検索
      cy.get('[data-cy="guarantee-search-address-postal-code"]').find('input').type(this.searchAddress.postalCode)
      cy.get('[data-cy="guarantee-search-address-postal-code"]').find('.submit-button').click()
      cy.wait(['@postSearchAddress', '@postJudge'])

      // 次に進むボタンが活性なことを確認する
      cy.get('[data-cy="guarantees-circuits-create-applicant-input-button"]').should('not.be.disabled')
    })
    it('第３月曜日 - 受付時間外 - 日本時間(17:00)', function () {
      cy.clock(new Date('2024-04-15T08:00:00Z'), ['Date'])

      // 新規作成画面に遷移
      cy.get('[data-cy="guarantees-circuits-index-create-new-button"]').click()
      cy.wait(['@getResourceSummaryGuaranteeList', '@getGuaranteeTermsOfServiceAccepted'])

      // メッセージの表示確認
      cy.get('[data-cy="guarantees-circuits-create-outside-reception-hour"]').should('exist')
      // 住所検索 ができないことを確認
      cy.get('[data-cy="guarantee-search-address-postal-code"]').find('input').should('be.disabled')
      cy.get('[data-cy="guarantee-search-address-postal-code"]').find('.submit-button').should('be.disabled')

      // 次に進むボタンが非活性なことを確認する
      cy.get('[data-cy="guarantees-circuits-create-applicant-input-button"]').should('be.disabled')
    })
  })
})
