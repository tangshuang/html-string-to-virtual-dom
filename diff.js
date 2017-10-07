export default function diff(oldNodes, newNodes, parentVNode) {
  let oldIdentifies = oldNodes.map(vnode => identify(vnode))
  let newIdentifies = newNodes.map(vnode => identify(vnode))

  let patches = []

  let finalIdentities = []
  let finalNodes = []

  oldIdentifies.forEach((id, i) => {
    let oldNode = oldNodes[i]
    if (newIdentifies.indexOf(id) === -1) {
      patches.push({ type: 'remove', parent: parentVNode, vnode: oldNode })
    }
    else {
      finalIdentities.push(id)
      finalNodes.push(oldNode)
    }
  })

  let cursor = 0

  newIdentifies.forEach((id, i) => {
    let newNode = newNodes[i]

    // all nodes are new
    if (oldIdentifies.length === 0) {
      patches.push({ type: 'append', parent: parentVNode, vnode: newNode })
      return
    }

    let targetIndentity = finalIdentities[i]
    let targetNode = finalNodes[i]

    cursor = i
    let foundPosition = findIndentityIndex(id, finalIdentities, cursor)

    // identifies are at the same position, means node has not changed
    if (id === targetIndentity) {
      patches = patches.concat(diffSameNodes(targetNode, newNode, parentVNode))
    }
    // identifies are NOT at the same position, but exists in old nodes, means node has been moved
    else if (foundPosition !== -1) {
      let oldNode = finalNodes[foundPosition]
      let oldIndentity = finalIdentities[foundPosition]
      patches.push({ type: 'move', parent: parentVNode, vnode: oldNode, target: targetNode })

      finalNodes.splice(foundPosition, 1)
      finalNodes.splice(i, 0, oldNode)
      finalIdentities.splice(foundPosition, 1)
      finalIdentities.splice(i, 0, oldIndentity)
    }
    // not exists, insert
    else if (i < finalIdentities.length) {
      patches.push({ type: 'insert', parent: parentVNode, vnode: newNode, target: targetNode })
      finalNodes.splice(i, 0, newNode)
      finalIdentities.splice(i, 0, id)
    }
    // not exists, append
    else {
      patches.push({ type: 'append', parent: parentVNode, vnode: newNode })
      finalNodes.push(newNode)
      finalIdentities.push(id)
    }
  })

  // remove no use nodes
  for (let i = cursor + 1; i < finalNodes.length; i ++) {
    let oldNode = finalNodes[i]
    patches.push({ type: 'remove', parent: parentVNode, vnode: oldNode })
  }
  // finalNodes.splice(cursor + 1, finalNodes.length - cursor) // there is no need to do this any more

  return patches
}

function identify(vnode) {
  if (vnode.attrs.key) {
    return vnode.name + ':' + vnode.attrs.key
  }
  return vnode.name + ':' + Object.keys(vnode.attrs).join(',') + '|' + !!vnode.text
}

function diffSameNodes(oldNode, newNode, parentVNode) {
  let patches = []

  if (oldNode.text !== newNode.text) {
    patches.push({ type: 'changeText', parent: parentVNode, vnode: oldNode, text: newNode.text })
  }

  let attrsPatches = diffAttributes(oldNode, newNode)
  if (attrsPatches.length) {
    patches.push({ type: 'changeAttribute', parent: parentVNode, vnode: oldNode, attributes: attrsPatches })
  }

  let oldChildren = oldNode.children
  let newChildren = newNode.children

  patches = patches.concat(diff(oldChildren, newChildren, oldNode))

  return patches
}

function diffAttributes(oldNode, newNode) {
  let patches = []

  let oldAttrs = oldNode.attrs
  let newAttrs = newNode.attrs

  let keys = Object.keys(newAttrs)
  if (keys.length) {
    keys.forEach(key => {
      let oldValue = oldAttrs[key]
      let newVaule = newAttrs[key]

      if (oldValue !== newVaule) {
        patches.push({
          key,
          value: newVaule,
        })
      }
    })
  }

  return patches
}

function findIndentityIndex(id, ids, cursor) {
  for (let i = cursor, len = ids.length; i < len; i ++) {
    if (id === ids[i]) {
      return i
    }
  }
  return -1
}
