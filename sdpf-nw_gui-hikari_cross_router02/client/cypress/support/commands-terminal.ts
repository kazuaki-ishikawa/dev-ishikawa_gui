import dayjs from 'dayjs'
import {
  CircuitTypes,
  SecurityOptionTypes,
  BehaviorDetectionOptionTypes,
  TerminalDeviceTypes,
  TrafficReportFlowAnalyzerPlanTypes,
  BreakOutTypes,
} from '@app/api/constants'
import {
  type initialVpnNatsInputData,
  type initialWanStaticRoutesInputData,
  type initialAccessControlInputData,
  NetworkTypes,
  NatTypesText,
  LansTypes,
  LanTypes,
  ActionTypes,
} from '@app/api/terminals/constants'
import type { TerminalWanStaticType, TerminalLansType } from '@app/api/terminals/types'
import {
  t,
  getShowPicIdentificationNumber,
  getShowPicIdentificationBackDocumentFile,
  getShowPicIdentificationAdditionalDocumentFile,
  getShowPicAuxiliaryIdentificationDocumentType,
  getShowPicEmployeeCode,
  getTrafficReportFlowAnalyzerPlanInputValue,
  getTrafficReportFlowAnalyzerAlertInputValue,
  getThreatDetectionPlanInputValue,
  getFlowCollectorPlanInputValue,
  getBehaviorDetectionPlanInputValue,
  getTermsLinkButtonLabel,
  stripPrefix,
} from '@cypress/support/utils'

Cypress.Commands.add('inputBreakOut', params => {
  const breakOutList = params.breakOut.map((value: string) =>
    (Object.values(BreakOutTypes) as string[]).includes(value)
      ? t(`terminals.${value}`)
      : params.breakOutList.find(breakOut => breakOut.breakOutListId === value)?.customerNote,
  )

  // 状態の確認
  cy.get(params.breakOutClassName).find('input').should('have.value', '')
  cy.get(params.breakOutDnsServersClassName).should('not.exist')
  cy.get(params.breakOutClassName).find('input').click()
  cy.get(params.breakOutClassName).find('li').eq(0).should('have.text', t('breakOut.unselected')).click()
  cy.get(params.breakOutDnsServersClassName).should('not.exist')

  // 入力項目がない場合はない場合は「利用無し」の状態で終了
  if (breakOutList.length > 0) {
    // 特定通信ブレイクアウトの入力
    cy.get(params.breakOutClassName).find('input').click()
    breakOutList.filter(Boolean).forEach(value => {
      cy.get(params.breakOutClassName)
        .find('li')
        .contains(new RegExp(`^${value}$`))
        .click()
    })
    // セレクトリストを閉じる
    cy.get('body').click(0, 0)
    // ブレイクアウトDNSサーバーの入力
    params.interceptDnsServers.forEach((value: string, index: number) => {
      if (breakOutList.length === 0 || index > 0) {
        cy.get(params.breakOutDnsServersClassName).find('.multiple-add').find('button').click()
      }
      cy.get(params.breakOutDnsServersClassName).find('input').last().type(value)
    })
  }
})
Cypress.Commands.add('inputEditVpnNats', params => {
  cy.removeRowEditTable({ className: params.className })
  params.vpnNats?.forEach((vpnNats: typeof initialVpnNatsInputData) => {
    cy.get(params.className).find('.multiple-add').find('button').click()
    cy.get(params.className).find('[data-cy="edit-vpn-nats-type"]').last().find(`.label.${vpnNats.type}`).click()
    cy.get(params.className)
      .find('[data-cy="edit-vpn-nats-inner-ipv4-prefix"]')
      .find('input')
      .last()
      .type(vpnNats.innerIpv4Prefix)
    cy.get(params.className)
      .find('[data-cy="edit-vpn-nats-outer-ipv4-prefix"]')
      .find('input')
      .last()
      .type(vpnNats.outerIpv4Prefix)
  })
})
Cypress.Commands.add('inputEditLans', params => {
  cy.removeRowEditTable({ className: params.className })
  const isRoutedPort = params.lanType === LanTypes.RoutedPort

  // 既存のLANのportNumberを追跡（routedPortの場合）
  const usedPortNumbers: string[] = []

  params.lans.forEach((lan: TerminalLansType, lanIndex: number) => {
    cy.get(params.className).find('.edit-table-container').find('.edit-table-add-button').click()

    if (isRoutedPort) {
      cy.get('[data-cy="edit-lans-lan-type"]').should('not.exist')
      // 他のLANが使っているportNumberは非活性であることを確認
      usedPortNumbers.forEach(portNumber => {
        cy.get('[data-cy="edit-lans-port-number"]').find(`.label.${portNumber}`).should('not.exist')
      })
      cy.get('[data-cy="edit-lans-port-number"]').find(`.label.${lan.portNumber}`).click()
      usedPortNumbers.push(String(lan.portNumber ?? ''))
    } else {
      // 描画が完了していないことがあるので表示を待つ
      cy.get('[data-cy="edit-lans-lan-type"]').should('be.visible')
      // switchPortの場合: 現在のインデックスより前にprimaryのLANがあるかチェック
      const hasPrimaryLan = params.lans.slice(0, lanIndex).some((l: TerminalLansType) => l.type === LansTypes.Primary)
      if (hasPrimaryLan) {
        // primaryのLANが既に追加されている場合、primaryの選択肢は表示されていないことを確認
        cy.get('[data-cy="edit-lans-lan-type"]').find('.label.primary').should('not.exist')
      }
      cy.get('[data-cy="edit-lans-lan-type"]').find(`.label.${lan.type}`).click()
      cy.get('[data-cy="edit-lans-port-number"]').should('not.exist')
    }

    cy.get('[data-cy="edit-lans-ipv4-address"]').find('input').type(lan.ipv4Address)
    cy.get('[data-cy="edit-lans-ipv4-prefix-length"]').find('input').type(lan.ipv4PrefixLength)
    cy.get('[data-cy="edit-lans-vpn-routing"]').find(`.label.${lan.vpnRouting}`).click()
    cy.inputEditVpnNats({ vpnNats: lan.vpnNats ?? [], className: '[data-cy="edit-lans-edit-vpn-nats"]' })
    if (lan.type === LansTypes.Primary) {
      // 描画が完了していないことがあるので表示を待つ
      cy.get('[data-cy="edit-lans-dhcp-type"]').should('be.visible')
      cy.get('[data-cy="edit-lans-dhcp-type"]').find(`.label.${!!lan.dhcpServer}`).click()
      if (lan.dhcpServer) {
        lan.dhcpServer.ipv4AddressRanges.forEach((value: { start: string; end: string }, index: number) => {
          if (index > 0) {
            cy.get('[data-cy="edit-lans-dhcp-server-ipv4-address-ranges"]')
              .find('.multiple-range-form-plus-button')
              .click()
          }
          cy.get('[data-cy="edit-lans-dhcp-server-ipv4-address-ranges"]')
            .find('.multiple-range-form-start-input')
            .last()
            .find('input')
            .clear()
            .type(value.start)
          cy.get('[data-cy="edit-lans-dhcp-server-ipv4-address-ranges"]')
            .find('.multiple-range-form-end-input')
            .last()
            .find('input')
            .clear()
            .type(value.end)
        })
        cy.get('[data-cy="edit-lans-dhcp-server-domain"]')
          .find('input')
          .type(lan.dhcpServer.domain ?? '')
        cy.get('[data-cy="edit-lans-dhcp-server-primary-dns-server"]')
          .find('input')
          .clear()
          .type(lan.dhcpServer.primaryDnsServer ?? '')
        cy.get('[data-cy="edit-lans-dhcp-server-secondary-dns-server"]')
          .find('input')
          .clear()
          .type(lan.dhcpServer.secondaryDnsServer ?? '')
        cy.get('[data-cy="edit-lans-dhcp-server-primary-wins-server"]')
          .find('input')
          .clear()
          .type(lan.dhcpServer.primaryWinsServer ?? '')
        cy.get('[data-cy="edit-lans-dhcp-server-secondary-wins-server"]')
          .find('input')
          .clear()
          .type(lan.dhcpServer.secondaryWinsServer ?? '')
      } else {
        cy.get('[data-cy="edit-lans-dhcp-server-ipv4-address-ranges"]').should('not.exist')
        cy.get('[data-cy="edit-lans-dhcp-server-domain"]').should('not.exist')
        cy.get('[data-cy="edit-lans-dhcp-server-primary-dns-server"]').should('not.exist')
        cy.get('[data-cy="edit-lans-dhcp-server-secondary-dns-server"]').should('not.exist')
        cy.get('[data-cy="edit-lans-dhcp-server-primary-wins-server"]').should('not.exist')
        cy.get('[data-cy="edit-lans-dhcp-server-secondary-wins-server"]').should('not.exist')
      }
      // LANポートフィルタ
      if (params.hideLanInFilters) {
        // RINKルーター02 の場合は LANポートフィルタの入力欄を表示しない
        cy.get('[data-cy="edit-lans-lan-in-filters"]').should('not.exist')
        cy.get('[data-cy="edit-lans-edit-filters"]').should('not.exist')
      } else {
        const useLanInFilters = !!lan.lanInFilters?.defaultPolicy
        cy.get('[data-cy="edit-lans-lan-in-filters"]').find(`.label.${useLanInFilters}`).click()
        if (useLanInFilters) {
          cy.inputEditFilters({
            inputData: lan.lanInFilters,
            className: '[data-cy="edit-lans-edit-filters"]',
          })
        } else {
          cy.get('[data-cy="edit-lans-edit-filters"]').should('not.exist')
        }
      }
    } else {
      cy.get('[data-cy="edit-lans-dhcp-type"]').should('not.exist')
      cy.get('[data-cy="edit-lans-dhcp-server-ipv4-address-ranges"]').should('not.exist')
      cy.get('[data-cy="edit-lans-dhcp-server-domain"]').should('not.exist')
      cy.get('[data-cy="edit-lans-dhcp-server-primary-dns-server"]').should('not.exist')
      cy.get('[data-cy="edit-lans-dhcp-server-secondary-dns-server"]').should('not.exist')
      cy.get('[data-cy="edit-lans-dhcp-server-primary-wins-server"]').should('not.exist')
      cy.get('[data-cy="edit-lans-dhcp-server-secondary-wins-server"]').should('not.exist')
      // LANポートフィルタ: secondaryの場合、編集用のEditFiltersは表示されない
      cy.get('[data-cy="edit-lans-edit-filters"]').should('not.exist')
      // PrimaryにLANポートフィルタ設定がある場合はreadonlyで表示される
      const hasPrimaryLan =
        !params.hideLanInFilters &&
        params.lans
          .slice(0, lanIndex)
          .some((l: TerminalLansType) => l.type === LansTypes.Primary && l.lanInFilters?.defaultPolicy)
      if (hasPrimaryLan) {
        cy.get('[data-cy="edit-lans-lan-in-filters"]').should('not.exist')
        cy.get('[data-cy="edit-lans-show-primary-lan-in-filters"]').should('exist')
        cy.get('[data-cy="edit-lans-edit-filters-readonly"]').should('exist')
      } else {
        cy.get('[data-cy="edit-lans-lan-in-filters"]').should('not.exist')
        cy.get('[data-cy="edit-lans-edit-filters-readonly"]').should('not.exist')
      }
    }
    cy.get('.dialog-base-submit-button').should('have.text', t('common.add')).should('not.be.disabled').click()
  })
})

