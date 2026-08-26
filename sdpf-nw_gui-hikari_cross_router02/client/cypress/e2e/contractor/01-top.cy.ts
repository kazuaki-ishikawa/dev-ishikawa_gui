import { generateRandomHex, t } from '../../support/utils'

const STEPS = {
  CONTRACTOR: 'contractor',
  MOBILE: 'mobile',
  MOBILE_TERMS: 'mobile-terms',
  TRAFFIC_MONITORING: 'traffic-monitoring',
  TRAFFIC_REPORT_FLOW_ANALYZER: 'traffic-report-flow-analyzer',
  SECURITY: 'security',
} as const

describe('top', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)
    this.baseUrl = `${Cypress.config().baseUrl}/tenants/${this.tenantId}`

    cy.fixture('contractor/create.json').then(create => {
      this.contractor = create.contractor
      this.mobile = create.mobile
    })
    cy.fixture('mobile/mobile-terms-of-service.json').then(mobileTermsOfService => {
      this.mobileTermsOfService = mobileTermsOfService
    })
    cy.fixture('mobile/mobile-download-terms-of-service.json').then(downloadedTermsOfService => {
      this.downloadedTermsOfService = downloadedTermsOfService.decodedContent
    })
    cy.fixture('traffic-monitoring/traffic-monitoring-terms-of-service.json').then(trafficMonitoringTermsOfService => {
      this.trafficMonitoringTermsOfService = trafficMonitoringTermsOfService
    })
    cy.fixture('traffic-report-flow-analyzer/terms-of-service.json').then(termsOfService => {
      this.trafficReportFlowAnalyzerTermsOfService = termsOfService
    })
    cy.fixture('security/terms-of-service.json').then(termsOfService => {
      this.securityTermsOfService = termsOfService
    })

    // テナントリスト
    cy.intercept('GET', '**/ztgict/v1/tenants', {}).as('getTenantList')
    // モバイル約款情報
    cy.intercept('GET', '**/ztgict/v1/settings/mobile/mobile-terms-of-service', {
      fixture: 'mobile/mobile-terms-of-service',
    }).as('getMobileTermsOfService')
    cy.intercept('GET', '**/ztgict/v1/download-terms-of-service*', {
      fixture: 'mobile/mobile-download-terms-of-service',
    }).as('getDownloadMobileMonitoringTermsOfService')
    cy.intercept('POST', '**/ztgict/v1/settings/mobile/mobile-terms-of-service/agree', {}).as(
      'postMobileTermsOfService',
    )
    // トラフィック収集の約款情報
    cy.intercept('GET', '**/ztgict/v1/settings/traffic-monitoring', {
      fixture: 'traffic-monitoring/no-accepted-traffic-monitoring',
    }).as('getNoAcceptedTrafficMonitoring')
    cy.intercept('GET', '**/ztgict/v1/settings/traffic-monitoring/terms-of-service', {
      fixture: 'traffic-monitoring/traffic-monitoring-terms-of-service',
    }).as('getTrafficMonitoringTermsOfService')
    cy.intercept('POST', '**/ztgict/v1/settings/traffic-monitoring/terms-of-service/agree', {}).as(
      'postTrafficMonitoringTermsOfService',
    )

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
    // セキュリティ
    cy.intercept('GET', '**/ztgict/v1/settings/security', {
      body: { termsOfServiceAccepted: false },
    }).as('getNoAcceptedSecurity')
    cy.intercept('GET', '**/ztgict/v1/settings/security/terms-of-service', {
      fixture: 'security/terms-of-service',
    }).as('getSecurityTermsOfService')
    cy.intercept('POST', '**/ztgict/v1/settings/security/terms-of-service/agree', {}).as('postSecurityTermsOfService')

    // PUT
    cy.intercept('PUT', '**/ztgict/v1/settings/contractor', {}).as('putContractor')
    cy.intercept('PUT', '**/ztgict/v1/settings/mobile', {}).as('putMobile')

    // 契約者情報画面
    cy.intercept('GET', '**/ztgict/v1/ipoe/hikari-collabo-util/available', { body: { available: true } }).as(
      'getAvailable',
    )
    // summaryに遷移したときのintercept
    cy.intercept('GET', '**/ztgict/v1/resource-summary/terminals*', {}).as('getTerminalList')
    cy.intercept('GET', '**/ztgict/v1/monitorings/alerts/count?startDate=*', {}).as('getMonitoringsAlertsCount')
    cy.intercept('GET', '**/ztgict/v1/monitorings/health-status/count', {}).as('getHealthStatusCount')
    cy.intercept('GET', '**/ztgict/v1/monitorings/circuit-traffic-trends/summary', {}).as('getCircuitTrafficTrends')
  })

  it('テナント作成直後のからの画面遷移', function () {
    // 空の契約情報のintercept
    cy.intercept('GET', '**/ztgict/v1/settings/contractor', {}).as('getEmptyContractor')
    cy.intercept('GET', '**/ztgict/v1/settings/mobile', { fixture: 'mobile/no-accepted-mobile' }).as(
      'getNoAcceptedMobile',
    )

    /**************/
    /** 契約者情報 **/
    /**************/
    cy.visit(`/?tenant_id=${this.tenantId}`)
    cy.wait(['@getTenantList', '@getSession', '@getEmptyContractor'])
    cy.wait(['@getAvailable'])

    Object.values(STEPS).forEach(step => {
      cy.get(`[data-cy="${step}"]`).should(step === STEPS.CONTRACTOR ? 'exist' : 'not.exist')
    })

    // 契約者情報の入力
    cy.get('[data-cy="contractor-settings-name"]').find('input').type(this.contractor.name)
    cy.get('[data-cy="contractor-settings-name-kana"]').find('input').type(this.contractor.nameKana)
    cy.get('[data-cy="contractor-settings-pic-name"]').find('input').type(this.contractor.picName)
    cy.get('[data-cy="contractor-settings-pic-name-kana"]').find('input').type(this.contractor.picNameKana)
    cy.get('[data-cy="contractor-settings-postal-code"]').find('input').type(this.contractor.postalCode)
    // 郵便番号入力による住所自動入力の確認
    cy.get('[data-cy="contractor-settings-address"]').find('input').should('have.value', this.contractor.address)
    cy.get('[data-cy="contractor-settings-house-number"]').find('input').type(this.contractor.houseNumber)
    cy.get('[data-cy="contractor-settings-building-name"]').find('input').type(this.contractor.buildingName)
    cy.get('[data-cy="contractor-settings-address-kana"]').find('input').type(this.contractor.addressKana)
    cy.get('[data-cy="contractor-settings-phone-number"]').find('input').type(this.contractor.phoneNumber)

    // ボタン
    cy.get('[data-cy="contractor-settings-cancel-button"]').should('not.exist')
    cy.get('[data-cy="contractor-settings-submit-button"]').should('have.text', t('common.confirm')).click()

    // 確認画面
    cy.get('[data-cy="contractor-settings-name"]')
      .find('input')
      .should('have.value', this.contractor.name)
      .should('be.disabled')
    cy.get('[data-cy="contractor-settings-name-kana"]')
      .find('input')
      .should('have.value', this.contractor.nameKana)
      .should('be.disabled')
    cy.get('[data-cy="contractor-settings-pic-name"]')
      .find('input')
      .should('have.value', this.contractor.picName)
      .should('be.disabled')
    cy.get('[data-cy="contractor-settings-pic-name-kana"]')
      .find('input')
      .should('have.value', this.contractor.picNameKana)
      .should('be.disabled')
    cy.get('[data-cy="contractor-settings-postal-code"]')
      .find('input')
      .should('have.value', this.contractor.postalCode)
      .should('be.disabled')
    cy.get('[data-cy="contractor-settings-address"]')
      .find('input')
      .should('have.value', this.contractor.address)
      .should('be.disabled')
    cy.get('[data-cy="contractor-settings-house-number"]')
      .find('input')
      .should('have.value', this.contractor.houseNumber)
      .should('be.disabled')
    cy.get('[data-cy="contractor-settings-building-name"]')
      .find('input')
      .should('have.value', this.contractor.buildingName)
      .should('be.disabled')
    cy.get('[data-cy="contractor-settings-address-kana"]')
      .find('input')
      .should('have.value', this.contractor.addressKana)
      .should('be.disabled')
    cy.get('[data-cy="contractor-settings-phone-number"]')
      .find('input')
      .should('have.value', this.contractor.phoneNumber)
      .should('be.disabled')

    // PUTの直前に契約者情報変更済みの intercept を作成
    cy.intercept('GET', '**/ztgict/v1/settings/contractor', { fixture: 'contractor/detail' }).as(
      'getRegisteredContractor',
    )

    // 確認画面のボタン
    cy.get('[data-cy="contractor-settings-cancel-button"]').should('have.text', t('common.return'))
    cy.get('[data-cy="contractor-settings-submit-button"]')
      .should('have.text', t('contractor.registerAndMoveToMobileInformation'))
      .click()

    // PUT contractor のリクエスト情報を確認
    cy.wait('@putContractor').then(req => {
      const stringify = JSON.stringify({ ...this.contractor, addressCode: undefined })
      expect(req.request.body).to.deep.equal(JSON.parse(stringify))
    })
    // PUT contractor の成功メッセージを確認
    cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('message.registered'))
    cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
    cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.close')).click()
    cy.get('[data-cy="notification-dialog-text"]').should('not.exist')

    /****************/
    /** モバイル情報 **/
    /****************/
    // PUT contractor の成功後に getNoAcceptedMobile が実行される
    cy.wait(['@getNoAcceptedMobile'])
    Object.values(STEPS).forEach(step => {
      cy.get(`[data-cy="${step}"]`).should(step === STEPS.MOBILE ? 'exist' : 'not.exist')
    })
    // モバイル情報入力
    cy.get('[data-cy="mobile-information-edit-mobile-discount-code"]')
      .find('input')
      .type(this.mobile.mobileDiscountCode)

    // ボタン
    cy.get('[data-cy="mobile-information-edit-cancel-button"]').should('not.exist')
    cy.get('[data-cy="mobile-information-edit-submit-button"]').should('have.text', t('common.next')).click()

    // PUT mobile のリクエスト情報を確認
    cy.wait('@putMobile').then(req => {
      expect(req.request.body).to.deep.equal({
        mobileDiscountCode: this.mobile.mobileDiscountCode,
      })
    })
    //  PUT mobile の成功メッセージを確認
    cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('message.updated'))
    cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
    cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.close')).click()
    cy.get('[data-cy="notification-dialog-text"]').should('not.exist')

    // モバイル約款の同意画面が表示される
    cy.wait(['@getMobileTermsOfService'])
    cy.wait(this.mobileTermsOfService.listedTermsOfService.map(() => '@getDownloadMobileMonitoringTermsOfService'))
    Object.values(STEPS).forEach(step => {
      cy.get(`[data-cy="${step}"]`).should(step === STEPS.MOBILE_TERMS ? 'exist' : 'not.exist')
    })

    // モバイル約款同意
    cy.get('[data-cy="contractor-contractor-terms-and-conditions-back-button"]').should('not.exist')
    cy.get('[data-cy="contractor-contractor-terms-and-conditions-submit-button"]')
      .should('have.text', t('terms.agreement'))
      .should('be.disabled')
    this.mobileTermsOfService.listedTermsOfService.forEach((_: { name: string; uuid: string }, index: number) => {
      cy.get(`[data-cy="contractor-terms-and-conditions-terms-of-service-${index}"]`).should(
        'have.text',
        this.downloadedTermsOfService + '\n',
      )
      cy.get(`[data-cy="contractor-contractor-terms-and-conditions-agreement-${index}"]`).find('.checkbox').click()
    })

    // POST 直前にモバイル約款同意済みの intercept を作成
    cy.intercept('GET', '**/ztgict/v1/settings/mobile', { fixture: 'mobile/accepted-mobile' }).as('getAcceptedMobile')

    // POST mobile/mobile-terms-of-service/agree
    cy.get('[data-cy="contractor-contractor-terms-and-conditions-submit-button"]').click()
    cy.wait('@postMobileTermsOfService').then(req => {
      expect(req.request.body).to.deep.equal({
        agreementCode: this.mobileTermsOfService.agreementCode,
      })
    })

    /*************************/
    /** トラフィック収集の約款 **/
    /*************************/
    // POST mobile/mobile-terms-of-service/agree の成功後に getNoAcceptedTrafficMonitoring が実行される
    cy.wait(['@getNoAcceptedTrafficMonitoring', '@getTrafficMonitoringTermsOfService'])
    cy.wait(
      this.trafficMonitoringTermsOfService.listedTermsOfService.map(() => '@getDownloadMobileMonitoringTermsOfService'),
    )
    // トラフィック収集の約款同意 画面が表示される
    Object.values(STEPS).forEach(step => {
      cy.get(`[data-cy="${step}"]`).should(step === STEPS.TRAFFIC_MONITORING ? 'exist' : 'not.exist')
    })
    // トラフィック収集の約款同意
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
        cy.get('[data-cy="contractor-contractor-terms-and-conditions-submit-button"]').should(
          index === this.trafficMonitoringTermsOfService.listedTermsOfService.length - 1
            ? 'be.not.disabled'
            : 'be.disabled',
        )
      },
    )

    // POST直前にトラフィック約款同意済みの intercept を作成
    cy.intercept('GET', '**/ztgict/v1/settings/traffic-monitoring', {
      fixture: 'traffic-monitoring/accepted-traffic-monitoring',
    }).as('getAcceptedTrafficMonitoring')
    // POST traffic-monitoring
    cy.get('[data-cy="contractor-contractor-terms-and-conditions-submit-button"]').click()
    cy.wait('@postTrafficMonitoringTermsOfService').then(req => {
      expect(req.request.body).to.deep.equal({
        agreementCode: this.trafficMonitoringTermsOfService.agreementCode,
      })
    })

    /*********************/
    /** フロー可視化の同意 **/
    /*********************/
    // POST traffic-monitoring の成功後に getNoAcceptedTrafficReportFlowAnalyzer が実行される
    cy.wait([
      '@getNoAcceptedTrafficReportFlowAnalyzer',
      '@getTrafficReportFlowAnalyzerTermsOfService',
      '@getDownloadMobileMonitoringTermsOfService',
    ])
    // フロー可視化の約款同意 画面が表示される
    Object.values(STEPS).forEach(step => {
      cy.get(`[data-cy="${step}"]`).should(step === STEPS.TRAFFIC_REPORT_FLOW_ANALYZER ? 'exist' : 'not.exist')
    })
    // フロー可視化の約款同意
    cy.get('[data-cy="contractor-contractor-terms-and-conditions-back-button"]')
      .should('have.text', t('terms.disagreement'))
      .should('be.not.disabled')
    cy.get('[data-cy="contractor-contractor-terms-and-conditions-submit-button"]')
      .should('have.text', t('terms.agreement'))
      .should('be.disabled')
    this.trafficReportFlowAnalyzerTermsOfService.listedTermsOfService.forEach(
      (_: { name: string; uuid: string }, index: number) => {
        cy.get(`[data-cy="contractor-terms-and-conditions-terms-of-service-${index}"]`)
          .find('div')
          .should('have.text', this.downloadedTermsOfService + '\n')
        cy.get(`[data-cy="contractor-contractor-terms-and-conditions-agreement-${index}"]`).find('.checkbox').click()
      },
    )

    // POST直前にフロー可視化の約款同意済みの intercept を作成
    cy.intercept('GET', '**/ztgict/v1/settings/traffic-report-flow-analyzer', {
      body: { termsOfServiceAccepted: true },
    }).as('getAcceptedTrafficReportFlowAnalyzer')
    // POST traffic-report-flow-analyzer
    cy.get('[data-cy="contractor-contractor-terms-and-conditions-back-button"]').should('be.disabled')
    cy.get('[data-cy="contractor-contractor-terms-and-conditions-submit-button"]').should('be.not.disabled').click()
    cy.wait('@postTrafficReportFlowAnalyzerTermsOfService').then(req => {
      expect(req.request.body).to.deep.equal({
        agreementCode: this.trafficReportFlowAnalyzerTermsOfService.agreementCode,
      })
    })

    /*********************/
    /** セキュリティの同意 **/
    /*********************/
    // POST traffic-report-flow-analyzer の成功後に getNoAcceptedSecurity が実行される
    cy.wait(['@getNoAcceptedSecurity', '@getSecurityTermsOfService', '@getDownloadMobileMonitoringTermsOfService'])
    // セキュリティの約款同意 画面が表示される
    Object.values(STEPS).forEach(step => {
      cy.get(`[data-cy="${step}"]`).should(step === STEPS.SECURITY ? 'exist' : 'not.exist')
    })
    // セキュリティの約款同意
    cy.get('[data-cy="contractor-contractor-terms-and-conditions-back-button"]')
      .should('have.text', t('terms.disagreement'))
      .should('be.not.disabled')
    cy.get('[data-cy="contractor-contractor-terms-and-conditions-submit-button"]')
      .should('have.text', t('terms.agreement'))
      .should('be.disabled')
    this.securityTermsOfService.listedTermsOfService.forEach((_: { name: string; uuid: string }, index: number) => {
      cy.get(`[data-cy="contractor-terms-and-conditions-terms-of-service-${index}"]`)
        .find('div')
        .should('have.text', this.downloadedTermsOfService + '\n')
      cy.get(`[data-cy="contractor-contractor-terms-and-conditions-agreement-${index}"]`).find('.checkbox').click()
      cy.get('[data-cy="contractor-contractor-terms-and-conditions-back-button"]').should('be.disabled')
      cy.get('[data-cy="contractor-contractor-terms-and-conditions-submit-button"]').should(
        index === this.securityTermsOfService.listedTermsOfService.length - 1 ? 'be.not.disabled' : 'be.disabled',
      )
    })

    // POST直前にセキュリティの約款同意済みの intercept を作成
    cy.intercept('GET', '**/ztgict/v1/settings/security', {
      body: { termsOfServiceAccepted: true },
    }).as('getAcceptedSecurity')
    // POST security
    cy.get('[data-cy="contractor-contractor-terms-and-conditions-submit-button"]').click()
    cy.wait('@postSecurityTermsOfService').then(req => {
      expect(req.request.body).to.deep.equal({
        agreementCode: this.securityTermsOfService.agreementCode,
      })
    })

    // index.vue でサマリー画面にリダイレクト
    cy.url().should('eq', `${this.baseUrl}/monitoring/summary`)
    cy.wait(['@getTerminalList', '@getMonitoringsAlertsCount', '@getHealthStatusCount', '@getCircuitTrafficTrends'])
  })

  it('フロー可視化とセキュリティの同意画面で「同意しない」をクリックした場合', function () {
    cy.intercept('GET', '**/ztgict/v1/settings/contractor', { fixture: 'contractor/detail' }).as(
      'getRegisteredContractor',
    )
    cy.intercept('GET', '**/ztgict/v1/settings/mobile', { fixture: 'mobile/accepted-mobile' }).as('getAcceptedMobile')

    cy.visit(`/?tenant_id=${this.tenantId}`)
    cy.wait(['@getTenantList', '@getSession'])
    // 契約者情報・モバイル約款同意済み
    cy.wait(['@getRegisteredContractor', '@getAcceptedMobile'])

    /************************/
    /** トラフィック収集の約款 **/
    /************************/
    cy.wait(['@getNoAcceptedTrafficMonitoring', '@getTrafficMonitoringTermsOfService'])
    cy.wait(
      this.trafficMonitoringTermsOfService.listedTermsOfService.map(() => '@getDownloadMobileMonitoringTermsOfService'),
    )
    cy.get(`[data-cy="${STEPS.TRAFFIC_MONITORING}"]`).should('exist')
    this.trafficMonitoringTermsOfService.listedTermsOfService.forEach(
      (_: { name: string; uuid: string }, index: number) => {
        cy.get(`[data-cy="contractor-terms-and-conditions-terms-of-service-${index}"]`)
          .find('div')
          .should('have.text', this.downloadedTermsOfService + '\n')
        cy.get(`[data-cy="contractor-contractor-terms-and-conditions-agreement-${index}"]`).find('.checkbox').click()
      },
    )
    // POST直前にトラフィック約款同意済みの intercept を作成
    cy.intercept('GET', '**/ztgict/v1/settings/traffic-monitoring', {
      fixture: 'traffic-monitoring/accepted-traffic-monitoring',
    }).as('getAcceptedTrafficMonitoring')

    // POST traffic-monitoring
    cy.get('[data-cy="contractor-contractor-terms-and-conditions-submit-button"]').click()
    cy.wait('@postTrafficMonitoringTermsOfService')

    /*********************/
    /** フロー可視化の同意 **/
    /*********************/
    cy.wait([
      '@getNoAcceptedTrafficReportFlowAnalyzer',
      '@getTrafficReportFlowAnalyzerTermsOfService',
      '@getDownloadMobileMonitoringTermsOfService',
    ])
    cy.get(`[data-cy="${STEPS.TRAFFIC_REPORT_FLOW_ANALYZER}"]`).should('exist')
    // 「同意しない」ボタンを押下
    cy.get('[data-cy="contractor-contractor-terms-and-conditions-back-button"]').click()

    /*********************/
    /** セキュリティの同意 **/
    /*********************/
    cy.wait(['@getNoAcceptedSecurity', '@getSecurityTermsOfService', '@getDownloadMobileMonitoringTermsOfService'])
    cy.get(`[data-cy="${STEPS.SECURITY}"]`).should('exist')
    // 「同意しない」ボタンを押下
    cy.get('[data-cy="contractor-contractor-terms-and-conditions-back-button"]').click()

    // サマリー画面にリダイレクト
    cy.url().should('eq', `${this.baseUrl}/monitoring/summary`)
    cy.wait([
      '@getAcceptedMobile',
      '@getNoAcceptedTrafficReportFlowAnalyzer',
      '@getNoAcceptedSecurity',
      '@getTerminalList',
      '@getMonitoringsAlertsCount',
      '@getHealthStatusCount',
      '@getCircuitTrafficTrends',
    ])
  })

  it('2度目の表示の場合、フロー可視化とセキュリティの同意画面を表示しない', function () {
    cy.intercept('GET', '**/ztgict/v1/settings/contractor', { fixture: 'contractor/detail' }).as(
      'getRegisteredContractor',
    )
    cy.intercept('GET', '**/ztgict/v1/settings/mobile', { fixture: 'mobile/accepted-mobile' }).as('getAcceptedMobile')
    cy.intercept('GET', '**/ztgict/v1/settings/traffic-monitoring', {
      fixture: 'traffic-monitoring/accepted-traffic-monitoring',
    }).as('getAcceptedTrafficMonitoring')

    cy.visit(`/?tenant_id=${this.tenantId}`)
    cy.wait(['@getTenantList', '@getSession'])

    Object.values(STEPS).forEach(step => {
      cy.get(`[data-cy="${step}"]`).should('not.exist')
    })

    // 契約者情報・モバイル約款同意・トラフィック収集の約款同意済み
    cy.wait([
      '@getRegisteredContractor',
      '@getAcceptedMobile',
      '@getAcceptedTrafficMonitoring',
      '@getNoAcceptedTrafficReportFlowAnalyzer',
    ])
    // サマリー画面にリダイレクト
    cy.url().should('eq', `${this.baseUrl}/monitoring/summary`)
  })
})
