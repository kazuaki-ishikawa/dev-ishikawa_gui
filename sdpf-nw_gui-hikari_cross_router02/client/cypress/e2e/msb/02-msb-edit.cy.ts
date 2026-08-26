import { generateRandomHex, t } from '@cypress/support/utils'

describe('msb edit', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)
    this.resourceId = generateRandomHex(32)
    this.orderId = generateRandomHex(32)

    cy.fixture('msb/edit.json').then(edit => {
      this.edit = edit
    })

    cy.fixture('msb/detail.json').then(detail => {
      this.detail = detail
    })

    cy.intercept('GET', '**/msb/v1/rink-msb-contracts', { fixture: 'msb/detail' }).as('getMsb')
    cy.intercept('GET', '**/msb/v1/threat-notice', { statusCode: 404, body: {} }).as('getThreatNotice')
    cy.intercept('GET', '**/msb/v1/rink-msb-contracts/*/licenses', { fixture: 'msb/detail' }).as('getMsbLicenses')
    cy.intercept('PATCH', `**/msb/v1/rink-msb-contracts/${this.resourceId}/licenses`, req => {
      req.reply({
        statusCode: 202,
        body: { orderId: this.orderId, resourceId: this.resourceId, tenantId: this.tenantId },
      })
    }).as('patchMsbLicenses')
    cy.intercept('GET', '**/ztgict/v1/orders/*', { fixture: 'msb/msb-edit-order' }).as('getOrder')

    // 受付時間内の日時に固定
    cy.clock(new Date('2024-04-22T00:00:00Z'), ['Date'])
  })

  it('MSB編集 全要素変更 -> オーダー詳細', function () {
    cy.visit(`/tenants/${this.tenantId}/msb/${this.resourceId}`)
    cy.wait(['@getMsbLicenses', '@getThreatNotice'])

    // 編集画面に遷移
    cy.get('[data-cy="msb-id-index-edit-button"]').click()
    cy.wait('@getMsbLicenses')

    // お客様情報の入力
    cy.get('div[data-cy="msb-id-edit-email-address"]')
      .find('input')
      .should('have.value', '')
      .type(this.edit.emailAddress)
    cy.get('div[data-cy="msb-id-edit-customer-special-note"]')
      .find('input')
      .should('have.value', '')
      .type(this.edit.customerSpecialNote)

    // お申し込みライセンスの初期値を確認
    cy.get('[data-cy="msb-id-edit-10000license-packs"]')
      .find('input')
      .should('have.value', `${this.detail.licensePacks['10000licensePacks']}`)
    cy.get('[data-cy="msb-id-edit-1000license-packs"]')
      .find('input')
      .should('have.value', `${this.detail.licensePacks['1000licensePacks']}`)
    cy.get('[data-cy="msb-id-edit-100license-packs"]')
      .find('input')
      .should('have.value', `${this.detail.licensePacks['100licensePacks']}`)
    cy.get('[data-cy="msb-id-edit-10license-packs"]')
      .find('input')
      .should('have.value', `${this.detail.licensePacks['10licensePacks']}`)
    cy.get('[data-cy="msb-id-edit-1license-packs"]')
      .find('input')
      .should('have.value', `${this.detail.licensePacks['1licensePacks']}`)

    // お申し込みライセンスの要素数を確認
    cy.get('[data-cy="msb-id-edit-10000license-packs"]').find('li').should('have.length', 10)
    cy.get('[data-cy="msb-id-edit-1000license-packs"]').find('li').should('have.length', 9)
    cy.get('[data-cy="msb-id-edit-100license-packs"]').find('li').should('have.length', 8)
    cy.get('[data-cy="msb-id-edit-10license-packs"]').find('li').should('have.length', 9)
    cy.get('[data-cy="msb-id-edit-1license-packs"]').find('li').should('have.length', 9)

    // お申し込みライセンス情報の入力
    cy.inputSelectForm({
      selector: '[data-cy="msb-id-edit-10000license-packs"]',
      value: `${this.edit.licensePacks['10000licensePacks']}`,
    })
    cy.inputSelectForm({
      selector: '[data-cy="msb-id-edit-1000license-packs"]',
      value: `${this.edit.licensePacks['1000licensePacks']}`,
    })
    cy.inputSelectForm({
      selector: '[data-cy="msb-id-edit-100license-packs"]',
      value: `${this.edit.licensePacks['100licensePacks']}`,
    })
    cy.inputSelectForm({
      selector: '[data-cy="msb-id-edit-10license-packs"]',
      value: `${this.edit.licensePacks['10licensePacks']}`,
    })
    cy.inputSelectForm({
      selector: '[data-cy="msb-id-edit-1license-packs"]',
      value: `${this.edit.licensePacks['1licensePacks']}`,
    })

    // 確認ボタンをクリック
    cy.get('[data-cy="msb-id-edit-submit-button"]').should('have.text', t('common.confirm')).click()

    // 確認画面で入力が無効化されていることを確認
    cy.get('div[data-cy="msb-id-edit-email-address"]').find('input').should('be.disabled')
    cy.get('div[data-cy="msb-id-edit-customer-special-note"]').find('input').should('be.disabled')
    cy.get('div[data-cy="msb-id-edit-10000license-packs"]').find('input').should('be.disabled')
    cy.get('div[data-cy="msb-id-edit-1000license-packs"]').find('input').should('be.disabled')
    cy.get('div[data-cy="msb-id-edit-100license-packs"]').find('input').should('be.disabled')
    cy.get('div[data-cy="msb-id-edit-10license-packs"]').find('input').should('be.disabled')
    cy.get('div[data-cy="msb-id-edit-1license-packs"]').find('input').should('be.disabled')
    // 申し込みボタンをクリック
    cy.get('[data-cy="msb-id-edit-submit-button"]').should('have.text', t('common.application')).click()

    cy.wait('@patchMsbLicenses').then(req => {
      expect(req.request.body).to.deep.equals(this.edit)
    })

    // PATCH後は詳細画面に戻る
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/msb/${this.resourceId}`)
    cy.wait(['@getMsbLicenses', '@getThreatNotice'])

    // PATCH msb の成功メッセージを確認
    cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('message.accepted'))
    // 「オーダー詳細画面へ」ボタンを押下
    cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
    cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.moveToOrderDetail')).click()
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/orders/${this.orderId}`)
    cy.wait('@getOrder')
    cy.get('.dialog-main').should('not.exist')

    // オーダー詳細画面の戻るボタンを押してMSB詳細画面に戻る
    cy.get('[data-cy="orders-id-index-return-button"]').should('have.text', t('common.return')).click()
    cy.wait(['@getMsbLicenses', '@getThreatNotice'])
    // 詳細画面に戻る
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/msb/${this.resourceId}`)
  })

  it('MSB編集 必須項目のみ編集 -> 閉じる', function () {
    cy.visit(`/tenants/${this.tenantId}/msb/${this.resourceId}`)
    cy.wait(['@getMsbLicenses', '@getThreatNotice'])

    // 編集画面に遷移
    cy.get('[data-cy="msb-id-index-edit-button"]').click()
    cy.wait('@getMsbLicenses')

    // メールアドレスの入力
    cy.get('div[data-cy="msb-id-edit-email-address"]').find('input').type(this.edit.emailAddress)

    // お申し込みライセンス情報の入力
    cy.inputSelectForm({
      selector: '[data-cy="msb-id-edit-10000license-packs"]',
      value: `${this.edit.licensePacks['10000licensePacks']}`,
    })
    cy.inputSelectForm({
      selector: '[data-cy="msb-id-edit-1000license-packs"]',
      value: `${this.edit.licensePacks['1000licensePacks']}`,
    })
    cy.inputSelectForm({
      selector: '[data-cy="msb-id-edit-100license-packs"]',
      value: `${this.edit.licensePacks['100licensePacks']}`,
    })
    cy.inputSelectForm({
      selector: '[data-cy="msb-id-edit-10license-packs"]',
      value: `${this.edit.licensePacks['10licensePacks']}`,
    })
    cy.inputSelectForm({
      selector: '[data-cy="msb-id-edit-1license-packs"]',
      value: `${this.edit.licensePacks['1licensePacks']}`,
    })

    // 確認ボタンをクリック
    cy.get('[data-cy="msb-id-edit-submit-button"]').should('have.text', t('common.confirm')).click()

    // 申し込みボタンをクリック
    cy.get('[data-cy="msb-id-edit-submit-button"]').should('have.text', t('common.application')).click()

    cy.wait('@patchMsbLicenses').then(req => {
      // customerSpecialNote はリクエストに含まれない
      expect(req.request.body).to.deep.equals({
        emailAddress: this.edit.emailAddress,
        licensePacks: this.edit.licensePacks,
      })
    })

    // PATCH後は詳細画面に戻る
    cy.wait(['@getMsbLicenses', '@getThreatNotice'])
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/msb/${this.resourceId}`)

    // PATCH msb の成功メッセージを確認
    cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('message.accepted'))
    cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
    cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.moveToOrderDetail'))
    // ダイアログの閉じるボタンを押す
    cy.get('.dialog-card-close').click()
    cy.get('[data-cy="notification-dialog-text"]').should('not.exist')
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/msb/${this.resourceId}`)
  })

  it('MSB編集 メール未入力でライセンス変更 -> 確認ボタン非活性', function () {
    cy.visit(`/tenants/${this.tenantId}/msb/${this.resourceId}`)
    cy.wait(['@getMsbLicenses', '@getThreatNotice'])

    // 編集画面に遷移
    cy.get('[data-cy="msb-id-index-edit-button"]').click()
    cy.wait('@getMsbLicenses')

    // メールアドレスが未入力であることを確認
    cy.get('div[data-cy="msb-id-edit-email-address"]').find('input').should('have.value', '')

    // お申し込みライセンス情報のみ変更
    cy.inputSelectForm({
      selector: '[data-cy="msb-id-edit-10000license-packs"]',
      value: `${this.edit.licensePacks['10000licensePacks']}`,
    })
    cy.inputSelectForm({
      selector: '[data-cy="msb-id-edit-1000license-packs"]',
      value: `${this.edit.licensePacks['1000licensePacks']}`,
    })
    cy.inputSelectForm({
      selector: '[data-cy="msb-id-edit-100license-packs"]',
      value: `${this.edit.licensePacks['100licensePacks']}`,
    })
    cy.inputSelectForm({
      selector: '[data-cy="msb-id-edit-10license-packs"]',
      value: `${this.edit.licensePacks['10licensePacks']}`,
    })
    cy.inputSelectForm({
      selector: '[data-cy="msb-id-edit-1license-packs"]',
      value: `${this.edit.licensePacks['1licensePacks']}`,
    })

    // メールアドレス未入力のため確認ボタンは押下不可
    cy.get('[data-cy="msb-id-edit-submit-button"]').should('have.text', t('common.confirm')).and('be.disabled')
  })

  it('MSB編集 お申し込みライセンス全て0 -> エラーメッセージ表示', function () {
    cy.visit(`/tenants/${this.tenantId}/msb/${this.resourceId}`)
    cy.wait(['@getMsbLicenses', '@getThreatNotice'])

    // 編集画面に遷移
    cy.get('[data-cy="msb-id-index-edit-button"]').click()
    cy.wait('@getMsbLicenses')

    // お客様情報の入力
    cy.get('div[data-cy="msb-id-edit-email-address"]')
      .find('input')
      .should('have.value', '')
      .type(this.edit.emailAddress)
    cy.get('div[data-cy="msb-id-edit-customer-special-note"]')
      .find('input')
      .should('have.value', '')
      .type(this.edit.customerSpecialNote)

    // エラーメッセージが表示されないことを確認
    cy.get('[data-cy="msb-id-edit-no-license-pack"]').should('not.exist')

    // お申し込みライセンス数を全て0にした場合、エラーメッセージが表示されることを確認
    cy.inputSelectForm({
      selector: '[data-cy="msb-id-edit-10000license-packs"]',
      value: '0',
    })
    cy.inputSelectForm({
      selector: '[data-cy="msb-id-edit-1000license-packs"]',
      value: '0',
    })
    cy.inputSelectForm({
      selector: '[data-cy="msb-id-edit-100license-packs"]',
      value: '0',
    })
    cy.inputSelectForm({
      selector: '[data-cy="msb-id-edit-10license-packs"]',
      value: '0',
    })
    cy.inputSelectForm({
      selector: '[data-cy="msb-id-edit-1license-packs"]',
      value: '0',
    })
    cy.get('[data-cy="msb-id-edit-no-license-pack"]').should('exist')
    // お申し込みライセンス数を全て0で申し込みボタンを押せないことを確認
    cy.get('[data-cy="msb-id-edit-submit-button"]').should('have.text', t('common.confirm')).and('be.disabled')
  })
})
