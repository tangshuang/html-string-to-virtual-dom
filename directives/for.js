import cloneVNode from '../utils/cloneVNode'
import foreach from '../utils/foreach'
import recursive from '../utils/recursive'
import interpose from '../utils/interpose'
import merge from '../utils/merge'

export default function(vnode) {
  let { attrs } = vnode
  let { start, end, current } = attrs
  let vtree = []
  let from = parseInt(start)
  let to = parseInt(end)
  for (let i = from; from <= end ? i <= end : i >= end; (from <= end && i ++) || i --) {
    let clonedVnode = cloneVNode(vnode)
    recursive(clonedVnode, 'children', (child, parent) => {
      let { attrs, text, name } = child
      let keys = [current]
      let values = [i]
      let scope = {
        [current]: i,
      }

      if (parent._scope) {
        scope = merge({}, parent._scope)
        scope[current] = i
        keys = Object.keys(scope)
        values = keys.map(k => scope[k])
      }
  
      // interpose text
      if (text) {
        child.text = interpose(text, keys, values)
      }
      // interpose attrs
      else {
        foreach(attrs, (k, v) => {
          attrs[k] = interpose(v, keys, values)
        })
  
        // generator id and class props, we can not generator them before value has been generatored
        child.id = attrs.id || ''
        child.class = attrs.class ? attrs.class.split(' ') : []
      }

      child._scope = scope
    })

    let { children } = clonedVnode
    vtree = vtree.concat(children)
  }
  return vtree
}