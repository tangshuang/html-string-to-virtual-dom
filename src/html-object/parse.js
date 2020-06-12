import { Parser as _Parser } from 'htmlparser2'
import Node from './node.class.js'

class Parser extends _Parser {
  onselfclosingtag() {
    if (this._cbs.onselfclosingtag) {
      const name = this._tagname;
      this._cbs.onselfclosingtag(name);
    }
    super.onselfclosingtag();
  }
}

/**
 * parse html string to virtual dom
 * @param {*} html
 */
export function parse(html) {
  const nodes = []
  const depth = []

  let isSelfClosingTag = false

  const parser = new Parser(
    {
      onselfclosingtag() {
        isSelfClosingTag = true
      },
      onopentag(type, attrs) {
        const parent = depth.length ? depth[depth.length - 1] : null
        const node = new Node({
          type,
          attrs,
          children: [],
          parent
        })

        if (isSelfClosingTag) {
          node.selfclosing = true;
        }

        if (parent) {
          parent.appendChild(node)
        }

        depth.push(node)
        nodes.push(node)
      },
      onclosetag() {
        depth.pop()
        isSelfClosingTag = false
      },
      ontext(text) {
        if (!text.trim()) {
          return
        }

        const parent = depth.length ? depth[depth.length - 1] : null
        const node = new Node({
          text: text.replace(/\s+/g, ' '),
          parent
        })

        if (parent) {
          parent.appendChild(node)
        }

        nodes.push(node)
      }
    },
    {
      recognizeSelfClosing: true,
      lowerCaseTags: false,
      lowerCaseAttributeNames: false
    }
  )

  parser.parseChunk(html)
  parser.done()

  const list = nodes.filter(item => !item.parent)
  return list
}
export default parse