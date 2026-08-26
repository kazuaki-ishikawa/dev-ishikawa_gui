import dayjs from 'dayjs'
import { RinkConnectionTypes } from '@app/api/rinkConnections/constants'
import type { RinkConnectionResponse, RinkConnectionType } from '@app/api/rinkConnections/types'
import { generateRandomHex, t, getScheduleNetworks } from '@cypress/support/utils'

const RINK_MOBILE_ID = 'Z000000002'
const LINE_COUNT = 3
const scheduleNetworks = getScheduleNetworks()

const rinkConnectionTypeTranslation: Record<RinkConnectionType, string> = {
  [RinkConnectionTypes.InternetOnly]: t('rinkConnections.internetOnly'),
  [RinkConnectionTypes.InternetVpn]: t('rinkConnections.internetVpn'),
  [RinkConnectionTypes.VpnOnly]: t('rinkConnections.vpnOnly'),
  [RinkConnectionTypes.VpnBreakOut]: t('rinkConnections.vpnBreakOut'),
}

const assertInitialization = (rinkConnection: RinkConnectionResponse) => {
  // ボタン初期値の確認
  cy.get('[data-cy="rink-mobile-connections-remove-submit-button"]').should('be.disabled')

  // 設備廃止不可メッセージ非表示確認
  cy.get('[data-cy="rink-mobile-connections-remove-line-remove-confirm"]').should('not.exist')

  // 共通項目の確認
  cy.get('[data-cy="rink-connection-detail-connection-type"]').should(
    'have.text',
    rinkConnectionTypeTranslation[rinkConnection.connectionType],
  )
  cy.get('[data-cy="rink-connection-detail-dns-ip-address-primary"]').should(
    'have.text',
    rinkConnection.dnsIpAddressPrimary,
  )
  cy.get('[data-cy="rink-connection-detail-dns-ip-address-secondary"]').should(
    'have.text',
    rinkConnection.dnsIpAddressSecondary ?? '',
  )
  cy.get('[data-cy="rink-connection-detail-auth-domain-name"]').should('have.text', rinkConnection.authDomainName ?? '')
  cy.get('[data-cy="rink-connection-detail-apn"]').should('have.text', rinkConnection.apn)
  cy.get('[data-cy="rink-connection-detail-poi-redundancy"]').should(
    'have.text',
    rinkConnection.poiRedundancy ? t('common.use') : t('common.disuse'),
  )
  cy.get('[data-cy="rink-connection-detail-line-act-prefix"]')
    .find('div')
    .should('have.length', rinkConnection.lineActPrefix.length)
    .each(($el, index) => {
      cy.wrap($el).should('have.text', rinkConnection.lineActPrefix[index])
    })
  if (rinkConnection.poiRedundancy) {
    cy.get('[data-cy="rink-connection-detail-line-sby-prefix"]')
      .find('div')
      .should('have.length', rinkConnection.lineSbyPrefix?.length ?? 0)
      .each(($el, index) => {
        cy.wrap($el).should('have.text', rinkConnection.lineSbyPrefix?.[index] ?? '')
      })
  } else {
    cy.get('[data-cy="rink-connection-detail-line-sby-prefix"]').should('not.exist')
  }
  cy.get('[data-cy="rink-connection-detail-created-at"]').should(
    'have.text',
    dayjs(rinkConnection.createdAt).format('YYYY/MM/DD HH:mm:ss'),
  )

  // 構成パターンごとの表示項目確認
  if (rinkConnection.connectionType !== RinkConnectionTypes.InternetOnly) {
    cy.get('[data-cy="rink-connection-detail-vpn-id"]').should('have.text', rinkConnection.vpnId)
    cy.get('[data-cy="rink-connection-detail-vpn-network-prefix"]').should('have.text', rinkConnection.vpnNetworkPrefix)
  } else {
    // 「1 インターネット通信利用」での非表示項目
    cy.get('[data-cy="rink-connection-detail-vpn-id"]').should('not.exist')
    cy.get('[data-cy="rink-connection-detail-vpn-network-prefix"]').should('not.exist')
  }

  if (rinkConnection.connectionType !== RinkConnectionTypes.VpnBreakOut) {
    cy.get('[data-cy="rink-connection-detail-break-out"]').should('not.exist')
    cy.get('[data-cy="custom-local-break-out-list-table"]').should('not.exist')
  }

  if (rinkConnection.connectionType === RinkConnectionTypes.InternetVpn) {
    // 「2 インターネット通信利用+VPN通信利用」での表示項目確認
    cy.get('[data-cy="rink-connection-detail-vpn-connection-prefix"]')
      .find('div')
      .should('have.length', rinkConnection.vpnConnectionPrefix?.length ?? 0)
      .each(($el, index) => {
        cy.wrap($el).should('have.text', rinkConnection.vpnConnectionPrefix?.[index])
      })
  } else {
    cy.get('[data-cy="rink-connection-detail-vpn-connection-prefix"]').should('not.exist')
  }
}

