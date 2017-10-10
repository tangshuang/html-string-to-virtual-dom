import foreach from './utils/foreach'

export default function createElement(vnode) {
  if (vnode.text) {
    let dom = document.createTextNode(vnode.text)
    vnode.$dom = dom
    dom.$vnode = vnode
    return dom
  }

  let { name, attrs, events, children } = vnode
  let dom = document.createElement(name)

  foreach(attrs, (key, value) => dom.setAttribute(key, value))
  foreach(events, (event, callback) => {
    dom.addEventListener(event, callback, false)
  })

  children.forEach(child => {
    let childDOM = createElement(child)
    dom.appendChild(childDOM)
  })

  vnode.$dom = dom
  dom.$vnode = vnode

  return dom
}
