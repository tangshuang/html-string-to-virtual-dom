import { isInstanceOf, each } from 'ts-fns'

import VNode from '../virtual-dom/v-node.class.js'
import VTextNode from '../virtual-dom/v-text-node.class.js'

import walk from './walk.js'

function createElement(vnode) {
  if (isInstanceOf(vnode, VNode)) {
    const [type, attrs, children, callback] = walk(vnode)
    const dom = document.createElement(type)

    each(attrs, (value, key) => {
      dom.setAttribute(key, value)
    })

    each(children, (child) => {
      const el = createElement(child)
      dom.appendChild(el)
    })

    callback(dom)

    return dom
  }
  else if (isInstanceOf(vnode, VTextNode)) {
    const { text } = vnode
    const dom = document.createTextNode(text)
    return dom
  }
}