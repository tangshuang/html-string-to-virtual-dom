import foreach from '../utils/foreach'
import ScopeX from 'scopex'

export default function createElement(vnode, context = {}) {
  if (vnode.text) {
    const dom = document.createTextNode(vnode.text)
    vnode._dom = dom
    dom._vnode = vnode
    return dom
  }

  const { type, attrs, children } = vnode
  const scope = new ScopeX(context)

  const events = {}
  const props = {}

  foreach(attrs, (key, value) => {
    if (key.indexOf('on') === 0) {
      events[key] = value
    }
    else {
      props[key] = value
    }
  })

  const dom = document.createElement(type)

  foreach(props, (key, value) => {
    const state = scope.interpolate(value)
    dom.setAttribute(key, state)
  })

  foreach(events, (key, value) => {
    const callback = ($event) => {
      const scope = new ScopeX({ ...context, $event })
      return scope.parse(value)
    }
    dom.addEventListener(key, callback, false)
  })

  children.forEach((child) => {
    const childDOM = createElement(child)
    dom.appendChild(childDOM)
  })

  vnode._dom = dom
  dom._vnode = vnode

  return dom
}
