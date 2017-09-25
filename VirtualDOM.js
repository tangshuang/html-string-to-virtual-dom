import {Parser} from 'htmlparser2'
import createElement from './createElement'
import diff from './diff'
import patch from './patch'

function foreach(obj, callback) {
  let keys = Object.keys(obj)
  keys.forEach(key => {
    let value = obj[key]
    callback(key, value)
  })
}
function merge(obj1, obj2) {
  let obj = {}
  foreach(obj1, (key, value) => obj[key] = value)
  foreach(obj2, (key, value) => obj[key] = value)
  return obj
}

export default class VirtualDOM {
  constructor({template, data, events = {}, selector}) {
    this.template = template
    this.data = data
    this.events = events
    this.selector = selector
    this.vnodes = this.createVirtualDOM()
  }
  createVirtualDOM() {
    let template = this.template
    let data = this.data
    let interpose = (str, key, value) => {
      if (typeof str !== 'string') {
        return str
      }
      if (str.indexOf('{{') > -1 && str.indexOf('}}')) {
        let reg = new RegExp('\{\{' + key + '\}\}', 'g')
        str = str.replace(reg, value)
      }
      return str
    }

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
        props: {},
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

    elements.forEach(vnode => {
      if (vnode.name === '@foreach') {
        let attrs = vnode.attrs
        let items = data[attrs.target]
        let key = attrs.key
        let value = attrs.value
        let children = vnode.children
        let childNodes = []

        if (items) {
          foreach(items, (i, item) => {
            children.forEach(child => {
              let node = {}
              foreach(child, (prop, value) => {
                node[prop] = value
              })
              node.text = interpose(node.text, key, i)
              node.text = interpose(node.text, value, item)
              foreach(node.attrs, (k, v) => {
                node.attrs[k] = interpose(v, key, i)
                node.attrs[k] = interpose(v, value, item)
              })
              node.id = node.attrs.id
              node.class = node.attrs.class ? node.attrs.class.split(' ') : []
              childNodes.push(node)
            })
          })
        }

        if (childNodes.length) {
          let parentChildren = vnode.parent ? vnode.parent.children : elements
          let i = parentChildren.indexOf(vnode)
          parentChildren.splice(i, 1, ...childNodes)
        }
      }
      else if (vnode.name === '@if') {
        let attrs = vnode.attrs
        let condition = attrs.condition
        let children = vnode.children
        let parentChildren = vnode.parent ? vnode.parent.children : elements
        let i = parentChildren.indexOf(vnode)

        if (eval(condition)) {
          parentChildren.splice(i, 1, ...children)
        }
        else {
          parentChildren.splice(i, 1)
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

    let lastVnodes = this.vnodes
    let newVnodes = this.createVirtualDOM()
    let patches = diff(lastVnodes, newVnodes, null)

    patch(patches, lastVnodes[0].$element.parentNode)
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
