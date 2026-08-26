import { useI18n } from 'vue-i18n'
import { DocumentTypes, DocumentExtensions, DocumentFileTypes } from '@/api/constants'
import type { UploadDocumentRequest, UploadDocumentResponse, DocumentServiceType, DocumentType } from '@/api/types'

export const useUploadDocument = (showSnackBar = true) => {
  const { API } = useAPI()
  const { t } = useI18n()
  const { setNotificationMessageState } = useNotificationDialog()
  const { setSuccessSnackBarState } = useSnackBar()

  const uploadDocument = async (request: UploadDocumentRequest) => {
    const response = await API.POST<UploadDocumentResponse, UploadDocumentRequest>('upload-document', {
      body: request,
    })
    setSuccessSnackBarState(showSnackBar)
    return response
  }

  // 共通のファイル形式判定とアップロード処理
  const handleUploadDocument = (
    file: File,
    service: DocumentServiceType,
    documentType: DocumentType,
    setDocumentId: (id: string) => void,
  ) => {
    const supportedFormats =
      documentType === DocumentTypes.FieldSurveyLessFile
        ? [DocumentExtensions.Pdf, DocumentExtensions.Xls, DocumentExtensions.Xlsx, DocumentExtensions.Zip]
        : [DocumentExtensions.Jpg, DocumentExtensions.Png, DocumentExtensions.Pdf]
    const format = supportedFormats.find(formatValue => DocumentFileTypes[formatValue]?.includes(file.type))

    if (!format) {
      return
    }

    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = async event => {
      const base64Text = (event.currentTarget as FileReader)?.result

      if (typeof base64Text === 'string') {
        const fileTypes = DocumentFileTypes[format]
        // Data URL プレフィックス (data:image/xxx;base64, data:application/XXX;base64 など) を削除して純粋な base64 文字列のみを送信
        const content = base64Text.replace(new RegExp(`^data:(${fileTypes.join('|')});base64,`), '')
        const response = await uploadDocument({
          encoding: 'base64',
          content,
          format,
          documentType,
          service,
        } as UploadDocumentRequest)
        setDocumentId(response.documentId)
      } else {
        setNotificationMessageState({ message: t('message.encodeError') })
      }
    }
  }

  const handleUploadIdentificationDocument = (
    file: File,
    service: DocumentServiceType,
    setDocumentId: (id: string) => void,
  ) => {
    handleUploadDocument(file, service, DocumentTypes.IdentificationDocument, setDocumentId)
  }

  const handleUploadFieldSurveyLessFileDocument = (
    file: File,
    service: DocumentServiceType,
    setDocumentId: (id: string) => void,
  ) => {
    handleUploadDocument(file, service, DocumentTypes.FieldSurveyLessFile, setDocumentId)
  }

  const handleUploadMapDocument = (file: File, service: DocumentServiceType, setDocumentId: (id: string) => void) => {
    handleUploadDocument(file, service, DocumentTypes.MapDocument, setDocumentId)
  }

  return { handleUploadIdentificationDocument, handleUploadFieldSurveyLessFileDocument, handleUploadMapDocument }
}
