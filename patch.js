import createElement from './createElement'

export default function patch(patches, topLevelElement) {
  patches.forEach(item => {
    let {action, target, context} = item
    let $element = target === null ? topLevelElement : target.$element
    switch (action) {
      case 'remove':
        $element.parentNode.removeChild($element)
        $element.$vnode = null
        target.$element = null
        break
      case 'append':
        $element.appendChild(createElement(context))
        break
      case 'insert':
        $element.parentNode.insertBefore(createElement(context), $element)
        break
      case 'move':
        $element.parentNode.insertBefore(context.$element, $element)
        break
      case 'changeText':
        $element.innerText = context
        break
      case 'changeAttribute':
        let newAttrs = context
        newAttrs.forEach(attr => {
          $element.setAttribute(attr.key, attr.value)
        })
        break
      default:
        ;
    }
  })
}
