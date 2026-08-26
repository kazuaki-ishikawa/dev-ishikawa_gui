import { generateRandomHex, t } from '@cypress/support/utils'

describe('msb create', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)

    cy.fixture('msb/create.json').then(create => {
      this.createData = create
    })

    cy.intercept('GET', '**/msb/v1/rink-msb-contracts', { statusCode: 404, body: {} }).as('getMsb')
    cy.intercept('GET', '**/msb/v1/threat-notice', { statusCode: 404, body: {} }).as('getThreatNotice')
    cy.intercept('GET', '**/ztgict/v1/settings/contractor', { fixture: 'contractor/detail' }).as('getContractor')
    cy.intercept('POST', '**/msb/v1/rink-msb-contracts', { fixture: 'msb/create' }).as('postMsb')
    cy.intercept('GET', '**/ztgict/v1/orders/*', { fixture: 'msb/msb-create-order' }).as('getOrder')

    // 受付時間内の日時に固定
    cy.clock(new Date('2024-04-22T00:00:00Z'), ['Date'])
  })

  it('MSB新規作成 -> オーダー詳細', function () {
    cy.visit(`/tenants/${this.tenantId}/msb`)
    cy.wait(['@getMsb', '@getThreatNotice'])

    // MSBが存在しない時、urlが変わらないことを確認
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/msb`)

    // 新規申し込みボタンをクリック
    cy.get('[data-cy="msb-index-new-application-button"]').click()
    cy.wait('@getContractor')

    // お客様情報の入力
    cy.get('div[data-cy="msb-create-department-name"]').find('input').type(this.createData.departmentName)
    cy.get('[data-cy="msb-create-customer-type"]')
      .find('.radio.checked')
      .find(`.label.${this.createData.customerType}`)
      .click()
    cy.get('div[data-cy="msb-create-email-address"]').find('input').type(this.createData.emailAddress)
    cy.get('div[data-cy="msb-create-customer-special-note"]').find('input').type(this.createData.customerSpecialNote)

    // お申し込みライセンス数が全て0の場合、エラーメッセージが表示されること、申し込みボタンが押せないことを確認
    cy.get('[data-cy="msb-create-no-license-pack"]').should('exist')
    cy.get('[data-cy="msb-create-submit-button"]').should('have.text', t('common.confirm')).and('be.disabled')

    // お申し込みライセンスの要素数を確認
    cy.get('[data-cy="msb-create-10000license-packs"]').find('li').should('have.length', 10)
    cy.get('[data-cy="msb-create-1000license-packs"]').find('li').should('have.length', 9)
    cy.get('[data-cy="msb-create-100license-packs"]').find('li').should('have.length', 8)
    cy.get('[data-cy="msb-create-10license-packs"]').find('li').should('have.length', 9)
    cy.get('[data-cy="msb-create-1license-packs"]').find('li').should('have.length', 9)

    // お申し込みライセンス情報の入力
    cy.inputSelectForm({
      selector: '[data-cy="msb-create-10000license-packs"]',
      value: `${this.createData.licensePacks['10000licensePacks']}`,
    })
    cy.inputSelectForm({
      selector: '[data-cy="msb-create-1000license-packs"]',
      value: `${this.createData.licensePacks['1000licensePacks']}`,
    })
    cy.inputSelectForm({
      selector: '[data-cy="msb-create-100license-packs"]',
      value: `${this.createData.licensePacks['100licensePacks']}`,
    })
    cy.inputSelectForm({
      selector: '[data-cy="msb-create-10license-packs"]',
      value: `${this.createData.licensePacks['10licensePacks']}`,
    })
    cy.inputSelectForm({
      selector: '[data-cy="msb-create-1license-packs"]',
      value: `${this.createData.licensePacks['1licensePacks']}`,
    })

    // お申し込みライセンス入力後はエラーメッセージが表示されないことを確認
    cy.get('[data-cy="msb-create-no-license-pack"]').should('not.exist')

    // 確認ボタンをクリック
    cy.get('[data-cy="msb-create-submit-button"]').should('have.text', t('common.confirm')).click()

    // 確認画面で入力が無効化されていることを確認
    cy.get('div[data-cy="msb-create-department-name"]').find('input').should('be.disabled')
    cy.get('div[data-cy="msb-create-customer-type"]').find('.radio').should('have.class', 'disabled')
    cy.get('div[data-cy="msb-create-email-address"]').find('input').should('be.disabled')
    cy.get('div[data-cy="msb-create-customer-special-note"]').find('input').should('be.disabled')
    cy.get('div[data-cy="msb-create-10000license-packs"]').find('input').should('be.disabled')
    cy.get('div[data-cy="msb-create-1000license-packs"]').find('input').should('be.disabled')
    cy.get('div[data-cy="msb-create-100license-packs"]').find('input').should('be.disabled')
    cy.get('div[data-cy="msb-create-10license-packs"]').find('input').should('be.disabled')
    cy.get('div[data-cy="msb-create-1license-packs"]').find('input').should('be.disabled')

    // 新規作成
    cy.get('[data-cy="msb-create-submit-button"]').should('have.text', t('common.create')).click()

    const expectedRequest = (({ tenantId, resourceId, orderId, ...rest }) => ({ ...rest }))(this.createData)
    cy.wait('@postMsb').then(req => {
      expect(req.request.body).to.deep.equals(expectedRequest)
    })

    // POST後は詳細画面に戻る
    cy.wait(['@getMsb', '@getThreatNotice'])
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/msb`)

    // POST msb の成功メッセージを確認
    cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('message.accepted'))
    // 「オーダー詳細画面へ」ボタンを押下
    cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
    cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.moveToOrderDetail')).click()
    cy.get('[data-cy="notification-dialog-text"]').should('not.exist')

    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/orders/${this.createData.orderId}`)
    cy.wait('@getOrder')

    // オーダー詳細画面の戻るボタンを押してMSB一覧画面に戻る
    cy.get('[data-cy="orders-id-index-return-button"]').should('have.text', t('common.return')).click()
    cy.wait(['@getMsb', '@getThreatNotice'])
    // 一覧画面に戻る
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/msb`)
  })
})
