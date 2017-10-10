export default function foreach(obj, callback) {
  if (typeof obj !== 'object') {
    return
  }

  if (Array.isArray(obj)) {
    for (let i = 0, len = obj.length; i < len; i ++) {
      let value = obj[i]
      let state = callback(i, value, obj)
      if (state === false) {
        break
      }
    }
  }
  else {
    let keys = Object.keys(obj)
    for (let i = 0, len = keys.length; i < len; i ++) {
      let key = keys[i]
      let value = obj[key]
      let state = callback(key, value, obj)
      if (state === false) {
        break
      }
    }
  }
}