import {Parser} from 'htmlparser2'
import createElement from './createElement'
import diff from './diff'
import patch from './patch'
import foreach from './utils/foreach'
import merge from './utils/merge'
import defaultDirectives from './directives'
import interpose from './utils/interpose'
import { isNode, isElement } from './utils/isDOM'

export default class VirtualDOM {
  constructor({template, data = {}, events = {}, directives = {}, selector}) {
    this.template = template
    this.data = data
    this.events = events
    this.directives = merge(defaultDirectives, directives)
    this.selector = selector
    this.vtree = this.createVirtualDOM()
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
    let vnodes = []
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
        vnodes.push(vnode)
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

    let getChildrenVNOdes = vnode => {
      let res = []
      if (vnode.children.length) {
        vnode.children.forEach(item => {
          res.push(item)
          if (item.children.length) {
            res = res.concat(getChildrenVNOdes(item))
          }
        })
      }
      return res
    }
    let directiveOriginalChildrenVNodes = []
    let directiveGenerateChildrenVNodes = []
    let directives = this.directives
    vnodes.forEach(vnode => {
      if (vnode.name.substring(0, 1) === '@') {
        let directiveName = vnode.name.substring(1)
        if (typeof directives[directiveName] === 'function') {
          let attrs = vnode.attrs
          let children = vnode.children
          let events = vnode.events
          let childNodes = directives[directiveName](attrs, events, children, data, this) || []
          
          let parentChildren = vnode.parent ? vnode.parent.children : vnodes
          let i = parentChildren.indexOf(vnode)
          parentChildren.splice(i, 1, ...childNodes)

          directiveOriginalChildrenVNodes = directiveOriginalChildrenVNodes.concat(getChildrenVNOdes(vnode))
          directiveGenerateChildrenVNodes = directiveGenerateChildrenVNodes.concat(getChildrenVNOdes({ children: childNodes }))
        }
        vnode._directive = true
      }
    })
    directiveOriginalChildrenVNodes.forEach(vnode => vnode._directive = true)
    directiveGenerateChildrenVNodes.forEach(vnode => vnodes.push(vnode))

    this.vnodes = vnodes.filter(vnode => !vnode._directive)

    let roots = vnodes.filter(item => !item.parent)
    return roots
  }
  createDOM() {
    return this.vtree.map(item => createElement(item))
  }
  render() {
    if (!this.selector) {
      return
    }

    let selector = this.selector
    let vtree = this.createDOM()
    let container = (isNode(selector) || isElement(selector)) ? selector : document.querySelector(selector)
    
    this.container = container
    container.innerHTML = ''
    vtree.forEach(item => container.appendChild(item))
  }
  update(data) {
    this.data = merge(this.data, data)
    
    this.$$transactionPromises = this.$$transactionPromises || []
    this.$$transactionResolves = this.$$transactionResolves || []

    this.$$transactionPromises.push(new Promise(resolve => this.$$transactionResolves.push(resolve)))
    
    if (this.$$transaction) {
      clearTimeout(this.$$transaction)
    }

    this.$$transaction = setTimeout(() => {
      let lastVtree = this.vtree
      let newVtree = this.createVirtualDOM()

      let patches = diff(lastVtree, newVtree, null)
      patch(patches, this.vtree, this.container) // this.vtree will be updated

      this.$$transactionResolves.forEach(resolve => resolve())
      this.$$transactionResolves = []
      this.$$transactionPromises = []
    }, 10)

    return Promise.all(this.$$transactionPromises)
  }
  destroy() {
    let roots = []
    this.vtree.forEach(vnode => {
      roots.push(vnode.$element)
    })
    this.vnodes.forEach(vnode => {
      let el = vnode.$element
      el.$vnode = null
      vnode.$element = null
    })
    roots.forEach(el => {
      el.parentNode.removeChild(el)
    })
    roots = null
  }
}
