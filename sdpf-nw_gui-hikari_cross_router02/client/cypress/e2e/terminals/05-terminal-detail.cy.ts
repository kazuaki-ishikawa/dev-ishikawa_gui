import { CircuitTypes, TerminalDeviceTypes } from '@app/api/constants'
import { FirmwareVersionTypes } from '@app/api/terminals/constants'
import { generateRandomHex, t } from '@cypress/support/utils'

type TerminalDevice = {
  model: string
  deviceAttribute: string
  serialNumber: string
  firmwareVersion: { displayName: string; attribute: string }
}

const testCases = [
  { fixturePath: 'terminals/detail-mobile' },
  { fixturePath: 'terminals/detail-ipoe' },
  { fixturePath: 'terminals/detail-guarantee-mobile' },
  { fixturePath: 'terminals/detail-guarantee-ipoe' },
  { fixturePath: 'terminals/detail-guarantee' },
]

describe('端末詳細', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)
    this.terminalId = generateRandomHex(32)
    this.detailUrl = `${Cypress.config().baseUrl}/tenants/${this.tenantId}/terminals/${this.terminalId}`

    cy.intercept('GET', '**/ztgict/v1/break-out-lists?resourceStatus=active&resourceStatus=inactive', {
      fixture: 'break-out-lists/list',
    }).as('getBreakOutList')
    cy.intercept('GET', '**/ztgict/v1/terminals/*/operation', { fixture: 'terminals/operations' }).as(
      'getTerminalOperation',
    )
    cy.intercept('GET', '**/ztgict/v1/settings/behavior-detection', {
      fixture: 'behavior-detection/settings',
    }).as('getBehaviorDetection')
  })

  testCases.forEach(testCase => {
    it(`表示項目確認 (${testCase.fixturePath})`, function () {
      cy.intercept('GET', '**/ztgict/v1/terminals/*', { fixture: testCase.fixturePath }).as('getTerminal')

      // 詳細画面の表示
      cy.visit(`/tenants/${this.tenantId}/terminals/${this.terminalId}`)
      cy.wait(['@getTerminalOperation', '@getBreakOutList', '@getTerminal'])

      cy.fixture(testCase.fixturePath).then(original => {
        // ルーター情報の表示確認
        if (!original.terminalDevices || original.terminalDevices?.length === 0) {
          // terminalDevices が null または 空配列の場合テーブル要素数は 0 になる
          cy.get('[data-cy="terminal-devices-table"]').find('.row').should('length', 0)
          cy.get('[data-cy="terminals-id-index-firmware-update-button"]').should('be.disabled')

          return
        }
        // テーブル要素数の確認
        cy.get('[data-cy="terminal-devices-table"]').find('.row').should('length', original.terminalDevices.length)
        original.terminalDevices.forEach((device: TerminalDevice, index: number) => {
          cy.get('[data-cy="terminal-devices-table"]')
            .find('.row')
            .eq(index)
            .children('div')
            .eq(0)
            .should('text', device.model)
          cy.get('[data-cy="terminal-devices-table"]')
            .find('.row')
            .eq(index)
            .children('div')
            .eq(1)
            .should('text', device.serialNumber)
          cy.get('[data-cy="terminal-devices-table"]')
            .find('.row')
            .eq(index)
            .children('div')
            .eq(2)
            .should(
              'text',
              `${device.firmwareVersion.displayName}（${t(`terminals.${device.firmwareVersion.attribute}`)}）`,
            )
        })

        // 全ての attribute が latest の場合、ファームウェアの更新ボタンが無効化されることを確認する
        const firmwareUpdateDisabled = original.terminalDevices.every(
          (device: TerminalDevice) => device.firmwareVersion?.attribute === FirmwareVersionTypes.Latest,
        )
        cy.get('[data-cy="terminals-id-index-firmware-update-button"]').should(
          firmwareUpdateDisabled ? 'be.disabled' : 'not.be.disabled',
        )

        // 迂回設定の表示確認
        if (original.primaryCircuit.circuitType === CircuitTypes.Guarantee) {
          // ファームウェアが最新の状態ではない場合、迂回設定ボタンが無効化されることを確認する
          const routeSwitchDisabled = original.terminalDevices.some(
            (device: TerminalDevice) => device.firmwareVersion?.attribute !== FirmwareVersionTypes.Latest,
          )
          cy.get('[data-cy="terminals-id-index-route-switch-button"]')
            .should('exist')
            .should('have.text', t('terminals.operations.switchover'))
            .should(routeSwitchDisabled ? 'be.disabled' : 'not.be.disabled')
        } else {
          // ギャランティ以外の場合は迂回設定欄が表示されないこと
          cy.get('[data-cy="terminals-id-index-route-switch-button"]').should('not.exist')
        }
      })
    })
  })

  it('RINKルーター02 の場合、ルーター直下セグメントの LANポートフィルタは表示されない', function () {
    cy.fixture('terminals/detail-ipoe').then(original => {
      const body = { ...original, terminalDeviceType: TerminalDeviceTypes.Router02 }
      cy.intercept('GET', '**/ztgict/v1/terminals/*', { body }).as('getTerminal')

      // 詳細画面の表示
      cy.visit(`/tenants/${this.tenantId}/terminals/${this.terminalId}`)
      cy.wait(['@getTerminalOperation', '@getBreakOutList', '@getTerminal'])

      // ルーター直下セグメントの表では LANポートフィルタの列自体が表示されない
      cy.confirmEditLans({
        lans: body.lans,
        className: '[data-cy="terminal-detail-lans"]',
        lanType: body.lanType,
        disabled: true,
        hideLanInFilters: true,
      })
    })
  })

  it('getTerminalOperation が 400 の場合、端末操作系ボタンが非活性になること', function () {
    cy.intercept('GET', '**/ztgict/v1/terminals/*', { fixture: 'terminals/detail-guarantee-using-post-operation' }).as(
      'getTerminal',
    )
    cy.intercept('GET', '**/ztgict/v1/terminals/*/operation', {
      statusCode: 400,
      fixture: 'terminals/operations',
    }).as('getTerminalOperation')

    // 詳細画面の表示
    cy.visit(`/tenants/${this.tenantId}/terminals/${this.terminalId}`)
    cy.wait(['@getTerminal', '@getTerminalOperation', '@getBreakOutList'])

    // 端末操作系ボタンが非活性になること
    cy.get('[data-cy="terminals-id-index-route-switch-button"]')
      .should('be.disabled')
      .should('have.text', t('terminals.operations.switchback'))
    cy.get('[data-cy="terminals-id-index-reboot-button"]').should('be.disabled')
    cy.get('[data-cy="terminals-id-index-firmware-update-button"]').should('be.disabled')
    cy.get('[data-cy="terminals-id-index-break-out-list-update-button"]').should('be.disabled')
    cy.get('[data-cy="terminals-id-index-delete-button"]').should('be.disabled')
    cy.get('[data-cy="terminals-id-index-edit-button"]').should('be.disabled')
  })

  context('POST terminals/*/operation のテスト', function () {
    beforeEach(function () {
      cy.intercept('GET', `**/ztgict/v1/terminals/${this.terminalId}`, {
        fixture: 'terminals/detail-guarantee-using-post-operation',
      }).as('getTerminal')
      cy.intercept('GET', `**/ztgict/v1/terminals/${this.terminalId}/operation`, { body: { operations: [] } }).as(
        'getTerminalOperation',
      )
      cy.intercept('POST', `**/ztgict/v1/terminals/${this.terminalId}/operation`, {}).as('postTerminalOperation')
    })

    it('ルーターの再起動、ファームウェアの更新、ブレイクアウト設定の適用、迂回設定の削除', function () {
      // 詳細画面の表示
      cy.visit(`/tenants/${this.tenantId}/terminals/${this.terminalId}`)
      cy.wait(['@getTerminal', '@getTerminalOperation', '@getBreakOutList'])

      // ルーター再起動(reboot)
      cy.get('[data-cy="terminals-id-index-reboot-button"]').click()
      cy.get('.dialog-card-content').should('contain.text', t('terminals.confirm.operations.reboot'))
      cy.get('.dialog-card-content').should('not.contain.text', t('terminals.note.firmwareUpdate'))
      cy.get('.dialog-card-content').should('not.contain.text', t('terminals.note.switchover'))
      cy.get('.dialog-card-content').should('not.contain.text', t('terminals.note.switchback'))
      cy.get('.dialog-base-submit-button').should('have.text', t('terminals.restart')).click()
      cy.wait('@postTerminalOperation').then(req => {
        expect(req.request.body).to.deep.eq({ operation: 'reboot' })
      })
      cy.wait(['@getTerminal', '@getTerminalOperation'])
      cy.get('[data-cy="notification-dialog-text"]').should('not.exist')

      // ファームウェア更新(firmwareUpdate)
      cy.get('[data-cy="terminals-id-index-firmware-update-button"]').click()
      cy.get('.dialog-card-content').should('contain.text', t('terminals.confirm.operations.firmwareUpdate'))
      cy.get('.dialog-card-content').should('contain.text', t('terminals.note.firmwareUpdate'))
      cy.get('.dialog-card-content').should('not.contain.text', t('terminals.note.switchover'))
      cy.get('.dialog-card-content').should('not.contain.text', t('terminals.note.switchback'))
      cy.get('.dialog-base-submit-button').should('have.text', t('common.update')).click()
      cy.wait('@postTerminalOperation').then(req => {
        expect(req.request.body).to.deep.eq({ operation: 'firmwareUpdate' })
      })
      cy.wait(['@getTerminal', '@getTerminalOperation'])
      cy.get('[data-cy="notification-dialog-text"]').should('not.exist')

      // ブレイクアウト設定の適用(breakOutListUpdate)
      cy.get('[data-cy="terminals-id-index-break-out-list-update-button"]').click()
      cy.get('.dialog-card-content').should('contain.text', t('terminals.confirm.operations.breakOutListUpdate'))
      cy.get('.dialog-card-content').should('not.contain.text', t('terminals.note.firmwareUpdate'))
      cy.get('.dialog-card-content').should('not.contain.text', t('terminals.note.switchover'))
      cy.get('.dialog-card-content').should('not.contain.text', t('terminals.note.switchback'))
      cy.get('.dialog-base-submit-button').should('have.text', t('common.apply')).click()
      cy.wait('@postTerminalOperation').then(req => {
        expect(req.request.body).to.deep.eq({ operation: 'breakOutListUpdate' })
      })
      cy.wait(['@getTerminal', '@getTerminalOperation'])
      cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('terminals.message.breakOutListUpdate'))
      cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
      cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.close')).click()

      // 迂回設定削除(switchback)
      cy.get('[data-cy="terminals-id-index-route-switch-button"]')
        .should('have.text', t('terminals.operations.switchback'))
        .click()
      cy.get('.dialog-card-content').should('contain.text', t('terminals.confirm.operations.switchback'))
      cy.get('.dialog-card-content').should('not.contain.text', t('terminals.note.firmwareUpdate'))
      cy.get('.dialog-card-content').should('not.contain.text', t('terminals.note.switchover'))
      cy.get('.dialog-card-content').should('contain.text', t('terminals.note.switchback'))
      cy.get('.dialog-base-submit-button').should('have.text', t('terminals.switchbackButton')).click()
      cy.wait('@postTerminalOperation').then(req => {
        expect(req.request.body).to.deep.eq({ operation: 'switchback' })
      })
      cy.wait(['@getTerminal', '@getTerminalOperation'])
      cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('terminals.message.switchback'))
      cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
      cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.close')).click()
    })

    it('迂回設定（operation: "switchover"）の実行', function () {
      // GET terminals のモック
      cy.intercept('GET', `**/ztgict/v1/terminals/${this.terminalId}`, {
        fixture: 'terminals/detail-guarantee',
      }).as('getTerminal')

      // 詳細画面の表示
      cy.visit(`/tenants/${this.tenantId}/terminals/${this.terminalId}`)
      cy.wait(['@getTerminal', '@getTerminalOperation', '@getBreakOutList'])

      // 迂回設定(switchover)
      cy.get('[data-cy="terminals-id-index-route-switch-button"]')
        .should('have.text', t('terminals.operations.switchover'))
        .click()
      cy.get('.dialog-card-content').should('contain.text', t('terminals.confirm.operations.switchover'))
      cy.get('.dialog-card-content').should('not.contain.text', t('terminals.note.firmwareUpdate'))
      cy.get('.dialog-card-content').should('contain.text', t('terminals.note.switchover'))
      cy.get('.dialog-card-content').should('not.contain.text', t('terminals.note.switchback'))
      cy.get('.dialog-base-submit-button').should('have.text', t('terminals.switchoverButton')).click()
      cy.wait('@postTerminalOperation').then(req => {
        expect(req.request.body).to.deep.eq({ operation: 'switchover' })
      })
      cy.wait(['@getTerminal', '@getTerminalOperation'])
      cy.get('[data-cy="notification-dialog-text"]').should('have.text', t('terminals.message.switchover'))
      cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
      cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.close')).click()
    })
  })
})
