import dayjs from 'dayjs'
import { DocumentServiceTypes, DocumentTypes } from '@app/api/constants'
import { ScheduledTime } from '@app/api/hikariCollaboUtil/constants'
import type { ConstructionDateType } from '@app/api/hikariCollaboUtil/types'
import { t, nDaysLater, getGuaranteeYearMonthOptions, OUTSIDE_APPLICATION_RESTRICTION_AT } from '@cypress/support/utils'

type TimeType = keyof typeof ScheduledTime

Cypress.Commands.add('pngFileUpload', params => {
  const filePng = {
    contents: Cypress.Buffer.from('file contents'),
    fileName: 'file.png',
    mimeType: 'image/png',
    lastModified: Date.now(),
  }

  cy.get(params.className).find('[data-cy="file-upload-button"]').click()
  cy.get('.file-upload-dnd-area').selectFile(filePng, { action: 'drag-drop' })
  cy.get('.dialog-base-submit-button').click()
  cy.wait(params.aliasName).then(req => {
    expect(req.request.url).to.include('ztgict/v1/upload-document')
    expect(req.request.body.encoding).to.eq('base64')
    expect(req.request.body.service).to.eq(params.service ?? DocumentServiceTypes.Mobile)
    expect(req.request.body.documentType).to.eq(params.type ?? DocumentTypes.IdentificationDocument)
    expect(req.request.body.format).to.eq('png')
  })
  cy.get(params.className).find('[data-cy="file-upload-display-text"]').should('have.text', params.documentId)
})

Cypress.Commands.add('fieldSurveyLessFileUpload', params => {
  const fileXls = {
    contents: Cypress.Buffer.from('file contents'),
    fileName: 'file.xls',
    mimeType: 'application/vnd.ms-excel',
    lastModified: Date.now(),
  }

  cy.get(params.className).find('[data-cy="file-upload-button"]').click()
  cy.get('.file-upload-dnd-area').selectFile(fileXls, { action: 'drag-drop' })
  cy.get('.dialog-base-submit-button').click()
  cy.wait(params.aliasName).then(req => {
    expect(req.request.url).to.include('ztgict/v1/upload-document')
    expect(req.request.body.encoding).to.eq('base64')
    expect(req.request.body.service).to.eq(DocumentServiceTypes.Guarantee)
    expect(req.request.body.documentType).to.eq(DocumentTypes.FieldSurveyLessFile)
    expect(req.request.body.format).to.eq('xls')
  })
  cy.get(params.className).find('[data-cy="file-upload-display-text"]').should('have.text', params.documentId)
})

Cypress.Commands.add('confirmFileUpload', params => {
  cy.get(params.className)
    .find('[data-cy="file-upload-button"]')
    .should(params.disabled ? 'be.disabled' : 'not.be.disabled')
  cy.get(params.className).find('[data-cy="file-upload-display-text"]').should('have.text', params.documentId)
})

Cypress.Commands.add('removeRow', params => {
  if (Cypress.$(`${params.className} ${params.buttonClassName}`).length > 0) {
    cy.get(params.className)
      .find(params.buttonClassName)
      .each(() => cy.get(params.className).find(params.buttonClassName).last().click())
  }
})
Cypress.Commands.add('removeRowEditTable', params => {
  cy.removeRow({ ...params, buttonClassName: '.edit-table-trush-button' })
})
Cypress.Commands.add('removeRowMultipleForm', params => {
  cy.removeRow({ ...params, buttonClassName: '[data-cy="multiple-form-trash-button"]' })
})

Cypress.Commands.add('inputSelectForm', params => {
  if (params.value === t('common.unselected')) {
    cy.get(params.selector).find('input').click()
  } else {
    cy.get(params.selector).find('input').type(params.value)
  }
  cy.get(params.selector).find('li').eq(0).click()
})

Cypress.Commands.add('inputDatePicker', params => {
  const dateDayjs = dayjs(params.date)
  const year = dateDayjs.format('YYYY')
  const month = dateDayjs.format('M')
  const day = dateDayjs.format('YYYY-MM-DD')

  cy.get(params.className).find('input').click()

  cy.get('[data-cy="date-picker-year-select-button"]').click()
  cy.get(`[data-cy="date-picker-year-option-${year}"]`).scrollIntoView().click()

  cy.get('[data-cy="date-picker-month-select-button"]').click()
  cy.get(`[data-cy="date-picker-month-option-${month}"]`).click()

  cy.get(`[data-test-id="dp-${day}"]`).find('.dp--cell-inner').click()
})

Cypress.Commands.add('confirmDatePicker', params => {
  const date = params.date ? dayjs(params.date).format('YYYY/MM/DD') : ''
  cy.get(params.className)
    .find('input')
    .should(params.disabled ? 'be.disabled' : 'not.be.disabled')
    .should('have.value', date)
})

