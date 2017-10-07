import createElement from './createElement'

export default function patch(patches, vtree, container) {
  patches.forEach(item => {
    let { type, parent, vnode } = item
    let $parent = parent === null ? container : parent.$element
    let borthers = parent === null ? vtree : parent.children

    if (type === 'remove') {
      let $element = vnode.$element
      $element.$vnode = null // remove $vnode on DOM element
      $parent.removeChild($element) // remove DOM element
      vnode.$element = null // remove $element on vnode
      let index = borthers.indexOf(vnode)
      borthers.splice(index, 1) // remove vnode from vtree
    }
    else if (type === 'append') {
      let $element = createElement(vnode)
      $parent.appendChild($element)
      borthers.push(vnode)
    }
    else if (type === 'insert') {
      let $element = createElement(vnode)
      let target = item.target
      let $target = target.$element
      $parent.insertBefore($element, $target)
      let index = borthers.indexOf(target)
      borthers.splice(index, 0, vnode)
    }
    else if (type === 'move') {
      let $element = vnode.$element
      let target = item.target
      let $target = target.$element
      $parent.insertBefore($element, $target)
      let index = borthers.indexOf(vnode)
      borthers.splice(index, 1)
      let targetIndex = borthers.indexOf(target)
      borthers.splice(targetIndex, 0, vnode)
    }
    else if (type === 'changeText') {
      let $element = vnode.$element
      let text = item.text
      $element.innerText = text
      vnode.children = []
      vnode.text = text
    }
    else if (type === 'changeAttribute') {
      let $element = vnode.$element
      let changedAttrs = item.attributes
      changedAttrs.forEach(attr => {
        let { key, value } = attr
        $element.setAttribute(key, value)
        vnode.attrs[key] = value
      })

      let attrs = vnode.attrs
      vnode.id = attrs.id
      vnode.class = attrs.class ? attrs.class.split(' ') : []
    }
  })
}
