const matchMultilineText = require('../lib/match_multiline_text.js')
const ignoreText = require('../lib/ignore_text.js')
const arrayCompose = require('../lib/array_compose.js')
const arrayForEach = require('../lib/array_for_each.js')
const lookFor = require('../lib/list_look_for.js')

module.exports = ({ lines, filename }) => {
  let multilineString = {}

  const error = lookFor({
    list: lines,
    iteration: ({ entry }) => {
      if (lines[entry].trimStart().startsWith('#') || lines[entry] === '') {
        return
      }

      multilineString = matchMultilineText({ lines, index: entry, filename, multilineString })

      if (multilineString.line) {
        return
      }

      if (lines[entry].trimStart().startsWith('return ')) {
        return `${filename} ${entry + 1} - No se puede usar la palabra "return" para iniciar una línea`
      }

      if (lines[entry].trimStart().startsWith('<-')) {
        if (!lines[entry].trimStart().startsWith('<- ')) {
          return `${filename} ${entry + 1} - Falta un espacio después del operador <-`
        }
        lines[entry] = lines[entry].replace('<- ', 'return ')
      }

      if (lines[entry].includes('function(') || lines[entry].includes('function (')) {
        return `${filename} ${entry + 1} - No se puede usar la palabra "function" en ese lugar`
      }

      if (lines[entry] !== '->' && lines[entry].endsWith('->') && !lines[entry].endsWith(' ->')) {
        return `${filename} ${entry + 1} - Falta un espacio antes del operador ->`
      }

      if (lines[entry] === '->') {
        lines[entry] = 'function'
        return
      }

      if (lines[entry].endsWith(' ->')) {
        let onlyOneParameter = true
        let invalidParentheses = false

        lines[entry] = arrayCompose([
          {
            text: lines[entry],
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
                invalidParentheses = true
              }

              return line
            }
          },
          ignoreText
        ])
        lines[entry] = lines[entry].replace('return ', 'return function (')

        if (!onlyOneParameter) {
          return `${filename} ${entry + 1} - Solo un parámetro por función`
        }

        if (invalidParentheses) {
          return `${filename} ${entry + 1} - Paréntesis inválidos`
        }
      }

      const clutter = {
        ' == ': '=',
        ' === ': '=',
        ' !== ': '!=',
        ' && ': ' and ',
        '||': ' or '
      }

      const badOperator = Object.keys(clutter).find(operator => lines[entry].includes(operator))

      if (badOperator) {
        return `${filename} ${entry + 1} - Use ${clutter[badOperator]} insted of ${badOperator}`
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
          text: lines[entry],
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
        return `${filename} ${entry + 1} - There must be a space before and after the ${operatorBadSpacing}`
      }

      arrayCompose([
        {
          text: lines[entry],
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
        return `${filename} ${entry + 1} - Invalid space after the ${operatorBadSpacing}`
      }

      arrayCompose([
        {
          array: Object.keys(operatorsReplacements),
          iteration: operator => {
            lines[entry] = arrayCompose([
              {
                text: lines[entry],
                transform: line => line.replaceAll(operator, operatorsReplacements[operator])
              },
              ignoreText
            ])
          }
        },
        arrayForEach
      ])
    }
  })

  if (!error) {
    return true
  }
  console.log(error)
}
