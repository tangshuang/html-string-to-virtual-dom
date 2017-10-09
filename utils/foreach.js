export default function foreach(obj, callback) {
  if (typeof obj !== 'object') {
    return
  }
  let keys = Object.keys(obj)
  for (let key of keys) {
    let value = obj[key]
    let state = callback(key, value, obj)
    if (state === false) {
      break
    }
  }
}