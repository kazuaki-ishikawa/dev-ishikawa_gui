const IDENTIFICATION_URL = 'https://ztgict.sdpf.ntt.com/v1/jpki/identification'

const button = document.getElementById('auth-btn')
const errorDialog = document.getElementById('error-dialog')
const errorDialogMessage = document.getElementById('error-dialog-message')
const dialogCloseButton = document.getElementById('error-dialog-close')

const jpkiRequestId = new URLSearchParams(location.search).get('jpkiRequestId')

if (jpkiRequestId) {
  button.disabled = false
}

button.addEventListener('click', handleClick)

function postHiddenForm(action, fields) {
  const form = document.createElement('form')
  form.method = 'POST'
  form.action = action
  form.acceptCharset = 'utf-8'

  Object.entries(fields).forEach(([name, value]) => {
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = name
    input.value = String(value ?? '')
    form.appendChild(input)
  })

  document.body.appendChild(form)
  form.submit()
}

async function handleClick() {
  button.disabled = true

  if (!jpkiRequestId) {
    return
  }

  try {
    const jpkiResponse = await fetchWithTimeout(IDENTIFICATION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ jpkiRequestId }),
    })

    if (jpkiResponse.status === 409) {
      const errorMessage =
        'QRコードの読み取り・利用は1回のみ有効です。PCブラウザで「QRコード再発行」ボタンを押下の上QRコードの再発行をお願いいたします。'
      showErrorDialog(errorMessage)
      return
    }

    if (!jpkiResponse.ok) {
      throw httpError(jpkiResponse.status, '認証開始に失敗しました。')
    }

    const { url, sfn, ric, ked, epr, itv, hav } = await jpkiResponse.json().catch(() => {
      throw new Error('レスポンスが不正です。')
    })
    if (!url || !sfn || !ric || !ked || !epr || !itv || !hav) {
      throw new Error('不正なリクエストです。')
    }

    postHiddenForm(url, { sfn, ric, ked, epr, itv, hav, spm: jpkiRequestId })
  } catch (error) {
    console.error(error)
    alert(messageFromError(error))
  } finally {
    if (button) {
      button.disabled = false
    }
  }
}

function httpError(status, prefix) {
  const error = new Error(`${prefix} (HTTP ${status})`)
  error.name = 'HttpError'
  error.status = status
  return error
}

function messageFromError(error) {
  return error?.message || '不明なエラーが発生しました。'
}

async function fetchWithTimeout(resource, options = {}) {
  const { timeout = 30000, ...rest } = options
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)

  try {
    return await fetch(resource, { signal: controller.signal, ...rest })
  } finally {
    clearTimeout(id)
  }
}

dialogCloseButton.addEventListener('click', closeErrorDialog)

let lastFocusedElement = null
function showErrorDialog(message) {
  if (errorDialogMessage) {
    errorDialogMessage.textContent = message
  }
  if (errorDialog) {
    lastFocusedElement = document.activeElement

    errorDialog.hidden = false
    errorDialog.classList.add('is-open')

    const firstCloseBtn = errorDialog.querySelector('[data-dialog-close]')
    if (firstCloseBtn instanceof HTMLElement) {
      firstCloseBtn.focus()
    }
  }
}

function closeErrorDialog() {
  if (errorDialog) {
    errorDialog.classList.remove('is-open')
    errorDialog.hidden = true
  }

  if (lastFocusedElement && lastFocusedElement instanceof HTMLElement) {
    lastFocusedElement.focus()
  } else if (button) {
    button.focus()
  }
}