Cypress.Commands.add('confirmEditLans', params => {
  const isSwitchPort = params.lanType === LanTypes.SwitchPort
  const primaryLanInFilters = params.lans.find(
    (lan: TerminalLansType) => lan.type === LansTypes.Primary && lan.lanInFilters?.defaultPolicy,
  )?.lanInFilters
  const hasPrimaryLanInFilters = !!primaryLanInFilters

  cy.get(params.className)
    .find('.edit-table-add-button')
    .should(params.disabled ? 'not.exist' : 'exist')
  cy.get(params.className)
    .find('.row')
    .should('have.length', params.lans.length)
    .each((row, index) => {
      const lan = params.lans[index]
      // switchPort: type, ipv4Address, ipv4PrefixLength, vpnRouting, vpnNats, dhcpServer, lanInFilters, [lanInFiltersCount]
      // routedPort: type, portNumber, ipv4Address, ipv4PrefixLength, vpnRouting, vpnNats, dhcpServer, lanInFilters, [lanInFiltersCount]
      const ip4AddressIndex = isSwitchPort ? 1 : 2
      // type
      cy.wrap(row)
        .find('.cell')
        .eq(0)
        .should('have.text', Object.entries(LansTypes).find(([_, value]) => lan.type === value)?.[0])
      // portNumber
      if (!isSwitchPort) {
        cy.wrap(row)
          .find('.cell')
          .eq(1)
          .should('have.text', `Ether${lan.portNumber ? Number(lan.portNumber) - 1 : ''}`)
      }
      // ipv4Address
      cy.wrap(row).find('.cell').eq(ip4AddressIndex).should('have.text', lan.ipv4Address)
      // ipv4PrefixLength
      cy.wrap(row)
        .find('.cell')
        .eq(ip4AddressIndex + 1)
        .should('have.text', lan.ipv4PrefixLength)
      // vpnRouting
      cy.wrap(row)
        .find('.cell')
        .eq(ip4AddressIndex + 2)
        .should('have.text', lan.vpnRouting ? t('common.advertise') : t('common.doNotAdvertise'))
      // vpnNats
      const vpnNatsIndex = ip4AddressIndex + 3
      if (lan.vpnNats && lan.vpnNats.length > 0) {
        cy.wrap(row)
          .find('.cell')
          .eq(vpnNatsIndex)
          .find('.vpn-nats')
          .should('have.length', lan.vpnNats.length)
          .each((vpnNatsRow, i) => {
            const nat = lan.vpnNats[i]
            const type = nat.type === 'nat' ? NatTypesText.nat : NatTypesText.partialNat
            cy.wrap(vpnNatsRow).find('div').eq(0).should('have.text', `type: ${type}`)
            cy.wrap(vpnNatsRow).find('div').eq(1).should('have.text', `inner: ${nat.innerIpv4Prefix}`)
            cy.wrap(vpnNatsRow).find('div').eq(2).should('have.text', `outer: ${nat.outerIpv4Prefix}`)
          })
      } else {
        cy.wrap(row).find('.cell').eq(vpnNatsIndex).find('.vpn-nats').should('not.exist')
      }
      // dhcpServer
      cy.wrap(row)
        .find('.cell')
        .eq(vpnNatsIndex + 1)
        .should('have.text', lan.dhcpServer ? t('common.withSettings') : t('common.noSettings'))
      // lanInFilters
      if (params.hideLanInFilters) {
        // LAN受信フィルタを利用しない場合は lanInFilters と lanInFiltersCount の列自体が表示されない
        cy.wrap(row)
          .find('.cell')
          .eq(vpnNatsIndex + 2)
          .should('not.exist')
      } else {
        const lanInFiltersText =
          lan.lanInFilters?.defaultPolicy || (lan.type !== LansTypes.Primary && hasPrimaryLanInFilters)
            ? t('common.withSettings')
            : lan.type === LansTypes.Primary
              ? t('common.noSettings')
              : ''
        cy.wrap(row)
          .find('.cell')
          .eq(vpnNatsIndex + 2)
          .should('have.text', lanInFiltersText)
        if (hasPrimaryLanInFilters || isSwitchPort) {
          const lanInFiltersCountText =
            lan.type === LansTypes.Primary
              ? `${lan.lanInFilters?.accessControlList?.length ?? 0}`
              : hasPrimaryLanInFilters
                ? `${primaryLanInFilters?.accessControlList?.length ?? 0}`
                : ''
          cy.wrap(row)
            .find('.cell')
            .eq(vpnNatsIndex + 3)
            .should('have.text', lanInFiltersCountText)
        } else {
          cy.wrap(row)
            .find('.cell')
            .eq(vpnNatsIndex + 3)
            .should('not.exist')
        }
      }
    })
})
Cypress.Commands.add('inputEditLanStaticRoutes', params => {
  cy.removeRowEditTable({ className: params.className })
  params.lanStaticRoutes?.forEach(route => {
    cy.get(params.className).find('.edit-table-container').find('.edit-table-add-button').click()
    cy.get('[data-cy="edit-lan-static-routes-destination-ipv4-prefix"]').find('input').type(route.destinationIpv4Prefix)
    cy.get('[data-cy="edit-lan-static-routes-nexthop-ipv4-address"]').find('input').type(route.nexthopIpv4Address)
    cy.get('[data-cy="edit-lan-static-routes-vpn-routing"]').find(`.label.${route.vpnRouting}`).click()
    cy.inputEditVpnNats({ vpnNats: route.vpnNats ?? [], className: '[data-cy="edit-lan-static-routes-edit-vpn-nats"]' })
    cy.get('.dialog-base-submit-button').should('have.text', t('common.add')).click()
  })
})
Cypress.Commands.add('confirmEditLanStaticRoutes', params => {
  cy.get(params.className)
    .find('.edit-table-add-button')
    .should(params.disabled ? 'not.exist' : 'exist')
  if (params.lanStaticRoutes && params.lanStaticRoutes.length > 0) {
    cy.get(params.className)
      .find('.row')
      .should('have.length', params.lanStaticRoutes.length)
      .each((row, index) => {
        const lan = params.lanStaticRoutes![index]
        cy.wrap(row).find('.cell').eq(0).should('have.text', lan.destinationIpv4Prefix)
        cy.wrap(row).find('.cell').eq(1).should('have.text', lan.nexthopIpv4Address)
        cy.wrap(row)
          .find('.cell')
          .eq(2)
          .should('have.text', lan.vpnRouting ? t('common.advertise') : t('common.doNotAdvertise'))
        if (lan.vpnNats && lan.vpnNats.length > 0) {
          cy.wrap(row)
            .find('.cell')
            .eq(3)
            .find('.vpn-nats')
            .should('have.length', lan.vpnNats.length)
            .each((vpnNatsRow, i) => {
              const vpnNats = lan.vpnNats![i]
              const type = vpnNats.type === 'nat' ? NatTypesText.nat : NatTypesText.partialNat
              cy.wrap(vpnNatsRow).find('div').eq(0).should('have.text', `type: ${type}`)
              cy.wrap(vpnNatsRow).find('div').eq(1).should('have.text', `inner: ${vpnNats.innerIpv4Prefix}`)
              cy.wrap(vpnNatsRow).find('div').eq(2).should('have.text', `outer: ${vpnNats.outerIpv4Prefix}`)
            })
        } else {
          cy.wrap(row).find('.cell').eq(3).find('.vpn-nats').should('not.exist')
        }
      })
  } else {
    cy.get(params.className).find('.row').should('have.length', 0)
  }
})
Cypress.Commands.add('inputEditWanStaticRoutes', params => {
  cy.removeRowEditTable({ className: params.className })
  params.wanStaticRoutes?.forEach((route: typeof initialWanStaticRoutesInputData) => {
    cy.get(params.className).find('.edit-table-container').find('.edit-table-add-button').click()
    cy.get('[data-cy="edit-wan-static-routes-destination-ipv4-prefix"]').find('input').type(route.destinationIpv4Prefix)
    cy.inputSelectForm({ selector: '[data-cy="edit-wan-static-routes-nexthop-network"]', value: route.nexthopNetwork })
    cy.get('.dialog-base-submit-button').should('have.text', t('common.add')).click()
  })
})
Cypress.Commands.add('confirmEditWanStaticRoutes', params => {
  cy.get(params.className)
    .find('.edit-table-add-button')
    .should(params.disabled ? 'not.exist' : 'exist')
  if (params.wanStaticRoutes && params.wanStaticRoutes.length > 0) {
    cy.get(params.className)
      .find('.row')
      .should('have.length', params.wanStaticRoutes.length)
      .each((row, index) => {
        const wan = params.wanStaticRoutes![index]
        cy.wrap(row).find('.cell').eq(0).should('have.text', wan.destinationIpv4Prefix)
        cy.wrap(row)
          .find('.cell')
          .eq(1)
          .should('have.text', wan.nexthopNetwork === NetworkTypes.Vpn ? 'VPN' : 'Internet')
      })
  } else {
    cy.get(params.className).find('.row').should('have.length', 0)
  }
})
Cypress.Commands.add('inputEditFilters', params => {
  const defaultPolicy =
    params.inputData.defaultPolicy === ActionTypes.Accept ? t('accessControl.accept') : t('accessControl.discard')
  cy.removeRowEditTable({ className: params.className })
  cy.inputSelectForm({ selector: params.className, value: defaultPolicy })

  params.inputData.accessControlList.forEach((accessControl: typeof initialAccessControlInputData) => {
    cy.get(params.className).find('.edit-table-container').find('.edit-table-add-button').click()
    cy.inputSelectForm({ selector: '[data-cy="edit-access-list-protocol"]', value: accessControl.protocol })

    if (!['tcp', 'udp'].includes(accessControl.protocol)) {
      cy.get('[data-cy="edit-access-list-source-port"]').find('input').should('be.disabled')
      cy.get('[data-cy="edit-access-list-destination-port"]').find('input').should('be.disabled')
    } else {
      cy.get('[data-cy="edit-access-list-source-port"]').find('input').type(accessControl.sourcePort)
      cy.get('[data-cy="edit-access-list-destination-port"]').find('input').type(accessControl.destinationPort)
    }
    if (params.sourceIpv4PrefixStaticValue) {
      cy.get('[data-cy="edit-access-list-source-ipv4-prefix"]')
        .find('input')
        .should('have.value', params.sourceIpv4PrefixStaticValue)
        .should('be.disabled')
    } else {
      cy.get('[data-cy="edit-access-list-source-ipv4-prefix"]').type(accessControl.sourceIpv4Prefix)
    }
    if (params.destinationIpv4PrefixStaticValue) {
      cy.get('[data-cy="edit-access-list-destination-ipv4-prefix"]')
        .find('input')
        .should('have.value', params.destinationIpv4PrefixStaticValue)
        .should('be.disabled')
    } else {
      cy.get('[data-cy="edit-access-list-destination-ipv4-prefix"]')
        .find('input')
        .type(accessControl.destinationIpv4Prefix)
    }
    cy.inputSelectForm({
      selector: '[data-cy="edit-access-list-action"]',
      value: t(`accessControl.${accessControl.action}`),
    })
    // EditAccessListダイアログ内の追加ボタンを取得
    cy.get('[data-cy="edit-access-list-dialog"]')
      .find('.dialog-base-submit-button')
      .should('have.text', t('common.add'))
      .click()
  })
})
Cypress.Commands.add('confirmEditFilters', params => {
  cy.get(params.className)
    .find('.edit-table-add-button')
    .should(params.disabled ? 'not.exist' : 'exist')

  const defaultPolicy = params.inputData?.defaultPolicy
    ? params.inputData.defaultPolicy === ActionTypes.Accept
      ? t('accessControl.accept')
      : t('accessControl.discard')
    : ''
  if (params.disabled) {
    cy.get(params.className).find('input').should('be.disabled').should('have.value', defaultPolicy)
  } else {
    cy.get(params.className).find('input').should('not.be.disabled').should('have.value', defaultPolicy)
  }

  if (!!params.inputData?.accessControlList && params.inputData.accessControlList.length > 0) {
    cy.get(params.className)
      .find('.edit-table-container')
      .find('.row')
      .each((row, index) => {
        const accessControl = params.inputData.accessControlList[index]
        cy.wrap(row).find('.cell').eq(0).should('have.text', accessControl.protocol)
        cy.wrap(row).find('.cell').eq(1).should('have.text', accessControl.sourcePort)
        cy.wrap(row).find('.cell').eq(2).should('have.text', accessControl.destinationPort)
        cy.wrap(row)
          .find('.cell')
          .eq(3)
          .should('have.text', params.sourceIpv4PrefixStaticValue ?? accessControl.sourceIpv4Prefix)
        cy.wrap(row)
          .find('.cell')
          .eq(4)
          .should('have.text', params.destinationIpv4PrefixStaticValue ?? accessControl.destinationIpv4Prefix)
        cy.wrap(row)
          .find('.cell')
          .eq(5)
          .should('have.text', t(`accessControl.${accessControl.action}`))
      })
  } else {
    cy.get(params.className).find('.edit-table-container').find('.row').should('not.exist')
  }
})

Cypress.Commands.add('confirmEditCircuitTypes', params => {
  const isEdit = !!params.circuitType?.primary
  const showGuaranteeOnly =
    !isEdit || (params.circuitType?.primary === CircuitTypes.Guarantee && !params.circuitType.secondary)
  const showGuaranteeIpoe =
    !isEdit ||
    (params.circuitType?.primary === CircuitTypes.Guarantee && params.circuitType?.secondary === CircuitTypes.Ipoe)
  const showIpoe = !isEdit || (params.circuitType?.primary === CircuitTypes.Ipoe && !params.circuitType.secondary)
  const noNeedSim = showGuaranteeIpoe || showIpoe || showGuaranteeOnly
  const showMobile = !isEdit || !noNeedSim
  const showIpoeMobile = !isEdit || !noNeedSim
  const showGuaranteeMobile = !isEdit || !noNeedSim

  // RINKルーター02の場合はベストエフォートIPoEアクセス単体のみ表示される
  cy.get(params.className)
    .find(`[data-cy=${CircuitTypes.Mobile}-${undefined}]`)
    .should(showMobile && !params.isRouter02 ? 'exist' : 'not.exist')
  cy.get(params.className)
    .find(`[data-cy=${CircuitTypes.Ipoe}-${CircuitTypes.Mobile}]`)
    .should(showIpoeMobile && !params.isRouter02 ? 'exist' : 'not.exist')
  cy.get(params.className)
    .find(`[data-cy=${CircuitTypes.Guarantee}-${CircuitTypes.Mobile}]`)
    .should(showGuaranteeMobile && !params.isRouter02 ? 'exist' : 'not.exist')
  cy.get(params.className)
    .find(`[data-cy=${CircuitTypes.Guarantee}-${CircuitTypes.Ipoe}]`)
    .should(showGuaranteeIpoe && !params.isRouter02 ? 'exist' : 'not.exist')
  cy.get(params.className)
    .find(`[data-cy=${CircuitTypes.Ipoe}-${undefined}]`)
    .should(showIpoe ? 'exist' : 'not.exist')
  cy.get(params.className)
    .find(`[data-cy=${CircuitTypes.Guarantee}-${undefined}]`)
    .should(showGuaranteeOnly && !params.isRouter02 ? 'exist' : 'not.exist')

  // 編集時はチェック済みの確認をする
  if (isEdit) {
    cy.get(params.className)
      .find(`[data-cy=${params.circuitType?.primary}-${params.circuitType?.secondary}]`)
      .parent()
      .should('have.class', 'checked')
  }
})

