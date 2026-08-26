import './commands'
import './commands-terminal'
import './commands-rink-mobile'

import { extend } from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'

extend(isSameOrAfter)

beforeEach(() => {
  cy.intercept('GET', '**/session?*', { fixture: 'session' }).as('getSession')
  cy.intercept('GET', '**/ztgict/v1/settings/mobile', { fixture: 'mobile/accepted-mobile' }).as('getMobile')
  cy.intercept('GET', '**/ztgict/v1/settings/traffic-report-flow-analyzer', {
    body: { termsOfServiceAccepted: true },
  }).as('getTrafficReportFlowAnalyzerTermsOfService')
  cy.intercept('GET', '**/ztgict/v1/settings/security', {
    body: { termsOfServiceAccepted: true },
  }).as('getSecurityTermsOfService')
  cy.intercept('GET', '**/ztgict/v1/settings/behavior-detection', {
    body: { thisMonthBehaviorDetectionPlan: 'none', nextMonthBehaviorDetectionPlan: 'none' },
  }).as('getSettingsBehaviorDetection')
})

Cypress.on('uncaught:exception', (_err, _runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false
})