Cypress.Commands.add('inputReserveDateAndSubmit', params => {
  // 呼び出し元の spec が cy.clock で固定している日時と基準を揃える(期間限定の申込規制の終了後に削除する)
  const baseDate = dayjs(OUTSIDE_APPLICATION_RESTRICTION_AT)
  const date = nDaysLater(33, baseDate).replaceAll('-', '/')
  const time = Object.keys(ScheduledTime)[0] as TimeType
  // 設場の事前入館申請の要否
  const isAdmissionApplicationRequired = params.inputData.admissionApplicationInfo !== 'noApplication'

  cy.fixture('ipoes/search-date.json').then(data => {
    const response = {
      constructionDates: data.constructionDates.map((d: ConstructionDateType) => ({
        ...d,
        scheduledDate: nDaysLater(33, baseDate),
      })),
    }
    cy.intercept('GET', '**/ztgict/v1/ipoe/hikari-collabo/*', { fixture: 'ipoes/new/detail' })
    cy.intercept('GET', '**/ztgict/v1/ipoe?ipoeId=*', {
      body: { ipoes: [{ ref: '/v1/ipoe/hikari-collabo/Z123456789' }] },
    })
    cy.intercept('GET', '**/ztgict/v1/ipoe/hikari-collabo/*/search-date*', { body: response }).as('getSearchDate')
    if (params.errorCode) {
      cy.intercept('POST', '**/ztgict/v1/ipoe/hikari-collabo/*/reserve-date', {
        statusCode: params.errorCode,
        body: { errorCode: params.errorCode, errorMessage: 'reserve-date error' },
      }).as('postReserveDate')
    } else {
      cy.intercept('POST', '**/ztgict/v1/ipoe/hikari-collabo/*/reserve-date', {}).as('postReserveDate')
    }
  })

  if (!params.retry) {
    // 候補日を選択のボタンが無効であることを確認
    cy.get('[data-cy="reserve-date-dialog-select-reserve-date-time-button"]').should('be.disabled')
    // 事前連絡先 - 入館に必要な項目を入力
    cy.get('[data-cy="reserve-date-dialog-admission-application-info"]').should('not.exist')

    cy.get('[data-cy="reserve-date-dialog-admission-application-required"]')
      .find(`.label.${isAdmissionApplicationRequired}`)
      .click()
    if (isAdmissionApplicationRequired) {
      cy.inputSelectForm({
        selector: '[data-cy="reserve-date-dialog-admission-application-info"]',
        value: t(`ipoes.${params.inputData.admissionApplicationInfo}`),
      })
    }

    // カレンダーテーブルを表示する
    cy.get('[data-cy="reserve-date-dialog-select-reserve-date-time-button"]').should('not.be.disabled').click()
    cy.wait(['@getSearchDate'])
    cy.get('.dialog-base-submit-button').should('be.disabled')

    // 候補年月のセレクタがminDate+5か月になってることを確認する
    const options = [...Array(6)].map((_, index) =>
      dayjs(nDaysLater(33, baseDate)).add(index, 'months').format('YYYY/MM'),
    )
    cy.get('[data-cy="reserve-date-table-year-month"]').click()
    cy.get('[data-cy="reserve-date-table-year-month"]')
      .find('li')
      .should('have.length', options.length)
      .each((ul, index) => {
        cy.wrap(ul).should('contain', options[index])
      })

    // 候補日を選択
    cy.get('[data-cy="reserve-date-dialog-reserve-date-table"]').find('.time-table-cell .button').first().click()
    cy.get('.dialog-base-submit-button').should('have.text', t('common.save')).should('not.be.disabled').click()
  }

  // 予定日と予定時間帯の表示確認
  cy.get('[data-cy="reserve-date-dialog-reserve-date"]').find('input').should('be.disabled').should('have.value', date)
  cy.get('[data-cy="reserve-date-dialog-reserve-time"]')
    .find('input')
    .should('be.disabled')
    .should('have.value', ScheduledTime[time])

  if (!params.retry) {
    // 事前連絡先の残りの項目を入力
    cy.get('[data-cy="reserve-date-dialog-attendance-company-name"]')
      .find('input')
      .type(params.inputData.attendanceCompanyName)
    cy.get('[data-cy="reserve-date-dialog-attendance-department-name"]')
      .find('input')
      .type(params.inputData.attendanceDepartmentName)
    cy.get('[data-cy="reserve-date-dialog-attendance-person-name"]')
      .find('input')
      .type(params.inputData.attendancePersonName)
    cy.get('[data-cy="reserve-date-dialog-attendance-person-name-kana"]')
      .find('input')
      .type(params.inputData.attendancePersonNameKana)
    cy.get('[data-cy="reserve-date-dialog-attendance-phone-number"]')
      .find('input')
      .type(params.inputData.attendancePhoneNumber)
  }

  // 確認
  cy.get('.dialog-base-submit-button').should('have.text', t('common.confirm')).click()
  // disabled 確認
  cy.get('[data-cy="reserve-date-dialog-select-reserve-date-time-button"]').should('be.disabled')
  cy.get('[data-cy="reserve-date-dialog-reserve-date"]').find('input').should('be.disabled').should('have.value', date)
  cy.get('[data-cy="reserve-date-dialog-reserve-time"]')
    .find('input')
    .should('be.disabled')
    .should('have.value', ScheduledTime[time])
  cy.get('[data-cy="reserve-date-dialog-admission-application-required"]')
    .find('.radio.checked')
    .find(`.label.${isAdmissionApplicationRequired}`)
    .should('have.length', 1)
  if (isAdmissionApplicationRequired) {
    cy.get('[data-cy="reserve-date-dialog-admission-application-info"]')
      .find('input')
      .should('be.disabled')
      .should('have.value', t(`ipoes.${params.inputData.admissionApplicationInfo}`))
  } else {
    cy.get('[data-cy="reserve-date-dialog-admission-application-info"]').should('not.exist')
  }
  cy.get('[data-cy="reserve-date-dialog-attendance-company-name"]')
    .find('input')
    .should('be.disabled')
    .should('have.value', params.inputData.attendanceCompanyName)
  cy.get('[data-cy="reserve-date-dialog-attendance-department-name"]')
    .find('input')
    .should('be.disabled')
    .should('have.value', params.inputData.attendanceDepartmentName)
  cy.get('[data-cy="reserve-date-dialog-attendance-person-name"]')
    .find('input')
    .should('be.disabled')
    .should('have.value', params.inputData.attendancePersonName)
  cy.get('[data-cy="reserve-date-dialog-attendance-person-name-kana"]')
    .find('input')
    .should('be.disabled')
    .should('have.value', params.inputData.attendancePersonNameKana)
  cy.get('[data-cy="reserve-date-dialog-attendance-phone-number"]')
    .find('input')
    .should('be.disabled')
    .should('have.value', params.inputData.attendancePhoneNumber)

  // 登録
  cy.get('.dialog-base-submit-button').should('have.text', t('common.register')).click()

  cy.wait('@postReserveDate').then(req => {
    const url = /ztgict\/v1\/ipoe\/hikari-collabo\/\w*\/reserve-date$/
    expect(req.request.url).to.match(url)
    expect(req.request.body).to.deep.equal({ ...params.inputData, time, date: nDaysLater(33, baseDate) })
  })

  if (params.errorCode) {
    // エラーダイアログの表示
    cy.get('[data-cy="notification-dialog-text"]').should(
      'have.text',
      `${t('message.failed')}\n${params.errorCode}\nreserve-date error`,
    )
    cy.get('[data-cy="notification-dialog-submit-button"]').click()
  }
})

