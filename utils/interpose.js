export default function(str, keys, values) {
  if (typeof str !== 'string') {
    return ''
  }
  if (str.indexOf('{{') > -1 && str.indexOf('}}')) {
    let reg = new RegExp('\{\{(.*?)\}\}', 'g')
    str = str.replace(reg, (match, expression) => {
        return Function(...keys, 'return ' + expression)(...values)
    })
  }
  return str
}