export class VNode {
  /**
   * _context: object
   * _events: object
   *
   * type: string
   * props: object
   * children: VNodeList
   */

  emitStart(event) {}
  emitStop(event) {}

  toJSON() {
    const { type, props, children } = this
    return {
      type,
      props,
      children: children.toJSON(),
    }
  }
}
export default VNode