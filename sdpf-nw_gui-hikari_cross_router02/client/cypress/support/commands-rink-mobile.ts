import { BreakOutTypes } from '@app/api/constants'
import type { RinkConnectionVpnFilterType, RinkConnectionCustomLocalBreakOutType } from '@app/api/rinkConnections/types'
import { MAX_BREAKOUT_COUNT } from '@app/api/rinkConnections/constants'
import { t } from '@cypress/support/utils'

Cypress.Commands.add('editApplicationFileUpload', params => {
  cy.get(params.className).find('[data-cy="file-upload-button"]').click()
  cy.get('.file-upload-dnd-area').selectFile(params.filePath, { action: 'drag-drop' })
  cy.get('.dialog-base-submit-button').click()
})

Cypress.Commands.add('inputEditVpnFilterList', params => {
  cy.removeRowMultipleForm({ className: params.className })
  params.vpnFilterList?.forEach((vpnFilter: RinkConnectionVpnFilterType, index: number) => {
    if (0 < index) {
      cy.get(params.className).find('.multiple-add').find('button').click()
    }
    cy.get(params.className)
      .find('[data-cy="edit-vpn-filter-list-pattern"]')
      .last()
      .find(`.label.${vpnFilter.pattern}`)
      .click()
    cy.get(params.className)
      .find('[data-cy="edit-vpn-filter-list-prefix-list"]')
      .find('textarea')
      .last()
      .clear()
      .type(vpnFilter.prefixList.join('\n'))
  })
})

Cypress.Commands.add('assertEditVpnFilterList', params => {
  if (!params.vpnFilterList.length) {
    cy.get(params.className).should('not.exist')
  }
  if (params.disabled) {
    cy.get(params.className).find('.multiple-add').should('not.exist')
    cy.get(params.className).find('[data-cy="multiple-form-trash-button"]').should('not.exist')
  }

  // 表示件数のチェック
  if (params.vpnFilterList?.length) {
    cy.get(params.className)
      .find('[data-cy="edit-vpn-filter-list-pattern"]')
      .should('have.length', params.vpnFilterList.length)
  }

  params.vpnFilterList?.forEach((vpnFilter: RinkConnectionVpnFilterType, index: number) => {
    cy.get(params.className)
      .find('[data-cy="edit-vpn-filter-list-pattern"]')
      .eq(index)
      .find(`.label.${vpnFilter.pattern}`)
      .parent()
      .should('have.class', 'checked')
      .should(params.disabled ? 'have.class' : 'not.have.class', 'disabled')
    cy.get(params.className)
      .find('[data-cy="edit-vpn-filter-list-prefix-list"]')
      .eq(index)
      .find('textarea')
      .should('have.value', vpnFilter.prefixList.join('\n'))
      .should(params.disabled ? 'be.disabled' : 'not.be.disabled')
  })
})

Cypress.Commands.add('inputEditCustomLocalBreakOutList', params => {
  cy.removeRowMultipleForm({ className: params.className })
  params.customLocalBreakOutList?.forEach((breakOut: RinkConnectionCustomLocalBreakOutType, index: number) => {
    // 最大数に達している場合は追加ボタンが押せないことを確認
    if (index >= params.maxItems) {
      cy.get(params.className).find('.multiple-add').find('button').should('be.disabled')
      return
    }
    if (0 <= index) {
      cy.get(params.className).find('.multiple-add').find('button').click()
    }
    cy.get(params.className)
      .find('[data-cy="edit-custom-local-break-out-list-name"]')
      .last()
      .type(breakOut.name)
      .find('li')
      .eq(0)
      .click()
    cy.get(params.className)
      .find('[data-cy="edit-custom-local-break-out-list-name-alias"]')
      .find('input')
      .last()
      .clear()
      .type(breakOut.nameAlias)

    // dstPrefixLis と fqdnList は入力なしの場合あり
    cy.get(params.className)
      .find('[data-cy="edit-custom-local-break-out-list-dst-prefix-list"]')
      .find('textarea')
      .last()
      .as('dstPrefixTextarea')
      .clear()
    cy.get(params.className)
      .find('[data-cy="edit-custom-local-break-out-list-fqdn-list"]')
      .find('textarea')
      .last()
      .as('fqdnTextarea')
      .clear()
    if (breakOut.dstPrefixList?.length) {
      cy.get('@dstPrefixTextarea').type(breakOut.dstPrefixList.map(({ prefix }) => prefix).join('\n'))
    }
    if (breakOut.fqdnList?.length) {
      cy.get('@fqdnTextarea').type(breakOut.fqdnList.map(({ fqdn }) => fqdn).join('\n'))
    }
  })
})

