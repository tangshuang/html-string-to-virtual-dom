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
    this.children.push(child)
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