import { each, inArray } from 'ts-fns'

const selfClosingTags = [
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]

export function rebuild(nodes) {
  const buildAttrs = (attrs) => {
    let text = ''
    each(attrs, (value, key) => {
      text += ` ${key}="${value}"`
    })
    return text
  }
  const create = (node) => {
    const { type, attrs, children, text, selfclosing } = node

    if (type) {
      let text = `<${type}${buildAttrs(attrs)}`

      if (selfclosing) {
        text += ' />'
        return text
      }
      else if (inArray(type, selfClosingTags)) {
        text += '>'
        return text
      }

      text += '>'

      if (children.length) {
        text += rebuild(children)
      }

      text += `</${type}>`

      return text
    }
    else {
      return text
    }
  }

  const items = nodes.map(create)
  const html = items.join('')
  return html
}
export default rebuild
