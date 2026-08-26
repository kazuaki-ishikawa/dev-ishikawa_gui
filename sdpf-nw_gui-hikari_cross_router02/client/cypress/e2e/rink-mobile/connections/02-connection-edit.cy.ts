import { BreakOutTypes } from '@app/api/constants'
import { RinkConnectionTypes, RinkConnectionEditTypes, MAX_BREAKOUT_COUNT } from '@app/api/rinkConnections/constants'
import type { RinkConnectionType, RinkConnectionEditType } from '@app/api/rinkConnections/types'
import { generateRandomHex, t, getScheduleNetworks, stripPrefix } from '@cypress/support/utils'

const RINK_MOBILE_ID = 'Z000000002'
const scheduleNetworks = getScheduleNetworks()

const inputEditMenu = (editType: RinkConnectionEditType) => {
  cy.get('[data-cy="rink-mobile-connections-edit-edit-menu-selector"]').within(() => {
    cy.get(`.label.${editType}`).click()
  })
}
const assertEditMenu = (selectableMenu: RinkConnectionEditType[], selected?: RinkConnectionEditType) => {
  cy.get('[data-cy="rink-mobile-connections-edit-edit-menu-selector"]').within(() => {
    if (selected) {
      cy.get('.radio.checked').should('have.length', 1).find('.label').should('have.class', selected)
    } else {
      cy.get('.radio.checked').should('have.length', 0)
    }
    Object.values(RinkConnectionEditTypes).forEach(type => {
      cy.get(`.label.${type}`)
        .parent()
        .should(selectableMenu.includes(type) ? 'not.have.class' : 'have.class', 'disabled')
    })
  })
}

const inputConnectionType = (connectionType: RinkConnectionType) => {
  cy.get('[data-cy="edit-rink-connection-connection-type"]').within(() => {
    cy.get(`.label.${connectionType}`).click()
  })
}
const assertConnectionType = (originalConnectionType: RinkConnectionType) => {
  cy.get('[data-cy="edit-rink-connection-connection-type"]').within(() => {
    cy.get('.radio.checked').should('have.length', 1).find('.label').should('have.class', originalConnectionType)
    Object.values(RinkConnectionTypes).forEach(type => {
      cy.get(`.label.${type}`)
        .parent()
        .should(type === originalConnectionType ? 'have.class' : 'not.have.class', 'disabled')
        .should(type === originalConnectionType ? 'have.class' : 'not.have.class', 'checked')
    })
  })
}

