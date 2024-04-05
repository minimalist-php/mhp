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

    if (lines[index] !== '' && !lines[index].trimStart().startsWith('#')) {
      if (!lines[index].includes('function (') && !lines[index].includes('if (')) {
        if (['{', '(', '[', ','].every(lineEnd => !lines[index].endsWith(lineEnd))) {
          const nextLineExists = index + 1 < lines.length
          const nextLine = lines[index + 1]
          if (nextLineExists && [']', ')'].every(lineStart => !nextLine.trimStart().startsWith(lineStart))) {
            lines[index] = `${lines[index]};`
          }
        }
      }
    }

    return true
  })
}
