import cloneDeep from 'lodash/cloneDeep'
import foreach from '../utils/foreach'
import recursive from '../utils/recursive'
import interpose from '../utils/interpose'

export default function({ attrs, children }, vnode) {
  let { start, end, current } = attrs
  let vtree = []
  for (let i = parseInt(start); i <= parseInt(end); i ++) {
    let childNodes = cloneDeep(children)
    recursive({ children: childNodes, _scope: vnode._scope }, 'children', (child, parent) => {
      let { attrs, text, name } = child
      let keys = [current]
      let values = [i]
      let scope = {
        [current]: i,
      }

      if (parent._scope) {
        scope = cloneDeep(parent._scope)
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
    vtree = vtree.concat(childNodes)
  }
  return vtree
}