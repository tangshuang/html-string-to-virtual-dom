import cloneVNode from '../utils/cloneVNode'
import foreach from '../utils/foreach'
import recursive from '../utils/recursive'
import interposeVNode from '../utils/interposeVNode'
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
  
      interposeVNode(child, keys, values)
      child._scope = scope
    })

    let { children } = clonedVnode
    vtree = vtree.concat(children)
  }
  return vtree
}