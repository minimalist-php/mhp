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
      const endsWithSpace = lines[index].endsWith(' ')
      const spaceBeforeOpeningParentheses = (() => {
        let itIsBadlySpaced = false

        ignoreText({
          text: lines[index],
          transform: text => {
            if (text.startsWith('function (')) {
              text = text.replace('function (', 'function(')
            }
            text = text.replace(' function (', ' function(')
            text = text.replace(' use (', ' use(')

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
            itIsBadlySpaced = text !== text.replace('( ', '(')
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

      const withoutSpaceAfterClosingParentheses = (() => {
        let itIsBadlySpaced = false

        ignoreText({
          text: lines[index],
          transform: text => {
            itIsBadlySpaced = text.replaceAll(') ', '').replaceAll('))', '').slice(0, -1).includes(')')
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
            case: endsWithSpace,
            assign: 'Lines must not end with spaces'
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
            case: withoutSpaceAfterClosingParentheses,
            assign: 'Space required afte closing parentheses'
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
