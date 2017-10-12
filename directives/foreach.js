import { cloneDeep } from 'lodash'
import foreach from '../utils/foreach'
import recursive from '../utils/recursive'
import interpose from '../utils/interpose'

export default function({ attrs, children }) {
  let { data, key, value } = attrs
  let vtree = []
  foreach(data, (dataKey, dataValue) => {
    let childNodes = cloneDeep(children)
    recursive({ children: childNodes }, 'children', child => {
      let { attrs, text } = child
  
      // interpose text
      if (text) {
        child.text = interpose(text, [key, value], [dataKey, dataValue])
      }
      // interpose attrs
      else {
        foreach(attrs, (attrName, attrValue) => {
          attrs[attrName] = interpose(attrValue, [key, value], [dataKey, dataValue])
        })
  
        // generator id and class props, we can not generator them before value has been generatored
        child.id = attrs.id || ''
        child.class = attrs.class ? attrs.class.split(' ') : []
      }
    })
    vtree = vtree.concat(childNodes)
  })
  return vtree
}