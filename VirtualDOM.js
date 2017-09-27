import {Parser} from 'htmlparser2'
import createElement from './createElement'
import diff from './diff'
import patch from './patch'
import foreach from './utils/foreach'
import merge from './utils/merge'
import defaultDirectives from './directives'
import interpose from './utils/interpose'

export default class VirtualDOM {
  constructor({template, data = {}, events = {}, directives = {}, selector}) {
    this.template = template
    this.data = data
    this.events = events
    this.directives = merge(defaultDirectives, directives)
    this.selector = selector
    this.vnodes = this.createVirtualDOM()
  }
  createVirtualDOM() {
    let template = this.template
    let data = this.data

    let dataKeys = Object.keys(data)
    if (dataKeys.length) {
      dataKeys.forEach(key => {
        let value = data[key]
        template = interpose(template, key, value)
      })
    }

    let self = this
    let elements = []
    let recordtree = []
    let createVNode = (name, attrs) => {
      let obj = {
        name,
        id: attrs.id,
        class: attrs.class ? attrs.class.split(' ') : [],
        attrs,
        parent: null,
        children: [],
        text: null,
        events: {},
      }

      let attrKeys = Object.keys(attrs)
      attrKeys.forEach(key => {
        let value = attrs[key]
        if (key.indexOf('on') === 0 && value.substring(0, 3) == '{{:' && value.substring(value.length - 2) == '}}') {
          let eventName = key.substring(2).toLowerCase()
          let eventCallbackName = value.substring(3, value.length - 2)

          obj.events[eventName] = this.events[eventCallbackName].bind(this)
          delete attrs[key]
        }
      })
      obj.attrs = attrs

      return obj
    }

    let parser = new Parser({
      onopentag(name, attrs) {
        let vnode = createVNode(name, attrs)

        let parent = recordtree.length ? recordtree[recordtree.length - 1] : null
        if (parent) {
          vnode.parent = parent
          if (!parent.hasOwnProperty('children')) {
            parent.children = []
          }
          parent.children.push(vnode)
        }

        recordtree.push(vnode)
        elements.push(vnode)
      },
      ontext(text) {
        let vnode = recordtree[recordtree.length - 1]
        if (vnode) {
          vnode.text = text.trim()
        }
      },
      onclosetag(name) {
        recordtree.pop()
      }
    })
    parser.parseChunk(template)
    parser.done()

    let directives = this.directives
    elements.forEach(vnode => {
      if (vnode.name.substring(0, 1) === '@') {
        let directiveName = vnode.name.substring(1)
        if (typeof directives[directiveName] === 'function') {
          let attrs = vnode.attrs
          let children = vnode.children
          let events = vnode.events
          let childNodes = directives[directiveName](attrs, events, children, data, this) || []
          
          let parentChildren = vnode.parent ? vnode.parent.children : elements
          let i = parentChildren.indexOf(vnode)
          parentChildren.splice(i, 1, ...childNodes)
        }
      }
    })

    this.elements = elements

    let roots = elements.filter(item => !item.parent)
    return roots
  }
  createDOM() {
    let elements = this.vnodes.map(item => createElement(item))
    return elements
  }
  render() {
    if (!this.selector) {
      return
    }

    let selector = this.selector
    let elements = this.createDOM()
    let container = document.querySelector(selector)

    container.innerHTML = ''
    elements.forEach(item => container.appendChild(item))
  }
  update(data) {
    this.data = merge(this.data, data)

    if (this.$$transaction) {
      clearTimeout(this.$$transaction)
    }

    this.$$transaction = setTimeout(() => {
      let lastVnodes = this.vnodes
      let newVnodes = this.createVirtualDOM()
      let patches = diff(lastVnodes, newVnodes, null)
  
      patch(patches, lastVnodes[0].$element.parentNode)

      this.$$transaction = null
    }, 10)
  }
  destroy() {
    this.elements.forEach(vnode => {
      let el = vnode.$element
      vnode.$element = null
      el.$vnode = null
      el.parentNode.removeChild(el)
    })
  }
}
