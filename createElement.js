export default function createElement(vnode) {
  let name = vnode.name
  let el = document.createElement(name)
  let attrs = vnode.attrs
  // let props = vnode.props = vnode.props || {}
  let events = vnode.events

  let attrKeys = Object.keys(attrs)
  if (attrKeys && attrKeys.length) {
    attrKeys.forEach(key => {
      let value = attrs[key]
      el.setAttribute(key, value)
    })
  }

  // let propKeys = Object.keys(props)
  // if (propKeys && propKeys.length) {
  //   propKeys.forEach(prop => {
  //     let value = props[prop]
  //     el[prop] = value
  //   })
  // }

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

  let eventKeys = events ? Object.keys(events) : []
  if (eventKeys && eventKeys.length) {
    eventKeys.forEach(key => {
      let callback = events[key]
      el.addEventListener(key, callback, false)
    })
  }

  if (vnode.text) {
    el.innerText = vnode.text
    vnode.$element = el
    el.$vnode = vnode
    return el
  }

  if (vnode.children && vnode.children.length) {
    vnode.children.forEach(child => {
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
