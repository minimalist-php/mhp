const arrayEvery = require('php-bundler/lib/array_every.js')
const arrayMatch = require('php-bundler/lib/array_match.js')
const ignoreText = require('php-bundler/lib/ignore_text.js')
const matchMultilineText = require('../lib/match_multiline_text.js')

module.exports = ({ lines, filename }) => {
  let multilineString = {}

  return arrayEvery({
    array: lines,
    iteration: ({ index }) => {
      multilineString = matchMultilineText({ lines, index, filename, multilineString })
      if (multilineString.error) {
        return false
      }

      if (multilineString.line) {
        return true
      }

      const tabs = lines[index].replaceAll('\t', '') !== lines[index]
      const doubleSpacing = lines[index].trimStart().includes('  ')
      const lineEndsWithSpace = lines[index].endsWith(' ')

      const lineEndsWithComma = lines[index].endsWith(',')
      const spaceBeforeComma = lines[index].includes(' ,')
      const missingSpaceAfterComma = (() => {
        if (lines[index].length === lines[index].replaceAll(', ')) {
          return false
        }

        return lines[index].replaceAll(', ').includes(',')
      })()

      const InvalidSpaceBeforeOpeningBracket = (() => {
        let itIsBadlySpaced = false

        ignoreText({
          text: lines[index],
          transform: text => {
            itIsBadlySpaced = !text.startsWith('return ') && text.trimStart().replace(' : [', '').replace(' return [', '').includes(' [')
            return text
          }
        })

        return itIsBadlySpaced
      })()

      const spaceAfterOpeningBracket = lines[index].includes('[ ')
      const spaceBeforeClosingBracket = lines[index].trimStart().includes(' ]')

      const spaceBeforeOpeningParentheses = (() => {
        let itIsBadlySpaced = false

        ignoreText({
          text: lines[index],
          transform: text => {
            if (text.startsWith('return (')) {
              text = text.replace('return (', 'return(')
            }

            text = text.replace(' return (', ' return(')

            if (text.startsWith('function (')) {
              text = text.replace('function (', 'function(')
            }

            text = text.replace(' function (', ' function(')

            text = text.replace('< (', '<(')
            text = text.replace('> (', '>(')

            if (text.startsWith('if (')) {
              text = text.replace('if (', 'if(')
            }
            text = text.replace(' if (', ' if(')

            itIsBadlySpaced = text !== text.replace(' (', '(')
            return text
          }
        })

        return itIsBadlySpaced
      })()
      const spaceAfterOpeningParentheses = (() => {
        let itIsBadlySpaced = false

        ignoreText({
          text: lines[index],
          transform: text => {
            itIsBadlySpaced = (text !== text.replace('( ', '(')) || text.replaceAll('(; ', '').includes('(;')
            return text
          }
        })

        return itIsBadlySpaced
      })()

      const spaceBeforeClosingParentheses = (() => {
        let itIsBadlySpaced = false

        ignoreText({
          text: lines[index],
          transform: text => {
            itIsBadlySpaced = text !== text.replace(' )', ')')
            return text
          }
        })

        return itIsBadlySpaced
      })()

      const missingSpaceAfterClosingParentheses = (() => {
        let itIsBadlySpaced = false

        ignoreText({
          text: lines[index],
          transform: text => {
            itIsBadlySpaced = text.replaceAll('?', '').replaceAll(';', '').replaceAll(') ', '').replaceAll('))', '').slice(0, -1).includes(')')
            return text
          }
        })

        return itIsBadlySpaced
      })()

      const missingSpaceAfterReturn = (() => {
        let itIsBadlySpaced = false

        ignoreText({
          text: lines[index],
          transform: text => {
            itIsBadlySpaced = (text.replace(' return ', '').includes(' return(') || text.replace(' return ', '').includes(' return[')) && !text.endsWith(' return')
            if (text.startsWith('return')) {
              itIsBadlySpaced = text.replace('return ', '').includes('return(') || text.replace('return ', '').includes('return[')
            }
            return text
          }
        })

        return itIsBadlySpaced
      })()

      const error = arrayMatch({
        value: true,
        default: false,
        array: [
          {
            case: tabs,
            assign: 'Tab characters are not allowed'
          },
          {
            case: doubleSpacing,
            assign: 'Double spacing is not allowed'
          },
          {
            case: lineEndsWithSpace,
            assign: 'Lines must not end with spaces'
          },
          {
            case: lineEndsWithComma,
            assign: 'Lines must not end with comma'
          },
          {
            case: spaceBeforeComma,
            assign: 'Invalid space before comma'
          },
          {
            case: missingSpaceAfterComma,
            assign: 'Missing space after comma'
          },
          {
            case: InvalidSpaceBeforeOpeningBracket,
            assign: 'Invalid space before opening bracket'
          },
          {
            case: spaceAfterOpeningBracket,
            assign: 'Invalid space after opening bracket'
          },
          {
            case: spaceBeforeClosingBracket,
            assign: 'Invalid space before closing bracket'
          },
          {
            case: spaceBeforeOpeningParentheses,
            assign: 'Invalid space before opening parentheses'
          },
          {
            case: spaceAfterOpeningParentheses,
            assign: 'Invalid space after opening parentheses'
          },
          {
            case: spaceBeforeClosingParentheses,
            assign: 'Invalid space before closing parentheses'
          },
          {
            case: missingSpaceAfterClosingParentheses,
            assign: 'Space required after closing parentheses'
          },
          {
            case: missingSpaceAfterReturn,
            assign: 'Missing space after return'
          }
        ]
      })

      if (error) {
        console.log(`${filename} ${index + 1}`, `-  ${error}`)
        return false
      }

      return true
    }
  })
}