Cypress.Commands.add('inputTerminalMobile', params => {
  // 通信方式（rat）
  // originalRat が指定されている場合はその値、指定されていない場合は 'auto' を初期値として確認
  const originalRat = params.originalRat ?? 'auto'
  const originalRatLabel = originalRat === 'lte' ? t('terminals.mobileRatLte') : t('terminals.mobileRatAuto')
  cy.get('[data-cy="edit-terminal-mobile-rat"]').find('.radio.checked').contains(originalRatLabel)

  // 変更が必要な場合のみ通信方式を選択
  if (params.inputData.rat !== originalRat) {
    const ratLabel = params.inputData.rat === 'lte' ? t('terminals.mobileRatLte') : t('terminals.mobileRatAuto')
    cy.get('[data-cy="edit-terminal-mobile-rat"]').find(`.label.${params.inputData.rat}`).click()
    cy.get('[data-cy="edit-terminal-mobile-rat"]').find('.radio.checked').contains(ratLabel)
  }

  // 法人確認方法選択
  cy.get('[data-cy="edit-terminal-mobile-corporate-verification-method"]')
    .find(`.label.${params.inputData.corporateVerificationMethod}`)
    .click()

  // 登記簿謄（抄）本に記載の法人番号
  cy.get('[data-cy="edit-terminal-mobile-japan-corporate-number"]')
    .find('input')
    .clear()
    .type(params.inputData.japanCorporateNumber)

  // 法人確認方法が対面確認の場合のみ法人確認書類を入力
  if (params.inputData.corporateVerificationMethod === 'inPersonVerification') {
    cy.inputSelectForm({
      selector: '[data-cy="edit-terminal-mobile-contract-identification-document-type"]',
      value: t(`documentType.${params.inputData.contractIdentificationDocumentType}`),
    })
    cy.pngFileUpload({
      className: '[data-cy="edit-terminal-mobile-contract-identification-document-id"]',
      aliasName: params.document.aliasName,
      documentId: params.document.id,
    })
  } else {
    cy.get('[data-cy="edit-terminal-mobile-contract-identification-document-type"]').should('not.exist')
    cy.get('[data-cy="edit-terminal-mobile-contract-identification-document-id"]').should('not.exist')
  }

  // 担当者と会社関係確認書類種別
  cy.inputSelectForm({
    selector: '[data-cy="edit-terminal-mobile-pic-employment-document-type"]',
    value: t(`documentType.${params.inputData.picEmploymentDocumentType}`),
  })

  // 社員番号（コード）
  if (getShowPicEmployeeCode(params.inputData.picEmploymentDocumentType)) {
    cy.get('[data-cy="edit-terminal-mobile-pic-employee-code"]')
      .find('input')
      .clear()
      .type(params.inputData.picEmployeeCode)
  }

  // 担当者と会社関係確認書類
  cy.pngFileUpload({
    className: '[data-cy="edit-terminal-mobile-pic-employment-document-id"]',
    aliasName: params.document.aliasName,
    documentId: params.document.id,
  })

  // ネットワーク暗証番号
  cy.get('[data-cy="edit-terminal-mobile-network-pin-code"]')
    .find('input')
    .clear()
    .type(params.inputData.networkPinCode)

  // ドコモ回線契約申込書お客さま控えの送付要否
  cy.get('[data-cy="edit-terminal-mobile-customer-receipt-required"]')
    .find(`.label.${params.inputData.customerReceiptRequired}`)
    .click()

  // ドコモ回線料金明細希望有無
  cy.get('[data-cy="edit-terminal-mobile-call-detail-desired"]')
    .find(`.label.${params.inputData.callDetailDesired}`)
    .click()

  if (params.inputData.callDetailDesired) {
    // ドコモ回線料金明細内訳表示設定
    cy.inputSelectForm({
      selector: '[data-cy="edit-terminal-mobile-call-detail-breakdown-setting"]',
      value: t(`terminals.${params.inputData.callDetailBreakdownSetting}`),
    })
    // ドコモ回線料金明細通話先電話番号表示設定
    cy.inputSelectForm({
      selector: '[data-cy="edit-terminal-mobile-call-detail-destination-number-setting"]',
      value: t(`terminals.${params.inputData.callDetailDestinationNumberSetting}`),
    })
  } else {
    cy.get('[data-cy="edit-terminal-mobile-call-detail-breakdown-setting"]').should('not.exist')
    cy.get('[data-cy="edit-terminal-mobile-call-detail-destination-number-setting"]').should('not.exist')
  }
})

Cypress.Commands.add('inputTerminalMobilePicInformationInPerson', params => {
  // 本人確認方法を担当営業による対面確認に設定
  cy.get('[data-cy="edit-terminal-mobile-pic-information-pic-verification-method"]')
    .find('.label.inPersonVerification')
    .click()

  // 文言の表示確認
  cy.get('[data-cy="edit-terminal-mobile-pic-information-message-pic-information-with-my-number-card"]').should(
    'not.exist',
  )
  cy.get('[data-cy="edit-terminal-mobile-pic-information-note-my-number-card"]').should('not.exist')
  cy.get('[data-cy="edit-terminal-mobile-pic-information-message-pic-information-with-in-person-verification"]').should(
    'exist',
  )
  cy.get('[data-cy="edit-terminal-mobile-pic-information-note-in-person-verification"]').should('exist')

  // 担当者名
  cy.get('[data-cy="edit-terminal-mobile-pic-information-pic-name"]')
    .find('input')
    .clear()
    .type(params.inputData.picName)

  // 担当者名カナ
  cy.get('[data-cy="edit-terminal-mobile-pic-information-pic-name-kana"]')
    .find('input')
    .clear()
    .type(params.inputData.picNameKana)

  // 担当者郵便番号
  cy.get('[data-cy="edit-terminal-mobile-pic-information-pic-postal-code"]')
    .find('input')
    .clear()
    .type(params.inputData.picPostalCode)

  // 担当者住所
  // 郵便番号入力による住所自動入力の確認
  cy.get('[data-cy="edit-terminal-mobile-pic-information-pic-address"]')
    .find('input')
    .should('have.value', params.inputData.picAddress)

  // 担当者住所カナ
  cy.get('[data-cy="edit-terminal-mobile-pic-information-pic-address-kana"]')
    .find('input')
    .clear()
    .type(params.inputData.picAddressKana)

  // 担当者生年月日
  cy.inputDatePicker({
    className: '[data-cy="edit-terminal-mobile-pic-information-pic-date-of-birth"]',
    date: params.inputData.picDateOfBirth,
  })

  // 担当者電話番号
  cy.get('[data-cy="edit-terminal-mobile-pic-information-pic-phone-number"]')
    .find('input')
    .clear()
    .type(params.inputData.picPhoneNumber)

  // 担当者本人確認書類
  cy.inputSelectForm({
    selector: '[data-cy="edit-terminal-mobile-pic-information-pic-identification-document-type"]',
    value: t(`documentType.${params.inputData.picIdentificationDocumentType}`),
  })

  // 担当者本人確認書類の証明書番号
  if (getShowPicIdentificationNumber(params.inputData.picIdentificationDocumentType)) {
    cy.get('[data-cy="edit-terminal-mobile-pic-information-pic-identification-number"]')
      .find('input')
      .clear()
      .type(params.inputData.picIdentificationNumber)
  }

  // 担当者本人確認書類（表）
  cy.pngFileUpload({
    className: '[data-cy="edit-terminal-mobile-pic-information-pic-identification-front-document-id"]',
    aliasName: params.document.aliasName,
    documentId: params.document.id,
  })

  // 担当者本人確認書類（裏）
  if (getShowPicIdentificationBackDocumentFile(params.inputData.picIdentificationDocumentType)) {
    cy.pngFileUpload({
      className: '[data-cy="edit-terminal-mobile-pic-information-pic-identification-back-document-id"]',
      aliasName: params.document.aliasName,
      documentId: params.document.id,
    })
  }

  if (getShowPicIdentificationAdditionalDocumentFile(params.inputData.picIdentificationDocumentType)) {
    // 担当者本人確認追加書類
    cy.pngFileUpload({
      className: '[data-cy="edit-terminal-mobile-pic-information-pic-identification-additional-document-id"]',
      aliasName: params.document.aliasName,
      documentId: params.document.id,
    })
  }

  if (getShowPicAuxiliaryIdentificationDocumentType(params.inputData.picIdentificationDocumentType)) {
    // 担当者本人確認補助書類証明書種別
    cy.inputSelectForm({
      selector: '[data-cy="edit-terminal-mobile-pic-information-pic-auxiliary-identification-document-type"]',
      value: t(`documentType.${params.inputData.picAuxiliaryIdentificationDocumentType}`),
    })
    // 担当者本人確認補助書類証明書書類
    cy.pngFileUpload({
      className: '[data-cy="edit-terminal-mobile-pic-information-pic-auxiliary-identification-document-id"]',
      aliasName: params.document.aliasName,
      documentId: params.document.id,
    })
  }
})

Cypress.Commands.add('inputTerminalMobilePicInformationMyNumberCard', params => {
  // JPKI関連のAPIをintercept
  cy.intercept('POST', '**/ztgict/v1/jpki/jpki-requests', {
    body: {
      url: 'https://example.com/jpki/auth?token=test-token-12345',
      jpkiRequestId: params.inputData.jpkiRequestId,
    },
  }).as('postJpkiRequest')
  cy.intercept('GET', `**/ztgict/v1/jpki/jpki-requests/${params.inputData.jpkiRequestId}`, {
    body: { status: 'processing' },
  }).as('getJpkiRequestStatus')

  // 本人確認方法をマイナンバーカードに設定
  cy.get('[data-cy="edit-terminal-mobile-pic-information-pic-verification-method"]').find('.label.myNumberCard').click()

  cy.wait('@postJpkiRequest')

  // 文言の表示確認
  cy.get('[data-cy="edit-terminal-mobile-pic-information-message-pic-information-with-my-number-card"]').should('exist')
  cy.get('[data-cy="edit-terminal-mobile-pic-information-note-my-number-card"]').should('exist')
  cy.get('[data-cy="edit-terminal-mobile-pic-information-message-pic-information-with-in-person-verification"]').should(
    'not.exist',
  )
  cy.get('[data-cy="edit-terminal-mobile-pic-information-note-in-person-verification"]').should('not.exist')

  // 担当者名
  cy.get('[data-cy="edit-terminal-mobile-pic-information-pic-name"]')
    .find('input')
    .clear()
    .type(params.inputData.picName)

  // 担当者名カナ
  cy.get('[data-cy="edit-terminal-mobile-pic-information-pic-name-kana"]')
    .find('input')
    .clear()
    .type(params.inputData.picNameKana)

  // 担当者郵便番号
  cy.get('[data-cy="edit-terminal-mobile-pic-information-pic-postal-code"]')
    .find('input')
    .clear()
    .type(params.inputData.picPostalCode)

  // 担当者住所
  // 郵便番号入力による住所自動入力の確認
  cy.get('[data-cy="edit-terminal-mobile-pic-information-pic-address"]')
    .find('input')
    .should('have.value', params.inputData.picAddress)

  // 担当者住所カナ
  cy.get('[data-cy="edit-terminal-mobile-pic-information-pic-address-kana"]')
    .find('input')
    .clear()
    .type(params.inputData.picAddressKana)

  // 担当者生年月日
  cy.inputDatePicker({
    className: '[data-cy="edit-terminal-mobile-pic-information-pic-date-of-birth"]',
    date: params.inputData.picDateOfBirth,
  })

  // 担当者電話番号
  cy.get('[data-cy="edit-terminal-mobile-pic-information-pic-phone-number"]')
    .find('input')
    .clear()
    .type(params.inputData.picPhoneNumber)

  // QRコードが表示されていることを確認
  cy.get('[data-cy="qr-code"]').should('exist')

  // 1回目のポーリング（processing）を待つ
  cy.wait('@getJpkiRequestStatus')

  // 2回目のポーリングで completed を返すように設定
  cy.intercept('GET', `**/ztgict/v1/jpki/jpki-requests/${params.inputData.jpkiRequestId}`, {
    body: { status: 'completed' },
  }).as('getJpkiRequestStatus')

  // 2回目のポーリング（completed）を待つ
  cy.wait('@getJpkiRequestStatus')
})

