export default function createElement(node) {
  let name = node.name
  let el = document.createElement(name)
  let attrs = node.attrs
  // let props = node.props = node.props || {}
  let events = node.events

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

  if (node.text) {
    el.innerText = node.text
    node.$element = el
    el.$vnode = node
    return el
  }

  if (node.children && node.children.length) {
    node.children.forEach(child => {
      let childEl = createElement(child)
      el.appendChild(childEl)
      child.$element = childEl
      childEl.$vnode = child
    })
  }

  node.$element = el
  el.$vnode = node

  return el
}
