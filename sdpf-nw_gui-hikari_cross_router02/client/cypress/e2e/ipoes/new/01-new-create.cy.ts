import { generateRandomHex, t, OUTSIDE_APPLICATION_RESTRICTION_AT } from '@cypress/support/utils'
import { BuildingTypes } from '@app/api/hikariCollaboUtil/constants'

const testCases = [
  {
    name: '標準プランで作成・POST後のレスポンスタイプ(fieldSurveyRequirement:true, ticketIssueRequirement: false)',
    fixturePath: 'ipoes/new/create-normal-detail-field-survey-requirement-true.json',
  },
  {
    name: 'ワイドプランで作成・POST後のレスポンスタイプ(fieldSurveyRequirement:false, ticketIssueRequirement: false)',
    fixturePath: 'ipoes/new/create-wide-detail-field-survey-requirement-false.json',
  },
  {
    name: 'ワイドプランで作成・POST後のレスポンスタイプ(fieldSurveyRequirement:false, ticketIssueRequirement: true)',
    fixturePath: 'ipoes/new/create-wide-detail-ticket-issue-requirement-true.json',
  },
]

describe('ベストエフォートIPoEアクセス 新規作成', () => {
  beforeEach(function () {
    // 期間限定の申込規制の影響を受けないよう規制期間外の日時に固定する(規制終了後に削除する)
    cy.clock(new Date(OUTSIDE_APPLICATION_RESTRICTION_AT), ['Date'])
    this.tenantId = generateRandomHex(32)
    cy.fixture('ipoes/search-address.json').then(searchAddress => {
      this.searchAddress = searchAddress
    })
    cy.intercept('GET', '**/ztgict/v1/settings/contractor', { fixture: 'contractor/detail' }).as('getContractor')
    cy.intercept('GET', '**/ztgict/v1/ipoe/hikari-collabo-util/available', { body: { available: true } }).as(
      'getAvailable',
    )
    cy.intercept('POST', '**/ztgict/v1/ipoe/hikari-collabo-util/search-address', {
      fixture: 'ipoes/search-address',
    }).as('postSearchAddress')
    cy.intercept('GET', '**/ztgict/v1/resource-summary/ipoe*', { fixture: 'ipoes/summary-list' }).as(
      'getSummaryIpoeList',
    )
    cy.intercept('GET', '**/ztgict/v1/ipoe*', { fixture: 'ipoes/list' }).as('getIpoeList')
    cy.intercept('POST', '**/ztgict/v1/ipoe/hikari-collabo-util/judge', { fixture: 'ipoes/judge' }).as('postJudge')
  })

  context('エラー', function () {
    it('住所検索の400エラー', function () {
      cy.intercept('POST', '**/ztgict/v1/ipoe/hikari-collabo-util/search-address', {
        statusCode: 400,
        body: { errorCode: 404, errorMessage: '404 Not Found!' },
      }).as('postSearchAddress')

      // 新規作成画面に遷移
      cy.visit(`/tenants/${this.tenantId}/ipoes/create`)
      cy.wait(['@getAvailable', '@getContractor'])

      // 申込種別選択
      cy.get('[data-cy="ipoe-create-request-type-radio-button"]').find('.label.new').click()

      // 住所検索 表示確認
      cy.get('[data-cy="search-address-building-type"]').should('exist')
      cy.get('[data-cy="search-address-error-message"]').should('not.exist')

      // 集合住宅／マンションタイプ を選択して400エラー
      cy.get('[data-cy="search-address-building-type"]').find(`.label.${BuildingTypes.Apartment}`).click()
      cy.get('[data-cy="search-address-postal-code"]').find('input').type('123-4567')
      cy.get('[data-cy="search-address-postal-code"]').find('.submit-button').click()
      cy.wait('@postSearchAddress')

      // 非表示確認
      cy.get('[data-cy="hikari-collabo-new-create-judge-error"]').should('not.exist')
      cy.get('[data-cy="search-address-municipality-list-button"]').should('not.exist')
      cy.get('[data-cy="search-address-larger-section-list-button"]').should('not.exist')
      cy.get('[data-cy="search-address-section-list-button"]').should('not.exist')
      cy.get('[data-cy="search-address-house-number1-list-button"]').should('not.exist')
      cy.get('[data-cy="search-address-house-number2-list-button"]').should('not.exist')
      cy.get('[data-cy="search-address-house-number3-list-button"]').should('not.exist')
      cy.get('[data-cy="search-address-building-name1-list-button"]').should('not.exist')
      cy.get('[data-cy="search-address-building-name2-list-button"]').should('not.exist')
      cy.get('[data-cy="search-address-building-name3-list-button"]').should('not.exist')
      cy.get('[data-cy="search-address-building-facility-name-list-button"]').should('not.exist')

      // エラーメッセージの表示確認
      cy.get('[data-cy="search-address-error-message"]').should('have.text', t('message.searchAddress'))

      // 戸建て／ファミリータイプ を選択した時の400エラー
      cy.get('[data-cy="search-address-building-type"]').find(`.label.${BuildingTypes.House}`).click()
      cy.get('[data-cy="search-address-postal-code"]').find('.submit-button').click()
      cy.wait('@postSearchAddress')
      cy.get('[data-cy="hikari-collabo-new-create-judge-error"]').should('not.exist')
      // エラーメッセージは表示されない
      cy.get('[data-cy="search-address-error-message"]').should('not.exist')
    })

    it('住所検索の500エラー', function () {
      const postalCode = '100-0000'
      const commonBody = {
        buildingType: BuildingTypes.Apartment,
        postalCode,
        prefecture: '東京都',
        municipalityList: ['新宿区'],
        largerSectionList: ['愛住町', '赤城下町', '赤城元町', '揚場町', '荒木町'],
      }

      // １回目の住所検索
      cy.intercept('POST', '**/ztgict/v1/ipoe/hikari-collabo-util/search-address', {
        body: commonBody,
      }).as('postSearchAddress')

      // 新規作成画面に遷移
      cy.visit(`/tenants/${this.tenantId}/ipoes/create`)
      cy.wait(['@getAvailable', '@getContractor'])

      // 申込種別選択
      cy.get('[data-cy="ipoe-create-request-type-radio-button"]').find('.label.new').click()
      // 集合住宅／マンションタイプ を選択して住所検索
      cy.get('[data-cy="search-address-building-type"]').find(`.label.${BuildingTypes.Apartment}`).click()
      cy.get('[data-cy="search-address-postal-code"]').find('input').type(postalCode)
      cy.get('[data-cy="search-address-postal-code"]').find('.submit-button').click()
      cy.wait('@postSearchAddress')

      // 表示確認
      cy.get('[data-cy="search-address-municipality-list-button"]').should('not.exist')
      cy.get('[data-cy="search-address-larger-section-list-button"]')
        .find('button')
        .should('have.length', commonBody.largerSectionList.length)
      cy.get('[data-cy="search-address-section-list-button"]').should('not.exist')
      cy.get('[data-cy="search-address-house-number1-list-button"]').should('not.exist')
      cy.get('[data-cy="search-address-house-number2-list-button"]').should('not.exist')
      cy.get('[data-cy="search-address-house-number3-list-button"]').should('not.exist')
      cy.get('[data-cy="search-address-building-name1-list-button"]').should('not.exist')
      cy.get('[data-cy="search-address-building-name2-list-button"]').should('not.exist')
      cy.get('[data-cy="search-address-building-name3-list-button"]').should('not.exist')
      cy.get('[data-cy="search-address-building-facility-name-list-button"]').should('not.exist')

      // ２回目の住所検索
      cy.intercept('POST', '**/ztgict/v1/ipoe/hikari-collabo-util/search-address', {
        statusCode: 500,
        body: { errorCode: 500, errorMessage: '500 Internal Server Error!' },
      }).as('postSearchAddress')

      // 住所検索を実行（500エラー）
      cy.get('[data-cy="search-address-larger-section-list-button"]').find('button').eq(0).click()
      cy.wait('@postSearchAddress').then(req => {
        expect(req.request.body).to.deep.equal({
          postalCode,
          buildingType: BuildingTypes.Apartment,
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

      // エラーメッセージの非表示確認
      cy.get('[data-cy="search-address-error-message"]').should('not.exist')
      // 表示確認
      cy.get('[data-cy="search-address-municipality-list-button"]').should('not.exist')
      cy.get('[data-cy="search-address-larger-section-list-button"]')
        .find('button')
        .should('have.length', commonBody.largerSectionList.length)
      cy.get('[data-cy="search-address-section-list-button"]').should('not.exist')
      cy.get('[data-cy="search-address-house-number1-list-button"]').should('not.exist')
      cy.get('[data-cy="search-address-house-number2-list-button"]').should('not.exist')
      cy.get('[data-cy="search-address-house-number3-list-button"]').should('not.exist')
      cy.get('[data-cy="search-address-building-name1-list-button"]').should('not.exist')
      cy.get('[data-cy="search-address-building-name2-list-button"]').should('not.exist')
      cy.get('[data-cy="search-address-building-name3-list-button"]').should('not.exist')
      cy.get('[data-cy="search-address-building-facility-name-list-button"]').should('not.exist')

      // そのまま実行して同じリクエストが行われることを確認する
      cy.get('[data-cy="search-address-larger-section-list-button"]').find('button').eq(1).click()
      cy.wait('@postSearchAddress').then(req => {
        expect(req.request.body).to.deep.equal({
          postalCode,
          buildingType: BuildingTypes.Apartment,
          prefecture: commonBody.prefecture,
          municipality: commonBody.municipalityList[0],
          largerSection: commonBody.largerSectionList[1],
        })
      })
    })

    it('住所検索のJudgeエラー', function () {
      cy.intercept('POST', '**/ztgict/v1/ipoe/hikari-collabo-util/judge', {
        statusCode: 400,
        body: { errorCode: 400, errorMessage: 'used accessline not found' },
      }).as('postJudge')

      // 新規作成画面に遷移
      cy.visit(`/tenants/${this.tenantId}/ipoes/create`)
      cy.wait(['@getAvailable', '@getContractor'])

      // 申込種別選択
      cy.get('[data-cy="ipoe-create-request-type-radio-button"]').find('.label.new').click()
      cy.get('[data-cy="hikari-collabo-new-create-judge-error"]').should('not.exist')

      // 住所検索
      cy.get('[data-cy="search-address-building-type"]').find(`.label.${BuildingTypes.Apartment}`).click()
      cy.get('[data-cy="search-address-postal-code"]').find('input').type('123-4567')
      cy.get('[data-cy="search-address-postal-code"]').find('.submit-button').click()
      cy.wait(['@postSearchAddress', '@postJudge'])

      // エラーダイアログの非表示
      cy.get('[data-cy="notification-dialog-text"]').should('not.exist')

      cy.get('[data-cy="hikari-collabo-new-move-to-applicant-input-button"]')
        .should('have.text', t('ipoes.moveToApplicantInput'))
        .should('be.disabled')
      cy.get('[data-cy="hikari-collabo-new-create-judge-error"]').should('exist')
      cy.get('[data-cy="search-address-error-message"]').should('not.exist')
    })

    it('現調・宅内工事予約に失敗した時に現調・宅内工事予約が再実行可能であることを確認する', function () {
      cy.fixture(testCases[0].fixturePath).then(data => {
        const { create, detail, fieldSurveyReserveDate, constructionRreserveDate } = data
        cy.intercept('POST', '**/ztgict/v1/ipoe/hikari-collabo', { body: detail }).as('postHikariCollaboNew')
        // 一覧画面から新規作成画面に遷移
        cy.visit(`/tenants/${this.tenantId}/ipoes`)
        cy.wait(['@getSummaryIpoeList', '@getIpoeList'])
        cy.get('[data-cy="ipoes-index-create-button"]').should('have.text', t('common.createNew')).click()
        cy.wait(['@getAvailable', '@getContractor'])

        // キャンペーンページ画面を経由せずに遷移することを確認する
        cy.get(`[data-cy="ipoe-${create.ipoeType}-plan-button"]`).should('not.exist')
        cy.get('[data-cy="ipoe-create-request-type-radio-button"]').should('exist')

        // 申込種別選択
        cy.get('[data-cy="ipoe-create-request-type-radio-button"]').find(`.label.${create.fletsOrderType}`).click()

        // 住所検索
        cy.get('[data-cy="search-address-building-type"]').should('exist')
        cy.get('[data-cy="search-address-building-type"]').find(`.label.${this.searchAddress.buildingType}`).click()
        cy.get('[data-cy="search-address-postal-code"]').find('input').type(this.searchAddress.postalCode)
        cy.get('[data-cy="search-address-postal-code"]').find('.submit-button').click()
        cy.wait(['@postSearchAddress', '@postJudge'])

        cy.get('[data-cy="hikari-collabo-new-move-to-applicant-input-button"]').click()
        cy.get('[data-cy="hikari-collabo-new-customer-note"]').find('input').type(create.customerNote)
        cy.get('[data-cy="hikari-collabo-new-flets-type"]').find(`.label.${create.fletsType}`).click()
        // 17683: キャンペーンページ画面を経由しなくなったため、この画面で ipoeType を選択する
        cy.get('[data-cy="hikari-collabo-new-ipoe-type"]').find('input').should('have.value', '')
        cy.inputSelectForm({
          selector: '[data-cy="hikari-collabo-new-ipoe-type"]',
          value: t(`ipoes.${create.ipoeType}`),
        })

        // appControl
        cy.get('[data-cy="hikari-collabo-new-app-control"]').should('not.exist')

        // 住所コード
        cy.get('[data-cy="hikari-collabo-new-installation-place-code"]')
          .find('input')
          .should('be.disabled')
          .should('have.value', this.searchAddress.installationPlaceCode)
        cy.get('[data-cy="hikari-collabo-new-on-site-repair-option"]')
          .find(`.label.${create.onSiteRepairOption}`)
          .click()

        // constructionOption
        cy.get('[data-cy="hikari-collabo-new-construction-option-site-route-survey"]')
          .find(`.label.${create.constructionOption.siteRouteSurvey}`)
          .click()
        // siteRouteSurvey = true の場合は lineConfirmation の入力欄が表示される
        cy.get('[data-cy="hikari-collabo-new-construction-option-line-confirmation"]')
          .find(`.label.${create.constructionOption.lineConfirmation}`)
          .click()

        cy.get('[data-cy="hikari-collabo-new-construction-option-wiring-route-construction"]')
          .find(`.label.${create.constructionOption.wiringRouteConstruction}`)
          .click()
        cy.get('[data-cy="hikari-collabo-new-construction-option-construction-result-report"]')
          .find(`.label.${create.constructionOption.constructionResultReport}`)
          .click()

        // constructionResultReport = true の場合は photographConsent の入力欄が表示される
        cy.get('[data-cy="hikari-collabo-new-construction-option-photograph-consent"]')
          .find(`.label.${create.constructionOption.photographConsent}`)
          .click()
        cy.get('[data-cy="hikari-collabo-new-construction-option-specified-visit-date-time"]')
          .find(`.label.${create.constructionOption.specifiedVisitDateTime}`)
          .click()

        // 確認
        cy.get('[data-cy="hikari-collabo-new-confirm-button"]').click()
        // 作成
        cy.get('[data-cy="hikari-collabo-new-submit-button"]').click()

        const request = {
          ...create,
          installationPlaceCode: this.searchAddress.installationPlaceCode,
          appControl: false,
          constructionOption: create.constructionOption,
        }
        cy.wait('@postHikariCollaboNew').then(req => {
          const stringify = JSON.stringify(request)
          expect(req.request.url).to.include('ztgict/v1/ipoe/hikari-collabo')
          expect(req.request.body).to.deep.equal(JSON.parse(stringify))
        })

        // 回線工事の申請確認ダイアログ表示
        cy.get('.dialog-card-content').should(
          'have.text',
          `${t('ipoeConstruction.createdMessage')}${t('ipoeConstruction.createdWarningMessage')}`,
        )
        cy.get('.dialog-base-submit-button').should('have.text', t('ipoeConstruction.moveToApplicantion')).click()

        // エラーメッセージは最初は非表示
        cy.get('[data-cy="reserve-date-dialog-reserve-construction-date-error"]').should('not.exist')
        // 現地調査日の予約 400エラーを起こす
        cy.inputReserveDateAndSubmit({ inputData: fieldSurveyReserveDate, errorCode: 400 })
        // 現地調査日の予約のダイアログが再表示される
        cy.get('[data-cy="reserve-date-dialog-reserve-construction-date-error"]').should('exist')
        cy.inputReserveDateAndSubmit({ inputData: fieldSurveyReserveDate, retry: true })

        // 工事日予約に進む
        cy.get('.dialog-base-submit-button').should('have.text', t('ipoeConstruction.constructionDateReserve')).click()
        cy.wait(100)
        // エラーメッセージは最初は非表示
        cy.get('[data-cy="reserve-date-dialog-reserve-construction-date-error"]').should('not.exist')
        // 工事日の予約 500エラーを起こす
        cy.inputReserveDateAndSubmit({ inputData: constructionRreserveDate, errorCode: 500 })
        // 工事日の予約のダイアログが再表示される
        cy.get('[data-cy="reserve-date-dialog-reserve-construction-date-error"]').should('exist')
        cy.inputReserveDateAndSubmit({ inputData: constructionRreserveDate, retry: true })
        // ダイアログを閉じる
        cy.get('.dialog-base-submit-button').should('have.text', t('common.close')).click()
        // 一覧画面に戻る
        cy.wait(['@getSummaryIpoeList', '@getIpoeList'])
        cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/ipoes`)
      })
    })
  })

  context('住所検索のテスト', function () {
    it('「次の候補を表示」ボタンを押した時のリクエスト値の確認', function () {
      const buildingType = BuildingTypes.House
      const postalCode = '100-0000'
      const nextRequestNumber = generateRandomHex(32)
      const commonBody = {
        buildingType,
        postalCode,
        prefecture: '東京都',
        municipalityList: ['新宿区'],
        largerSectionList: ['市谷田町'],
        sectionList: ['３丁目'],
      }

      // 「番地・号１」のリストを取得するインターセプト
      cy.intercept('POST', '**/ztgict/v1/ipoe/hikari-collabo-util/search-address', {
        body: { ...commonBody, houseNumber1List: ['１１'] },
      }).as('postSearchAddress')

      // 新規作成画面に遷移
      cy.visit(`/tenants/${this.tenantId}/ipoes/create`)
      cy.wait(['@getAvailable', '@getContractor'])

      // 申込種別選択
      cy.get('[data-cy="ipoe-create-request-type-radio-button"]').find('.label.new').click()
      cy.get('[data-cy="hikari-collabo-new-create-judge-error"]').should('not.exist')

      // 住所検索
      cy.get('[data-cy="search-address-building-type"]').find(`.label.${buildingType}`).click()
      cy.get('[data-cy="search-address-postal-code"]').find('input').type(postalCode)
      cy.get('[data-cy="search-address-postal-code"]').find('.submit-button').click()
      cy.wait(['@postSearchAddress'])

      // 「番地・号２」のリストを取得するインターセプト
      cy.intercept('POST', '**/ztgict/v1/ipoe/hikari-collabo-util/search-address', {
        body: {
          ...commonBody,
          houseNumber2List: ['１１０', '１２０'],
          nextRequestNumber,
        },
      }).as('postSearchAddress')

      // 「なし」ボタンを押下
      cy.get('[data-cy="search-address-house-number1-list-button"]').find('button').contains(t('ipoes.none')).click()
      cy.wait('@postSearchAddress').then(req => {
        expect(req.request.body).to.deep.equal({
          buildingType,
          postalCode,
          prefecture: '東京都',
          municipality: '新宿区',
          largerSection: '市谷田町',
          section: '３丁目',
          houseNumber1: null,
        })
      })

      // セレクトボタンの表示確認
      cy.get('[data-cy="search-address-municipality-list-button"]').should('not.exist')
      cy.get('[data-cy="search-address-larger-section-list-button"]').should('not.exist')
      cy.get('[data-cy="search-address-section-list-button"]').should('not.exist')
      cy.get('[data-cy="search-address-house-number1-list-button"]').should('not.exist')
      cy.get('[data-cy="search-address-house-number2-list-button"]').find('button').should('have.length', 3)
      cy.get('[data-cy="search-address-house-number3-list-button"]').should('not.exist')
      cy.get('[data-cy="search-address-building-name1-list-button"]').should('not.exist')
      cy.get('[data-cy="search-address-building-name2-list-button"]').should('not.exist')
      cy.get('[data-cy="search-address-building-name3-list-button"]').should('not.exist')
      cy.get('[data-cy="search-address-building-facility-name-list-button"]').should('not.exist')

      // 「番地・号３」の追加リストを取得するインターセプト
      cy.intercept('POST', '**/ztgict/v1/ipoe/hikari-collabo-util/search-address', {
        body: {
          ...commonBody,
          houseNumber3List: ['１１０', '２０', '３０', '４０'],
        },
      }).as('postSearchAddress')

      // 「次の候補を表示」ボタンを押下
      // 「なし」を選択したプロパティが追加されていること確認する
      cy.get('[data-cy="search-address-next-request-button"]').click()
      cy.wait('@postSearchAddress').then(req => {
        expect(req.request.body).to.deep.equal({
          buildingType,
          postalCode,
          prefecture: '東京都',
          municipality: '新宿区',
          largerSection: '市谷田町',
          section: '３丁目',
          houseNumber1: null,
          nextRequestNumber,
        })
      })

      // ボタンの表示確認
      cy.get('[data-cy="search-address-house-number2-list-button"]').should('not.exist')
      cy.get('[data-cy="search-address-house-number3-list-button"]').find('button').should('have.length', 5)
      cy.get('[data-cy="search-address-next-request-button"]').should('not.exist')

      // 次のインターセプト
      cy.intercept('POST', '**/ztgict/v1/ipoe/hikari-collabo-util/search-address', {
        body: {
          ...commonBody,
          houseNumber3List: ['１１０'],
          buildingName1List: ['ビルＡ', 'ビルＢ', 'ビルＣ'],
        },
      }).as('postSearchAddress')

      // 「番地・号３」を選択
      cy.get('[data-cy="search-address-house-number3-list-button"]').find('button').eq(0).click()
      cy.wait('@postSearchAddress').then(req => {
        expect(req.request.body).to.deep.equal({
          buildingType,
          postalCode,
          prefecture: '東京都',
          municipality: '新宿区',
          largerSection: '市谷田町',
          section: '３丁目',
          houseNumber1: null,
          houseNumber2: null,
          houseNumber3: '１１０',
        })
      })

      // ボタンの表示確認
      cy.get('[data-cy="search-address-house-number2-list-button"]').should('not.exist')
      cy.get('[data-cy="search-address-house-number3-list-button"]').should('not.exist')
      cy.get('[data-cy="search-address-building-name1-list-button"]').find('button').should('have.length', 4)

      // 次のインターセプト
      cy.intercept('POST', '**/ztgict/v1/ipoe/hikari-collabo-util/search-address', {
        body: {
          buildingType,
          postalCode,
          prefecture: '東京都',
          municipalityList: ['港区', '大田区'],
        },
      }).as('postSearchAddress')
      // 住所検索でリセット用のリクエストが実行されることを確認する
      cy.get('[data-cy="search-address-postal-code"]').find('.submit-button').click()
      cy.wait('@postSearchAddress').then(req => {
        expect(req.request.body).to.deep.equal({
          buildingType,
          postalCode,
        })
      })

      // ボタンの表示確認
      cy.get('[data-cy="search-address-section-list-button"]').should('not.exist')
      cy.get('[data-cy="search-address-municipality-list-button"]').find('button').should('have.length', 2)
    })
  })

  context('光回線一括提供型新設（光回線の新設申込）', function () {
    // 17683: キャンペーンページ画面は不要になったが、必要になる可能性があるため削除はしない
    it.skip('ワイドプランで必須項目を入力後、ワイドプラス for Web会議を未入力のまま標準プランに戻すと確認ボタンが有効になる', function () {
      cy.fixture('ipoes/new/create-wide-detail-field-survey-requirement-false.json').then(data => {
        const { create } = data

        // 新規作成画面に遷移
        cy.visit(`/tenants/${this.tenantId}/ipoes/create`)
        cy.wait(['@getAvailable', '@getContractor'])
        cy.get('[data-cy="ipoe-wide-plan-button"]').click()
        cy.get('[data-cy="ipoe-create-request-type-radio-button"]').should('exist')

        // 申込種別選択
        cy.get('[data-cy="ipoe-create-request-type-radio-button"]').find(`.label.${create.fletsOrderType}`).click()

        // 住所検索
        cy.get('[data-cy="search-address-building-type"]').should('exist')
        cy.get('[data-cy="search-address-building-type"]').find(`.label.${this.searchAddress.buildingType}`).click()
        cy.get('[data-cy="search-address-postal-code"]').find('input').type(this.searchAddress.postalCode)
        cy.get('[data-cy="search-address-postal-code"]').find('.submit-button').click()
        cy.wait(['@postSearchAddress', '@postJudge'])

        cy.get('[data-cy="hikari-collabo-new-move-to-applicant-input-button"]')
          .should('have.text', t('ipoes.moveToApplicantInput'))
          .click()

        cy.get('[data-cy="hikari-collabo-new-customer-note"]').find('input').type(create.customerNote)
        cy.get('[data-cy="hikari-collabo-new-flets-type"]').find(`.label.${create.fletsType}`).click()
        cy.get('[data-cy="hikari-collabo-new-ipoe-type"]').find('input').should('have.value', t('ipoes.wide'))

        // ワイドプラス for Web会議は未入力のままにする
        cy.get('[data-cy="hikari-collabo-new-app-control"]').find('.radio.checked').should('have.length', 0)

        cy.get('[data-cy="hikari-collabo-new-installation-place-code"]')
          .find('input')
          .should('be.disabled')
          .should('have.value', this.searchAddress.installationPlaceCode)
        cy.get('[data-cy="hikari-collabo-new-on-site-repair-option"]')
          .find(`.label.${create.onSiteRepairOption}`)
          .click()
        cy.get('[data-cy="hikari-collabo-new-construction-option-site-route-survey"]')
          .find(`.label.${create.constructionOption.siteRouteSurvey}`)
          .click()
        cy.get('[data-cy="hikari-collabo-new-construction-option-wiring-route-construction"]')
          .find(`.label.${create.constructionOption.wiringRouteConstruction}`)
          .click()
        cy.get('[data-cy="hikari-collabo-new-construction-option-construction-result-report"]')
          .find(`.label.${create.constructionOption.constructionResultReport}`)
          .click()
        cy.get('[data-cy="hikari-collabo-new-construction-option-specified-visit-date-time"]')
          .find(`.label.${create.constructionOption.specifiedVisitDateTime}`)
          .click()

        cy.get('[data-cy="hikari-collabo-new-confirm-button"]')
          .should('have.text', t('common.confirm'))
          .should('be.disabled')

        cy.inputSelectForm({ selector: '[data-cy="hikari-collabo-new-ipoe-type"]', value: t('ipoes.normal') })

        cy.get('[data-cy="hikari-collabo-new-ipoe-type"]').find('input').should('have.value', t('ipoes.normal'))
        cy.get('[data-cy="hikari-collabo-new-app-control"]').should('not.exist')
        cy.get('[data-cy="hikari-collabo-new-confirm-button"]')
          .should('have.text', t('common.confirm'))
          .should('not.be.disabled')
      })
    })

    testCases.forEach(testCase => {
      it(testCase.name, function () {
        cy.fixture(testCase.fixturePath).then(data => {
          const { create, detail, fieldSurveyReserveDate, constructionRreserveDate } = data
          cy.intercept('POST', '**/ztgict/v1/ipoe/hikari-collabo', { body: detail }).as('postHikariCollaboNew')
          // 一覧画面から新規作成画面に遷移
          cy.visit(`/tenants/${this.tenantId}/ipoes`)
          cy.wait(['@getSummaryIpoeList', '@getIpoeList'])
          cy.get('[data-cy="ipoes-index-create-button"]').should('have.text', t('common.createNew')).click()
          cy.wait(['@getAvailable', '@getContractor'])

          // キャンペーンページ画面を経由せずに遷移することを確認する
          cy.get(`[data-cy="ipoe-${create.ipoeType}-plan-button"]`).should('not.exist')
          cy.get('[data-cy="ipoe-create-request-type-radio-button"]').should('exist')

          // 申込種別選択
          cy.get('[data-cy="ipoe-create-request-type-radio-button"]').find(`.label.${create.fletsOrderType}`).click()

          // 住所検索
          cy.get('[data-cy="search-address-building-type"]').should('exist')
          cy.get('[data-cy="search-address-building-type"]').find(`.label.${this.searchAddress.buildingType}`).click()
          cy.get('[data-cy="search-address-postal-code"]').find('input').type(this.searchAddress.postalCode)
          cy.get('[data-cy="search-address-postal-code"]').find('.submit-button').click()
          cy.wait(['@postSearchAddress', '@postJudge'])

          cy.get('[data-cy="hikari-collabo-new-move-to-applicant-input-button"]')
            .should('have.text', t('ipoes.moveToApplicantInput'))
            .click()
          cy.get('[data-cy="hikari-collabo-new-customer-note"]').find('input').type(create.customerNote)
          cy.get('[data-cy="hikari-collabo-new-flets-type"]').find(`.label.${create.fletsType}`).click()
          // 17683: キャンペーンページ画面を経由しなくなったため、この画面で ipoeType を選択する
          cy.get('[data-cy="hikari-collabo-new-ipoe-type"]').find('input').should('have.value', '')
          cy.inputSelectForm({
            selector: '[data-cy="hikari-collabo-new-ipoe-type"]',
            value: t(`ipoes.${create.ipoeType}`),
          })

          // appControl
          if (create.ipoeType !== 'wide') {
            cy.get('[data-cy="hikari-collabo-new-app-control"]').should('not.exist')
          } else {
            cy.get('[data-cy="hikari-collabo-new-app-control"]').find(`.label.${create.appControl}`).click()
          }

          // 住所コード
          cy.get('[data-cy="hikari-collabo-new-installation-place-code"]')
            .find('input')
            .should('be.disabled')
            .should('have.value', this.searchAddress.installationPlaceCode)
          cy.get('[data-cy="hikari-collabo-new-on-site-repair-option"]')
            .find(`.label.${create.onSiteRepairOption}`)
            .click()

          // constructionOption
          cy.get('[data-cy="hikari-collabo-new-construction-option-site-route-survey"]')
            .find(`.label.${create.constructionOption.siteRouteSurvey}`)
            .click()
          if (create.constructionOption.siteRouteSurvey) {
            cy.get('[data-cy="hikari-collabo-new-construction-option-line-confirmation"]')
              .find(`.label.${create.constructionOption.lineConfirmation}`)
              .click()
          } else {
            cy.get('[data-cy="hikari-collabo-new-construction-option-line-confirmation"]').should('not.exist')
          }
          cy.get('[data-cy="hikari-collabo-new-construction-option-wiring-route-construction"]')
            .find(`.label.${create.constructionOption.wiringRouteConstruction}`)
            .click()
          cy.get('[data-cy="hikari-collabo-new-construction-option-construction-result-report"]')
            .find(`.label.${create.constructionOption.constructionResultReport}`)
            .click()
          if (create.constructionOption.constructionResultReport) {
            cy.get('[data-cy="hikari-collabo-new-construction-option-photograph-consent"]')
              .find(`.label.${create.constructionOption.photographConsent}`)
              .click()
            if (create.constructionOption.photographConsent) {
              cy.get('[data-cy="hikari-collabo-new-construction-option-photograph-consent-name"]')
                .find('input')
                .type(create.constructionOption.photographConsentName)
            } else {
              cy.get('[data-cy="hikari-collabo-new-construction-option-photograph-consent-name"]').should('not.exist')
            }
          } else {
            cy.get('[data-cy="hikari-collabo-new-construction-option-photograph-consent"]').should('not.exist')
            cy.get('[data-cy="hikari-collabo-new-construction-option-photograph-consent-name"]').should('not.exist')
          }
          cy.get('[data-cy="hikari-collabo-new-construction-option-specified-visit-date-time"]')
            .find(`.label.${create.constructionOption.specifiedVisitDateTime}`)
            .click()

          // 確認
          cy.get('[data-cy="hikari-collabo-new-return-button"]').should('have.text', t('common.return'))
          cy.get('[data-cy="hikari-collabo-new-confirm-button"]').should('have.text', t('common.confirm')).click()

          // 規約同意
          if (create.ipoeType === 'wide') {
            cy.get('[data-cy="hikari-collabo-terms-of-service-agreement"]').find('.checkbox').click()
          } else {
            cy.get('[data-cy="hikari-collabo-terms-of-service"]').should('not.exist')
          }

          // 作成
          cy.get('[data-cy="hikari-collabo-new-submit-button"]')
            .should('have.text', t('common.create'))
            .should('not.be.disabled')
            .click()

          const request = {
            ...create,
            installationPlaceCode: this.searchAddress.installationPlaceCode,
            appControl: create.ipoeType !== 'wide' ? false : create.appControl,
            constructionOption: {
              ...create.constructionOption,
              lineConfirmation: create.constructionOption.siteRouteSurvey
                ? create.constructionOption.lineConfirmation
                : undefined,
              photographConsent: create.constructionOption.constructionResultReport
                ? create.constructionOption.photographConsent
                : undefined,
              photographConsentName: create.constructionOption.constructionResultReport
                ? create.constructionOption.photographConsentName
                : undefined,
            },
          }
          cy.wait('@postHikariCollaboNew').then(req => {
            const stringify = JSON.stringify(request)
            expect(req.request.url).to.include('ztgict/v1/ipoe/hikari-collabo')
            expect(req.request.body).to.deep.equal(JSON.parse(stringify))
          })

          // チケット発行が必要な場合のダイアログ
          if (detail.ticketIssueRequirement) {
            cy.get('.dialog-card-content').should(
              'have.text',
              t('ipoeConstruction.createTicketMessage', { angora1: t('common.here'), angora2: t('common.here') }),
            )
            cy.get('.dialog-base-submit-button').should('have.text', t('common.close')).click()
            // 一覧画面に戻って終了
            cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/ipoes`)
            return
          }

          // 回線工事の申請確認ダイアログ表示
          cy.get('.dialog-card-content').should(
            'have.text',
            `${t('ipoeConstruction.createdMessage')}${t('ipoeConstruction.createdWarningMessage')}`,
          )
          cy.get('.dialog-base-submit-button').should('have.text', t('ipoeConstruction.moveToApplicantion')).click()

          if (detail.fieldSurveyRequirement) {
            // 現地調査日の予約
            cy.inputReserveDateAndSubmit({ inputData: fieldSurveyReserveDate })
            // 工事日予約に進む
            cy.get('.dialog-base-submit-button')
              .should('have.text', t('ipoeConstruction.constructionDateReserve'))
              .click()
            cy.wait(500)
          }
          // 工事日の予約
          cy.inputReserveDateAndSubmit({ inputData: constructionRreserveDate })
          // ダイアログを閉じる
          cy.get('.dialog-base-submit-button').should('have.text', t('common.close')).click()

          // 一覧画面に戻る
          cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/ipoes`)
          cy.wait(500)
        })
      })
    })
  })
})
