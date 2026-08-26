import MarkdownIt from 'markdown-it'

import mila from 'markdown-it-link-attributes'

const mdit: MarkdownIt = new MarkdownIt({
  html: false,
  breaks: true,
  linkify: true,
  typographer: false,
}).use(mila, {
  matcher(href: string) {
    return href.match(/^https?:\/\//)
  },
  attrs: {
    target: '_blank',
    rel: 'noopener noreferrer',
  },
})

export default defineNuxtPlugin(() => ({
  provide: { md: mdit },
}))
