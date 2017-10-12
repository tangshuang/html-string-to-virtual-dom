import createElement from './createElement'

export default function createDOM(vtree) {
  return vtree.map(item => createElement(item))
}