import { Parser } from 'htmlparser2'
import createElement from './createElement'
import diff from './diff'
import patch from './patch'
import * as defaultDirectives from './directives'
import foreach from './utils/foreach'
import merge from './utils/merge'
import interpose from './utils/interpose'
import { isNode, isElement } from './utils/isDOM'
import recursive from './utils/recursive'
import hashCode from './utils/hashCode'

export default class VirtualDOM {
  constructor({ template, data = {}, methods = {}, directives = {}, selector }) {
    this.template = template.trim()
    this.data = data
    this.methods = methods
    this.directives = merge(defaultDirectives, directives)
    this.selector = selector
    this.createVirtualDOM()
  }
  createVirtualDOM() {
    let { template, data, methods, directives } = this

    // create an array to save parsed nodes
    let nodes = []
    // create an array to record node's depth
    let depth = []

    // begin to parse template
    let parser = new Parser({
      onopentag(name, attrs) {
        let node = {
          name,
          attrs,
          children: [],
          parent: null,
          events: {},
        }

        // record whether this tag is in a directive
        if (directives[name]) {
          node._isDirective = true
        }

        // find out current vnode's parent
        let parent = depth.length ? depth[depth.length - 1] : null
        if (parent) {
          node.parent = parent
          parent.children.push(node)
          // if its parent is a directive/directive child, it should be added a tag
          // vnodes which has _directive prop will be removed from original vnodes list
          if (parent._isDirective || parent._isDirectiveChild) {
            node._isDirectiveChild = true
          }
        }

        depth.push(node)
        nodes.push(node)
      },
      onclosetag(name) {
        depth.pop()
      },
      ontext(text) {
        if (!text.trim()) {
          return
        }
        // find out which vnode this text are in
        let parent = depth.length ? depth[depth.length - 1] : null
        let node = {
          text: text.replace(/\s+/g, ' '),
          parent,
        }

        if (parent) {
          node.parent = parent
          parent.children.push(node)
          if (parent._isDirective || parent._isDirectiveChild) {
            node._isDirectiveChild = true
          }
        }

        nodes.push(node)
      },
    }, { 
      recognizeSelfClosing: true,
      lowerCaseTags: false,
      lowerCaseAttributeNames: false,
    })
    parser.parseChunk(template)
    parser.done()

    // calculate every node's hash code
    nodes.forEach(node => {
      let hashsrc = ''
      if (node.text) {
        hashsrc = ':' + node.text
      }
      else {
        hashsrc += node.name + ':'
        hashsrc += JSON.stringify(node.attrs)
      }
      node._hash = hashCode(hashsrc)
    })

    // now we have get all original nodes which do not contain directive children,
    // next we need to build a virtual dom tree which has same structure with template html

    // find out top level nodes, because of their .children prop, we get a tree,
    // even contains all directive children
    let tree = nodes.filter(node => !node.parent)

    // replace interpolations which can use expression width data, i.e. {{ a + 1 }} or { b.name } or {{ a + b }}
    let keys = []
    let values = []
    foreach(data, (key, value) => {
      keys.push(key)
      values.push(value)
    })

    // replace interpolations which can use expression width methods, i.e. {{:get}} or {{:call(name)}}
    // the expression result should be a function if you want to bind it to events
    // NOTICE: data property names and methods property names should be unique
    let funcs = []
    let callbacks = []
    foreach(methods, (func, callback) => {
      funcs.push(func)
      callbacks.push(callback.bind(this))
    })

    // recursive the tree to replace interpolations
    let vnodes = []
    recursive({ children: tree }, 'children', (child, parent) => {
      let { attrs, text, name } = child

      // interpose text
      if (text !== undefined) {
        text = interpose(text, keys, values) // interpose width data
        text = interpose(text, keys.concat(funcs), values.concat(callbacks), '{{:') // interpose width methods and data
        child.text = text
      }
      // interpose attrs
      else {
        foreach(attrs, (k, v) => {
          v = interpose(v, keys.concat(funcs), values.concat(callbacks), '{{:')
          v = interpose(v, keys, values)
          attrs[k] = v
  
          // bind events
          if (k.indexOf('on') === 0 && typeof attrs[k] === 'function') {
            let event = k.substring(2).toLowerCase()
            child.events[event] =  attrs[k]
            // this attribute will be deleted from original attributes
            delete attrs[k]
          }
        })
  
        // generator id and class props, we can not generator them before value has been generatored
        child.id = attrs.id || ''
        child.class = attrs.class ? attrs.class.split(' ') : []
      }

      vnodes.push(child)
    })
    
    // create vtree
    let vtree = vnodes.filter(item => !item.parent)

    // find out top level directives, and recursive them to generator new vnodes
    let vdirectives = vnodes.filter(item => item._isDirective && !item._isDirectiveChild)

    // delete directive relative nodes from vnodes list,
    // in directive function, new nodes will be put into vnodes list, so do not be worried about this
    vnodes = vnodes.filter(item => !item._isDirective && !item._isDirectiveChild)

    function directiveProcessor(vnode, definitions, vnodes, vtree, context) {
      let { name, attrs, children, events, parent } = vnode
      let definition = definitions[name]
    
      // .parent prop should be delete before clone (if you want to clone), 
      // or parent will be cloned, which may cause memory out
      children.forEach(item => delete item.parent)
    
      let childNodes = definition.call(context, { attrs, children, events }) || children
      childNodes.forEach(item => parent ? item.parent = parent : null)
    
      // use new nodes to replace current directive
      let borthers = parent ? parent.children : vtree
      let i = borthers.indexOf(vnode)
      borthers.splice(i, 1, ...childNodes)
    
      // deal with child directives
      // delete _isDirective and _isDirectiveChild
      childNodes.forEach(item => {
        recursive(item, 'children', child => {
          if (child._isDirective) {
            directiveProcessor(child, definitions, vnodes, vtree, context)
          }
    
          // delete child._isDirective
          // delete child._isDirectiveChild
          vnodes.push(child)
        })
    
        // delete item._isDirective
        // delete item._isDirectiveChild
        vnodes.push(item)
      })
    }
    vdirectives.forEach(vnode => {
      // in directive function, new vnodes are created and replace the directive node in its borthers list,
      // and _isDirective and _isDirectiveChild are deleted
      directiveProcessor(vnode, directives, vnodes, vtree, this)
    })

    this.vnodes = vnodes
    this.vtree = vtree

    return vtree
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
      rootElements.push(vnode.$dom)
    })
    this.vnodes.forEach(vnode => {
      let el = vnode.$dom
      el.$vnode = null
      vnode.$dom = null
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
