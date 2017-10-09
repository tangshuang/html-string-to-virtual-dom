import foreach from './utils/foreach'

export default function createElement(vnode) {
  let name = vnode.name
  let el = document.createElement(name)
  let attrs = vnode.attrs
  // let props = vnode.props = vnode.props || {}
  let events = vnode.events

  foreach(attrs, (key, value) => el.setAttribute(key, value))

  // foreach(props, (key, value) => el[key] = value)
  // if (name === 'input') {
  //   if (attrs.type === 'checkbox' || attrs.type === 'radio') {
  //     el.addEventListener('change', e => props.checked = e.target.checked, false)
  //   }
  //   else {
  //     el.addEventListener('change', e => props.value = e.target.value, false)
  //   }
  // }
  // else if (name === 'select' || name === 'textarea') {
  //   el.addEventListener('change', e => props.value = e.target.value, false)
  // }

  foreach(events, (event, callback) => {
    el.addEventListener(event, callback, false)
  })

  if (vnode.children && vnode.children.length) {
    vnode.children.forEach(child => {
      if (typeof child === 'string') {
        let textNode = document.createTextNode(child)
        el.appendChild(textNode)
        return
      }

      let childEl = createElement(child)
      el.appendChild(childEl)
      child.$element = childEl
      childEl.$vnode = child
    })
  }

  vnode.$element = el
  el.$vnode = vnode

  return el
}