describe('設備編集テスト', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)

    cy.fixture('rink-mobile/connections/edit').then(data => {
      this.editData = data
    })
    cy.fixture('vpns/list').then(data => {
      this.vpnList = data.vpns
    })
    cy.fixture('rink-mobile/connections/local-breakout-list').then(data => {
      this.customLocalBreakOutList = data
    })

    cy.intercept('GET', '**/rink-mobile/v1/tenants/*/rink-connections/self-only', {
      fixture: 'rink-mobile/connections/list',
    }).as('getRinkConnectionList')
    cy.intercept('GET', `**/rink-mobile/v1/tenants/*/rink-connections/local-breakout-list/${RINK_MOBILE_ID}`, {
      fixture: 'rink-mobile/connections/local-breakout-list',
    }).as('getLocalBreakoutList')

    cy.intercept('GET', `**/rink-mobile/v1/tenants/*/lines/self-add/${RINK_MOBILE_ID}?*`, {
      fixture: 'rink-mobile/lines/list',
    }).as('getLineList')

    cy.intercept('GET', `**/rink-mobile/v1/tenants/*/line-groups/self-add/${RINK_MOBILE_ID}`, {
      fixture: 'rink-mobile/line-groups/list',
    }).as('getRinkLineGroupList')

    cy.intercept('GET', '**/ztgict/v1/resource-summary/vpns', { fixture: 'vpns/list' }).as('getSummaryVpnList')
    cy.intercept('GET', '**/rink-mobile/v1/tenants/*/available-line-prefix/self-only', {
      fixture: 'rink-mobile/connections/available-line-prefix',
    }).as('getAvailableLinePrefix')
    cy.intercept('GET', '**/rink-mobile/v1/tenants/*/schedule-network/self-only?orderType=other', {
      body: { scheduleNetworks },
    }).as('getScheduleNetworks')
  })

  context('[詳細] 1　インターネット通信利用', function () {
    const SelectableEditMenu = [
      RinkConnectionEditTypes.ConnectionType,
      RinkConnectionEditTypes.DnsServer,
    ] as RinkConnectionEditType[]
    const OriginalConnectionType = RinkConnectionTypes.InternetOnly

    beforeEach(function () {
      // 受付時間内に設定
      cy.clock(new Date(new Date().setHours(0, 0, 0, 0)), ['Date'])

      // 設備申込画面に遷移
      cy.visit(`/tenants/${this.tenantId}/rink-mobile/connections`)
      // 変更ボタンを押下
      cy.get('[data-cy="rink-mobile-connections-index-edit-button"]').click()
      cy.wait(['@getRinkConnectionList', '@getSummaryVpnList', '@getAvailableLinePrefix', '@getScheduleNetworks'])

      // 時間外メッセージ非表示確認
      cy.get('[data-cy="rink-mobile-connections-edit-outside-reception-hour"]').should('not.exist')
      // モバイルアクセスID選択まで変更メニューは非表示
      cy.get('[data-cy="rink-mobile-connections-edit-edit-menu-selector"]').should('not.exist')
    })

    it('変更メニュー: DNSサーバーIPアドレス', function () {
      const EditType = RinkConnectionEditTypes.DnsServer
      cy.fixture(`rink-mobile/connections/detail-${OriginalConnectionType}`).then(original => {
        cy.intercept('GET', `**/rink-mobile/v1/tenants/*/rink-connections/self-add/${RINK_MOBILE_ID}`, {
          body: original,
        }).as('getRinkConnection')
        cy.intercept('PUT', `**/rink-mobile/v1/tenants/*/rink-connections/${EditType}/${RINK_MOBILE_ID}`, {
          body: { id: generateRandomHex(32) },
        }).as('putRinkConnection')

        // モバイルアクセスIDを選択
        cy.inputSelectForm({
          selector: '[data-cy="rink-mobile-connections-edit-rink-mobile-id"]',
          value: RINK_MOBILE_ID,
        })
        cy.wait(['@getRinkConnection'])

        // 初期値の確認
        assertEditMenu(SelectableEditMenu)
        // 「DNSサーバーIPアドレス」を選択
        inputEditMenu(EditType)

        // お申し込み方法選択の非表示確認
        cy.get('[data-cy="edit-application-type-application-type"]').should('not.exist')
        // 構成パターンの非表示確認
        cy.get('[data-cy="edit-rink-connection-connection-type"]').should('not.exist')
        // DNSサーバIPアドレスの非表示確認
        cy.get('[data-cy="rink-mobile-connections-edit-use-dns-server"]').should('not.exist')
        // APN
        cy.get('[data-cy="rink-connection-detail-apn"]').should('have.text', original.apn)

        // DNSサーバーIPアドレス編集
        const edit = this.editData[EditType]
        cy.get('[data-cy="rink-mobile-connections-edit-submit-button"]').as('submitButton').should('be.disabled')
        cy.get('[data-cy="rink-mobile-connections-edit-dns-ip-address-primary"]')
          .find('input')
          .should('have.value', stripPrefix(original.dnsIpAddressPrimary))
        cy.get('[data-cy="rink-mobile-connections-edit-dns-ip-address-primary"]')
          .find('input')
          .clear()
          .type(stripPrefix(edit.dnsIpAddressPrimary))
        cy.get('[data-cy="rink-mobile-connections-edit-dns-ip-address-secondary"]')
          .find('input')
          .should('have.value', stripPrefix(original.dnsIpAddressSecondary))
          .clear()
          .type(stripPrefix(edit.dnsIpAddressSecondary))

        cy.inputTimeFrame({
          className: '[data-cy="rink-mobile-connections-edit-time-frame"]',
          scheduleNetworks,
        })

        // 確認画面に遷移
        cy.get('@submitButton').click()
        // PUT実行
        cy.get('@submitButton').click()
        cy.wait('@putRinkConnection').then(req => {
          expect(req.request.body).to.deep.equals({
            dnsIpAddressPrimary: edit.dnsIpAddressPrimary,
            dnsIpAddressSecondary: edit.dnsIpAddressSecondary,
            timeFrame: scheduleNetworks[0],
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

    it('変更メニュー: 構成パターン変更（3　VPN通信利用）', function () {
      const EditType = RinkConnectionEditTypes.ConnectionType
      cy.fixture(`rink-mobile/connections/detail-${OriginalConnectionType}`).then(original => {
        cy.intercept('GET', `**/rink-mobile/v1/tenants/*/rink-connections/self-add/${RINK_MOBILE_ID}`, {
          body: original,
        }).as('getRinkConnection')
        cy.intercept('PUT', `**/rink-mobile/v1/tenants/*/rink-connections/${EditType}/${RINK_MOBILE_ID}`, {
          body: { id: generateRandomHex(32) },
        }).as('putRinkConnection')

        // モバイルアクセスIDを選択
        cy.inputSelectForm({
          selector: '[data-cy="rink-mobile-connections-edit-rink-mobile-id"]',
          value: RINK_MOBILE_ID,
        })
        cy.wait(['@getRinkConnection'])

        // 「構成パターン変更」を選択
        inputEditMenu(EditType)

        // お申し込み方法選択の非表示確認
        cy.get('[data-cy="edit-application-type-application-type"]').should('not.exist')

        // 構成パターンの初期値確認
        assertConnectionType(OriginalConnectionType)
        // 「3 VPN通信利用」を選択
        const connectionType = RinkConnectionTypes.VpnOnly
        inputConnectionType(connectionType)

        // 「3 VPN通信利用」編集
        const edit = this.editData[EditType][connectionType]
        cy.get('[data-cy="rink-mobile-connections-edit-submit-button"]').as('submitButton').should('be.disabled')

        // VPN接続の選択
        cy.get('[data-cy="edit-rink-connection-vpn-id-select-form"]').find('input').should('have.value', '')
        cy.inputSelectForm({ selector: '[data-cy="edit-rink-connection-vpn-id-select-form"]', value: edit.vpnId })

        // DNSサーバIPアドレスの初期表示確認
        cy.get('[data-cy="edit-rink-connection-use-dns-server"]')
          .as('useDnsServer')
          .find('.label.true')
          .should('have.length', 1)
        cy.get('[data-cy="edit-rink-connection-dns-ip-address-primary"]')
          .as('dnsIpAddressPrimary')
          .find('input')
          .should('have.value', stripPrefix(original.dnsIpAddressPrimary))
        cy.get('[data-cy="edit-rink-connection-dns-ip-address-secondary"]')
          .as('dnsIpAddressSecondary')
          .find('input')
          .should('have.value', stripPrefix(original.dnsIpAddressSecondary))
        // DNSサーバIPアドレスを無効に変更
        cy.get('@useDnsServer').find('.label.false').click()
        // DNSサーバIPアドレス入力欄が非表示になることを確認
        cy.get('@dnsIpAddressPrimary').should('not.exist')
        cy.get('@dnsIpAddressSecondary').should('not.exist')

        // 再度有効に変更して、元の値に戻す
        cy.get('@useDnsServer').find('.label.true').click()
        cy.get('@dnsIpAddressPrimary').find('input').clear().type(stripPrefix(original.dnsIpAddressPrimary))
        cy.get('@dnsIpAddressSecondary').find('input').clear().type(stripPrefix(original.dnsIpAddressSecondary))

        // VPN網内利用アドレス
        cy.get('[data-cy="edit-rink-connection-vpn-network-prefix"]')
          .find('input')
          .should('have.value', '')
          .type(stripPrefix(edit.vpnNetworkPrefix))

        // 変更希望日
        cy.get('[data-cy="edit-rink-connection-time-frame-date-picker"]').should('not.exist')
        cy.inputTimeFrame({
          className: '[data-cy="edit-rink-connection-time-frame"]',
          scheduleNetworks,
        })

        // 非表示項目
        // VPN接続
        cy.get('[data-cy="edit-rink-connection-vpn-id-information"]').should('not.exist')
        // VPN接続通信アドレス
        cy.get('[data-cy="edit-rink-connection-vpn-connection-prefix"]').should('not.exist')
        // 特定通信ブレイクアウト
        cy.get('[data-cy="edit-rink-connection-break-out-list"]').should('not.exist')
        // カスタムローカルブレイクアウト
        cy.get('[data-cy="edit-rink-connection-local-break-out-list"]').should('not.exist')

        // 入力不可項目
        // 回線認証用ドメイン名
        if (original.authDomainName) {
          cy.get('[data-cy="edit-rink-connection-auth-domain-name"]').should('have.text', original.authDomainName)
        } else {
          cy.get('[data-cy="edit-rink-connection-auth-domain-name"]').should('not.exist')
        }
        // APN
        cy.get('[data-cy="edit-rink-connection-apn"]').should('have.text', original.apn)
        // 国内通信冗長利用
        cy.get('[data-cy="edit-rink-connection-poi-redundancy"]')
          .find('.radio.checked.disabled')
          .find(`.label.${original.poiRedundancy}`)
          .should('have.length', 1)
        // アクティブ側のプレフィックスリスト
        cy.get('[data-cy="edit-rink-connection-line-act-prefix"]')
          .find('input')
          .should('have.value', original.lineActPrefix[0])
          .should('be.disabled')
        // スタンバイ側のプレフィックスリスト
        if (original.poiRedundancy) {
          cy.get('[data-cy="edit-rink-connection-line-sby-prefix"]')
            .find('input')
            .should('have.value', original.lineSbyPrefix[0])
            .should('be.disabled')
        } else {
          cy.get('[data-cy="edit-rink-connection-line-sby-prefix"]').should('not.exist')
        }

        // 確認画面に遷移
        cy.get('@submitButton').click()
        // PUT実行
        cy.get('@submitButton').click()
        cy.wait('@putRinkConnection').then(req => {
          expect(req.request.body).to.deep.equals({
            ...edit,
            connectionType,
            timeFrame: scheduleNetworks[0],
          })
        })

        cy.url().then(beforeUrl => {
          // 完了ダイアログの閉じるを押す
          cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('message.finished'))
          cy.get('.dialog-card-close').click()
          cy.get('[data-cy="notification-dialog-text"]').should('not.exist')
          cy.url().should('eq', beforeUrl)
        })
      })
    })
  })

  context('[詳細] 2　インターネット通信利用+VPN通信利用', function () {
    const SelectableEditMenu = [
      RinkConnectionEditTypes.ConnectionType,
      RinkConnectionEditTypes.VpnConnectionPrefix,
      RinkConnectionEditTypes.DnsServer,
    ] as RinkConnectionEditType[]
    const OriginalConnectionType = RinkConnectionTypes.InternetVpn

    beforeEach(function () {
      // 受付時間内に設定
      cy.clock(new Date(new Date().setHours(10, 0, 0, 0)), ['Date'])

      // 設備申込画面に遷移
      cy.visit(`/tenants/${this.tenantId}/rink-mobile/connections`)
      // 変更ボタンを押下
      cy.get('[data-cy="rink-mobile-connections-index-edit-button"]').click()
      cy.wait(['@getRinkConnectionList', '@getSummaryVpnList', '@getAvailableLinePrefix', '@getScheduleNetworks'])

      // 時間外メッセージ非表示確認
      cy.get('[data-cy="rink-mobile-connections-edit-outside-reception-hour"]').should('not.exist')
      // モバイルアクセスID選択まで変更メニューは非表示
      cy.get('[data-cy="rink-mobile-connections-edit-edit-menu-selector"]').should('not.exist')
    })

    it('変更メニュー: VPN接続通信アドレス設定', function () {
      const EditType = RinkConnectionEditTypes.VpnConnectionPrefix
      cy.fixture(`rink-mobile/connections/detail-${OriginalConnectionType}`).then(original => {
        cy.intercept('GET', `**/rink-mobile/v1/tenants/*/rink-connections/self-add/${RINK_MOBILE_ID}`, {
          body: original,
        }).as('getRinkConnection')
        cy.intercept('PUT', `**/rink-mobile/v1/tenants/*/rink-connections/${EditType}/${RINK_MOBILE_ID}`, {
          body: { id: generateRandomHex(32) },
        }).as('putRinkConnection')

        // モバイルアクセスIDを選択
        cy.inputSelectForm({
          selector: '[data-cy="rink-mobile-connections-edit-rink-mobile-id"]',
          value: RINK_MOBILE_ID,
        })
        cy.wait(['@getRinkConnection'])

        // 初期値の確認
        assertEditMenu(SelectableEditMenu)
        // 「VPN接続通信アドレス設定」を選択
        inputEditMenu(EditType)

        // お申し込み方法選択の非表示確認
        cy.get('[data-cy="edit-application-type-application-type"]').should('not.exist')
        // 構成パターンの非表示確認
        cy.get('[data-cy="edit-rink-connection-connection-type"]').should('not.exist')
        // APN
        cy.get('[data-cy="rink-connection-detail-apn"]').should('have.text', original.apn)

        // VPN接続通信アドレス編集
        const edit = this.editData[EditType]
        cy.get('[data-cy="rink-mobile-connections-edit-submit-button"]').as('submitButton').should('be.disabled')
        cy.get('[data-cy="rink-mobile-connections-edit-vpn-connection-prefix"]')
          .find('textarea')
          .should('have.value', original.vpnConnectionPrefix.join('\n'))
        cy.get('[data-cy="rink-mobile-connections-edit-vpn-connection-prefix"]')
          .find('textarea')
          .clear()
          .type(edit.vpnConnectionPrefix.join('\n'))
        cy.inputTimeFrame({
          className: '[data-cy="rink-mobile-connections-edit-time-frame"]',
          scheduleNetworks,
        })

        // 確認画面に遷移
        cy.get('@submitButton').click()
        // PUT実行
        cy.get('@submitButton').click()
        cy.wait('@putRinkConnection').then(req => {
          expect(req.request.body).to.deep.equals({
            vpnConnectionPrefix: edit.vpnConnectionPrefix,
            timeFrame: scheduleNetworks[0],
          })
        })

        // 完了ダイアログ
        cy.url().should('include', `/tenants/${this.tenantId}/rink-mobile/connections`)
        cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('message.finished'))
        cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
        cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('rinkConnections.moveToTop'))
      })
    })

    it('変更メニュー: 構成パターン変更（4　VPN通信利用+特定通信ブレイクアウト利用）', function () {
      const EditType = RinkConnectionEditTypes.ConnectionType
      cy.fixture(`rink-mobile/connections/detail-${OriginalConnectionType}`).then(original => {
        cy.intercept('GET', `**/rink-mobile/v1/tenants/*/rink-connections/self-add/${RINK_MOBILE_ID}`, {
          body: original,
        }).as('getRinkConnection')
        cy.intercept('PUT', `**/rink-mobile/v1/tenants/*/rink-connections/${EditType}/${RINK_MOBILE_ID}`, {
          body: { id: generateRandomHex(32) },
        }).as('putRinkConnection')

        // モバイルアクセスIDを選択
        cy.inputSelectForm({
          selector: '[data-cy="rink-mobile-connections-edit-rink-mobile-id"]',
          value: RINK_MOBILE_ID,
        })
        cy.wait(['@getRinkConnection'])

        // 「構成パターン変更」を選択
        inputEditMenu(EditType)

        // お申し込み方法選択の非表示確認
        cy.get('[data-cy="edit-application-type-application-type"]').should('not.exist')

        // 構成パターンの初期値確認
        assertConnectionType(OriginalConnectionType)

        // 「4 VPN通信利用+特定通信ブレイクアウト利用」を選択
        const connectionType = RinkConnectionTypes.VpnBreakOut
        inputConnectionType(connectionType)

        // 「4 VPN通信利用+特定通信ブレイクアウト利用」編集
        const edit = this.editData[EditType][connectionType]
        cy.get('[data-cy="rink-mobile-connections-edit-submit-button"]').as('submitButton').should('be.disabled')

        // 特定通信ブレイクアウト
        cy.get('[data-cy="edit-rink-connection-break-out-list"]').within(() => {
          // チェックは入ってない状態から始まる
          cy.get('.checkbox.checked').should('have.length', 0)
          edit.systemLocalBreakOutList.forEach(({ name }: { name: string }) => {
            cy.get(`.label.${name}`).click()
          })
        })

        // カスタムローカルブレイクアウトの入力
        if (edit.customLocalBreakOutList) {
          // カスタムローカルブレイクアウトの入力、最大数は8件-特定通信ブレイクアウト選択数
          cy.inputEditCustomLocalBreakOutList({
            customLocalBreakOutList: edit.customLocalBreakOutList,
            maxItems: MAX_BREAKOUT_COUNT - edit.systemLocalBreakOutList.length,
            className: '[data-cy="edit-rink-connection-custom-local-break-out-list"]',
          })
        } else {
          cy.removeRowMultipleForm({ className: '[data-cy="edit-rink-connection-custom-local-break-out-list"]' })
        }
        cy.assertSystemLocalBreakOutList({
          systemLocalBreakOutList: edit.systemLocalBreakOutList,
          customLocalBreakOutList: edit.customLocalBreakOutList,
          className: '[data-cy="edit-rink-connection-break-out-list"]',
        })

        // DNSサーバーIPアドレス（プライマリ）
        // 変更なしでそのまま
        cy.get('[data-cy="edit-rink-connection-dns-ip-address-primary"]')
          .find('input')
          .should('have.value', stripPrefix(original.dnsIpAddressPrimary))
        // DNSサーバーIPアドレス（セカンダリ）
        cy.get('[data-cy="edit-rink-connection-dns-ip-address-secondary"]')
          .find('input')
          .should('have.value', stripPrefix(original.dnsIpAddressSecondary))
          .clear()
          .type(stripPrefix(edit.dnsIpAddressSecondary))

        // 変更希望日
        cy.get('[data-cy="edit-rink-connection-time-frame-date-picker"]').should('not.exist')
        cy.inputTimeFrame({
          className: '[data-cy="edit-rink-connection-time-frame"]',
          scheduleNetworks,
        })

        // VPN接続
        cy.get('[data-cy="edit-rink-connection-vpn-id-information"]').should('have.text', original.vpnId)
        cy.get('[data-cy="edit-rink-connection-vpn-id-select-form"]').should('not.exist')

        // 非表示項目
        // VPN接続通信アドレス
        cy.get('[data-cy="edit-rink-connection-vpn-connection-prefix"]').should('not.exist')
        // DNSサーバIPアドレス
        cy.get('[data-cy="edit-rink-connection-use-dns-server"]').should('not.exist')

        // 入力不可項目
        // 回線認証用ドメイン名
        if (original.authDomainName) {
          cy.get('[data-cy="edit-rink-connection-auth-domain-name"]').should('have.text', original.authDomainName)
        } else {
          cy.get('[data-cy="edit-rink-connection-auth-domain-name"]').should('not.exist')
        }
        // APN
        cy.get('[data-cy="edit-rink-connection-apn"]').should('have.text', original.apn)
        // 国内通信冗長利用
        cy.get('[data-cy="edit-rink-connection-poi-redundancy"]')
          .find('.radio.checked.disabled')
          .find(`.label.${original.poiRedundancy}`)
          .should('have.length', 1)
        // アクティブ側のプレフィックスリスト
        cy.get('[data-cy="edit-rink-connection-line-act-prefix"]')
          .find('input')
          .should('have.value', original.lineActPrefix[0])
          .should('be.disabled')
        // スタンバイ側のプレフィックスリスト
        if (original.poiRedundancy) {
          cy.get('[data-cy="edit-rink-connection-line-sby-prefix"]')
            .find('input')
            .should('have.value', original.lineSbyPrefix[0])
            .should('be.disabled')
        } else {
          cy.get('[data-cy="edit-rink-connection-line-sby-prefix"]').should('not.exist')
        }
        // VPN網内利用アドレスはInternetOnlyから以外の変更では編集不可
        cy.get('[data-cy="edit-rink-connection-vpn-network-prefix"]')
          .find('input')
          .should('have.value', stripPrefix(original.vpnNetworkPrefix))
          .should('be.disabled')

        // 確認画面に遷移
        cy.get('@submitButton').click()
        // PUT実行
        cy.get('@submitButton').click()
        cy.wait('@putRinkConnection').then(req => {
          expect(req.request.body).to.deep.equals({
            ...edit,
            ...(edit.customLocalBreakOutList && {
              customLocalBreakOutList: edit.customLocalBreakOutList.slice(
                0,
                MAX_BREAKOUT_COUNT - edit.systemLocalBreakOutList.length,
              ),
            }),
            connectionType,
            timeFrame: scheduleNetworks[0],
          })
        })

        // 完了ダイアログ
        cy.url().should('include', `/tenants/${this.tenantId}/rink-mobile/connections`)
        cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('message.finished'))
        cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
        cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('rinkConnections.moveToTop'))
      })
    })
  })

  context('[詳細] 3　VPN通信利用', function () {
    const SelectableEditMenu = [
      RinkConnectionEditTypes.ConnectionType,
      RinkConnectionEditTypes.DnsServer,
    ] as RinkConnectionEditType[]
    const OriginalConnectionType = RinkConnectionTypes.VpnOnly

    beforeEach(function () {
      // 受付時間内に設定
      cy.clock(new Date(new Date().setHours(19, 59, 59, 59)), ['Date'])

      // 設備申込画面に遷移
      cy.visit(`/tenants/${this.tenantId}/rink-mobile/connections`)
      // 変更ボタンを押下
      cy.get('[data-cy="rink-mobile-connections-index-edit-button"]').click()
      cy.wait(['@getRinkConnectionList', '@getSummaryVpnList', '@getAvailableLinePrefix', '@getScheduleNetworks'])

      // 時間外メッセージ非表示確認
      cy.get('[data-cy="rink-mobile-connections-edit-outside-reception-hour"]').should('not.exist')
      // モバイルアクセスID選択まで変更メニューは非表示
      cy.get('[data-cy="rink-mobile-connections-edit-edit-menu-selector"]').should('not.exist')
    })

    it('変更メニュー: DNSサーバーIPアドレス', function () {
      const EditType = RinkConnectionEditTypes.DnsServer
      cy.fixture(`rink-mobile/connections/detail-${OriginalConnectionType}`).then(original => {
        cy.intercept('GET', `**/rink-mobile/v1/tenants/*/rink-connections/self-add/${RINK_MOBILE_ID}`, {
          body: original,
        }).as('getRinkConnection')
        cy.intercept('PUT', `**/rink-mobile/v1/tenants/*/rink-connections/${EditType}/${RINK_MOBILE_ID}`, {
          body: { id: generateRandomHex(32) },
        }).as('putRinkConnection')

        // モバイルアクセスIDを選択
        cy.inputSelectForm({
          selector: '[data-cy="rink-mobile-connections-edit-rink-mobile-id"]',
          value: RINK_MOBILE_ID,
        })
        cy.wait(['@getRinkConnection'])

        // 初期値の確認
        assertEditMenu(SelectableEditMenu)
        // 「DNSサーバーIPアドレス」を選択
        inputEditMenu(EditType)

        // お申し込み方法選択の非表示確認
        cy.get('[data-cy="edit-application-type-application-type"]').should('not.exist')
        // 構成パターンの非表示確認
        cy.get('[data-cy="edit-rink-connection-connection-type"]').should('not.exist')

        // DNSサーバIPアドレスの表示確認
        cy.get('[data-cy="rink-mobile-connections-edit-use-dns-server"]').should('exist')
        cy.get('[data-cy="rink-mobile-connections-edit-use-dns-server"]').find('.label.true').should('have.length', 1)
        // APN
        cy.get('[data-cy="rink-connection-detail-apn"]').should('have.text', original.apn)

        // DNSサーバーIPアドレス編集
        cy.get('[data-cy="rink-mobile-connections-edit-submit-button"]').as('submitButton').should('be.disabled')
        cy.get('[data-cy="rink-mobile-connections-edit-use-dns-server"]').find('.label.false').click()
        cy.get('[data-cy="rink-mobile-connections-edit-dns-ip-address-primary"]').should('not.exist')
        cy.get('[data-cy="rink-mobile-connections-edit-dns-ip-address-secondary"]').should('not.exist')

        // 変更希望日
        cy.inputTimeFrame({
          className: '[data-cy="rink-mobile-connections-edit-time-frame"]',
          scheduleNetworks,
        })

        // 確認画面に遷移
        cy.get('@submitButton').click()
        // PUT実行
        cy.get('@submitButton').click()
        cy.wait('@putRinkConnection').then(req => {
          expect(req.request.body).to.deep.equals({
            deleteColumns: ['dnsIpAddressPrimary', 'dnsIpAddressSecondary'],
            timeFrame: scheduleNetworks[0],
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

    it('変更メニュー: 構成パターン変更（2　インターネット通信利用+VPN通信利用）', function () {
      const EditType = RinkConnectionEditTypes.ConnectionType
      cy.fixture(`rink-mobile/connections/detail-${OriginalConnectionType}`).then(original => {
        cy.intercept('GET', `**/rink-mobile/v1/tenants/*/rink-connections/self-add/${RINK_MOBILE_ID}`, {
          body: original,
        }).as('getRinkConnection')
        cy.intercept('PUT', `**/rink-mobile/v1/tenants/*/rink-connections/${EditType}/${RINK_MOBILE_ID}`, {
          body: { id: generateRandomHex(32) },
        }).as('putRinkConnection')

        // モバイルアクセスIDを選択
        cy.inputSelectForm({
          selector: '[data-cy="rink-mobile-connections-edit-rink-mobile-id"]',
          value: RINK_MOBILE_ID,
        })
        cy.wait(['@getRinkConnection'])

        // 「構成パターン変更」を選択
        inputEditMenu(EditType)

        // お申し込み方法選択の非表示確認
        cy.get('[data-cy="edit-application-type-application-type"]').should('not.exist')

        // 構成パターンの初期値確認
        assertConnectionType(OriginalConnectionType)

        // 「2 インターネット通信利用+VPN通信利用」を選択
        const connectionType = RinkConnectionTypes.InternetVpn
        inputConnectionType(connectionType)

        // 「2 インターネット通信利用+VPN通信利用」編集
        const edit = this.editData[EditType][connectionType]
        cy.get('[data-cy="rink-mobile-connections-edit-submit-button"]').as('submitButton').should('be.disabled')

        // VPN接続通信アドレス
        cy.get('[data-cy="edit-rink-connection-vpn-connection-prefix"]').find('textarea').should('have.value', '')
        cy.get('[data-cy="edit-rink-connection-vpn-connection-prefix"]').type(edit.vpnConnectionPrefix.join('\n'))
        // DNSサーバーIPアドレス（プライマリ）
        cy.get('[data-cy="edit-rink-connection-dns-ip-address-primary"]')
          .find('input')
          .should('have.value', stripPrefix(original.dnsIpAddressPrimary))
        cy.get('[data-cy="edit-rink-connection-dns-ip-address-primary"]')
          .find('input')
          .clear()
          .type(stripPrefix(edit.dnsIpAddressPrimary))
        // DNSサーバーIPアドレス（セカンダリ）
        // 変更なしでそのまま
        cy.get('[data-cy="edit-rink-connection-dns-ip-address-secondary"]')
          .find('input')
          .should('have.value', stripPrefix(original.dnsIpAddressSecondary))

        // 変更希望日
        cy.get('[data-cy="edit-rink-connection-time-frame-date-picker"]').should('not.exist')
        cy.inputTimeFrame({
          className: '[data-cy="edit-rink-connection-time-frame"]',
          scheduleNetworks,
        })

        // VPN接続
        cy.get('[data-cy="edit-rink-connection-vpn-id-information"]').should('have.text', original.vpnId)
        cy.get('[data-cy="edit-rink-connection-vpn-id-select-form"]').should('not.exist')

        // 非表示項目
        // 特定通信ブレイクアウト
        cy.get('[data-cy="edit-rink-connection-break-out-list"]').should('not.exist')
        // カスタムローカルブレイクアウト
        cy.get('[data-cy="edit-rink-connection-local-break-out-list"]').should('not.exist')
        // DNSサーバIPアドレス
        cy.get('[data-cy="edit-rink-connection-use-dns-server"]').should('not.exist')

        // 入力不可項目
        // 回線認証用ドメイン名
        if (original.authDomainName) {
          cy.get('[data-cy="edit-rink-connection-auth-domain-name"]').should('have.text', original.authDomainName)
        } else {
          cy.get('[data-cy="edit-rink-connection-auth-domain-name"]').should('not.exist')
        }
        // APN
        cy.get('[data-cy="edit-rink-connection-apn"]').should('have.text', original.apn)
        // 国内通信冗長利用
        cy.get('[data-cy="edit-rink-connection-poi-redundancy"]')
          .find('.radio.checked.disabled')
          .find(`.label.${original.poiRedundancy}`)
          .should('have.length', 1)
        // アクティブ側のプレフィックスリスト
        cy.get('[data-cy="edit-rink-connection-line-act-prefix"]')
          .find('input')
          .should('have.value', original.lineActPrefix[0])
          .should('be.disabled')
        // スタンバイ側のプレフィックスリスト
        if (original.poiRedundancy) {
          cy.get('[data-cy="edit-rink-connection-line-sby-prefix"]')
            .find('input')
            .should('have.value', original.lineSbyPrefix[0])
            .should('be.disabled')
        } else {
          cy.get('[data-cy="edit-rink-connection-line-sby-prefix"]').should('not.exist')
        }
        // VPN網内利用アドレスはInternetOnlyから以外の変更では編集不可
        cy.get('[data-cy="edit-rink-connection-vpn-network-prefix"]')
          .find('input')
          .should('have.value', stripPrefix(original.vpnNetworkPrefix))
          .should('be.disabled')

        // 確認画面に遷移
        cy.get('@submitButton').click()
        // PUT実行
        cy.get('@submitButton').click()
        cy.wait('@putRinkConnection').then(req => {
          expect(req.request.body).to.deep.equals({
            ...edit,
            connectionType,
            timeFrame: scheduleNetworks[0],
          })
        })

        // 完了ダイアログ
        cy.url().should('include', `/tenants/${this.tenantId}/rink-mobile/connections`)
        cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('message.finished'))
        cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
        cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('rinkConnections.moveToTop'))
      })
    })
  })

  context('[詳細] 4　VPN通信利用+特定通信ブレイクアウト利用', function () {
    const SelectableEditMenu = [
      RinkConnectionEditTypes.ConnectionType,
      RinkConnectionEditTypes.LocalBreakOut,
      RinkConnectionEditTypes.DnsServer,
    ] as RinkConnectionEditType[]
    const OriginalConnectionType = RinkConnectionTypes.VpnBreakOut

    beforeEach(function () {
      // 受付時間内に設定
      cy.clock(new Date(new Date().setHours(9, 0, 0, 0)), ['Date'])

      // 設備申込画面に遷移
      cy.visit(`/tenants/${this.tenantId}/rink-mobile/connections`)
      // 変更ボタンを押下
      cy.get('[data-cy="rink-mobile-connections-index-edit-button"]').click()
      cy.wait(['@getRinkConnectionList', '@getSummaryVpnList', '@getAvailableLinePrefix', '@getScheduleNetworks'])

      // 時間外メッセージ非表示確認
      cy.get('[data-cy="rink-mobile-connections-edit-outside-reception-hour"]').should('not.exist')
      // モバイルアクセスID選択まで変更メニューは非表示
      cy.get('[data-cy="rink-mobile-connections-edit-edit-menu-selector"]').should('not.exist')
    })

    it('変更メニュー: ブレイクアウト設定（入力フォーム）', function () {
      const EditType = RinkConnectionEditTypes.LocalBreakOut
      cy.fixture(`rink-mobile/connections/detail-${OriginalConnectionType}`).then(original => {
        cy.intercept('GET', `**/rink-mobile/v1/tenants/*/rink-connections/self-add/${RINK_MOBILE_ID}`, {
          body: original,
        }).as('getRinkConnection')
        cy.intercept('PUT', `**/rink-mobile/v1/tenants/*/rink-connections/${EditType}/${RINK_MOBILE_ID}`, {
          body: { id: generateRandomHex(32) },
        }).as('putRinkConnection')

        // モバイルアクセスIDを選択
        cy.inputSelectForm({
          selector: '[data-cy="rink-mobile-connections-edit-rink-mobile-id"]',
          value: RINK_MOBILE_ID,
        })
        cy.wait(['@getRinkConnection', '@getLocalBreakoutList'])

        // 初期値の確認
        assertEditMenu(SelectableEditMenu)
        // 「ブレイクアウト設定」を選択
        inputEditMenu(EditType)

        // 「入力フォームからお申し込み」が選択されていることを確認する
        cy.get('[data-cy="edit-application-type-application-type"]')
          .find('.radio.checked')
          .find('.label.form')
          .should('have.length', 1)
        // 構成パターンの非表示確認
        cy.get('[data-cy="edit-rink-connection-connection-type"]').should('not.exist')
        // APN
        cy.get('[data-cy="rink-connection-detail-apn"]').should('have.text', original.apn)

        // 「ブレイクアウト設定」編集
        const edit = this.editData[EditType]
        cy.get('[data-cy="rink-mobile-connections-edit-submit-button"]').as('submitButton').should('be.disabled')

        // 特定通信ブレイクアウト
        const originalBreakOutList = original.systemLocalBreakOutList.map(({ name }: { name: string }) => name)
        Object.values(BreakOutTypes).forEach(name => {
          cy.get('[data-cy="rink-mobile-connections-edit-break-out-list"]')
            .find(`.label.${name}`)
            .as('checkbox')
            .parent()
            .find('.checkbox.checked')
            .should('have.length', originalBreakOutList.includes(name) ? 1 : 0)
          // チェックがあったら外す
          if (originalBreakOutList.includes(name)) {
            cy.get('@checkbox').click()
          }
        })
        edit.systemLocalBreakOutList.forEach(({ name }: { name: string }) => {
          cy.get('[data-cy="rink-mobile-connections-edit-break-out-list"]').find(`.label.${name}`).click()
        })
        // カスタムローカルブレイクアウトの初期値
        cy.assertEditCustomLocalBreakOutList({
          disabled: false,
          customLocalBreakOutList: this.customLocalBreakOutList ?? [],
          className: '[data-cy="rink-mobile-connections-edit-local-break-out-list"]',
        })
        // カスタムローカルブレイクアウトの入力、最大数は8件-特定通信ブレイクアウト選択数
        if (edit.customLocalBreakOutList?.length) {
          cy.inputEditCustomLocalBreakOutList({
            customLocalBreakOutList: edit.customLocalBreakOutList,
            maxItems: MAX_BREAKOUT_COUNT - edit.systemLocalBreakOutList.length,
            className: '[data-cy="rink-mobile-connections-edit-local-break-out-list"]',
          })
        } else {
          cy.get('[data-cy="rink-mobile-connections-edit-local-break-out-list"]').should('not.exist')
        }
        cy.assertSystemLocalBreakOutList({
          systemLocalBreakOutList: edit.systemLocalBreakOutList,
          customLocalBreakOutList: edit.customLocalBreakOutList,
          className: '[data-cy="rink-mobile-connections-edit-break-out-list"]',
        })
        // 変更希望日
        cy.inputTimeFrame({
          className: '[data-cy="rink-mobile-connections-edit-time-frame"]',
          scheduleNetworks,
        })

        // 確認画面に遷移
        cy.get('@submitButton').click()
        // PUT実行
        cy.get('@submitButton').click()
        cy.wait('@putRinkConnection').then(req => {
          expect(req.request.body).to.deep.equals({
            ...edit,
            ...(edit.customLocalBreakOutList && {
              customLocalBreakOutList: edit.customLocalBreakOutList.slice(
                0,
                MAX_BREAKOUT_COUNT - edit.systemLocalBreakOutList.length,
              ),
            }),
            timeFrame: scheduleNetworks[0],
          })
        })

        // 完了ダイアログ
        cy.url().should('include', `/tenants/${this.tenantId}/rink-mobile/connections`)
        cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('message.finished'))
        cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
        cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('rinkConnections.moveToTop'))
      })
    })

    it('[TODO]変更メニュー: ブレイクアウト設定（CSVファイル）', function () {
      // TODO: excelファイル不明なので未実装
    })

    it('変更メニュー: 構成パターン変更（1　インターネット通信利用）', function () {
      const EditType = RinkConnectionEditTypes.ConnectionType
      cy.fixture(`rink-mobile/connections/detail-${OriginalConnectionType}`).then(original => {
        cy.intercept('GET', `**/rink-mobile/v1/tenants/*/rink-connections/self-add/${RINK_MOBILE_ID}`, {
          body: original,
        }).as('getRinkConnection')
        cy.intercept('PUT', `**/rink-mobile/v1/tenants/*/rink-connections/${EditType}/${RINK_MOBILE_ID}`, {
          body: { id: generateRandomHex(32) },
        }).as('putRinkConnection')

        // モバイルアクセスIDを選択
        cy.inputSelectForm({
          selector: '[data-cy="rink-mobile-connections-edit-rink-mobile-id"]',
          value: RINK_MOBILE_ID,
        })
        cy.wait(['@getRinkConnection'])

        // 「構成パターン変更」を選択
        inputEditMenu(EditType)

        // お申し込み方法選択の非表示確認
        cy.get('[data-cy="edit-application-type-application-type"]').should('not.exist')

        // 構成パターンの初期値確認
        assertConnectionType(OriginalConnectionType)

        // 「1 インターネット通信利用」を選択
        const connectionType = RinkConnectionTypes.InternetOnly
        inputConnectionType(connectionType)

        // 「1 インターネット通信利用」編集
        const edit = this.editData[EditType][connectionType]
        cy.get('[data-cy="rink-mobile-connections-edit-submit-button"]').as('submitButton').should('be.disabled')
        cy.get('[data-cy="edit-rink-connection-dns-ip-address-primary"]')
          .find('input')
          .should('have.value', stripPrefix(original.dnsIpAddressPrimary))
        cy.get('[data-cy="edit-rink-connection-dns-ip-address-primary"]')
          .find('input')
          .clear()
          .type(stripPrefix(edit.dnsIpAddressPrimary))
        cy.get('[data-cy="edit-rink-connection-dns-ip-address-secondary"]')
          .find('input')
          .should('have.value', stripPrefix(original.dnsIpAddressSecondary))
          .clear()
          .type(stripPrefix(edit.dnsIpAddressSecondary))

        // 変更希望日
        cy.get('[data-cy="edit-rink-connection-time-frame-date-picker"]').should('not.exist')
        cy.inputTimeFrame({
          className: '[data-cy="edit-rink-connection-time-frame"]',
          scheduleNetworks,
        })

        // 非表示項目
        // VPN接続
        cy.get('[data-cy="edit-rink-connection-vpn-id-information"]').should('not.exist')
        cy.get('[data-cy="edit-rink-connection-vpn-id-select-form"]').should('not.exist')
        // VPN接続通信アドレス
        cy.get('[data-cy="edit-rink-connection-vpn-connection-prefix"]').should('not.exist')
        // 特定通信ブレイクアウト
        cy.get('[data-cy="edit-rink-connection-break-out-list"]').should('not.exist')
        // カスタムローカルブレイクアウト
        cy.get('[data-cy="edit-rink-connection-local-break-out-list"]').should('not.exist')
        // DNSサーバIPアドレス
        cy.get('[data-cy="edit-rink-connection-use-dns-server"]').should('not.exist')

        // 入力不可項目
        // 回線認証用ドメイン名
        if (original.authDomainName) {
          cy.get('[data-cy="edit-rink-connection-auth-domain-name"]').should('have.text', original.authDomainName)
        } else {
          cy.get('[data-cy="edit-rink-connection-auth-domain-name"]').should('not.exist')
        }
        // APN
        cy.get('[data-cy="edit-rink-connection-apn"]').should('have.text', original.apn)
        // 国内通信冗長利用
        cy.get('[data-cy="edit-rink-connection-poi-redundancy"]')
          .find('.radio.checked.disabled')
          .find(`.label.${original.poiRedundancy}`)
          .should('have.length', 1)
        // アクティブ側のプレフィックスリスト
        cy.get('[data-cy="edit-rink-connection-line-act-prefix"]')
          .find('input')
          .should('have.value', original.lineActPrefix[0])
          .should('be.disabled')
        // スタンバイ側のプレフィックスリスト
        if (original.poiRedundancy) {
          cy.get('[data-cy="edit-rink-connection-line-sby-prefix"]')
            .find('input')
            .should('have.value', original.lineSbyPrefix[0])
            .should('be.disabled')
        } else {
          cy.get('[data-cy="edit-rink-connection-line-sby-prefix"]').should('not.exist')
        }

        // 確認画面に遷移
        cy.get('@submitButton').click()
        // PUT実行
        cy.get('@submitButton').click()
        cy.wait('@putRinkConnection').then(req => {
          expect(req.request.body).to.deep.equals({
            ...edit,
            connectionType,
            timeFrame: scheduleNetworks[0],
          })
        })

        // 完了ダイアログ
        cy.url().should('include', `/tenants/${this.tenantId}/rink-mobile/connections`)
        cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('message.finished'))
        cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
        cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('rinkConnections.moveToTop'))
      })
    })
  })

  context('受付時間外メッセージの表示を確認', function () {
    it('受付時間外 - 日本時間(20:00)', function () {
      cy.clock(new Date(new Date().setHours(20, 0, 0, 0)), ['Date'])
      cy.intercept('GET', `**/rink-mobile/v1/tenants/*/rink-connections/self-add/${RINK_MOBILE_ID}`, {
        fixture: `rink-mobile/connections/detail-${RinkConnectionTypes.VpnBreakOut}`,
      }).as('getRinkConnection')

      // 設備申込画面に遷移
      cy.visit(`/tenants/${this.tenantId}/rink-mobile/connections`)
      // 変更ボタンを押下
      cy.get('[data-cy="rink-mobile-connections-index-edit-button"]').click()
      cy.wait(['@getRinkConnectionList', '@getSummaryVpnList', '@getAvailableLinePrefix', '@getScheduleNetworks'])

      // 時間外メッセージ表示確認
      cy.get('[data-cy="rink-mobile-connections-edit-outside-reception-hour"]').should('exist')

      // モバイルアクセスIDを選択
      cy.inputSelectForm({
        selector: '[data-cy="rink-mobile-connections-edit-rink-mobile-id"]',
        value: RINK_MOBILE_ID,
      })
      cy.wait(['@getRinkConnection'])

      // 変更メニュー選択
      inputEditMenu(RinkConnectionEditTypes.DnsServer)
      cy.get('[data-cy="rink-mobile-connections-edit-dns-ip-address-primary"]').find('input').clear().type('1.1.1.1')
      cy.get('[data-cy="rink-mobile-connections-edit-dns-ip-address-secondary"]').find('input').clear().type('2.2.2.2')
      cy.inputTimeFrame({
        className: '[data-cy="rink-mobile-connections-edit-time-frame"]',
        scheduleNetworks,
      })
      // 適当な値を入れても確認ボタンが非活性の状態なことを確認する
      cy.get('[data-cy="rink-mobile-connections-edit-submit-button"]').should('be.disabled')
    })

    it('受付時間外 - 日本時間(23:59)', function () {
      cy.clock(new Date(new Date().setHours(23, 59, 59, 59)), ['Date'])

      cy.intercept('GET', `**/rink-mobile/v1/tenants/*/rink-connections/self-add/${RINK_MOBILE_ID}`, {
        fixture: `rink-mobile/connections/detail-${RinkConnectionTypes.InternetOnly}`,
      }).as('getRinkConnection')

      // 設備申込画面に遷移
      cy.visit(`/tenants/${this.tenantId}/rink-mobile/connections`)
      // 変更ボタンを押下
      cy.get('[data-cy="rink-mobile-connections-index-edit-button"]').click()
      cy.wait(['@getRinkConnectionList', '@getSummaryVpnList', '@getAvailableLinePrefix', '@getScheduleNetworks'])

      // 時間外メッセージ表示確認
      cy.get('[data-cy="rink-mobile-connections-edit-outside-reception-hour"]').should('exist')
    })
  })
})
