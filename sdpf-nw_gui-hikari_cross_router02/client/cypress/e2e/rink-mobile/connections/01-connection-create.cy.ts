import { MAX_BREAKOUT_COUNT, RinkConnectionTypes } from '@app/api/rinkConnections/constants'
import { generateRandomHex, t, getScheduleNetworks, stripPrefix } from '@cypress/support/utils'

const scheduleNetworks = getScheduleNetworks()
const ExpectedReservedConstructionDate = `${t('rinkConnections.reservedConstructionDate')}: 2025/12/21`
const ExpectedCancellationDeadline = `${t('rinkConnections.cancellationDeadline')}: 2025/12/12 10:00`

const ExpectedInitialDnsIpAddress = {
  primary: '202.234.232.6/32',
  secondary: '221.113.139.250/32',
}

describe('設備新規作成テスト', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)
    this.rinkMobileId = generateRandomHex(32)
    this.orderId = generateRandomHex(32)

    // 回線新規作成画面用のAPIモック
    cy.intercept('GET', '**/rink-mobile/v1/tenants/*/rink-connections/pre-self-only', {
      fixture: 'rink-mobile/connections/list',
    }).as('getRinkConnectionList')

    cy.intercept('GET', '**/ztgict/v1/resource-summary/vpns', { fixture: 'vpns/list' }).as('getSummaryVpnList')
    cy.intercept('GET', '**/rink-mobile/v1/tenants/*/available-line-prefix/self-only', {
      fixture: 'rink-mobile/connections/available-line-prefix',
    }).as('getAvailableLinePrefix')
    cy.intercept(
      'GET',
      '**/rink-mobile/v1/tenants/*/schedule-network/self-only?orderType=create-network-rinkConnection',
      {
        body: { scheduleNetworks },
      },
    ).as('getScheduleNetworks')
    cy.intercept('POST', '**/rink-mobile/v1/tenants/*/rink-connections/self-only', {
      body: { id: this.orderId, zId: this.rinkMobileId },
    }).as('postRinkConnection')

    cy.intercept('GET', `**/ztgict/v1/orders/${this.orderId}`, {
      fixture: 'orders/rink-mobile-connection-create-applied',
    }).as('getOrder')

    // 回線新規申込画面に遷移した時のAPIモック
    cy.intercept(
      'GET',
      `**/rink-mobile/v1/tenants/*/rink-connections/available-plan-limit/${this.rinkMobileId}`,
      {},
    ).as('getAvailablePlanLimit')
    cy.intercept('GET', `**/rink-mobile/v1/tenants/*/rink-connections/linePrefix/${this.rinkMobileId}`, {
      fixture: 'rink-mobile/connections/available-line-prefix',
    }).as('getRinkConnectionLinePrefix')

    // 設備申込画面に遷移
    cy.visit(`/tenants/${this.tenantId}/rink-mobile/connections`)
  })

  context('メンテナンス期間中の表示', function () {
    it('案内文が表示され、各申込ボタンが活性になる', function () {
      cy.clock(new Date('2026-07-18T10:00:00+09:00'), ['Date'])

      cy.visit(`/tenants/${this.tenantId}/rink-mobile/connections`)

      cy.get('[data-cy="rink-mobile-connections-index-maintenance-notification"]').should('exist')
      cy.get('[data-cy="rink-mobile-connections-index-create-button"]').should('not.be.disabled')
      cy.get('[data-cy="rink-mobile-connections-index-edit-button"]').should('not.be.disabled')
      cy.get('[data-cy="rink-mobile-connections-index-remove-button"]').should('not.be.disabled')
    })
  })

  it('1　インターネット通信利用 - 受付時間内(00:00)', function () {
    cy.clock(new Date(new Date().setHours(0, 0, 0, 0)), ['Date'])

    cy.fixture('rink-mobile/connections/create').then(createData => {
      const connectionType = RinkConnectionTypes.InternetOnly
      const data = createData[connectionType]

      // 新規作成画面に遷移
      cy.get('[data-cy="rink-mobile-connections-index-create-button"]').click()
      cy.wait(['@getSummaryVpnList', '@getAvailableLinePrefix', '@getScheduleNetworks'])

      // 時間外文言が非表示であることを確認
      cy.get('[data-cy="rink-mobile-connections-create-outside-reception-hour"]').should('not.exist')

      // 構成パターン初期値
      cy.get('[data-cy="edit-rink-connection-connection-type"]').find('.radio.checked').should('have.length', 0)
      // ボタン初期値
      cy.get('[data-cy="rink-mobile-connections-create-cancel-button"]')
        .as('cancelButton')
        .should('have.text', t('common.cancel'))
        .and('not.be.disabled')
      cy.get('[data-cy="rink-mobile-connections-create-submit-button"]')
        .as('submitButton')
        .should('have.text', t('common.confirm'))
        .and('be.disabled')

      // 構成パターン選択
      cy.get('[data-cy="edit-rink-connection-connection-type"]').find(`.label.${connectionType}`).click()

      // [国内通信冗長利用] 初期値
      cy.get('[data-cy="edit-rink-connection-poi-redundancy"]')
        .find('.radio.checked')
        .find('.label.false')
        .should('have.length', 1)

      // 非表示項目
      cy.get('[data-cy="edit-rink-connection-vpn-id-select-form"]').should('not.exist')
      cy.get('[data-cy="edit-rink-connection-vpn-id-information"]').should('not.exist')
      cy.get('[data-cy="edit-rink-connection-break-out-list"]').should('not.exist')
      cy.get('[data-cy="edit-rink-connection-custom-local-break-out-list"]').should('not.exist')
      cy.get('[data-cy="edit-rink-connection-vpn-connection-prefix"]').should('not.exist')
      cy.get('[data-cy="edit-rink-connection-use-dns-server"]').should('not.exist')
      cy.get('[data-cy="edit-rink-connection-line-sby-prefix"]').should('not.exist')
      cy.get('[data-cy="edit-rink-connection-vpn-network-prefix"]').should('not.exist')
      cy.get('[data-cy="edit-rink-connection-auth-domain-name"]').should('not.exist')

      // 入力
      cy.get('[data-cy="edit-rink-connection-dns-ip-address-primary"]')
        .find('input')
        .should('have.value', stripPrefix(ExpectedInitialDnsIpAddress.primary))
      cy.get('[data-cy="edit-rink-connection-dns-ip-address-secondary"]')
        .find('input')
        .should('have.value', stripPrefix(ExpectedInitialDnsIpAddress.secondary))
      cy.get('[data-cy="edit-rink-connection-poi-redundancy"]').find(`.label.${data.poiRedundancy}`).click()

      cy.inputSelectForm({
        selector: '[data-cy="edit-rink-connection-line-act-prefix"]',
        value: data.lineActPrefix[0],
      })
      cy.inputSelectForm({
        selector: '[data-cy="edit-rink-connection-line-sby-prefix"]',
        value: data.lineSbyPrefix[0],
      })

      // 利用開始希望日の入力
      cy.get('[data-cy="edit-rink-connection-time-frame"]').should('not.exist')
      cy.inputDatePicker({
        className: '[data-cy="edit-rink-connection-time-frame-date-picker"]',
        date: scheduleNetworks[0],
      })

      // 確認ボタンを押下
      cy.get('@submitButton').click()
      // 確認画面表示
      cy.get('@submitButton').should('have.text', t('common.create')).click()
      cy.wait('@postRinkConnection').then(req => {
        expect(req.request.body).to.deep.equals({
          ...data,
          connectionType,
          dnsIpAddressPrimary: ExpectedInitialDnsIpAddress.primary,
          dnsIpAddressSecondary: ExpectedInitialDnsIpAddress.secondary,
          timeFrame: scheduleNetworks[0],
        })
      })

      cy.wait('@getOrder')

      // 完了ダイアログ
      cy.url().should('include', `/tenants/${this.tenantId}/rink-mobile/connections/create`)
      cy.get('[data-cy="rink-mobile-connections-create-dialog-message"]').should('have.text', t('message.created'))
      cy.get('[data-cy="rink-mobile-connections-create-dialog-reserved-construction-date"]').should(
        'have.text',
        ExpectedReservedConstructionDate,
      )
      cy.get('[data-cy="rink-mobile-connections-create-dialog-cancellation-deadline"]').should(
        'have.text',
        ExpectedCancellationDeadline,
      )
      cy.get('.dialog-base-submit-button').should('have.text', t('rinkConnections.moveToCreateLine')).click()

      // 回線の新規作成画面に遷移する
      cy.wait(['@getRinkConnectionList', '@getAvailablePlanLimit', '@getRinkConnectionLinePrefix'])
      cy.url().should('include', `/tenants/${this.tenantId}/rink-mobile/lines/create`)

      // this.rinkMobileId が設備IDにセットされていること
      cy.get('[data-cy="rink-mobile-lines-create-rink-mobile-id"]')
        .find('input')
        .should('have.value', this.rinkMobileId)
        .should('be.disabled')
    })
  })

  it('2　インターネット通信利用+VPN通信利用 - 受付時間内(00:00)', function () {
    cy.clock(new Date(new Date().setHours(0, 0, 0, 0)), ['Date'])

    cy.fixture('rink-mobile/connections/create').then(createData => {
      const connectionType = RinkConnectionTypes.InternetVpn
      const data = createData[connectionType]

      // 新規作成画面に遷移
      cy.get('[data-cy="rink-mobile-connections-index-create-button"]').click()
      cy.wait(['@getSummaryVpnList', '@getAvailableLinePrefix', '@getScheduleNetworks'])
      // 構成パターン選択
      cy.get('[data-cy="edit-rink-connection-connection-type"]').find(`.label.${connectionType}`).click()

      // 非表示項目
      cy.get('[data-cy="edit-rink-connection-vpn-id-information"]').should('not.exist')
      cy.get('[data-cy="edit-rink-connection-use-dns-server"]').should('not.exist')
      cy.get('[data-cy="edit-rink-connection-break-out-list"]').should('not.exist')
      cy.get('[data-cy="edit-rink-connection-line-sby-prefix"]').should('not.exist')
      cy.get('[data-cy="edit-rink-connection-custom-local-break-out-list"]').should('not.exist')
      cy.get('[data-cy="edit-rink-connection-auth-domain-name"]').should('not.exist')

      // 入力項目
      cy.inputSelectForm({ selector: '[data-cy="edit-rink-connection-vpn-id-select-form"]', value: data.vpnId })
      cy.get('[data-cy="edit-rink-connection-vpn-connection-prefix"]').type(data.vpnConnectionPrefix.join('\n'))
      cy.get('[data-cy="edit-rink-connection-dns-ip-address-primary"]')
        .find('input')
        .should('have.value', stripPrefix(ExpectedInitialDnsIpAddress.primary))
        .clear()
        .type(stripPrefix(data.dnsIpAddressPrimary))
      cy.get('[data-cy="edit-rink-connection-dns-ip-address-secondary"]')
        .find('input')
        .should('have.value', stripPrefix(ExpectedInitialDnsIpAddress.secondary))
        .clear()
        .type(stripPrefix(data.dnsIpAddressSecondary))
      cy.get('[data-cy="edit-rink-connection-poi-redundancy"]').find(`.label.${data.poiRedundancy}`).click()
      cy.inputSelectForm({
        selector: '[data-cy="edit-rink-connection-line-act-prefix"]',
        value: data.lineActPrefix[0],
      })
      cy.get('[data-cy="edit-rink-connection-vpn-network-prefix"]')
        .find('input')
        .type(stripPrefix(data.vpnNetworkPrefix))

      // 利用開始希望日の入力
      cy.get('[data-cy="edit-rink-connection-time-frame"]').should('not.exist')
      cy.inputDatePicker({
        className: '[data-cy="edit-rink-connection-time-frame-date-picker"]',
        date: scheduleNetworks[0],
      })

      // 確認ボタンを押下
      cy.get('[data-cy="rink-mobile-connections-create-submit-button"]').click()
      // 確認画面表示
      cy.get('[data-cy="rink-mobile-connections-create-submit-button"]').click()
      cy.wait('@postRinkConnection').then(req => {
        expect(req.request.body).to.deep.equals({
          ...data,
          connectionType,
          timeFrame: scheduleNetworks[0],
        })
      })
      cy.wait('@getOrder')

      // 完了ダイアログ
      cy.url().should('include', `/tenants/${this.tenantId}/rink-mobile/connections/create`)
      cy.get('[data-cy="rink-mobile-connections-create-dialog-message"]').should('have.text', t('message.created'))
      cy.get('[data-cy="rink-mobile-connections-create-dialog-reserved-construction-date"]').should(
        'have.text',
        ExpectedReservedConstructionDate,
      )
      cy.get('[data-cy="rink-mobile-connections-create-dialog-cancellation-deadline"]').should(
        'have.text',
        ExpectedCancellationDeadline,
      )
      // 閉じるボタンを押下する
      cy.get('.dialog-card-close').should('have.text', t('common.close')).click()
      // 直前の画面に遷移する
      cy.url().should('include', `/tenants/${this.tenantId}/rink-mobile/connections`)
    })
  })

  it('3　VPN通信利用 - 受付時間内(19:59)', function () {
    cy.clock(new Date(new Date().setHours(19, 59, 59, 59)), ['Date'])

    cy.fixture('rink-mobile/connections/create').then(createData => {
      const connectionType = RinkConnectionTypes.VpnOnly
      const data = createData[connectionType]

      // 新規作成画面に遷移
      cy.get('[data-cy="rink-mobile-connections-index-create-button"]').click()
      cy.wait(['@getSummaryVpnList', '@getAvailableLinePrefix', '@getScheduleNetworks'])
      // 時間外文言が非表示であることを確認
      cy.get('[data-cy="rink-mobile-connections-create-outside-reception-hour"]').should('not.exist')
      // 構成パターン選択
      cy.get('[data-cy="edit-rink-connection-connection-type"]').find(`.label.${connectionType}`).click()

      // 非表示項目
      cy.get('[data-cy="edit-rink-connection-vpn-id-information"]').should('not.exist')
      cy.get('[data-cy="edit-rink-connection-break-out-list"]').should('not.exist')
      cy.get('[data-cy="edit-rink-connection-custom-local-break-out-list"]').should('not.exist')
      cy.get('[data-cy="edit-rink-connection-vpn-connection-prefix"]').should('not.exist')
      cy.get('[data-cy="edit-rink-connection-line-sby-prefix"]').should('not.exist')
      cy.get('[data-cy="edit-rink-connection-auth-domain-name"]').should('not.exist')

      // DNSサーバIPアドレスの制御確認
      cy.get('[data-cy="edit-rink-connection-use-dns-server"]')
        .find('.radio.checked')
        .find('.label.true')
        .should('have.length', 1)
      cy.get('[data-cy="edit-rink-connection-dns-ip-address-primary"]')
        .find('input')
        .should('have.value', stripPrefix(ExpectedInitialDnsIpAddress.primary))
        .clear()
        .type('test')
      cy.get('[data-cy="edit-rink-connection-dns-ip-address-secondary"]')
        .find('input')
        .should('have.value', stripPrefix(ExpectedInitialDnsIpAddress.secondary))
      cy.get('[data-cy="edit-rink-connection-use-dns-server"]').find('.label.false').click()
      cy.get('[data-cy="edit-rink-connection-dns-ip-address-primary"]').should('not.exist')
      cy.get('[data-cy="edit-rink-connection-dns-ip-address-secondary"]').should('not.exist')

      // 入力項目
      cy.inputSelectForm({ selector: '[data-cy="edit-rink-connection-vpn-id-select-form"]', value: data.vpnId })
      cy.get('[data-cy="edit-rink-connection-poi-redundancy"]').find(`.label.${data.poiRedundancy}`).click()
      cy.inputSelectForm({
        selector: '[data-cy="edit-rink-connection-line-act-prefix"]',
        value: data.lineActPrefix[0],
      })
      cy.get('[data-cy="edit-rink-connection-vpn-network-prefix"]')
        .find('input')
        .type(stripPrefix(data.vpnNetworkPrefix))

      // 利用開始希望日の入力
      cy.get('[data-cy="edit-rink-connection-time-frame"]').should('not.exist')
      cy.inputDatePicker({
        className: '[data-cy="edit-rink-connection-time-frame-date-picker"]',
        date: scheduleNetworks[0],
      })

      // 確認ボタンを押下
      cy.get('[data-cy="rink-mobile-connections-create-submit-button"]').click()
      // 確認画面表示
      cy.get('[data-cy="rink-mobile-connections-create-submit-button"]').click()
      cy.wait('@postRinkConnection').then(req => {
        expect(req.request.body).to.deep.equals({
          ...data,
          connectionType,
          timeFrame: scheduleNetworks[0],
        })
      })
      cy.wait('@getOrder')

      // 完了ダイアログ
      cy.url().should('include', `/tenants/${this.tenantId}/rink-mobile/connections/create`)
      cy.get('[data-cy="rink-mobile-connections-create-dialog-message"]').should('have.text', t('message.created'))
      cy.get('[data-cy="rink-mobile-connections-create-dialog-reserved-construction-date"]').should(
        'have.text',
        ExpectedReservedConstructionDate,
      )
      cy.get('[data-cy="rink-mobile-connections-create-dialog-cancellation-deadline"]').should(
        'have.text',
        ExpectedCancellationDeadline,
      )
      // 閉じるボタンを押下する
      cy.get('.dialog-base-cancel-button').should('have.text', t('common.close')).click()
      // 直前の画面に遷移する
      cy.url().should('include', `/tenants/${this.tenantId}/rink-mobile/connections`)
    })
  })

  it('4　VPN通信利用+特定通信ブレイクアウト利用 - 受付時間内(00:00)', function () {
    cy.clock(new Date(new Date().setHours(0, 0, 0, 0)), ['Date'])

    cy.fixture('rink-mobile/connections/create').then(createData => {
      const connectionType = RinkConnectionTypes.VpnBreakOut
      const data = createData[connectionType]

      // 新規作成画面に遷移
      cy.get('[data-cy="rink-mobile-connections-index-create-button"]').click()
      cy.wait(['@getSummaryVpnList', '@getAvailableLinePrefix', '@getScheduleNetworks'])
      // 構成パターン選択
      cy.get('[data-cy="edit-rink-connection-connection-type"]').find(`.label.${connectionType}`).click()

      // 非表示項目
      cy.get('[data-cy="edit-rink-connection-vpn-id-information"]').should('not.exist')
      cy.get('[data-cy="edit-rink-connection-use-dns-server"]').should('not.exist')
      cy.get('[data-cy="edit-rink-connection-vpn-connection-prefix"]').should('not.exist')
      cy.get('[data-cy="edit-rink-connection-line-sby-prefix"]').should('not.exist')
      cy.get('[data-cy="edit-rink-connection-auth-domain-name"]').should('not.exist')

      // 入力項目
      cy.inputSelectForm({ selector: '[data-cy="edit-rink-connection-vpn-id-select-form"]', value: data.vpnId })
      data.systemLocalBreakOutList.forEach(({ name }: { name: string }) => {
        cy.get('[data-cy="edit-rink-connection-break-out-list"]').find(`.label.${name}`).click()
      })
      // カスタムローカルブレイクアウトの入力、最大数は8件-特定通信ブレイクアウト選択数
      cy.inputEditCustomLocalBreakOutList({
        customLocalBreakOutList: data.customLocalBreakOutList,
        maxItems: MAX_BREAKOUT_COUNT - data.systemLocalBreakOutList.length,
        className: '[data-cy="edit-rink-connection-custom-local-break-out-list"]',
      })
      cy.assertSystemLocalBreakOutList({
        systemLocalBreakOutList: data.systemLocalBreakOutList,
        customLocalBreakOutList: data.customLocalBreakOutList,
        className: '[data-cy="edit-rink-connection-break-out-list"]',
      })
      cy.get('[data-cy="edit-rink-connection-dns-ip-address-primary"]')
        .find('input')
        .should('have.value', stripPrefix(ExpectedInitialDnsIpAddress.primary))
        .clear()
        .type(stripPrefix(data.dnsIpAddressPrimary))
      cy.get('[data-cy="edit-rink-connection-dns-ip-address-secondary"]')
        .find('input')
        .should('have.value', stripPrefix(ExpectedInitialDnsIpAddress.secondary))
        .clear()
        .type(stripPrefix(data.dnsIpAddressSecondary))
      cy.get('[data-cy="edit-rink-connection-poi-redundancy"]').find(`.label.${data.poiRedundancy}`).click()
      cy.inputSelectForm({
        selector: '[data-cy="edit-rink-connection-line-act-prefix"]',
        value: data.lineActPrefix[0],
      })
      cy.inputSelectForm({
        selector: '[data-cy="edit-rink-connection-line-sby-prefix"]',
        value: data.lineSbyPrefix[0],
      })
      cy.get('[data-cy="edit-rink-connection-vpn-network-prefix"]')
        .find('input')
        .type(stripPrefix(data.vpnNetworkPrefix))

      // 利用開始希望日の入力
      cy.get('[data-cy="edit-rink-connection-time-frame"]').should('not.exist')
      cy.inputDatePicker({
        className: '[data-cy="edit-rink-connection-time-frame-date-picker"]',
        date: scheduleNetworks[0],
      })

      // 確認ボタンを押下
      cy.get('[data-cy="rink-mobile-connections-create-submit-button"]').click()
      // 確認画面表示
      cy.get('[data-cy="rink-mobile-connections-create-submit-button"]').click()
      cy.wait('@postRinkConnection').then(req => {
        expect(req.request.body).to.deep.equals({
          ...data,
          ...(data.customLocalBreakOutList && {
            customLocalBreakOutList: data.customLocalBreakOutList.slice(
              0,
              MAX_BREAKOUT_COUNT - data.systemLocalBreakOutList.length,
            ),
          }),
          connectionType,
          timeFrame: scheduleNetworks[0],
        })
      })
      cy.wait('@getOrder')

      // 完了ダイアログ
      cy.url().should('include', `/tenants/${this.tenantId}/rink-mobile/connections/create`)
      cy.get('[data-cy="rink-mobile-connections-create-dialog-message"]').should('have.text', t('message.created'))
      cy.get('[data-cy="rink-mobile-connections-create-dialog-reserved-construction-date"]').should(
        'have.text',
        ExpectedReservedConstructionDate,
      )
      cy.get('[data-cy="rink-mobile-connections-create-dialog-cancellation-deadline"]').should(
        'have.text',
        ExpectedCancellationDeadline,
      )
      cy.get('.dialog-base-submit-button').should('have.text', t('rinkConnections.moveToCreateLine')).click()

      // 回線の新規作成画面に遷移する
      cy.wait(['@getRinkConnectionList', '@getAvailablePlanLimit', '@getRinkConnectionLinePrefix'])
      cy.url().should('include', `/tenants/${this.tenantId}/rink-mobile/lines/create`)

      // this.rinkMobileId が設備IDにセットされていること
      cy.get('[data-cy="rink-mobile-lines-create-rink-mobile-id"]')
        .find('input')
        .should('have.value', this.rinkMobileId)
        .should('be.disabled')
    })
  })

  context('受付時間外メッセージの表示を確認', function () {
    it('受付時間外 - 日本時間(23:59)', function () {
      cy.clock(new Date(new Date().setHours(23, 59, 59, 59)), ['Date'])

      // 新規作成画面に遷移
      cy.get('[data-cy="rink-mobile-connections-index-create-button"]').click()
      cy.wait(['@getSummaryVpnList', '@getAvailableLinePrefix', '@getScheduleNetworks'])

      // 時間外文言が表示されることを確認
      cy.get('[data-cy="rink-mobile-connections-create-outside-reception-hour"]').should('exist')
      cy.fixture('rink-mobile/connections/create').then(createData => {
        const connectionType = RinkConnectionTypes.InternetOnly
        const data = createData[connectionType]
        // 構成パターン選択
        cy.get('[data-cy="edit-rink-connection-connection-type"]').find(`.label.${connectionType}`).click()
        // 入力
        cy.get('[data-cy="edit-rink-connection-dns-ip-address-primary"]')
          .find('input')
          .should('have.value', stripPrefix(ExpectedInitialDnsIpAddress.primary))
          .clear()
          .type(stripPrefix(data.dnsIpAddressPrimary))
        cy.get('[data-cy="edit-rink-connection-dns-ip-address-secondary"]')
          .find('input')
          .should('have.value', stripPrefix(ExpectedInitialDnsIpAddress.secondary))
          .clear()
          .type(stripPrefix(data.dnsIpAddressSecondary))
        cy.get('[data-cy="edit-rink-connection-poi-redundancy"]').find(`.label.${data.poiRedundancy}`).click()

        cy.inputSelectForm({
          selector: '[data-cy="edit-rink-connection-line-act-prefix"]',
          value: data.lineActPrefix[0],
        })
        cy.inputSelectForm({
          selector: '[data-cy="edit-rink-connection-line-sby-prefix"]',
          value: data.lineSbyPrefix[0],
        })

        // 利用開始希望日の入力
        cy.get('[data-cy="edit-rink-connection-time-frame"]').should('not.exist')
        cy.inputDatePicker({
          className: '[data-cy="edit-rink-connection-time-frame-date-picker"]',
          date: scheduleNetworks[0],
        })

        // 必要な情報を入力後も確認ボタンが押せないことを確認する
        cy.get('[data-cy="rink-mobile-connections-create-submit-button"]')
          .should('have.text', t('common.confirm'))
          .and('be.disabled')
      })
    })

    it('受付時間外 - 日本時間(20:00)', function () {
      cy.clock(new Date(new Date().setHours(20, 0, 0, 0)), ['Date'])

      // 新規作成画面に遷移
      cy.get('[data-cy="rink-mobile-connections-index-create-button"]').click()
      cy.wait(['@getSummaryVpnList', '@getAvailableLinePrefix', '@getScheduleNetworks'])

      // 時間外文言が表示されることを確認
      cy.get('[data-cy="rink-mobile-connections-create-outside-reception-hour"]').should('exist')
    })
  })
})