Cypress.Commands.add('checkGuaranteeYearMonthSelectOptions', params => {
  // 候補年月のセレクタが今月+5か月になってることを確認する
  const constructionOptions = getGuaranteeYearMonthOptions(params.minDate)
  cy.get('[data-cy="guarantee-reserve-date-table-year-month"]').click()
  cy.get('[data-cy="guarantee-reserve-date-table-year-month"]')
    .find('li')
    .should('have.length', constructionOptions.length)
    .each((ul, index) => {
      cy.wrap(ul).should('contain', dayjs(constructionOptions[index]).format('YYYY/MM'))
    })
})

Cypress.Commands.add('assertEditFieldSurveyAndConstruction', params => {
  // 現地調査詳細情報 - 事前連絡先 - 事業所名
  cy.get('[data-cy="edit-field-survey-and-construction-field-survey-pre-contact-company-name"]')
    .find('input')
    .should('have.value', params.fieldSurvey?.preContactCompanyName ?? '')
    .should(params.fieldSurvey?.disabled ? 'be.disabled' : 'not.be.disabled')

  // 現地調査詳細情報 - 事前連絡先 - 担当者氏名
  cy.get('[data-cy="edit-field-survey-and-construction-field-survey-pre-contact-person-name"]')
    .find('input')
    .should('have.value', params.fieldSurvey?.preContactPersonName ?? '')
    .should(params.fieldSurvey?.disabled ? 'be.disabled' : 'not.be.disabled')

  // 現地調査詳細情報 - 事前連絡先 - 担当者電話番号
  cy.get('[data-cy="edit-field-survey-and-construction-field-survey-pre-contact-phone-number"]')
    .find('input')
    .should('have.value', params.fieldSurvey?.preContactPhoneNumber ?? '')
    .should(params.fieldSurvey?.disabled ? 'be.disabled' : 'not.be.disabled')

  // 現地調査詳細情報 - 立会者情報 - 事業所名
  cy.get('[data-cy="edit-field-survey-and-construction-field-survey-attendance-company-name"]')
    .find('input')
    .should('have.value', params.fieldSurvey?.attendanceCompanyName ?? '')
    .should(params.fieldSurvey?.disabled ? 'be.disabled' : 'not.be.disabled')

  // 現地調査詳細情報 - 立会者情報 - 担当者氏名
  cy.get('[data-cy="edit-field-survey-and-construction-field-survey-attendance-person-name"]')
    .find('input')
    .should('have.value', params.fieldSurvey?.attendancePersonName ?? '')
    .should(params.fieldSurvey?.disabled ? 'be.disabled' : 'not.be.disabled')

  // 現地調査詳細情報 - 立会者情報 - 担当者電話番号
  cy.get('[data-cy="edit-field-survey-and-construction-field-survey-attendance-phone-number"]')
    .find('input')
    .should('have.value', params.fieldSurvey?.attendancePhoneNumber ?? '')
    .should(params.fieldSurvey?.disabled ? 'be.disabled' : 'not.be.disabled')

  // 宅内工事詳細情報 - 事前連絡先 - 事業所名
  cy.get('[data-cy="edit-field-survey-and-construction-construction-pre-contact-company-name"]')
    .find('input')
    .should('have.value', params.construction?.preContactCompanyName ?? '')
    .should(params.construction?.disabled ? 'be.disabled' : 'not.be.disabled')

  // 宅内工事詳細情報 - 事前連絡先 - 担当者氏名
  cy.get('[data-cy="edit-field-survey-and-construction-construction-pre-contact-person-name"]')
    .find('input')
    .should('have.value', params.construction?.preContactPersonName ?? '')
    .should(params.construction.disabled ? 'be.disabled' : 'not.be.disabled')

  // 宅内工事詳細情報 - 事前連絡先 - 担当者電話番号
  cy.get('[data-cy="edit-field-survey-and-construction-construction-pre-contact-phone-number"]')
    .find('input')
    .should('have.value', params.construction?.preContactPhoneNumber ?? '')
    .should(params.construction.disabled ? 'be.disabled' : 'not.be.disabled')

  // 宅内工事詳細情報 - 立会者情報 - 事業所名
  cy.get('[data-cy="edit-field-survey-and-construction-construction-attendance-company-name"]')
    .find('input')
    .should('have.value', params.construction?.attendanceCompanyName ?? '')
    .should(params.construction.disabled ? 'be.disabled' : 'not.be.disabled')

  // 宅内工事詳細情報 - 立会者情報 - 担当者氏名
  cy.get('[data-cy="edit-field-survey-and-construction-construction-attendance-person-name"]')
    .find('input')
    .should('have.value', params.construction?.attendancePersonName ?? '')
    .should(params.construction.disabled ? 'be.disabled' : 'not.be.disabled')

  // 宅内工事詳細情報 - 立会者情報 - 担当者電話番号
  cy.get('[data-cy="edit-field-survey-and-construction-construction-attendance-phone-number"]')
    .find('input')
    .should('have.value', params.construction?.attendancePhoneNumber ?? '')
    .should(params.construction.disabled ? 'be.disabled' : 'not.be.disabled')
})
Cypress.Commands.add('inputEditFieldSurveyAndConstruction', params => {
  // 現地調査詳細情報 - 事前連絡先
  cy.get('[data-cy="edit-field-survey-and-construction-field-survey-pre-contact-company-name"]')
    .find('input')
    .clear()
    .type(params.fieldSurvey.preContactCompanyName)
  cy.get('[data-cy="edit-field-survey-and-construction-field-survey-pre-contact-person-name"]')
    .find('input')
    .clear()
    .type(params.fieldSurvey.preContactPersonName)
  cy.get('[data-cy="edit-field-survey-and-construction-field-survey-pre-contact-phone-number"]')
    .find('input')
    .clear()
    .type(params.fieldSurvey.preContactPhoneNumber)
  // 現地調査詳細情報 - 立会者情報
  cy.get('[data-cy="edit-field-survey-and-construction-field-survey-attendance-company-name"]')
    .find('input')
    .clear()
    .type(params.fieldSurvey.attendanceCompanyName)
  cy.get('[data-cy="edit-field-survey-and-construction-field-survey-attendance-person-name"]')
    .find('input')
    .clear()
    .type(params.fieldSurvey.attendancePersonName)
  cy.get('[data-cy="edit-field-survey-and-construction-field-survey-attendance-phone-number"]')
    .find('input')
    .clear()
    .type(params.fieldSurvey.attendancePhoneNumber)
  // 宅内工事詳細情報 - 事前連絡先
  cy.get('[data-cy="edit-field-survey-and-construction-construction-pre-contact-company-name"]')
    .find('input')
    .clear()
    .type(params.construction.preContactCompanyName)
  cy.get('[data-cy="edit-field-survey-and-construction-construction-pre-contact-person-name"]')
    .find('input')
    .clear()
    .type(params.construction.preContactPersonName)
  cy.get('[data-cy="edit-field-survey-and-construction-construction-pre-contact-phone-number"]')
    .find('input')
    .clear()
    .type(params.construction.preContactPhoneNumber)
  // 宅内工事詳細情報 - 立会者情報
  cy.get('[data-cy="edit-field-survey-and-construction-construction-attendance-company-name"]')
    .find('input')
    .clear()
    .type(params.construction.attendanceCompanyName)
  cy.get('[data-cy="edit-field-survey-and-construction-construction-attendance-person-name"]')
    .find('input')
    .clear()
    .type(params.construction.attendancePersonName)
  cy.get('[data-cy="edit-field-survey-and-construction-construction-attendance-phone-number"]')
    .find('input')
    .clear()
    .type(params.construction.attendancePhoneNumber)
})