Cypress.Commands.add('inputTerminalWithoutMobile', params => {
  const vpnCustomerNote = params.vpnList?.find(vpn => vpn.vpnId === params.inputData.vpnId)?.customerNote
  const className = params.className ? `${params.className} ` : ''
  const vpnIdName = params.inputData.vpnId ? `${params.inputData.vpnId} / ${vpnCustomerNote}` : t('vpn.unselected')
  // RINKルーター02 は利用アクセス回線・LANタイプ・LANポートフィルタに制約がかかる
  const isRouter02 = !params.isBulk && params.inputData.terminalDeviceType === TerminalDeviceTypes.Router02

  // 利用ルーター機種選択
  if (params.isBulk) {
    cy.get(`${className}[data-cy="edit-terminal-data-terminal-device-type"]`).should('not.exist')
  } else {
    cy.get(`${className}[data-cy="edit-terminal-data-terminal-device-type"]`)
      .find(`.label.${params.inputData.terminalDeviceType}`)
      .click()
  }

  // 利用回線選択
  cy.get(`${className}[data-cy="edit-terminal-data-edit-circuit-types"]`)
    .find(`[data-cy=${params.inputData.primaryCircuitType}-${params.inputData?.secondaryCircuitType}]`)
    .click()

  if (
    params.inputData.primaryCircuitType === CircuitTypes.Mobile ||
    params.inputData.secondaryCircuitType === CircuitTypes.Mobile
  ) {
    // 初回モバイル申込者対象のダイアログ表示
    cy.get('[data-cy="dialog-base-title"]').should('have.text', t('terminals.confirm.firstMobile.title'))
    cy.get('.dialog-base-submit-button').should('have.text', t('common.confirm')).click()
    cy.get('.dialog-main').should('not.exist')
  }

  // ルーター基本設定
  cy.get(`${className}[data-cy="edit-terminal-data-customer-note"]`)
    .find('input')
    .clear()
    .type(params.inputData.customerNote)
  cy.get(`${className}[data-cy="edit-terminal-data-installation-postal-code"]`)
    .find('input')
    .clear()
    .type(params.inputData.installationPostalCode)
  // 郵便番号入力による住所自動入力の確認
  cy.get(`${className}[data-cy="edit-terminal-data-installation-address"]`)
    .find('input')
    .should('have.value', params.inputData.installationAddress)

  // リソース設定 - VPN ID
  if (!params.isBulk) {
    cy.inputSelectForm({ selector: `${className}[data-cy="edit-terminal-data-vpn-id"]`, value: vpnIdName })
  } else {
    cy.get(`${className}[data-cy="edit-terminal-data-vpn-id"]`).should('not.exist')
  }
  // リソース設定 - ギャランティアクセス
  if (params.inputData.primaryCircuitType !== CircuitTypes.Guarantee) {
    cy.get(`${className}[data-cy="edit-terminal-data-guarantee-guarantee-id"]`).find('input').should('be.disabled')
    cy.get(`${className}[data-cy="edit-terminal-data-guarantee-vpn-act-connected-ipv4-prefix"]`).should('not.exist')
    cy.get(`${className}[data-cy="edit-terminal-data-guarantee-vpn-sby-connected-ipv4-prefix"]`).should('not.exist')
  } else {
    cy.inputSelectForm({
      selector: `${className}[data-cy="edit-terminal-data-guarantee-guarantee-id"]`,
      value: params.inputData.guarantee.guaranteeId,
    })

    // ギャランティアクセス - VPN
    if (params.inputData.vpnId) {
      cy.get(`${className}[data-cy="edit-terminal-data-guarantee-vpn-act-connected-ipv4-prefix"]`)
        .find('input')
        .type(stripPrefix(params.inputData.guarantee.vpn.act.connectedIpv4Prefix))
      cy.get(`${className}[data-cy="edit-terminal-data-guarantee-vpn-sby-connected-ipv4-prefix"]`)
        .find('input')
        .type(stripPrefix(params.inputData.guarantee.vpn.sby.connectedIpv4Prefix))
    } else {
      cy.get(`${className}[data-cy="edit-terminal-data-guarantee-vpn-act-connected-ipv4-prefix"]`)
        .find('input')
        .should('be.disabled')
        .should('have.value', '')
      cy.get(`${className}[data-cy="edit-terminal-data-guarantee-vpn-sby-connected-ipv4-prefix"]`)
        .find('input')
        .should('be.disabled')
        .should('have.value', '')
    }
  }
  // リソース設定 - IPoE回線
  if (
    params.inputData.primaryCircuitType !== CircuitTypes.Ipoe &&
    params.inputData.secondaryCircuitType !== CircuitTypes.Ipoe
  ) {
    cy.get(`${className}[data-cy="edit-terminal-data-ipoe-id"]`).find('input').should('be.disabled')
  } else {
    cy.inputSelectForm({
      selector: `${className}[data-cy="edit-terminal-data-ipoe-id"]`,
      value: params.inputData.ipoeId,
    })
  }

  // ネットワーク設定 - Loopbackアドレス
  cy.get(`${className}[data-cy="edit-terminal-data-loopback-ipv4-address"]`).find('input').clear()
  cy.get(`${className}[data-cy="edit-terminal-data-loopback-ipv4-address"]`)
    .find('input')
    .type(params.inputData.loopbackIpv4Address)
  // ネットワーク設定 - LANタイプ
  if (isRouter02) {
    // RINKルーター02 はスイッチポート方式固定のため変更できない
    cy.get(`${className}[data-cy="edit-terminal-data-lan-type"]`)
      .find('input')
      .should('be.disabled')
      .should('have.value', t(`terminals.${LanTypes.SwitchPort}`))
  } else {
    const lanTypeLength = params.inputData?.guarantee?.guaranteeId === 'Z000000004' ? 1 : 2
    cy.get(`${className}[data-cy="edit-terminal-data-lan-type"]`)
      .click()
      .find('li')
      .should('have.length', lanTypeLength)
      .contains(t(`terminals.${params.inputData.lanType}`))
      .click()
  }
  // ネットワーク設定 - 直下セグメント
  cy.inputEditLans({
    lans: params.inputData.lans,
    className: `${className}[data-cy="edit-terminal-data-lans"]`,
    lanType: params.inputData.lanType,
    hideLanInFilters: isRouter02,
  })
  // ネットワーク設定 - デフォルトルート設定
  cy.inputSelectForm({
    selector: `${className}[data-cy="edit-terminal-data-default-gateway-nexthop-network"]`,
    value: params.inputData.defaultGateway.nexthopNetwork,
  })
  if (params.inputData.defaultGateway.nexthopNetwork === NetworkTypes.Lan) {
    cy.get(`${className}[data-cy="edit-terminal-data-default-gateway-nexthop-ipv4-address"]`)
      .find('input')
      .clear()
      .type(params.inputData.defaultGateway.nexthopIpv4Address)
    cy.get(`${className}[data-cy="edit-terminal-data-default-gateway-vpn-routing"]`)
      .find(`.label.${params.inputData.defaultGateway.vpnRouting}`)
      .click()
  }

  if (params.inputData.defaultGateway.nexthopNetwork === NetworkTypes.Vpn) {
    cy.inputBreakOut({
      breakOut: params.inputData.breakOut ?? [],
      interceptDnsServers: params.inputData.interceptDnsServers ?? [],
      breakOutList: params.breakOutList,
      breakOutClassName: `${className}[data-cy="edit-terminal-data-break-out"]`,
      breakOutDnsServersClassName: `${className}[data-cy="edit-terminal-data-break-out-dns-servers"]`,
    })
  }

  // トラフィックレポート（フロー分析）
  if (params.inputData.primaryCircuitType === CircuitTypes.Guarantee) {
    // 初期値チェック - プラン
    const initialTrafficReportFlowAnalyzerPlan =
      params.originalData?.trafficReportFlowAnalyzer?.trafficReportFlowAnalyzerPlan ??
      TrafficReportFlowAnalyzerPlanTypes.FreePlan
    cy.get(`${className}[data-cy="edit-traffic-report-flow-analyzer-plan-select-form"]`)
      .find('input')
      .should('have.value', getTrafficReportFlowAnalyzerPlanInputValue(initialTrafficReportFlowAnalyzerPlan))
    // 初期値チェック - アラート
    const initialTrafficReportFlowAnalyzerAlert =
      params.originalData?.trafficReportFlowAnalyzer?.trafficReportFlowAnalyzerAlert ?? true
    cy.get(`${className}[data-cy="edit-traffic-report-flow-analyzer-alert-select-form"]`)
      .find('input')
      .should('have.value', getTrafficReportFlowAnalyzerAlertInputValue(initialTrafficReportFlowAnalyzerAlert))
    // 入力 - プラン
    cy.inputSelectForm({
      selector: `${className}[data-cy="edit-traffic-report-flow-analyzer-plan-select-form"]`,
      value: getTrafficReportFlowAnalyzerPlanInputValue(
        params.inputData.trafficReportFlowAnalyzer.trafficReportFlowAnalyzerPlan,
      ),
    })
    // 入力 - アラート
    if (
      params.inputData.trafficReportFlowAnalyzer.trafficReportFlowAnalyzerPlan ===
      TrafficReportFlowAnalyzerPlanTypes.NoSubscription
    ) {
      // プランを利用しない場合、入力項目が非活性で「利用しない」が選択されていることを確認
      cy.get('[data-cy="edit-traffic-report-flow-analyzer-alert-select-form"]')
        .find('input')
        .should('be.disabled')
        .should('have.value', t('common.disuse'))
    } else {
      cy.inputSelectForm({
        selector: `${className}[data-cy="edit-traffic-report-flow-analyzer-alert-select-form"]`,
        value: getTrafficReportFlowAnalyzerAlertInputValue(
          params.inputData.trafficReportFlowAnalyzer.trafficReportFlowAnalyzerAlert,
        ),
      })
    }
  } else {
    cy.get(`${className}[data-cy="edit-traffic-report-flow-analyzer-plan-select-form"]`).should('not.exist')
    cy.get(`${className}[data-cy="edit-traffic-report-flow-analyzer-plan-value"]`).should('not.exist')
  }

  // セキュリティオプション
  // 初期値チェック
  const initialThreatDetectionPlan =
    params.originalData?.threatDetection?.threatDetectionPlan ?? SecurityOptionTypes.Plan3Months
  const initialFlowCollectorPlan =
    params.originalData?.flowCollector?.flowCollectorPlan ?? SecurityOptionTypes.Plan3Months
  const initialBehaviorDetectionPlan =
    params.originalData?.behaviorDetection?.behaviorDetectionPlan ?? BehaviorDetectionOptionTypes.NoSubscription
  cy.get(`${className}[data-cy="edit-security-options-threat-detection-plan"]`)
    .find('input')
    .should('have.value', getThreatDetectionPlanInputValue(initialThreatDetectionPlan))
  cy.get(`${className}[data-cy="edit-security-options-flow-collector-plan"]`)
    .find('input')
    .should('have.value', getFlowCollectorPlanInputValue(initialFlowCollectorPlan))
  cy.get(`${className}[data-cy="edit-security-options-behavior-detection-plan"]`)
    .find('input')
    .should('have.value', getBehaviorDetectionPlanInputValue(initialBehaviorDetectionPlan))
  // 入力
  cy.inputSelectForm({
    selector: `${className}[data-cy="edit-security-options-threat-detection-plan"]`,
    value: getThreatDetectionPlanInputValue(params.inputData.threatDetection.threatDetectionPlan),
  })
  cy.inputSelectForm({
    selector: `${className}[data-cy="edit-security-options-flow-collector-plan"]`,
    value: getFlowCollectorPlanInputValue(params.inputData.flowCollector.flowCollectorPlan),
  })
  cy.inputSelectForm({
    selector: `${className}[data-cy="edit-security-options-behavior-detection-plan"]`,
    value: getBehaviorDetectionPlanInputValue(params.inputData.behaviorDetection.behaviorDetectionPlan),
  })

  // 端末詳細設定
  cy.get(`${className}[data-cy="edit-terminal-data-detail-settings"]`).should('exist')

  if (!params.isBulk) {
    // 端末詳細設定 - 拠点内セグメント（非直下セグメント）
    cy.inputEditLanStaticRoutes({
      lanStaticRoutes: params.inputData.lanStaticRoutes,
      className: `${className}[data-cy="edit-terminal-data-lan-static-routes"]`,
    })
    // 端末詳細設定 - WAN向けスタティックルート設定
    cy.inputEditWanStaticRoutes({
      wanStaticRoutes: params.inputData.wanStaticRoutes,
      className: `${className}[data-cy="edit-terminal-data-wan-static-routes"]`,
    })
    if (params.inputData.vpnId) {
      // 端末詳細設定 - WANポートフィルタ（VPN → 拠点）
      cy.inputEditFilters({
        inputData: params.inputData.vpnInFilters,
        className: `${className}[data-cy="edit-terminal-data-vpn-in-filters"]`,
      })
      // 端末詳細設定 - WANポートフィルタ（拠点 → VPN）
      cy.inputEditFilters({
        inputData: params.inputData.vpnOutFilters,
        className: `${className}[data-cy="edit-terminal-data-vpn-out-filters"]`,
      })
    } else {
      cy.confirmEditFilters({
        inputData: null,
        disabled: true,
        className: `${className}[data-cy="edit-terminal-data-vpn-in-filters"]`,
      })
      cy.confirmEditFilters({
        inputData: null,
        disabled: true,
        className: `${className}[data-cy="edit-terminal-data-vpn-out-filters"]`,
      })
    }
    // 端末詳細設定 - WANポートフィルタ（拠点 → Internet）
    if (params.inputData.inet4OutFilters) {
      cy.inputEditFilters({
        inputData: params.inputData.inet4OutFilters,
        className: `${className}[data-cy="edit-terminal-data-inet4-out-filters"]`,
      })
    }
  } else {
    cy.get(`${className}[data-cy="edit-terminal-data-lan-static-routes"]`).should('not.exist')
    cy.get(`${className}[data-cy="edit-terminal-data-wan-static-routes"]`).should('not.exist')
    cy.get(`${className}[data-cy="edit-terminal-data-vpn-in-filters"]`).should('not.exist')
    cy.get(`${className}[data-cy="edit-terminal-data-vpn-out-filters"]`).should('not.exist')
    cy.get(`${className}[data-cy="edit-terminal-data-inet4-out-filters"]`).should('not.exist')
  }

  // 端末詳細設定 - DHCP リレー
  if (params.inputData.lans.find((lan: TerminalLansType) => !!lan.dhcpServer)) {
    // lans で dhcpServer を設定済みの場合はメッセージ表示
    cy.get(`${className}[data-cy="edit-terminal-data-message-dhcp-settings"]`).should('exist')
  } else {
    cy.get(`${className}[data-cy="edit-terminal-data-message-dhcp-settings"]`).should('not.exist')
    params.inputData?.dhcpRelayServers?.forEach(({ serverIpv4Address }: { serverIpv4Address: string }) => {
      cy.get(`${className}[data-cy="edit-terminal-data-dhcp-relay-servers"]`)
        .find('.multiple-add')
        .find('.button')
        .click()
      cy.get(`${className}[data-cy="edit-terminal-data-dhcp-relay-servers"]`)
        .find('input')
        .last()
        .type(serverIpv4Address)
    })
  }

  // 配送先情報
  cy.get(`${className}[data-cy="edit-terminal-data-delivery-name"]`)
    .find('input')
    .clear()
    .type(params.inputData.deliveryName)
  if (params.inputData.deliveryCompanyName) {
    cy.get(`${className}[data-cy="edit-terminal-data-delivery-company-name"]`)
      .find('input')
      .clear()
      .type(params.inputData.deliveryCompanyName)
  }
  cy.get(`${className}[data-cy="edit-terminal-data-delivery-department-name"]`)
    .find('input')
    .clear()
    .type(params.inputData.deliveryDepartmentName)
  cy.get(`${className}[data-cy="edit-terminal-data-delivery-phone-number"]`)
    .find('input')
    .clear()
    .type(params.inputData.deliveryPhoneNumber)
  cy.get(`${className}[data-cy="edit-terminal-data-delivery-postal-code"]`)
    .find('input')
    .clear()
    .type(params.inputData.deliveryPostalCode)
  // 郵便番号入力による住所自動入力の確認
  cy.get(`${className}[data-cy="edit-terminal-data-delivery-address"]`)
    .find('input')
    .should('have.value', params.inputData.deliveryAddress)
  cy.get(`${className}[data-cy="edit-terminal-data-delivery-address-kana"]`)
    .find('input')
    .clear()
    .type(params.inputData.deliveryAddressKana)
  cy.inputDatePicker({
    className: `${className}[data-cy="edit-terminal-data-delivery-date"]`,
    date: params.inputData.deliveryDate,
  })

  // VPN IDの値を未選択に変えた時の初期化処理確認
  if (!params.isBulk && params.inputData.vpnId) {
    // VPN IDを 未選択にする
    cy.inputSelectForm({
      selector: `${className}[data-cy="edit-terminal-data-vpn-id"]`,
      value: t('vpn.unselected'),
    })
    if (params.inputData.defaultGateway.nexthopNetwork === 'vpn') {
      // defaultGateway.nexthopNetwork = vpn の場合のみ初期化される
      cy.get(`${className}[data-cy="edit-terminal-data-default-gateway-nexthop-network"]`)
        .find('input')
        .should('have.value', '')
    } else {
      const value = params.inputData.defaultGateway.nexthopNetwork === 'lan' ? 'LAN' : 'Internet'
      cy.get(`${className}[data-cy="edit-terminal-data-default-gateway-nexthop-network"]`)
        .find('input')
        .should('have.value', value)
    }
    // WAN向けスタティックルート設定 の VPN は削除されてInternetだけになる
    const filteredWanStaticRoutes =
      params.inputData.wanStaticRoutes?.filter(
        ({ nexthopNetwork }: TerminalWanStaticType) => nexthopNetwork !== NetworkTypes.Vpn,
      ) ?? []
    if (filteredWanStaticRoutes.length > 0) {
      cy.get(`${className}[data-cy="edit-terminal-data-wan-static-routes"]`)
        .find('.row')
        .should('have.length', filteredWanStaticRoutes.length)
        .each((row, index) => {
          const wan = filteredWanStaticRoutes[index]
          cy.wrap(row).find('.cell').eq(0).should('have.text', wan.destinationIpv4Prefix)
          cy.wrap(row).find('.cell').eq(1).should('have.text', 'Internet')
        })
    }
    // vpnInFilters と vpnOutFilters は初期化される
    cy.confirmEditFilters({
      inputData: null,
      disabled: true,
      className: `${className}[data-cy="edit-terminal-data-vpn-in-filters"]`,
    })
    cy.confirmEditFilters({
      inputData: null,
      disabled: true,
      className: `${className}[data-cy="edit-terminal-data-vpn-out-filters"]`,
    })
    // vpnActConnectedIpv4Prefix と vpnSbyConnectedIpv4Prefix は初期化される
    if (params.inputData.primaryCircuitType === CircuitTypes.Guarantee) {
      cy.get(`${className}[data-cy="edit-terminal-data-guarantee-vpn-act-connected-ipv4-prefix"]`)
        .find('input')
        .should('be.disabled')
        .should('have.value', '')
      cy.get(`${className}[data-cy="edit-terminal-data-guarantee-vpn-sby-connected-ipv4-prefix"]`)
        .find('input')
        .should('be.disabled')
        .should('have.value', '')
    }

    // 元に戻す
    cy.inputSelectForm({ selector: `${className}[data-cy="edit-terminal-data-vpn-id"]`, value: vpnIdName })
    if (params.inputData.defaultGateway.nexthopNetwork === 'vpn') {
      cy.inputSelectForm({
        selector: `${className}[data-cy="edit-terminal-data-default-gateway-nexthop-network"]`,
        value: 'VPN',
      })
      cy.inputBreakOut({
        breakOut: params.inputData.breakOut ?? [],
        interceptDnsServers: params.inputData.interceptDnsServers ?? [],
        breakOutList: params.breakOutList,
        breakOutClassName: `${className}[data-cy="edit-terminal-data-break-out"]`,
        breakOutDnsServersClassName: `${className}[data-cy="edit-terminal-data-break-out-dns-servers"]`,
      })
    }
    // WAN向けスタティックルート設定
    cy.inputEditWanStaticRoutes({
      wanStaticRoutes: params.inputData.wanStaticRoutes,
      className: `${className}[data-cy="edit-terminal-data-wan-static-routes"]`,
    })
    // 端末詳細設定 - WANポートフィルタ（VPN → 拠点）
    cy.inputEditFilters({
      inputData: params.inputData.vpnInFilters,
      className: `${className}[data-cy="edit-terminal-data-vpn-in-filters"]`,
    })
    // 端末詳細設定 - WANポートフィルタ（拠点 → VPN）
    cy.inputEditFilters({
      inputData: params.inputData.vpnOutFilters,
      className: `${className}[data-cy="edit-terminal-data-vpn-out-filters"]`,
    })
    // vpnActConnectedIpv4Prefix と vpnSbyConnectedIpv4Prefix を入力
    if (params.inputData.primaryCircuitType === CircuitTypes.Guarantee) {
      cy.get(`${className}[data-cy="edit-terminal-data-guarantee-vpn-act-connected-ipv4-prefix"]`)
        .find('input')
        .type(stripPrefix(params.inputData.guarantee.vpn.act.connectedIpv4Prefix))
      cy.get(`${className}[data-cy="edit-terminal-data-guarantee-vpn-sby-connected-ipv4-prefix"]`)
        .find('input')
        .type(stripPrefix(params.inputData.guarantee.vpn.sby.connectedIpv4Prefix))
    }
  }
})

