import { ScheduledTime } from '@app/api/hikariCollaboUtil/constants'
import type { ConstructionDateType } from '@app/api/hikariCollaboUtil/types'
import dayjs from 'dayjs'
import {
  GuaranteeReserveDateAddCount,
  generateRandomHex,
  nDaysLater,
  t,
  outsideApplicationRestrictionAt,
  OUTSIDE_APPLICATION_RESTRICTION_AT,
} from '@cypress/support/utils'

describe('ギャランティアクセス 廃止', () => {
  // @getGuarantee のレスポンスに tenantId がある場合に @getTerminalList を追加する
  const detailWaitList = ['@getGuarantee', '@getCampaignList']

  const time = Object.keys(ScheduledTime)[0] as keyof typeof ScheduledTime
  const removalMinDate = nDaysLater(GuaranteeReserveDateAddCount.removal, dayjs(OUTSIDE_APPLICATION_RESTRICTION_AT))
  const beforeApplicationFixture = 'guarantees/circuits/detail-reserve-date-approved'
  const afterApplicationFixture = 'guarantees/circuits/detail-removal-date-rejected'

  beforeEach(function () {
    this.tenantId = generateRandomHex(32)
    this.guaranteeId = generateRandomHex(32)

    cy.fixture(afterApplicationFixture).then(detail => {
      this.afterApplicationDetail = detail
    })
    cy.fixture('guarantees/circuits/reserve-date').then(reserveDate => {
      this.edit = reserveDate
    })
    cy.fixture('guarantees/circuits/search-date.json').then(data => {
      const removal = {
        constructionDates: data.constructionDates.map((d: ConstructionDateType) => ({
          ...d,
          scheduledDate: removalMinDate,
        })),
      }
      cy.intercept('GET', '**/ztgict/v1/iwan-util/search-date?type=removal*', { body: removal }).as(
        'getRemovalSearchDate',
      )
    })
    cy.intercept('GET', '**/ztgict/v1/campaigns*', { fixture: 'campaigns/list-empty' }).as('getCampaignList')
    cy.intercept('DELETE', '**/ztgict/v1/guarantees/*', {}).as('deleteGuarantee')
    cy.intercept('PUT', '**/ztgict/v1/orders/*', {}).as('putOrder')

    cy.intercept('GET', '**/ztgict/v1/resource-summary/terminals*', { fixture: 'terminals/list-some-items' }).as(
      'getTerminalList',
    )
  })

  context('正常系', function () {
    beforeEach(function () {
      // 確認ボタンが押せるように時間固定
      cy.clock(outsideApplicationRestrictionAt(9, 0, 0, 0), ['Date'])
    })

    it('ギャランティアクセスの「廃止」ボタンからの遷移', function () {
      cy.intercept('GET', `**/ztgict/v1/guarantees/${this.guaranteeId}`, { fixture: beforeApplicationFixture }).as(
        'getGuarantee',
      )
      // 詳細画面に遷移
      cy.visit(`tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}`)
      cy.wait(detailWaitList)
      cy.get('[data-cy="guarantees-circuits-id-index-reserve-removal-date-button"]').should('not.exist')
      // 廃止申し込み画面に遷移
      cy.get('[data-cy="guarantees-circuits-id-index-delete-button"]')
        .should('not.be.disabled')
        .should('have.text', t('common.delete'))
        .click()

      // 遷移を確認
      cy.url().should(
        'eq',
        `${Cypress.config().baseUrl}/tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}/remove`,
      )
      cy.wait(['@getGuarantee'])

      // エイリアスの設定
      cy.get('[data-cy="guarantees-circuits-id-remove-submit-button"]').as('submitButton')
      cy.get('[data-cy="guarantees-circuits-id-remove-cancel-button"]').as('cancelButton')
      cy.get('[data-cy="guarantees-circuits-id-remove-reserve-date-button"]').as('reserveDateButton')
      cy.get('[data-cy="guarantees-circuits-id-remove-admission-application-required"]').as(
        'admissionApplicationRequired',
      )

      cy.inputGuaranteeRemove({
        inputData: {
          ...this.edit.removal,
        },
        time,
        removalMinDate,
      })

      // 確認ボタン押下
      cy.get('@cancelButton').should('have.text', t('common.cancel'))
      cy.get('@submitButton').should('have.text', t('common.confirm')).should('not.be.disabled').click()

      // disabled の確認
      cy.get('@reserveDateButton').should('be.disabled')
      cy.checkGuaranteeRemove({
        inputData: {
          ...this.edit.removal,
        },
        isOrderRequest: false,
        isConfirmation: true,
        time,
        removalMinDate,
      })

      // 「廃止申し込み」ボタン押下
      cy.get('@cancelButton').should('have.text', t('common.return'))
      cy.get('@submitButton').should('have.text', t('common.abolition')).should('not.be.disabled').click()

      // DELETE guarantees の request 内容チェック
      cy.wait('@deleteGuarantee').then(req => {
        expect(req.request.url).to.include(`ztgict/v1/guarantees/${this.guaranteeId}`)
        expect(req.request.body).to.deep.equal({
          removal: { ...this.edit.removal, date: removalMinDate, time },
        })
      })

      // 成功メッセージを確認
      cy.get('.dialog-card-content').should('have.text', t('guarantees.removedMessage'))
      cy.get('.dialog-base-submit-button').click()

      cy.url().should(
        'eq',
        `${Cypress.config().baseUrl}/tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}`,
      )
      cy.wait(detailWaitList)
    })

    it('ギャランティアクセスの「回収日予約」ボタンからの遷移', function () {
      cy.intercept('GET', `**/ztgict/v1/guarantees/${this.guaranteeId}`, { fixture: afterApplicationFixture }).as(
        'getGuarantee',
      )
      // 詳細画面に遷移
      cy.visit(`tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}`)
      cy.wait(detailWaitList)
      // 「回収日予約」ボタンから廃止申し込み画面に遷移
      cy.get('[data-cy="guarantees-circuits-id-index-reserve-removal-date-button"]').should('not.be.disabled').click()

      // 遷移を確認
      cy.url().should(
        'eq',
        `${Cypress.config().baseUrl}/tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}/remove`,
      )
      cy.wait(['@getGuarantee'])

      // エイリアスの設定
      cy.get('[data-cy="guarantees-circuits-id-remove-submit-button"]').as('submitButton')
      cy.get('[data-cy="guarantees-circuits-id-remove-cancel-button"]').as('cancelButton')
      cy.get('[data-cy="guarantees-circuits-id-remove-reserve-date-button"]').as('reserveDateButton')
      cy.get('[data-cy="guarantees-circuits-id-remove-admission-application-required"]').as(
        'admissionApplicationRequired',
      )

      // 「確認」ボタンが disabled なことを確認
      cy.get('@submitButton').should('be.disabled')
      // 初期値確認
      cy.checkGuaranteeRemove({
        inputData: {
          ...this.afterApplicationDetail.removal,
        },
        isOrderRequest: true,
        time: '',
        removalMinDate: '',
      })
      cy.get('[data-cy="guarantees-circuits-id-remove-date-time"]').find('input').as('dateTime')

      // 「回収希望日を選択」を選択
      cy.get('@reserveDateButton').should('not.be.disabled').click()
      cy.wait('@getRemovalSearchDate')
      cy.get('[data-cy="guarantee-reserve-date-table"]').as('dateTable')

      // 日付と時間を選択
      cy.get('@dateTable').find('.radio.checked').should('have.length', 0)
      cy.get('.dialog-base-submit-button').should('be.disabled')
      cy.get('@dateTable').find('.time-table-cell .button').first().click()
      cy.get('.dialog-base-submit-button').should('have.text', t('common.save')).should('not.be.disabled').click()

      // ダイアログが閉じたことを確認
      cy.get('@dateTable').should('not.exist')

      // 入力値確認
      // 入館の情報
      cy.get('@admissionApplicationRequired')
        .find('.radio.checked.disabled')
        .find(`.label.${this.afterApplicationDetail.removal.admissionApplicationRequired}`)
        .should('have.length', 1)
      // 希望日
      cy.get('@dateTime').should('have.value', `${removalMinDate.replaceAll('-', '/')}  ${ScheduledTime[time] || ''}`)

      // 確認ボタン押下
      cy.get('@cancelButton').should('have.text', t('common.cancel'))
      cy.get('@submitButton').should('have.text', t('common.confirm')).should('not.be.disabled').click()

      cy.checkGuaranteeRemove({
        inputData: {
          ...this.afterApplicationDetail.removal,
        },
        isOrderRequest: true,
        isConfirmation: true,
        time,
        removalMinDate,
      })

      // 「廃止申し込み」ボタン押下
      cy.get('@cancelButton').should('have.text', t('common.return'))
      cy.get('@submitButton').should('have.text', t('common.abolition')).should('not.be.disabled').click()

      // PUT Order の request 内容チェック
      cy.wait('@putOrder').then(req => {
        expect(req.request.url).to.include(`ztgict/v1/orders/${this.afterApplicationDetail.orderId}`)
        expect(req.request.body).to.deep.equal({
          request: {
            removal: { date: removalMinDate, time },
          },
        })
      })

      // 成功メッセージを確認
      cy.get('.dialog-card-content').should('have.text', t('guarantees.removedMessage'))
      cy.get('.dialog-base-submit-button').click()

      cy.url().should(
        'eq',
        `${Cypress.config().baseUrl}/tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}`,
      )
      cy.wait(detailWaitList)
    })

    it('ギャランティ廃止（稼働調整依頼: true）', function () {
      cy.intercept('GET', `**/ztgict/v1/guarantees/${this.guaranteeId}`, { fixture: beforeApplicationFixture }).as(
        'getGuarantee',
      )
      // 詳細画面に遷移
      cy.visit(`tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}`)
      cy.wait(detailWaitList)
      cy.get('[data-cy="guarantees-circuits-id-index-reserve-removal-date-button"]').should('not.exist')
      // 廃止申し込み画面に遷移
      cy.get('[data-cy="guarantees-circuits-id-index-delete-button"]')
        .should('not.be.disabled')
        .should('have.text', t('common.delete'))
        .click()

      // 遷移を確認
      cy.url().should(
        'eq',
        `${Cypress.config().baseUrl}/tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}/remove`,
      )
      cy.wait(['@getGuarantee'])

      // エイリアスの設定
      cy.get('[data-cy="guarantees-circuits-id-remove-submit-button"]').as('submitButton')
      cy.get('[data-cy="guarantees-circuits-id-remove-cancel-button"]').as('cancelButton')
      cy.get('[data-cy="guarantees-circuits-id-remove-reserve-date-button"]').as('reserveDateButton')
      cy.get('[data-cy="guarantees-circuits-id-remove-admission-application-required"]').as(
        'admissionApplicationRequired',
      )

      cy.inputGuaranteeRemove({
        inputData: {
          ...this.edit.removal,
          operationAdjustment: true,
        },
      })

      // 確認ボタン押下
      cy.get('@cancelButton').should('have.text', t('common.cancel'))
      cy.get('@submitButton').should('have.text', t('common.confirm')).should('not.be.disabled').click()

      // disabled の確認
      cy.get('@reserveDateButton').should('be.disabled')
      cy.checkGuaranteeRemove({
        inputData: {
          ...this.edit.removal,
          operationAdjustment: true,
        },
        isOrderRequest: false,
        isConfirmation: true,
      })

      // 「廃止申し込み」ボタン押下
      cy.get('@cancelButton').should('have.text', t('common.return'))
      cy.get('@submitButton').should('have.text', t('common.abolition')).should('not.be.disabled').click()

      // DELETE guarantees の request 内容チェック
      cy.wait('@deleteGuarantee').then(req => {
        expect(req.request.url).to.include(`ztgict/v1/guarantees/${this.guaranteeId}`)
        expect(req.request.body).to.deep.equal({
          removal: { ...this.edit.removal, operationAdjustment: true },
        })
      })

      // 成功メッセージを確認
      cy.get('.dialog-card-content').should(
        'have.text',
        t('guarantees.createTicketMessage', {
          menu: t('common.delete'),
          angora1: t('common.here'),
          angora2: t('common.here'),
        }),
      )
      cy.get('.dialog-base-submit-button').should('have.text', t('common.close'))

      cy.get('.dialog-base-submit-button').click()
      cy.url().should(
        'eq',
        `${Cypress.config().baseUrl}/tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}`,
      )
      cy.wait(detailWaitList)
    })
  })

  context('受付時間外メッセージの表示を確認', function () {
    beforeEach(function () {
      cy.intercept('GET', `**/ztgict/v1/guarantees/${this.guaranteeId}`, { fixture: beforeApplicationFixture }).as(
        'getGuarantee',
      )
    })

    it('第３月曜日以外 - 受付時間外 - 日本時間(8:59)', function () {
      cy.clock(new Date('2024-04-21T23:59:59Z'), ['Date'])

      // 廃止申し込み画面に遷移
      cy.visit(`tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}/remove`)
      cy.wait(['@getGuarantee'])

      // メッセージが表示されることを確認
      cy.get('[data-cy="guarantees-circuits-id-remove-outside-reception-hour"]').should('exist')

      // エイリアスの設定
      cy.get('[data-cy="guarantees-circuits-id-remove-submit-button"]').as('submitButton')
      cy.get('[data-cy="guarantees-circuits-id-remove-reserve-date-button"]').as('reserveDateButton')
      cy.get('[data-cy="guarantees-circuits-id-remove-admission-application-required"]').as(
        'admissionApplicationRequired',
      )

      // 「回収希望日を選択」が非活性なことを確認する
      cy.get('@reserveDateButton').should('be.disabled')
      // 回収希望日の入館の情報を入力
      cy.get('@admissionApplicationRequired').find(`.label.${this.edit.removal.admissionApplicationRequired}`).click()
      // 稼働調整依頼をチェック
      cy.get('[data-cy="guarantees-circuits-id-remove-operation-adjustment"]').click()
      // 宅内工事詳細情報の入力
      cy.get('[data-cy="guarantees-circuits-id-remove-pre-contact-company-name"]')
        .find('input')
        .type(this.edit.removal.preContactCompanyName)
      cy.get('[data-cy="guarantees-circuits-id-remove-pre-contact-person-name"]')
        .find('input')
        .type(this.edit.removal.preContactPersonName)
      cy.get('[data-cy="guarantees-circuits-id-remove-pre-contact-phone-number"]')
        .find('input')
        .type(this.edit.removal.preContactPhoneNumber)
      cy.get('[data-cy="guarantees-circuits-id-remove-attendance-company-name"]')
        .find('input')
        .type(this.edit.removal.attendanceCompanyName)
      cy.get('[data-cy="guarantees-circuits-id-remove-attendance-person-name"]')
        .find('input')
        .type(this.edit.removal.attendancePersonName)
      cy.get('[data-cy="guarantees-circuits-id-remove-attendance-phone-number"]')
        .find('input')
        .type(this.edit.removal.attendancePhoneNumber)

      // 必須項目を埋めた場合でも、確認ボタンが非活性なことを確認
      cy.get('@submitButton').should('be.disabled')
    })
    it('第３月曜日以外 - 受付時間内 - 日本時間(9:00)', function () {
      cy.clock(new Date('2024-04-22T00:00:00Z'), ['Date'])

      // 廃止申し込み画面に遷移
      cy.visit(`tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}/remove`)
      cy.wait(['@getGuarantee'])

      // メッセージが表示されないことを確認
      cy.get('[data-cy="guarantees-circuits-id-remove-outside-reception-hour"]').should('not.exist')

      // エイリアスの設定
      cy.get('[data-cy="guarantees-circuits-id-remove-submit-button"]').as('submitButton')
      cy.get('[data-cy="guarantees-circuits-id-remove-reserve-date-button"]').as('reserveDateButton')
      cy.get('[data-cy="guarantees-circuits-id-remove-admission-application-required"]').as(
        'admissionApplicationRequired',
      )

      // 「回収希望日を選択」が活性なことを確認する
      cy.get('@reserveDateButton').should('not.be.disabled')
      // 回収希望日の入館の情報を入力
      cy.get('@admissionApplicationRequired').find(`.label.${this.edit.removal.admissionApplicationRequired}`).click()
      // 稼働調整依頼をチェック
      cy.get('[data-cy="guarantees-circuits-id-remove-operation-adjustment"]').click()
      // 「回収希望日を選択」が非活性なことを確認する
      cy.get('@reserveDateButton').should('be.disabled')
      // 宅内工事詳細情報の入力
      cy.get('[data-cy="guarantees-circuits-id-remove-pre-contact-company-name"]')
        .find('input')
        .type(this.edit.removal.preContactCompanyName)
      cy.get('[data-cy="guarantees-circuits-id-remove-pre-contact-person-name"]')
        .find('input')
        .type(this.edit.removal.preContactPersonName)
      cy.get('[data-cy="guarantees-circuits-id-remove-pre-contact-phone-number"]')
        .find('input')
        .type(this.edit.removal.preContactPhoneNumber)
      cy.get('[data-cy="guarantees-circuits-id-remove-attendance-company-name"]')
        .find('input')
        .type(this.edit.removal.attendanceCompanyName)
      cy.get('[data-cy="guarantees-circuits-id-remove-attendance-person-name"]')
        .find('input')
        .type(this.edit.removal.attendancePersonName)
      cy.get('[data-cy="guarantees-circuits-id-remove-attendance-phone-number"]')
        .find('input')
        .type(this.edit.removal.attendancePhoneNumber)

      // 必須項目を埋めた場合、確認ボタンが活性なことを確認
      cy.get('@submitButton').should('not.be.disabled')
    })
    it('第３月曜日以外 - 受付時間内 - 日本時間(19:59)', function () {
      cy.clock(new Date('2024-04-22T10:59:59Z'), ['Date'])

      // 廃止申し込み画面に遷移
      cy.visit(`tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}/remove`)
      cy.wait(['@getGuarantee'])

      // メッセージが表示されないことを確認
      cy.get('[data-cy="guarantees-circuits-id-remove-outside-reception-hour"]').should('not.exist')
    })
    it('第３月曜日以外 - 受付時間外 - 日本時間(20:00)', function () {
      cy.clock(new Date('2024-04-22T11:00:00Z'), ['Date'])

      // 廃止申し込み画面に遷移
      cy.visit(`tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}/remove`)
      cy.wait(['@getGuarantee'])

      // メッセージが表示されることを確認
      cy.get('[data-cy="guarantees-circuits-id-remove-outside-reception-hour"]').should('exist')
    })
    it('第３月曜日 - 受付時間外 - 日本時間(8:59)', function () {
      cy.clock(new Date('2024-04-14T23:59:59Z'), ['Date'])

      // 廃止申し込み画面に遷移
      cy.visit(`tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}/remove`)
      cy.wait(['@getGuarantee'])

      // メッセージが表示されることを確認
      cy.get('[data-cy="guarantees-circuits-id-remove-outside-reception-hour"]').should('exist')
    })
    it('第３月曜日 - 受付時間内 - 日本時間(9:00)', function () {
      cy.clock(new Date('2024-04-15T00:00:00Z'), ['Date'])

      // 廃止申し込み画面に遷移
      cy.visit(`tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}/remove`)
      cy.wait(['@getGuarantee'])

      // メッセージが表示されないことを確認
      cy.get('[data-cy="guarantees-circuits-id-remove-outside-reception-hour"]').should('not.exist')
    })
    it('第３月曜日 - 受付時間内 - 日本時間(16:59)', function () {
      cy.clock(new Date('2024-04-15T07:59:59Z'), ['Date'])

      // 廃止申し込み画面に遷移
      cy.visit(`tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}/remove`)
      cy.wait(['@getGuarantee'])

      // メッセージが表示されないことを確認
      cy.get('[data-cy="guarantees-circuits-id-remove-outside-reception-hour"]').should('not.exist')
    })
    it('第３月曜日 - 受付時間外 - 日本時間(17:00)', function () {
      cy.clock(new Date('2024-04-15T08:00:00Z'), ['Date'])

      // 廃止申し込み画面に遷移
      cy.visit(`tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}/remove`)
      cy.wait(['@getGuarantee'])

      // メッセージが表示されることを確認
      cy.get('[data-cy="guarantees-circuits-id-remove-outside-reception-hour"]').should('exist')
    })
  })
})