Cypress.Commands.add('inputGuaranteeCreate', params => {
  // コマンド内で使ってる intercept 要素
  cy.intercept('POST', '**/ztgict/v1/iwan-util/search-address', {
    fixture: 'guarantees/circuits/search-address',
  }).as('postSearchAddress')
  cy.intercept('POST', '**/ztgict/v1/iwan-util/judge', { fixture: 'guarantees/circuits/judge' }).as('postJudge')
  cy.fixture('guarantees/circuits/search-date.json').then(data => {
    const fieldSurvey = {
      constructionDates: data.constructionDates.map((d: ConstructionDateType) => ({
        ...d,
        scheduledDate: params.reserveDate.fieldSurveyMinDate,
      })),
    }
    const construction = {
      constructionDates: data.constructionDates.map((d: ConstructionDateType) => ({
        ...d,
        scheduledDate: params.reserveDate.constructionMinDate,
      })),
    }
    cy.intercept('GET', '**/ztgict/v1/iwan-util/search-date?type=fieldSurvey*', { body: fieldSurvey }).as(
      'getFieldSurveySearchDate',
    )
    cy.intercept('GET', '**/ztgict/v1/iwan-util/search-date?type=construction*', { body: construction }).as(
      'getConstructionSearchDate',
    )
  })

  // コマンド処理
  cy.get('[data-cy="guarantees-circuits-create-applicant-input-button"]').should('be.disabled')
  // 住所検索
  cy.get('[data-cy="guarantee-search-address-postal-code"]').find('input').type(params.postalCode)
  cy.get('[data-cy="guarantee-search-address-postal-code"]').find('.submit-button').click()
  cy.wait('@postSearchAddress')
  cy.get('[data-cy="guarantees-circuits-create-applicant-input-button"]')
    .should('have.text', t('ipoes.moveToApplicantInput'))
    .click()
  cy.wait('@postJudge')

  // 新規作成画面 - 基本情報
  cy.inputSelectForm({
    selector: '[data-cy="guarantees-circuits-create-terminal-type"]',
    value: t(`terminals.${params.terminalType}`),
  })
  cy.get('[data-cy="guarantees-circuits-create-customer-note"]').find('input').type(params.inputData.customerNote)

  cy.inputSelectForm({
    selector: '[data-cy="guarantees-circuits-create-physical-bandwidth"]',
    value: params.inputData.physicalBandwidth,
  })

  // レンタルルーターの場合 ユーザー網インターフェース と 通信モード は固定
  if (params.terminalType === 'rentalTerminal') {
    cy.get('[data-cy="guarantees-circuits-create-user-interface-type"]')
      .find('input')
      .should('be.disabled')
      .should('have.value', params.inputData.physicalBandwidth === '100M' ? '100BASE-TX' : '1000BASE-T')
    cy.get('[data-cy="guarantees-circuits-create-communication-mode"]')
      .find('input')
      .should('be.disabled')
      .should(
        'have.value',
        params.inputData.physicalBandwidth === '100M' ? t('guarantees.fullDuplex') : t('guarantees.autoNego'),
      )
  }

  if (params.terminalType === 'selfTerminal') {
    if (params.inputData.physicalBandwidth === '100M') {
      cy.get('[data-cy="guarantees-circuits-create-user-interface-type"]')
        .find('input')
        .should('be.disabled')
        .should('have.value', '100BASE-TX')
      cy.get('[data-cy="guarantees-circuits-create-communication-mode"]')
        .find('input')
        .should('be.disabled')
        .should('have.value', t('guarantees.fullDuplex'))
    }
    if (params.inputData.physicalBandwidth === '1G') {
      cy.inputSelectForm({
        selector: '[data-cy="guarantees-circuits-create-user-interface-type"]',
        value: params.inputData.userInterfaceType,
      })
      if (params.inputData.userInterfaceType === '1000BASE-T') {
        cy.get('[data-cy="guarantees-circuits-create-communication-mode"]')
          .find('input')
          .should('be.disabled')
          .should('have.value', t('guarantees.autoNego'))
      } else {
        cy.inputSelectForm({
          selector: '[data-cy="guarantees-circuits-create-communication-mode"]',
          value:
            params.inputData.communicationMode === 'auto-nego' ? t('guarantees.autoNego') : t('guarantees.fullDuplex'),
        })
      }
    }
  }

  // 契約帯域の選択肢が絞られていることを確認する
  // インターネット契約帯域もVPN契約帯域もどちらも未入力の場合は required 要素になる
  const rateLimitList =
    params.inputData.physicalBandwidth === '100M'
      ? [...Array(10)].map((_, index) => (index + 1) * 10)
      : [...Array(10)].map((_, index) => (index + 1) * 100)
  const rateLimitOptions =
    params.terminalType === 'rentalTerminal'
      ? rateLimitList.filter(v => v <= 300).map(v => `${v}M`)
      : rateLimitList.map(v => (v === 1000 ? '1G' : `${v}M`))
  cy.get('[data-cy="guarantees-circuits-create-internet-rate-limit"]').click()
  cy.get('[data-cy="guarantees-circuits-create-internet-rate-limit"]')
    .find('li')
    .should('have.length', rateLimitOptions.length)
    .each((ul, index) => {
      cy.wrap(ul).should('contain', rateLimitOptions[index])
    })
  const vpnRateLimitOptions =
    params.inputData.physicalBandwidth === '100M'
      ? rateLimitOptions.filter(v => params.terminalType === 'selfTerminal' || v !== '100M')
      : rateLimitOptions
  cy.get('[data-cy="guarantees-circuits-create-vpn-rate-limit"]').click()
  cy.get('[data-cy="guarantees-circuits-create-vpn-rate-limit"]')
    .find('li')
    .should('have.length', vpnRateLimitOptions.length)
    .each((ul, index) => {
      cy.wrap(ul).should('contain', vpnRateLimitOptions[index])
    })

  // アラート通知設定
  // rateLimit が未選択の場合は threshold は disabled になってる
  cy.get('[data-cy="guarantees-circuits-create-internet-threshold"]').find('input').should('be.disabled')
  cy.get('[data-cy="guarantees-circuits-create-vpn-threshold"]').find('input').should('be.disabled')
  if (params.inputData.internet.rateLimit) {
    cy.inputSelectForm({
      selector: '[data-cy="guarantees-circuits-create-internet-rate-limit"]',
      value: params.inputData.internet.rateLimit,
    })
    cy.get('[data-cy="guarantees-circuits-create-internet-threshold"]').find('input').should('be.not.disabled')
  }
  if (params.inputData.vpn.rateLimit) {
    cy.inputSelectForm({
      selector: '[data-cy="guarantees-circuits-create-vpn-rate-limit"]',
      value: params.inputData.vpn.rateLimit,
    })
    cy.get('[data-cy="guarantees-circuits-create-vpn-threshold"]').find('input').should('not.be.disabled')
  }

  // threshold が未選択の場合は duration と notification-interval は disabled になってる
  cy.get('[data-cy="guarantees-circuits-create-internet-duration"]').find('input').should('be.disabled')
  cy.get('[data-cy="guarantees-circuits-create-internet-notification-interval"]').find('input').should('be.disabled')
  cy.get('[data-cy="guarantees-circuits-create-vpn-duration"]').find('input').should('be.disabled')
  cy.get('[data-cy="guarantees-circuits-create-vpn-notification-interval"]').find('input').should('be.disabled')

  if (params.inputData.internet?.alertSetting?.threshold) {
    cy.inputSelectForm({
      selector: '[data-cy="guarantees-circuits-create-internet-threshold"]',
      value: t('guarantees.thresholdOptionText', {
        value: params.inputData.internet.alertSetting.threshold,
      }),
    })
    cy.inputSelectForm({
      selector: '[data-cy="guarantees-circuits-create-internet-duration"]',
      value: t(`guarantees.${params.inputData.internet.alertSetting.duration}`),
    })
    cy.inputSelectForm({
      selector: '[data-cy="guarantees-circuits-create-internet-notification-interval"]',
      value: t(`guarantees.notificationInterval${params.inputData.internet.alertSetting.notificationInterval}`),
    })
  }

  if (params.inputData.vpn.rateLimit) {
    cy.inputSelectForm({
      selector: '[data-cy="guarantees-circuits-create-vpn-rate-limit"]',
      value: params.inputData.vpn.rateLimit,
    })
  }
  if (params.inputData.vpn?.alertSetting?.threshold) {
    cy.inputSelectForm({
      selector: '[data-cy="guarantees-circuits-create-vpn-threshold"]',
      value: t('guarantees.thresholdOptionText', {
        value: params.inputData.vpn.alertSetting.threshold,
      }),
    })
    cy.inputSelectForm({
      selector: '[data-cy="guarantees-circuits-create-vpn-duration"]',
      value: t(`guarantees.${params.inputData.vpn.alertSetting.duration}`),
    })
    cy.inputSelectForm({
      selector: '[data-cy="guarantees-circuits-create-vpn-notification-interval"]',
      value: t(`guarantees.notificationInterval${params.inputData.vpn.alertSetting.notificationInterval}`),
    })
  }

  // エイリアス
  cy.get('[data-cy="guarantees-circuits-create-field-survey-reserve-date-button"]').as('fieldSurveyButton')
  cy.get('[data-cy="guarantees-circuits-create-construction-reserve-date-button"]').as('constructionButton')
  cy.get('[data-cy="guarantees-circuits-create-submit"]').as('submitButton')

  // 新規作成画面 - 現地調査・宅内工事希望日の初期値
  cy.get('@fieldSurveyButton').should('be.disabled')
  cy.get('@constructionButton').should('be.disabled')
  cy.get('@submitButton').should('be.disabled')

  // 新規作成画面 - 現地調査
  cy.get('[data-cy="guarantees-circuits-create-field-survey-admission-application-required"]')
    .find(`.label.${params.inputData.fieldSurvey.admissionApplicationRequired}`)
    .click()
  cy.get('@fieldSurveyButton').should('not.be.disabled').click()
  cy.wait('@getFieldSurveySearchDate')

  // 候補年月のセレクタが今月+5か月になってることを確認する
  cy.checkGuaranteeYearMonthSelectOptions({ minDate: params.reserveDate.fieldSurveyMinDate })

  cy.get('[data-cy="guarantee-reserve-date-table"]').as('dateTable')
  cy.get('@dateTable').find('.radio.checked').should('have.length', 0)
  cy.get('.dialog-base-submit-button').should('be.disabled')
  cy.get('@dateTable').find('.time-table-cell .button').first().click()
  cy.get('.dialog-base-submit-button')

    .should('have.text', t('common.save'))
    .should('not.be.disabled')
    .click()

  // 現地調査希望日と希望時間帯の表示確認
  cy.get('[data-cy="guarantees-circuits-create-field-survey-date-time"]')
    .find('input')
    .should('be.disabled')
    .should(
      'have.value',
      `${params.reserveDate.fieldSurveyMinDate.replaceAll('-', '/')}  ${ScheduledTime[params.reserveDate.time as TimeType] || ''}`,
    )

  // 新規作成画面 - 宅内工事
  cy.get('[data-cy="guarantees-circuits-create-construction-admission-application-required"]')
    .find(`.label.${params.inputData.construction.admissionApplicationRequired}`)
    .click()
  cy.get('@constructionButton').should('not.be.disabled').click()
  cy.wait('@getConstructionSearchDate')
  cy.wait(500)

  // 候補年月のセレクタが今月+5か月になってることを確認する
  cy.checkGuaranteeYearMonthSelectOptions({ minDate: params.reserveDate.constructionMinDate })

  cy.get('@dateTable').find('.radio.checked').should('have.length', 0)
  cy.get('.dialog-base-submit-button').should('be.disabled')
  cy.get('@dateTable').find('.time-table-cell .button').first().click()
  cy.get('.dialog-base-submit-button')

    .should('have.text', t('common.save'))
    .should('not.be.disabled')
    .click()

  // 工事希望日と希望時間帯の表示確認
  cy.get('[data-cy="guarantees-circuits-create-construction-date-time"]')
    .find('input')
    .should('be.disabled')
    .should(
      'have.value',
      `${params.reserveDate.constructionMinDate.replaceAll('-', '/')}  ${ScheduledTime[params.reserveDate.time as TimeType] || ''}`,
    )

  // 新規作成画面 - 現地調査詳細情報・宅内工事詳細情報
  cy.inputEditFieldSurveyAndConstruction(params.inputData)
})

