import { generateRandomHex } from '@cypress/support/utils'

// 期間限定の申込規制(useApplicationRestriction)のテスト。規制期間終了後にこのファイルごと削除する
describe('ギャランティアクセス 期間限定の申込規制', () => {
  const detailWaitList = ['@getGuarantee', '@getCampaignList']
  // いずれも受付時間内(9:00〜20:00・第３月曜日以外)の日時を指定する
  const beforeRestriction = '2026-08-26T19:00:00+09:00'
  const duringRestriction = '2026-08-27T10:00:00+09:00'
  const afterRestriction = '2026-09-05T10:00:00+09:00'

  beforeEach(function () {
    this.tenantId = generateRandomHex(32)
    this.guaranteeId = generateRandomHex(32)

    cy.intercept('GET', '**/ztgict/v1/guarantees*', { fixture: 'guarantees/circuits/list' }).as('getGuaranteeList')
    cy.intercept('GET', '**/ztgict/v1/resource-summary/guarantees?limit=1000*', {
      fixture: 'guarantees/circuits/list',
    }).as('getSummaryGuaranteeList')
    cy.intercept('GET', '**/ztgict/v1/resource-summary/terminals*', { fixture: 'terminals/list-some-items' }).as(
      'getTerminalList',
    )
    cy.intercept('GET', '**/ztgict/v1/campaigns*', { fixture: 'campaigns/list-empty' }).as('getCampaignList')
  })

  context('一覧画面の「新規作成」ボタン', function () {
    const visitList = function (this: Mocha.Context) {
      cy.visit(`/tenants/${this.tenantId}/guarantees/circuits`)
      cy.wait(['@getGuaranteeList', '@getSummaryGuaranteeList'])
    }

    it('規制開始前は活性であること', function () {
      cy.clock(new Date(beforeRestriction), ['Date'])
      visitList.call(this)

      cy.get('[data-cy="guarantees-circuits-index-create-new-button"]').should('not.be.disabled')
    })

    it('規制期間中は非活性であること', function () {
      cy.clock(new Date(duringRestriction), ['Date'])
      visitList.call(this)

      cy.get('[data-cy="guarantees-circuits-index-create-new-button"]').should('be.disabled')
    })

    it('規制期間終了後は活性であること', function () {
      cy.clock(new Date(afterRestriction), ['Date'])
      visitList.call(this)

      cy.get('[data-cy="guarantees-circuits-index-create-new-button"]').should('not.be.disabled')
    })
  })

  context('詳細画面の「廃止」ボタン', function () {
    const visitDetail = function (this: Mocha.Context) {
      cy.intercept('GET', `**/ztgict/v1/guarantees/${this.guaranteeId}`, {
        fixture: 'guarantees/circuits/detail-reserve-date-approved',
      }).as('getGuarantee')
      cy.visit(`/tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}`)
      cy.wait(detailWaitList)
    }

    it('規制開始前は活性であること', function () {
      cy.clock(new Date(beforeRestriction), ['Date'])
      visitDetail.call(this)

      cy.get('[data-cy="guarantees-circuits-id-index-delete-button"]').should('not.be.disabled')
    })

    it('規制期間中は非活性であること', function () {
      cy.clock(new Date(duringRestriction), ['Date'])
      visitDetail.call(this)

      cy.get('[data-cy="guarantees-circuits-id-index-delete-button"]').should('be.disabled')
      // 「変更」ボタンは規制対象外
      cy.get('[data-cy="guarantees-circuits-id-index-edit-button"]').should('not.be.disabled')
    })

    it('規制期間終了後は活性であること', function () {
      cy.clock(new Date(afterRestriction), ['Date'])
      visitDetail.call(this)

      cy.get('[data-cy="guarantees-circuits-id-index-delete-button"]').should('not.be.disabled')
    })
  })

  context('詳細画面の「回収日予約」ボタン', function () {
    const visitDetail = function (this: Mocha.Context) {
      cy.intercept('GET', `**/ztgict/v1/guarantees/${this.guaranteeId}`, {
        fixture: 'guarantees/circuits/detail-removal-date-rejected',
      }).as('getGuarantee')
      cy.visit(`/tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}`)
      cy.wait(detailWaitList)
    }

    it('規制開始前は活性であること', function () {
      cy.clock(new Date(beforeRestriction), ['Date'])
      visitDetail.call(this)

      cy.get('[data-cy="guarantees-circuits-id-index-reserve-removal-date-button"]').should('not.be.disabled')
    })

    it('規制期間中は非活性であること', function () {
      cy.clock(new Date(duringRestriction), ['Date'])
      visitDetail.call(this)

      cy.get('[data-cy="guarantees-circuits-id-index-reserve-removal-date-button"]').should('be.disabled')
    })

    it('規制期間終了後は活性であること', function () {
      cy.clock(new Date(afterRestriction), ['Date'])
      visitDetail.call(this)

      cy.get('[data-cy="guarantees-circuits-id-index-reserve-removal-date-button"]').should('not.be.disabled')
    })
  })
})
