export default function(str, keys, values, before = '{{', after = '}}') {
  if (typeof str !== 'string') {
    return str
  }
  if (typeof keys === 'string' && typeof values === 'string') {
    keys = [keys]
    values = [values]
  }
  else if (!Array.isArray(keys) || !Array.isArray(values)) {
    return str
  }
  if (str.indexOf(before) > -1 && str.indexOf(after)) {
    let begin = before.replace(/\{/g, '\\{').replace(/\[/g, '\\[')
    let end = after.replace(/\}/g, '\\}').replace(/\]/g, '\\]')
    let reg = new RegExp(begin + '(.*?)' + end, 'g')
    let matches = str.match(reg)

    // if there is no mustache, return the original string
    if (!matches) {
      return str
    }

    // create a function
    let convert = content => {
      let res = content
      let expression = content.replace(before, '').replace(after, '').trim()
      
      // if only a word, just to find out the value
      if (/^[a-zA-Z_][a-zA-Z0-9_\.]*?[a-zA-Z0-9_]$/.test(expression)) {
        let index = keys.indexOf(expression)
        let value = index > -1 ? values[index] : content
        return value
      }

      // if contains: +-*/% ?: == > < && || ! ()
      if (
        /^[a-zA-Z0-9\(_]/.test(expression) 
        && /^[a-zA-Z0-9_\+\-\*\/%\?:=><&\|\!\(\)\s\.]+$/.test(expression)
        && /[a-zA-Z0-9_\+\-\)]$/.test(expression)
      ) {
        try {
          res = Function(...keys, 'return ' + expression)(...values)
        }
        catch(e) {
          // console.error(e)
        }
      }
      else {
        console.error(`[hst-virtual-dom]: interpolation expression not suitable, original string ${expression} '${content}' will be output.`)
      }

      // other sutiations
      return res
    }

    // if there is only one matched, it can be return any type of data, i.e. object, function ...
    if (matches.length === 1 && str.trim() === matches[0]) {
      return convert(str) 
    }
   
    // if there is more than one matched, it should return a string
    return str.replace(reg, convert)
  }

  return str

}