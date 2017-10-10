export default function(str, keys, values, before = '{{', after = '}}') {
  if (typeof str !== 'string') {
    return ''
  }
  if (str.indexOf(before) > -1 && str.indexOf(after)) {
    let begin = before.replace(/\{/g, '\\{').replace(/\[/g, '\\[')
    let end = after.replace(/\}/g, '\\}').replace(/\]/g, '\\]')
    let reg = new RegExp(begin + '(.*?)' + end, 'g')
    str = str.replace(reg, (match, expression) => {
        return Function(...keys, 'return ' + expression)(...values)
    })
  }
  return str
}