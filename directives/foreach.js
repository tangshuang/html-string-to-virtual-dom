import cloneDeep from 'lodash/cloneDeep'
import foreach from '../utils/foreach'
import recursive from '../utils/recursive'
import interpose from '../utils/interpose'

export default function({ attrs, children }, vnode) {
  let { data, key, value } = attrs
  let vtree = []
  foreach(data, (dataKey, dataValue) => {
    let childNodes = cloneDeep(children)
    recursive({ children: childNodes, _scope: vnode._scope }, 'children', (child, parent) => {
      let { attrs, text } = child
      let keys = [key, value]
      let values = [dataKey, dataValue]
      let scope = {
        [key]: dataKey,
        [value]: dataValue,
      }

      if (parent._scope) {
        scope = cloneDeep(parent._scope)
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

      child._scope = scope
    })
    vtree = vtree.concat(childNodes)
  })
  return vtree
}