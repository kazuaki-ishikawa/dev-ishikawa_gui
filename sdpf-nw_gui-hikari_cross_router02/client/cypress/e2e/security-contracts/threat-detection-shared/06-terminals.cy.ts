import { SecurityOptionTypes } from '@app/api/constants'
import {
  ThreatDetectionSharedBillingMethodTypes,
  ThreatDetectionSharedRequestTypes,
  ThreatDetectionSharedTerminalDirectionTypes,
} from '@app/api/threatDetectionShared/constants'
import type { ThreatDetectionSharedTenantListResponse } from '@app/api/threatDetectionShared/types'
import { generateRandomHex, t } from '@cypress/support/utils'

const testData = [
  { terminalDirection: ThreatDetectionSharedTerminalDirectionTypes.Received, terminalDirectionText: '受領中' },
  { terminalDirection: ThreatDetectionSharedTerminalDirectionTypes.Provided, terminalDirectionText: '提供中' },
]

describe('脅威情報共有 受領中・提供中ルーター一覧／共有停止', () => {
  beforeEach(function () {
    this.tenantId = generateRandomHex(32)

    // リクエスト一覧画面のAPIモック
    cy.intercept('GET', '**/ztgict/v1/threat-detection-shared/requests?*', {
      fixture: 'security-contracts/threat-detection-shared/requests',
    }).as('getThreatDetectionSharedRequests')
    cy.intercept('GET', '**/ztgict/v1/resource-summary/terminals*', { fixture: 'terminals/list' }).as('getTerminalList')
  })

  testData.forEach(({ terminalDirection, terminalDirectionText }) => {
    const buttonLabel = `${terminalDirectionText}ルーター一覧／共有停止`
    const isProvided = terminalDirection === ThreatDetectionSharedTerminalDirectionTypes.Provided

    context(buttonLabel, function () {
      it(`セキュリティ規約同意前（${terminalDirectionText}）`, function () {
        cy.intercept('GET', '**/ztgict/v1/settings/security', {
          body: { termsOfServiceAccepted: false },
        }).as('getSecurityTermsOfService')

        cy.visit(
          `/tenants/${this.tenantId}/security-contracts/threat-detection-shared/terminals?terminalDirection=${terminalDirection}`,
        )
        cy.wait([
          '@getSession',
          '@getMobile',
          '@getTrafficReportFlowAnalyzerTermsOfService',
          '@getSecurityTermsOfService',
          '@getSettingsBehaviorDetection',
          '@getSecurityTermsOfService',
        ])

        // セキュリティ同意画面へ遷移ボタンが表示される
        cy.get('[data-cy="security-contracts-threat-detection-shared-terminals-terms-of-service-button"]').should(
          'exist',
        )
        cy.get('[data-cy="security-contracts-threat-detection-shared-terminals-terms-of-service-message"]').should(
          'exist',
        )

        // ボタンの状態確認
        cy.get('[data-cy="security-contracts-threat-detection-shared-terminals-start-sharing-button"]').should(
          'be.disabled',
        )
        cy.get('[data-cy="search-filter-search-button"]').should('be.disabled')
        cy.get('[data-cy="search-filter-clear-button"]').should('be.disabled')

        // タイトル確認
        cy.get('[data-cy="security-contracts-threat-detection-shared-terminals-title"]').should(
          'have.text',
          `${terminalDirectionText}ルーター一覧`,
        )
      })

      it('ルーターが100件以上あった場合の挙動', function () {
        const sharedTenantId1 = generateRandomHex(32)
        const sharedTenantId2 = generateRandomHex(32)
        const terminals = Array.from({ length: 101 }, (_, i) => {
          const padNumber = (i + 1).toString().padStart(3, '0')
          const [sharedTenantId, contractorName] =
            i < 50 ? [sharedTenantId1, '共有先テナントの契約者名１'] : [sharedTenantId2, '共有先テナントの契約者名２']
          return {
            sharedTenantId,
            contractorName,
            terminalDirection,
            billingMethod: ThreatDetectionSharedBillingMethodTypes.Split,
            requestId: padNumber,
            ref: `/v1/threat-detection-shared/requests/${padNumber}`,
            approvalTime: '2026-03-23T12:05:48+09:00',
            terminalId: `terminal-${padNumber}`,
            customerNote: `terminal-${padNumber}`,
            installationAddress: `住所${padNumber}`,
            threatDetectionPlan: SecurityOptionTypes.Plan12Months,
          }
        })
        cy.intercept(
          {
            method: 'GET',
            pathname: '**/ztgict/v1/threat-detection-shared/tenants',
            query: { terminalDirection },
          },
          { body: { limit: 10, offset: 0, total: 101, terminals } },
        ).as('getThreatDetectionSharedTenantsWithQuery')

        cy.visit(`/tenants/${this.tenantId}/security-contracts/threat-detection-shared`)
        cy.wait([
          '@getSession',
          '@getMobile',
          '@getTrafficReportFlowAnalyzerTermsOfService',
          '@getSecurityTermsOfService',
          '@getSettingsBehaviorDetection',
          '@getSecurityTermsOfService',
          '@getThreatDetectionSharedRequests',
          '@getThreatDetectionSharedRequests',
        ])

        // ボタンクリックして画面遷移
        cy.get(`[data-cy="security-contracts-threat-detection-shared-${terminalDirection}-list-button"]`)
          .should('have.text', buttonLabel)
          .click()

        cy.wait([
          '@getSecurityTermsOfService',
          ...(isProvided ? ['@getTerminalList'] : []),
          '@getThreatDetectionSharedTenantsWithQuery',
          '@getThreatDetectionSharedTenantsWithQuery',
          '@getThreatDetectionSharedTenantsWithQuery',
        ])

        // URL のチェック
        cy.url().should(
          'eq',
          `${Cypress.config().baseUrl}/tenants/${this.tenantId}/security-contracts/threat-detection-shared/terminals?terminalDirection=${terminalDirection}`,
        )

        // 全件選択
        cy.get('[data-cy="tenant-terminal-table-selector-all-checkbox"]').click()
        cy.get('[data-cy="tenant-terminal-table-selector-all-checkbox"]')
          .should('have.class', 'disabled')
          .and('not.have.class', 'checked')
          .and('have.class', 'indeterminate')
        terminals.forEach(({ terminalId }: { terminalId: string }, index) => {
          const disabled = index === terminals.length - 1 // 101件目の端末のみ選択不可
          const sharedTenantId = index < 50 ? sharedTenantId1 : sharedTenantId2
          cy.get(`[data-cy="tenant-terminal-table-selector-${sharedTenantId}-${terminalId}"]`)
            .should(disabled ? 'have.class' : 'not.have.class', 'disabled')
            .and(disabled ? 'not.have.class' : 'have.class', 'checked')
        })
      })

      it('共有停止（成功）', function () {
        cy.fixture('security-contracts/threat-detection-shared/tenants').then(body => {
          cy.intercept(
            {
              method: 'GET',
              pathname: '**/ztgict/v1/threat-detection-shared/tenants',
              query: { terminalDirection },
            },
            { body },
          ).as('getThreatDetectionSharedTenantsWithQuery')

          // POST する対象は最初の sharedTenantId だけにする
          const terminals = (body as ThreatDetectionSharedTenantListResponse).terminals

          // terminalId リンクの表示確認用 APIモック
          cy.intercept('GET', '**/ztgict/v1/resource-summary/terminals*', {
            body: {
              total: terminals.length,
              offset: 0,
              terminals: terminals.map(({ terminalId }) => ({
                terminalId,
                tenantId: this.tenantId,
                terminalType: 'rentalTerminal',
              })),
            },
          }).as('getTerminalList')

          const postTenants = terminals.filter(t => t.sharedTenantId === terminals[0].sharedTenantId)
          cy.intercept('POST', '**/ztgict/v1/threat-detection-shared/requests', {
            body: {
              sharedTenantId: terminals[0].sharedTenantId,
              requestId: generateRandomHex(32),
              terminals: postTenants.map(t => ({ terminalId: t.terminalId })),
            },
            delay: 1000, // loading 状態の再現のため、APIのレスポンスに遅延を加える
          }).as('postRequest')

          cy.visit(`/tenants/${this.tenantId}/security-contracts/threat-detection-shared`)
          cy.wait([
            '@getSession',
            '@getMobile',
            '@getTrafficReportFlowAnalyzerTermsOfService',
            '@getSecurityTermsOfService',
            '@getSettingsBehaviorDetection',
            '@getSecurityTermsOfService',
            '@getThreatDetectionSharedRequests',
            '@getThreatDetectionSharedRequests',
          ])

          // ボタンクリックして画面遷移
          cy.get(`[data-cy="security-contracts-threat-detection-shared-${terminalDirection}-list-button"]`).click()
          cy.wait([
            '@getSecurityTermsOfService',
            ...(isProvided ? ['@getTerminalList'] : []),
            '@getThreatDetectionSharedTenantsWithQuery',
            '@getThreatDetectionSharedTenantsWithQuery',
          ])

          // ボタンの初期状態
          cy.get('[data-cy="security-contracts-threat-detection-shared-terminals-cancel-button"]')
            .as('cancelButton')
            .should('have.text', t('common.return'))
          cy.get('[data-cy="security-contracts-threat-detection-shared-terminals-submit-button"]')
            .as('submitButton')
            .should('have.text', t('threatDetectionSharedStop.stopSharing'))
            .and('be.disabled')

          // チェックボックスの数（全件選択＋レスポンスのterminalsの件数）
          cy.get('[data-cy^="tenant-terminal-table-selector-"]').should('have.length', terminals.length + 1)

          // terminalId の表示の確認
          terminals.forEach(t => {
            cy.get(`[data-cy="tenant-terminal-table-terminal-id-link-${t.sharedTenantId}-${t.terminalId}"]`).should(
              isProvided ? 'exist' : 'not.exist',
            )
            cy.get(`[data-cy="tenant-terminal-table-terminal-id-${t.sharedTenantId}-${t.terminalId}"]`).should(
              isProvided ? 'not.exist' : 'exist',
            )
          })

          // 全件選択して次の画面へ
          cy.get('[data-cy="tenant-terminal-table-selector-all-checkbox"]').click()
          cy.get('@submitButton').click()

          // タイトル確認
          cy.get('[data-cy="security-contracts-threat-detection-shared-terminals-title"]').should(
            'have.text',
            t('threatDetectionSharedStop.stopSharingTitle'),
          )
          // 非表示確認
          cy.get('[data-cy="security-contracts-threat-detection-shared-terminals-start-sharing-button"]').should(
            'not.exist',
          )
          cy.get('[data-cy="security-contracts-threat-detection-shared-terminals-terminal-table"]').should('not.exist')

          // ボタンの状態確認
          cy.get('@cancelButton').should('have.text', t('common.cancel')).and('not.be.disabled')
          cy.get('@submitButton').should('have.text', t('threatDetectionSharedStop.stopSharing')).and('not.be.disabled')

          // terminalId の表示の確認
          terminals.forEach(t => {
            cy.get(
              `[data-cy="security-contracts-threat-detection-shared-terminals-${t.sharedTenantId}-${t.terminalId}"]`,
            ).within(() => {
              cy.get(`[data-cy="terminal-id-link-${t.sharedTenantId}-${t.terminalId}"]`).should(
                isProvided ? 'exist' : 'not.exist',
              )
              cy.get(`[data-cy="terminal-id-${t.sharedTenantId}-${t.terminalId}"]`).should(
                isProvided ? 'not.exist' : 'exist',
              )
            })
          })
          // チェックを全部外すと共有停止ボタンが非活性になる
          terminals.forEach(terminal => {
            cy.get(
              `[data-cy="security-contracts-threat-detection-shared-terminals-${terminal.sharedTenantId}-${terminal.terminalId}"]`,
            )
              .find('.v-switch')
              .find('input[type="checkbox"]')
              .should('not.be.disabled')
              .and('be.checked')
              .click()
          })
          cy.get('@submitButton').should('be.disabled')

          // 対象テナントのチェックをつけて共有停止
          postTenants.forEach(({ sharedTenantId, terminalId }) => {
            cy.get(`[data-cy="security-contracts-threat-detection-shared-terminals-${sharedTenantId}-${terminalId}"]`)
              .find('.v-switch')
              .click()
          })
          cy.get('@submitButton').click()

          // POST実行中はボタンとswitchが非活性になる
          cy.get('@submitButton').should('be.disabled')
          terminals.forEach(t => {
            cy.get(
              `[data-cy="security-contracts-threat-detection-shared-terminals-${t.sharedTenantId}-${t.terminalId}"]`,
            )
              .find('.v-switch')
              .find('input[type="checkbox"]')
              .should('be.disabled')
          })
          cy.wait('@postRequest').then(req => {
            expect(req.request.body).to.deep.eq({
              sharedTenantId: postTenants[0].sharedTenantId,
              terminalIds: postTenants.map(t => t.terminalId),
              requestType: ThreatDetectionSharedRequestTypes.Stop,
            })
          })

          // 共有停止完了のモーダル確認
          cy.get('[data-cy="notification-dialog-text"]').should(
            'have.text',
            t('threatDetectionSharedStop.message.success'),
          )
          cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.close')).click()
          cy.get('[data-cy="notification-dialog-text"]').should('not.exist')

          // 画面遷移なし、選択してない要素だけ残っていることを確認する
          terminals.forEach(t => {
            if (postTenants[0].sharedTenantId === t.sharedTenantId) {
              cy.get(
                `[data-cy="security-contracts-threat-detection-shared-terminals-${t.sharedTenantId}-${t.terminalId}"]`,
              ).should('not.exist')
            } else {
              cy.get(
                `[data-cy="security-contracts-threat-detection-shared-terminals-${t.sharedTenantId}-${t.terminalId}"]`,
              )
                .find('.v-switch')
                .find('input[type="checkbox"]')
                .should('not.be.disabled')
                .and('not.be.checked') // POSTから除外した要素はチェックが外れている
            }
          })

          cy.get('@submitButton').should('be.disabled')
        })
      })

      it('共有停止（失敗）', function () {
        cy.fixture('security-contracts/threat-detection-shared/tenants').then(body => {
          cy.intercept(
            {
              method: 'GET',
              pathname: '**/ztgict/v1/threat-detection-shared/tenants',
              query: { terminalDirection },
            },
            { body },
          ).as('getThreatDetectionSharedTenantsWithQuery')

          const terminals = (body as ThreatDetectionSharedTenantListResponse).terminals
          const tenantMap = terminals.reduce((acc, terminal) => {
            const found = acc.get(terminal.sharedTenantId)
            if (found) {
              found.push(terminal.terminalId)
            } else {
              acc.set(terminal.sharedTenantId, [terminal.terminalId])
            }
            return acc
          }, new Map<string, string[]>())

          // 成功 する対象は最後の sharedTenantId だけにする
          const successSharedTenantId = terminals.slice(-1)[0].sharedTenantId
          tenantMap.forEach((terminalIds, sharedTenantId) => {
            cy.intercept('POST', '**/ztgict/v1/threat-detection-shared/requests', req => {
              if (req.body.sharedTenantId === sharedTenantId) {
                expect(req.body).deep.eq({
                  sharedTenantId,
                  terminalIds,
                  requestType: ThreatDetectionSharedRequestTypes.Stop,
                })
                req.alias = `postRequest${sharedTenantId}`
                req.reply({
                  statusCode: successSharedTenantId !== sharedTenantId ? 500 : 200, // successTenant 以外のテナントは失敗
                  body: {
                    sharedTenantId,
                    requestId: generateRandomHex(32),
                    terminals: terminalIds.map(terminalId => ({ terminalId })),
                  },
                })
              }
            }).as(`postRequest${sharedTenantId}`)
          })

          // 画面遷移
          cy.visit(`/tenants/${this.tenantId}/security-contracts/threat-detection-shared`)
          cy.wait([
            '@getSession',
            '@getMobile',
            '@getTrafficReportFlowAnalyzerTermsOfService',
            '@getSecurityTermsOfService',
            '@getSettingsBehaviorDetection',
            '@getSecurityTermsOfService',
            '@getThreatDetectionSharedRequests',
            '@getThreatDetectionSharedRequests',
          ])

          // ボタンクリックして画面遷移
          cy.get(`[data-cy="security-contracts-threat-detection-shared-${terminalDirection}-list-button"]`).click()
          cy.wait([
            '@getSecurityTermsOfService',
            ...(isProvided ? ['@getTerminalList'] : []),
            '@getThreatDetectionSharedTenantsWithQuery',
            '@getThreatDetectionSharedTenantsWithQuery',
          ])
          // 全件選択して次の画面へ
          cy.get('[data-cy="tenant-terminal-table-selector-all-checkbox"]').click()
          cy.get('[data-cy="security-contracts-threat-detection-shared-terminals-submit-button"]')
            .as('submitButton')
            .click()

          // 共有停止実行
          cy.get('@submitButton').click()
          cy.wait([...tenantMap.keys()].map(sharedTenantId => `@postRequest${sharedTenantId}`))

          // 共有停止失敗モーダルの確認
          cy.get('[data-cy="notification-dialog-text"]').should(
            'have.text',
            t('threatDetectionSharedStop.message.failed', {
              terminal: Array.from(tenantMap)
                .reduce((acc, [sharedTenantId, terminalIds]) => {
                  if (sharedTenantId === successSharedTenantId) {
                    return acc
                  }
                  return acc.concat(terminalIds.map(terminalId => `${sharedTenantId} / ${terminalId}`))
                }, [] as string[])
                .join('\n'),
            }),
          )
          cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.close')).click()
          cy.get('[data-cy="notification-dialog-text"]').should('not.exist')

          // 画面遷移なし、失敗した要素だけ残っていることを確認する
          terminals.forEach(t => {
            if (successSharedTenantId === t.sharedTenantId) {
              cy.get(
                `[data-cy="security-contracts-threat-detection-shared-terminals-${t.sharedTenantId}-${t.terminalId}"]`,
              ).should('not.exist')
            } else {
              cy.get(
                `[data-cy="security-contracts-threat-detection-shared-terminals-${t.sharedTenantId}-${t.terminalId}"]`,
              )
                .find('.v-switch')
                .find('input[type="checkbox"]')
                .should('not.be.disabled')
                .and('be.checked') // 失敗した要素はチェックがついたままになっている
            }
          })

          cy.get('@submitButton').should('not.be.disabled')
        })
      })
    })
  })
})