Cypress.Commands.add('inputGuaranteeRemove', params => {
  // エイリアスの設定
  cy.get('[data-cy="guarantees-circuits-id-remove-submit-button"]').as('submitButton')
  cy.get('[data-cy="guarantees-circuits-id-remove-reserve-date-button"]').as('reserveDateButton')
  cy.get('[data-cy="guarantees-circuits-id-remove-admission-application-required"]').as('admissionApplicationRequired')

  // 「確認」ボタンが disabled なことを確認
  cy.get('@submitButton').should('be.disabled')
  // 初期値確認
  cy.get('@admissionApplicationRequired').find('.radio.checked').should('have.length', 0)
  cy.get('[data-cy="guarantees-circuits-id-remove-date-time"]')
    .find('input')
    .as('date')
    .should('be.disabled')
    .should('have.value', '  ')
  // 稼働調整依頼
  cy.get('[data-cy="guarantees-circuits-id-remove-operation-adjustment"]')
    .as('operationAdjustment')
    .should('not.have.class', 'checked')
  // 宅内工事詳細情報 - 事前連絡先 - 事業所名
  cy.get('[data-cy="guarantees-circuits-id-remove-pre-contact-company-name"]')
    .find('input')
    .as('preContactCompanyName')
    .should('have.value', '')
  // 宅内工事詳細情報 - 事前連絡先 - 担当者氏名
  cy.get('[data-cy="guarantees-circuits-id-remove-pre-contact-person-name"]')
    .find('input')
    .as('preContactPersonName')
    .should('have.value', '')
  // 宅内工事詳細情報 - 事前連絡先 - 担当者電話番号
  cy.get('[data-cy="guarantees-circuits-id-remove-pre-contact-phone-number"]')
    .find('input')
    .as('preContactPhoneNumber')
    .should('have.value', '')
  // 「事前連絡先と同じ」のチェックボックス
  cy.get('[data-cy="guarantees-circuits-id-remove-attendance-information-label"]')
    .find('.checkbox')
    .as('samePreContact')
    .should('not.have.class', 'disabled')
    .should('not.have.class', 'checked')
  // 宅内工事詳細情報 - 立会者情報 - 事業所名
  cy.get('[data-cy="guarantees-circuits-id-remove-attendance-company-name"]')
    .find('input')
    .as('attendanceCompanyName')
    .should('have.value', '')
  // 宅内工事詳細情報 - 立会者情報 - 担当者氏名
  cy.get('[data-cy="guarantees-circuits-id-remove-attendance-person-name"]')
    .find('input')
    .as('attendancePersonName')
    .should('have.value', '')
  // 宅内工事詳細情報 - 立会者情報 - 担当者電話番号
  cy.get('[data-cy="guarantees-circuits-id-remove-attendance-phone-number"]')
    .find('input')
    .as('attendancePhoneNumber')
    .should('have.value', '')
  // 回収希望日の入館の情報を入力
  cy.get('@admissionApplicationRequired').find(`.label.${params.inputData.admissionApplicationRequired}`).click()
  if (!params.inputData.operationAdjustment) {
    // 「回収希望日を選択」を選択
    cy.get('@reserveDateButton').should('not.be.disabled').click()
    cy.wait('@getRemovalSearchDate')
    cy.get('[data-cy="guarantee-reserve-date-table"]').as('dateTable')
    // 日付と時間を選択
    cy.get('@dateTable').find('.radio.checked').should('have.length', 0)
    cy.get('.dialog-base-submit-button').should('be.disabled')
    cy.get('@dateTable').find('.time-table-cell .button').first().click()
    cy.get('.dialog-base-submit-button')

      .should('have.text', t('common.save'))
      .should('not.be.disabled')
      .click()

    // ダイアログが閉じたことを確認
    cy.get('@dateTable').should('not.exist')
  } else {
    // 稼働調整依頼
    cy.get('@operationAdjustment').click()
  }

  // 宅内工事詳細情報の入力
  cy.get('@preContactCompanyName').type(params.inputData.preContactCompanyName)
  cy.get('@preContactPersonName').type(params.inputData.preContactPersonName)
  cy.get('@preContactPhoneNumber').type(params.inputData.preContactPhoneNumber)
  cy.get('@attendanceCompanyName').type(params.inputData.attendanceCompanyName)
  cy.get('@attendancePersonName').type(params.inputData.attendancePersonName)
  cy.get('@attendancePhoneNumber').type(params.inputData.attendancePhoneNumber)

  // 入力値確認
  cy.checkGuaranteeRemove({
    ...params,
    inputData: {
      ...params.inputData,
    },
    isOrderRequest: false,
    isConfirmation: false,
  })
})

