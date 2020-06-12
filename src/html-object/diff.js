import deepdiff from 'deep-diff'
import { makeKeyPath } from 'ts-fns'

/**
 * diff two nodes
 * @param {array<Node>} nodes1
 * @param {array<Node>} nodes2
 * @returns {array} array<[
 *   tuple<[DiffType, array<DiffPath>, nextValue, prevValue]>
 * ]>
 */
export function diff(nodes1, nodes2) {
  const items1 = nodes1.map(item => item.toJSON())
  const items2 = nodes2.map(item => item.toJSON())
  const changes = deepdiff(items1, items2)
  const gen = item => {
    if (item.kind === 'A') {
      const child = {
        kind: item.item.kind,
        path: [...item.path, item.index],
        lhs: item.item.lhs,
        rhs: item.item.rhs
      }
      return gen(child)
    }
    else {
      return [item.kind, makeKeyPath(item.path), item.rhs, item.lhs]
    }
  }
  const diffs = changes.map(item => {
    return gen(item)
  })
  return diffs
}
export default diff