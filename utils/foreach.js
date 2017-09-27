export default function foreach(obj, callback) {
  let keys = Object.keys(obj)
  keys.forEach(key => {
    let value = obj[key]
    callback(key, value)
  })
}