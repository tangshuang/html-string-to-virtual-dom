export default function({ attrs, children }) {
  let elsetag = children.find(item => item.name === 'else')
  let ifchildren = children
  let elsechildren = []

  if (elsetag) {
    let elseindex = children.indexOf(elsetag)
    if (elseindex > -1) {
      ifchildren = children.slice(0, elseindex)
      elsechildren = children.slice(elseindex + 1)
    }
  }

  if (Function('return ' + attrs.condition)()) {
    return ifchildren
  }
  else {
    return elsechildren
  }
}