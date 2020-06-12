import foreach from './foreach'

export default function merge(obj1, obj2) {
  let obj = {}
  foreach(obj1, (key, value) => {
    obj[key] = value
  })
  foreach(obj2, (key, value) => {
    obj[key] = value
  })
  return obj
}