Cypress.Commands.add('confirmTerminalMobile', params => {
  const disabled = params.disabled ? 'be.disabled' : 'not.be.disabled'
  const radioCheckedClass = params.disabled ? '.radio.checked.disabled' : '.radio.checked'

  // 通信方式（rat）
  cy.get('[data-cy="edit-terminal-mobile-rat"]')
    .find(radioCheckedClass)
    .find(`.label.${params.inputData.rat}`)
    .should('have.length', 1)

  // 法人確認方法選択
  cy.log(params.inputData.corporateVerificationMethod)
  cy.get('[data-cy="edit-terminal-mobile-corporate-verification-method"]')
    .find(radioCheckedClass)
    .find(`.label.${params.inputData.corporateVerificationMethod}`)
    .should('have.length', 1)

  // 登記簿謄（抄）本に記載の法人番号
  cy.get('[data-cy="edit-terminal-mobile-japan-corporate-number"]')
    .find('input')
    .should(disabled)
    .should('have.value', params.inputData.japanCorporateNumber)

  // 法人確認方法が対面確認の場合のみ法人確認書類を確認
  if (params.inputData.corporateVerificationMethod === 'inPersonVerification') {
    // 法人確認書類種別
    cy.get('[data-cy="edit-terminal-mobile-contract-identification-document-type"]')
      .find('input')
      .should(disabled)
      .should('have.value', t(`documentType.${params.inputData.contractIdentificationDocumentType}`))
    // 法人確認書類
    cy.confirmFileUpload({
      className: '[data-cy="edit-terminal-mobile-contract-identification-document-id"]',
      documentId: params.inputData.contractIdentificationDocumentId,
      disabled: params.disabled,
    })
  } else {
    cy.get('[data-cy="edit-terminal-mobile-contract-identification-document-type"]').should('not.exist')
    cy.get('[data-cy="edit-terminal-mobile-contract-identification-document-id"]').should('not.exist')
  }

  // 担当者と会社関係確認書類種別
  cy.get('[data-cy="edit-terminal-mobile-pic-employment-document-type"]')
    .find('input')
    .should(disabled)
    .should('have.value', t(`documentType.${params.inputData.picEmploymentDocumentType}`))

  // 社員番号（コード）
  if (getShowPicEmployeeCode(params.inputData.picEmploymentDocumentType)) {
    cy.get('[data-cy="edit-terminal-mobile-pic-employee-code"]')
      .find('input')
      .should(disabled)
      .should('have.value', params.inputData.picEmployeeCode)
  } else {
    cy.get('[data-cy="edit-terminal-mobile-pic-employee-code"]').should('not.exist')
  }

  // 担当者と会社関係確認書類
  cy.confirmFileUpload({
    className: '[data-cy="edit-terminal-mobile-pic-employment-document-id"]',
    documentId: params.inputData.picEmploymentDocumentId,
    disabled: params.disabled,
  })

  // ネットワーク暗証番号
  cy.get('[data-cy="edit-terminal-mobile-network-pin-code"]')
    .find('input')
    .should(disabled)
    .should('have.value', params.inputData.networkPinCode)

  // ドコモ回線契約申込書お客さま控えの送付要否
  cy.get('[data-cy="edit-terminal-mobile-customer-receipt-required"]')
    .find(radioCheckedClass)
    .find(`.label.${params.inputData.customerReceiptRequired}`)
    .should('have.length', 1)

  // ドコモ回線料金明細希望有無
  cy.get('[data-cy="edit-terminal-mobile-call-detail-desired"]')
    .find(radioCheckedClass)
    .find(`.label.${params.inputData.callDetailDesired}`)
    .should('have.length', 1)

  if (params.inputData.callDetailDesired) {
    // ドコモ回線料金明細内訳表示設定
    cy.get('[data-cy="edit-terminal-mobile-call-detail-breakdown-setting"]')
      .find('input')
      .should(disabled)
      .should('have.value', t(`terminals.${params.inputData.callDetailBreakdownSetting}`))
    // ドコモ回線料金明細通話先電話番号表示設定
    cy.get('[data-cy="edit-terminal-mobile-call-detail-destination-number-setting"]')
      .find('input')
      .should(disabled)
      .should('have.value', t(`terminals.${params.inputData.callDetailDestinationNumberSetting}`))
  } else {
    cy.get('[data-cy="edit-terminal-mobile-call-detail-breakdown-setting"]').should('not.exist')
    cy.get('[data-cy="edit-terminal-mobile-call-detail-destination-number-setting"]').should('not.exist')
  }
})

