const matchMultilineText = require('../lib/match_multiline_text.js')
const ignoreText = require('../lib/ignore_text.js')
const arrayCompose = require('../lib/array_compose.js')
const arrayForEach = require('../lib/array_for_each.js')

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

    const operatorsReplacements = {
      // Logical
      ' not ': ' ! ',
      '(not ': '(! ',
      // Comparison
      'is_equal_to ': '=== ',
      'is_not_equal_to ': '!== ',
      'is_less_than ': '< ',
      'is_greater_than ': '> ',
      'is_less_than_or_equal_to ': '<= ',
      'is_greater_than_or_equal_to ': '>= '
    }

    arrayCompose([
      {
        array: Object.keys(operatorsReplacements),
        iteration: operator => {
          lines[index] = arrayCompose([
            {
              text: lines[index],
              transform: line => line.replaceAll(operator, operatorsReplacements[operator])
            },
            ignoreText
          ])
        }
      },
      arrayForEach
    ])

    return true
  })
}
