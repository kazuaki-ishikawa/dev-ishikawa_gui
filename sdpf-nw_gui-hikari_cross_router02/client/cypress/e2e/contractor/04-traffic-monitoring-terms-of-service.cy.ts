import { generateRandomHex, t } from '@cypress/support/utils'

describe('traffic-monitoring terms of service', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)
    cy.fixture('traffic-monitoring/traffic-monitoring-terms-of-service.json').then(trafficMonitoringTermsOfService => {
      this.trafficMonitoringTermsOfService = trafficMonitoringTermsOfService
    })
    cy.fixture('traffic-monitoring/traffic-monitoring-download-terms-of-service.json').then(
      downloadedTermsOfService => {
        this.downloadedTermsOfService = downloadedTermsOfService.decodedContent
      },
    )

    cy.intercept('PUT', '**/ztgict/v1/settings/mobile', {}).as('putMobile')
    cy.intercept('GET', '**/ztgict/v1/settings/traffic-monitoring/terms-of-service', {
      fixture: 'traffic-monitoring/traffic-monitoring-terms-of-service',
    }).as('getTrafficMonitoringTermsOfService')
    cy.intercept('GET', '**/ztgict/v1/download-terms-of-service*', {
      fixture: 'traffic-monitoring/traffic-monitoring-download-terms-of-service',
    }).as('getDownloadTrafficMonitoringTermsOfService')
    cy.intercept('POST', '**/ztgict/v1/settings/traffic-monitoring/terms-of-service/agree', {}).as(
      'postTrafficMonitoringTermsOfService',
    )
  })

  it('traffic-monitoring terms of service', function () {
    // トラフィック収集の同意情報（同意前）
    cy.intercept('GET', '**/ztgict/v1/settings/traffic-monitoring', {
      fixture: 'traffic-monitoring/no-accepted-traffic-monitoring',
    }).as('getTrafficMonitoring')

    cy.visit(`/tenants/${this.tenantId}/contracts/traffic-monitoring`)
    cy.wait(['@getTrafficMonitoringTermsOfService', '@getTrafficMonitoring'])
    cy.wait(
      this.trafficMonitoringTermsOfService.listedTermsOfService.map(
        () => '@getDownloadTrafficMonitoringTermsOfService',
      ),
    )
    // 同意ボタンを押す前に同意済みのintercept作成
    cy.intercept('GET', '**/ztgict/v1/settings/traffic-monitoring', {
      fixture: 'traffic-monitoring/accepted-traffic-monitoring',
    }).as('getTrafficMonitoring')

    cy.get('[data-cy="contractor-contractor-terms-and-conditions-back-button"]').should('not.exist')
    cy.get('[data-cy="contractor-contractor-terms-and-conditions-submit-button"]')
      .should('have.text', t('terms.agreement'))
      .should('be.disabled')
    this.trafficMonitoringTermsOfService.listedTermsOfService.forEach(
      (_: { name: string; uuid: string }, index: number) => {
        cy.get(`[data-cy="contractor-terms-and-conditions-terms-of-service-${index}"]`)
          .find('div')
          .should('have.text', this.downloadedTermsOfService + '\n')
        cy.get(`[data-cy="contractor-contractor-terms-and-conditions-agreement-${index}"]`).find('.checkbox').click()
      },
    )
    cy.get('[data-cy="contractor-contractor-terms-and-conditions-submit-button"]')
      .should('have.text', t('terms.agreement'))
      .should('be.not.disabled')
      .click()

    cy.wait('@postTrafficMonitoringTermsOfService').then(req => {
      expect(req.request.url).to.include('ztgict/v1/settings/traffic-monitoring/terms-of-service/agree')
      expect(req.request.body).to.deep.equal({
        agreementCode: this.trafficMonitoringTermsOfService.agreementCode,
      })
    })
    cy.wait('@getTrafficMonitoring')

    // POST settings/mobile/mobile-terms-of-service/agree の成功メッセージを確認
    cy.get('[data-cy="snack-bar-text"]').should('have.text', t('message.succeeded'))

    // ボタンのラベルが変わって disabled になることを確認
    cy.get('[data-cy="contractor-contractor-terms-and-conditions-submit-button"]')
      .should('have.text', t('terms.agreed'))
      .should('be.disabled')

    // チェックボックスのラベルが「同意済」になり、disabled になることを確認
    this.trafficMonitoringTermsOfService.listedTermsOfService.forEach(
      (_: { name: string; uuid: string }, index: number) => {
        cy.get(`[data-cy="contractor-contractor-terms-and-conditions-agreement-${index}"]`)
          .find('.checkbox')
          .should('have.class', 'checked')
          .and('have.class', 'disabled')
        cy.get(`[data-cy="contractor-contractor-terms-and-conditions-agreement-${index}"]`).should(
          'contain',
          t('terms.agreed'),
        )
      },
    )
  })
})
