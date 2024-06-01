const matchMultilineText = require('../lib/match_multiline_text.js')
const ignoreText = require('../lib/ignore_text.js')
const arrayCompose = require('../lib/array_compose.js')
const arrayForEach = require('../lib/array_for_each.js')

module.exports = ({ lines, filename }) => {
  let multilineString = {}
  return lines.every((line, index) => {
    if (lines[index].trimStart().startsWith('#') || lines[index] === '') {
      return true
    }

    multilineString = matchMultilineText({ lines, index, filename, multilineString })
    if (multilineString.error) {
      return false
    }

    if (multilineString.line) {
      return true
    }

    if (lines[index].trimStart().startsWith('return ')) {
      console.log(`${filename} ${index + 1}`, '- Use <- insted of retrun keyword')
      return false
    }

    lines[index] = lines[index].replace('<-', 'return')

    if (lines[index].includes('function(') || lines[index].includes('function (')) {
      console.log(`${filename} ${index + 1}`, '- Use -> at the end of the line insted of function keyword')
      return false
    }

    if (lines[index] !== '->' && lines[index].endsWith('->') && !lines[index].endsWith(' ->')) {
      console.log(`${filename} ${index + 1}`, '- There must be a space before the ->')
      return false
    }

    if (lines[index] === '->') {
      lines[index] = 'function'
      return true
    }

    if (lines[index].endsWith(' ->')) {
      let onlyOneParameter = true
      let invalidParentheses = false

      lines[index] = arrayCompose([
        {
          text: lines[index],
          transform: line => {
            if (!line.includes(' use(') && !line.startsWith('use(')) {
              line = line.replace(' ->', ')')
            }

            line = line.replace(' ->', '')
            if (line.includes(' : use(')) {
              line = line.replace(' : use(', ' : function () use(')
            }
            if (!line.includes(' function ') && !line.includes(' : use(')) {
              line = line.replace(' use(', ') use(')
            }
            if (!line.includes(' function ')) {
              line = line.replace(' : ', ' : function (')
            }
            if (line.endsWith(' :)')) {
              line = line.replace(' :)', ' : function ()')
            }

            if (!line.includes(' : ') && !line.startsWith('return ')) {
              if (!line.startsWith('use(') && !line.includes(' : ')) {
                line = `function (${line}`
              }
              if (line.startsWith('use(') && !line.includes(' : ')) {
                line = `function () ${line}`
              }
            }

            const [functionParameter] = line.split(' use(')

            if (!functionParameter.includes('use(') && functionParameter.includes(',')) {
              onlyOneParameter = false
            }

            if (!functionParameter.includes('use(') && (functionParameter.includes('((') || functionParameter.includes('))'))) {
              console.log(line)
              invalidParentheses = true
            }

            return line
          }
        },
        ignoreText
      ])
      lines[index] = lines[index].replace('return ', 'return function (')

      if (!onlyOneParameter) {
        console.log(`${filename} ${index + 1}`, '- Only one parameter per function')
        return false
      }

      if (invalidParentheses) {
        console.log(`${filename} ${index + 1}`, '- Invalid parentheses')
        return false
      }
    }

    const clutter = {
      ' == ': '=',
      ' === ': '=',
      ' !== ': '!=',
      ' && ': ' and ',
      '||': ' or '
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
      ' or ': ' || ',
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

          if (line.replaceAll('<STRING>', '').replaceAll('>=', '').replaceAll('->').includes('>') && !line.includes(' > ')) {
            operatorBadSpacing = '>'
          }

          if (line.replaceAll('<=', '').replaceAll('>=', '').replaceAll('=>').includes('=') && !line.includes(' = ')) {
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

          if (line.replace('->', '').replace('->', '').includes('-') && !line.replace(': -', ': - ').includes(' - ')) {
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
