import { generateRandomHex, t } from '@cypress/support/utils'

describe('フレッツ別契約の編集テスト', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)
    this.ipoeId = generateRandomHex(32)
    this.orderId = generateRandomHex(32)

    cy.intercept('GET', '**/ztgict/v1/resource-summary/ipoe*', { fixture: 'ipoes/summary-list' }).as(
      'getSummaryIpoeList',
    )
    cy.intercept('GET', '**/ztgict/v1/settings/contractor', { fixture: 'contractor/detail' }).as('getContractor')
    cy.intercept('GET', '**/ztgict/v1/ipoe/hikari-collabo-util/available', { body: { available: true } }).as(
      'getAvailable',
    )
    cy.intercept('GET', `**/ztgict/v1/ipoe?ipoeId=${this.ipoeId}&limit=1`, {
      body: { ipoes: [{ ref: `/v1/ipoe/separate-contract/${this.ipoeId}` }] },
    }).as('getIpoeContractType')
    cy.intercept('GET', '**/ztgict/v1/ipoe/separate-contract/*', { fixture: 'ipoes/flets-separate/detail' }).as(
      'getFletsSeparate',
    )
    cy.intercept('PUT', '**/ztgict/v1/ipoe/separate-contract/*', { body: { orderId: this.orderId } }).as(
      'putFletsSeparate',
    )
    cy.intercept('GET', `**/ztgict/v1/orders/${this.orderId}`, { response: { statusCode: 200 } }).as('getOrder')
  })

  it('IPoEアクセスプランを標準に変更 -> オーダー詳細', function () {
    cy.visit(`/tenants/${this.tenantId}/ipoes/${this.ipoeId}`)
    cy.wait(['@getIpoeContractType', '@getFletsSeparate', '@getAvailable', '@getContractor'])

    // 詳細画面に回線プランが表示される
    cy.get('[data-cy="flets-separate-detail-hikari-plan"]').should('have.text', t('ipoes.next'))

    // 編集画面に遷移
    cy.get('[data-cy="ipoes-id-index-edit-button"]').click()
    cy.wait(['@getIpoeContractType', '@getFletsSeparate', '@getSummaryIpoeList', '@getAvailable', '@getContractor'])

    // 回線プランは変更できないため、表示のみ
    cy.get('[data-cy="ipoes-id-edit-hikari-plan"]').should('have.text', t('ipoes.next'))

    // フレッツ光ネクストではスーパーワイドを選択できない
    const ipoeTypeOptions = [t('ipoes.normal'), t('ipoes.wide')]
    cy.get('[data-cy="ipoes-id-edit-ipoe-type"]')
      .find('li')
      .should('have.length', ipoeTypeOptions.length)
      .each((li, index) => {
        cy.wrap(li).should('have.text', ipoeTypeOptions[index])
      })

    const edit = { customerNote: 'ipoeType is normal', ipoeType: 'normal', appControl: false }
    cy.get('[data-cy="ipoes-id-edit-customer-note"]').find('input').clear().type(edit.customerNote)
    cy.inputSelectForm({
      selector: '[data-cy="ipoes-id-edit-ipoe-type"]',
      value: t(`ipoes.${edit.ipoeType}`),
    })

    // appControl
    cy.get('[data-cy="ipoes-id-edit-app-control"]').should('not.exist')

    // 非表示項目チェック
    cy.get('[data-cy="ipoes-id-edit-on-site-repair-option"]').should('not.exist')
    cy.get('[data-cy="ipoes-id-edit-change-effective-date"]').should('not.exist')

    // 確認
    cy.get('[data-cy="ipoes-id-edit-cancel-button"]').should('have.text', t('common.cancel'))
    cy.get('[data-cy="ipoes-id-edit-submit-button"]').should('have.text', t('common.confirm')).click()
    // 作成
    cy.get('[data-cy="hikari-collabo-terms-of-service"]').should('not.exist')
    cy.get('[data-cy="ipoes-id-edit-cancel-button"]').should('have.text', t('common.return'))
    cy.get('[data-cy="ipoes-id-edit-submit-button"]').should('have.text', t('common.save')).click()

    cy.wait('@putFletsSeparate').then(req => {
      expect(req.request.url).to.include('ztgict/v1/ipoe/separate-contract')
      expect(req.request.body).to.deep.equal(edit)
    })

    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/ipoes/${this.ipoeId}`)
    cy.wait(['@getAvailable', '@getIpoeContractType', '@getFletsSeparate'])

    // PUT ipoe/separate-contract の成功メッセージを確認
    cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('message.accepted'))
    // 「オーダー詳細へ」ボタンを押してオーダー詳細画面に遷移することを確認する
    cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
    cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.moveToOrderDetail')).click()
    cy.get('[data-cy="notification-dialog-text"]').should('not.exist')

    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/orders/${this.orderId}`)
    cy.wait('@getOrder')

    // オーダー詳細画面の戻るボタンを押して詳細画面に戻る
    cy.get('[data-cy="orders-id-index-return-button"]').should('have.text', t('common.return')).click()
    // 詳細画面に戻る
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/ipoes/${this.ipoeId}`)
    cy.wait(['@getAvailable', '@getIpoeContractType', '@getFletsSeparate'])
  })

  it('IPoEアクセスプランをワイドに変更 -> 閉じる', function () {
    cy.visit(`/tenants/${this.tenantId}/ipoes/${this.ipoeId}`)
    cy.wait(['@getAvailable', '@getIpoeContractType', '@getFletsSeparate'])

    // 編集画面に遷移
    cy.get('[data-cy="ipoes-id-index-edit-button"]').click()
    cy.wait(['@getAvailable', '@getIpoeContractType', '@getFletsSeparate', '@getSummaryIpoeList'])

    const edit = { customerNote: 'ipoeType is wide', ipoeType: 'wide', appControl: true }
    cy.get('[data-cy="ipoes-id-edit-customer-note"]').find('input').clear().type(edit.customerNote)
    cy.inputSelectForm({
      selector: '[data-cy="ipoes-id-edit-ipoe-type"]',
      value: t(`ipoes.${edit.ipoeType}`),
    })

    // appControl
    cy.get('[data-cy="ipoes-id-edit-app-control"]').find(`.label.${edit.appControl}`).click()

    // 非表示項目チェック
    cy.get('[data-cy="ipoes-id-edit-on-site-repair-option"]').should('not.exist')
    cy.get('[data-cy="ipoes-id-edit-change-effective-date"]').should('not.exist')
    cy.get('[data-cy="hikari-collabo-terms-of-service"]').should('not.exist')

    // 確認ボタンクリック
    cy.get('[data-cy="ipoes-id-edit-cancel-button"]').should('have.text', t('common.cancel'))
    cy.get('[data-cy="ipoes-id-edit-submit-button"]').should('have.text', t('common.confirm')).click()

    // 保存ボタンが非活性になっていることを確認
    cy.get('[data-cy="ipoes-id-edit-cancel-button"]').should('have.text', t('common.return'))
    cy.get('[data-cy="ipoes-id-edit-submit-button"]').should('have.text', t('common.save')).should('be.disabled')
    // 利用規約の確認
    cy.get('[data-cy="hikari-collabo-terms-of-service"]')
      .should('exist')
      .scrollTo('bottom', { ensureScrollable: false })
    cy.get('[data-cy="hikari-collabo-terms-of-service-agreement"]').find('.checkbox').click()

    // 保存ボタン押下
    cy.get('[data-cy="ipoes-id-edit-submit-button"]')
      .should('have.text', t('common.save'))
      .should('not.be.disabled')
      .click()

    cy.wait('@putFletsSeparate').then(req => {
      expect(req.request.url).to.include('ztgict/v1/ipoe/separate-contract')
      expect(req.request.body).to.deep.equal(edit)
    })

    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/ipoes/${this.ipoeId}`)
    cy.wait(['@getAvailable', '@getIpoeContractType', '@getFletsSeparate'])

    // メッセージ確認
    cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('message.accepted'))
    cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
    cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.moveToOrderDetail'))
    // ダイアログの閉じるボタンを押す
    cy.get('.dialog-card-close').click()
    cy.get('[data-cy="notification-dialog-text"]').should('not.exist')
    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/ipoes/${this.ipoeId}`)
  })

  it('フレッツ光クロスはワイドプラス for Web会議を変更できる', function () {
    cy.fixture('ipoes/flets-separate/detail.json').then(data => {
      cy.intercept('GET', '**/ztgict/v1/ipoe/separate-contract/*', {
        body: { ...data, hikariPlan: 'cross', ipoeType: 'superWide' },
      }).as('getFletsSeparate')
    })

    cy.visit(`/tenants/${this.tenantId}/ipoes/${this.ipoeId}`)
    cy.wait(['@getIpoeContractType', '@getFletsSeparate', '@getAvailable', '@getContractor'])

    // 詳細画面ではスーパーワイドでもワイドプラス for Web会議が表示される
    cy.get('[data-cy="flets-separate-detail-hikari-plan"]').should('have.text', t('ipoes.cross'))
    cy.get('[data-cy="flets-separate-detail-ipoe-type"]').should('have.text', t('ipoes.superWide'))
    cy.get('[data-cy="flets-separate-detail-app-control"]').should('have.text', t('common.nonExist'))

    // 編集画面に遷移
    cy.get('[data-cy="ipoes-id-index-edit-button"]').click()
    cy.wait(['@getIpoeContractType', '@getFletsSeparate', '@getSummaryIpoeList', '@getAvailable', '@getContractor'])

    cy.get('[data-cy="ipoes-id-edit-hikari-plan"]').should('have.text', t('ipoes.cross'))

    // IPoEアクセスプランは表示のみ、ワイドプラス for Web会議は変更できる
    cy.get('[data-cy="ipoes-id-edit-ipoe-type"]').should('not.exist')
    cy.get('[data-cy="ipoes-id-edit-ipoe-type-text"]').should('have.text', t('ipoes.superWide'))
    cy.get('[data-cy="ipoes-id-edit-app-control"]').find('.label.true').click()

    const edit = { customerNote: '東京本社A館フレッツ光クロス', appControl: true }
    cy.get('[data-cy="ipoes-id-edit-customer-note"]').find('input').clear().type(edit.customerNote)

    // 確認
    cy.get('[data-cy="ipoes-id-edit-submit-button"]').should('have.text', t('common.confirm')).click()

    // 標準プランからの変更ではないため規約同意は不要
    cy.get('[data-cy="hikari-collabo-terms-of-service"]').should('not.exist')
    cy.get('[data-cy="ipoes-id-edit-submit-button"]').should('have.text', t('common.save')).click()

    // IPoEアクセスプランは送信せず、ワイドプラス for Web会議は送信する
    cy.wait('@putFletsSeparate').then(req => {
      expect(req.request.url).to.include('ztgict/v1/ipoe/separate-contract')
      expect(req.request.body).to.deep.equal(edit)
    })

    cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/ipoes/${this.ipoeId}`)
    cy.wait(['@getAvailable', '@getIpoeContractType', '@getFletsSeparate'])
  })
})
