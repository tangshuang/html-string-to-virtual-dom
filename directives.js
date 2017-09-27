import foreach from './utils/foreach'
import interpose from './utils/interpose'

export default {
  'foreach': (attrs, events, children, data) => {
    let items = data[attrs.target]
    let key = attrs.key
    let value = attrs.value
    let childNodes = []

    if (items) {
      foreach(items, (i, item) => {
        children.forEach(child => {
          let node = {}
          foreach(child, (prop, value) => {
            node[prop] = value
          })
          node.text = interpose(node.text, key, i)
          node.text = interpose(node.text, value, item)
          foreach(node.attrs, (k, v) => {
            node.attrs[k] = interpose(v, key, i)
            node.attrs[k] = interpose(v, value, item)
          })
          node.id = node.attrs.id
          node.class = node.attrs.class ? node.attrs.class.split(' ') : []
          childNodes.push(node)
        })
      })
    }

    return childNodes
  },
  'if': (attrs, events, children) => {
    let condition = attrs.condition
    if (eval(condition)) {
      return children
    }
  },
}