Cypress.Commands.add('checkGuaranteeRemove', params => {
  cy.get('[data-cy="guarantees-circuits-id-remove-reserve-date-button"]').as('reserveDateButton')
  if (params.isConfirmation || (!params.isOrderRequest && params.inputData.operationAdjustment)) {
    cy.get('@reserveDateButton').should('be.disabled')
  } else {
    cy.get('@reserveDateButton').should('not.be.disabled')
  }
  // 入館の情報
  cy.get('[data-cy="guarantees-circuits-id-remove-admission-application-required"]')
    .find(params.isOrderRequest || params.isConfirmation ? '.radio.checked.disabled' : '.radio.checked')
    .find(`.label.${params.inputData.admissionApplicationRequired}`)
    .should('have.length', 1)
  if (!params.inputData.operationAdjustment) {
    // 希望日
    cy.get('[data-cy="guarantees-circuits-id-remove-date-time"]')
      .find('input')
      .should('be.disabled')
      .should(
        'have.value',
        `${params.removalMinDate!.replaceAll('-', '/')}  ${ScheduledTime[params.time as TimeType] || ''}`,
      )
    // 稼働調整依頼
    cy.get('[data-cy="guarantees-circuits-id-remove-operation-adjustment"]').should('not.have.class', 'checked')
  } else {
    // 希望日
    cy.get('[data-cy="guarantees-circuits-id-remove-date-time"]')
      .find('input')
      .should('be.disabled')
      .should('have.value', '  ')
    // 稼働調整依頼
    cy.get('[data-cy="guarantees-circuits-id-remove-operation-adjustment"]').should('have.class', 'checked')
  }
  // 宅内工事詳細情報 - 事前連絡先 - 事業所名
  cy.get('[data-cy="guarantees-circuits-id-remove-pre-contact-company-name"]')
    .find('input')
    .should(params.isOrderRequest || params.isConfirmation ? 'be.disabled' : 'not.be.disabled')
    .should('have.value', params.inputData.preContactCompanyName)
  // 宅内工事詳細情報 - 事前連絡先 - 担当者氏名
  cy.get('[data-cy="guarantees-circuits-id-remove-pre-contact-person-name"]')
    .find('input')
    .should(params.isOrderRequest || params.isConfirmation ? 'be.disabled' : 'not.be.disabled')
    .should('have.value', params.inputData.preContactPersonName)
  // 宅内工事詳細情報 - 事前連絡先 - 担当者電話番号
  cy.get('[data-cy="guarantees-circuits-id-remove-pre-contact-phone-number"]')
    .find('input')
    .should(params.isOrderRequest || params.isConfirmation ? 'be.disabled' : 'not.be.disabled')
    .should('have.value', params.inputData.preContactPhoneNumber)
  // 「事前連絡先と同じ」のチェックボックス
  if (!params.isOrderRequest) {
    cy.get('[data-cy="guarantees-circuits-id-remove-attendance-information-label"]')
      .find('.checkbox')
      .should(params.isOrderRequest || params.isConfirmation ? 'have.class' : 'not.have.class', 'disabled')
      .should('not.have.class', 'checked')
  } else {
    cy.get('[data-cy="guarantees-circuits-id-remove-attendance-information-label"]')
      .find('.checkbox')
      .should('not.exist')
  }
  // 宅内工事詳細情報 - 立会者情報 - 事業所名
  cy.get('[data-cy="guarantees-circuits-id-remove-attendance-company-name"]')
    .find('input')
    .should(params.isOrderRequest || params.isConfirmation ? 'be.disabled' : 'not.be.disabled')
    .should('have.value', params.inputData.attendanceCompanyName)
  // 宅内工事詳細情報 - 立会者情報 - 担当者氏名
  cy.get('[data-cy="guarantees-circuits-id-remove-attendance-person-name"]')
    .find('input')
    .should(params.isOrderRequest || params.isConfirmation ? 'be.disabled' : 'not.be.disabled')
    .should('have.value', params.inputData.attendancePersonName)
  // 宅内工事詳細情報 - 立会者情報 - 担当者電話番号
  cy.get('[data-cy="guarantees-circuits-id-remove-attendance-phone-number"]')
    .find('input')
    .should(params.isOrderRequest || params.isConfirmation ? 'be.disabled' : 'not.be.disabled')
    .should('have.value', params.inputData.attendancePhoneNumber)
})
