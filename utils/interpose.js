export default function(str, key, value) {
  if (typeof str !== 'string') {
    return str
  }
  if (str.indexOf('{{') > -1 && str.indexOf('}}')) {
    let reg = new RegExp('\{\{' + key + '\}\}', 'g')
    str = str.replace(reg, value)
  }
  return str
}