Cypress.Commands.add('assertSystemLocalBreakOutList', params => {
  // 最大数に達した場合、選択済みの項目は有効、未選択の項目は無効であることを確認
  if (params.systemLocalBreakOutList?.length + params.customLocalBreakOutList?.length >= MAX_BREAKOUT_COUNT) {
    const selectedNames = params.systemLocalBreakOutList.map(({ name }: { name: string }) => name)
    Object.values(BreakOutTypes).forEach(name => {
      if (selectedNames.includes(name)) {
        // 選択済みの項目は有効（取消可能）
        cy.get(params.className).find(`.label.${name}`).should('not.have.class', 'disabled')
      } else {
        // 未選択の項目は無効（選択不可）
        cy.get(params.className).find(`.label.${name}`).should('have.class', 'disabled')
      }
    })
  }
})

Cypress.Commands.add('assertEditCustomLocalBreakOutList', params => {
  if (!params.customLocalBreakOutList?.length) {
    cy.get(params.className).should('not.exist')
  }
  if (params.disabled) {
    cy.get(params.className).find('.multiple-add').should('not.exist')
    cy.get(params.className).find('[data-cy="multiple-form-trash-button"]').should('not.exist')
  }

  // 表示件数のチェック
  if (params.customLocalBreakOutList?.length) {
    cy.get(params.className)
      .find('[data-cy="edit-custom-local-break-out-list-name"]')
      .find('input')
      .should('have.length', params.customLocalBreakOutList.length)
  }

  params.customLocalBreakOutList?.forEach((breakOut: RinkConnectionCustomLocalBreakOutType, index: number) => {
    cy.get(params.className)
      .find('[data-cy="edit-custom-local-break-out-list-name"]')
      .find('input')
      .eq(index)
      .should('have.value', breakOut.name)
      .should(params.disabled ? 'be.disabled' : 'not.be.disabled')
    cy.get(params.className)
      .find('[data-cy="edit-custom-local-break-out-list-name-alias"]')
      .find('input')
      .eq(index)
      .should('have.value', breakOut.nameAlias)
      .should(params.disabled ? 'be.disabled' : 'not.be.disabled')

    // dstPrefixLis と fqdnList は入力なしの場合あり
    const dstPrefixValue = breakOut.dstPrefixList?.length
      ? breakOut.dstPrefixList.map(({ prefix }) => prefix).join('\n')
      : ''
    cy.get(params.className)
      .find('[data-cy="edit-custom-local-break-out-list-dst-prefix-list"]')
      .find('textarea')
      .eq(index)
      .should('have.value', dstPrefixValue)
      .should(params.disabled ? 'be.disabled' : 'not.be.disabled')

    const fqdnValue = breakOut.fqdnList?.length ? breakOut.fqdnList.map(({ fqdn }) => fqdn).join('\n') : ''
    cy.get(params.className)
      .find('[data-cy="edit-custom-local-break-out-list-fqdn-list"]')
      .find('textarea')
      .eq(index)
      .should('have.value', fqdnValue)
      .should(params.disabled ? 'be.disabled' : 'not.be.disabled')
  })
})

