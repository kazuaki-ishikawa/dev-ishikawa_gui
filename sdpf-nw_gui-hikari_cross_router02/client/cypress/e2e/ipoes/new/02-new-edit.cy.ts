import { FletsOrderTypes } from '@app/api/ipoes/constants'
import { generateRandomHex, nDaysLater, t } from '@cypress/support/utils'

describe('光回線一括提供型新設 編集', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)
    this.ipoeId = generateRandomHex(32)
    this.orderId = generateRandomHex(32)

    cy.fixture('ipoes/new/edit.json').then(edit => {
      this.edit = edit
    })
    cy.fixture('ipoes/new/detail.json').then(detail => {
      this.detail = detail
    })
    cy.intercept('GET', '**/ztgict/v1/resource-summary/ipoe*', { fixture: 'ipoes/summary-list' }).as('getIpoeList')
    cy.intercept('GET', '**/ztgict/v1/settings/contractor', { fixture: 'contractor/detail' }).as('getContractor')
    cy.intercept('GET', '**/ztgict/v1/ipoe/hikari-collabo-util/available', { body: { available: true } }).as(
      'getAvailable',
    )
    cy.intercept('GET', `**/ztgict/v1/ipoe?ipoeId=${this.ipoeId}&limit=1`, {
      body: { ipoes: [{ ref: `/v1/ipoe/hikari-collabo/${this.ipoeId}` }] },
    }).as('getIpoeContractType')
    cy.intercept('PUT', '**/ztgict/v1/ipoe/hikari-collabo/*', { body: { orderId: this.orderId } }).as(
      'putHikariCollaboNew',
    )
    cy.intercept('GET', `**/ztgict/v1/orders/${this.orderId}`, { response: { statusCode: 200 } }).as('getOrder')
    cy.intercept('GET', '**/ztgict/v1/service-closed-days/hikari-collabo', {
      body: { closedDays: [] },
    }).as('getServiceClosedDays')
  })

  it('全要素の変更 -> オーダー詳細（fletsOrderType: new）', function () {
    // GET のリクエストをモック
    cy.intercept('GET', '**/ztgict/v1/ipoe/hikari-collabo/*', {
      body: { ...this.detail, fletsOrderType: FletsOrderTypes.New },
    }).as('getHikariCollaboNew')

    cy.visit(`/tenants/${this.tenantId}/ipoes/${this.ipoeId}`)
    cy.wait(['@getAvailable', '@getIpoeContractType', '@getHikariCollaboNew'])

    // 編集画面に遷移
    cy.get('[data-cy="ipoes-id-index-edit-button"]').click()
    cy.wait(['@getAvailable', '@getIpoeContractType', '@getHikariCollaboNew', '@getIpoeList', '@getServiceClosedDays'])

    cy.get('[data-cy="ipoes-id-edit-customer-note"]').find('input').clear().type(this.edit.customerNote)
    // ipoeType
    cy.inputSelectForm({
      selector: '[data-cy="ipoes-id-edit-ipoe-type"]',
      value: t(`ipoes.${this.edit.ipoeType}`),
    })
    // appControl
    if (this.edit.ipoeType !== 'wide') {
      cy.get('[data-cy="ipoes-id-edit-app-control"]').should('not.exist')
    } else {
      cy.get('[data-cy="ipoes-id-edit-app-control"]').find(`.label.${this.edit.appControl}`).click()
    }
    // onSiteRepairOption
    cy.get('[data-cy="ipoes-id-edit-on-site-repair-option"]').find(`.label.${this.edit.onSiteRepairOption}`).click()
    // changeEffectiveDate
    cy.inputDatePicker({
      className: '[data-cy="ipoes-id-edit-change-effective-date"]',
      date: nDaysLater(15),
    })

    // 確認
    cy.get('[data-cy="ipoes-id-edit-cancel-button"]').should('have.text', t('common.cancel'))
    cy.get('[data-cy="ipoes-id-edit-submit-button"]').should('have.text', t('common.confirm')).click()

    // 規約同意
    if (this.edit.ipoeType === 'wide') {
      cy.get('[data-cy="hikari-collabo-terms-of-service-agreement"]').find('.checkbox').click()
    } else {
      cy.get('[data-cy="hikari-collabo-terms-of-service"]').should('not.exist')
    }

    // 保存
    cy.get('[data-cy="ipoes-id-edit-cancel-button"]').should('have.text', t('common.return'))
    cy.get('[data-cy="ipoes-id-edit-submit-button"]')
      .should('have.text', t('common.save'))
      .should('not.be.disabled')
      .click()

    cy.wait('@putHikariCollaboNew').then(req => {
      expect(req.request.body).to.deep.equal({ ...this.edit, changeEffectiveDate: nDaysLater(15) })
    })

    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/ipoes/${this.ipoeId}`)
    cy.wait(['@getAvailable', '@getIpoeContractType', '@getContractor', '@getHikariCollaboNew'])

    // PUT ipoe/hikari-collabo の成功メッセージを確認
    cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('message.accepted'))
    // 「オーダー詳細へ」ボタンを押してオーダー詳細画面に遷移することを確認する
    cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
    cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.moveToOrderDetail')).click()
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/orders/${this.orderId}`)
    cy.wait('@getOrder')
    cy.get('.dialog-main').should('not.exist')

    // オーダー詳細画面の戻るボタンを押して詳細画面に戻る
    cy.get('[data-cy="orders-id-index-return-button"]').should('have.text', t('common.return')).click()
    // 詳細画面に戻る
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/ipoes/${this.ipoeId}`)
    cy.wait(['@getAvailable', '@getIpoeContractType', '@getContractor', '@getHikariCollaboNew'])
  })

  const testCases = [{ fletsOrderType: FletsOrderTypes.Migrate }, { fletsOrderType: FletsOrderTypes.Diversion }]
  testCases.forEach(({ fletsOrderType }) => {
    it(`回線名のみ変更 -> 閉じる（fletsOrderType: ${fletsOrderType}）`, function () {
      // GET のリクエストをモック
      cy.intercept('GET', '**/ztgict/v1/ipoe/hikari-collabo/*', {
        body: { ...this.detail, fletsOrderType },
      }).as('getHikariCollaboNew')

      cy.visit(`/tenants/${this.tenantId}/ipoes/${this.ipoeId}`)
      cy.wait(['@getAvailable', '@getIpoeContractType', '@getHikariCollaboNew'])

      // 編集画面に遷移
      cy.get('[data-cy="ipoes-id-index-edit-button"]').click()
      cy.wait([
        '@getAvailable',
        '@getIpoeContractType',
        '@getHikariCollaboNew',
        '@getIpoeList',
        '@getServiceClosedDays',
      ])

      cy.get('[data-cy="ipoes-id-edit-customer-note"]').find('input').clear().type(this.edit.customerNote)
      // ipoeTypeを変更しない
      cy.get('[data-cy="ipoes-id-edit-ipoe-type"]').should('exist')
      // appControlを変更しない
      if (this.detail.ipoeType !== 'wide') {
        cy.get('[data-cy="ipoes-id-edit-app-control"]').should('not.exist')
      } else {
        cy.get('[data-cy="ipoes-id-edit-app-control"]').should('exist')
      }
      // onSiteRepairOption
      cy.get('[data-cy="ipoes-id-edit-on-site-repair-option"]').should('exist')
      // changeEffectiveDate
      cy.get('[data-cy="ipoes-id-edit-change-effective-date"]').should('not.exist')

      // 確認
      cy.get('[data-cy="ipoes-id-edit-cancel-button"]').should('have.text', t('common.cancel'))
      cy.get('[data-cy="ipoes-id-edit-submit-button"]').should('have.text', t('common.confirm')).click()

      // 規約同意 ipoeType を変更していないので非表示になる
      cy.get('[data-cy="hikari-collabo-terms-of-service"]').should('not.exist')

      // 保存
      cy.get('[data-cy="ipoes-id-edit-cancel-button"]').should('have.text', t('common.return'))
      cy.get('[data-cy="ipoes-id-edit-submit-button"]').should('have.text', t('common.save')).click()

      const request = {
        customerNote: this.edit.customerNote,
        ipoeType: this.detail.ipoeType,
        appControl: this.detail.appControl,
        onSiteRepairOption: this.detail.onSiteRepairOption,
        changeEffectiveDate: undefined,
      }
      cy.wait('@putHikariCollaboNew').then(req => {
        const stringify = JSON.stringify(request)
        expect(req.request.body).to.deep.equal(JSON.parse(stringify))
      })

      cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/ipoes/${this.ipoeId}`)
      cy.wait(['@getAvailable', '@getIpoeContractType', '@getHikariCollaboNew'])

      // PUT ipoe/hikari-collabo の成功メッセージを確認
      cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('message.accepted'))
      cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
      cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.moveToOrderDetail'))
      // ダイアログの閉じるボタンを押す
      cy.get('.dialog-card-close').click()
      cy.get('[data-cy="notification-dialog-text"]').should('not.exist')
      cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/ipoes/${this.ipoeId}`)
    })
  })

  it('getServiceClosedDays が 500 エラーの場合、ダイアログが表示され、DatePicker が disabled になり、確認ボタンが押せない', function () {
    cy.intercept('GET', '**/ztgict/v1/service-closed-days/hikari-collabo', {
      statusCode: 500,
      body: { errorCode: 500, errorMessage: '500 Internal Server Error!' },
    }).as('getServiceClosedDaysError')
    cy.intercept('GET', '**/ztgict/v1/ipoe/hikari-collabo/*', {
      body: { ...this.detail, fletsOrderType: 'new' },
    }).as('getHikariCollaboNew')

    cy.visit(`/tenants/${this.tenantId}/ipoes/${this.ipoeId}`)
    cy.wait(['@getAvailable', '@getIpoeContractType', '@getHikariCollaboNew'])

    cy.get('[data-cy="ipoes-id-index-edit-button"]').click()
    cy.wait([
      '@getAvailable',
      '@getIpoeContractType',
      '@getHikariCollaboNew',
      '@getIpoeList',
      '@getServiceClosedDaysError',
    ])

    // エラーダイアログの表示
    cy.get('[data-cy="notification-dialog-text"]').should(
      'have.text',
      `${t('message.failed')}\n500\n500 Internal Server Error!`,
    )
    cy.get('[data-cy="notification-dialog-submit-button"]').click()

    // onSiteRepairOption を変更して changeEffectiveDate を表示させる
    cy.get('[data-cy="ipoes-id-edit-on-site-repair-option"]').find(`.label.${this.edit.onSiteRepairOption}`).click()

    // DatePicker が disabled になっている
    cy.get('[data-cy="ipoes-id-edit-change-effective-date"]').find('input').should('be.disabled')

    // 確認ボタンが disabled になっている
    cy.get('[data-cy="ipoes-id-edit-submit-button"]').should('be.disabled')
  })
})
