export default function createElement(node) {
  let name = node.name
  let el = document.createElement(name)
  let attrs = node.attrs
  let events = node.events

  let attrKeys = attrs ? Object.keys(attrs) : []
  if (attrKeys && attrKeys.length) {
    attrKeys.forEach(key => {
      let value = attrs[key]
      el.setAttribute(key, value)
    })
  }

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