Cypress.Commands.add('confirmTerminalMobilePicInformationMyNumberCard', params => {
  const disabled = params.disabled ? 'be.disabled' : 'not.be.disabled'
  const radioCheckedClass = params.disabled ? '.radio.checked.disabled' : '.radio.checked'

  // 本人確認方法がマイナンバーカードであることを確認
  cy.get('[data-cy="edit-terminal-mobile-pic-information-pic-verification-method"]')
    .find(radioCheckedClass)
    .find('.label.myNumberCard')
    .should('have.length', 1)

  // 文言の表示確認
  if (!params.disabled) {
    cy.get('[data-cy="edit-terminal-mobile-pic-information-message-pic-information-with-my-number-card"]').should(
      'exist',
    )
  }
  cy.get('[data-cy="edit-terminal-mobile-pic-information-note-my-number-card"]').should('exist')
  cy.get('[data-cy="edit-terminal-mobile-pic-information-message-pic-information-with-in-person-verification"]').should(
    'not.exist',
  )
  cy.get('[data-cy="edit-terminal-mobile-pic-information-note-in-person-verification"]').should('not.exist')

  // 担当者本人確認書類関連のフィールドが存在しないことを確認
  cy.get('[data-cy="edit-terminal-mobile-pic-information-pic-identification-document-type"]').should('not.exist')
  cy.get('[data-cy="edit-terminal-mobile-pic-information-pic-identification-number"]').should('not.exist')
  cy.get('[data-cy="edit-terminal-mobile-pic-information-pic-identification-front-document-id"]').should('not.exist')
  cy.get('[data-cy="edit-terminal-mobile-pic-information-pic-identification-back-document-id"]').should('not.exist')
  cy.get('[data-cy="edit-terminal-mobile-pic-information-pic-identification-additional-document-id"]').should(
    'not.exist',
  )
  cy.get('[data-cy="edit-terminal-mobile-pic-information-pic-auxiliary-identification-document-type"]').should(
    'not.exist',
  )
  cy.get('[data-cy="edit-terminal-mobile-pic-information-pic-auxiliary-identification-document-id"]').should(
    'not.exist',
  )

  // 共通項目
  // 担当者名
  cy.get('[data-cy="edit-terminal-mobile-pic-information-pic-name"]')
    .find('input')
    .should(disabled)
    .should('have.value', params.inputData.picName)

  // 担当者名カナ
  cy.get('[data-cy="edit-terminal-mobile-pic-information-pic-name-kana"]')
    .find('input')
    .should(disabled)
    .should('have.value', params.inputData.picNameKana)

  // 担当者郵便番号
  cy.get('[data-cy="edit-terminal-mobile-pic-information-pic-postal-code"]')
    .find('input')
    .should(disabled)
    .should('have.value', params.inputData.picPostalCode)

  // 担当者住所
  cy.get('[data-cy="edit-terminal-mobile-pic-information-pic-address"]')
    .find('input')
    .should(disabled)
    .should('have.value', params.inputData.picAddress)

  // 担当者住所カナ
  cy.get('[data-cy="edit-terminal-mobile-pic-information-pic-address-kana"]')
    .find('input')
    .should(disabled)
    .should('have.value', params.inputData.picAddressKana)

  // 担当者生年月日
  cy.get('[data-cy="edit-terminal-mobile-pic-information-pic-date-of-birth"]')
    .find('input')
    .should(disabled)
    .should('have.value', dayjs(params.inputData.picDateOfBirth).format('YYYY/MM/DD'))

  // 担当者電話番号
  cy.get('[data-cy="edit-terminal-mobile-pic-information-pic-phone-number"]')
    .find('input')
    .should(disabled)
    .should('have.value', params.inputData.picPhoneNumber)
})

Cypress.Commands.add('confirmTerminalMobilePicInformationInPerson', params => {
  const disabled = params.disabled ? 'be.disabled' : 'not.be.disabled'
  const radioCheckedClass = params.disabled ? '.radio.checked.disabled' : '.radio.checked'

  // 本人確認方法が対面確認であることを確認
  cy.get('[data-cy="edit-terminal-mobile-pic-information-pic-verification-method"]')
    .find(radioCheckedClass)
    .find('.label.inPersonVerification')
    .should('have.length', 1)

  // 文言の表示確認
  if (!params.disabled) {
    cy.get(
      '[data-cy="edit-terminal-mobile-pic-information-message-pic-information-with-in-person-verification"]',
    ).should('exist')
  }
  cy.get('[data-cy="edit-terminal-mobile-pic-information-message-pic-information-with-my-number-card"]').should(
    'not.exist',
  )
  cy.get('[data-cy="edit-terminal-mobile-pic-information-note-my-number-card"]').should('not.exist')
  cy.get('[data-cy="edit-terminal-mobile-pic-information-note-in-person-verification"]').should('exist')

  // 担当者本人確認書類種別
  cy.get('[data-cy="edit-terminal-mobile-pic-information-pic-identification-document-type"]')
    .find('input')
    .should(disabled)
    .should('have.value', t(`documentType.${params.inputData.picIdentificationDocumentType}`))

  // 担当者本人確認書類の証明書番号
  if (getShowPicIdentificationNumber(params.inputData.picIdentificationDocumentType)) {
    cy.get('[data-cy="edit-terminal-mobile-pic-information-pic-identification-number"]')
      .find('input')
      .should(disabled)
      .should('have.value', params.inputData.picIdentificationNumber)
  } else {
    cy.get('[data-cy="edit-terminal-mobile-pic-information-pic-identification-number"]').should('not.exist')
  }

  // 担当者本人確認書類（表）
  cy.confirmFileUpload({
    className: '[data-cy="edit-terminal-mobile-pic-information-pic-identification-front-document-id"]',
    documentId: params.inputData.picIdentificationFrontDocumentId,
    disabled: params.disabled,
  })

  // 担当者本人確認書類（裏）
  if (getShowPicIdentificationBackDocumentFile(params.inputData.picIdentificationDocumentType)) {
    cy.confirmFileUpload({
      className: '[data-cy="edit-terminal-mobile-pic-information-pic-identification-back-document-id"]',
      documentId: params.inputData.picIdentificationBackDocumentId,
      disabled: params.disabled,
    })
  } else {
    cy.get('[data-cy="edit-terminal-mobile-pic-information-pic-identification-back-document-id"]').should('not.exist')
  }

  // 担当者本人確認追加書類
  if (getShowPicIdentificationAdditionalDocumentFile(params.inputData.picIdentificationDocumentType)) {
    cy.confirmFileUpload({
      className: '[data-cy="edit-terminal-mobile-pic-information-pic-identification-additional-document-id"]',
      documentId: params.inputData.picIdentificationAdditionalDocumentId,
      disabled: params.disabled,
    })
  } else {
    cy.get('[data-cy="edit-terminal-mobile-pic-information-pic-identification-additional-document-id"]').should(
      'not.exist',
    )
  }

  // 担当者本人確認補助書類
  if (getShowPicAuxiliaryIdentificationDocumentType(params.inputData.picIdentificationDocumentType)) {
    // 担当者本人確認補助書類証明書種別
    cy.get('[data-cy="edit-terminal-mobile-pic-information-pic-auxiliary-identification-document-type"]')
      .find('input')
      .should(disabled)
      .should('have.value', t(`documentType.${params.inputData.picAuxiliaryIdentificationDocumentType}`))
    // 担当者本人確認補助書類証明書書類
    cy.confirmFileUpload({
      className: '[data-cy="edit-terminal-mobile-pic-information-pic-auxiliary-identification-document-id"]',
      documentId: params.inputData.picAuxiliaryIdentificationDocumentId,
      disabled: params.disabled,
    })
  } else {
    cy.get('[data-cy="edit-terminal-mobile-pic-information-pic-auxiliary-identification-document-type"]').should(
      'not.exist',
    )
    cy.get('[data-cy="edit-terminal-mobile-pic-information-pic-auxiliary-identification-document-id"]').should(
      'not.exist',
    )
  }

  // 共通項目
  // 担当者名
  cy.get('[data-cy="edit-terminal-mobile-pic-information-pic-name"]')
    .find('input')
    .should(disabled)
    .should('have.value', params.inputData.picName)

  // 担当者名カナ
  cy.get('[data-cy="edit-terminal-mobile-pic-information-pic-name-kana"]')
    .find('input')
    .should(disabled)
    .should('have.value', params.inputData.picNameKana)

  // 担当者郵便番号
  cy.get('[data-cy="edit-terminal-mobile-pic-information-pic-postal-code"]')
    .find('input')
    .should(disabled)
    .should('have.value', params.inputData.picPostalCode)

  // 担当者住所
  cy.get('[data-cy="edit-terminal-mobile-pic-information-pic-address"]')
    .find('input')
    .should(disabled)
    .should('have.value', params.inputData.picAddress)

  // 担当者住所カナ
  cy.get('[data-cy="edit-terminal-mobile-pic-information-pic-address-kana"]')
    .find('input')
    .should(disabled)
    .should('have.value', params.inputData.picAddressKana)

  // 担当者生年月日
  cy.get('[data-cy="edit-terminal-mobile-pic-information-pic-date-of-birth"]')
    .find('input')
    .should(disabled)
    .should('have.value', dayjs(params.inputData.picDateOfBirth).format('YYYY/MM/DD'))

  // 担当者電話番号
  cy.get('[data-cy="edit-terminal-mobile-pic-information-pic-phone-number"]')
    .find('input')
    .should(disabled)
    .should('have.value', params.inputData.picPhoneNumber)
})

