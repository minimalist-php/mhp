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

    const lineBefore = lines[index - 1]
    const lineAfter = lines[index + 1]
    const isTheFirstLine = lineBefore === undefined
    const isTheLastLine = lines.length - 1 === index

    if (isTheFirstLine && lines[0] === '') {
      console.log(`${filename} ${index + 1}`, '- Invalid blank line')
      return false
    }

    if (isTheFirstLine || isTheLastLine) {
      return true
    }

    const linesReplacements = {
      '};  };': [
        '        };',
        '};  };  };'
      ]
    }

    const lineReplacement = Object.keys(linesReplacements).find(line => {
      return lines[index] === line && lineBefore === linesReplacements[line][0]
    })

    if (lineReplacement) {
      lines[index] = ''
      lines[index - 1] = linesReplacements[lineReplacement][1]
    }

    if (lines[index] === '        };' && ['    };', '    }'].find(line => line === lineAfter)) {
      console.log(`${filename} ${index + 1}`, '- Invalid blank line')
      return false
    }

    const validBeforeLineStart = [
      '}',
      ']',
      'STRING'
    ].find(lineStart => lineBefore.startsWith(lineStart))

    const blankLineBefore = lineBefore === '' || lineBefore.replaceAll('};', '').replaceAll(' ', '') === ''
    const twoBlankLinesBefore = (() => {
      if (lines[index - 2]) {
        const blankLineTwoLinesBefore = lines[index - 2] === '' || lines[index - 2].replaceAll('};', '').replaceAll(' ', '') === ''
        return blankLineBefore && blankLineTwoLinesBefore
      }
    })()

    if (lines[index].trimStart().startsWith('return ') && (twoBlankLinesBefore || !blankLineBefore) && !lineBefore.includes('function (') && !lineBefore.trimStart().startsWith('if ')) {
      console.log(`${filename} ${index + 1}`, '- There must be one blank line before the return statement')
      return false
    }

    if (lines[index] === '' && lineAfter.trimStart().startsWith('return ') && !lineBefore.includes('function (') && !lineBefore.trimStart().startsWith('if ')) {
      return true
    }

    if (lines[index] === '') {
      if (lineBefore.startsWith(' ') && lineBefore.trimStart() === '};') {
        console.log(`${filename} ${index + 1}`, '- Invalid blank line')
        return false
      }

      if (!lineAfter.includes(' function ') && !lineAfter.trimStart().startsWith('if ') && lineBefore.startsWith(' ') && ['}', ']'].find(lineStart => lineBefore.trimStart().startsWith(lineStart))) {
        console.log(`${filename} ${index + 1}`, '- Invalid blank line')
        return false
      }

      if (!validBeforeLineStart && lineAfter.endsWith('[')) {
        console.log(`${filename} ${index + 1}`, '- Invalid blank line')
        return false
      }

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
