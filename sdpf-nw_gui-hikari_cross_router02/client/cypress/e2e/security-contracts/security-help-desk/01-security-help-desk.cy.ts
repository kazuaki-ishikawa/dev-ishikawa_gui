import { formatDate, generateRandomHex, t } from '@cypress/support/utils'

describe('セキュリティヘルプデスク', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)
    this.visitUrl = `/tenants/${this.tenantId}/security-contracts/security-help-desk`
  })

  context('申し込み', function () {
    it('利用申し込み', function () {
      cy.intercept('GET', '**/ztgict/v1/settings/security-help-desk', {
        fixture: 'security-contracts/security-help-desk/deleted',
      }).as('getSecurityHelpDesk')
      cy.intercept('POST', '**/ztgict/v1/settings/security-help-desk', {
        fixture: 'security-contracts/security-help-desk/creating',
      }).as('postSecurityHelpDesk')

      cy.visit(this.visitUrl)
      cy.wait(['@getSecurityHelpDesk'])

      // 利用開始ボタンをクリック
      cy.get('[data-cy="security-contracts-security-help-desk-create-button"]')
        .should('have.text', t('securityHelpDesk.create'))
        .click()
      // 確認ダイアログが表示される
      cy.get('[data-cy="security-contracts-security-help-desk-confirm-dialog"]').as('dialog').should('exist')
      cy.get('@dialog').find('.dialog-card-content').should('have.text', t('securityHelpDesk.confirm.create'))
      cy.get('@dialog')
        .find('.dialog-base-submit-button')
        .as('submit')
        .should('have.text', t('securityHelpDesk.createSubmitButton'))

      // 申し込みを実行
      cy.get('@submit').click()
      cy.wait(['@postSecurityHelpDesk'])

      // 申し込み完了ダイアログの表示
      cy.get('@dialog').should('not.exist')
      cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('securityHelpDesk.confirm.created'))
      cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
      cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.close')).click()

      cy.get('.dialog-main').should('not.exist')
      cy.url().should('eq', `${Cypress.config().baseUrl}${this.visitUrl}`)
    })

    it('廃止申し込み', function () {
      cy.intercept('GET', '**/ztgict/v1/settings/security-help-desk', {
        fixture: 'security-contracts/security-help-desk/created',
      }).as('getSecurityHelpDesk')
      cy.intercept('DELETE', '**/ztgict/v1/settings/security-help-desk', {
        fixture: 'security-contracts/security-help-desk/deleting',
      }).as('deleteSecurityHelpDesk')

      cy.visit(this.visitUrl)
      cy.wait(['@getSecurityHelpDesk'])

      // 利用廃止ボタンをクリック
      cy.get('[data-cy="security-contracts-security-help-desk-delete-button"]')
        .should('have.text', t('securityHelpDesk.delete'))
        .click()
      // 確認ダイアログが表示される
      cy.get('[data-cy="security-contracts-security-help-desk-confirm-dialog"]').as('dialog').should('exist')
      cy.get('@dialog').find('.dialog-card-content').should('have.text', t('securityHelpDesk.confirm.delete'))
      cy.get('@dialog')
        .find('.dialog-base-submit-button')
        .as('submit')
        .should('have.text', t('securityHelpDesk.deleteSubmitButton'))

      // 申し込みを実行
      cy.get('@submit').click()
      cy.wait(['@deleteSecurityHelpDesk'])

      // 申し込み完了ダイアログの表示
      cy.get('@dialog').should('not.exist')
      cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('securityHelpDesk.confirm.deleted'))
      cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
      cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.close')).click()
      cy.get('[data-cy="notification-dialog-text"]').should('not.exist')
      cy.url().should('eq', `${Cypress.config().baseUrl}${this.visitUrl}`)
    })
  })

  context('表示確認', function () {
    it('セキュリティ規約同意前', function () {
      cy.intercept('GET', '**/ztgict/v1/settings/security', {
        body: { termsOfServiceAccepted: false },
      }).as('getSecurityTermsOfService')

      cy.visit(this.visitUrl)
      cy.wait([
        '@getSession',
        '@getMobile',
        '@getTrafficReportFlowAnalyzerTermsOfService',
        '@getSecurityTermsOfService',
      ])

      // セキュリティ同意画面へ遷移ボタンが表示される
      cy.get('[data-cy="security-contracts-security-help-desk-terms-of-service-button"]').should('exist')
      // キャンペーンは非表示
      cy.get('[data-cy="security-contracts-security-help-desk-campaign"]').should('not.exist')
      // 利用状況のみ表示される
      cy.get('.detail-grid-container')
        .should('have.length', 1)
        .eq(0)
        .then($el => {
          cy.wrap($el).find('div > div').eq(0).should('have.text', t('securityHelpDesk.status'))
          cy.wrap($el).find('div > div').eq(1).should('have.text', t('securityHelpDesk.notUsing'))
        })

      // 注意事項は非表示
      cy.get('[data-cy="security-contracts-security-help-desk-caution"]').should('not.exist')
      // 利用開始ボタンは非活性で表示
      cy.get('[data-cy="security-contracts-security-help-desk-create-button"]').should('be.disabled')
      // 利用廃止ボタンは非表示
      cy.get('[data-cy="security-contracts-security-help-desk-delete-button"]').should('not.exist')
    })

    it('利用前（supportedTerminalCount: 0）', function () {
      cy.intercept('GET', '**/ztgict/v1/settings/security-help-desk', {
        fixture: 'security-contracts/security-help-desk/empty-supported-terminal-count',
      }).as('getSecurityHelpDesk')

      cy.visit(this.visitUrl)
      cy.wait(['@getSecurityHelpDesk'])

      // セキュリティ同意画面へ遷移ボタンは非表示
      cy.get('[data-cy="security-contracts-security-help-desk-terms-of-service-button"]').should('not.exist')
      // 申し込み履歴なしなのでキャンペーンを表示
      cy.get('[data-cy="security-contracts-security-help-desk-campaign"]').should('exist')
      // 利用状況のみ表示される
      cy.get('.detail-grid-container')
        .should('have.length', 1)
        .eq(0)
        .then($el => {
          cy.wrap($el).find('div > div').eq(0).should('have.text', t('securityHelpDesk.status'))
          cy.wrap($el).find('div > div').eq(1).should('have.text', t('securityHelpDesk.notUsing'))
        })

      // 注意事項(利用なし)を表示
      cy.get('[data-cy="security-contracts-security-help-desk-caution"]').should(
        'have.text',
        t('securityHelpDesk.note.notUsingCaution', { linkText: t('securityHelpDesk.note.service') }),
      )
      // 利用開始ボタンは非活性で表示
      cy.get('[data-cy="security-contracts-security-help-desk-create-button"]').should('be.disabled')
      // 利用廃止ボタンは非表示
      cy.get('[data-cy="security-contracts-security-help-desk-delete-button"]').should('not.exist')
    })

    it('利用前（利用履歴なし）', function () {
      cy.intercept('GET', '**/ztgict/v1/settings/security-help-desk', {
        fixture: 'security-contracts/security-help-desk/unused',
      }).as('getSecurityHelpDesk')

      cy.visit(this.visitUrl)
      cy.wait(['@getSecurityHelpDesk'])

      // 利用状況と対象ルーター数が表示される
      cy.get('.detail-grid-container')
        .should('have.length', 2)
        .eq(1)
        .then($el => {
          cy.wrap($el).find('div > div').eq(0).should('have.text', t('securityHelpDesk.supportedTerminalCount'))
          cy.wrap($el).find('div > div').eq(1).should('have.text', 10)
        })

      // 利用開始ボタンは活性で表示
      cy.get('[data-cy="security-contracts-security-help-desk-create-button"]').should('be.not.disabled')
      // 利用廃止ボタンは非表示
      cy.get('[data-cy="security-contracts-security-help-desk-delete-button"]').should('not.exist')
    })

    it('利用前（利用履歴あり/廃止後）', function () {
      cy.intercept('GET', '**/ztgict/v1/settings/security-help-desk', {
        fixture: 'security-contracts/security-help-desk/deleted',
      }).as('getSecurityHelpDesk')

      cy.visit(this.visitUrl)
      cy.wait(['@getSecurityHelpDesk'])

      // 申し込み履歴があるのでキャンペーンは非表示
      cy.get('[data-cy="security-contracts-security-help-desk-campaign"]').should('not.exist')
      // 利用状況と対象ルーター数が表示される
      cy.get('.detail-grid-container')
        .should('have.length', 2)
        .eq(1)
        .then($el => {
          cy.wrap($el).find('div > div').eq(0).should('have.text', t('securityHelpDesk.supportedTerminalCount'))
          cy.wrap($el).find('div > div').eq(1).should('have.text', 10)
        })

      // 利用開始ボタンは活性で表示
      cy.get('[data-cy="security-contracts-security-help-desk-create-button"]').should('be.not.disabled')
      // 利用廃止ボタンは非表示
      cy.get('[data-cy="security-contracts-security-help-desk-delete-button"]').should('not.exist')
    })

    it('利用申し込み中（orderStatus: processing）', function () {
      const effectiveDate = '2025-08-01'
      cy.fixture('security-contracts/security-help-desk/creating.json').then(data => {
        cy.intercept('GET', '**/ztgict/v1/settings/security-help-desk', {
          body: { ...data, effectiveDate },
        }).as('getSecurityHelpDesk')
      })

      cy.visit(this.visitUrl)
      cy.wait(['@getSecurityHelpDesk'])

      // 利用状況と対象ルーター数が表示される
      cy.get('.detail-grid-container')
        .should('have.length', 7)
        .eq(1)
        .then($el => {
          cy.wrap($el).find('div > div').eq(0).should('have.text', t('details.serviceStartDate'))
          cy.wrap($el).find('div > div').eq(1).should('have.text', formatDate(effectiveDate))
        })

      // ボタンはどちらも非表示
      cy.get('[data-cy="security-contracts-security-help-desk-create-button"]').should('not.exist')
      cy.get('[data-cy="security-contracts-security-help-desk-delete-button"]').should('not.exist')
    })

    it('利用中（orderStatus: completed）', function () {
      cy.intercept('GET', '**/ztgict/v1/settings/security-help-desk', {
        fixture: 'security-contracts/security-help-desk/created',
      }).as('getSecurityHelpDesk')

      cy.visit(this.visitUrl)
      cy.wait(['@getSecurityHelpDesk'])

      // 利用状況と対象ルーター数が表示される
      cy.get('.detail-grid-container')
        .should('have.length', 6)
        .eq(3)
        .then($el => {
          cy.wrap($el).find('div > div').eq(0).should('have.text', t('securityHelpDesk.supportUrl'))
          cy.wrap($el)
            .find('div > a')
            .eq(0)
            .should('have.text', t('securityHelpDesk.contacts'))
            .should('have.attr', 'href', 'https://example.com/security')
        })

      // 注意事項(利用あり)を表示
      cy.get('[data-cy="security-contracts-security-help-desk-caution"]').should(
        'have.text',
        t('securityHelpDesk.note.usingCaution'),
      )
      // 利用開始ボタンは非表示
      cy.get('[data-cy="security-contracts-security-help-desk-create-button"]').should('not.exist')
      // 利用廃止ボタンは活性で表示
      cy.get('[data-cy="security-contracts-security-help-desk-delete-button"]').should('not.be.disabled')
    })

    it('廃止申し込み中（orderStatus: applied）', function () {
      const effectiveDate = '2025-08-01'
      cy.fixture('security-contracts/security-help-desk/deleting.json').then(data => {
        cy.intercept('GET', '**/ztgict/v1/settings/security-help-desk', {
          body: { ...data, effectiveDate },
        }).as('getSecurityHelpDesk')
      })

      cy.visit(this.visitUrl)
      cy.wait(['@getSecurityHelpDesk'])

      // 利用状況と対象ルーター数が表示される
      cy.get('.detail-grid-container')
        .should('have.length', 7)
        .eq(1)
        .then($el => {
          cy.wrap($el).find('div > div').eq(0).should('have.text', t('details.serviceEndDate'))
          cy.wrap($el).find('div > div').eq(1).should('have.text', formatDate(effectiveDate))
        })

      // ボタンはどちらも非表示
      cy.get('[data-cy="security-contracts-security-help-desk-create-button"]').should('not.exist')
      cy.get('[data-cy="security-contracts-security-help-desk-delete-button"]').should('not.exist')
    })
  })
})
