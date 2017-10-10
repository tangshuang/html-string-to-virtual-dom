import foreach from './utils/foreach'
import interpose from './utils/interpose'

export default {
  foreach(attrs, events, children) {
    let items = data[attrs.target]
    let keyName = attrs.key
    let valueName = attrs.value
    let childNodes = []

    foreach(items, (key, value) => {
      children.forEach((child, i) => {
        if (typeof child === 'string') {
          let textNode = interpose(child, keyName, key)
          childNodes.push(textNode)
          return
        }

        let node = {}
        foreach(child, (k, v) => {
          node[k] = v
        })

        if (node.attrs) {
          foreach(node.attrs, (k, v) => {
            node.attrs[k] = interpose(v, key, i)
            node.attrs[k] = interpose(v, value, item)
          })
          node.id = node.attrs.id
          node.class = node.attrs.class ? node.attrs.class.split(' ') : []
        }
        childNodes.push(node)
      })
    })

    return childNodes
  },
  if(attrs, events, children) {
    let condition = attrs.condition
    if (eval(condition)) {
      return children
    }
  },
}