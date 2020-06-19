export class Node {
  /**
   * create vnode
   * @param {object} options
   * @param {string} [options.type] html tag name
   * @param {object} [options.attrs]
   * @param {array} [options.children]
   * @param {Node|null} options.parent
   * @param {boolean} options.selfclosing whether the tag is a self closing tag
   * @param {string} [options.text]
   */
  constructor(options) {
    Object.assign(this, options)
  }
  setParent(parent) {
    this.parent = parent
  }
  appendChild(child) {
    if (!(child instanceof Node)) {
      child = new Node(child)
    }
    child.parent = this
    this.children.push(child)
  }
  setAttribute(key, value) {
    this.attrs = this.attrs || {}
    this.attrs[key] = value
  }
  removeAttribute(key) {
    this.attrs = this.attrs || {}
    delete this.attrs[key]
  }

  /**
   * 查询内部元素
   * @param {*} selector
   */
  query(selector) {
    if (!this.children) {
      return []
    }

    const nodes = []
    this.children.forEach((item) => {
      if (item.type === selector) {
        nodes.push(item)
      }
      // 如果子元素不是，那么要看子元素的子元素，一层一层找下去
      else if (item.children) {
        const subs = item.query(selector)
        nodes.push(...subs)
      }
    })

    return nodes
  }

  toJSON() {
    const json = {}
    const keys = Object.keys(this)

    keys.forEach(key => {
      if (key === 'parent') {
        return
      }

      if (!/[a-zA-B0-9]/.test((key + '').substr(0, 1))) {
        return
      }

      let value = this[key]
      if (key === 'children') {
        value = value.map(item => item instanceof Node ? item.toJSON() : item)
      }

      json[key] = value
    })

    return json
  }
}
export default Node