Cypress.Commands.add('confirmTerminalWithoutMobile', params => {
  const className = params.className ? `${params.className} ` : ''
  const vpnCustomerNote = params.vpnList?.find(vpn => vpn.vpnId === params.inputData.vpnId)?.customerNote
  const vpnIdName = params.inputData.vpnId ? `${params.inputData.vpnId} / ${vpnCustomerNote}` : t('vpn.unselected')
  const disabled = params.disabled ? 'be.disabled' : 'not.be.disabled'
  const radioCheckedClass = params.disabled ? '.radio.checked.disabled' : '.radio.checked'
  const isRouter02 = !params.isBulk && params.inputData.terminalDeviceType === TerminalDeviceTypes.Router02

  // 利用ルーター機種
  if (params.isBulk) {
    cy.get(`${className}[data-cy="edit-terminal-data-terminal-device-type"]`).should('not.exist')
  } else {
    cy.get(`${className}[data-cy="edit-terminal-data-terminal-device-type"]`)
      .find(radioCheckedClass)
      .find(`.label.${params.inputData.terminalDeviceType}`)
      .should('have.length', 1)
  }

  // 利用回線選択
  cy.get(`${className}[data-cy="edit-terminal-data-edit-circuit-types"]`)
    .find(`${radioCheckedClass} > div`)
    .should('have.attr', 'data-cy', `${params.inputData.primaryCircuitType}-${params.inputData?.secondaryCircuitType}`)

  // ルーター基本設定
  cy.get(`${className}[data-cy="edit-terminal-data-customer-note"]`)
    .find('input')
    .should(disabled)
    .should('have.value', params.inputData.customerNote)
  cy.get(`${className}[data-cy="edit-terminal-data-installation-postal-code"]`)
    .find('input')
    .should(disabled)
    .should('have.value', params.inputData.installationPostalCode)
  cy.get(`${className}[data-cy="edit-terminal-data-installation-address"]`)
    .find('input')
    .should(disabled)
    .should('have.value', params.inputData.installationAddress)

  // リソース設定 - ギャランティアクセス
  if (params.inputData.primaryCircuitType !== CircuitTypes.Guarantee) {
    cy.get(`${className}[data-cy="edit-terminal-data-guarantee-guarantee-id"]`)
      .find('input')
      .should('be.disabled')
      .should('have.value', '')
    cy.get(`${className}[data-cy="edit-terminal-data-guarantee-vpn-act-connected-ipv4-prefix"]`).should('not.exist')
    cy.get(`${className}[data-cy="edit-terminal-data-guarantee-vpn-sby-connected-ipv4-prefix"]`).should('not.exist')
  } else {
    const guaranteeCustomerNote = params.guaranteeList?.find(
      guarantee => guarantee.guaranteeId === params.inputData.guarantee.guaranteeId,
    )?.customerNote
    cy.get(`${className}[data-cy="edit-terminal-data-guarantee-guarantee-id"]`)
      .find('input')
      .should(disabled)
      .should('have.value', `${params.inputData.guarantee.guaranteeId} / ${guaranteeCustomerNote}`)
    // ギャランティアクセス - VPN
    cy.get(`${className}[data-cy="edit-terminal-data-guarantee-vpn-act-connected-ipv4-prefix"]`)
      .find('input')
      .should(disabled)
      .should(
        'have.value',
        params.inputData.vpnId ? stripPrefix(params.inputData.guarantee.vpn.act.connectedIpv4Prefix) : '',
      )
    cy.get(`${className}[data-cy="edit-terminal-data-guarantee-vpn-sby-connected-ipv4-prefix"]`)
      .find('input')
      .should(disabled)
      .should(
        'have.value',
        params.inputData.vpnId ? stripPrefix(params.inputData.guarantee.vpn.sby.connectedIpv4Prefix) : '',
      )
  }
  // リソース設定 - IPoE回線
  if (
    params.inputData.primaryCircuitType !== CircuitTypes.Ipoe &&
    params.inputData.secondaryCircuitType !== CircuitTypes.Ipoe
  ) {
    cy.get(`${className}[data-cy="edit-terminal-data-ipoe-id"]`)
      .find('input')
      .should('be.disabled')
      .should('have.value', '')
  } else {
    const ipoeCustomerNote = params.ipoeList?.find(ipoe => ipoe.ipoeId === params.inputData.ipoeId)?.customerNote
    cy.get(`${className}[data-cy="edit-terminal-data-ipoe-id"]`)
      .find('input')
      .should(disabled)
      .should('have.value', `${params.inputData.ipoeId} / ${ipoeCustomerNote}`)
  }
  // リソース設定 - VPN ID
  if (!params.isBulk) {
    cy.get(`${className}[data-cy="edit-terminal-data-vpn-id"]`)
      .find('input')
      .should(disabled)
      .should('have.value', vpnIdName)
  } else {
    cy.get(`${className}[data-cy="edit-terminal-data-vpn-id"]`).should('not.exist')
  }
  // ネットワーク設定 - Loopbackアドレス
  cy.get(`${className}[data-cy="edit-terminal-data-loopback-ipv4-address"]`)
    .find('input')
    .should(disabled)
    .should('have.value', params.inputData.loopbackIpv4Address)
  // ネットワーク設定 - LANタイプ
  cy.get(`${className}[data-cy="edit-terminal-data-lan-type"]`)
    .find('input')
    .should(isRouter02 ? 'be.disabled' : disabled)
    .should(
      'have.value',
      isRouter02 ? t(`terminals.${LanTypes.SwitchPort}`) : t(`terminals.${params.inputData.lanType}`),
    )
  // ネットワーク設定 - 直下セグメント
  cy.confirmEditLans({
    lans: params.inputData.lans,
    className: `${className}[data-cy="edit-terminal-data-lans"]`,
    disabled: params.disabled,
    lanType: params.inputData.lanType,
    hideLanInFilters: isRouter02,
  })

  // ネットワーク設定 - デフォルトルート設定
  if (params.inputData.defaultGateway.nexthopNetwork === NetworkTypes.Internet) {
    cy.get(`${className}[data-cy="edit-terminal-data-default-gateway-nexthop-network"]`)
      .find('input')
      .should(disabled)
      .should('have.value', 'Internet')
    cy.get(`${className}[data-cy="edit-terminal-data-default-gateway-nexthop-ipv4-address"]`).should('not.exist')
    cy.get(`${className}[data-cy="edit-terminal-data-default-gateway-vpn-routing"]`).should('not.exist')
    cy.get(`${className}[data-cy="edit-terminal-data-break-out"]`).should('not.exist')
    cy.get(`${className}[data-cy="edit-terminal-data-break-out-dns-servers"]`).should('not.exist')
  }
  if (params.inputData.defaultGateway.nexthopNetwork === NetworkTypes.Lan) {
    cy.get(`${className}[data-cy="edit-terminal-data-default-gateway-nexthop-network"]`)
      .find('input')
      .should(disabled)
      .should('have.value', 'LAN')
    cy.get(`${className}[data-cy="edit-terminal-data-default-gateway-nexthop-ipv4-address"]`)
      .find('input')
      .should(disabled)
      .should('have.value', params.inputData.defaultGateway.nexthopIpv4Address)
    cy.get(`${className}[data-cy="edit-terminal-data-default-gateway-vpn-routing"]`)
      .find(radioCheckedClass)
      .find(`.label.${params.inputData.defaultGateway.vpnRouting}`)
      .should('have.length', 1)
    cy.get(`${className}[data-cy="edit-terminal-data-break-out"]`).should('not.exist')
    cy.get(`${className}[data-cy="edit-terminal-data-break-out-dns-servers"]`).should('not.exist')
  }
  if (params.inputData.defaultGateway.nexthopNetwork === NetworkTypes.Vpn) {
    cy.get(`${className}[data-cy="edit-terminal-data-default-gateway-nexthop-network"]`)
      .find('input')
      .should(disabled)
      .should('have.value', 'VPN')
    cy.get(`${className}[data-cy="edit-terminal-data-default-gateway-nexthop-ipv4-address"]`).should('not.exist')
    cy.get(`${className}[data-cy="edit-terminal-data-default-gateway-vpn-routing"]`).should('not.exist')
    cy.get(`${className}[data-cy="edit-terminal-data-break-out"]`).find('input').should(disabled)
    if (params.inputData.breakOut.length > 0) {
      params.inputData.breakOut.forEach((value: string) => {
        cy.get(`${className}[data-cy="edit-terminal-data-break-out"]`)
          .find(`[data-cy="multiple-select-form-${value}"]`)
          .should('have.length', 1)
      })
      cy.get(`${className}[data-cy="edit-terminal-data-break-out-dns-servers"]`)
        .find('.multiple-add')
        .should(params.disabled ? 'not.exist' : 'exist')
      params.inputData.interceptDnsServers.forEach((value: string, index: number) => {
        cy.get(`${className}[data-cy="edit-terminal-data-break-out-dns-servers"]`)
          .find('input')
          .eq(index)
          .should(disabled)
          .should('have.value', value)
      })
    } else {
      cy.get(`${className}[data-cy="edit-terminal-data-break-out"]`)
        .find('input')
        .should('have.value', t('breakOut.unselected'))
      cy.get(`${className}[data-cy="edit-terminal-data-break-out-dns-servers"]`).should('not.exist')
    }
  }

  // トラフィックレポート（フロー分析）
  if (params.inputData.primaryCircuitType === CircuitTypes.Guarantee) {
    cy.get(`${className}[data-cy="edit-traffic-report-flow-analyzer-plan-select-form"]`)
      .find('input')
      .should(disabled)
      .should(
        'have.value',
        getTrafficReportFlowAnalyzerPlanInputValue(
          params.inputData.trafficReportFlowAnalyzer.trafficReportFlowAnalyzerPlan,
        ),
      )
  } else {
    cy.get(`${className}[data-cy="edit-traffic-report-flow-analyzer-plan-select-form"]`).should('not.exist')
  }

  // セキュリティオプション
  cy.get(`${className}[data-cy="edit-security-options-threat-detection-plan"]`)
    .find('input')
    .should(disabled)
    .should('have.value', getThreatDetectionPlanInputValue(params.inputData.threatDetection.threatDetectionPlan))
  cy.get(`${className}[data-cy="edit-security-options-flow-collector-plan"]`)
    .find('input')
    .should(disabled)
    .should('have.value', getFlowCollectorPlanInputValue(params.inputData.flowCollector.flowCollectorPlan))
  cy.get(`${className}[data-cy="edit-security-options-behavior-detection-plan"]`)
    .find('input')
    .should(disabled)
    .should('have.value', getBehaviorDetectionPlanInputValue(params.inputData.behaviorDetection.behaviorDetectionPlan))

  if (!params.isBulk) {
    // 端末詳細設定 - 拠点内セグメント（非直下セグメント）
    cy.confirmEditLanStaticRoutes({
      lanStaticRoutes: params.assertion ? params.assertion.lanStaticRoutes : params.inputData.lanStaticRoutes,
      className: `${className}[data-cy="edit-terminal-data-lan-static-routes"]`,
      disabled: params.disabled,
    })
    // 端末詳細設定 - WAN向けスタティックルート設定
    cy.confirmEditWanStaticRoutes({
      wanStaticRoutes: params.assertion ? params.assertion.wanStaticRoutes : params.inputData.wanStaticRoutes,
      className: `${className}[data-cy="edit-terminal-data-wan-static-routes"]`,
      disabled: params.disabled,
    })
    cy.confirmEditFilters({
      inputData: params.inputData.vpnId ? params.inputData.vpnInFilters : null,
      className: `${className}[data-cy="edit-terminal-data-vpn-in-filters"]`,
      disabled: params.disabled,
    })
    // 端末詳細設定 - WANポートフィルタ（拠点 → VPN）
    cy.confirmEditFilters({
      inputData: params.inputData.vpnId ? params.inputData.vpnOutFilters : null,
      className: `${className}[data-cy="edit-terminal-data-vpn-out-filters"]`,
      disabled: params.disabled,
    })
    // 端末詳細設定 - WANポートフィルタ（拠点 → Internet）
    cy.confirmEditFilters({
      inputData: params.inputData.inet4OutFilters,
      className: `${className}[data-cy="edit-terminal-data-inet4-out-filters"]`,
      disabled: params.disabled,
    })
  } else {
    cy.get(`${className}[data-cy="edit-terminal-data-lan-static-routes"]`).should('not.exist')
    cy.get(`${className}[data-cy="edit-terminal-data-wan-static-routes"]`).should('not.exist')
    cy.get(`${className}[data-cy="edit-terminal-data-vpn-in-filters"]`).should('not.exist')
    cy.get(`${className}[data-cy="edit-terminal-data-vpn-out-filters"]`).should('not.exist')
    cy.get(`${className}[data-cy="edit-terminal-data-inet4-out-filters"]`).should('not.exist')
  }

  // 端末詳細設定 - DHCP リレー
  if (params.inputData.lans.find((lan: TerminalLansType) => !!lan.dhcpServer)) {
    // lans で dhcpServer を設定済みの場合はメッセージ表示
    cy.get(`${className}[data-cy="edit-terminal-data-message-dhcp-settings"]`).should('exist')
  } else {
    // それ以外の場合は DHCP の入力が可能
    cy.get(`${className}[data-cy="edit-terminal-data-message-dhcp-settings"]`).should('not.exist')
    params.inputData?.dhcpRelayServers?.forEach(
      ({ serverIpv4Address }: { serverIpv4Address: string }, index: number) => {
        cy.get(`${className}[data-cy="edit-terminal-data-dhcp-relay-servers"]`)
          .find('input')
          .eq(index)
          .should(disabled)
          .should('have.value', serverIpv4Address)
      },
    )
  }

  // 配送先情報
  cy.get(`${className}[data-cy="edit-terminal-data-delivery-name"]`)
    .find('input')
    .should(disabled)
    .should('have.value', params.inputData.deliveryName)
  cy.get(`${className}[data-cy="edit-terminal-data-delivery-company-name"]`)
    .find('input')
    .should(disabled)
    .should('have.value', params.inputData.deliveryCompanyName || '')
  cy.get(`${className}[data-cy="edit-terminal-data-delivery-department-name"]`)
    .find('input')
    .should(disabled)
    .should('have.value', params.inputData.deliveryDepartmentName)
  cy.get(`${className}[data-cy="edit-terminal-data-delivery-phone-number"]`)
    .find('input')
    .should(disabled)
    .should('have.value', params.inputData.deliveryPhoneNumber)
  cy.get(`${className}[data-cy="edit-terminal-data-delivery-postal-code"]`)
    .find('input')
    .should(disabled)
    .should('have.value', params.inputData.deliveryPostalCode)
  cy.get(`${className}[data-cy="edit-terminal-data-delivery-address"]`)
    .find('input')
    .should(disabled)
    .should('have.value', params.inputData.deliveryAddress)
  cy.get(`${className}[data-cy="edit-terminal-data-delivery-address-kana"]`)
    .find('input')
    .should(disabled)
    .should('have.value', params.inputData.deliveryAddressKana)
  cy.confirmDatePicker({
    className: `${className}[data-cy="edit-terminal-data-delivery-date"]`,
    date: params.inputData.deliveryDate,
    disabled: params.disabled,
  })
})

Cypress.Commands.add('checkTermsLinkButtonLabel', params => {
  // 同意設定ボタンの表示内容確認
  if (params.primaryCircuitType === CircuitTypes.Guarantee) {
    cy.get('[data-cy="edit-traffic-report-flow-analyzer-terms-link-button"]').should(
      'have.text',
      getTermsLinkButtonLabel(params.trafficReportFlowAnalyzerTermsOfServiceAccepted),
    )
  }
  cy.get('[data-cy="edit-security-options-terms-link-button"]').should(
    'have.text',
    getTermsLinkButtonLabel(params.securityTermsOfServiceAccepted),
  )
})

