import { generateRandomHex, t } from '@cypress/support/utils'

describe('セキュリティ機能およびフロー可視化機能に関わる同意事項', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)
    cy.fixture('mobile/mobile-download-terms-of-service.json').then(downloadedTermsOfService => {
      this.downloadedTermsOfService = downloadedTermsOfService.decodedContent
    })
    cy.fixture('traffic-report-flow-analyzer/terms-of-service.json').then(termsOfService => {
      this.trafficReportFlowAnalyzerTermsOfService = termsOfService
    })
    cy.fixture('security/terms-of-service.json').then(termsOfService => {
      this.securityTermsOfService = termsOfService
    })

    cy.intercept('GET', '**/ztgict/v1/download-terms-of-service*', {
      fixture: 'mobile/mobile-download-terms-of-service',
    }).as('getDownloadTermsOfService')

    // セキュリティ
    cy.intercept('GET', '**/ztgict/v1/settings/security', {
      body: { termsOfServiceAccepted: false },
    }).as('getNoAcceptedSecurity')
    cy.intercept('GET', '**/ztgict/v1/settings/security/terms-of-service', {
      fixture: 'security/terms-of-service',
    }).as('getSecurityTermsOfService')
    cy.intercept('POST', '**/ztgict/v1/settings/security/terms-of-service/agree', {}).as('postSecurityTermsOfService')

    // フロー可視化
    cy.intercept('GET', '**/ztgict/v1/settings/traffic-report-flow-analyzer', {
      body: { termsOfServiceAccepted: false },
    }).as('getNoAcceptedTrafficReportFlowAnalyzer')
    cy.intercept('GET', '**/ztgict/v1/settings/traffic-report-flow-analyzer/terms-of-service', {
      fixture: 'traffic-report-flow-analyzer/terms-of-service',
    }).as('getTrafficReportFlowAnalyzerTermsOfService')
    cy.intercept('POST', '**/ztgict/v1/settings/traffic-report-flow-analyzer/terms-of-service/agree', {}).as(
      'postTrafficReportFlowAnalyzerTermsOfService',
    )
  })

  it('セキュリティ機能およびフロー可視化機能に関わる同意事項', function () {
    cy.visit(`/tenants/${this.tenantId}/contracts/security-traffic-report-flow-analyzer`)
    cy.wait([
      '@getNoAcceptedTrafficReportFlowAnalyzer',
      '@getNoAcceptedSecurity',
      '@getTrafficReportFlowAnalyzerTermsOfService',
      '@getSecurityTermsOfService',
    ])
    cy.wait(this.trafficReportFlowAnalyzerTermsOfService.listedTermsOfService.map(() => '@getDownloadTermsOfService'))
    cy.wait(this.securityTermsOfService.listedTermsOfService.map(() => '@getDownloadTermsOfService'))

    // 同意ボタンを押す前に同意済みのintercept作成
    cy.intercept('GET', '**/ztgict/v1/settings/security', {
      body: { termsOfServiceAccepted: true },
    }).as('getAcceptedSecurity')
    cy.intercept('GET', '**/ztgict/v1/settings/traffic-report-flow-analyzer', {
      body: { termsOfServiceAccepted: true },
    }).as('getAcceptedTrafficReportFlowAnalyzer')

    /*********************************/
    /** セキュリティ機能利用に関する同意 **/
    /********************************/
    cy.get('[data-cy="security-traffic-report-flow-analyzer-security"]').as('security')
    cy.get('@security').find('[data-cy="contractor-contractor-terms-and-conditions-back-button"]').should('not.exist')
    cy.get('@security')
      .find('[data-cy="contractor-contractor-terms-and-conditions-submit-button"]')
      .should('have.text', t('terms.agreement'))
      .should('be.disabled')

    this.securityTermsOfService.listedTermsOfService.forEach((_: { name: string; uuid: string }, index: number) => {
      cy.get('@security')
        .find(`[data-cy="contractor-terms-and-conditions-terms-of-service-${index}"]`)
        .find('div')
        .should('have.text', this.downloadedTermsOfService + '\n')
      cy.get('@security')
        .find(`[data-cy="contractor-contractor-terms-and-conditions-agreement-${index}"]`)
        .find('.checkbox')
        .click()
    })

    cy.get('@security')
      .find('[data-cy="contractor-contractor-terms-and-conditions-submit-button"]')
      .should('have.text', t('terms.agreement'))
      .should('be.not.disabled')
      .click()

    cy.wait('@postSecurityTermsOfService').then(req => {
      expect(req.request.body).to.deep.equal({
        agreementCode: this.securityTermsOfService.agreementCode,
      })
    })
    // POST agree の成功メッセージを確認
    cy.get('[data-cy="snack-bar-text"]').should('have.text', t('message.succeeded'))
    cy.wait('@getAcceptedSecurity')

    // チェックボックスのラベルが「同意済」になり、disabled になることを確認
    this.securityTermsOfService.listedTermsOfService.forEach((_: { name: string; uuid: string }, index: number) => {
      cy.get('@security')
        .find(`[data-cy="contractor-contractor-terms-and-conditions-agreement-${index}"]`)
        .find('.checkbox')
        .should('have.class', 'checked')
        .and('have.class', 'disabled')
      cy.get('@security')
        .find(`[data-cy="contractor-contractor-terms-and-conditions-agreement-${index}"]`)
        .should('contain', t('terms.agreed'))
    })

    // ボタンのラベルが変わって disabled になることを確認
    cy.get('@security')
      .find('[data-cy="contractor-contractor-terms-and-conditions-submit-button"]')
      .should('have.text', t('terms.agreed'))
      .should('be.disabled')

    // POST agree の成功メッセージが消えるまで待つ
    cy.get('[data-cy="snack-bar-text"]').should('not.exist')

    /*********************************/
    /** フロー可視化機能利用に関する同意 **/
    /********************************/
    cy.get('[data-cy="security-traffic-report-flow-analyzer-traffic-report-flow-analyzer"]').as(
      'trafficReportFlowAnalyzer',
    )
    cy.get('@trafficReportFlowAnalyzer')
      .find('[data-cy="contractor-contractor-terms-and-conditions-back-button"]')
      .should('not.exist')
    cy.get('@trafficReportFlowAnalyzer')
      .find('[data-cy="contractor-contractor-terms-and-conditions-submit-button"]')
      .should('have.text', t('terms.agreement'))
      .should('be.disabled')

    this.trafficReportFlowAnalyzerTermsOfService.listedTermsOfService.forEach(
      (_: { name: string; uuid: string }, index: number) => {
        cy.get('@trafficReportFlowAnalyzer')
          .find(`[data-cy="contractor-terms-and-conditions-terms-of-service-${index}"]`)
          .find('div')
          .should('have.text', this.downloadedTermsOfService + '\n')
        cy.get('@trafficReportFlowAnalyzer')
          .find(`[data-cy="contractor-contractor-terms-and-conditions-agreement-${index}"]`)
          .find('.checkbox')
          .click()
      },
    )
    cy.get('@trafficReportFlowAnalyzer')
      .find('[data-cy="contractor-contractor-terms-and-conditions-submit-button"]')
      .should('have.text', t('terms.agreement'))
      .should('be.not.disabled')
      .click()

    cy.wait('@postTrafficReportFlowAnalyzerTermsOfService').then(req => {
      expect(req.request.body).to.deep.equal({
        agreementCode: this.trafficReportFlowAnalyzerTermsOfService.agreementCode,
      })
    })
    // POST agree の成功メッセージを確認
    cy.get('[data-cy="snack-bar-text"]').should('have.text', t('message.succeeded'))
    cy.wait('@getAcceptedTrafficReportFlowAnalyzer')

    // チェックボックスのラベルが「同意済」になり、disabled になることを確認
    this.trafficReportFlowAnalyzerTermsOfService.listedTermsOfService.forEach(
      (_: { name: string; uuid: string }, index: number) => {
        cy.get('@trafficReportFlowAnalyzer')
          .find(`[data-cy="contractor-contractor-terms-and-conditions-agreement-${index}"]`)
          .find('.checkbox')
          .should('have.class', 'checked')
          .and('have.class', 'disabled')
        cy.get('@trafficReportFlowAnalyzer')
          .find(`[data-cy="contractor-contractor-terms-and-conditions-agreement-${index}"]`)
          .should('contain', t('terms.agreed'))
      },
    )

    // ボタンのラベルが変わって disabled になることを確認
    cy.get('@trafficReportFlowAnalyzer')
      .find('[data-cy="contractor-contractor-terms-and-conditions-submit-button"]')
      .should('have.text', t('terms.agreed'))
      .should('be.disabled')
  })
})
