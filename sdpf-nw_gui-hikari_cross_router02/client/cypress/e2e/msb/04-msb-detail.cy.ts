import { generateRandomHex, t } from '@cypress/support/utils'

describe('msb detail', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)
    this.resourceId = generateRandomHex(32)

    cy.fixture('msb/threatNotice.json').then(threatNotice => {
      this.threatNotice = threatNotice
    })
  })

  context('脅威検知とMSBのメッセージ確認', () => {
    it('threatNoticeが存在する時、threatNoticeのメッセージが表示される', function () {
      cy.intercept('GET', '**/msb/v1/rink-msb-contracts/*/licenses', { fixture: 'msb/detail' }).as('getMsbLicenses')
      cy.intercept('GET', '**/msb/v1/threat-notice', { fixture: 'msb/threatNotice' }).as('getThreatNotice')

      cy.visit(`/tenants/${this.tenantId}/msb/${this.resourceId}`)
      cy.wait(['@getMsbLicenses', '@getThreatNotice'])

      // threatNoticeのメッセージが表示される
      cy.get('[data-cy="msb-threat-notice-message"]').should('have.text', this.threatNotice.message)
      // 管理コンソールボタンが表示される
      cy.get('[data-cy="msb-threat-notice-console-button"]').should('exist')
    })

    it('threatNoticeが存在しない時、お知らせがないメッセージが表示される', function () {
      cy.intercept('GET', '**/msb/v1/rink-msb-contracts/*/licenses', { fixture: 'msb/detail' }).as('getMsbLicenses')
      cy.intercept('GET', '**/msb/v1/threat-notice', { statusCode: 404, body: {} }).as('getThreatNotice')

      cy.visit(`/tenants/${this.tenantId}/msb/${this.resourceId}`)
      cy.wait(['@getMsbLicenses', '@getThreatNotice'])

      // お知らせがないメッセージが表示される
      cy.get('[data-cy="msb-threat-notice-message"]').should('have.text', t('msb.message.noNotification'))
      // 管理コンソールボタンが表示される
      cy.get('[data-cy="msb-threat-notice-console-button"]').should('exist')
    })

    it('MSBライセンスが存在する時、MSBライセンスの詳細情報が表示される', function () {
      cy.intercept('GET', '**/msb/v1/rink-msb-contracts/*/licenses', { fixture: 'msb/detail' }).as('getMsbLicenses')
      cy.intercept('GET', '**/msb/v1/threat-notice', { statusCode: 404, body: {} }).as('getThreatNotice')

      cy.visit(`/tenants/${this.tenantId}/msb/${this.resourceId}`)
      cy.wait(['@getMsbLicenses', '@getThreatNotice'])

      // ライセンス情報が表示される
      cy.get('[data-cy="msb-detail-application-license-information-section"]').should('exist')

      // 編集ボタンと削除ボタンが表示される
      cy.get('[data-cy="msb-id-index-edit-button"]').should('exist').and('have.text', t('common.edit'))
      cy.get('[data-cy="msb-id-index-delete-button"]').should('exist').and('have.text', t('common.delete'))
    })

    it('MSBライセンスが存在しない時、/msb にリダイレクトされる', function () {
      cy.intercept('GET', '**/msb/v1/rink-msb-contracts/*/licenses', { statusCode: 404, body: {} }).as('getMsbLicenses')
      cy.intercept('GET', '**/msb/v1/threat-notice', { statusCode: 404, body: {} }).as('getThreatNotice')
      cy.intercept('GET', '**/msb/v1/rink-msb-contracts', { statusCode: 404, body: {} }).as('getMsb')

      cy.visit(`/tenants/${this.tenantId}/msb/${this.resourceId}`)
      cy.wait(['@getMsbLicenses', '@getThreatNotice'])

      // MSBが存在しない場合は一覧画面にリダイレクトされる
      cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/msb`)
      cy.wait(['@getMsb', '@getThreatNotice'])

      // MSBが存在しない旨のメッセージが表示される
      cy.get('[data-cy="notification-dialog-text"]').should('contain', t('msb.message.notFound'))
      cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
      cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.close')).click()
      cy.get('[data-cy="notification-dialog-text"]').should('not.exist')

      // 管理コンソールボタン非表示
      cy.get('[data-cy="msb-threat-notice-console-button"]').should('not.exist')
    })
  })

  context('受付時間外メッセージの確認 - MSBが存在しない時', () => {
    beforeEach(function () {
      cy.intercept('GET', '**/msb/v1/rink-msb-contracts', { statusCode: 404, body: {} }).as('getMsb')
      cy.intercept('GET', '**/msb/v1/threat-notice', { statusCode: 404, body: {} }).as('getThreatNotice')
    })
    it('平日 - 受付時間外 - 日本時間(8:59)', function () {
      cy.clock(new Date('2024-04-22T23:59:59Z'), ['Date'])

      // MSB詳細画面に遷移
      cy.visit(`/tenants/${this.tenantId}/msb`)
      cy.wait(['@getMsb', '@getThreatNotice'])

      // メッセージの表示確認
      cy.get('[data-cy="msb-index-outside-reception-hour"]').should('exist')

      // 新規申込ボタンが非活性なことを確認
      cy.get('[data-cy="msb-index-new-application-button"]').should('be.disabled')
    })

    it('平日 - 受付時間内 - 日本時間(9:00)', function () {
      cy.clock(new Date('2024-04-22T00:00:00Z'), ['Date'])

      // MSB詳細画面に遷移
      cy.visit(`/tenants/${this.tenantId}/msb`)
      cy.wait(['@getMsb', '@getThreatNotice'])

      // メッセージの非表示確認
      cy.get('[data-cy="msb-index-outside-reception-hour"]').should('not.exist')

      // 新規申込ボタンが活性なことを確認
      cy.get('[data-cy="msb-index-new-application-button"]').should('not.be.disabled')
    })

    it('平日 - 受付時間内 - 日本時間(15:59)', function () {
      cy.clock(new Date('2024-04-22T06:59:59Z'), ['Date'])

      // MSB詳細画面に遷移
      cy.visit(`/tenants/${this.tenantId}/msb`)
      cy.wait(['@getMsb', '@getThreatNotice'])

      // メッセージの非表示確認
      cy.get('[data-cy="msb-index-outside-reception-hour"]').should('not.exist')

      // 新規申込ボタンが活性なことを確認
      cy.get('[data-cy="msb-index-new-application-button"]').should('not.be.disabled')
    })

    it('平日 - 受付時間外 - 日本時間(16:00)', function () {
      cy.clock(new Date('2024-04-22T07:00:00Z'), ['Date'])

      // MSB詳細画面に遷移
      cy.visit(`/tenants/${this.tenantId}/msb`)
      cy.wait(['@getMsb', '@getThreatNotice'])

      // メッセージの表示確認
      cy.get('[data-cy="msb-index-outside-reception-hour"]').should('exist')

      // 新規申込ボタンが非活性なことを確認
      cy.get('[data-cy="msb-index-new-application-button"]').should('be.disabled')
    })

    it('土曜 - 受付時間外', function () {
      cy.clock(new Date('2024-04-20T00:00:00Z'), ['Date'])

      // MSB詳細画面に遷移
      cy.visit(`/tenants/${this.tenantId}/msb`)
      cy.wait(['@getMsb', '@getThreatNotice'])

      // メッセージの表示確認
      cy.get('[data-cy="msb-index-outside-reception-hour"]').should('exist')

      // 新規申込ボタンが非活性なことを確認
      cy.get('[data-cy="msb-index-new-application-button"]').should('be.disabled')
    })

    it('日曜 - 受付時間外', function () {
      cy.clock(new Date('2024-04-21T06:59:59Z'), ['Date'])

      // MSB詳細画面に遷移
      cy.visit(`/tenants/${this.tenantId}/msb`)
      cy.wait(['@getMsb', '@getThreatNotice'])

      // メッセージの表示確認
      cy.get('[data-cy="msb-index-outside-reception-hour"]').should('exist')

      // 新規申込ボタンが非活性なことを確認
      cy.get('[data-cy="msb-index-new-application-button"]').should('be.disabled')
    })
  })

  context('受付時間外メッセージの確認 - MSBが存在する時', () => {
    beforeEach(function () {
      cy.intercept('GET', '**/msb/v1/rink-msb-contracts/*/licenses', { fixture: 'msb/detail' }).as('getMsbLicenses')
      cy.intercept('GET', '**/msb/v1/threat-notice', { statusCode: 404, body: {} }).as('getThreatNotice')
    })
    it('平日 - 受付時間外 - 日本時間(8:59)', function () {
      cy.clock(new Date('2024-04-22T23:59:59Z'), ['Date'])

      // MSB詳細画面に遷移
      cy.visit(`/tenants/${this.tenantId}/msb/${this.resourceId}`)
      cy.wait(['@getMsbLicenses', '@getThreatNotice'])

      // メッセージの表示確認
      cy.get('[data-cy="msb-id-index-outside-reception-hour"]').should('exist')

      // 編集ボタンと削除ボタンが非活性なことを確認
      cy.get('[data-cy="msb-id-index-edit-button"]').should('be.disabled')
      cy.get('[data-cy="msb-id-index-delete-button"]').should('be.disabled')
    })

    it('平日 - 受付時間内 - 日本時間(9:00)', function () {
      cy.clock(new Date('2024-04-22T00:00:00Z'), ['Date'])

      // MSB詳細画面に遷移
      cy.visit(`/tenants/${this.tenantId}/msb/${this.resourceId}`)
      cy.wait(['@getMsbLicenses', '@getThreatNotice'])

      // メッセージの非表示確認
      cy.get('[data-cy="msb-id-index-outside-reception-hour"]').should('not.exist')

      // 編集ボタンと削除ボタンが活性なことを確認
      cy.get('[data-cy="msb-id-index-edit-button"]').should('not.be.disabled')
      cy.get('[data-cy="msb-id-index-delete-button"]').should('not.be.disabled')
    })

    it('平日 - 受付時間内 - 日本時間(15:59)', function () {
      cy.clock(new Date('2024-04-22T06:59:59Z'), ['Date'])

      // MSB詳細画面に遷移
      cy.visit(`/tenants/${this.tenantId}/msb/${this.resourceId}`)
      cy.wait(['@getMsbLicenses', '@getThreatNotice'])

      // メッセージの非表示確認
      cy.get('[data-cy="msb-id-index-outside-reception-hour"]').should('not.exist')

      // 編集ボタンと削除ボタンが活性なことを確認
      cy.get('[data-cy="msb-id-index-edit-button"]').should('not.be.disabled')
      cy.get('[data-cy="msb-id-index-delete-button"]').should('not.be.disabled')
    })

    it('平日 - 受付時間外 - 日本時間(16:00)', function () {
      cy.clock(new Date('2024-04-22T07:00:00Z'), ['Date'])

      // MSB詳細画面に遷移
      cy.visit(`/tenants/${this.tenantId}/msb/${this.resourceId}`)
      cy.wait(['@getMsbLicenses', '@getThreatNotice'])

      // メッセージの表示確認
      cy.get('[data-cy="msb-id-index-outside-reception-hour"]').should('exist')

      // 編集ボタンと削除ボタンが非活性なことを確認
      cy.get('[data-cy="msb-id-index-edit-button"]').should('be.disabled')
      cy.get('[data-cy="msb-id-index-delete-button"]').should('be.disabled')
    })

    it('土曜 - 受付時間外', function () {
      cy.clock(new Date('2024-04-20T00:00:00Z'), ['Date'])

      // MSB詳細画面に遷移
      cy.visit(`/tenants/${this.tenantId}/msb/${this.resourceId}`)
      cy.wait(['@getMsbLicenses', '@getThreatNotice'])

      // メッセージの表示確認
      cy.get('[data-cy="msb-id-index-outside-reception-hour"]').should('exist')

      // 編集ボタンと削除ボタンが非活性なことを確認
      cy.get('[data-cy="msb-id-index-edit-button"]').should('be.disabled')
      cy.get('[data-cy="msb-id-index-delete-button"]').should('be.disabled')
    })

    it('日曜 - 受付時間外', function () {
      cy.clock(new Date('2024-04-21T06:59:59Z'), ['Date'])

      // MSB詳細画面に遷移
      cy.visit(`/tenants/${this.tenantId}/msb/${this.resourceId}`)
      cy.wait(['@getMsbLicenses', '@getThreatNotice'])

      // メッセージの表示確認
      cy.get('[data-cy="msb-id-index-outside-reception-hour"]').should('exist')

      // 編集ボタンと削除ボタンが非活性なことを確認
      cy.get('[data-cy="msb-id-index-edit-button"]').should('be.disabled')
      cy.get('[data-cy="msb-id-index-delete-button"]').should('be.disabled')
    })
  })
})
