import { ScheduledTime } from '@app/api/hikariCollaboUtil/constants'
import dayjs from 'dayjs'
import {
  GuaranteeReserveDateAddCount,
  generateRandomHex,
  nDaysLater,
  t,
  outsideApplicationRestrictionAt,
  OUTSIDE_APPLICATION_RESTRICTION_AT,
} from '@cypress/support/utils'

describe('ギャランティアクセス 新規作成 キャンペーン適用', () => {
  const time = Object.keys(ScheduledTime)[0] as keyof typeof ScheduledTime
  const fieldSurveyMinDate = nDaysLater(
    GuaranteeReserveDateAddCount.fieldSurvey,
    dayjs(OUTSIDE_APPLICATION_RESTRICTION_AT),
  )
  const constructionMinDate = nDaysLater(
    GuaranteeReserveDateAddCount.fieldSurvey + GuaranteeReserveDateAddCount.construction,
    dayjs(OUTSIDE_APPLICATION_RESTRICTION_AT),
  )

  beforeEach(function () {
    this.tenantId = generateRandomHex(32)

    cy.fixture('guarantees/circuits/create-physical-bandwidth-1G').then(data => {
      this.create1G = data
    })
    cy.fixture('guarantees/circuits/create-physical-bandwidth-100M').then(data => {
      this.create100M = data
    })
    cy.fixture('guarantees/circuits/search-address.json').then(searchAddress => {
      this.searchAddress = searchAddress
    })

    cy.intercept('GET', '**/ztgict/v1/guarantees*', { fixture: 'guarantees/circuits/list' }).as('getGuaranteeList')
    cy.intercept('GET', '**/ztgict/v1/resource-summary/guarantees?limit=1000*', {
      fixture: 'guarantees/circuits/list',
    }).as('getResourceSummaryGuaranteeList')
    cy.intercept('GET', '**/ztgict/v1/resource-summary/terminals?limit=1000*', { fixture: 'terminals/list' }).as(
      'getTerminalList',
    )
    cy.intercept('POST', '**/ztgict/v1/guarantees', {
      fixture: 'guarantees/circuits/detail-reserve-date-approved',
    }).as('postRequest')
    cy.fixture('campaigns/create.json').then(create => {
      this.createInternetCampaign = create.internet
      this.createVpnCampaign = create.vpn
    })
    cy.intercept('POST', '**/ztgict/v1/campaigns', { fixture: 'campaigns/create' }).as('postCampaign')
    cy.intercept('GET', '**/ztgict/v1/campaigns', { fixture: 'campaigns/list' }).as('getCampaignList')
    cy.intercept('GET', '**/ztgict/v1/orders/*', { response: { statusCode: 200 } }).as('getOrder')
  })

  context('正常系', function () {
    beforeEach(function () {
      cy.intercept('GET', '**/ztgict/v1/settings/guarantee', {
        fixture: 'guarantees/circuits/terms-of-service-accepted',
      }).as('getGuaranteeTermsOfServiceAccepted')
      // 確認ボタンが押せるように時間固定
      cy.clock(outsideApplicationRestrictionAt(9, 0, 0, 0), ['Date'])

      // 共通の画面遷移
      cy.visit(`tenants/${this.tenantId}/guarantees/circuits`)
      cy.wait([
        '@getSession',
        '@getMobile',
        '@getResourceSummaryGuaranteeList',
        '@getGuaranteeList',
        '@getTerminalList',
      ])
      cy.get('[data-cy="guarantees-circuits-index-create-new-button"]').click()
      cy.wait(['@getResourceSummaryGuaranteeList', '@getGuaranteeTermsOfServiceAccepted'])
    })

    it('キャンペーンダイアログボタンの活性/非活性確認', function () {
      // 物理契約帯域:100M terminalType:レンタル インターネット契約帯域:20M VPN契約帯域:20M
      cy.log('物理契約帯域:100M terminalType:レンタル インターネット契約帯域:20M VPN契約帯域:20M')
      cy.inputGuaranteeCreate({
        inputData: {
          ...this.create100M,
          internet: { ...this.create100M.internet, rateLimit: '20M' },
          vpn: { ...this.create100M.vpn, rateLimit: '20M' },
        },
        terminalType: 'rentalTerminal',
        reserveDate: { time, fieldSurveyMinDate, constructionMinDate },
        postalCode: this.searchAddress.postalCode,
      })
      // 確認ボタンを押下
      cy.get('@submitButton').click()
      // キャンペーン案内ダイアログが表示される
      cy.get('[data-cy="guarantee-campaign-dialog"]').should('exist')
      cy.get('[data-cy="dialog-base-title"]').should('have.text', t('campaign.title'))
      // VPN契約帯域+10Mボタン（活性）
      cy.get('[data-cy="guarantee-campaign-dialog-vpn-rate-limit-campaign-button"]')
        .should('not.be.disabled')
        .should('have.text', t('campaign.vpnRateLimitCampaignButton', { extraRateLimit: 10 }))
      // インターネット契約帯域+10Mボタン（活性）
      cy.get('[data-cy="guarantee-campaign-dialog-internet-rate-limit-campaign-button"]')
        .should('not.be.disabled')
        .should('have.text', t('campaign.internetRateLimitCampaignButton', { extraRateLimit: 10 }))
      // キャンペーンなしボタン（活性）
      cy.get('[data-cy="guarantee-campaign-dialog-without-campaign-button"]')
        .should('not.be.disabled')
        .should('have.text', t('campaign.withoutCampaignButton'))
      // 戻る
      cy.get('.dialog-base-cancel-button').should('have.text', t('common.return')).click()

      // インターネットの契約帯域を未選択にする
      cy.log('物理契約帯域:100M terminalType:レンタル インターネット契約帯域:未選択 VPN契約帯域:20M')
      cy.inputSelectForm({ selector: '[data-cy="guarantees-circuits-create-internet-rate-limit"]', value: '未選択' })
      cy.get('@submitButton').click()
      cy.get('[data-cy="guarantee-campaign-dialog"]').should('exist')
      //  VPN契約帯域+10Mボタン（活性）
      cy.get('[data-cy="guarantee-campaign-dialog-vpn-rate-limit-campaign-button"]').should('not.be.disabled')
      // インターネット契約帯域+10Mボタン（非活性）
      cy.get('[data-cy="guarantee-campaign-dialog-internet-rate-limit-campaign-button"]').should('be.disabled')
      cy.get('.dialog-base-cancel-button').click()

      // VPN契約帯域を90Mにする
      cy.log('物理契約帯域:100M terminalType:レンタル インターネット契約帯域:未選択 VPN契約帯域:90M')
      cy.inputSelectForm({ selector: '[data-cy="guarantees-circuits-create-vpn-rate-limit"]', value: '90M' })
      // キャンペーン案内ダイアログが表示されない
      cy.get('@submitButton').click()
      cy.get('[data-cy="guarantee-campaign-dialog"]').should('not.exist')
      cy.get('[data-cy="guarantees-circuits-create-return"]').click()

      // 合計値を100Mにする
      cy.log('物理契約帯域:100M terminalType:レンタル インターネット契約帯域:20M VPN契約帯域:80M')
      cy.inputSelectForm({ selector: '[data-cy="guarantees-circuits-create-internet-rate-limit"]', value: '20M' })
      cy.inputSelectForm({ selector: '[data-cy="guarantees-circuits-create-vpn-rate-limit"]', value: '80M' })
      // キャンペーン案内ダイアログが表示されない
      cy.get('@submitButton').click()
      cy.get('[data-cy="guarantee-campaign-dialog"]').should('not.exist')
      cy.get('[data-cy="guarantees-circuits-create-return"]').click()

      // VPNの契約帯域を未選択にする
      cy.log('物理契約帯域:100M terminalType:レンタル インターネット契約帯域:20M VPN契約帯域:未選択')
      cy.inputSelectForm({ selector: '[data-cy="guarantees-circuits-create-internet-rate-limit"]', value: '20M' })
      cy.inputSelectForm({ selector: '[data-cy="guarantees-circuits-create-vpn-rate-limit"]', value: '未選択' })
      cy.get('@submitButton').click()
      cy.get('[data-cy="guarantee-campaign-dialog"]').should('exist')
      //  VPN契約帯域+10Mボタン（非活性）
      cy.get('[data-cy="guarantee-campaign-dialog-vpn-rate-limit-campaign-button"]').should('be.disabled')
      // インターネット契約帯域+10Mボタン（活性）
      cy.get('[data-cy="guarantee-campaign-dialog-internet-rate-limit-campaign-button"]').should('not.be.disabled')
      // 戻る
      cy.get('.dialog-base-cancel-button').click()

      // 物理帯域を1Gにしてラベルが変わることを確認する
      cy.log('物理契約帯域:1G terminalType:レンタル インターネット契約帯域:100M VPN契約帯域:100M')
      cy.inputSelectForm({ selector: '[data-cy="guarantees-circuits-create-physical-bandwidth"]', value: '1G' })
      cy.inputSelectForm({ selector: '[data-cy="guarantees-circuits-create-internet-rate-limit"]', value: '100M' })
      cy.inputSelectForm({ selector: '[data-cy="guarantees-circuits-create-vpn-rate-limit"]', value: '100M' })
      cy.get('@submitButton').click()
      cy.get('[data-cy="guarantee-campaign-dialog"]').should('exist')
      // VPN契約帯域+100Mボタン（活性）
      cy.get('[data-cy="guarantee-campaign-dialog-vpn-rate-limit-campaign-button"]')
        .should('not.be.disabled')
        .should('have.text', t('campaign.vpnRateLimitCampaignButton', { extraRateLimit: 100 }))
      // インターネット契約帯域+100Mボタン（活性）
      cy.get('[data-cy="guarantee-campaign-dialog-internet-rate-limit-campaign-button"]')
        .should('not.be.disabled')
        .should('have.text', t('campaign.internetRateLimitCampaignButton', { extraRateLimit: 100 }))
      // 戻る
      cy.get('.dialog-base-cancel-button').click()

      // 合計値が 300M の時はダイアログが表示されないことを確認する
      cy.log('物理契約帯域:1G terminalType:レンタル インターネット契約帯域:100M VPN契約帯域:200M')
      cy.inputSelectForm({ selector: '[data-cy="guarantees-circuits-create-internet-rate-limit"]', value: '100M' })
      cy.inputSelectForm({ selector: '[data-cy="guarantees-circuits-create-vpn-rate-limit"]', value: '200M' })
      // キャンペーン案内ダイアログが表示されない
      cy.get('@submitButton').click()
      cy.get('[data-cy="guarantee-campaign-dialog"]').should('not.exist')
      cy.get('[data-cy="guarantees-circuits-create-return"]').click()

      // インターネットの契約帯域を未選択にする
      cy.log('物理契約帯域:1G terminalType:レンタル インターネット契約帯域:未選択 VPN契約帯域:200M')
      cy.inputSelectForm({ selector: '[data-cy="guarantees-circuits-create-internet-rate-limit"]', value: '未選択' })
      cy.inputSelectForm({ selector: '[data-cy="guarantees-circuits-create-vpn-rate-limit"]', value: '200M' })
      cy.get('@submitButton').click()
      cy.get('[data-cy="guarantee-campaign-dialog"]').should('exist')
      // VPN契約帯域+100Mボタン（活性）
      cy.get('[data-cy="guarantee-campaign-dialog-vpn-rate-limit-campaign-button"]').should('not.be.disabled')
      // インターネット契約帯域+100Mボタン（非活性）
      cy.get('[data-cy="guarantee-campaign-dialog-internet-rate-limit-campaign-button"]').should('be.disabled')
      cy.get('.dialog-base-cancel-button').click()

      // VPNの契約帯域を未選択にする
      cy.log('物理契約帯域:1G terminalType:レンタル インターネット契約帯域:100M VPN契約帯域:未選択')
      cy.inputSelectForm({ selector: '[data-cy="guarantees-circuits-create-internet-rate-limit"]', value: '100M' })
      cy.inputSelectForm({ selector: '[data-cy="guarantees-circuits-create-vpn-rate-limit"]', value: '未選択' })
      cy.get('@submitButton').click()
      cy.get('[data-cy="guarantee-campaign-dialog"]').should('exist')
      // VPN契約帯域+100Mボタン（非活性）
      cy.get('[data-cy="guarantee-campaign-dialog-vpn-rate-limit-campaign-button"]').should('be.disabled')
      // インターネット契約帯域+100Mボタン（活性）
      cy.get('[data-cy="guarantee-campaign-dialog-internet-rate-limit-campaign-button"]').should('not.be.disabled')
      cy.get('.dialog-base-cancel-button').click()

      // terminalType:自営・物理契約帯域:100Mに変更
      // 合計値が 100M の時はダイアログが表示されないことを確認する
      cy.log('物理契約帯域:100M terminalType:自営 インターネット契約帯域:10M VPN契約帯域:90M')
      cy.inputSelectForm({
        selector: '[data-cy="guarantees-circuits-create-terminal-type"]',
        value: t('terminals.selfTerminal'),
      })
      cy.inputSelectForm({
        selector: '[data-cy="guarantees-circuits-create-physical-bandwidth"]',
        value: '100M',
      })
      cy.inputSelectForm({ selector: '[data-cy="guarantees-circuits-create-internet-rate-limit"]', value: '10M' })
      cy.inputSelectForm({ selector: '[data-cy="guarantees-circuits-create-vpn-rate-limit"]', value: '90M' })
      // キャンペーン案内ダイアログが表示されない
      cy.get('@submitButton').click()
      cy.get('[data-cy="guarantee-campaign-dialog"]').should('not.exist')
      cy.get('[data-cy="guarantees-circuits-create-return"]').click()

      // インターネット契約帯域:未選択、VPN契約帯域:90M で キャンペーン案内ダイアログが表示されないことを確認する
      cy.log('物理契約帯域:100M terminalType:自営 インターネット契約帯域:未選択 VPN契約帯域:90M')
      cy.inputSelectForm({ selector: '[data-cy="guarantees-circuits-create-internet-rate-limit"]', value: '未選択' })
      cy.inputSelectForm({ selector: '[data-cy="guarantees-circuits-create-vpn-rate-limit"]', value: '90M' })
      // キャンペーン案内ダイアログが表示されない
      cy.get('@submitButton').click()
      cy.get('[data-cy="guarantee-campaign-dialog"]').should('not.exist')
      cy.get('[data-cy="guarantees-circuits-create-return"]').click()

      // 物理契約帯域:1G にして合計値が 1G の時はダイアログが表示されないことを確認する
      cy.log('物理契約帯域:1G terminalType:自営 インターネット契約帯域:500M VPN契約帯域:500M')
      cy.inputSelectForm({ selector: '[data-cy="guarantees-circuits-create-physical-bandwidth"]', value: '1G' })
      cy.inputSelectForm({
        selector: '[data-cy="guarantees-circuits-create-user-interface-type"]',
        value: '1000BASE-T',
      })
      cy.inputSelectForm({ selector: '[data-cy="guarantees-circuits-create-internet-rate-limit"]', value: '500M' })
      cy.inputSelectForm({ selector: '[data-cy="guarantees-circuits-create-vpn-rate-limit"]', value: '500M' })
      // キャンペーン案内ダイアログが表示されない
      cy.get('@submitButton').click()
      cy.get('[data-cy="guarantee-campaign-dialog"]').should('not.exist')
      cy.get('[data-cy="guarantees-circuits-create-return"]').click()

      cy.log('物理契約帯域:1G terminalType:自営 インターネット契約帯域:未選択 VPN契約帯域:1G')
      cy.inputSelectForm({
        selector: '[data-cy="guarantees-circuits-create-internet-rate-limit"]',
        value: '未選択',
      })
      cy.inputSelectForm({ selector: '[data-cy="guarantees-circuits-create-vpn-rate-limit"]', value: '1G' })
      // キャンペーン案内ダイアログが表示されない
      cy.get('@submitButton').click()
      cy.get('[data-cy="guarantee-campaign-dialog"]').should('not.exist')
      cy.get('[data-cy="guarantees-circuits-create-return"]').click()
    })

    it('インターネット契約帯域: 20M+10M VPN契約帯域: 20M で申込', function () {
      cy.inputGuaranteeCreate({
        inputData: {
          ...this.create100M,
          internet: { ...this.create100M.internet, rateLimit: '20M' },
          vpn: { ...this.create100M.vpn, rateLimit: '20M' },
        },
        terminalType: 'rentalTerminal',
        reserveDate: { time, fieldSurveyMinDate, constructionMinDate },
        postalCode: this.searchAddress.postalCode,
      })
      // 確認ボタンを押下
      cy.get('@submitButton').should('have.text', t('common.confirm')).click()
      // インターネット契約帯域+10Mボタンを押下
      cy.get('[data-cy="guarantee-campaign-dialog-internet-rate-limit-campaign-button"]').click()
      // 確認画面にてインターネット契約帯域が+10Mされていることを確認
      cy.get('[data-cy="guarantees-circuits-create-internet-rate-limit"]')
        .find('input')
        .should('have.value', t('guarantees.rateLimitCampaignText', { rateLimit: '20M', extraRateLimit: 10 }))

      // 保存ボタンを押下
      cy.get('@submitButton').should('have.text', t('common.create')).click()

      const request = {
        ...this.create100M,
        installationPlaceCode: this.searchAddress.installationPlaceCode,
        internet: { ...this.create100M.internet, rateLimit: '30M' },
        vpn: { ...this.create100M.vpn, rateLimit: '20M' },
        fieldSurvey: { ...this.create100M.fieldSurvey, date: fieldSurveyMinDate, time },
        construction: { ...this.create100M.construction, date: constructionMinDate, time },
      }
      cy.wait('@postCampaign').then(req => {
        const stringify = JSON.stringify(this.createInternetCampaign)
        expect(req.request.url).to.include('ztgict/v1/campaigns')
        expect(req.request.body).to.deep.equal(JSON.parse(stringify))
      })
      cy.wait('@postRequest').then(req => {
        const stringify = JSON.stringify(request)
        expect(req.request.url).to.include('ztgict/v1/guarantees')
        expect(req.request.body).to.deep.equal(JSON.parse(stringify))
      })

      cy.get('.dialog-card-content').should(
        'have.text',
        t('guarantees.createdMessage', { detail: t('guarantees.circuitDetail') }),
      )
      cy.get('.dialog-base-submit-button').should('have.text', t('common.moveToOrderDetail'))

      // ダイアログの閉じるボタンを押す
      cy.get('.dialog-card-close').click()
      cy.get('.dialog-main').should('not.exist')
      // 一覧画面に戻る
      cy.wait(['@getResourceSummaryGuaranteeList', '@getGuaranteeList', '@getTerminalList'])
      cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/guarantees/circuits`)
    })

    it('インターネット契約帯域: 20M VPN契約帯域: 40M+10M で申込', function () {
      // VPN契約帯域が未選択の時、VPN契約帯域+10Mキャンペーン適用ボタンが非活性
      cy.inputGuaranteeCreate({
        inputData: {
          ...this.create100M,
          internet: { rateLimit: '20M' },
          vpn: { rateLimit: '40M' },
        },
        terminalType: 'selfTerminal',
        reserveDate: { time, fieldSurveyMinDate, constructionMinDate },
        postalCode: this.searchAddress.postalCode,
      })
      // 確認ボタンを押下
      cy.get('@submitButton').should('have.text', t('common.confirm')).click()
      // キャンペーン案内ダイアログの vpn契約帯域+10M ボタンを押下
      cy.get('[data-cy="guarantee-campaign-dialog-vpn-rate-limit-campaign-button"]').click()

      // 確認画面にてVPN契約帯域が+10Mされていることを確認
      cy.get('[data-cy="guarantees-circuits-create-vpn-rate-limit"]')
        .find('input')
        .should('have.value', t('guarantees.rateLimitCampaignText', { rateLimit: '40M', extraRateLimit: 10 }))

      // 保存ボタンを押下
      cy.get('@submitButton').should('have.text', t('common.create')).click()

      const request = {
        ...this.create100M,
        installationPlaceCode: this.searchAddress.installationPlaceCode,
        internet: { rateLimit: '20M' },
        vpn: { rateLimit: '50M' },
        fieldSurvey: { ...this.create100M.fieldSurvey, date: fieldSurveyMinDate, time },
        construction: { ...this.create100M.construction, date: constructionMinDate, time },
      }
      cy.wait('@postCampaign').then(req => {
        const stringify = JSON.stringify(this.createVpnCampaign)
        expect(req.request.url).to.include('ztgict/v1/campaigns')
        expect(req.request.body).to.deep.equal(JSON.parse(stringify))
      })
      cy.wait('@postRequest').then(req => {
        const stringify = JSON.stringify(request)
        expect(req.request.url).to.include('ztgict/v1/guarantees')
        expect(req.request.body).to.deep.equal(JSON.parse(stringify))
      })

      cy.get('.dialog-card-content').should(
        'have.text',
        t('guarantees.createdMessage', { detail: t('guarantees.circuitDetail') }),
      )
      cy.get('.dialog-base-submit-button').should('have.text', t('common.moveToOrderDetail'))

      // ダイアログの閉じるボタンを押す
      cy.get('.dialog-card-close').click()
      cy.get('.dialog-main').should('not.exist')
      // 一覧画面に戻る
      cy.wait(['@getResourceSummaryGuaranteeList', '@getGuaranteeList', '@getTerminalList'])
      cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/guarantees/circuits`)
    })

    it('インターネット契約帯域: 200M+100M VPN契約帯域: 未選択 で申込', function () {
      cy.inputGuaranteeCreate({
        inputData: {
          ...this.create1G,
          internet: { rateLimit: '100M' },
          vpn: { rateLimit: '100M' },
        },
        terminalType: 'rentalTerminal',
        reserveDate: { time, fieldSurveyMinDate, constructionMinDate },
        postalCode: this.searchAddress.postalCode,
      })
      // 確認ボタンを押下
      cy.get('@submitButton').click()
      // VPN契約帯域+100Mボタンを押下
      cy.get('[data-cy="guarantee-campaign-dialog-vpn-rate-limit-campaign-button"]').click()
      // 確認画面にてVPN契約帯域が+100Mされていることを確認
      cy.get('[data-cy="guarantees-circuits-create-vpn-rate-limit"]')
        .find('input')
        .should('have.value', t('guarantees.rateLimitCampaignText', { rateLimit: '100M', extraRateLimit: 100 }))

      // 一旦戻る
      cy.get('[data-cy="guarantees-circuits-create-return"]').click()
      cy.get('.dialog-base-cancel-button').click()
      // インターネット契約帯域を 200M に VPN契約帯域を 未選択 に変更
      cy.inputSelectForm({
        selector: '[data-cy="guarantees-circuits-create-internet-rate-limit"]',
        value: '200M',
      })
      cy.inputSelectForm({ selector: '[data-cy="guarantees-circuits-create-vpn-rate-limit"]', value: '未選択' })
      cy.get('@submitButton').click()
      // インターネット契約帯域+100Mボタンを押下
      cy.get('[data-cy="guarantee-campaign-dialog-internet-rate-limit-campaign-button"]').click()
      // 確認画面にてインターネット契約帯域が+100Mされていることを確認
      cy.get('[data-cy="guarantees-circuits-create-internet-rate-limit"]')
        .find('input')
        .should('have.value', t('guarantees.rateLimitCampaignText', { rateLimit: '200M', extraRateLimit: 100 }))

      // 保存ボタンを押下
      cy.get('@submitButton').click()

      const request = {
        ...this.create1G,
        userInterfaceType: '1000BASE-T', // レンタルルーターの場合の固定値
        communicationMode: 'auto-nego', // レンタルルーターの場合の固定値
        installationPlaceCode: this.searchAddress.installationPlaceCode,
        internet: { rateLimit: '300M' },
        vpn: {},
        fieldSurvey: { ...this.create1G.fieldSurvey, date: fieldSurveyMinDate, time },
        construction: { ...this.create1G.construction, date: constructionMinDate, time },
      }
      cy.wait('@postCampaign').then(req => {
        const stringify = JSON.stringify(this.createInternetCampaign)
        expect(req.request.url).to.include('ztgict/v1/campaigns')
        expect(req.request.body).to.deep.equal(JSON.parse(stringify))
      })
      cy.log(JSON.stringify(request))
      cy.wait('@postRequest').then(req => {
        const stringify = JSON.stringify(request)
        expect(req.request.url).to.include('ztgict/v1/guarantees')
        expect(req.request.body).to.deep.equal(JSON.parse(stringify))
      })

      cy.get('.dialog-card-content').should(
        'have.text',
        t('guarantees.createdMessage', { detail: t('guarantees.circuitDetail') }),
      )
      cy.get('.dialog-base-submit-button').should('have.text', t('common.moveToOrderDetail'))

      // ダイアログの閉じるボタンを押す
      cy.get('.dialog-card-close').click()
      cy.get('.dialog-main').should('not.exist')
      // 一覧画面に戻る
      cy.wait(['@getResourceSummaryGuaranteeList', '@getGuaranteeList', '@getTerminalList'])
      cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/guarantees/circuits`)
    })

    it('インターネット契約帯域: 未選択 VPN契約帯域: 900M+100M で申込', function () {
      cy.inputGuaranteeCreate({
        inputData: {
          ...this.create1G,
          internet: { rateLimit: undefined },
          vpn: { rateLimit: '900M' },
        },
        terminalType: 'selfTerminal',
        reserveDate: { time, fieldSurveyMinDate, constructionMinDate },
        postalCode: this.searchAddress.postalCode,
      })

      // 確認ボタンを押下
      cy.get('@submitButton').click()
      // キャンペーン案内ダイアログの vpn契約帯域+100M ボタンを押下
      cy.get('[data-cy="guarantee-campaign-dialog-vpn-rate-limit-campaign-button"]').click()
      // 確認画面にてVPN契約帯域が+100Mされていることを確認
      cy.get('[data-cy="guarantees-circuits-create-vpn-rate-limit"]')
        .find('input')
        .should('have.value', t('guarantees.rateLimitCampaignText', { rateLimit: '900M', extraRateLimit: 100 }))

      // 保存ボタンを押下
      cy.get('@submitButton').click()

      const request = {
        ...this.create1G,
        installationPlaceCode: this.searchAddress.installationPlaceCode,
        internet: {},
        vpn: { rateLimit: '1G' },
        fieldSurvey: { ...this.create1G.fieldSurvey, date: fieldSurveyMinDate, time },
        construction: { ...this.create1G.construction, date: constructionMinDate, time },
      }
      cy.wait('@postCampaign').then(req => {
        const stringify = JSON.stringify(this.createVpnCampaign)
        expect(req.request.url).to.include('ztgict/v1/campaigns')
        expect(req.request.body).to.deep.equal(JSON.parse(stringify))
      })
      cy.wait('@postRequest').then(req => {
        const stringify = JSON.stringify(request)
        expect(req.request.url).to.include('ztgict/v1/guarantees')
        expect(req.request.body).to.deep.equal(JSON.parse(stringify))
      })

      cy.get('.dialog-card-content').should(
        'have.text',
        t('guarantees.createdMessage', { detail: t('guarantees.circuitDetail') }),
      )
      cy.get('.dialog-base-submit-button').should('have.text', t('common.moveToOrderDetail'))

      // ダイアログの閉じるボタンを押す
      cy.get('.dialog-card-close').click()
      cy.get('.dialog-main').should('not.exist')
      // 一覧画面に戻る
      cy.wait(['@getResourceSummaryGuaranteeList', '@getGuaranteeList', '@getTerminalList'])
      cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/guarantees/circuits`)
    })

    it('キャンペーンなしで申込ボタンを押下して新規作成', function () {
      cy.inputGuaranteeCreate({
        inputData: this.create1G,
        terminalType: 'selfTerminal',
        reserveDate: { time, fieldSurveyMinDate, constructionMinDate },
        postalCode: this.searchAddress.postalCode,
      })
      // 確認ボタンを押下
      cy.get('@submitButton').click()
      // キャンペーンなしで申込ボタンを押下
      cy.get('[data-cy="guarantee-campaign-dialog-without-campaign-button"]').click()
      // 確認画面にてインターネット/VPN契約帯域が入力された通りに表示されていることを確認
      cy.get('[data-cy="guarantees-circuits-create-internet-rate-limit"]')
        .find('input')
        .should('have.value', this.create1G.internet.rateLimit)
      cy.get('[data-cy="guarantees-circuits-create-vpn-rate-limit"]')
        .find('input')
        .should('have.value', this.create1G.vpn.rateLimit)
      // 保存ボタンを押下
      cy.get('@submitButton').click()

      const request = {
        ...this.create1G,
        installationPlaceCode: this.searchAddress.installationPlaceCode,
        fieldSurvey: { ...this.create1G.fieldSurvey, date: fieldSurveyMinDate, time },
        construction: { ...this.create1G.construction, date: constructionMinDate, time },
      }
      cy.wait('@postRequest').then(req => {
        const stringify = JSON.stringify(request)
        expect(req.request.url).to.include('ztgict/v1/guarantees')
        expect(req.request.body).to.deep.equal(JSON.parse(stringify))
      })

      cy.get('.dialog-card-content').should(
        'have.text',
        t('guarantees.createdMessage', { detail: t('guarantees.circuitDetail') }),
      )
      cy.get('.dialog-base-submit-button').should('have.text', t('common.moveToOrderDetail'))

      // ダイアログの閉じるボタンを押す
      cy.get('.dialog-card-close').click()
      cy.get('.dialog-main').should('not.exist')
      // 一覧画面に戻る
      cy.wait(['@getResourceSummaryGuaranteeList', '@getGuaranteeList', '@getTerminalList'])
      cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/guarantees/circuits`)
    })
  })
})
