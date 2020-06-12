export class VNodeList extends Array {
  toJSON() {
    return this.map(item => item.toJSON())
  }
}
export default VNodeList