import foreach from './utils/foreach'

export default function diff(lastVtree, nextVtree, parentVNode) {
  let oldHashes = lastVtree.map(vnode => vnode._hash)
  let newHashes = nextVtree.map(vnode => vnode._hash)

  let patches = []

  let recordHashes = []
  let recordNodes = []

  oldHashes.forEach((hash, i) => {
    let oldNode = lastVtree[i]
    if (newHashes.indexOf(hash) === -1) {
      patches.push({ type: 'remove', parent: parentVNode, vnode: oldNode })
    }
    else {
      recordHashes.push(hash)
      recordNodes.push(oldNode)
    }
  })

  let cursor = 0

  newHashes.forEach((hash, i) => {
    let newNode = nextVtree[i]

    // all nodes are new
    if (oldHashes.length === 0) {
      patches.push({ type: 'append', parent: parentVNode, vnode: newNode })
      return
    }
    
    cursor = i
    // cursorHash and cursorNode is the current hash and vnode which is iterated to.
    let cursorHash = recordHashes[cursor]
    let cursorNode = recordNodes[cursor]

    let position = findHashIndex(hash, recordHashes, cursor)

    // newHash and the same oldHash are at the same position, means node has not changed
    if (hash === cursorHash) {
      patches = patches.concat(diffSameNodes(cursorNode, newNode, parentVNode))
    }
    // newHash and the same oldHash are NOT at the same position, but exists in old list, means the node has been moved
    else if (position !== -1) {
      let oldNode = recordNodes[position]
      let oldHash = recordHashes[position]

      patches.push({ type: 'move', parent: parentVNode, vnode: oldNode, target: cursorNode })

      // move oldNode in recordNodes list
      recordNodes.splice(position, 1)
      recordNodes.splice(cursor, 0, oldNode)

      recordHashes.splice(position, 1)
      recordHashes.splice(cursor, 0, oldHash)
    }
    // not exists, and cursor is not at the end of recordHashes list, means to insert
    else if (cursor < recordHashes.length) {
      patches.push({ type: 'insert', parent: parentVNode, vnode: newNode, target: cursorNode })
      recordNodes.splice(cursor, 0, newNode)
      recordHashes.splice(cursor, 0, hash)
    }
    // not exists, append
    else {
      patches.push({ type: 'append', parent: parentVNode, vnode: newNode })
      recordNodes.push(newNode)
      recordHashes.push(hash)
    }
  })

  // remove no use nodes
  for (let i = cursor + 1; i < recordNodes.length; i ++) {
    let oldNode = recordNodes[i]
    patches.push({ type: 'remove', parent: parentVNode, vnode: oldNode })
  }

  return patches
}

function diffSameNodes(oldNode, newNode, parentVNode) {
  let patches = []

  if (oldNode.text && newNode.text && oldNode.text !== newNode.text) {
    patches.push({ type: 'changeText', parent: parentVNode, vnode: oldNode, text: newNode.text })
  }

  let attrsPatches = diffAttributes(oldNode, newNode)
  if (attrsPatches.length) {
    patches.push({ type: 'changeAttribute', parent: parentVNode, vnode: oldNode, attributes: attrsPatches })
  }

  let oldChildren = oldNode.children || []
  let newChildren = newNode.children || []

  patches = patches.concat(diff(oldChildren, newChildren, oldNode))

  return patches
}

function diffAttributes(oldNode, newNode) {
  let patches = []

  let oldAttrs = oldNode.attrs
  let newAttrs = newNode.attrs

  // if newAttrs is undefined, foreach will do nothing
  foreach(newAttrs, key => {
    let oldValue = oldAttrs[key]
    let newVaule = newAttrs[key]

    if (oldValue !== newVaule) {
      patches.push({
        key,
        value: newVaule,
      })
    }
  })

  return patches
}

function findHashIndex(hash, hashes, cursor) {
  for (let i = cursor, len = hashes.length; i < len; i ++) {
    if (hash === hashes[i]) {
      return i
    }
  }
  return -1
}
