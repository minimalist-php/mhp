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

    if (lines[index].endsWith(';')) {
      console.log(`${filename} ${index + 1}`, '- Lines should not end with a semicolon')
      return false
    }

    if (lines[index] !== '' && !lines[index].trimStart().startsWith('#') && ['{', '(', '[', ','].every(lineEnd => !lines[index].endsWith(lineEnd))) {
      const nextLineExists = index + 1 < lines.length

      if (!nextLineExists) {
        lines[lines.length] = ''
      }

      const nextLine = lines[index + 1]
      if ([']', ')'].every(lineStart => !nextLine.trimStart().startsWith(lineStart))) {
        lines[index] = `${lines[index]};`
      }
    }

    return true
  })
}
