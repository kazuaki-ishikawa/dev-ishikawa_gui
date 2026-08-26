import { generateRandomHex, t } from '@cypress/support/utils'

describe('phone ticketing support detail', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)

    cy.visit(`/tenants/${this.tenantId}/supports/phone-ticketing-support`)
  })
  it('phone ticketing support detail when enable:false', function () {
    cy.intercept('GET', '**/ztgict/v1/settings/phone-ticketing-support', {
      fixture: 'phone-ticketing-support/disabled',
    }).as('getDisabledRequest')
    cy.wait('@getDisabledRequest')

    cy.get('[data-cy="phone-ticketing-support-create-button"]').should('have.text', t('common.createNew'))
    cy.get('[data-cy="phone-ticketing-support-edit-button"]').should('not.exist')
    cy.get('[data-cy="phone-ticketing-support-delete-button"]').should('not.exist')
  })
  it('phone ticketing support detail when enable:false with unnecessary properties', function () {
    cy.intercept('GET', '**/ztgict/v1/settings/phone-ticketing-support', {
      fixture: 'phone-ticketing-support/disabled_with_unnecessary_properties',
    }).as('getDisabledRequest')
    cy.wait('@getDisabledRequest')
    cy.get('[data-cy="phone-ticketing-support-detail-support-id"]').should('not.have.text')
    cy.get('[data-cy="phone-ticketing-support-detail-effective-date"]').should('not.have.text')
    cy.get('[data-cy="phone-ticketing-support-detail-pic-name"]').should('not.have.text')
    cy.get('[data-cy="phone-ticketing-support-detail-pic-phone-number"]').should('not.have.text')
    cy.get('[data-cy="phone-ticketing-support-detail-support-phone-number"]').should('not.have.text')
    cy.get('[data-cy="phone-ticketing-support-detail-order-id"]').should('not.have.text')
    cy.get('[data-cy="phone-ticketing-support-create-button"]').should('have.text', t('common.createNew'))
    cy.get('[data-cy="phone-ticketing-support-edit-button"]').should('not.exist')
    cy.get('[data-cy="phone-ticketing-support-delete-button"]').should('not.exist')
  })
  it('phone ticketing support detail when enable:true', function () {
    cy.intercept('GET', '**/ztgict/v1/settings/phone-ticketing-support', {
      fixture: 'phone-ticketing-support/enabled',
    }).as('getEnabledRequest')
    cy.wait('@getEnabledRequest')

    cy.get('[data-cy="phone-ticketing-support-create-button"]').should('not.exist')
    cy.get('[data-cy="phone-ticketing-support-edit-button"]').should('have.text', t('common.edit'))
    cy.get('[data-cy="phone-ticketing-support-delete-button"]').should('have.text', t('common.delete'))
  })
})