describe('設備廃止テスト', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)

    cy.intercept('GET', '**/rink-mobile/v1/tenants/*/rink-connections/self-only', {
      fixture: 'rink-mobile/connections/list',
    }).as('getRinkConnectionList')

    cy.intercept('GET', `**/rink-mobile/v1/tenants/*/line-groups/self-add/${RINK_MOBILE_ID}`, {
      fixture: 'rink-mobile/line-groups/list',
    }).as('getRinkLineGroupList')

    cy.intercept('GET', '**/ztgict/v1/resource-summary/vpns', { fixture: 'vpns/list' }).as('getSummaryVpnList')
    cy.intercept('GET', '**/rink-mobile/v1/tenants/*/available-line-prefix/self-only', {
      fixture: 'rink-mobile/connections/available-line-prefix',
    }).as('getAvailableLinePrefix')
    cy.intercept(
      'GET',
      '**/rink-mobile/v1/tenants/*/schedule-network/self-only?orderType=delete-network-rinkConnection',
      {
        body: { scheduleNetworks },
      },
    ).as('getScheduleNetworks')

    cy.intercept('DELETE', `**/rink-mobile/v1/tenants/*/rink-connections/self-add/${RINK_MOBILE_ID}`, {
      body: { id: generateRandomHex(32) },
    }).as('deleteRinkConnection')

    cy.intercept('GET', `**/rink-mobile/v1/tenants/*/rink-connections/local-breakout-list/${RINK_MOBILE_ID}`, {
      fixture: 'rink-mobile/connections/local-breakout-list',
    }).as('getLocalBreakoutList')
  })

  context('設備廃止', function () {
    beforeEach(function () {
      // 受付時間内に設定
      cy.clock(new Date(new Date().setHours(0, 0, 0, 0)), ['Date'])

      cy.intercept('GET', `**/rink-mobile/v1/tenants/*/lines/self-add/${RINK_MOBILE_ID}?*`, {
        total: 0,
        lineList: [],
      }).as('getLineList')

      // 設備申込画面に遷移
      cy.visit(`/tenants/${this.tenantId}/rink-mobile/connections`)
      // 廃止ボタンを押下
      cy.get('[data-cy="rink-mobile-connections-index-remove-button"]').click()
      cy.wait(['@getScheduleNetworks', '@getRinkConnectionList'])

      // 時間外メッセージ非表示確認
      cy.get('[data-cy="rink-mobile-connections-remove-outside-reception-hour"]').should('not.exist')
      // モバイルアクセスID選択まで詳細情報は非表示
      cy.get('[data-cy="rink-mobile-connections-remove-detail"]').should('not.exist')
    })

    it('1　インターネット通信利用', function () {
      cy.fixture(`rink-mobile/connections/detail-${RinkConnectionTypes.InternetOnly}`).then(original => {
        cy.intercept('GET', `**/rink-mobile/v1/tenants/*/rink-connections/self-add/${RINK_MOBILE_ID}`, {
          body: original,
        }).as('getRinkConnection')

        // モバイルアクセスIDを選択
        cy.inputSelectForm({
          selector: '[data-cy="rink-mobile-connections-remove-rink-mobile-id"]',
          value: RINK_MOBILE_ID,
        })
        cy.wait(['@getRinkConnection', '@getLineList'])

        // 表示/非表示項目の確認
        assertInitialization(original)

        // 当日の時間枠は選択できないことを確認
        expect(dayjs(scheduleNetworks[0]).isSame(scheduleNetworks[1], 'day')).to.equal(true)
        cy.get('[data-cy="rink-mobile-connections-remove-time-frame"]').find('input').click()
        cy.get(`[data-test-id="dp-${dayjs(scheduleNetworks[0]).format('YYYY-MM-DD')}"]`)
          .find('.dp--cell-inner')
          .should('have.class', 'dp--cell-disabled')
        cy.get('body').type('{esc}')

        // 廃止希望日を選択
        cy.inputDatePicker({
          className: '[data-cy="rink-mobile-connections-remove-time-frame"]',
          date: scheduleNetworks[2],
        })

        // 確認ボタンを押下
        cy.get('[data-cy="rink-mobile-connections-remove-submit-button"]')
          .should('have.text', t('common.confirm'))
          .click()
        // 廃止申し込みボタンを押下
        cy.get('[data-cy="rink-mobile-connections-remove-submit-button"]')
          .should('have.text', t('common.abolition'))
          .click()

        cy.wait('@deleteRinkConnection').then(req => {
          expect(req.request.body).to.deep.equal({
            timeFrame: scheduleNetworks[2],
          })
        })

        // 完了ダイアログ
        cy.url().should('include', `/tenants/${this.tenantId}/rink-mobile/connections`)
        cy.get('[data-cy="notification-dialog-text"]').should('contain', t('message.finished'))
        cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
        cy.get('[data-cy="notification-dialog-submit-button"]')
          .should('have.text', t('rinkConnections.moveToTop'))
          .click()
        cy.get('[data-cy="notification-dialog-text"]').should('not.exist')
        // 契約一覧画面に遷移する
        cy.wait(['@getRinkConnectionList'])
        cy.url().should('include', `/tenants/${this.tenantId}/rink-mobile/contracts`)
      })
    })

    it('2　インターネット通信利用+VPN通信利用', function () {
      cy.fixture(`rink-mobile/connections/detail-${RinkConnectionTypes.InternetVpn}`).then(original => {
        cy.intercept('GET', `**/rink-mobile/v1/tenants/*/rink-connections/self-add/${RINK_MOBILE_ID}`, {
          body: original,
        }).as('getRinkConnection')

        // モバイルアクセスIDを選択
        cy.inputSelectForm({
          selector: '[data-cy="rink-mobile-connections-remove-rink-mobile-id"]',
          value: RINK_MOBILE_ID,
        })
        cy.wait(['@getRinkConnection', '@getLineList'])

        // 表示項目の確認
        assertInitialization(original)

        // 廃止希望日を選択
        cy.inputDatePicker({
          className: '[data-cy="rink-mobile-connections-remove-time-frame"]',
          date: scheduleNetworks[2],
        })

        // 確認ボタンを押下
        cy.get('[data-cy="rink-mobile-connections-remove-submit-button"]')
          .should('have.text', t('common.confirm'))
          .click()
        // 廃止申し込みボタンを押下
        cy.get('[data-cy="rink-mobile-connections-remove-submit-button"]')
          .should('have.text', t('common.abolition'))
          .click()

        cy.wait('@deleteRinkConnection').then(req => {
          expect(req.request.body).to.deep.equal({
            timeFrame: scheduleNetworks[2],
          })
        })

        // 完了ダイアログ
        cy.url().should('include', `/tenants/${this.tenantId}/rink-mobile/connections`)
        cy.get('[data-cy="notification-dialog-text"]').should('contain', t('message.finished'))
        cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
        cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('rinkConnections.moveToTop'))
        // 閉じるボタンを押下する
        cy.get('.dialog-card-close').should('have.text', t('common.close')).click()
        cy.get('[data-cy="notification-dialog-text"]').should('not.exist')
        // 画面遷移なし
        cy.url().should('include', `/tenants/${this.tenantId}/rink-mobile/connections`)
      })
    })

    it('3　VPN通信利用', function () {
      cy.fixture(`rink-mobile/connections/detail-${RinkConnectionTypes.VpnOnly}`).then(original => {
        cy.intercept('GET', `**/rink-mobile/v1/tenants/*/rink-connections/self-add/${RINK_MOBILE_ID}`, {
          body: original,
        }).as('getRinkConnection')

        // モバイルアクセスIDを選択
        cy.inputSelectForm({
          selector: '[data-cy="rink-mobile-connections-remove-rink-mobile-id"]',
          value: RINK_MOBILE_ID,
        })
        cy.wait(['@getRinkConnection', '@getLineList'])
        // 表示項目の確認
        assertInitialization(original)

        // 廃止希望日を選択
        cy.inputDatePicker({
          className: '[data-cy="rink-mobile-connections-remove-time-frame"]',
          date: scheduleNetworks[2],
        })

        // 確認ボタンを押下
        cy.get('[data-cy="rink-mobile-connections-remove-submit-button"]')
          .should('have.text', t('common.confirm'))
          .click()
        // 廃止申し込みボタンを押下
        cy.get('[data-cy="rink-mobile-connections-remove-submit-button"]')
          .should('have.text', t('common.abolition'))
          .click()

        cy.wait('@deleteRinkConnection').then(req => {
          expect(req.request.body).to.deep.equal({
            timeFrame: scheduleNetworks[2],
          })
        })

        // 完了ダイアログ
        cy.url().should('include', `/tenants/${this.tenantId}/rink-mobile/connections`)
        cy.get('[data-cy="notification-dialog-text"]').should('contain', t('message.finished'))
        cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
        cy.get('[data-cy="notification-dialog-submit-button"]')
          .should('have.text', t('rinkConnections.moveToTop'))
          .click()
        cy.get('[data-cy="notification-dialog-text"]').should('not.exist')

        // 契約一覧画面に遷移する
        cy.wait(['@getRinkConnectionList'])
        cy.url().should('include', `/tenants/${this.tenantId}/rink-mobile/contracts`)
      })
    })

    it('4　VPN通信利用+特定通信ブレイクアウト利用', function () {
      cy.fixture('rink-mobile/connections/local-breakout-list').then(data => {
        this.customLocalBreakOutList = data
      })
      cy.fixture(`rink-mobile/connections/detail-${RinkConnectionTypes.VpnBreakOut}`).then(original => {
        cy.intercept('GET', `**/rink-mobile/v1/tenants/*/rink-connections/self-add/${RINK_MOBILE_ID}`, {
          body: original,
        }).as('getRinkConnection')

        // モバイルアクセスIDを選択
        cy.inputSelectForm({
          selector: '[data-cy="rink-mobile-connections-remove-rink-mobile-id"]',
          value: RINK_MOBILE_ID,
        })
        cy.wait(['@getRinkConnection', '@getLineList'])
        // 表示項目の確認
        assertInitialization(original)

        // 「4 VPN通信利用+特定通信ブレイクアウト利用」での追加表示項目確認
        const systemLocalBreakOutListNames = original.systemLocalBreakOutList.map(({ name }: { name: string }) => name)
        cy.get('[data-cy="rink-connection-detail-break-out"]')
          .find('div')
          .should('have.length', original.systemLocalBreakOutList.length)
          .each(($el, index) => {
            const name = systemLocalBreakOutListNames[index]
            cy.wrap($el).should('have.text', t(`rinkConnections.${name}`))
          })
        if (original.customLocalBreakOutList?.length) {
          cy.get('[data-cy="custom-local-break-out-list-table"]').as('table').should('exist')
          // 行数の確認
          cy.get('@table').find('.body .row').should('have.length', this.customLocalBreakOutList.length)
          // 各行の表示内容の確認
          cy.get('@table')
            .find('.body .row')
            .each(($row, index) => {
              const expected = this.customLocalBreakOutList[index]
              // カスタムローカルブレイクアウト名
              cy.wrap($row).find('.cell.body-cell').eq(0).should('have.text', expected.name)
              // カスタムローカルブレイクアウト名別名
              cy.wrap($row).find('.cell.body-cell').eq(1).should('have.text', expected.nameAlias)
              // 宛先プレフィックスリスト
              cy.wrap($row)
                .find('.cell.body-cell')
                .eq(2)
                .should('have.text', expected.dstPrefixList.map(({ prefix }: { prefix: string }) => prefix).join('\n'))
              // FQDNリスト
              cy.wrap($row)
                .find('.cell.body-cell')
                .eq(3)
                .should('have.text', expected.fqdnList.map(({ fqdn }: { fqdn: string }) => fqdn).join('\n'))
            })
        } else {
          cy.get('[data-cy="custom-local-break-out-list-table"]').should('not.exist')
        }

        // 廃止希望日を選択
        cy.inputDatePicker({
          className: '[data-cy="rink-mobile-connections-remove-time-frame"]',
          date: scheduleNetworks[2],
        })

        // 確認ボタンを押下
        cy.get('[data-cy="rink-mobile-connections-remove-submit-button"]')
          .should('have.text', t('common.confirm'))
          .click()
        // 廃止申し込みボタンを押下
        cy.get('[data-cy="rink-mobile-connections-remove-submit-button"]')
          .should('have.text', t('common.abolition'))
          .click()

        cy.wait('@deleteRinkConnection').then(req => {
          expect(req.request.body).to.deep.equal({
            timeFrame: scheduleNetworks[2],
          })
        })

        // 完了ダイアログ
        cy.url().should('include', `/tenants/${this.tenantId}/rink-mobile/connections`)
        cy.get('[data-cy="notification-dialog-text"]').should('contain', t('message.finished'))
        cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
        cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('rinkConnections.moveToTop'))
        // 閉じるボタンを押下する
        cy.get('.dialog-card-close').should('have.text', t('common.close')).click()
        cy.get('[data-cy="notification-dialog-text"]').should('not.exist')
        // 画面遷移なし
        cy.url().should('include', `/tenants/${this.tenantId}/rink-mobile/connections`)
      })
    })
  })

  context('回線が残っている場合', function () {
    beforeEach(function () {
      // 受付時間内に設定
      cy.clock(new Date(new Date().setHours(19, 59, 59, 59)), ['Date'])

      cy.intercept('GET', `**/rink-mobile/v1/tenants/*/lines/self-add/${RINK_MOBILE_ID}?*`, {
        fixture: 'rink-mobile/line-groups/line-list',
      }).as('getLineList')

      // 設備申込画面に遷移
      cy.visit(`/tenants/${this.tenantId}/rink-mobile/connections`)
      // 廃止ボタンを押下
      cy.get('[data-cy="rink-mobile-connections-index-remove-button"]').click()
      cy.wait(['@getScheduleNetworks', '@getRinkConnectionList'])

      // 時間外メッセージ非表示確認
      cy.get('[data-cy="rink-mobile-connections-remove-outside-reception-hour"]').should('not.exist')
      // モバイルアクセスID選択まで詳細情報は非表示
      cy.get('[data-cy="rink-mobile-connections-remove-detail"]').should('not.exist')
    })

    it('設備廃止ができないこと', function () {
      cy.intercept('GET', `**/rink-mobile/v1/tenants/*/rink-connections/self-add/${RINK_MOBILE_ID}`, {
        fixture: `rink-mobile/connections/detail-${RinkConnectionTypes.InternetOnly}`,
      }).as('getRinkConnection')

      // モバイルアクセスIDを選択
      cy.inputSelectForm({
        selector: '[data-cy="rink-mobile-connections-remove-rink-mobile-id"]',
        value: RINK_MOBILE_ID,
      })
      cy.wait(['@getRinkConnection', '@getLineList'])

      // 設備廃止不可メッセージ表示確認
      cy.get('[data-cy="rink-mobile-connections-remove-line-remove-confirm"]').should(
        'have.text',
        t('rinkConnections.message.lineRemoveConfirm', { count: LINE_COUNT }),
      )

      // 廃止希望日が非表示であることを確認
      cy.get('[data-cy="rink-mobile-connections-remove-time-frame"]').should('not.exist')

      // 確認ボタンを押せないことを確認
      cy.get('[data-cy="rink-mobile-connections-remove-submit-button"]').should('be.disabled')
    })
  })

  context('受付時間外メッセージの表示を確認', function () {
    it('受付時間外 - 日本時間(20:00)', function () {
      cy.clock(new Date(new Date().setHours(20, 0, 0, 0)), ['Date'])

      cy.intercept('GET', `**/rink-mobile/v1/tenants/*/rink-connections/self-add/${RINK_MOBILE_ID}`, {
        fixture: `rink-mobile/connections/detail-${RinkConnectionTypes.VpnBreakOut}`,
      }).as('getRinkConnection')
      cy.intercept('GET', `**/rink-mobile/v1/tenants/*/lines/self-add/${RINK_MOBILE_ID}?*`, {
        total: 0,
        lineList: [],
      }).as('getLineList')

      // 設備申込画面に遷移
      cy.visit(`/tenants/${this.tenantId}/rink-mobile/connections`)
      // 廃止ボタンを押下
      cy.get('[data-cy="rink-mobile-connections-index-remove-button"]').click()
      cy.wait(['@getScheduleNetworks', '@getRinkConnectionList'])
      // 時間外メッセージ表示確認
      cy.get('[data-cy="rink-mobile-connections-remove-outside-reception-hour"]').should('exist')

      // モバイルアクセスIDを選択
      cy.inputSelectForm({
        selector: '[data-cy="rink-mobile-connections-remove-rink-mobile-id"]',
        value: RINK_MOBILE_ID,
      })
      cy.wait(['@getRinkConnection', '@getLineList'])
      // 変更希望日
      cy.inputDatePicker({
        className: '[data-cy="rink-mobile-connections-remove-time-frame"]',
        date: scheduleNetworks[2],
      })

      // 確認ボタンを押せないことを確認
      cy.get('[data-cy="rink-mobile-connections-remove-submit-button"]').should('be.disabled')
    })
    it('受付時間外 - 日本時間(23:59)', function () {
      cy.clock(new Date(new Date().setHours(23, 59, 59, 59)), ['Date'])

      // 設備申込画面に遷移
      cy.visit(`/tenants/${this.tenantId}/rink-mobile/connections`)
      // 廃止ボタンを押下
      cy.get('[data-cy="rink-mobile-connections-index-remove-button"]').click()
      cy.wait(['@getScheduleNetworks', '@getRinkConnectionList'])
      // 時間外メッセージ表示確認
      cy.get('[data-cy="rink-mobile-connections-remove-outside-reception-hour"]').should('exist')
    })
  })
})