Cypress.Commands.add('checkTermsOfServiceConfirmDialogContent', params => {
  // どちらも利用しないか、どちらも同意済みの場合はダイアログが表示されないことを確認
  if (!params.trafficReportFlowAnalyzer && !params.securityOptions && !params.behaviorDetectionPlan) {
    cy.get('[data-cy="terms-of-service-confirm-dialog"]').should('not.exist')
    return
  }
  // トラフィックレポート（フロー分析）のみ
  if (params.trafficReportFlowAnalyzer && !params.securityOptions && !params.behaviorDetectionPlan) {
    cy.get('[data-cy="terms-of-service-confirm-dialog-behavior-detection-message"]').should('not.exist')
    cy.get('[data-cy="terms-of-service-confirm-dialog-flow-analyzer-security-message"]').should('exist')
    cy.get('[data-cy="terms-of-service-confirm-dialog-agreement-settings-button"]').should('exist')
    cy.get('[data-cy="terms-of-service-confirm-dialog-behavior-detection-plan-button"]').should('not.exist')
  }
  // セキュリティオプションのみ
  if (!params.trafficReportFlowAnalyzer && params.securityOptions && !params.behaviorDetectionPlan) {
    cy.get('[data-cy="terms-of-service-confirm-dialog-behavior-detection-message"]').should('not.exist')
    cy.get('[data-cy="terms-of-service-confirm-dialog-flow-analyzer-security-message"]').should('exist')
    cy.get('[data-cy="terms-of-service-confirm-dialog-agreement-settings-button"]').should('exist')
    cy.get('[data-cy="terms-of-service-confirm-dialog-behavior-detection-plan-button"]').should('not.exist')
  }
  // セキュリティオプション + ふるまい検知 または トラフィックレポート（フロー分析） + ふるまい検知
  if (
    ((!params.trafficReportFlowAnalyzer && params.securityOptions) ||
      (params.trafficReportFlowAnalyzer && !params.securityOptions)) &&
    params.behaviorDetectionPlan
  ) {
    cy.get('[data-cy="terms-of-service-confirm-dialog-behavior-detection-message"]').should('exist')
    cy.get('[data-cy="terms-of-service-confirm-dialog-flow-analyzer-security-message"]').should('exist')
    cy.get('[data-cy="terms-of-service-confirm-dialog-agreement-settings-button"]').should('exist')
    cy.get('[data-cy="terms-of-service-confirm-dialog-behavior-detection-plan-button"]').should('exist')
  }
  // ふるまい検知のみ
  if (!params.trafficReportFlowAnalyzer && !params.securityOptions && params.behaviorDetectionPlan) {
    cy.get('[data-cy="terms-of-service-confirm-dialog-behavior-detection-message"]').should('exist')
    cy.get('[data-cy="terms-of-service-confirm-dialog-flow-analyzer-security-message"]').should('not.exist')
    cy.get('[data-cy="terms-of-service-confirm-dialog-agreement-settings-button"]').should('not.exist')
    cy.get('[data-cy="terms-of-service-confirm-dialog-behavior-detection-plan-button"]').should('exist')
  }
  // トラフィックレポート（フロー分析）+ セキュリティオプション
  if (params.trafficReportFlowAnalyzer && params.securityOptions && !params.behaviorDetectionPlan) {
    cy.get('[data-cy="terms-of-service-confirm-dialog-behavior-detection-message"]').should('not.exist')
    cy.get('[data-cy="terms-of-service-confirm-dialog-flow-analyzer-security-message"]').should('exist')
  }
  // トラフィックレポート（フロー分析）+ セキュリティオプション + ふるまい検知
  if (params.trafficReportFlowAnalyzer && params.securityOptions && params.behaviorDetectionPlan) {
    cy.get('[data-cy="terms-of-service-confirm-dialog-behavior-detection-message"]').should('exist')
    cy.get('[data-cy="terms-of-service-confirm-dialog-flow-analyzer-security-message"]').should('exist')
    cy.get('[data-cy="terms-of-service-confirm-dialog-agreement-settings-button"]').should('exist')
    cy.get('[data-cy="terms-of-service-confirm-dialog-behavior-detection-plan-button"]').should('exist')
  }
  // ダイアログを閉じる
  cy.get('[data-cy="terms-of-service-confirm-dialog-close-button"]').click()
  cy.get('[data-cy="terms-of-service-confirm-dialog"]').should('not.exist')
})

Cypress.Commands.add('checkTerminalSuccessDialog', params => {
  // terminalId が渡されている場合（自営ルーター作成）
  if (params.terminalId) {
    // 申込受付メッセージ（orderId/bulkOrderId なし）
    cy.get('[data-cy="terminal-success-dialog-accepted-message"]').should('have.text', t('message.accepted'))

    // 自営ルーター作成後の専用メッセージ
    cy.get('[data-cy="self-terminal-create-dialog-message-1"]').should(
      'have.text',
      t('selfTerminals.created.message-1'),
    )
    cy.get('[data-cy="self-terminal-create-dialog-message-2"]').should(
      'have.text',
      t('selfTerminals.created.message-2'),
    )
    cy.get('[data-cy="self-terminal-create-dialog-message-3"]').should(
      'have.text',
      t('selfTerminals.created.message-3', {
        here: t('common.here'),
      }),
    )

    // 自営ルーター詳細ページへのボタン
    cy.get('[data-cy="terminal-success-dialog-move-to-detail"]').should('exist')

    // オーダー詳細ボタンは表示されない
    cy.get('[data-cy="terminal-success-dialog-move-to-order-detail"]').should('not.exist')
  } else {
    // サービスルーター作成・編集の場合
    // 申込受付メッセージ（orderId または bulkOrderId 付き）
    if (params.orderId) {
      cy.get('[data-cy="terminal-success-dialog-accepted-message"]').should(
        'have.text',
        `${t('message.accepted')}\n${t('details.orderId')} ${params.orderId}`,
      )
    } else if (params.bulkOrderId) {
      cy.get('[data-cy="terminal-success-dialog-accepted-message"]').should(
        'have.text',
        `${t('message.accepted')}\n${t('orders.bulkOrderId')} ${params.bulkOrderId}`,
      )
    } else {
      cy.get('[data-cy="terminal-success-dialog-accepted-message"]').should('have.text', t('message.accepted'))
    }

    // 自営ルーター専用メッセージは表示されない
    cy.get('[data-cy="self-terminal-create-dialog-message-1"]').should('not.exist')
    cy.get('[data-cy="self-terminal-create-dialog-message-2"]').should('not.exist')
    cy.get('[data-cy="self-terminal-create-dialog-message-3"]').should('not.exist')

    // オーダー詳細ボタン
    cy.get('[data-cy="terminal-success-dialog-move-to-order-detail"]').should('exist')

    // 自営ルーター詳細ボタンは表示されない
    cy.get('[data-cy="terminal-success-dialog-move-to-detail"]').should('not.exist')
  }
  // ヘルプデスクキャンペーンの表示確認
  if (
    params.securityHelpDeskStatus === 'unused' &&
    (params.threatDetectionPlan !== SecurityOptionTypes.NoSubscription ||
      params.flowCollectorPlan !== SecurityOptionTypes.NoSubscription ||
      params.behaviorDetectionPlan !== BehaviorDetectionOptionTypes.NoSubscription)
  ) {
    cy.get('[data-cy="terminal-success-dialog-help-desk-campaign"]').should('exist')
    cy.get('[data-cy="terminal-success-dialog-move-to-security-help-desk-create"]').should('exist')
  } else {
    cy.get('[data-cy="terminal-success-dialog-help-desk-campaign"]').should('not.exist')
    cy.get('[data-cy="terminal-success-dialog-move-to-security-help-desk-create"]').should('not.exist')
  }
})

// 確認チェックボックスをクリックする
Cypress.Commands.add('clickCreateConfirmCheckboxes', params => {
  // メインがIPoEでバックアップがワイヤレスアクセスの場合、IPoEのチェックボックスが表示される
  if (
    params.terminal.primaryCircuitType === CircuitTypes.Ipoe &&
    params.terminal.secondaryCircuitType === CircuitTypes.Mobile
  ) {
    cy.get('[data-cy="terminal-create-checkbox-ipoe"] .checkbox').should('not.have.class', 'checked').click()
    cy.get('[data-cy="terminal-create-checkbox-ipoe"]').should('have.text', t('terminals.confirm.checkIpoe'))
  } else {
    cy.get('[data-cy="terminal-create-checkbox-ipoe"]').should('not.exist')
  }
  // VPN ID が設定されている場合、VPN ID のチェックボックスが表示される
  if (params.terminal.vpnId) {
    cy.get('[data-cy="terminal-create-checkbox-vpn-id"] .checkbox').should('not.have.class', 'checked').click()
    cy.get('[data-cy="terminal-create-checkbox-vpn-id"]').should('have.text', t('terminals.note.vpnId'))
  } else {
    cy.get('[data-cy="terminal-create-checkbox-vpn-id"]').should('not.exist')
  }
  // メインかバックアップにワイヤレスアクセスが含まれる場合、契約者住所と担当者のチェックボックスが表示される
  if (
    params.terminal.primaryCircuitType === CircuitTypes.Mobile ||
    params.terminal.secondaryCircuitType === CircuitTypes.Mobile
  ) {
    cy.get('[data-cy="terminal-create-checkbox-contractor-address"] .checkbox')
      .should('not.have.class', 'checked')
      .click()
    cy.get('[data-cy="terminal-create-checkbox-contractor-address"]').should(
      'have.text',
      t('terminals.confirm.checkContractorAddress', { here: t('common.here') }),
    )
    cy.get('[data-cy="terminal-create-checkbox-pic-information"] .checkbox').should('not.have.class', 'checked').click()
    cy.get('[data-cy="terminal-create-checkbox-pic-information"]').should(
      'have.text',
      t('terminals.confirm.checkPicInformation', { here: t('common.here') }),
    )
  } else {
    cy.get('[data-cy="terminal-create-checkbox-contractor-address"]').should('not.exist')
    cy.get('[data-cy="terminal-create-checkbox-pic-information"]').should('not.exist')
  }
  cy.get('[data-cy="terminal-create-checkbox-loopback-ipv4-address"] .checkbox')
    .should('not.have.class', 'checked')
    .click()
  cy.get('[data-cy="terminal-create-checkbox-loopback-ipv4-address"]').should(
    'have.text',
    t('terminals.confirm.checkLoopback', { here: t('common.here') }),
  )
})

// 規約同意チェックボックスをクリックする
Cypress.Commands.add('clickCreateTermsOfServiceCheckboxes', params => {
  const showBreakOut = params.terminal.defaultGateway.nexthopNetwork === 'vpn' && params.terminal.breakOut.length > 0
  const showSecurityOptions =
    params.terminal.threatDetection?.threatDetectionPlan !== SecurityOptionTypes.NoSubscription ||
    params.terminal.flowCollector?.flowCollectorPlan !== SecurityOptionTypes.NoSubscription ||
    params.terminal.behaviorDetection?.behaviorDetectionPlan !== BehaviorDetectionOptionTypes.NoSubscription
  const showTrafficReportFlowAnalyzer =
    params.terminal.trafficReportFlowAnalyzer?.trafficReportFlowAnalyzerPlan !==
    TrafficReportFlowAnalyzerPlanTypes.NoSubscription

  // ブレイクアウトの規約同意
  if (showBreakOut) {
    cy.get('[data-cy="terminal-create-terminal-terms-of-service-break-out"]').should('exist')
    cy.get('[data-cy="terminal-create-terminal-terms-of-service-break-out"]')
      .find('[data-cy="terminal-terms-of-service-agreement"]')
      .find('.checkbox')
      .should('not.have.class', 'checked')
      .click()
  } else {
    cy.get('[data-cy="terminal-create-terminal-terms-of-service-break-out"]').should('not.exist')
  }
  // VPN ID の規約同意
  if (params.terminal.vpnId) {
    cy.get('[data-cy="terminal-create-terminal-terms-of-service-vpn-id"]').should('exist')
    cy.get('[data-cy="terminal-create-terminal-terms-of-service-vpn-id"]')
      .find('[data-cy="terminal-terms-of-service-agreement"]')
      .find('.checkbox')
      .should('not.have.class', 'checked')
      .click()
  } else {
    cy.get('[data-cy="terminal-create-terminal-terms-of-service-vpn-id"]').should('not.exist')
  }
  // WANセキュリティオプションの規約同意
  if (showSecurityOptions) {
    cy.get('[data-cy="terminal-create-terminal-terms-of-service-wan-security-options"]').should('exist')
    cy.get('[data-cy="terminal-create-terminal-terms-of-service-wan-security-options"]')
      .find('[data-cy="terminal-terms-of-service-agreement"]')
      .find('.checkbox')
      .should('not.have.class', 'checked')
      .click()
  } else {
    cy.get('[data-cy="terminal-create-terminal-terms-of-service-wan-security-options"]').should('not.exist')
  }
  // トラフィックレポート（フロー分析）の規約同意
  if (showTrafficReportFlowAnalyzer) {
    cy.get('[data-cy="terminal-create-terminal-terms-of-service-traffic-report-flow-analyzer"]').should('exist')
    cy.get('[data-cy="terminal-create-terminal-terms-of-service-traffic-report-flow-analyzer"]')
      .find('[data-cy="terminal-terms-of-service-agreement"]')
      .find('.checkbox')
      .should('not.have.class', 'checked')
      .click()
  } else {
    cy.get('[data-cy="terminal-create-terminal-terms-of-service-traffic-report-flow-analyzer"]').should('not.exist')
  }
})
