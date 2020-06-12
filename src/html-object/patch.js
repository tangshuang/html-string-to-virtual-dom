import produce from 'immer'
import { assign, remove } from 'ts-fns'

export function patch(object, changes) {
  const next = produce(object, (draft) => {
    changes.forEach((change) => {
      const [type, path, next] = change
      if (type === 'D') {
        remove(draft, path)
      }
      else {
        assign(draft, path, next)
      }
    })
  })
  return next
}
export default patch