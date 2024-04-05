const matchMultilineText = require('../lib/match_multiline_text.js')

const matchClosures = ({ indentationLevel, lines, index, filename }) => {
  const currentIndentationLevel = lines[index].startsWith(indentationLevel) && !lines[index].startsWith(`${indentationLevel} `)

  if (currentIndentationLevel && lines[index].endsWith('{')) {
    console.log(`${filename} ${index + 1}`, '- Lines should not end with an opening curly bracket')
    return { error: true }
  }

  if ((!lines[index].endsWith('function () {') && lines[index].includes('function ()')) || lines[index].includes('function ( )')) {
    console.log(`${filename} ${index + 1}`, '- Functions without parameters must not have parentheses.')
    return { error: true }
  }

  if (lines[index].endsWith(' use') || lines[index].endsWith(' use ()') || lines[index].endsWith(' use ( )')) {
    console.log(`${filename} ${index + 1}`, '- The keyword "use" in functions must not be used without arguments.')
    return { error: true }
  }

  if (currentIndentationLevel && lines[index].includes('function use')) {
    lines[index] = lines[index].replace('function use', 'function () use')
  }

  if (currentIndentationLevel && lines[index].endsWith(' function')) {
    lines[index] = `${lines[index].slice(0, -8)}function ()`
  }

  if (lines[index].includes('function (') || lines[index].includes('if (')) {
    if (lines[index].startsWith(indentationLevel) && lines[index].endsWith(')')) {
      return { index, line: lines[index] }
    }
  }
}

module.exports = ({ lines, filename }) => {
  const indentation = [
    '            ',
    '        ',
    '    ',
    ''
  ]

  return indentation.every(indentationLevel => {
    let multilineString = {}
    let closureDeclaration = {}
    return lines.every((line, index) => {
      multilineString = matchMultilineText({ lines, index, filename, multilineString })
      if (multilineString.error) {
        return false
      }

      if (multilineString.line) {
        return true
      }

      if (lines[index].includes('function(')) {
        console.log(`${filename} ${index + 1}`, '- There must be one space between function and (')
        return false
      }

      if (lines[index].includes('if(')) {
        console.log(`${filename} ${index + 1}`, '- There must be one space between if and (')
        return false
      }

      if (!closureDeclaration.line) {
        const matchedClosureDeclaration = matchClosures({ indentationLevel, lines, index, filename })

        if (!matchedClosureDeclaration) {
          return true
        }

        if (matchedClosureDeclaration.error) {
          return false
        }

        const linesBefore = [
          lines[index - 1],
          lines[index - 2]
        ]

        const firstLine = linesBefore[0] === undefined
        if (!firstLine) {
          if ((!linesBefore[0].trimStart().startsWith('}') && linesBefore[0] !== '') || linesBefore[1] === '') {
            console.log(`${filename} ${index + 1}`, '- There must be one blank line before each closure')
            return false
          }
        }

        closureDeclaration = matchedClosureDeclaration

        return true
      }

      if (lines[index] === '') {
        const lastLine = lines.length - 1 === index
        const topLevelClosure = indentationLevel === ''

        if (topLevelClosure) {
          if (lastLine) {
            lines[closureDeclaration.index] = `${closureDeclaration.line} {`
            lines[index] = '}'
            lines[index + 1] = ''
          }

          return true
        }

        const remainingExpressionsInTheScope = !lastLine && lines[index + 1].startsWith(`${indentationLevel} `)
        if (remainingExpressionsInTheScope) {
          return true
        }

        lines[closureDeclaration.index] = `${closureDeclaration.line} {`
        lines[index] = `${indentationLevel}}`
        closureDeclaration = {}

        return true
      }

      const topLevelDeclaration = !lines[index].startsWith(' ')
      if (topLevelDeclaration) {
        const linesBefore = [
          lines[index - 1],
          lines[index - 2],
          lines[index - 3]
        ]

        const twoBlankLines = linesBefore[0] === '' && linesBefore[1] === '' && linesBefore[2] !== ''

        if (!twoBlankLines) {
          console.log(`${filename} ${index + 1}`, '- There must be two blank lines after each top level closure')
          return false
        }

        lines[closureDeclaration.index] = `${closureDeclaration.line} {`
        lines[index - 2] = '}'
        closureDeclaration = {}

        const matchedClosureDeclaration = matchClosures({ indentationLevel, lines, index, filename })

        if (!matchedClosureDeclaration) {
          return true
        }

        if (matchedClosureDeclaration.error) {
          return false
        }

        closureDeclaration = matchedClosureDeclaration
      }

      return true
    })
  })
}
