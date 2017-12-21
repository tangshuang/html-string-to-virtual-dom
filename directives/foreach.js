import merge from '../utils/merge'
import foreach from '../utils/foreach'
import recursive from '../utils/recursive'
import interpose from '../utils/interpose'
import cloneVNode from '../utils/cloneVNode'

export default function(vnode) {
  let { attrs } = vnode
  let { data, key, value } = attrs
  let vtree = []
  foreach(data, (dataKey, dataValue) => {
    let clonedVnode = cloneVNode(vnode)
    recursive(clonedVnode, 'children', (child, parent) => {
      let { attrs, text } = child
      let keys = [key, value]
      let values = [dataKey, dataValue]
      let scope = {
        [key]: dataKey,
        [value]: dataValue,
      }

      // inherit from parent
      if (parent._scope) {
        scope = merge({}, parent._scope)
        scope[key] = dataKey
        scope[value] = dataValue
        keys = Object.keys(scope)
        values = keys.map(k => scope[k])
      }

      // interpose text
      if (text) {
        child.text = interpose(text, keys, values)
      }
      // interpose attrs
      else {
        foreach(attrs, (attrName, attrValue) => {
          attrs[attrName] = interpose(attrValue, keys, values)
        })
  
        // generator id and class props, we can not generator them before value has been generatored
        child.id = attrs.id || ''
        child.class = attrs.class ? attrs.class.split(' ') : []
      }

      // set scope for children inheriting
      child._scope = scope
    })
    let { children } = clonedVnode
    vtree = vtree.concat(children)
  })
  return vtree
}