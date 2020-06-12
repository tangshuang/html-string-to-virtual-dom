import interpose from './interpose'
import foreach from './foreach'

export default function interposeVNode(vnode, keys, values) {
  let { text, attrs } = vnode
  // interpose text
  if (text !== undefined) {
    text = interpose(text, keys, values) // interpose width state
    vnode.text = text
  }
  // interpose attrs
  else {
    foreach(attrs, (k, v) => {
      v = interpose(v, keys, values)
      attrs[k] = v

      // bind events
      if (k.indexOf('on') === 0 && typeof v === 'function') {
        let event = k.substring(2).toLowerCase()
        vnode.events[event] =  v
        // this attribute will be deleted from original attributes
        delete attrs[k]
      }
    })

    // generator id and class props, we can not generator them before value has been generatored
    vnode.id = attrs.id || ''
    vnode.class = attrs.class ? attrs.class.split(' ') : []
    vnode.key = attrs.key || ''
  }
  return vnode
}