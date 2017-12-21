import merge from '../utils/merge'
import foreach from '../utils/foreach'
import recursive from '../utils/recursive'
import interposeVNode from '../utils/interposeVNode'
import cloneVNode from '../utils/cloneVNode'

export default function(vnode) {
  let { attrs } = vnode
  let { data, key, value } = attrs
  let vtree = []
  foreach(data, (dataKey, dataValue) => {
    let clonedVnode = cloneVNode(vnode)
    recursive(clonedVnode, 'children', (child, parent) => {
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

      interposeVNode(child, keys, values)
      // set scope for children inheriting
      child._scope = scope
    })
    let { children } = clonedVnode
    vtree = vtree.concat(children)
  })
  return vtree
}