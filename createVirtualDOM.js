import { Parser } from 'htmlparser2'
import foreach from './utils/foreach'
import interpose from './utils/interpose'
import recursive from './utils/recursive'
import hashCode from './utils/hashCode'

export default function createVirtualDOM({ template, data = {}, methods = {}, directives = {} }) {
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
        let directiveName = parent._isDirective || parent._isDirectiveChildOf
        if (directiveName) {
          node._isDirectiveChildOf = directiveName
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
        let directiveName = parent._isDirective || parent._isDirectiveChildOf
        if (directiveName) {
          node._isDirectiveChildOf = directiveName
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

    // if there is a `key` attribute for current node, use this key for hash code
    if (node.key) {
      hashsrc = node.key
    }
    // text node are same node type, so they use same node hash code
    else if (node.text !== undefined) {
      hashsrc = '[[text node]]'
    }
    // normal tag nodes, use tag name and attributes for hash code
    else {
      hashsrc += node.name + ':'
      hashsrc += JSON.stringify(node.attrs)
    }

    // tags in directive are different, they may show/hide by directive toggle action
    let directiveName = node._isDirective || node._isDirectiveChildOf
    if (directiveName) {
      hashsrc += ':directive=' + directiveName
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
      child.key = attrs.key || ''
    }

    vnodes.push(child)
  })
  
  // create vtree
  let vtree = vnodes.filter(item => !item.parent)

  // find out top level directives, and recursive them to generator new vnodes
  let vdirectives = vnodes.filter(item => item._isDirective && !item._isDirectiveChildOf)

  // delete directive relative nodes from vnodes list,
  // in directive function, new nodes will be put into vnodes list, so do not be worried about this
  vnodes = vnodes.filter(item => !item._isDirective && !item._isDirectiveChildOf)

  function directiveProcessor({ vnode, definations, vnodes, vtree }) {
    let { name, attrs, children, events, parent } = vnode
    let defination = definations[name]
  
    // .parent prop should be delete before clone (if you want to clone), 
    // or parent will be cloned, which may cause memory out
    children.forEach(item => delete item.parent)
  
    let childNodes = defination({ attrs, children, events }) || children
    childNodes.forEach(item => parent ? item.parent = parent : null)
  
    // use new nodes to replace current directive
    let borthers = parent ? parent.children : vtree
    let i = borthers.indexOf(vnode)
    borthers.splice(i, 1, ...childNodes)
  
    // deal with child directives
    // delete _isDirective and _isDirectiveChildOf
    childNodes.forEach(item => {
      recursive(item, 'children', child => {
        if (child._isDirective) {
          directiveProcessor({ vnode: child, definations, vnodes, vtree })
        }
  
        // delete child._isDirective
        // delete child._isDirectiveChildOf
        vnodes.push(child)
      })
  
      // delete item._isDirective
      // delete item._isDirectiveChildOf
      vnodes.push(item)
    })
  }
  vdirectives.forEach(vnode => {
    // in directive function, new vnodes are created and replace the directive node in its borthers list,
    // and _isDirective and _isDirectiveChildOf are deleted
    directiveProcessor({ vnode, definations: directives, vnodes, vtree })
  })

  return { vtree, vnodes }
}