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

    if (lines[index].trimStart().startsWith('if ') || lines[index].includes(' if ') || lines[index].includes('if(') || lines[index].includes('if (')) {
      console.log(`${filename} ${index + 1}`, '- Use a question mark at the end of the line for conditional code')
      return false
    }

    if (lines[index].endsWith('?') && !lines[index].endsWith(' ?')) {
      console.log(`${filename} ${index + 1}`, '- Missing space before question mark')
      return false
    }

    if (lines[index].endsWith(' ?')) {
      lines[index] = `${' '.repeat(lines[index].length - lines[index].trimStart().length)}if (${lines[index].trimStart().slice(0, -2)})`
    }

    return true
  })
}
