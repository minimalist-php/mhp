const matchMultilineText = require('../lib/match_multiline_text.js')

module.exports = ({ lines, filename }) => {
  let multilineString = {}
  return lines.every((line, index) => {
    multilineString = matchMultilineText({ lines, index, filename, multilineString })
    if (multilineString.error) {
      return false
    }

    if (multilineString.line) {
      return true
    }

    if (lines[index] === '') {
      const lineBefore = lines[index - 1]
      const lineAfter = lines[index + 1]
      const firstLine = lineBefore === undefined
      const lastLine = lines.length - 1 === index

      if (firstLine || lastLine) {
        return true
      }

      if (lineBefore.endsWith('[') && lineAfter.endsWith('[')) {
        console.log(`${filename} ${index + 1}`, '- Invalid blank line')
        return false
      }

      if (!lineAfter.includes(' function ') && lineBefore.startsWith(' ') && ['}', ']'].find(lineStart => lineBefore.trimStart().startsWith(lineStart))) {
        console.log(`${filename} ${index + 1}`, '- Invalid blank line')
        return false
      }

      const validBeforeLineStart = [
        '}',
        ']'
      ].find(lineStart => lineBefore.startsWith(lineStart))

      if (!validBeforeLineStart) {
        const validAfterLineEnd = [
          '[',
          '{',
          '<<<STRING'
        ].find(lineEnd => lineAfter.endsWith(lineEnd))

        if (!(lineBefore.endsWith('{') && lineAfter.endsWith('[')) && validAfterLineEnd) {
          return true
        }

        console.log(`${filename} ${index + 1}`, '- Invalid blank line')
        return false
      }
    }

    return true
  })
}
