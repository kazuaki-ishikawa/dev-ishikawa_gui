import { useI18n } from 'vue-i18n'
import { toCanvas } from 'html-to-image'
import jsPDF from 'jspdf'
import type {
  DownloadDocumentResponse,
  DownloadGuaranteeDocumentQuery,
  DownloadGuaranteeDocumentResponse,
  ErrorResponse,
} from '@/api/types'

const getType = (extension?: string) => {
  switch (extension) {
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    case 'xls':
      return 'application/vnd.ms-excel'
    case 'pdf':
      return 'application/pdf'
    case 'zip':
      return 'application/zip'
    default:
      return 'application/octet-stream'
  }
}

const createBlob = ({ content, extension }: { content?: string; extension?: string }) => {
  // blob の type
  const type = getType(extension)

  // Base64 文字列をデコードしてバイナリー文字列に変換
  const bin = atob(content ?? '')
  // 8 ビットの符号なし整数値の配列を生成
  const buffer = new Uint8Array(bin.length)
  // UTF-16 文字コードを取得
  for (let i = 0; i < bin.length; i++) {
    buffer[i] = bin.charCodeAt(i)
  }
  // Blobに変換
  return new Blob([buffer.buffer], { type })
}

const downloadBlob = ({ blob, filename }: { blob: Blob; filename: string }) => {
  const link = document.createElement('a')
  link.href = window.URL.createObjectURL(blob)
  link.download = filename
  link.click()
}

export const useDownloadCsv = () => {
  const downloadCsv = (csv: string, fileName: string) => {
    try {
      const bom = new Uint8Array([0xef, 0xbb, 0xbf])
      const blob = new Blob([bom, csv], { type: 'text/csv' })
      downloadBlob({
        blob,
        filename: `${fileName}.csv`,
      })
      return Promise.resolve()
    } catch (error) {
      return Promise.reject(error)
    }
  }

  return { downloadCsv }
}

export const useDownloadDocument = () => {
  const { API } = useAPI()
  const { t } = useI18n()
  const { setNotificationMessageState } = useNotificationDialog()

  const downloadDocument = async ({ documentId, fileName }: { documentId: string; fileName: string }) => {
    try {
      const response = await API.GET<DownloadDocumentResponse, { documentId: string }>('download-document', {
        query: { documentId },
        suppressErrorDialog: true,
      })
      const blob = createBlob({
        content: response.content,
        extension: response.format,
      })
      downloadBlob({
        blob,
        filename: `${fileName}.${response.format}`,
      })
      return response
    } catch (error) {
      const message = errorFormat(error as ErrorResponse)
      setNotificationMessageState({
        message: message ? `${t('message.failed')}\n${message}` : t('message.decodeError'),
      })
      throw error
    }
  }

  return { downloadDocument }
}

export const useDownloadGuaranteeDocument = () => {
  const { API } = useAPI()
  const { t } = useI18n()
  const { setNotificationMessageState } = useNotificationDialog()

  const downloadGuaranteeDocument = async ({
    guaranteeId,
    query,
  }: {
    guaranteeId: string
    query: DownloadGuaranteeDocumentQuery
  }) => {
    try {
      const response = await API.GET<DownloadGuaranteeDocumentResponse, DownloadGuaranteeDocumentQuery>(
        `iwan-util/download-document/${guaranteeId}`,
        { query, suppressErrorDialog: true },
      )
      const blob = createBlob({
        content: response.content,
        extension: response.fileName?.split('.').pop(),
      })
      downloadBlob({
        blob,
        filename: response.fileName ?? 'document',
      })
      return response
    } catch (e) {
      const error = e as ErrorResponse
      const errorCode = error.statusCode
      if (errorCode === 404) {
        setNotificationMessageState({ message: t('message.fileNotFound') })
      } else if (errorCode === 500) {
        setNotificationMessageState({ message: t('message.downloadFailed') })
      } else {
        setNotificationMessageState({ message: `${t('message.failed')}\n${errorFormat(error)}` })
      }
      throw error
    }
  }

  return { downloadGuaranteeDocument }
}
export const useDownloadHtmlToPdf = () => {
  const targetRef = ref<HTMLDivElement>()

  // PDF生成
  const downloadPdf = async (filename: string) => {
    if (!targetRef.value) {
      return Promise.resolve()
    }
    try {
      // PDF生成
      const canvas = await toCanvas(targetRef.value, {
        skipFonts: true,
        style: { margin: '0' },
        width: targetRef.value.scrollWidth,
        canvasWidth: targetRef.value.scrollWidth,
        height: targetRef.value.scrollHeight,
        canvasHeight: targetRef.value.scrollHeight,
      })
      const pdf = new jsPDF('p', 'pt', [canvas.width, canvas.height])
      // PDFの高さと横幅を取得
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.8), 'JPEG', 0, 0, canvas.width, canvas.height)
      pdf.save(filename)
      return Promise.resolve()
    } catch (error) {
      return Promise.reject(error)
    }
  }

  return { targetRef, downloadPdf }
}

export const useDownloadLocalPdfOrExcel = () => {
  const { t } = useI18n()
  const { setNotificationMessageState } = useNotificationDialog()

  const downloadLocalPdfOrExcel = async (params: { path: string; extension: 'xlsx' | 'pdf'; fileName: string }) => {
    try {
      const response = await $fetch<File>(params.path)
      const reader = new FileReader()
      reader.readAsDataURL(response)
      reader.onload = event => {
        const base64Text = (event.currentTarget as FileReader)?.result
        if (typeof base64Text !== 'string') {
          return
        }
        const content = base64Text.replace(
          /^data:application\/(vnd.openxmlformats-officedocument.spreadsheetml.sheet|pdf);base64,/,
          '',
        )
        const blob = createBlob({ content, extension: params.extension })
        downloadBlob({ blob, filename: params.fileName })
      }
      return Promise.resolve()
    } catch (error) {
      setNotificationMessageState({ message: `${t('message.failed')}\n${errorFormat(error as ErrorResponse)}` })
      return Promise.reject(error)
    }
  }

  return { downloadLocalPdfOrExcel }
}
