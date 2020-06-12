interface Node {
  type: string|undefined // undefined -> text
  attrs?: object
  children?: Array<Node>
  parent: Node|null
  selfcolose?: boolean
  text?: string
}