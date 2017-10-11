import cloneDeep from 'lodash/cloneDeep'
import foreach from '../utils/foreach'
import recursive from '../utils/recursive'
import interpose from '../utils/interpose'

export default function({ attrs, children }) {
  let { start, end, current } = attrs
  let vtree = []
  for (let i = parseInt(start); i <= parseInt(end); i ++) {
    let childNodes = cloneDeep(children)
    recursive({ children: childNodes }, 'children', child => {
      let { attrs, text, name } = child
  
      // interpose text
      if (text) {
        child.text = interpose(text, [current], [i])
      }
      // interpose attrs
      else {
        foreach(attrs, (k, v) => {
          attrs[k] = interpose(v, [current], [i])
        })
  
        // generator id and class props, we can not generator them before value has been generatored
        child.id = attrs.id || ''
        child.class = attrs.class ? attrs.class.split(' ') : []
      }
    })
    vtree = vtree.concat(childNodes)
  }
  return vtree
}