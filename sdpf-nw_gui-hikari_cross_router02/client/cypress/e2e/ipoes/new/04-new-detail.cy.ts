import dayjs from 'dayjs'
import { FletsOrderTypes } from '@app/api/ipoes/constants'
import { generateRandomHex, t, OUTSIDE_APPLICATION_RESTRICTION_AT } from '@cypress/support/utils'

const testCases = Object.values(FletsOrderTypes).map(fletsOrderType => ({
  fletsOrderType,
}))

describe('光コラボの詳細画面', () => {
  beforeEach(function () {
    // 工事日予約の基準日を inputReserveDateAndSubmit と揃える(期間限定の申込規制の終了後に削除する)
    cy.clock(new Date(OUTSIDE_APPLICATION_RESTRICTION_AT), ['Date'])
    this.tenantId = generateRandomHex(32)
    this.ipoeId = generateRandomHex(32)

    cy.fixture('ipoes/new/detail-reserve-date.json').then(reserveDate => {
      this.fieldSurveyReserveDate = reserveDate.fieldSurvey
      this.constructionRreserveDate = reserveDate.construction
      this.removalReserveDate = reserveDate.removal
    })

    cy.intercept('GET', '**/ztgict/v1/settings/contractor', { fixture: 'contractor/detail' })
    cy.intercept('GET', '**/ztgict/v1/ipoe/hikari-collabo-util/available', { body: { available: true } }).as(
      'getAvailable',
    )
    cy.intercept('GET', `**/ztgict/v1/ipoe?ipoeId=${this.ipoeId}&limit=1`, {
      body: { ipoes: [{ ref: `/v1/ipoe/hikari-collabo/${this.ipoeId}` }] },
    }).as('getIpoeContractType')
  })

  it('予約日時が取得できなかった時のテーブル表示', function () {
    cy.intercept('GET', '**/ztgict/v1/ipoe/hikari-collabo/*', {
      fixture: 'ipoes/new/detail-active-field-survey-true',
    }).as('getHikariCollaboNew')
    cy.intercept('GET', '**/ztgict/v1/ipoe/hikari-collabo/*/search-date*', { body: { constructionDates: [] } }).as(
      'getEmptySearchDate',
    )

    cy.visit(`/tenants/${this.tenantId}/ipoes/${this.ipoeId}`)
    cy.wait(['@getAvailable', '@getIpoeContractType', '@getHikariCollaboNew'])

    cy.get('[data-cy="ipoes-id-index-line-out-dialog"]').should('not.exist')

    // 「現地調査日予約」ボタン
    cy.get('[data-cy="ipoes-id-index-field-survey-date-reserve-button"]').click()

    // 事前連絡先 - 入館に必要な項目を入力
    const isAdmissionApplicationRequired =
      this.fieldSurveyReserveDate.admissionApplicationInfo !== 'noApplication' ? 'true' : 'false'
    cy.get('[data-cy="reserve-date-dialog-admission-application-required"]')
      .find(`.label.${isAdmissionApplicationRequired}`)
      .click()
    if (isAdmissionApplicationRequired === 'true') {
      cy.inputSelectForm({
        selector: '[data-cy="reserve-date-dialog-admission-application-info"]',
        value: t(`ipoes.${this.fieldSurveyReserveDate.admissionApplicationInfo}`),
      })
    } else {
      cy.get('[data-cy="reserve-date-dialog-admission-application-info"]').should('not.exist')
    }

    // カレンダーテーブルを表示する
    cy.get('[data-cy="reserve-date-dialog-select-reserve-date-time-button"]').click()
    cy.wait(['@getEmptySearchDate'])
    cy.get('.dialog-base-submit-button').should('be.disabled')

    // メッセージ表示を確認する
    cy.get('.dialog-card-content').should('contain', t('ipoeConstruction.nothingReservableDate'))

    // 候補年月のセレクタが今月+5か月になってることを確認する
    const options = [...Array(6)].map((_, index) =>
      dayjs(OUTSIDE_APPLICATION_RESTRICTION_AT).add(index, 'months').format('YYYY/MM'),
    )
    cy.get('[data-cy="reserve-date-table-year-month"]').click()
    cy.get('[data-cy="reserve-date-table-year-month"]')
      .find('li')
      .should('have.length', options.length)
      .each((ul, index) => {
        cy.wrap(ul).should('contain', options[index])
      })

    // テーブルを閉じる
    cy.get('.dialog-base-cancel-button').should('have.text', t('common.close')).click()

    // ダイアログを閉じる
    cy.get('.dialog-base-cancel-button').should('have.text', t('common.close')).click()
    // ダイアログが閉じたことを確認
    cy.get('.dialog-main').should('not.exist')
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/ipoes/${this.ipoeId}`)
  })

  it('Line Outの時ダイアログが表示されること', function () {
    cy.fixture('ipoes/new/detail.json').then(data => {
      cy.intercept('GET', '**/ztgict/v1/ipoe/hikari-collabo/*', {
        body: { ...data, ticketIssueRequirement: true, resourceStatus: 'inactive', fletsId: '' },
      }).as('getHikariCollaboNew')
    })
    cy.visit(`/tenants/${this.tenantId}/ipoes/${this.ipoeId}`)
    cy.wait(['@getAvailable', '@getIpoeContractType', '@getHikariCollaboNew'])

    // Line Outのダイアログが表示されていることを確認
    cy.get('[data-cy="ipoes-id-index-line-out-dialog"]').should('exist')

    cy.get('[data-cy="line-out-dialog-hide-next-time-checkbox"]').find('.label').click()
    cy.get('.dialog-base-cancel-button').should('have.text', t('common.close')).click()
    // localStorageに非表示のフラグが保存されていることを確認
    cy.window().its('localStorage').invoke('getItem', `ipoe.${this.ipoeId}`).should('eq', 'hideLineOutMessage')
  })

  it('fletsIdが払い出されている時はLine Outダイアログが表示されないこと', function () {
    cy.fixture('ipoes/new/detail.json').then(data => {
      cy.intercept('GET', '**/ztgict/v1/ipoe/hikari-collabo/*', {
        body: { ...data, ticketIssueRequirement: true, resourceStatus: 'inactive', fletsId: 'test-flets-id' },
      }).as('getHikariCollaboNew')
    })
    cy.visit(`/tenants/${this.tenantId}/ipoes/${this.ipoeId}`)
    cy.wait(['@getAvailable', '@getIpoeContractType', '@getHikariCollaboNew'])

    // fletsIdがあるためLine Outのダイアログが表示されないことを確認
    cy.get('[data-cy="ipoes-id-index-line-out-dialog"]').should('not.exist')
  })

  context('現地調査日・工事日・訪問回収日ボタンからの予約処理', function () {
    it('「現地調査日予約」ボタンから予約する', function () {
      cy.intercept('GET', '**/ztgict/v1/ipoe/hikari-collabo/*', {
        fixture: 'ipoes/new/detail-active-field-survey-true',
      }).as('getHikariCollaboNew')
      cy.visit(`/tenants/${this.tenantId}/ipoes/${this.ipoeId}`)
      cy.wait(['@getAvailable', '@getIpoeContractType', '@getHikariCollaboNew'])

      cy.get('[data-cy="ipoes-id-index-line-out-dialog"]').should('not.exist')

      // 「現地調査日予約」ボタン
      cy.get('[data-cy="ipoes-id-index-field-survey-date-reserve-button"]').click()

      // 現地調査日の予約
      cy.inputReserveDateAndSubmit({ inputData: this.fieldSurveyReserveDate })
      // 工事日予約に進む
      cy.get('.dialog-base-submit-button').should('have.text', t('ipoeConstruction.constructionDateReserve')).click()

      // 工事日の予約
      cy.inputReserveDateAndSubmit({ inputData: this.constructionRreserveDate })
      // ダイアログを閉じる
      cy.get('.dialog-base-submit-button').should('have.text', t('common.close')).click()
      // ダイアログが閉じたことを確認
      cy.get('.dialog-main').should('not.exist')
      cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/ipoes/${this.ipoeId}`)
    })

    it('「工事日予約」ボタンから予約する', function () {
      cy.intercept('GET', '**/ztgict/v1/ipoe/hikari-collabo/*', {
        fixture: 'ipoes/new/detail-active-field-survey-false',
      }).as('getHikariCollaboNew')
      cy.visit(`/tenants/${this.tenantId}/ipoes/${this.ipoeId}`)
      cy.wait(['@getAvailable', '@getIpoeContractType', '@getHikariCollaboNew'])

      cy.get('[data-cy="ipoes-id-index-line-out-dialog"]').should('not.exist')

      // 「工事日予約」ボタン
      cy.get('[data-cy="ipoes-id-index-construction-date-reserve-button"]').click()

      // 工事日の予約
      cy.inputReserveDateAndSubmit({ inputData: this.constructionRreserveDate })
      // ダイアログを閉じる
      cy.get('.dialog-base-submit-button').should('have.text', t('common.close')).click()
      // ダイアログが閉じたことを確認
      cy.get('.dialog-main').should('not.exist')
      cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/ipoes/${this.ipoeId}`)
    })

    it('「訪問回収日予約」ボタンから予約する', function () {
      cy.intercept('GET', '**/ztgict/v1/ipoe/hikari-collabo/*', {
        fixture: 'ipoes/new/detail-terminated-collect-type-visit',
      }).as('getHikariCollaboNew')
      cy.visit(`/tenants/${this.tenantId}/ipoes/${this.ipoeId}`)
      cy.wait(['@getAvailable', '@getIpoeContractType', '@getHikariCollaboNew'])

      cy.get('[data-cy="ipoes-id-index-line-out-dialog"]').should('not.exist')

      // 「訪問回収日予約」ボタン
      cy.get('[data-cy="ipoes-id-index-visit-collection-date-reserve-button"]').click()

      // 訪問日予約用ダイアログの表示
      cy.inputReserveDateAndSubmit({ inputData: this.removalReserveDate })
      // 訪問日予約用ダイアログを閉じる
      cy.get('.dialog-base-submit-button').should('have.text', t('common.close')).click()
      // ダイアログが閉じたことを確認
      cy.get('.dialog-main').should('not.exist')
      cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/ipoes/${this.ipoeId}`)
    })
  })

  testCases.forEach(({ fletsOrderType }) => {
    context(`ボタンの表示・非表示（fletsOrderType: ${fletsOrderType}）`, function () {
      it('現地調査日・工事日がどちらも入力済みの場合', function () {
        cy.fixture('ipoes/new/detail.json').then(data => {
          cy.intercept('GET', '**/ztgict/v1/ipoe/hikari-collabo/*', {
            body: { ...data, fletsOrderType },
          }).as('getHikariCollaboNew')
        })

        cy.visit(`/tenants/${this.tenantId}/ipoes/${this.ipoeId}`)
        cy.wait(['@getAvailable', '@getIpoeContractType', '@getHikariCollaboNew'])

        cy.get('[data-cy="ipoes-id-index-line-out-dialog"]').should('not.exist')

        // 「申込種別」の表示を確認（migrate は new と同じ表示）
        const requestTypeKey = fletsOrderType === FletsOrderTypes.Migrate ? FletsOrderTypes.New : fletsOrderType
        cy.contains('.detail-grid', t('ipoes.requestType')).should('contain', t(`ipoes.${requestTypeKey}`))

        // 「現地調査日予約」ボタンが表示されて非活性になっている
        cy.get('[data-cy="ipoes-id-index-field-survey-date-reserve-button"]')
          .should('have.text', t('ipoeConstruction.fieldSurveyDateReserve'))
          .should('be.disabled')
        // 「工事日予約」ボタンが表示されて非活性になっている
        cy.get('[data-cy="ipoes-id-index-construction-date-reserve-button"]')
          .should('have.text', t('ipoeConstruction.constructionDateReserve'))
          .should('be.disabled')
        // 「廃止申し込み情報」が非表示になっている
        cy.get('[data-cy="ipoes-id-index-visit-collection-date-reserve-button"]').should('not.exist')

        // 「戻る」ボタン
        cy.get('[data-cy="ipoes-id-index-return-button"]')
          .should('have.text', t('common.return'))
          .should('not.be.disabled')
        // 「廃止」ボタン
        cy.get('[data-cy="ipoes-id-index-delete-button"]')
          .should('have.text', t('common.delete'))
          .should('not.be.disabled')
        // 「変更」ボタン
        cy.get('[data-cy="ipoes-id-index-edit-button"]').should('have.text', t('common.edit')).should('not.be.disabled')
        // 「転用」ボタンは非表示
        cy.get('[data-cy="ipoes-id-index-diversion-button"]').should('not.exist')
      })

      it('現地調査要否が true で現地調査日の入力がされてない場合', function () {
        cy.fixture('ipoes/new/detail-active-field-survey-true.json').then(data => {
          cy.intercept('GET', '**/ztgict/v1/ipoe/hikari-collabo/*', {
            body: { ...data, fletsOrderType },
          }).as('getHikariCollaboNew')
        })
        cy.visit(`/tenants/${this.tenantId}/ipoes/${this.ipoeId}`)
        cy.wait(['@getAvailable', '@getIpoeContractType', '@getHikariCollaboNew'])

        cy.get('[data-cy="ipoes-id-index-line-out-dialog"]').should('not.exist')

        // 「現地調査日予約」ボタンが表示されて活性になっている
        cy.get('[data-cy="ipoes-id-index-field-survey-date-reserve-button"]')
          .should('have.text', t('ipoeConstruction.fieldSurveyDateReserve'))
          .should('not.be.disabled')

        // 「工事日予約」ボタンが表示されて非活性になっている
        cy.get('[data-cy="ipoes-id-index-construction-date-reserve-button"]')
          .should('have.text', t('ipoeConstruction.constructionDateReserve'))
          .should('be.disabled')

        // 「廃止申し込み情報」が非表示になっている
        cy.get('[data-cy="ipoes-id-index-visit-collection-date-reserve-button"]').should('not.exist')
      })

      it('現地調査要否が false で宅内工事日の入力がされてない場合', function () {
        cy.fixture('ipoes/new/detail-active-field-survey-false.json').then(data => {
          cy.intercept('GET', '**/ztgict/v1/ipoe/hikari-collabo/*', {
            body: { ...data, fletsOrderType },
          }).as('getHikariCollaboNew')
        })
        cy.visit(`/tenants/${this.tenantId}/ipoes/${this.ipoeId}`)
        cy.wait(['@getAvailable', '@getIpoeContractType', '@getHikariCollaboNew'])

        cy.get('[data-cy="ipoes-id-index-line-out-dialog"]').should('not.exist')

        // 「現地調査日予約」ボタンが表示されて非活性になっている
        cy.get('[data-cy="ipoes-id-index-field-survey-date-reserve-button"]')
          .should('have.text', t('ipoeConstruction.fieldSurveyDateReserve'))
          .should('be.disabled')

        // 「工事日予約」ボタンが表示されて活性になっている
        cy.get('[data-cy="ipoes-id-index-construction-date-reserve-button"]')
          .should('have.text', t('ipoeConstruction.constructionDateReserve'))
          .should('not.be.disabled')

        // 「廃止申し込み情報」が非表示になっている
        cy.get('[data-cy="ipoes-id-index-visit-collection-date-reserve-button"]').should('not.exist')
      })

      it('「作業者が訪問して回収」で廃止申込済みで、回収日の入力がされてない場合', function () {
        cy.fixture('ipoes/new/detail-terminated-collect-type-visit.json').then(data => {
          cy.intercept('GET', '**/ztgict/v1/ipoe/hikari-collabo/*', {
            body: { ...data, fletsOrderType },
          }).as('getHikariCollaboNew')
        })
        cy.visit(`/tenants/${this.tenantId}/ipoes/${this.ipoeId}`)
        cy.wait(['@getAvailable', '@getIpoeContractType', '@getHikariCollaboNew'])

        cy.get('[data-cy="ipoes-id-index-line-out-dialog"]').should('not.exist')

        // 「現地調査日予約」ボタンが表示されて非活性になっている
        cy.get('[data-cy="ipoes-id-index-field-survey-date-reserve-button"]')
          .should('have.text', t('ipoeConstruction.fieldSurveyDateReserve'))
          .should('be.disabled')

        // 「工事日予約」ボタンが表示されて非活性になっている
        cy.get('[data-cy="ipoes-id-index-construction-date-reserve-button"]')
          .should('have.text', t('ipoeConstruction.constructionDateReserve'))
          .should('be.disabled')

        // 「訪問回収日予約」ボタンが表示されて活性になっている
        cy.get('[data-cy="ipoes-id-index-visit-collection-date-reserve-button"]')
          .should('have.text', t('ipoeConstruction.visitCollectionDateReserve'))
          .should('not.be.disabled')

        // 「戻る」ボタン
        cy.get('[data-cy="ipoes-id-index-return-button"]')
          .should('have.text', t('common.return'))
          .should('not.be.disabled')
        // 「廃止」ボタン
        cy.get('[data-cy="ipoes-id-index-delete-button"]').should('have.text', t('common.delete')).should('be.disabled')
        // 「変更」ボタン
        cy.get('[data-cy="ipoes-id-index-edit-button"]').should('have.text', t('common.edit')).should('be.disabled')
        // 「転用」ボタンは非表示
        cy.get('[data-cy="ipoes-id-index-diversion-button"]').should('not.exist')
      })

      it('「作業者が訪問して回収」で廃止申込済みで、回収日が入力済みの場合', function () {
        cy.fixture('ipoes/new/detail-terminated.json').then(data => {
          cy.intercept('GET', '**/ztgict/v1/ipoe/hikari-collabo/*', {
            body: { ...data, fletsOrderType },
          }).as('getHikariCollaboNew')
        })
        cy.visit(`/tenants/${this.tenantId}/ipoes/${this.ipoeId}`)
        cy.wait(['@getAvailable', '@getIpoeContractType', '@getHikariCollaboNew'])

        cy.get('[data-cy="ipoes-id-index-line-out-dialog"]').should('not.exist')

        // 「現地調査日予約」ボタンが表示されて非活性になっている
        cy.get('[data-cy="ipoes-id-index-field-survey-date-reserve-button"]')
          .should('have.text', t('ipoeConstruction.fieldSurveyDateReserve'))
          .should('be.disabled')

        // 「工事日予約」ボタンが表示されて非活性になっている
        cy.get('[data-cy="ipoes-id-index-construction-date-reserve-button"]')
          .should('have.text', t('ipoeConstruction.constructionDateReserve'))
          .should('be.disabled')

        // 「訪問回収日予約」ボタンが表示されて非活性になっている
        cy.get('[data-cy="ipoes-id-index-visit-collection-date-reserve-button"]')
          .should('have.text', t('ipoeConstruction.visitCollectionDateReserve'))
          .should('be.disabled')
      })

      it('「返却キットによる回収」で廃止申込済みの場合', function () {
        cy.fixture('ipoes/new/detail-terminated-collect-type-kit.json').then(data => {
          cy.intercept('GET', '**/ztgict/v1/ipoe/hikari-collabo/*', {
            body: { ...data, fletsOrderType },
          }).as('getHikariCollaboNew')
        })
        cy.visit(`/tenants/${this.tenantId}/ipoes/${this.ipoeId}`)
        cy.wait(['@getAvailable', '@getIpoeContractType', '@getHikariCollaboNew'])

        cy.get('[data-cy="ipoes-id-index-line-out-dialog"]').should('not.exist')

        // 「現地調査日予約」ボタンが表示されて非活性になっている
        cy.get('[data-cy="ipoes-id-index-field-survey-date-reserve-button"]')
          .should('have.text', t('ipoeConstruction.fieldSurveyDateReserve'))
          .should('be.disabled')

        // 「工事日予約」ボタンが表示されて非活性になっている
        cy.get('[data-cy="ipoes-id-index-construction-date-reserve-button"]')
          .should('have.text', t('ipoeConstruction.constructionDateReserve'))
          .should('be.disabled')

        // 「訪問回収日予約」ボタンが表示されて非活性になっている
        cy.get('[data-cy="ipoes-id-index-visit-collection-date-reserve-button"]')
          .should('have.text', t('ipoeConstruction.visitCollectionDateReserve'))
          .should('be.disabled')
      })
    })
  })
})