Cypress.Commands.add('inputTimeFrame', params => {
  cy.get(params.className).within(() => {
    // 利用開始希望日の選択ボタンを押下
    cy.get('[data-cy="edit-schedule-network-date-select-button"]').click()
    // 利用開始希望日の選択
    cy.get('[data-cy="schedule-network-date-table"]').as('dateTable')
    cy.get('@dateTable').find('.radio.checked').should('have.length', 0)
    cy.get('.dialog-base-submit-button').should('have.text', t('common.save')).should('be.disabled')
    cy.get('@dateTable').find('.dates').find('.radio').find('.button').first().click()
    cy.get('.dialog-base-submit-button').should('not.be.disabled').click()
    cy.get('@dateTable').should('not.exist')
    cy.get('[data-cy="edit-schedule-network-date-input-form"]')
      .find('input')
      .should('have.value', params.scheduleNetworks[0].slice(0, 16).replace('T', ' ').replaceAll('-', '/'))
  })
})

Cypress.Commands.add('inputShippingInformation', params => {
  // 郵便番号を入力
  cy.get('[data-cy="edit-shipping-information-shipping-postal-code"]').find('input').type(params.shippingPostalCode)
  // 住所が自動補完されることを確認
  cy.get('[data-cy="edit-shipping-information-shipping-prefecture"]')
    .find('input')
    .should('have.value', params.shippingPrefecture)
  cy.get('[data-cy="edit-shipping-information-shipping-city"]').find('input').should('have.value', params.shippingCity)
  cy.get('[data-cy="edit-shipping-information-shipping-city-additional-info"]')
    .find('input')
    .should('have.value', params.shippingCityAdditionalInfo)
  // その他の情報を入力
  cy.get('[data-cy="edit-shipping-information-shipping-address-block"]').find('input').type(params.shippingAddressBlock)
  cy.get('[data-cy="edit-shipping-information-shipping-address-number"]')
    .find('input')
    .type(params.shippingAddressNumber)
  if (params.shippingBuilding) {
    cy.get('[data-cy="edit-shipping-information-shipping-building"]').find('input').type(params.shippingBuilding)
  } else {
    cy.get('[data-cy="edit-shipping-information-shipping-building"]').find('input').clear()
  }
  cy.get('[data-cy="edit-shipping-information-package-recipient"]').find('input').type(params.packageRecipient)
  cy.get('[data-cy="edit-shipping-information-phone-number"]').find('input').type(params.phoneNumber)
})

Cypress.Commands.add('confirmShippingInformation', params => {
  // 郵便番号
  const postalCode = params?.shippingPostalCode || ''
  const postalCodeValue = postalCode.includes('-')
    ? postalCode
    : 3 <= postalCode.length
      ? postalCode.slice(0, 3) + '-' + postalCode.slice(3)
      : postalCode

  cy.get('[data-cy="edit-shipping-information-shipping-postal-code"]')
    .find('input')
    .should('have.value', postalCodeValue)
  // 住所
  cy.get('[data-cy="edit-shipping-information-shipping-prefecture"]')
    .find('input')
    .should('have.value', params?.shippingPrefecture || '')
  cy.get('[data-cy="edit-shipping-information-shipping-city"]')
    .find('input')
    .should('have.value', params?.shippingCity || '')
  cy.get('[data-cy="edit-shipping-information-shipping-city-additional-info"]')
    .find('input')
    .should('have.value', params?.shippingCityAdditionalInfo || '')
  // その他の情報を入力
  cy.get('[data-cy="edit-shipping-information-shipping-address-block"]')
    .find('input')
    .should('have.value', params?.shippingAddressBlock || '')
  cy.get('[data-cy="edit-shipping-information-shipping-address-number"]')
    .find('input')
    .should('have.value', params?.shippingAddressNumber || '')
  cy.get('[data-cy="edit-shipping-information-shipping-building"]')
    .find('input')
    .should('have.value', params?.shippingBuilding || '')
  cy.get('[data-cy="edit-shipping-information-package-recipient"]')
    .find('input')
    .should('have.value', params?.packageRecipient || '')
  cy.get('[data-cy="edit-shipping-information-phone-number"]')
    .find('input')
    .should('have.value', params?.phoneNumber || '')
})
