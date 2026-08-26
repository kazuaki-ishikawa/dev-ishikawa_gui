import { DocumentServiceTypes, DocumentTypes } from '@app/api/constants'
import {
  FieldSurveyLessResultSurveyLessTypes,
  FieldSurveyLessResultDrawingResendRequestTypes,
} from '@app/api/guarantees/constants'
import { generateRandomHex, t, outsideApplicationRestrictionAt } from '@cypress/support/utils'

describe('ギャランティ回線詳細画面', function () {
  // @getGuarantee のレスポンスに tenantId がある場合に @getTerminalList を追加する
  const detailWaitList = ['@getGuarantee', '@getCampaignList']
  const editWaitList = ['@getGuarantee', '@getCampaignList']

  beforeEach(function () {
    this.tenantId = generateRandomHex(32)
    this.guaranteeId = generateRandomHex(32)

    cy.intercept('GET', '**/ztgict/v1/resource-summary/guarantees?limit=1000*', {
      fixture: 'guarantees/circuits/list',
    }).as('getResourceSummaryGuaranteeList')
    cy.intercept('GET', '**/ztgict/v1/campaigns*', { fixture: 'campaigns/list' }).as('getCampaignList')
    cy.intercept('GET', '**/ztgict/v1/resource-summary/terminals*', { fixture: 'terminals/list-some-items' }).as(
      'getTerminalList',
    )
  })

  context('現調レス判定結果', function () {
    it('現調レス:false の場合、現調レス判定結果が表示されないこと', function () {
      // 確認ボタンが押せるように時間固定
      cy.clock(outsideApplicationRestrictionAt(9, 0, 0, 0), ['Date'])

      // テストデータ
      cy.fixture('guarantees/circuits/detail-reserve-date-approved.json').then(guarantee => {
        cy.intercept('GET', `**/ztgict/v1/guarantees/${this.guaranteeId}`, {
          body: guarantee,
        }).as('getGuarantee')
      })

      // 詳細画面に遷移
      cy.visit(`tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}`)
      cy.wait(detailWaitList)

      cy.get('[data-cy="guarantees-circuits-id-index-update-field-survey-less-info-button"]').should('not.exist')
      cy.get('[data-cy="guarantee-detail-field-survey-less-info-download-button"]').should('not.exist')
      cy.get('[data-cy="guarantee-detail-field-survey-less-info-survey-less-result"]').should('not.exist')
      cy.get('[data-cy="guarantee-detail-field-survey-less-info-drawing-resend-request"]').should('not.exist')
      cy.get('[data-cy="guarantee-detail-field-survey-less-info-drawing-deficiency-reason"]').should('not.exist')
    })

    it('現調レス:true, 現調レス結果:true, 図面再送依頼:true の場合、編集可', function () {
      // 確認ボタンが押せるように時間固定
      cy.clock(outsideApplicationRestrictionAt(9, 0, 0, 0), ['Date'])
      // テストデータ
      cy.intercept('PUT', '**/ztgict/v1/orders/*', {}).as('putOrder')
      cy.fixture('upload-document.json').then(body => {
        this.uploadDocumentId = body.documentId
        cy.intercept('POST', '**/ztgict/v1/upload-document', { body }).as('postUploadDocument')
      })
      cy.fixture('guarantees/circuits/detail-reserve-date-approved.json').then(guarantee => {
        cy.intercept('GET', `**/ztgict/v1/guarantees/${this.guaranteeId}`, {
          body: {
            ...guarantee,
            fieldSurvey: undefined,
            fieldSurveyLess: true,
            fieldSurveyReportUpdateTime: '2025-01-02T10:05:48+09:00',
            fieldSurveyLessInfo: {
              fieldSurveyLessFileId: 'test-file-id',
              fieldSurveyLessResult: FieldSurveyLessResultSurveyLessTypes.OK,
              drawingResendRequest: FieldSurveyLessResultDrawingResendRequestTypes.Required,
              drawingDeficiencyReason: '図面に不備があります。',
            },
          },
        }).as('getGuarantee')
      })
      // 詳細画面に遷移
      cy.visit(`tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}`)
      cy.wait(detailWaitList)

      // 初期表示の確認
      cy.get('[data-cy="guarantees-circuits-id-index-update-field-survey-less-info-button"]').click()
      cy.get('.dialog-base-submit-button').should('be.disabled').should('have.text', t('common.confirm'))
      cy.get('.dialog-base-cancel-button').should('have.text', t('common.cancel'))

      // 入力
      // ファイルアップロード
      const fileXls = {
        contents: Cypress.Buffer.from('file contents'),
        fileName: 'file.zip',
        mimeType: 'application/zip',
        lastModified: Date.now(),
      }
      cy.get('.file-upload-dnd-area').selectFile(fileXls, { action: 'drag-drop' })

      // 確認ボタン押下
      cy.get('.dialog-base-submit-button').click()
      cy.get('[data-cy="file-upload-selected-file-text"]').should('have.text', 'file.zip')
      cy.get('.dialog-base-submit-button').should('have.text', t('common.save'))
      cy.get('.dialog-base-cancel-button').should('have.text', t('common.return'))
      // 保存ボタン押下
      cy.get('.dialog-base-submit-button').click()

      // ファイルアップロードAPIのリクエスト確認
      cy.wait('@postUploadDocument').then(req => {
        expect(req.request.url).to.include('ztgict/v1/upload-document')
        expect(req.request.body.encoding).to.eq('base64')
        expect(req.request.body.service).to.eq(DocumentServiceTypes.Guarantee)
        expect(req.request.body.documentType).to.eq(DocumentTypes.FieldSurveyLessFile)
        expect(req.request.body.format).to.eq('zip')
      })
      // オーダー更新APIのリクエスト確認
      cy.wait('@putOrder').then(req => {
        expect(req.request.body).to.deep.eq({
          request: {
            fieldSurveyLessInfo: {
              fieldSurveyLessFileId: this.uploadDocumentId,
            },
          },
        })
      })

      // 完了ダイアログの表示確認
      cy.get('[data-cy="notification-dialog-text"]').should(
        'have.text',
        t('guarantees.updateFieldSurveyLessInfoOrderMessage'),
      )
      cy.get('[data-cy="notification-dialog-cancel-button"]').should('not.exist')
      cy.get('[data-cy="notification-dialog-submit-button"]').should('have.text', t('common.close')).click()

      // 変更画面の確認
      cy.get('[data-cy="guarantees-circuits-id-index-edit-button"]').click()
      cy.wait(editWaitList)
      // #16258 現調レスファイルダウンロードボタンの非表示対応
      // cy.get('[data-cy="guarantee-detail-field-survey-less-info-download-button"]').should('be.disabled')
      cy.get('[data-cy="guarantee-detail-field-survey-less-info-survey-less-result"]').should('have.text', 'OK')
      cy.get('[data-cy="guarantee-detail-field-survey-less-info-drawing-resend-request"]').should(
        'have.text',
        t('common.exist'),
      )
      cy.get('[data-cy="guarantee-detail-field-survey-less-info-drawing-deficiency-reason"]').should(
        'have.text',
        '図面に不備があります。',
      )
    })

    it('現調レス:true, 現調レス結果:false, 図面再送依頼:undefined の場合、編集不可', function () {
      // 確認ボタンが押せるように時間固定
      cy.clock(outsideApplicationRestrictionAt(9, 0, 0, 0), ['Date'])
      // テストデータ
      cy.fixture('guarantees/circuits/detail-reserve-date-approved.json').then(guarantee => {
        cy.intercept('GET', `**/ztgict/v1/guarantees/${this.guaranteeId}`, {
          body: {
            ...guarantee,
            fieldSurvey: undefined,
            fieldSurveyLess: true,
            fieldSurveyReportUpdateTime: '2025-01-02T10:05:48+09:00',
            fieldSurveyLessInfo: {
              fieldSurveyLessResult: FieldSurveyLessResultSurveyLessTypes.NG,
              drawingResendRequest: FieldSurveyLessResultDrawingResendRequestTypes.NotRequired,
            },
          },
        }).as('getGuarantee')
      })

      // 詳細画面に遷移
      cy.visit(`tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}`)
      cy.wait(detailWaitList)

      cy.get('[data-cy="guarantees-circuits-id-index-update-field-survey-less-info-button"]').should('be.disabled')
      // #16258 現調レスファイルダウンロードボタンの非表示対応
      // cy.get('[data-cy="guarantee-detail-field-survey-less-info-download-button"]').should('be.disabled')
      cy.get('[data-cy="guarantee-detail-field-survey-less-info-survey-less-result"]').should('have.text', 'NG')
      cy.get('[data-cy="guarantee-detail-field-survey-less-info-drawing-resend-request"]').should(
        'have.text',
        t('common.nonExist'),
      )
      cy.get('[data-cy="guarantee-detail-field-survey-less-info-drawing-deficiency-reason"]').should('have.text', '')
    })

    it('現調レス:true, 現調レス結果:undefined, 図面再送依頼:undefined の場合、編集不可', function () {
      // 確認ボタンが押せるように時間固定
      cy.clock(outsideApplicationRestrictionAt(9, 0, 0, 0), ['Date'])
      // テストデータ
      cy.fixture('guarantees/circuits/detail-reserve-date-approved.json').then(guarantee => {
        cy.intercept('GET', `**/ztgict/v1/guarantees/${this.guaranteeId}`, {
          body: {
            ...guarantee,
            fieldSurvey: undefined,
            fieldSurveyLess: true,
            fieldSurveyReportUpdateTime: '2025-01-02T10:05:48+09:00',
            fieldSurveyLessInfo: {
              fieldSurveyLessResult: FieldSurveyLessResultSurveyLessTypes.NG,
            },
          },
        }).as('getGuarantee')
      })

      // 詳細画面に遷移
      cy.visit(`tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}`)
      cy.wait(detailWaitList)

      cy.get('[data-cy="guarantees-circuits-id-index-update-field-survey-less-info-button"]').should('be.disabled')
      // #16258 現調レスファイルダウンロードボタンの非表示対応
      // cy.get('[data-cy="guarantee-detail-field-survey-less-info-download-button"]').should('be.disabled')
      cy.get('[data-cy="guarantee-detail-field-survey-less-info-survey-less-result"]').should('have.text', 'NG')
      cy.get('[data-cy="guarantee-detail-field-survey-less-info-drawing-resend-request"]').should('have.text', '')
      cy.get('[data-cy="guarantee-detail-field-survey-less-info-drawing-deficiency-reason"]').should('have.text', '')
    })

    it('現調レス:true, 現調レス結果:true, 図面再送依頼:true で時間外の場合、編集不可', function () {
      // 受付時間外に設定
      cy.clock(outsideApplicationRestrictionAt(6, 0, 0, 0), ['Date'])
      // テストデータ
      cy.fixture('guarantees/circuits/detail-reserve-date-approved.json').then(guarantee => {
        cy.intercept('GET', `**/ztgict/v1/guarantees/${this.guaranteeId}`, {
          body: {
            ...guarantee,
            fieldSurvey: undefined,
            fieldSurveyLess: true,
            fieldSurveyResult: 'ok',
            fieldSurveyReportUpdateTime: '2025-01-02T10:05:48+09:00',
            fieldSurveyLessInfo: {
              fieldSurveyLessFileId: 'test-file-id',
              fieldSurveyLessResult: FieldSurveyLessResultSurveyLessTypes.OK,
              drawingResendRequest: FieldSurveyLessResultDrawingResendRequestTypes.Required,
              drawingDeficiencyReason: '図面に不備があります。',
            },
          },
        }).as('getGuarantee')
      })

      // 詳細画面に遷移
      cy.visit(`tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}`)
      cy.wait(detailWaitList)

      cy.get('[data-cy="guarantees-circuits-id-index-update-field-survey-less-info-button"]').should('be.disabled')
      // #16258 現調レスファイルダウンロードボタンの非表示対応
      // cy.get('[data-cy="guarantee-detail-field-survey-less-info-download-button"]').should('not.be.disabled')
      cy.get('[data-cy="guarantee-detail-field-survey-less-info-survey-less-result"]').should('have.text', 'OK')
      cy.get('[data-cy="guarantee-detail-field-survey-less-info-drawing-resend-request"]').should(
        'have.text',
        t('common.exist'),
      )
      cy.get('[data-cy="guarantee-detail-field-survey-less-info-drawing-deficiency-reason"]').should(
        'have.text',
        '図面に不備があります。',
      )
    })
  })

  context('現地調査・工事日予約の受付時間外メッセージの表示を確認', function () {
    beforeEach(function () {
      cy.intercept('GET', `**/ztgict/v1/guarantees/${this.guaranteeId}`, {
        fixture: 'guarantees/circuits/detail-reserve-date-field-survey-rejected',
      }).as('getGuarantee')
    })

    it('第３月曜日以外 - 受付時間外 - 日本時間(8:59)', function () {
      cy.clock(new Date('2024-04-21T23:59:59Z'), ['Date'])

      // 詳細画面に遷移
      cy.visit(`tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}`)
      cy.wait(detailWaitList)

      // 現地調査・工事日予約予約ボタンが非活性になってメッセージが表示されることを確認
      cy.get('[data-cy="guarantees-circuits-id-index-reserve-field-survey-construction-date-button"]').should(
        'be.disabled',
      )
      cy.get(
        '[data-cy="guarantees-circuits-id-index-reserve-field-survey-construction-date-outside-reception-hour"]',
      ).should('exist')
      // 廃止情報は非表示
      cy.get('[data-cy="guarantee-detail-removal-section"]').should('not.exist')
    })
    it('第３月曜日以外 - 受付時間内 - 日本時間(9:00)', function () {
      cy.clock(new Date('2024-04-22T00:00:00Z'), ['Date'])

      // 詳細画面に遷移
      cy.visit(`tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}`)
      cy.wait(detailWaitList)

      // 現地調査・工事日予約予約ボタンが活性になってメッセージが表示されないことを確認
      cy.get('[data-cy="guarantees-circuits-id-index-reserve-field-survey-construction-date-button"]').should(
        'not.be.disabled',
      )
      cy.get(
        '[data-cy="guarantees-circuits-id-index-reserve-field-survey-construction-date-outside-reception-hour"]',
      ).should('not.exist')

      // 廃止情報は非表示
      cy.get('[data-cy="guarantee-detail-removal-section"]').should('not.exist')
    })
    it('第３月曜日以外 - 受付時間内 - 日本時間(19:59)', function () {
      cy.clock(new Date('2024-04-22T10:59:59Z'), ['Date'])

      // 詳細画面に遷移
      cy.visit(`tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}`)
      cy.wait(detailWaitList)

      // 現地調査・工事日予約予約ボタンが活性になってメッセージが表示されないことを確認
      cy.get('[data-cy="guarantees-circuits-id-index-reserve-field-survey-construction-date-button"]').should(
        'not.be.disabled',
      )
      cy.get(
        '[data-cy="guarantees-circuits-id-index-reserve-field-survey-construction-date-outside-reception-hour"]',
      ).should('not.exist')
    })
    it('第３月曜日以外 - 受付時間外 - 日本時間(20:00)', function () {
      cy.clock(new Date('2024-04-22T11:00:00Z'), ['Date'])

      // 詳細画面に遷移
      cy.visit(`tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}`)
      cy.wait(detailWaitList)

      // 現地調査・工事日予約予約ボタンが非活性になってメッセージが表示されることを確認
      cy.get('[data-cy="guarantees-circuits-id-index-reserve-field-survey-construction-date-button"]').should(
        'be.disabled',
      )
      cy.get(
        '[data-cy="guarantees-circuits-id-index-reserve-field-survey-construction-date-outside-reception-hour"]',
      ).should('exist')
    })
    it('第３月曜日 - 受付時間外 - 日本時間(8:59)', function () {
      cy.clock(new Date('2024-10-20T23:59:59Z'), ['Date'])

      // 詳細画面に遷移
      cy.visit(`tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}`)
      cy.wait(detailWaitList)

      // 現地調査・工事日予約予約ボタンが非活性になってメッセージが表示されることを確認
      cy.get('[data-cy="guarantees-circuits-id-index-reserve-field-survey-construction-date-button"]').should(
        'be.disabled',
      )
      cy.get(
        '[data-cy="guarantees-circuits-id-index-reserve-field-survey-construction-date-outside-reception-hour"]',
      ).should('exist')
    })
    it('第３月曜日 - 受付時間内 - 日本時間(9:00)', function () {
      cy.clock(new Date('2024-10-21T00:00:00Z'), ['Date'])

      // 詳細画面に遷移
      cy.visit(`tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}`)
      cy.wait(detailWaitList)

      // 現地調査・工事日予約予約ボタンが活性になってメッセージが表示されないことを確認
      cy.get('[data-cy="guarantees-circuits-id-index-reserve-field-survey-construction-date-button"]').should(
        'not.be.disabled',
      )
      cy.get(
        '[data-cy="guarantees-circuits-id-index-reserve-field-survey-construction-date-outside-reception-hour"]',
      ).should('not.exist')
    })
    it('第３月曜日 - 受付時間内 - 日本時間(16:59)', function () {
      cy.clock(new Date('2024-10-21T07:59:59Z'), ['Date'])

      // 詳細画面に遷移
      cy.visit(`tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}`)
      cy.wait(detailWaitList)

      // 現地調査・工事日予約予約ボタンが活性になってメッセージが表示されないことを確認
      cy.get('[data-cy="guarantees-circuits-id-index-reserve-field-survey-construction-date-button"]').should(
        'not.be.disabled',
      )
      cy.get(
        '[data-cy="guarantees-circuits-id-index-reserve-field-survey-construction-date-outside-reception-hour"]',
      ).should('not.exist')
    })
    it('第３月曜日 - 受付時間外 - 日本時間(17:00)', function () {
      cy.clock(new Date('2024-10-21T08:00:00Z'), ['Date'])

      // 詳細画面に遷移
      cy.visit(`tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}`)
      cy.wait(detailWaitList)

      // 現地調査・工事日予約予約ボタンが非活性になってメッセージが表示されることを確認
      cy.get('[data-cy="guarantees-circuits-id-index-reserve-field-survey-construction-date-button"]').should(
        'be.disabled',
      )
      cy.get(
        '[data-cy="guarantees-circuits-id-index-reserve-field-survey-construction-date-outside-reception-hour"]',
      ).should('exist')
    })
  })

  context('回収予約の受付時間外メッセージの表示を確認', function () {
    beforeEach(function () {
      cy.intercept('GET', `**/ztgict/v1/guarantees/${this.guaranteeId}`, {
        fixture: 'guarantees/circuits/detail-removal-date-rejected',
      }).as('getGuarantee')
    })

    it('第３月曜日以外 - 受付時間外 - 日本時間(8:59)', function () {
      cy.clock(new Date('2024-04-21T23:59:59Z'), ['Date'])

      // 詳細画面に遷移
      cy.visit(`tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}`)
      cy.wait(detailWaitList)

      // 回収予約ボタンが非活性になってメッセージが表示されることを確認
      cy.get('[data-cy="guarantees-circuits-id-index-reserve-removal-date-button"]').should('be.disabled')
      cy.get('[data-cy="guarantees-circuits-id-index-reserve-removal-date-outside-reception-hour"]').should('exist')
    })
    it('第３月曜日以外 - 受付時間内 - 日本時間(9:00)', function () {
      cy.clock(new Date('2024-04-22T00:00:00Z'), ['Date'])

      // 詳細画面に遷移
      cy.visit(`tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}`)
      cy.wait(detailWaitList)

      // 回収予約ボタンが活性になってメッセージが表示されないことを確認
      cy.get('[data-cy="guarantees-circuits-id-index-reserve-removal-date-button"]').should('not.be.disabled')
      cy.get('[data-cy="guarantees-circuits-id-index-reserve-removal-date-outside-reception-hour"]').should('not.exist')
    })
    it('第３月曜日以外 - 受付時間内 - 日本時間(19:59)', function () {
      cy.clock(new Date('2024-04-22T10:59:59Z'), ['Date'])

      // 詳細画面に遷移
      cy.visit(`tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}`)
      cy.wait(detailWaitList)

      // 回収予約ボタンが活性になってメッセージが表示されないことを確認
      cy.get('[data-cy="guarantees-circuits-id-index-reserve-removal-date-button"]').should('not.be.disabled')
      cy.get('[data-cy="guarantees-circuits-id-index-reserve-removal-date-outside-reception-hour"]').should('not.exist')
    })
    it('第３月曜日以外 - 受付時間外 - 日本時間(20:00)', function () {
      cy.clock(new Date('2024-04-22T11:00:00Z'), ['Date'])

      // 詳細画面に遷移
      cy.visit(`tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}`)
      cy.wait(detailWaitList)

      // 回収予約ボタンが非活性になってメッセージが表示されることを確認
      cy.get('[data-cy="guarantees-circuits-id-index-reserve-removal-date-button"]').should('be.disabled')
      cy.get('[data-cy="guarantees-circuits-id-index-reserve-removal-date-outside-reception-hour"]').should('exist')
    })
    it('第３月曜日 - 受付時間外 - 日本時間(8:59)', function () {
      cy.clock(new Date('2024-04-14T23:59:59Z'), ['Date'])

      // 詳細画面に遷移
      cy.visit(`tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}`)
      cy.wait(detailWaitList)

      // 回収予約ボタンが非活性になってメッセージが表示されることを確認
      cy.get('[data-cy="guarantees-circuits-id-index-reserve-removal-date-button"]').should('be.disabled')
      cy.get('[data-cy="guarantees-circuits-id-index-reserve-removal-date-outside-reception-hour"]').should('exist')
    })
    it('第３月曜日 - 受付時間内 - 日本時間(9:00)', function () {
      cy.clock(new Date('2024-04-15T00:00:00Z'), ['Date'])

      // 詳細画面に遷移
      cy.visit(`tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}`)
      cy.wait(detailWaitList)

      // 回収予約ボタンが活性になってメッセージが表示されないことを確認
      cy.get('[data-cy="guarantees-circuits-id-index-reserve-removal-date-button"]').should('not.be.disabled')
      cy.get('[data-cy="guarantees-circuits-id-index-reserve-removal-date-outside-reception-hour"]').should('not.exist')
    })
    it('第３月曜日 - 受付時間内 - 日本時間(16:59)', function () {
      cy.clock(new Date('2024-04-15T07:59:59Z'), ['Date'])

      // 詳細画面に遷移
      cy.visit(`tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}`)
      cy.wait(detailWaitList)

      // 回収予約ボタンが活性になってメッセージが表示されないことを確認
      cy.get('[data-cy="guarantees-circuits-id-index-reserve-removal-date-button"]').should('not.be.disabled')
      cy.get('[data-cy="guarantees-circuits-id-index-reserve-removal-date-outside-reception-hour"]').should('not.exist')
    })
    it('第３月曜日 - 受付時間外 - 日本時間(17:00)', function () {
      cy.clock(new Date('2024-04-15T08:00:00Z'), ['Date'])

      // 詳細画面に遷移
      cy.visit(`tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}`)
      cy.wait(detailWaitList)

      // 回収予約ボタンが非活性になってメッセージが表示されることを確認
      cy.get('[data-cy="guarantees-circuits-id-index-reserve-removal-date-button"]').should('be.disabled')
      cy.get('[data-cy="guarantees-circuits-id-index-reserve-removal-date-outside-reception-hour"]').should('exist')
    })
  })

  context('廃止・変更・キャンペーン終了ボタンの活性・非活性状態を確認', function () {
    beforeEach(function () {
      // 期間限定の申込規制の影響を受けないよう規制期間外の日時に固定する(規制終了後に削除する)
      cy.clock(outsideApplicationRestrictionAt(9, 0, 0, 0), ['Date'])
    })

    it('editable かつ迂回未実行の場合、すべてのボタンが活性であること', function () {
      cy.fixture('guarantees/circuits/detail-reserve-date-approved.json').then(guarantee => {
        cy.intercept('GET', `**/ztgict/v1/guarantees/${this.guaranteeId}`, {
          body: { ...guarantee, terminalId: 'Z123456789' },
        }).as('getGuarantee')
      })
      cy.intercept('GET', '**/ztgict/v1/terminals/Z123456789', {
        fixture: 'terminals/detail-guarantee-ipoe',
      }).as('getTerminal')

      cy.visit(`tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}`)
      cy.wait([...detailWaitList, '@getTerminalList', '@getTerminal'])

      cy.get('[data-cy="guarantees-circuits-id-index-delete-button"]').should('not.be.disabled')
      cy.get('[data-cy="guarantees-circuits-id-index-edit-button"]').should('not.be.disabled')
      cy.get('[data-cy="guarantees-circuits-id-quit-campaign-button"]').should('not.be.disabled')
    })

    it('editable かつ迂回実行中の場合、変更ボタンとキャンペーン終了ボタンは活性、廃止ボタンは非活性であること', function () {
      cy.fixture('guarantees/circuits/detail-reserve-date-approved.json').then(guarantee => {
        cy.intercept('GET', `**/ztgict/v1/guarantees/${this.guaranteeId}`, {
          body: { ...guarantee, terminalId: 'Z123456789' },
        }).as('getGuarantee')
      })
      cy.intercept('GET', '**/ztgict/v1/terminals/Z123456789', {
        fixture: 'terminals/detail-guarantee-using-post-operation',
      }).as('getTerminal')

      cy.visit(`tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}`)
      cy.wait([...detailWaitList, '@getTerminalList', '@getTerminal'])

      // 迂回実行中でも変更ボタンとキャンペーン終了ボタンは活性であること
      cy.get('[data-cy="guarantees-circuits-id-index-edit-button"]').should('not.be.disabled')
      cy.get('[data-cy="guarantees-circuits-id-quit-campaign-button"]').should('not.be.disabled')
      // 廃止ボタンは迂回実行中のため非活性であること
      cy.get('[data-cy="guarantees-circuits-id-index-delete-button"]').should('be.disabled')
    })

    it('editable でない場合、すべてのボタンが非活性であること', function () {
      cy.fixture('guarantees/circuits/detail-reserve-date-approved.json').then(guarantee => {
        cy.intercept('GET', `**/ztgict/v1/guarantees/${this.guaranteeId}`, {
          body: { ...guarantee, orderStatus: 'applied' },
        }).as('getGuarantee')
      })

      cy.visit(`tenants/${this.tenantId}/guarantees/circuits/${this.guaranteeId}`)
      cy.wait(detailWaitList)

      cy.get('[data-cy="guarantees-circuits-id-index-delete-button"]').should('be.disabled')
      cy.get('[data-cy="guarantees-circuits-id-index-edit-button"]').should('be.disabled')
      cy.get('[data-cy="guarantees-circuits-id-quit-campaign-button"]').should('be.disabled')
    })
  })
})
