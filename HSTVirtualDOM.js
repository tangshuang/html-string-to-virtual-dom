import { Parser } from 'htmlparser2'
import createElement from './createElement'
import diff from './diff'
import patch from './patch'
import foreach from './utils/foreach'
import merge from './utils/merge'
import defaultDirectives from './directives'
import interpose from './utils/interpose'
import { isNode, isElement } from './utils/isDOM'
import recursiveChildren from './utils/recursiveChildren'

export default class HSTVirtualDOM {
  constructor({ template, data = {}, events = {}, directives = {}, selector }) {
    this.template = template
    this.data = data
    this.events = events
    this.directives = merge(defaultDirectives, directives)
    this.selector = selector
    this.createVirtualDOM()
  }
  createVirtualDOM() {
    let template = this.template
    let data = this.data
    let directives = this.directives

    // replace interpolations with visible data
    // only string and number data will be treated as interpolations' value
    foreach(data, (key, value) => {
      if (typeof value === 'string' || typeof value === 'number') {
        template = interpose(template, key, value)
      }
    })

    // create vnodes:
    // 1. make a createVNode function to create a virtual node
    // 2. use string text as textNode in children, textNode in 
    // top level vnodes is not allow which will be ignored
    let vnodes = []
    let recordDepth = []
    let createVNode = (name, attrs = {}) => {
      let vnode = {
        name,
        attrs,
        id: attrs.id ? attrs.id : '',
        class: attrs.class ? attrs.class.split(' ') : [],
        children: [],
        events: {},
      }

      // transfer `on` beginning attribute to be an event binder
      // and delete it from original attributes
      foreach(attrs, (key, value) => {
        if (key.indexOf('on') === 0 && value.substring(0, 3) == '{{:' && value.substring(value.length - 2) == '}}') {
          let eventName = key.substring(2).toLowerCase()
          let eventCallbackName = value.substring(3, value.length - 2)

          if (this.events[eventCallbackName]) {
            vnode.events[eventName] = this.events[eventCallbackName].bind(this)
          }

          // this attribute will be deleted from original attributes
          delete attrs[key]
        }
      })

      return vnode
    }
    let parser = new Parser({
      onopentag(name, attrs) {
        let vnode = createVNode(name, attrs)

        // record whether this tag is in a directive
        if (vnode.name.substring(0, 1) === ':') {
          vnode._directive = true
        }

        // find out current vnode's parent
        let parent = recordDepth.length ? recordDepth[recordDepth.length - 1] : null
        if (parent) {
          vnode.parent = parent
          parent.children.push(vnode)
          // if its parent is a directive/directive child, it should be added a tag
          // vnodes which has _directive prop will be removed from original vnodes list
          if (parent._directive) {
            vnode._directive = true
          }
        }

        recordDepth.push(vnode)
        vnodes.push(vnode)
      },
      onclosetag(name) {
        recordDepth.pop()
      },
      ontext(text) {
        // find out which vnode this text are in
        let vnode = recordDepth[recordDepth.length - 1]
        if (vnode) {
          vnode.children.push(text.replace(/\s+/g, ' '))
        }
      },
    })

    parser.parseChunk(template)
    parser.done()
    recordDepth = null

    // deal with directives,
    // a directive tag begins with `:`, like: <:name></:name>
    vnodes.forEach((vnode, i) => {
      if (vnode.name.substring(0, 1) === ':') {
        let directiveName = vnode.name.substring(1)
        if (typeof directives[directiveName] === 'function') {
          let childNodes = directives[directiveName].call(vnode) || []
          
          if (vnode.parent) {
            // find out this directive's borthers
            let parent = vnode.parent
            let borthers = parent.children
            // replace original directive tag with childNodes in parent.children array
            let i = borthers.indexOf(vnode)
            borthers.splice(i, 1, ...childNodes)
          }
          // get all new vnodes, and put them into original vnodes list
          recursiveChildren({ children: childNodes }, (i, vitem, vparent) => {
            // delete _dirctive prop for these new vnodes, so that them will not be removed
            delete vitem._directive 
            vnodes.push(vitem)
          })
          // NOTICE: when this action finished, vnodes array's length increase, forEach
          // will continue the loop from the first new childNode, and if a childNode 
          // is a directive two, the same replace action will be done, so you do not need to
          // be worried about nest directives
        }
      }
    })
    
    // all directive nodes/children of directive will be removed from original vnodes list
    vnodes = vnodes.filter(vnode => !vnode._directive)

    this.vnodes = vnodes
    this.vtree = vnodes.filter(item => !item.parent)
    this.status = 0

    return this.vtree
  }
  createDOM() {
    let elements = this.vtree.map(item => createElement(item))
    this.status = 1

    return elements
  }
  
  render() {
    if (this.status > 1) {
      console.error('[hst-vritual-dom:] You can not re-render a exists vdom before it is destroyed.')
      return
    }

    if (!this.selector) {
      console.error('[hst-vritual-dom:] Please set a selector before render.')
      return
    }

    let selector = this.selector
    let elements = this.createDOM()
    let container = (isNode(selector) || isElement(selector)) ? selector : document.querySelector(selector)
    
    elements.forEach(item => container.appendChild(item))
    
    this.container = container
    this.status = 2
  }
  update(data) {
    if (this.status < 2) {
      console.error('[hst-vritual-dom:] You can not update a vdom which is not rendered.')
      return
    }

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

    this.status = 3

    return Promise.all(this.$$transactionPromises)
  }

  // destroy method only destroy real DOM nodes, do not destroy vnodes/vtree,
  // so you can run render method again after you run destroy
  destroy() {
    if (this.status < 1) {
      console.error('[hst-vritual-dom:] You can not destroy a virtual dom whose real DOM is not created.')
      return
    }

    let rootElements = []
    this.vtree.forEach(vnode => {
      rootElements.push(vnode.$element)
    })
    this.vnodes.forEach(vnode => {
      let el = vnode.$element
      el.$vnode = null
      vnode.$element = null
    })
    rootElements.forEach(el => {
      // If DOM is created but not mounted to document (status = 1),
      // el.parentNode is null, then just set `rootElements = null` is ok.
      // Notice: if some developers use .createDOM by himself (status = 1), 
      // he should set the variable which saves the DOM elements to be
      // null manually, or the DOM elements will stay in memory.
      if (el.parentNode) {
        el.parentNode.removeChild(el)
      }
    })
    rootElements = null

    this.status = -1
  }
}
