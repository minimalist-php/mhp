const matchMultilineText = require('../lib/match_multiline_text.js')

module.exports = ({ lines, filename }) => {
  let multilineString = {}
  return lines.every((line, index) => {
    multilineString = matchMultilineText({ lines, index, filename, multilineString })
    if (multilineString.error) {
      return false
    }

    if (!lines[index].endsWith('<<<STRING') && multilineString.line) {
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

    const blankLineBefore = lineBefore === '' || lineBefore.replaceAll('};', '').replaceAll(' ', '') === ''
    const twoBlankLinesBefore = (() => {
      if (lines[index - 2] !== undefined) {
        const blankLineTwoLinesBefore = lines[index - 2] === '' || lines[index - 2].replaceAll('};', '').replaceAll(' ', '') === ''
        return blankLineBefore && blankLineTwoLinesBefore
      }

      return false
    })()

    if (!lines[index].startsWith(' ') && lines[index].endsWith('<<<STRING') && lineBefore !== '') {
      console.log(`${filename} ${index + 1}`, '- Missing one blank line')
      return false
    }

    if (!lines[index].startsWith(' ') && lines[index].endsWith('<<<STRING') && twoBlankLinesBefore) {
      console.log(`${filename} ${index + 1}`, '- Invalid blank line')
      return false
    }

    if (lines[index].endsWith('<<<STRING')) {
      return true
    }

    if (lines[index] === 'STRING;' && (lines[index + 2] !== undefined && !lines[index + 2].startsWith(' ')) && lines[index] === '' && lineAfter !== '') {
      console.log(`${filename} ${index + 1}`, '- Missing one blank line')
      return false
    }

    if (lines[index] === 'STRING;' && lineAfter === '' && (lines[index + 2] !== undefined && lines[index + 2].startsWith(' '))) {
      console.log(`${filename} ${index + 1}`, '- Invalid blank line')
      return false
    }

    if (lines[index].includes('function (') && lineBefore !== '') {
      console.log(`${filename} ${index + 1}`, '- Missing one blank line')
      return false
    }

    if (!lines[index].startsWith(' ') && lines[index].endsWith('[') && lineBefore !== '') {
      console.log(`${filename} ${index + 1}`, '- Missing one blank line')
      return false
    }

    if (lines[index].trimStart().startsWith(']') && lineAfter !== '') {
      console.log(`${filename} ${index + 1}`, '- Missing one blank line')
      return false
    }

    if (lines[index].trimStart().startsWith('return ') && (twoBlankLinesBefore || !blankLineBefore) && !lineBefore.includes('function (') && !lineBefore.trimStart().startsWith('if ')) {
      console.log(`${filename} ${index + 1}`, '- Missing one blank line')
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

      const validBeforeLineStart = [
        '}',
        ']',
        'STRING'
      ].find(lineStart => lineBefore.startsWith(lineStart))

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
