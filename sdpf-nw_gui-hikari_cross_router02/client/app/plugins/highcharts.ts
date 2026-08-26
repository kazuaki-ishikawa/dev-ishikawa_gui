import * as Highcharts from 'highcharts'
import HighchartsVue from 'highcharts-vue'
import 'highcharts/modules/exporting'
import 'highcharts/modules/offline-exporting'
import jsPDF from 'jspdf'
import { svg2pdf } from 'svg2pdf.js'

// highcharts でのGETリクエスト防止
// https://www.highcharts.com/forum/viewtopic.php?t=52335
declare global {
  interface Window {
    jspdf: { jsPDF: typeof jsPDF }
    svg2pdf: typeof svg2pdf
  }
}

export default defineNuxtPlugin(({ vueApp }) => {
  window.jspdf = { jsPDF }
  window.svg2pdf = svg2pdf
  Highcharts.setOptions({
    time: { timezone: 'Asia/Tokyo' },
    exporting: {
      sourceWidth: 1000,
      sourceHeight: 500,
      // chart.style.fontFamily を設定しておくと、ローカルエクスポート時の
      // inlineFonts()（ページ上の全スタイルシートを走査し fetch する処理）がスキップされる。
      // これにより SPA 外スタイルシートの GET 失敗でエクスポートが止まるのを防ぐ。
      // https://github.com/highcharts/highcharts/blob/master/ts/Extensions/Exporting/Exporting.ts
      chartOptions: {
        chart: {
          style: {
            fontFamily: '"Noto Sans JP", sans-serif',
          },
        },
      },
      pdfFont: {
        normal: '/fonts/NotoSansJP-Regular.ttf',
        bold: '/fonts/NotoSansJP-Regular.ttf',
        bolditalic: '/fonts/NotoSansJP-Regular.ttf',
        italic: '/fonts/NotoSansJP-Regular.ttf',
      },
      fallbackToExportServer: false,
    },
  })
  vueApp.use(HighchartsVue, {
    highcharts: Highcharts,
  })
})
