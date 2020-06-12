import cloneDeep from 'lodash/cloneDeep'
import merge from './merge'

export default function cloneVNode(vnode, _parent) {
  let { events, _scope, children } = vnode
  let tVNode = merge({}, vnode)
  let parent = _parent || vnode.parent
  
  delete tVNode.events
  delete tVNode._scope
  delete tVNode.children
  delete tVNode.parent

  let newVNode = cloneDeep(tVNode)
  
  newVNode.events = events
  newVNode._scope = _scope
  newVNode.parent = parent

  if (Array.isArray(children)) {
    children = children.map(child => cloneVNode(child, newVNode))
    newVNode.children = children
  }

  return newVNode
}