import dayjs, { extend } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { generateRandomHex, t } from '@cypress/support/utils'

extend(utc)

describe('phone ticketing support create', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)
    this.effectiveDate = dayjs().add(20, 'd').utc().format('YYYY-MM-DD')

    cy.fixture('phone-ticketing-support/create.json').then(create => {
      this.createData = create
    })

    cy.intercept('GET', '**/ztgict/v1/settings/phone-ticketing-support', {
      fixture: 'phone-ticketing-support/disabled',
    }).as('getRequest')
    cy.intercept('POST', '**/ztgict/v1/settings/phone-ticketing-support', {
      fixture: 'phone-ticketing-support/enabled',
    }).as('postRequest')
    cy.intercept('GET', '**/ztgict/v1/service-closed-days/phone-ticketing-support', {
      body: { closedDays: [] },
    }).as('getServiceClosedDays')
  })

  it('phone ticketing support create', function () {
    cy.visit(`/tenants/${this.tenantId}/supports/phone-ticketing-support`)
    cy.wait('@getRequest')
    cy.get('[data-cy="phone-ticketing-support-create-button"]').click()
    cy.wait(['@getRequest', '@getServiceClosedDays'])

    // 確認ボタンが非活性であることを確認
    cy.get('[data-cy="phone-ticketing-support-create-submit-button"]')
      .should('have.text', t('common.confirm'))
      .should('be.disabled')

    cy.inputDatePicker({
      className: '[data-cy="phone-ticketing-support-create-effective-date"]',
      date: this.effectiveDate,
    })
    cy.get('[data-cy="phone-ticketing-support-create-pic-name"]').find('input').type(this.createData.picName)
    cy.get('[data-cy="phone-ticketing-support-create-pic-phone-number"]')
      .find('input')
      .type(this.createData.picPhoneNumber)
    cy.get('[data-cy="phone-ticketing-support-create-submit-button"]').should('have.text', t('common.confirm')).click()

    cy.get('[data-cy="phone-ticketing-support-create-effective-date"]').find('input').should('be.disabled')
    cy.get('[data-cy="phone-ticketing-support-create-pic-name"]').find('input').should('be.disabled')
    cy.get('[data-cy="phone-ticketing-support-create-pic-phone-number"]').find('input').should('be.disabled')
    cy.get('[data-cy="phone-ticketing-support-create-submit-button"]').should('have.text', t('common.create')).click()

    cy.wait('@postRequest').then(req => {
      expect(req.request.body).to.deep.eq({
        effectiveDate: this.effectiveDate,
        picName: this.createData.picName,
        picPhoneNumber: this.createData.picPhoneNumber,
      })
    })

    // POST phone-ticketing-support の成功メッセージを確認
    cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('phoneTicketingSupport.registered'))
    cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
    cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.close')).click()
    cy.get('[data-cy="notification-dialog-text"]').should('not.exist')

    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/supports/phone-ticketing-support`)
  })

  it('getServiceClosedDays が 500 エラーの場合、ダイアログが表示され、DatePicker が disabled になり、確認ボタンが押せない', function () {
    cy.intercept('GET', '**/ztgict/v1/service-closed-days/phone-ticketing-support', {
      statusCode: 500,
      body: { errorCode: 500, errorMessage: '500 Internal Server Error!' },
    }).as('getServiceClosedDaysError')

    cy.visit(`/tenants/${this.tenantId}/supports/phone-ticketing-support`)
    cy.wait('@getRequest')
    cy.get('[data-cy="phone-ticketing-support-create-button"]').click()
    cy.wait(['@getRequest', '@getServiceClosedDaysError'])

    // エラーダイアログの表示
    cy.get('[data-cy="notification-dialog-text"]').should(
      'have.text',
      `${t('message.failed')}\n500\n500 Internal Server Error!`,
    )
    cy.get('[data-cy="notification-dialog-submit-button"]').click()

    // DatePicker が disabled になっている
    cy.get('[data-cy="phone-ticketing-support-create-effective-date"]').find('input').should('be.disabled')

    // 確認ボタンが disabled になっている
    cy.get('[data-cy="phone-ticketing-support-create-submit-button"]').should('be.disabled')
  })
})
