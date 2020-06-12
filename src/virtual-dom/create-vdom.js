import ScopeX from 'scopex'
import { each } from 'ts-fns'

import VTextNode from 'v-text-node.class.js'
import VNode from './v-node.class.js'
import VNodeList from './v-node-list.class.js'

export function createVNode(type, attrs, children) {
  const vnode = new VNode(type)
  const scopex = new ScopeX(vnode._context)

  const props = {}
  const events = {}

  each(attrs, (value, key) => {
    const attr = key + ''
    if (attr.substr(0, 1) === ':') {
      const prop = scopex.parse(value)
      props[attr.substr(1)] = prop
    }
    else if (attr.substr(0, 1) === '@') {
      const event = attr.substr(1)
      const handler = () => {
        vnode.emitStart(event)
        const output = scopex.parse(value)
        vnode.emitStop(event)
        return output
      }
      events[event] = handler
    }
    else {
      const prop = scopex.interpolate(value)
      props[attr] = prop
    }
  })

  vnode.setProps(props)
  vnode.setEvents(events)

  if (children) {
    vnode.children = createVNodeList(children)
  }

  return vnode
}

export function createTextNode(text) {
  const vnode = new VTextNode()
  const scopex = new ScopeX(vnode._context)
  const str = scopex.interpolate(text)
  vnode.text = str
  return vnode
}

export function createVNodeList(nodes) {
  const items = nodes.map((item) => {
    const { type, attrs, children, text } = item
    if (type) {
      return createVNode(type, attrs, children)
    }
    else {
      return createTextNode(text)
    }
  })
  const list = new VNodeList(items)
  return list
}