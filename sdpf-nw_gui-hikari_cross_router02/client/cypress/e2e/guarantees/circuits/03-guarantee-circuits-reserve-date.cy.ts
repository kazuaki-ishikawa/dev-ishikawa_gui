import dayjs from 'dayjs'
import { ScheduledTime } from '@app/api/hikariCollaboUtil/constants'
import type { TimeType, ConstructionDateType } from '@app/api/hikariCollaboUtil/types'
import { GuaranteeReserveDateAddCount, generateRandomHex, nDaysLater, t } from '@cypress/support/utils'

describe('guarantee reserve date', () => {
  // @getGuarantee のレスポンスに tenantId がある場合に @getTerminalList を追加する
  const detailWaitList = ['@getGuarantee', '@getCampaignList']

  const time = Object.keys(ScheduledTime)[0]
  const addConstructionNum = GuaranteeReserveDateAddCount.fieldSurvey + GuaranteeReserveDateAddCount.construction
  const constructionRejectedFixture = 'guarantees/circuits/detail-reserve-date-construction-rejected'
  const fieldSurveyRejectedFixture = 'guarantees/circuits/detail-reserve-date-field-survey-rejected'

  beforeEach(function () {
    this.tenantId = generateRandomHex(32)
    this.guaranteeId = generateRandomHex(32)

    cy.intercept('PUT', '**/ztgict/v1/orders/*', {}).as('putRequest')
    cy.intercept('GET', '**/ztgict/v1/campaigns*', { fixture: 'campaigns/list' }).as('getCampaignList')
    cy.intercept('GET', '**/ztgict/v1/resource-summary/terminals*', { fixture: 'terminals/list-some-items' }).as(
      'getTerminalList',
    )
  })

  context('現調レス:false', function () {
    beforeEach(function () {
      // 確認ボタンが押せるように時間固定
      cy.clock(new Date(new Date().setHours(9, 0, 0, 0)), ['Date'])
    })
    it('初期現調日・初期宅内工事日が過去日の場合', function () {
      const fieldSurveyMinDate = nDaysLater(GuaranteeReserveDateAddCount.fieldSurvey)
      const constructionMinDate = nDaysLater(addConstructionNum)
      // GET search-dateのレスポンス
      cy.fixture('guarantees/circuits/search-date.json').then(data => {
        const fieldSurvey = {
          constructionDates: data.constructionDates.map((d: ConstructionDateType) => ({
            ...d,
            scheduledDate: fieldSurveyMinDate,
          })),
        }
        const construction = {
          constructionDates: data.constructionDates.map((d: ConstructionDateType) => ({
            ...d,
            scheduledDate: constructionMinDate,
          })),
        }
        cy.intercept('GET', '**/ztgict/v1/iwan-util/search-date?type=fieldSurvey*', { body: fieldSurvey }).as(
          'getFieldSurveySearchDate',
        )
        cy.intercept('GET', '**/ztgict/v1/iwan-util/search-date?type=construction*', { body: construction }).as(
          'getConstructionSearchDate',
        )
      })

      const fieldSurveyDate = dayjs().subtract(addConstructionNum, 'days').format('YYYY-MM-DD')
      const constructionDate = dayjs().subtract(GuaranteeReserveDateAddCount.fieldSurvey, 'days').format('YYYY-MM-DD')
      cy.fixture(fieldSurveyRejectedFixture).then(detail => {
        const response = {
          ...detail,
          fieldSurveyLess: false,
          fieldSurvey: { ...detail.fieldSurvey, date: fieldSurveyDate, admissionApplicationRequired: true },
          construction: { ...detail.construction, date: constructionDate, admissionApplicationRequired: true },
        }
        cy.intercept('GET', '**/ztgict/v1/guarantees/*', { body: response }).as('getGuarantee')

        cy.visit(`tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}`)
        cy.wait(detailWaitList)

        // 現地調査・工事日予約ボタンが活性になっていること
        cy.get('[data-cy="guarantees-circuits-id-index-reserve-field-survey-construction-date-button"]').should(
          'not.be.disabled',
        )
        // 現地調査・工事日予約のダイアログを表示する
        cy.get('[data-cy="guarantees-circuits-id-index-reserve-field-survey-construction-date-button"]').click()

        // エイリアス設定
        cy.get('[data-cy="edit-field-survey-and-construction-dialog-field-survey-reserve-date-button"]').as(
          'fieldSurveyButton',
        )
        cy.get('[data-cy="edit-field-survey-and-construction-dialog-field-survey-date-time"]')
          .find('input')
          .as('fieldSurveyDateTime')
        cy.get('[data-cy="edit-field-survey-and-construction-dialog-construction-reserve-date-button"]').as(
          'constructionButton',
        )
        cy.get('[data-cy="edit-field-survey-and-construction-dialog-construction-date-time"]')
          .find('input')
          .as('constructionDateTime')

        // ダイアログの確認ボタンは変更していないので非活性
        cy.get('.dialog-base-submit-button').should('have.text', t('common.confirm')).should('be.disabled')

        // 現地調査 の 初期値
        // 現地調査 の 初期値 - 現地調査希望日のボタン
        cy.get('@fieldSurveyButton').should('not.be.disabled')

        // 現地調査 の 初期値 - 現調レス希望 - チェックレス で disabled になっていることを確認
        cy.get('[data-cy="edit-field-survey-and-construction-dialog-field-survey-less"]')
          .should('not.have.class', 'checked')
          .and('have.class', 'disabled')
        // 現地調査 の 初期値 - 入館の情報
        cy.get('[data-cy="edit-field-survey-and-construction-dialog-field-survey-admission-application-required"]')
          .find('.radio.checked.disabled')
          .find(`.label.${response.fieldSurvey.admissionApplicationRequired}`)
          .should('have.length', 1)

        // 現地調査 の 初期値 - 希望日・希望時間帯が空になっていること
        cy.get('@fieldSurveyDateTime').should('be.disabled').should('have.value', '  ')

        // 宅内工事 の 初期値
        // 宅内工事 の 初期値 - 現調日が空になる場合「工事希望日を選択」ボタンは disabled になる
        cy.get('@constructionButton').should('be.disabled')
        // 宅内工事 の 初期値 - 入館の情報
        cy.get('[data-cy="edit-field-survey-and-construction-dialog-construction-admission-application-required"]')
          .find('.radio.checked.disabled')
          .find(`.label.${response.construction.admissionApplicationRequired}`)
          .should('have.length', 1)
        // 宅内工事 の 初期値 - 希望日・希望時間帯が空になっていること
        cy.get('@constructionDateTime').should('be.disabled').should('have.value', '  ')

        // 現地調査詳細情報・宅内工事詳細情報の初期値をチェック
        cy.assertEditFieldSurveyAndConstruction({
          fieldSurvey: { ...response.fieldSurvey, disabled: true },
          construction: { ...response.construction, disabled: true },
        })

        // 現地調査希望日を選択
        cy.get('@fieldSurveyButton').click()
        cy.wait('@getFieldSurveySearchDate')
        cy.get('[data-cy="guarantee-reserve-date-table"]').as('dateTable')
        cy.get('.dialog-base-submit-button').as('submitButton')
        cy.checkGuaranteeYearMonthSelectOptions({ minDate: fieldSurveyMinDate })

        // 現地調査希望日を選択 - 入力済みの項目はない
        cy.get('@dateTable').find('.radio.checked').should('have.length', 0)
        cy.get('@submitButton').should('be.disabled')
        // 現地調査希望日を選択 - ラジオボタンを選択して閉じる
        cy.get('@dateTable').find('.time-table-cell .button').first().click()
        cy.get('@submitButton').should('have.text', t('common.save')).should('not.be.disabled').click()

        // 現地調査希望日を選択 - 現地調査希望日と希望時間帯の入力値を確認
        cy.get('@fieldSurveyDateTime')
          .should('be.disabled')
          .should('have.value', `${fieldSurveyMinDate}  ${ScheduledTime[time as TimeType] || ''}`)

        // 工事希望日を選択
        cy.get('@constructionButton').should('not.be.disabled').click()
        cy.wait('@getConstructionSearchDate')

        // 工事希望日を選択 - 入力済みの項目はない
        cy.get('@dateTable').find('.radio.checked').should('have.length', 0)
        cy.get('@submitButton').should('be.disabled')
        cy.checkGuaranteeYearMonthSelectOptions({ minDate: constructionMinDate })

        // 工事希望日を選択 - ラジオボタンを選択して閉じる
        cy.get('@dateTable').find('.time-table-cell .button').first().click()
        cy.get('@submitButton').should('have.text', t('common.save')).should('not.be.disabled').click()

        // 工事希望日を選択 - 工事希望日と希望時間帯の入力値を確認
        cy.get('@constructionDateTime')
          .should('be.disabled')
          .should('have.value', `${constructionMinDate}  ${ScheduledTime[time as TimeType] || ''}`)

        // 確認ボタンを押下
        cy.get('.dialog-base-cancel-button').should('have.text', t('common.close'))
        cy.get('.dialog-base-submit-button').should('have.text', t('common.confirm')).click()
        // 保存ボタンを押下
        cy.get('.dialog-base-cancel-button').should('have.text', t('common.return'))
        cy.get('.dialog-base-submit-button').should('have.text', t('common.save')).click()

        // 更新内容の確認
        cy.wait('@putRequest').then(req => {
          expect(req.request.url).to.include(`ztgict/v1/orders/${response.orderId}`)
          expect(req.request.body).to.deep.equal({
            request: {
              fieldSurvey: { date: fieldSurveyMinDate, time },
              construction: { date: constructionMinDate, time },
            },
          })
        })

        // PUT orders/{orderId} の成功メッセージを確認
        cy.get('[data-cy="notification-dialog-text"]').should(
          'have.text',
          t('guarantees.updateFieldSurveyAndConstructionOrderMessage'),
        )
        cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
        cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.close')).click()

        // ダイアログが閉じていることを確認する
        cy.get('[data-cy="notification-dialog-text"]').should('not.exist')
        cy.url().should(
          'eq',
          `${Cypress.config().baseUrl}/tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}`,
        )
      })
    })

    it('初期現調日・初期宅内工事日が未来日の場合(更新値: 工事日を現調日+16暦日以上に設定する)', function () {
      const fieldSurveyMinDate = nDaysLater(GuaranteeReserveDateAddCount.fieldSurvey + 1)
      const constructionMinDate = nDaysLater(addConstructionNum + 2)
      // GET search-dateのレスポンス
      cy.fixture('guarantees/circuits/search-date.json').then(data => {
        const fieldSurvey = {
          constructionDates: data.constructionDates.map((d: ConstructionDateType) => ({
            ...d,
            scheduledDate: fieldSurveyMinDate,
          })),
        }
        const construction = {
          constructionDates: data.constructionDates.map((d: ConstructionDateType) => ({
            ...d,
            scheduledDate: constructionMinDate,
          })),
        }
        cy.intercept('GET', '**/ztgict/v1/iwan-util/search-date?type=fieldSurvey*', { body: fieldSurvey }).as(
          'getFieldSurveySearchDate',
        )
        cy.intercept('GET', '**/ztgict/v1/iwan-util/search-date?type=construction*', { body: construction }).as(
          'getConstructionSearchDate',
        )
      })

      const fieldSurveyDate = dayjs(fieldSurveyMinDate).add(-1, 'days').format('YYYY-MM-DD')
      const constructionDate = dayjs(constructionMinDate).add(-1, 'days').format('YYYY-MM-DD')

      cy.fixture(fieldSurveyRejectedFixture).then(detail => {
        const response = {
          ...detail,
          fieldSurveyLess: false,
          fieldSurvey: {
            ...detail.fieldSurvey,
            time: Object.keys(ScheduledTime)[1],
            date: fieldSurveyDate,
            admissionApplicationRequired: false,
          },
          construction: {
            ...detail.construction,
            time: Object.keys(ScheduledTime)[2],
            date: constructionDate,
            admissionApplicationRequired: false,
          },
        }
        cy.intercept('GET', '**/ztgict/v1/guarantees/*', { body: response }).as('getGuarantee')

        cy.visit(`tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}`)
        cy.wait(detailWaitList)

        // 現地調査・工事日予約ボタンが活性になっていること
        cy.get('[data-cy="guarantees-circuits-id-index-reserve-field-survey-construction-date-button"]').should(
          'not.be.disabled',
        )
        // 現地調査・工事日予約のダイアログを表示する
        cy.get('[data-cy="guarantees-circuits-id-index-reserve-field-survey-construction-date-button"]').click()

        // エイリアス設定
        cy.get('[data-cy="edit-field-survey-and-construction-dialog-field-survey-reserve-date-button"]').as(
          'fieldSurveyButton',
        )
        cy.get('[data-cy="edit-field-survey-and-construction-dialog-field-survey-date-time"]')
          .find('input')
          .as('fieldSurveyDateTime')
        cy.get('[data-cy="edit-field-survey-and-construction-dialog-construction-reserve-date-button"]').as(
          'constructionButton',
        )
        cy.get('[data-cy="edit-field-survey-and-construction-dialog-construction-date-time"]')
          .find('input')
          .as('constructionDateTime')

        // ダイアログの確認ボタンは変更していないので非活性
        cy.get('.dialog-base-submit-button').should('have.text', t('common.confirm')).should('be.disabled')

        // 現地調査 の 初期値
        // 現地調査 の 初期値 - 「現地調査希望日を選択」のボタンは 活性 になる
        cy.get('@fieldSurveyButton').should('not.be.disabled')
        // 現地調査 の 初期値 - 希望日・希望時間帯が入っていること
        cy.get('@fieldSurveyDateTime').should('have.value', '  ')
        // 現地調査 の 初期値 - 入館の情報
        cy.get('[data-cy="edit-field-survey-and-construction-dialog-field-survey-admission-application-required"]')
          .find('.radio.checked.disabled')
          .find(`.label.${response.fieldSurvey.admissionApplicationRequired}`)
          .should('have.length', 1)

        // 宅内工事 の 初期値
        // 宅内工事 の 初期値 -「工事希望日を選択」ボタンは disable になる
        cy.get('@constructionButton').should('be.disabled')
        // 宅内工事 の 初期値 - 入館の情報
        cy.get('[data-cy="edit-field-survey-and-construction-dialog-construction-admission-application-required"]')
          .find('.radio.checked.disabled')
          .find(`.label.${response.construction.admissionApplicationRequired}`)
          .should('have.length', 1)
        // 宅内工事 の 初期値 - 希望日・希望時間帯が入っていること
        cy.get('@constructionDateTime')
          .should('be.disabled')
          .should(
            'have.value',
            `${response.construction.date}  ${ScheduledTime[response.construction.time as TimeType] || ''}`,
          )

        // 現地調査希望日を選択
        cy.get('@fieldSurveyButton').click()
        cy.wait('@getFieldSurveySearchDate')
        cy.get('[data-cy="guarantee-reserve-date-table"]').as('dateTable')
        // 現地調査希望日を選択 - レスポンスに含まれないため、入力済みの項目が存在しない
        cy.get('@dateTable').find('.radio.checked').should('have.length', 0)
        cy.get('.dialog-base-submit-button').should('be.disabled')
        cy.checkGuaranteeYearMonthSelectOptions({ minDate: fieldSurveyMinDate })
        // 現地調査希望日を選択 - ラジオボタンを選択して閉じる
        cy.get('@dateTable').find('.time-table-cell .button').first().click()
        cy.get('.dialog-base-submit-button').should('have.text', t('common.save')).click()

        // 現地調査希望日を選択 - 現地調査希望日と希望時間帯の入力値を確認
        cy.get('@fieldSurveyDateTime')
          .should('be.disabled')
          .should('have.value', `${fieldSurveyMinDate}  ${ScheduledTime[time as TimeType] || ''}`)

        // 現地調査希望日を選択 - 宅内工事希望日と希望時間帯の入力値が初期値のままなことを確認
        cy.get('@constructionDateTime')
          .should('be.disabled')
          .should(
            'have.value',
            `${response.construction.date}  ${ScheduledTime[response.construction.time as TimeType] || ''}`,
          )

        // 工事希望日を選択
        cy.get('@constructionButton').should('not.be.disabled').click()
        cy.wait('@getConstructionSearchDate')

        // 工事希望日を選択
        // constructionMinDate と constructionDate が同じ月の場合フロントエンドで予約済みの枠を再追加するため、入力済みの項目がある
        if (dayjs(constructionMinDate).isSame(constructionDate, 'months')) {
          cy.get('@dateTable').find('.radio.checked').should('have.length', 1)
          cy.get('.dialog-base-submit-button').should('not.be.disabled')
          cy.get('@dateTable').find('.dates > div').should('have.length', 2)
        } else {
          cy.get('[data-cy="guarantee-reserve-date-table"]').find('.radio.checked').should('have.length', 0)
          cy.get('.dialog-base-submit-button').should('be.disabled')
          cy.get('[data-cy="guarantee-reserve-date-table"]').find('.dates > div').should('have.length', 1)
        }
        cy.checkGuaranteeYearMonthSelectOptions({ minDate: constructionMinDate })

        // 工事希望日を選択 - ラジオボタンを選択して閉じる
        cy.get('@dateTable').find('.time-table-cell .button').last().click()
        cy.get('.dialog-base-submit-button').should('have.text', t('common.save')).click()

        // 工事希望日を選択 - 工事希望日と希望時間帯の入力値を確認
        cy.get('@constructionDateTime')
          .should('be.disabled')
          .should('have.value', `${constructionMinDate}  ${ScheduledTime['15-17'] || ''}`)

        // 確認ボタンを押下
        cy.get('.dialog-base-cancel-button').should('have.text', t('common.close'))
        cy.get('.dialog-base-submit-button').should('have.text', t('common.confirm')).click()
        // 保存ボタンを押下
        cy.get('.dialog-base-cancel-button').should('have.text', t('common.return'))
        cy.get('.dialog-base-submit-button').should('have.text', t('common.save')).click()

        // 更新内容の確認
        cy.wait('@putRequest').then(req => {
          expect(req.request.url).to.include(`ztgict/v1/orders/${response.orderId}`)
          expect(req.request.body).to.deep.equal({
            request: {
              fieldSurvey: { date: fieldSurveyMinDate, time },
              construction: { date: constructionMinDate, time: '15-17' },
            },
          })
        })

        // PUT orders/{orderId} の成功メッセージを確認
        cy.get('[data-cy="notification-dialog-text"]').should(
          'have.text',
          t('guarantees.updateFieldSurveyAndConstructionOrderMessage'),
        )
        cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
        cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.close')).click()

        // ダイアログが閉じていることを確認する
        cy.get('[data-cy="notification-dialog-text"]').should('not.exist')
        cy.url().should(
          'eq',
          `${Cypress.config().baseUrl}/tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}`,
        )
      })
    })
  })

  context('現調レス:true', function () {
    beforeEach(function () {
      // 確認ボタンが押せるように時間固定
      cy.clock(new Date(new Date().setHours(9, 0, 0, 0)), ['Date'])
    })
    it('初期工事日が過去の場合', function () {
      const constructionMinDate = nDaysLater(addConstructionNum)
      // GET search-dateのレスポンス
      cy.fixture('guarantees/circuits/search-date.json').then(data => {
        const construction = {
          constructionDates: data.constructionDates.map((d: ConstructionDateType) => ({
            ...d,
            scheduledDate: constructionMinDate,
          })),
        }
        cy.intercept('GET', '**/ztgict/v1/iwan-util/search-date?type=construction*', { body: construction }).as(
          'getConstructionSearchDate',
        )
      })

      const constructionDate = dayjs().add(-1, 'days').format('YYYY-MM-DD')
      cy.fixture(constructionRejectedFixture).then(detail => {
        const response = {
          ...detail,
          fieldSurveyLess: true,
          fieldSurvey: undefined,
          construction: { ...detail.construction, date: constructionDate, admissionApplicationRequired: true },
        }
        cy.intercept('GET', '**/ztgict/v1/guarantees/*', { body: response }).as('getGuarantee')

        cy.visit(`tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}`)
        cy.wait(detailWaitList)

        // 現地調査・工事日予約のダイアログを表示する
        cy.get('[data-cy="guarantees-circuits-id-index-reserve-field-survey-construction-date-button"]').click()

        // エイリアス設定
        cy.get('[data-cy="edit-field-survey-and-construction-dialog-field-survey-reserve-date-button"]').as(
          'fieldSurveyButton',
        )
        cy.get('[data-cy="edit-field-survey-and-construction-dialog-field-survey-date-time"]')
          .find('input')
          .as('fieldSurveyDateTime')
        cy.get('[data-cy="edit-field-survey-and-construction-dialog-construction-reserve-date-button"]').as(
          'constructionButton',
        )
        cy.get('[data-cy="edit-field-survey-and-construction-dialog-construction-date-time"]')
          .find('input')
          .as('constructionDateTime')

        // ダイアログの確認ボタンは変更していないので非活性
        cy.get('.dialog-base-submit-button').should('have.text', t('common.confirm')).should('be.disabled')

        // 現地調査 の 初期値
        // 現地調査 の 初期値 - 現地調査希望日のボタン
        cy.get('@fieldSurveyButton').should('be.disabled')

        // 現地調査 の 初期値 - 現調レス希望 - チェック済み で disabled になっていることを確認
        cy.get('[data-cy="edit-field-survey-and-construction-dialog-field-survey-less"]')
          .should('have.class', 'checked')
          .and('have.class', 'disabled')
        // 現地調査 の 初期値 - 入館の情報にチェックが入ってないこと
        cy.get('[data-cy="edit-field-survey-and-construction-dialog-field-survey-admission-application-required"]')
          .find('.radio.checked.disabled')
          .should('have.length', 0)
        // 現地調査 の 初期値 - 希望日・希望時間帯が空になっていること
        cy.get('@fieldSurveyDateTime').should('be.disabled').should('have.value', '  ')

        // 宅内工事 の 初期値
        // 宅内工事 の 初期値 -「工事希望日を選択」ボタンは enable になる
        cy.get('@constructionButton').should('not.be.disabled')
        // 宅内工事 の 初期値 - 入館の情報
        cy.get('[data-cy="edit-field-survey-and-construction-dialog-construction-admission-application-required"]')
          .find('.radio.checked.disabled')
          .find(`.label.${response.construction.admissionApplicationRequired}`)
          .should('have.length', 1)
        // 宅内工事 の 初期値 - 希望日・希望時間帯が空になっていること
        cy.get('@constructionDateTime').should('be.disabled').should('have.value', '  ')

        // 現地調査詳細情報・宅内工事詳細情報の初期値をチェック
        cy.assertEditFieldSurveyAndConstruction({
          fieldSurvey: { ...response.fieldSurvey, disabled: true },
          construction: { ...response.construction, disabled: true },
        })

        // 工事希望日を選択
        cy.get('@constructionButton').click()
        cy.wait('@getConstructionSearchDate')

        // エイリアス
        cy.get('[data-cy="guarantee-reserve-date-table"]').as('dateTable')
        cy.get('.dialog-base-submit-button').as('submitButton')

        // 工事希望日を選択 - 過去日なので入力済みの項目はない
        cy.get('@dateTable').find('.radio.checked').should('have.length', 0)
        // 工事希望日を選択 - 過去日なので初期工事は追加されない
        cy.get('@dateTable').find('.dates > div').should('have.length', 1)
        cy.get('@submitButton').should('be.disabled')
        cy.checkGuaranteeYearMonthSelectOptions({ minDate: constructionMinDate })

        // 工事希望日を選択 - ラジオボタンを選択して閉じる
        cy.get('@dateTable').find('.time-table-cell .button').first().click()
        cy.get('@submitButton').should('have.text', t('common.save')).should('not.be.disabled').click()

        // 工事希望日を選択 - 工事希望日と希望時間帯の入力値を確認
        cy.get('@constructionDateTime')
          .should('be.disabled')
          .should('have.value', `${constructionMinDate}  ${ScheduledTime[time as TimeType] || ''}`)

        // 確認ボタンを押下
        cy.get('.dialog-base-cancel-button').should('have.text', t('common.close'))
        cy.get('.dialog-base-submit-button').should('have.text', t('common.confirm')).click()
        // 保存ボタンを押下
        cy.get('.dialog-base-cancel-button').should('have.text', t('common.return'))
        cy.get('.dialog-base-submit-button').should('have.text', t('common.save')).click()

        // 更新内容の確認
        cy.wait('@putRequest').then(req => {
          expect(req.request.url).to.include(`ztgict/v1/orders/${response.orderId}`)
          expect(req.request.body).to.deep.equal({
            request: {
              construction: { date: constructionMinDate, time },
            },
          })
        })

        // PUT orders/{orderId} の成功メッセージを確認
        cy.get('[data-cy="notification-dialog-text"]').should(
          'have.text',
          t('guarantees.updateFieldSurveyAndConstructionOrderMessage'),
        )
        cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
        cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.close')).click()

        // ダイアログが閉じていることを確認する
        cy.get('[data-cy="notification-dialog-text"]').should('not.exist')
        cy.url().should(
          'eq',
          `${Cypress.config().baseUrl}/tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}`,
        )
      })
    })

    it('初期工事日が未来日の場合(否認の場合)', function () {
      const constructionMinDate = nDaysLater(addConstructionNum)
      // GET search-dateのレスポンス
      cy.fixture('guarantees/circuits/search-date.json').then(data => {
        const construction = {
          constructionDates: data.constructionDates.map((d: ConstructionDateType) => ({
            ...d,
            scheduledDate: constructionMinDate,
          })),
        }
        cy.intercept('GET', '**/ztgict/v1/iwan-util/search-date?type=construction*', { body: construction }).as(
          'getConstructionSearchDate',
        )
      })

      const constructionDate = dayjs()
        .add(addConstructionNum - 1, 'days')
        .format('YYYY-MM-DD')
      cy.fixture(constructionRejectedFixture).then(detail => {
        const response = {
          ...detail,
          fieldSurveyLess: true,
          fieldSurvey: undefined,
          construction: { ...detail.construction, date: constructionDate, admissionApplicationRequired: true },
        }
        cy.intercept('GET', '**/ztgict/v1/guarantees/*', { body: response }).as('getGuarantee')

        cy.visit(`tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}`)
        cy.wait(detailWaitList)

        // 現地調査・工事日予約のダイアログを表示する
        cy.get('[data-cy="guarantees-circuits-id-index-reserve-field-survey-construction-date-button"]').click()

        // エイリアス設定
        cy.get('[data-cy="edit-field-survey-and-construction-dialog-construction-reserve-date-button"]').as(
          'constructionButton',
        )
        cy.get('[data-cy="edit-field-survey-and-construction-dialog-construction-date-time"]')
          .find('input')
          .as('constructionDateTime')

        // 宅内工事 の 初期値
        // 宅内工事 の 初期値 - 否認されたため 値が空になっていること
        cy.get('@constructionDateTime').should('be.disabled').should('have.value', '  ')

        // 工事希望日を選択
        cy.get('@constructionButton').click()
        cy.wait('@getConstructionSearchDate')

        // エイリアス
        cy.get('[data-cy="guarantee-reserve-date-table"]').as('dateTable')
        cy.get('.dialog-base-submit-button').as('submitButton')

        // 工事希望日を選択
        // constructionMinDate と constructionDate が同じ月の場合フロントエンドで予約済みの枠を再追加するため、入力済みの項目がある
        if (dayjs(constructionMinDate).isSame(constructionDate, 'months')) {
          // 否認のパターンなので選択済みの項目はなし
          cy.get('@dateTable').find('.radio.checked').should('have.length', 0)
          cy.get('.dialog-base-submit-button').should('be.disabled')
          cy.get('@dateTable').find('.dates > div').should('have.length', 2)
        } else {
          cy.get('[data-cy="guarantee-reserve-date-table"]').find('.radio.checked').should('have.length', 0)
          cy.get('.dialog-base-submit-button').should('be.disabled')
          cy.get('[data-cy="guarantee-reserve-date-table"]').find('.dates > div').should('have.length', 1)
        }
        cy.checkGuaranteeYearMonthSelectOptions({ minDate: constructionMinDate })

        // 工事希望日を選択 - ラジオボタンを選択して閉じる
        cy.get('@dateTable').find('.time-table-cell .button').last().click()
        cy.get('@submitButton').should('have.text', t('common.save')).should('not.be.disabled').click()

        // 工事希望日を選択 - 工事希望日と希望時間帯の入力値を確認
        cy.get('@constructionDateTime')
          .should('be.disabled')
          .should('have.value', `${constructionMinDate}  ${ScheduledTime['15-17'] || ''}`)

        // 確認ボタンを押下
        cy.get('.dialog-base-cancel-button').should('have.text', t('common.close'))
        cy.get('.dialog-base-submit-button').should('have.text', t('common.confirm')).click()
        // 保存ボタンを押下
        cy.get('.dialog-base-cancel-button').should('have.text', t('common.return'))
        cy.get('.dialog-base-submit-button').should('have.text', t('common.save')).click()

        // 更新内容の確認
        cy.wait('@putRequest').then(req => {
          expect(req.request.url).to.include(`ztgict/v1/orders/${response.orderId}`)
          expect(req.request.body).to.deep.equal({
            request: {
              construction: { date: constructionMinDate, time: '15-17' },
            },
          })
        })

        // PUT orders/{orderId} の成功メッセージを確認
        cy.get('[data-cy="notification-dialog-text"]').should(
          'have.text',
          t('guarantees.updateFieldSurveyAndConstructionOrderMessage'),
        )
        cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
        cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.close')).click()

        // ダイアログが閉じていることを確認する
        cy.get('[data-cy="notification-dialog-text"]').should('not.exist')
        cy.url().should(
          'eq',
          `${Cypress.config().baseUrl}/tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}`,
        )
      })
    })

    it('初期工事日が本日の場合の初期値(未来日と同じ)/GET search-date のレスポンスが空の場合', function () {
      // GET search-dateのレスポンス
      cy.intercept('GET', '**/ztgict/v1/iwan-util/search-date?type=construction*', {
        body: { constructionDates: [] },
      }).as('getConstructionSearchDate')

      const constructionDate = dayjs().format('YYYY-MM-DD')
      cy.fixture(constructionRejectedFixture).then(detail => {
        const response = {
          ...detail,
          fieldSurveyLess: true,
          fieldSurvey: undefined,
          construction: { ...detail.construction, date: constructionDate, admissionApplicationRequired: true },
        }
        cy.intercept('GET', '**/ztgict/v1/guarantees/*', { body: response }).as('getGuarantee')

        cy.visit(`tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}`)
        cy.wait(detailWaitList)

        // 現地調査・工事日予約のダイアログを表示する
        cy.get('[data-cy="guarantees-circuits-id-index-reserve-field-survey-construction-date-button"]').click()

        // エイリアス設定
        cy.get('[data-cy="edit-field-survey-and-construction-dialog-construction-reserve-date-button"]').as(
          'constructionButton',
        )
        cy.get('[data-cy="edit-field-survey-and-construction-dialog-construction-date-time"]')
          .find('input')
          .as('constructionDateTime')

        // 宅内工事 の 初期値
        // 宅内工事 の 初期値 - 否認されたため 値が空になっていること
        cy.get('@constructionDateTime').should('be.disabled').should('have.value', '  ')

        // 工事希望日を選択
        cy.get('@constructionButton').click()
        cy.wait('@getConstructionSearchDate')

        // エイリアス
        cy.get('[data-cy="guarantee-reserve-date-table"]').as('dateTable')
        cy.get('.dialog-base-submit-button').as('submitButton')

        // 工事希望日を選択
        cy.get('.dialog-base-submit-button').should('be.disabled')
        cy.get('@dateTable').find('.dates > div').should('have.length', 1)
        cy.checkGuaranteeYearMonthSelectOptions({ minDate: constructionDate })

        // 候補年月の最後の月を選択
        cy.get('[data-cy="guarantee-reserve-date-table-year-month"]').find('li').last().click()
        cy.wait('@getConstructionSearchDate')

        // レスポンスがないのでメッセージ表示
        cy.get('.dialog-card-content').should('contain', t('ipoeConstruction.nothingReservableDate'))
        cy.get('@submitButton').should('be.disabled')
      })
    })
  })

  context('現調レス:false, 稼働調整依頼・訪問時刻指定:true の場合（ダイアログは開ける）', function () {
    beforeEach(function () {
      // 確認ボタンが押せるように時間固定
      cy.clock(new Date(new Date().setHours(9, 0, 0, 0)), ['Date'])
    })
    it('fieldSurvey, construction のどちらも true の場合、どちらも更新不可', function () {
      cy.fixture(fieldSurveyRejectedFixture).then(detail => {
        const response = {
          ...detail,
          fieldSurveyLess: false,
          fieldSurvey: {
            ...detail.fieldSurvey,
            desiredDates: [
              { priority: 1, date: dayjs().add(2, 'days').format('YYYY-MM-DD'), time: '9-12' },
              { priority: 3, date: dayjs().add(1, 'days').format('YYYY-MM-DD'), time: '9-12' },
              { priority: 2, date: dayjs().add(1, 'days').format('YYYY-MM-DD'), time: '13-17' },
            ],
            operationAdjustment: true,
            time: null,
            date: null,
            admissionApplicationRequired: false,
          },
          construction: {
            ...detail.construction,
            operationAdjustment: true,
            desiredDates: [
              { priority: 2, date: dayjs().add(2, 'days').format('YYYY-MM-DD'), time: '13-15' },
              { priority: 3, date: dayjs().add(2, 'days').format('YYYY-MM-DD'), time: '9-12' },
              { priority: 1, date: dayjs().add(1, 'days').format('YYYY-MM-DD'), time: '13-17' },
            ],
            time: null,
            date: null,
            admissionApplicationRequired: false,
          },
        }
        cy.intercept('GET', '**/ztgict/v1/guarantees/*', { body: response }).as('getGuarantee')

        cy.visit(`tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}`)
        cy.wait(detailWaitList)

        // 現地調査・工事日予約のダイアログを表示する
        cy.get('[data-cy="guarantees-circuits-id-index-reserve-field-survey-construction-date-button"]').click()

        // 現地調査の希望日が空になるので、編集可能な対象がない
        cy.get('[data-cy="edit-field-survey-and-construction-dialog-field-survey-reserve-date-button"]').should(
          'be.disabled',
        )
        cy.get('[data-cy="edit-field-survey-and-construction-dialog-field-survey-operation-adjustment"]')
          .should('have.class', 'checked')
          .and('have.class', 'disabled')
        cy.get('[data-cy="edit-field-survey-and-construction-dialog-construction-reserve-date-button"]')

          .should('be.disabled')
        cy.get('[data-cy="edit-field-survey-and-construction-dialog-construction-operation-adjustment"]')
          .should('have.class', 'checked')
          .and('have.class', 'disabled')
      })
    })

    it('fieldSurvey が true の場合、どちらも更新不可', function () {
      const constructionMinDate = nDaysLater(addConstructionNum)
      cy.fixture(constructionRejectedFixture).then(detail => {
        const response = {
          ...detail,
          fieldSurveyLess: false,
          fieldSurvey: {
            ...detail.fieldSurvey,
            operationAdjustment: true,
            desiredDates: [
              { priority: 2, date: dayjs().add(2, 'days').format('YYYY-MM-DD'), time: '13-15' },
              { priority: 3, date: dayjs().add(2, 'days').format('YYYY-MM-DD'), time: '9-12' },
              { priority: 1, date: dayjs().add(1, 'days').format('YYYY-MM-DD'), time: '13-17' },
            ],
            time: null,
            date: null,
            admissionApplicationRequired: false,
          },
          construction: {
            ...detail.construction,
            time: Object.keys(ScheduledTime)[1],
            date: constructionMinDate,
            admissionApplicationRequired: false,
          },
        }
        cy.intercept('GET', '**/ztgict/v1/guarantees/*', { body: response }).as('getGuarantee')

        cy.visit(`tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}`)
        cy.wait(detailWaitList)

        // 現地調査・工事日予約のダイアログを表示する
        cy.get('[data-cy="guarantees-circuits-id-index-reserve-field-survey-construction-date-button"]').click()

        // 現地調査の希望日が空になるので、編集可能な対象がない
        cy.get('[data-cy="edit-field-survey-and-construction-dialog-field-survey-reserve-date-button"]').should(
          'be.disabled',
        )
        cy.get('[data-cy="edit-field-survey-and-construction-dialog-construction-reserve-date-button"]').should(
          'be.disabled',
        )
        cy.get('[data-cy="edit-field-survey-and-construction-dialog-construction-operation-adjustment"]')
          .should('not.have.class', 'checked')
          .and('have.class', 'disabled')
      })
    })

    it('construction が true の場合、fieldSurvey のみ更新可能', function () {
      const fieldSurveyMinDate = nDaysLater(GuaranteeReserveDateAddCount.fieldSurvey)
      // GET search-dateのレスポンス
      cy.fixture('guarantees/circuits/search-date.json').then(data => {
        const fieldSurvey = {
          constructionDates: data.constructionDates.map((d: ConstructionDateType) => ({
            ...d,
            scheduledDate: fieldSurveyMinDate,
          })),
        }
        cy.intercept('GET', '**/ztgict/v1/iwan-util/search-date?type=fieldSurvey*', { body: fieldSurvey }).as(
          'getFieldSurveySearchDate',
        )
      })

      cy.fixture(constructionRejectedFixture).then(detail => {
        const response = {
          ...detail,
          fieldSurveyLess: false,
          fieldSurvey: {
            ...detail.fieldSurvey,
            time: Object.keys(ScheduledTime)[1],
            date: fieldSurveyMinDate,
            admissionApplicationRequired: false,
          },
          construction: {
            ...detail.construction,
            operationAdjustment: true,
            desiredDates: [
              { priority: 2, date: dayjs().add(2, 'days').format('YYYY-MM-DD'), time: '13-15' },
              { priority: 3, date: dayjs().add(2, 'days').format('YYYY-MM-DD'), time: '9-12' },
              { priority: 1, date: dayjs().add(1, 'days').format('YYYY-MM-DD'), time: '13-17' },
            ],
            time: null,
            date: null,
            admissionApplicationRequired: false,
          },
        }
        cy.intercept('GET', '**/ztgict/v1/guarantees/*', { body: response }).as('getGuarantee')

        cy.visit(`tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}`)
        cy.wait(detailWaitList)

        // 現地調査・工事日予約のダイアログを表示する
        cy.get('[data-cy="guarantees-circuits-id-index-reserve-field-survey-construction-date-button"]').click()

        // 現地調査の 稼働調整依頼・訪問指定のチェックが外れていることを確認する
        cy.get('[data-cy="edit-field-survey-and-construction-dialog-field-survey-operation-adjustment"]')
          .should('not.have.class', 'checked')
          .and('have.class', 'disabled')
        // 工事希望日を選択のボタンは disable になる
        cy.get('[data-cy="edit-field-survey-and-construction-dialog-construction-reserve-date-button"]')
          .as('constructionButton')
          .should('be.disabled')

        // 現地調査希望日を選択しなおす
        cy.get('[data-cy="edit-field-survey-and-construction-dialog-field-survey-reserve-date-button"]').click()
        cy.wait('@getFieldSurveySearchDate')

        // 時間を選択
        cy.get('[data-cy="guarantee-reserve-date-table"]').find('.time-table-cell .button').first().click()
        cy.get('.dialog-base-submit-button').should('have.text', t('common.save')).should('not.be.disabled').click()

        // 工事希望日を選択のボタンは disable のまま
        cy.get('@constructionButton').should('be.disabled')

        // 確認ボタンを押下
        cy.get('.dialog-base-submit-button').click()
        // 保存ボタンを押下
        cy.get('.dialog-base-submit-button').click()

        // 更新内容の確認
        cy.wait('@putRequest').then(req => {
          expect(req.request.url).to.include(`ztgict/v1/orders/${response.orderId}`)
          expect(req.request.body).to.deep.equal({
            request: {
              fieldSurvey: { date: fieldSurveyMinDate, time: Object.keys(ScheduledTime)[0] },
            },
          })
        })

        // PUT orders/{orderId} の成功メッセージを確認
        cy.get('[data-cy="notification-dialog-text"]').should(
          'have.text',
          t('guarantees.updateFieldSurveyAndConstructionOrderMessage'),
        )
        cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
        cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.close')).click()

        // ダイアログが閉じていることを確認する
        cy.get('[data-cy="notification-dialog-text"]').should('not.exist')
        cy.url().should(
          'eq',
          `${Cypress.config().baseUrl}/tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}`,
        )
      })
    })
  })
})
