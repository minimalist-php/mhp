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

    const clutter = {
      ' == ': '=',
      ' === ': '=',
      ' !== ': '!=',
      ' && ': ' and '
    }

    const badOperator = Object.keys(clutter).find(operator => lines[index].includes(operator))

    if (badOperator) {
      console.log(`${filename} ${index + 1}`, `- Use ${clutter[badOperator]} insted of ${badOperator}`)
      return false
    }

    const operatorsReplacements = {
      // Logical
      ' not ': ' ! ',
      '(not ': '(! ',
      ' and ': ' && ',
      // Comparison
      ' = ': ' === ',
      ' != ': ' !== '
    }

    let operatorBadSpacing = false

    arrayCompose([
      {
        text: lines[index],
        transform: line => {
          if (line.replaceAll('<STRING>', '').replaceAll('<=', '').includes('<') && !line.includes(' < ')) {
            operatorBadSpacing = '<'
          }

          if (line.replaceAll('<STRING>', '').replaceAll('>=', '').includes('>') && !line.includes(' > ')) {
            operatorBadSpacing = '<'
          }

          if (line.replaceAll('<=', '').replaceAll('>=', '').includes('=') && !line.includes(' = ')) {
            operatorBadSpacing = '='
          }

          if (line.includes('<=') && !line.includes(' <= ')) {
            operatorBadSpacing = '<='
          }

          if (line.includes('>=') && !line.includes(' >= ')) {
            operatorBadSpacing = '>='
          }

          if (line.includes('!=') && !line.includes(' != ')) {
            operatorBadSpacing = '!='
          }

          if (line.includes('+') && !line.includes(' + ')) {
            operatorBadSpacing = '+'
          }

          if (line.includes('-') && !line.replace(': -', ': - ').includes(' - ')) {
            operatorBadSpacing = '-'
          }

          if (line.includes('*') && !line.includes(' * ')) {
            operatorBadSpacing = '*'
          }

          if (line.includes('/') && !line.includes(' / ')) {
            operatorBadSpacing = '/'
          }

          return line
        }
      },
      ignoreText
    ])

    if (operatorBadSpacing) {
      console.log(`${filename} ${index + 1}`, `- There must be a space before and after the ${operatorBadSpacing}`)
      return false
    }

    arrayCompose([
      {
        text: lines[index],
        transform: line => {
          if (line.includes(': - ')) {
            operatorBadSpacing = '-'
          }

          return line
        }
      },
      ignoreText
    ])

    if (operatorBadSpacing) {
      console.log(`${filename} ${index + 1}`, `- Invalid space after the ${operatorBadSpacing}`)
      return false
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
