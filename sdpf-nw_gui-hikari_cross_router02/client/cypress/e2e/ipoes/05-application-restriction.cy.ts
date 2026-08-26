import { RequestTypes } from '@app/api/ipoes/constants'
import { generateRandomHex } from '@cypress/support/utils'

// 期間限定の申込規制(useApplicationRestriction)のテスト。規制期間終了後にこのファイルごと削除する
describe('ベストエフォートIPoEアクセス 期間限定の申込規制', () => {
  // フレッツ回線別契約型のみ規制する期間
  const beforeFletsSeparateRestriction = '2026-08-27T23:59:59+09:00'
  const duringFletsSeparateRestriction = '2026-08-28T00:00:00+09:00'
  // ベストエフォートIPoEアクセス全体を規制する期間
  const duringIpoeRestriction = '2026-09-01T22:00:00+09:00'
  const afterIpoeRestriction = '2026-09-05T08:00:00+09:00'

  beforeEach(function () {
    this.tenantId = generateRandomHex(32)
    this.ipoeId = generateRandomHex(32)

    cy.intercept('GET', '**/ztgict/v1/settings/contractor', { fixture: 'contractor/detail' }).as('getContractor')
    cy.intercept('GET', '**/ztgict/v1/ipoe/hikari-collabo-util/available', { body: { available: true } }).as(
      'getAvailable',
    )
    cy.intercept('GET', '**/ztgict/v1/ipoe*', { fixture: 'ipoes/list' }).as('getIpoeList')
    cy.intercept('GET', '**/ztgict/v1/resource-summary/ipoe*', { fixture: 'ipoes/summary-list' }).as(
      'getSummaryIpoeList',
    )
  })

  context('一覧画面の「新規作成」ボタン', function () {
    const visitList = function (this: Mocha.Context) {
      cy.visit(`/tenants/${this.tenantId}/ipoes`)
      cy.wait(['@getIpoeList', '@getSummaryIpoeList'])
    }

    it('フレッツ回線別契約型のみの規制期間中は活性であること', function () {
      cy.clock(new Date(duringFletsSeparateRestriction), ['Date'])
      visitList.call(this)

      cy.get('[data-cy="ipoes-index-create-button"]').should('not.be.disabled')
    })

    it('全体の規制期間中は非活性であること', function () {
      cy.clock(new Date(duringIpoeRestriction), ['Date'])
      visitList.call(this)

      cy.get('[data-cy="ipoes-index-create-button"]').should('be.disabled')
    })

    it('規制期間終了後は活性であること', function () {
      cy.clock(new Date(afterIpoeRestriction), ['Date'])
      visitList.call(this)

      cy.get('[data-cy="ipoes-index-create-button"]').should('not.be.disabled')
    })
  })

  context('新規作成画面の申込種別ラジオボタン', function () {
    const visitCreate = function (this: Mocha.Context) {
      cy.visit(`/tenants/${this.tenantId}/ipoes/create`)
      cy.wait(['@getAvailable', '@getContractor'])
      // 申込種別を表示されるのを待つ
      cy.get('[data-cy="ipoe-create-request-type-radio-button"]').should('exist')
    }

    it('規制開始前はフレッツ回線別契約型を選択できること', function () {
      cy.clock(new Date(beforeFletsSeparateRestriction), ['Date'])
      visitCreate.call(this)

      cy.get('[data-cy="ipoe-create-request-type-radio-button"]')
        .find(`.label.${RequestTypes.FletsSeparate}`)
        .parent()
        .should('not.have.class', 'disabled')
    })

    it('規制期間中はフレッツ回線別契約型が非活性で、光回線一括提供型は活性であること', function () {
      cy.clock(new Date(duringFletsSeparateRestriction), ['Date'])
      visitCreate.call(this)

      cy.get('[data-cy="ipoe-create-request-type-radio-button"]')
        .find(`.label.${RequestTypes.FletsSeparate}`)
        .parent()
        .should('have.class', 'disabled')
      cy.get('[data-cy="ipoe-create-request-type-radio-button"]')
        .find(`.label.${RequestTypes.HikariCollabo}`)
        .parent()
        .should('not.have.class', 'disabled')
    })

    it('フレッツ回線別契約型の規制期間終了後は選択できること', function () {
      cy.clock(new Date(duringIpoeRestriction), ['Date'])
      visitCreate.call(this)

      cy.get('[data-cy="ipoe-create-request-type-radio-button"]')
        .find(`.label.${RequestTypes.FletsSeparate}`)
        .parent()
        .should('not.have.class', 'disabled')
    })
  })

  context('フレッツ回線別契約型 詳細画面の「転用」「廃止」ボタン', function () {
    const visitFletsSeparateDetail = function (this: Mocha.Context) {
      cy.intercept('GET', `**/ztgict/v1/ipoe?ipoeId=${this.ipoeId}&limit=1`, {
        body: { ipoes: [{ ref: `/v1/ipoe/separate-contract/${this.ipoeId}` }] },
      }).as('getIpoeContractType')
      cy.intercept('GET', '**/ztgict/v1/ipoe/separate-contract/*', { fixture: 'ipoes/flets-separate/detail' }).as(
        'getFletsSeparate',
      )
      cy.visit(`/tenants/${this.tenantId}/ipoes/${this.ipoeId}`)
      cy.wait(['@getContractor', '@getAvailable', '@getIpoeContractType', '@getFletsSeparate'])
    }

    it('規制開始前は「転用」「廃止」ボタンが活性であること', function () {
      cy.clock(new Date(beforeFletsSeparateRestriction), ['Date'])
      visitFletsSeparateDetail.call(this)

      cy.get('[data-cy="ipoes-id-index-diversion-button"]').should('not.be.disabled')
      cy.get('[data-cy="ipoes-id-index-delete-button"]').should('not.be.disabled')
    })

    it('規制期間中は「転用」「廃止」ボタンが非活性であること', function () {
      cy.clock(new Date(duringFletsSeparateRestriction), ['Date'])
      visitFletsSeparateDetail.call(this)

      cy.get('[data-cy="ipoes-id-index-diversion-button"]').should('be.disabled')
      cy.get('[data-cy="ipoes-id-index-delete-button"]').should('be.disabled')
      // 「変更」ボタンは規制対象外
      cy.get('[data-cy="ipoes-id-index-edit-button"]').should('not.be.disabled')
    })

    it('フレッツ回線別契約型の規制期間終了後は「転用」「廃止」ボタンが活性であること', function () {
      cy.clock(new Date(duringIpoeRestriction), ['Date'])
      visitFletsSeparateDetail.call(this)

      cy.get('[data-cy="ipoes-id-index-diversion-button"]').should('not.be.disabled')
      cy.get('[data-cy="ipoes-id-index-delete-button"]').should('not.be.disabled')
    })
  })

  context('光回線一括提供型 詳細画面の「廃止」ボタン', function () {
    it('フレッツ回線別契約型の規制期間中も活性であること', function () {
      cy.clock(new Date(duringFletsSeparateRestriction), ['Date'])
      cy.intercept('GET', `**/ztgict/v1/ipoe?ipoeId=${this.ipoeId}&limit=1`, {
        body: { ipoes: [{ ref: `/v1/ipoe/hikari-collabo/${this.ipoeId}` }] },
      }).as('getIpoeContractType')
      cy.intercept('GET', '**/ztgict/v1/ipoe/hikari-collabo/*', { fixture: 'ipoes/new/detail' }).as('getHikariCollabo')

      cy.visit(`/tenants/${this.tenantId}/ipoes/${this.ipoeId}`)
      cy.wait(['@getContractor', '@getAvailable', '@getIpoeContractType', '@getHikariCollabo'])

      cy.get('[data-cy="ipoes-id-index-delete-button"]').should('not.be.disabled')
    })
  })
})
