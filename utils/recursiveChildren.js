export default function recursiveChildren(obj, callback) {
  let children = obj.children

  if (Array.isArray(children) && children.length) {
    children.forEach((item, i) => {
      callback(i, item, obj)
    })
  }
}