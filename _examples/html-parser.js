import parse from '../src/html-object/parse'

const html = `
  <div>
    <img src="xxx">
  </div>
`

const vdom = parse(html)
console.log(vdom[0].query('img'))