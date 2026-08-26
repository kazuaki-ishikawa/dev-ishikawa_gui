import { generateRandomHex, t } from '@cypress/support/utils'

describe('mobile information edit', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)
    cy.fixture('contractor/create.json').then(create => {
      this.edit = create.mobile
    })
    cy.fixture('mobile/accepted-mobile.json').then(agreed => {
      this.agreed = agreed
    })
    cy.fixture('mobile/mobile-terms-of-service.json').then(mobileTermsOfService => {
      this.mobileTermsOfService = mobileTermsOfService
    })
    cy.fixture('mobile/mobile-download-terms-of-service.json').then(downloadedTermsOfService => {
      this.downloadedTermsOfService = downloadedTermsOfService.decodedContent
    })

    cy.intercept('PUT', '**/ztgict/v1/settings/mobile', {}).as('putMobile')
    cy.intercept('GET', '**/ztgict/v1/settings/mobile/mobile-terms-of-service', {
      fixture: 'mobile/mobile-terms-of-service',
    }).as('getMobileTermsOfService')
    cy.intercept('GET', '**/ztgict/v1/download-terms-of-service*', {
      fixture: 'mobile/mobile-download-terms-of-service',
    }).as('getDownloadMobileMonitoringTermsOfService')
    cy.intercept('POST', '**/ztgict/v1/settings/mobile/mobile-terms-of-service/agree', {}).as(
      'postMobileTermsOfService',
    )

    cy.visit(`/tenants/${this.tenantId}/contracts/mobile`)
  })

  it('mobile (accepted: true)', function () {
    cy.wait('@getMobile')

    // 編集画面に遷移
    cy.get('[data-cy="contracts-mobile-index-mobile-edit-button"]')
      .should('have.text', t('common.edit'))
      .should('be.disabled')
  })

  it('mobile (accepted: false)', function () {
    cy.intercept('GET', '**/ztgict/v1/settings/mobile', { fixture: 'mobile/no-accepted-mobile' }).as('getMobile')
    cy.wait('@getMobile')
    cy.get('[data-cy="contracts-mobile-index-mobile-edit-button"]').click()
    cy.wait('@getMobile')

    // モバイル情報入力
    cy.get('[data-cy="mobile-information-edit-mobile-discount-code"]')
      .find('input')
      .type(this.agreed.mobileDiscountCode)
    // ボタン
    cy.get('[data-cy="mobile-information-edit-cancel-button"]').should('have.text', t('common.cancel'))
    cy.get('[data-cy="mobile-information-edit-submit-button"]').should('have.text', t('common.next')).click()

    // PUT mobile のリクエスト情報を確認
    cy.wait('@putMobile').then(req => {
      expect(req.request.url).to.include('ztgict/v1/settings/mobile')
      expect(req.request.body).to.deep.equal({
        mobileDiscountCode: this.agreed.mobileDiscountCode,
      })
    })
    //  PUT mobile の成功メッセージを確認
    cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('message.updated'))
    cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
    cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.close')).click()
    cy.get('[data-cy="notification-dialog-text"]').should('not.exist')

    cy.url().should(
      'eq',
      `${Cypress.config().baseUrl}/tenants/${this.tenantId}/contracts/mobile/mobile-terms-of-service`,
    )

    cy.wait(['@getMobile', '@getMobileTermsOfService'])
    cy.wait(this.mobileTermsOfService.listedTermsOfService.map(() => '@getDownloadMobileMonitoringTermsOfService'))
    // モバイル約款同意(同意する)
    cy.get('[data-cy="contractor-contractor-terms-and-conditions-submit-button"]')
      .should('have.text', t('terms.agreement'))
      .as('submitButton')
      .should('be.disabled')

    this.mobileTermsOfService.listedTermsOfService.forEach((_: { name: string; uuid: string }, index: number) => {
      cy.get(`[data-cy="contractor-terms-and-conditions-terms-of-service-${index}"]`).should(
        'have.text',
        this.downloadedTermsOfService + '\n',
      )
      cy.get(`[data-cy="contractor-contractor-terms-and-conditions-agreement-${index}"]`).find('.checkbox').click()
      cy.get(`[data-cy="contractor-contractor-terms-and-conditions-agreement-${index}"]`).should(
        'contain',
        t('terms.agreement'),
      )
    })
    cy.get('@submitButton').should('not.be.disabled').click()

    cy.wait('@postMobileTermsOfService').then(req => {
      expect(req.request.url).to.include('ztgict/v1/settings/mobile/mobile-terms-of-service/agree')
      expect(req.request.body).to.deep.equal({
        agreementCode: this.mobileTermsOfService.agreementCode,
      })
    })
    // POST settings/mobile/mobile-terms-of-service/agree の成功メッセージを確認
    cy.get('[data-cy="snack-bar-text"]').should('have.text', t('message.succeeded'))
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/contracts/mobile`)
  })

  it('terms (accepted: true)', function () {
    cy.wait('@getMobile')

    // モバイル約款同意画面に遷移
    cy.get('[data-cy="contracts-mobile-index-terms-of-service-button"]')
      .should('have.text', t('mobile.termsOfService'))
      .click()
    cy.wait(['@getMobileTermsOfService'])
    cy.wait(this.mobileTermsOfService.listedTermsOfService.map(() => '@getDownloadMobileMonitoringTermsOfService'))
    // モバイル約款同意(同意済み)
    this.mobileTermsOfService.listedTermsOfService.forEach((_: { name: string; uuid: string }, index: number) => {
      cy.get(`[data-cy="contractor-terms-and-conditions-terms-of-service-${index}"]`).should(
        'have.text',
        this.downloadedTermsOfService + '\n',
      )
      cy.get(`[data-cy="contractor-contractor-terms-and-conditions-agreement-${index}"]`)
        .find('.checkbox')
        .should('have.class', 'checked')
        .and('have.class', 'disabled')
      cy.get(`[data-cy="contractor-contractor-terms-and-conditions-agreement-${index}"]`).should(
        'contain',
        t('terms.agreed'),
      )
    })

    cy.get('[data-cy="contractor-contractor-terms-and-conditions-submit-button"]')

      .should('have.text', t('terms.agreed'))
      .should('be.disabled')
    cy.get('[data-cy="contractor-contractor-terms-and-conditions-back-button"]')
      .should('have.text', t('common.return'))
      .click()

    cy.wait('@getMobile')
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/contracts/mobile`)
  })
})
