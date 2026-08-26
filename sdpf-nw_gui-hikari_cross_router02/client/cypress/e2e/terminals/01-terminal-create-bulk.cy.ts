import { generateRandomHex, t } from '@cypress/support/utils'

describe('サービスルーター一括新規作成', () => {
  const serviceClosedDaysError = {
    statusCode: 500,
    body: { errorCode: 500, errorMessage: '500 Internal Server Error!' },
  }

  const uploadCsv = () => {
    cy.get('[data-cy="terminal-create-bulk-application-information"]').find('[data-cy="file-upload-button"]').click()
    cy.get('.file-upload-dnd-area').selectFile('cypress/fixtures/terminals/create-bulk.csv', { action: 'drag-drop' })
    cy.get('.dialog-base-submit-button').click()
  }

  beforeEach(function () {
    this.tenantId = generateRandomHex(32)

    cy.fixture('upload-document.json').then(data => {
      this.uploadDocumentId = data.documentId
    })

    cy.intercept('GET', '**/ztgict/v1/resource-summary/vpns', { fixture: 'vpns/list' }).as('getVpnList')
    cy.intercept('GET', '**/ztgict/v1/resource-summary/ipoe?*', { fixture: 'ipoes/list' }).as('getIpoeList')
    cy.intercept('GET', '**/ztgict/v1/guarantees*', { fixture: 'guarantees/circuits/list' }).as('getGuaranteeList')
    cy.intercept('GET', '**/ztgict/v1/break-out-lists?resourceStatus=active&resourceStatus=inactive', {
      fixture: 'break-out-lists/list',
    }).as('getBreakOutList')
    cy.intercept('GET', '**/ztgict/v1/settings/traffic-report-flow-analyzer', {
      body: { termsOfServiceAccepted: true },
    }).as('getTrafficReportFlowAnalyzerTermsOfService')
    cy.intercept('GET', '**/ztgict/v1/settings/security', {
      body: { termsOfServiceAccepted: true },
    }).as('getSecurityTermsOfService')
    cy.intercept('GET', '**/ztgict/v1/settings/security-help-desk', {
      fixture: 'security-contracts/security-help-desk/deleted',
    }).as('getSecurityHelpDesk')
    cy.intercept('GET', '**/ztgict/v1/settings/behavior-detection', {
      fixture: 'behavior-detection/settings',
    }).as('getBehaviorDetection')
    cy.intercept('POST', '**/ztgict/v1/upload-document', { fixture: 'upload-document' }).as('postUploadDocument')
  })

  it('getServiceClosedDays が 500 エラーの場合、エラーダイアログが表示され、次へボタンが押せない', function () {
    cy.intercept('GET', '**/ztgict/v1/service-closed-days/terminal', serviceClosedDaysError).as(
      'getServiceClosedDaysError',
    )

    cy.visit(`/tenants/${this.tenantId}/terminals/create-bulk`)
    cy.wait(['@getSession', '@getVpnList', '@getIpoeList', '@getGuaranteeList', '@getBreakOutList'])
    cy.wait('@getServiceClosedDaysError')

    // エラーダイアログの表示
    cy.get('[data-cy="notification-dialog-text"]').should(
      'have.text',
      `${t('message.failed')}\n500\n500 Internal Server Error!`,
    )
    cy.get('[data-cy="notification-dialog-submit-button"]').click()

    uploadCsv()
    cy.pngFileUpload({
      className: '[data-cy="terminal-create-bulk-contract-identification-document-id"]',
      aliasName: '@postUploadDocument',
      documentId: this.uploadDocumentId,
    })
    cy.pngFileUpload({
      className: '[data-cy="terminal-create-bulk-pic-employment-document-id"]',
      aliasName: '@postUploadDocument',
      documentId: this.uploadDocumentId,
    })

    // 次へボタンが disabled になっている
    cy.get('[data-cy="terminal-create-bulk-submit-button"]').should('have.text', t('common.next')).should('be.disabled')
  })
})
