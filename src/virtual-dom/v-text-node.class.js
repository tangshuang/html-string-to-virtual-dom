export class VTextNode {
  /**
   * _context: object
   * text: string
   */

  toJSON() {
    const { text } = this
    return { text }
  }
}
export default VTextNode