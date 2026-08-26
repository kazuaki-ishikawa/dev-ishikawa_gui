import dayjs from 'dayjs'
import { generateRandomHex, t, OUTSIDE_APPLICATION_RESTRICTION_AT } from '@cypress/support/utils'

const diversionDate = dayjs(OUTSIDE_APPLICATION_RESTRICTION_AT).add(3, 'days').format('YYYY-MM-DD')

describe('フレッツ別契約の転用テスト', () => {
  beforeEach(function () {
    // 期間限定の申込規制の影響を受けないよう規制期間外の日時に固定する(規制終了後に削除する)
    cy.clock(new Date(OUTSIDE_APPLICATION_RESTRICTION_AT), ['Date'])
    this.tenantId = generateRandomHex(32)
    this.ipoeId = generateRandomHex(32)
    this.orderId = generateRandomHex(32)

    // 詳細画面用
    cy.intercept('GET', '**/ztgict/v1/settings/contractor', { fixture: 'contractor/detail' }).as('getContractor')
    cy.intercept('GET', '**/ztgict/v1/ipoe/hikari-collabo-util/available', { body: { available: true } }).as(
      'getAvailable',
    )
    // 一覧画面用
    cy.intercept('GET', '**/ztgict/v1/ipoe*', { fixture: 'ipoes/list' }).as('getIpoeList')
    cy.intercept('GET', '**/ztgict/v1/resource-summary/ipoe*', { fixture: 'ipoes/summary-list' }).as(
      'getIpoeSummaryList',
    )
    // 転用画面用
    cy.intercept('PUT', `**/ztgict/v1/ipoe/hikari-collabo-util/${this.ipoeId}/diversion`, {
      body: { orderId: this.orderId },
    }).as('putDiversion')
    cy.intercept('GET', `**/ztgict/v1/ipoe?ipoeId=${this.ipoeId}&limit=1`, {
      body: { ipoes: [{ ref: `/v1/ipoe/separate-contract/${this.ipoeId}` }] },
    }).as('getIpoeContractType')
    cy.intercept('GET', '**/ztgict/v1/ipoe/separate-contract/*', { fixture: 'ipoes/flets-separate/detail' }).as(
      'getFletsSeparate',
    )
  })

  it('転用実行(corporation) -> オーダー詳細', function () {
    // オーダー画面用
    cy.fixture('orders/ipoe-diversion-processing.json').then(body => {
      cy.intercept('GET', `**/ztgict/v1/ipoe?ipoeId=${body.resourceId}&limit=1`, {
        body: { ipoes: [{ ref: `/v1/ipoe/hikari-collabo/${body.resourceId}` }] },
      }).as('getOrderIpoeContractType')
      cy.intercept('GET', `**/ztgict/v1/ipoe/hikari-collabo/${body.resourceId}`, {}).as('getHikariCollabo')
      cy.intercept('GET', `**/ztgict/v1/orders/${this.orderId}`, { body }).as('getOrder')
    })

    // 転用判定
    // diversionShortestDate に設定された日を diversionDate に指定可能なことを確認する
    cy.fixture('ipoes/flets-separate/judge-result-true.json').then(body => {
      cy.intercept('POST', `**/ztgict/v1/ipoe/hikari-collabo-util/${this.ipoeId}/diversion/judge`, {
        body: { ...body, diversionCheckResult: { result: true, diversionShortestDate: diversionDate } },
      }).as('postDiversionJudge')
    })

    cy.fixture('ipoes/flets-separate/diversion.json').then(({ corporation }) => {
      // 詳細画面表示
      cy.visit(`/tenants/${this.tenantId}/ipoes/${this.ipoeId}`)
      cy.wait(['@getContractor', '@getAvailable', '@getIpoeContractType', '@getFletsSeparate'])

      // 画面遷移
      cy.get('[data-cy="ipoes-id-index-diversion-button"]').click()

      // ボタン確認
      cy.get('[data-cy="ipoes-id-diversion-submit-button"]')
        .as('submitButton')
        .should('have.text', t('ipoes.judgeButtonLabel'))
        .should('be.disabled')
      cy.get('[data-cy="ipoes-id-diversion-cancel-button"]').as('cancelButton').should('have.text', t('common.return'))

      // 入力
      cy.get('[data-cy="ipoes-id-diversion-diversion-number"]')
        .as('diversionNumberInputForm')
        .find('input')
        .type(corporation.diversionNumber)
      cy.get('[data-cy="ipoes-id-diversion-contract-type"]')
        .as('contractTypeRadioForm')
        .find('.radio.checked')
        .should('have.length', 0)
      cy.get('@contractTypeRadioForm').find(`.label.${corporation.contractInfo.contractType}`).click()
      cy.get('[data-cy="ipoes-id-diversion-contractor-name"]')
        .as('contractorNameInputForm')
        .find('input')
        .type(corporation.contractInfo.contractorName)
      cy.get('[data-cy="ipoes-id-diversion-contractor-name-kana"]')
        .as('contractorNameKanaInputForm')
        .find('input')
        .type(corporation.contractInfo.contractorNameKana)

      // 転用承諾番号の確認
      cy.get('@submitButton').click()
      cy.wait('@postDiversionJudge').then(req => {
        expect(req.request.body).to.deep.equals(corporation)
      })

      // 日付入力画面
      cy.get('@submitButton').should('have.text', t('common.confirm')).should('be.disabled')
      cy.get('@cancelButton').should('have.text', t('common.return'))
      cy.get('@diversionNumberInputForm').should('not.exist')
      cy.get('@contractTypeRadioForm').should('not.exist')
      cy.get('@contractorNameInputForm').should('not.exist')
      cy.get('@contractorNameKanaInputForm').should('not.exist')
      // 日付入力
      cy.get('[data-cy="ipoes-id-diversion-diversion-date"]').as('diversionDatePicker').should('have.value', '')
      cy.inputDatePicker({
        className: '@diversionDatePicker',
        date: diversionDate,
      })
      cy.get('@submitButton').should('not.be.disabled')

      // 一旦戻る
      cy.get('@cancelButton').click()
      cy.get('@diversionNumberInputForm').find('input').should('have.value', corporation.diversionNumber)
      cy.get('@contractTypeRadioForm')
        .find('.radio.checked')
        .find(`.label.${corporation.contractInfo.contractType}`)
        .should('have.length', 1)
      cy.get('@contractorNameInputForm').find('input').should('have.value', corporation.contractInfo.contractorName)
      cy.get('@contractorNameKanaInputForm')
        .find('input')
        .should('have.value', corporation.contractInfo.contractorNameKana)

      // 転用承諾番号の確認
      cy.get('@submitButton').click()
      cy.wait('@postDiversionJudge').then(req => {
        expect(req.request.body).to.deep.equals(corporation)
      })
      // 日付入力
      cy.get('@diversionDatePicker').should('have.value', '')
      cy.inputDatePicker({
        className: '@diversionDatePicker',
        date: diversionDate,
      })

      // 確認ボタン押下
      cy.get('@submitButton').should('have.text', t('common.confirm')).click()
      // 確認画面
      cy.get('@submitButton').should('have.text', t('common.save')).should('not.be.disabled')
      cy.get('@cancelButton').should('have.text', t('common.return'))
      cy.get('@diversionNumberInputForm').should('not.exist')
      cy.get('@contractTypeRadioForm').should('not.exist')
      cy.get('@contractorNameInputForm').should('not.exist')
      cy.get('@contractorNameKanaInputForm').should('not.exist')
      cy.get('@diversionDatePicker')
        .find('input')
        .should('have.value', diversionDate.replaceAll('-', '/'))
        .should('be.disabled')

      // 保存ボタン押下
      cy.get('@submitButton').click()
      cy.wait('@putDiversion').then(req => {
        expect(req.request.body).to.deep.equals({
          ...corporation,
          diversionDate: diversionDate.replaceAll('/', '-'),
        })
      })

      // 一覧画面に遷移する
      cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/ipoes`)
      cy.wait(['@getIpoeList', '@getIpoeSummaryList'])

      // 成功メッセージを確認
      cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('message.accepted'))
      cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
      cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.moveToOrderDetail')).click()
      cy.get('[data-cy="notification-dialog-text"]').should('not.exist')

      // オーダー詳細画面に遷移する
      cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/orders/${this.orderId}`)
      cy.wait(['@getOrder', '@getOrderIpoeContractType', '@getHikariCollabo'])

      // オーダー詳細画面の戻るボタンを押して一覧画面に戻る
      cy.get('[data-cy="orders-id-index-return-button"]').click()
      // 一覧画面に戻る
      cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/ipoes`)
      cy.wait(['@getIpoeList', '@getIpoeSummaryList'])
    })
  })

  it('判定エラー後に転用実行(individual) -> 閉じる', function () {
    cy.fixture('ipoes/flets-separate/diversion.json').then(({ individual }) => {
      cy.intercept('POST', `**/ztgict/v1/ipoe/hikari-collabo-util/${this.ipoeId}/diversion/judge`, {
        fixture: 'ipoes/flets-separate/judge-result-false',
      }).as('postDiversionJudge')

      cy.visit(`/tenants/${this.tenantId}/ipoes/${this.ipoeId}`)
      cy.wait(['@getContractor', '@getAvailable', '@getIpoeContractType', '@getFletsSeparate'])

      // 画面遷移
      cy.get('[data-cy="ipoes-id-index-diversion-button"]').click()

      // エイリアス
      cy.get('[data-cy="ipoes-id-diversion-submit-button"]').as('submitButton')
      cy.get('[data-cy="ipoes-id-diversion-cancel-button"]').as('cancelButton')
      // 入力
      cy.get('[data-cy="ipoes-id-diversion-diversion-number"]')
        .as('diversionNumberInputForm')
        .find('input')
        .type(individual.diversionNumber)
      cy.get('[data-cy="ipoes-id-diversion-contract-type"]')
        .as('contractTypeRadioForm')
        .find('.radio.checked')
        .should('have.length', 0)
      cy.get('@contractTypeRadioForm').find(`.label.${individual.contractInfo.contractType}`).click()
      cy.get('[data-cy="ipoes-id-diversion-contractor-name"]')
        .as('contractorNameInputForm')
        .find('input')
        .type(individual.contractInfo.contractorName)
      cy.get('[data-cy="ipoes-id-diversion-contractor-name-kana"]')
        .as('contractorNameKanaInputForm')
        .find('input')
        .type(individual.contractInfo.contractorNameKana)

      // 転用承諾番号の確認
      cy.get('@submitButton').click()
      cy.wait('@postDiversionJudge').then(req => {
        expect(req.request.body).to.deep.equals(individual)
      })

      // URLは変わらない
      cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/ipoes/${this.ipoeId}/diversion`)

      // エラーダイアログの表示
      cy.get('[data-cy="ipoes-id-diversion-errors"]').should('have.length', 6)
      cy.get('.dialog-base-cancel-button').should('have.text', t('common.close')).click()

      // intercept を更新
      cy.intercept('POST', `**/ztgict/v1/ipoe/hikari-collabo-util/${this.ipoeId}/diversion/judge`, {
        fixture: 'ipoes/flets-separate/judge-result-true',
      }).as('postDiversionJudge')

      // 転用承諾番号の確認
      cy.get('@submitButton').click()
      cy.wait('@postDiversionJudge').then(req => {
        expect(req.request.body).to.deep.equals(individual)
      })

      // 転用希望日の入力
      cy.inputDatePicker({
        className: '[data-cy="ipoes-id-diversion-diversion-date"]',
        date: diversionDate,
      })

      // 確認ボタン押下
      cy.get('@submitButton').click()
      // 保存ボタン押下
      cy.get('@submitButton').click()
      cy.wait('@putDiversion').then(req => {
        expect(req.request.body).to.deep.equals({
          ...individual,
          diversionDate,
        })
      })

      // 一覧画面に遷移する
      cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/ipoes`)
      cy.wait(['@getIpoeList', '@getIpoeSummaryList'])

      // 成功メッセージを確認
      cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('message.accepted'))
      cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
      cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.moveToOrderDetail'))

      // 閉じるボタンを押下
      cy.get('.dialog-card-close').click()
      cy.get('[data-cy="notification-dialog-text"]').should('not.exist')
      cy.url().should('eq', `${Cypress.config().baseUrl}/tenants/${this.tenantId}/ipoes`)
    })
  })

  context('転用ボタンが disabled の条件', function () {
    it('resourceStatus が inactive で orderStatus が null の時', function () {
      cy.fixture('ipoes/flets-separate/detail.json').then(body => {
        cy.intercept('GET', '**/ztgict/v1/ipoe/separate-contract/*', {
          body: { ...body, resourceStatus: 'inactive', orderStatus: null },
        }).as('getFletsSeparate')
        cy.visit(`/tenants/${this.tenantId}/ipoes/${this.ipoeId}`)
        cy.wait(['@getAvailable', '@getIpoeContractType', '@getFletsSeparate'])

        // 他のボタンも非活性
        cy.get('[data-cy="ipoes-id-index-delete-button"]').should('be.disabled')
        cy.get('[data-cy="ipoes-id-index-edit-button"]').should('be.disabled')
        // 「転用」ボタン
        cy.get('[data-cy="ipoes-id-index-diversion-button"]')
          .should('have.text', t('ipoes.diversion'))
          .should('be.disabled')
      })
    })

    it('resourceStatus が active で orderStatus が rejected の時', function () {
      cy.fixture('ipoes/flets-separate/detail.json').then(body => {
        cy.intercept('GET', '**/ztgict/v1/ipoe/separate-contract/*', {
          body: { ...body, resourceStatus: 'active', orderStatus: 'rejected' },
        }).as('getFletsSeparate')
        cy.visit(`/tenants/${this.tenantId}/ipoes/${this.ipoeId}`)
        cy.wait(['@getAvailable', '@getIpoeContractType', '@getFletsSeparate'])

        // 他のボタンも非活性
        cy.get('[data-cy="ipoes-id-index-delete-button"]').should('be.disabled')
        cy.get('[data-cy="ipoes-id-index-edit-button"]').should('be.disabled')
        // 「転用」ボタン
        cy.get('[data-cy="ipoes-id-index-diversion-button"]')
          .should('have.text', t('ipoes.diversion'))
          .should('be.disabled')
      })
    })

    it('回線プランが光クロスの時は転用ボタンが非活性', function () {
      cy.fixture('ipoes/flets-separate/detail.json').then(body => {
        cy.intercept('GET', '**/ztgict/v1/ipoe/separate-contract/*', {
          body: { ...body, hikariPlan: 'cross' },
        }).as('getFletsSeparate')
        cy.visit(`/tenants/${this.tenantId}/ipoes/${this.ipoeId}`)
        cy.wait(['@getAvailable', '@getIpoeContractType', '@getFletsSeparate'])

        // 他のボタンは押下可能
        cy.get('[data-cy="ipoes-id-index-delete-button"]').should('not.be.disabled')
        cy.get('[data-cy="ipoes-id-index-edit-button"]').should('not.be.disabled')
        // 「転用」ボタンが非活性
        cy.get('[data-cy="ipoes-id-index-diversion-button"]')
          .should('have.text', t('ipoes.diversion'))
          .should('be.disabled')
      })
    })
  })
})
