import dayjs, { extend } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { generateRandomHex, t } from '@cypress/support/utils'

extend(utc)

describe('phone ticketing support delete', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)
    this.effectiveDate = dayjs().add(20, 'd').utc().format('YYYY-MM-DD')

    cy.fixture('phone-ticketing-support/create.json').then(create => {
      this.createData = create
    })

    cy.intercept('GET', '**/ztgict/v1/settings/phone-ticketing-support', {
      fixture: 'phone-ticketing-support/enabled',
    }).as('getRequest')
    cy.intercept('DELETE', '**/ztgict/v1/settings/phone-ticketing-support', {
      fixture: 'phone-ticketing-support/enabled',
    }).as('deleteRequest')
    cy.intercept('GET', '**/ztgict/v1/service-closed-days/phone-ticketing-support', {
      body: { closedDays: [] },
    }).as('getServiceClosedDays')
  })

  it('phone ticketing support delete', function () {
    cy.visit(`/tenants/${this.tenantId}/supports/phone-ticketing-support`)
    cy.wait('@getRequest')
    cy.get('[data-cy="phone-ticketing-support-delete-button"]').click()
    cy.wait(['@getRequest', '@getServiceClosedDays'])

    cy.inputDatePicker({
      className: '[data-cy="phone-ticketing-support-remove-effective-date"]',
      date: this.effectiveDate,
    })
    cy.get('[data-cy="phone-ticketing-support-remove-submit-button"]').should('have.text', t('common.confirm')).click()

    cy.get('[data-cy="phone-ticketing-support-remove-effective-date"]').find('input').should('be.disabled')
    cy.get('[data-cy="phone-ticketing-support-remove-submit-button"]')
      .should('have.text', t('common.abolition'))
      .click()

    cy.wait('@deleteRequest').then(req => {
      expect(req.request.url).to.include('ztgict/v1/settings/phone-ticketing-support')
      expect(req.request.body.effectiveDate).to.eq(this.effectiveDate)
    })

    // DELETE phone-ticketing-support の成功メッセージを確認
    cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('phoneTicketingSupport.deleted'))
    cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
    cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.close')).click()
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/supports/phone-ticketing-support`)
  })

  it('getServiceClosedDays が 500 エラーの場合、ダイアログが表示され、DatePicker が disabled になり、確認ボタンが押せない', function () {
    cy.intercept('GET', '**/ztgict/v1/service-closed-days/phone-ticketing-support', {
      statusCode: 500,
      body: { errorCode: 500, errorMessage: '500 Internal Server Error!' },
    }).as('getServiceClosedDaysError')

    cy.visit(`/tenants/${this.tenantId}/supports/phone-ticketing-support`)
    cy.wait('@getRequest')
    cy.get('[data-cy="phone-ticketing-support-delete-button"]').click()
    cy.wait(['@getRequest', '@getServiceClosedDaysError'])

    // エラーダイアログの表示
    cy.get('[data-cy="notification-dialog-text"]').should(
      'have.text',
      `${t('message.failed')}\n500\n500 Internal Server Error!`,
    )
    cy.get('[data-cy="notification-dialog-submit-button"]').click()

    // DatePicker が disabled になっている
    cy.get('[data-cy="phone-ticketing-support-remove-effective-date"]').find('input').should('be.disabled')

    // 確認ボタンが disabled になっている
    cy.get('[data-cy="phone-ticketing-support-remove-submit-button"]').should('be.disabled')
  })
})
