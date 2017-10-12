import createVirtualDOM from './createVirtualDOM'
import createDOM from './createDOM'

import diff from './diff'
import patch from './patch'
import * as defaultDirectives from './directives'
import foreach from './utils/foreach'
import merge from './utils/merge'
import { isNode, isElement } from './utils/isDOM'


export { createVirtualDOM, createDOM, diff, patch }
export default class VirtualDOM {
  constructor({ template, data = {}, methods = {}, directives = {}, selector }) {
    this.template = template.trim()
    this.data = data
    this.methods = methods
    this.directives = merge(defaultDirectives, directives)
    this.selector = selector
    this.create()
    this.render()    
  }
  create() {
    let { template, data, methods, directives } = this
    foreach(directives, (name, defination) => directives[name] = defination.bind(this))
    foreach(methods, (name, func) => methods[name] = func.bind(this))

    let { vnodes, vtree } = createVirtualDOM({ template, data, methods, directives })

    this.vnodes = vnodes
    this.vtree = vtree
  }
  render() {
    let { vnodes, vtree, selector } = this
    let elements = createDOM(vtree)
    let container = (isNode(selector) || isElement(selector)) ? selector : document.querySelector(selector)
    
    elements.forEach(item => container.appendChild(item))
    
    this.container = container
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
      let lastVnodes = this.vnodes
      let lastVtree = this.vtree
      
      this.create() // this.vnodes and this.vtree will be overrided
      let nextVtree = this.vtree

      let patches = diff(lastVtree, nextVtree, null)
      
      let { vnodes, vtree } = patch({ patches, vtree: lastVtree, vnodes: lastVnodes, container: this.container }) 
      // this.vtree and this.vnodes will be updated

      this.vnodes = vnodes
      this.vtree = vtree

      this.$$transactionResolves.forEach(resolve => resolve())
      this.$$transactionResolves = []
      this.$$transactionPromises = []
    }, 10)

    return Promise.all(this.$$transactionPromises)
  }

  // destroy method only destroy real DOM nodes, do not destroy vnodes/vtree,
  // so you can run render method again after you run destroy
  destroy() {
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
  }
}
