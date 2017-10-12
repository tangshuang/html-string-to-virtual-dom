import createElement from './createElement'

export default function patch({ patches, vtree, vnodes, container }) {
  patches.forEach(item => {
    let { type, parent, vnode } = item
    let $parent = parent === null ? container : parent.$dom
    let borthers = parent === null ? vtree : parent.children

    if (type === 'remove') {
      let $dom = vnode.$dom
      $dom.$vnode = null // remove $vnode on DOM element
      $parent.removeChild($dom) // remove DOM element
      vnode.$dom = null // remove $dom on vnode
      
      let index = borthers.indexOf(vnode)
      borthers.splice(index, 1) // remove vnode from vtree

      let pos = vnodes.indexOf(vnode)
      vnodes.splice(pos, 1) // remove vnode from vnodes
    }
    else if (type === 'append') {
      let $dom = createElement(vnode)
      $parent.appendChild($dom)
      borthers.push(vnode)
      vnodes.push(vnode)
    }
    else if (type === 'insert') {
      let $dom = createElement(vnode)
      let target = item.target
      let $target = target.$dom
      $parent.insertBefore($dom, $target)
      let index = borthers.indexOf(target)
      borthers.splice(index, 0, vnode)
      vnodes.push(vnode)
    }
    else if (type === 'move') {
      let $dom = vnode.$dom
      let target = item.target
      let $target = target.$dom
      $parent.insertBefore($dom, $target)

      let index = borthers.indexOf(vnode)
      borthers.splice(index, 1)

      let targetIndex = borthers.indexOf(target)
      borthers.splice(targetIndex, 0, vnode)
    }
    else if (type === 'changeText') {
      let $dom = vnode.$dom
      let text = item.text
      $dom.textContent = text
      vnode.text = text
    }
    else if (type === 'changeAttribute') {
      let $dom = vnode.$dom
      let changedAttrs = item.attributes
      changedAttrs.forEach(attr => {
        let { key, value } = attr
        $dom.setAttribute(key, value)
        vnode.attrs[key] = value
      })

      let attrs = vnode.attrs
      vnode.id = attrs.id
      vnode.class = attrs.class ? attrs.class.split(' ') : []
    }
  })

  return { vnodes, vtree }
}
