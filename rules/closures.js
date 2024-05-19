const matchMultilineText = require('../lib/match_multiline_text.js')

module.exports = ({ lines, filename }) => {
  const error = lines.some((line, index) => {
    if (lines[index].endsWith('{')) {
      console.log(`${filename} ${index + 1}`, '- Lines should not end with an opening curly bracket')
      return true
    }

    if ((!lines[index].endsWith('function () {') && lines[index].includes('function ()')) || lines[index].includes('function ( )')) {
      console.log(`${filename} ${index + 1}`, '- Functions without parameters must not have parentheses.')
      return true
    }

    if (lines[index].endsWith(' use') || lines[index].endsWith(' use ()') || lines[index].endsWith(' use ( )')) {
      console.log(`${filename} ${index + 1}`, '- The keyword "use" in functions must not be used without arguments.')
      return true
    }

    if (lines[index].includes('if(')) {
      console.log(`${filename} ${index + 1}`, '- There must be one space between if and (')
      return false
    }

    if (lines[index].includes('function(')) {
      console.log(`${filename} ${index + 1}`, '- There must be one space between function and (')
      return false
    }

    if (lines[index].includes('use(')) {
      console.log(`${filename} ${index + 1}`, '- There must be one space between use and (')
      return false
    }

    return false
  })

  if (error) {
    return false
  }

  const indentation = [
    '            ',
    '        ',
    '    ',
    ''
  ]

  let closure = false
  let closures = []
  const parsedLines = []

  let multilineString = {}
  const closuresParsed = indentation.every(indentationLevel => {
    return lines.every((line, index) => {
      if (lines[index].trimStart().startsWith('#') || parsedLines.includes(index)) {
        return true
      }
      multilineString = matchMultilineText({ lines, index, filename, multilineString })
      if (multilineString.error) {
        return false
      }

      if (!lines[index].endsWith('<<<STRING') && multilineString.line) {
        return true
      }

      const currentIndentationLevel = lines[index].startsWith(indentationLevel) && !lines[index].startsWith(`${indentationLevel} `)
      let upperIndentationLevel = false

      if (indentationLevel !== '') {
        upperIndentationLevel = lines[index].startsWith(' ') && !lines[index].startsWith(indentationLevel)
      }

      if (!closure && currentIndentationLevel && (lines[index].trimStart() === 'function' || lines[index].includes('function use') || lines[index].includes('function (') || lines[index].trimStart().startsWith('if '))) {
        closures.push({
          indentation: indentationLevel,
          lines: [index]
        })
        parsedLines.push(index)
        closure = true
        return true
      }

      const lastLine = lines.length - 1 === index

      if (!lastLine && lines[index] === '') {
        const nextLine = lines[index + 1]
        if (nextLine === '') {
          return true
        }

        const nextLineIsCurrentIndentationLevel = nextLine.startsWith(indentationLevel) && !nextLine.startsWith(`${indentationLevel} `)
        let nextLineIsUpperIndentationLevel = false
        if (indentationLevel !== '') {
          nextLineIsUpperIndentationLevel = nextLine.startsWith(' ') && !nextLine.startsWith(indentationLevel)
        }

        if ((!nextLineIsUpperIndentationLevel && !nextLineIsCurrentIndentationLevel) && closure) {
          closures[closures.length - 1].lines.push(index)
          parsedLines.push(index)
          return true
        }
      }

      if ((!upperIndentationLevel && !currentIndentationLevel) && closure) {
        closures[closures.length - 1].lines.push(index)
        parsedLines.push(index)
        return true
      }

      if ((upperIndentationLevel || currentIndentationLevel) && closure) {
        const firstLine = lines[index - 1] === undefined
        if (!firstLine && !lastLine && lines[index - 1] !== '') {
          console.log(`${filename} ${index + 1}`, '- Missing one blank line')
          return false
        }

        if (lines[index].includes('function (') || lines[index].trimStart().startsWith('if ')) {
          closures.push({
            indentation: indentationLevel,
            lines: [index]
          })
          parsedLines.push(index)
          closure = true
          return true
        }

        if (lastLine) {
          closures[closures.length - 1].lines.push(index)
          parsedLines.push(index)
        }

        if (!closures[closures.length - 1].lines.includes(index - 1)) {
          closures[closures.length - 1].lines.push(index - 1)
        }

        closure = false
        return true
      }

      return true
    })
  })

  if (!closuresParsed) {
    return false
  }

  closures.push({
    lines: []
  })
  lines.every((line, index) => {
    const lastLine = index === lines.length - 1
    if (lastLine && parsedLines.includes(index)) {
      if (closures[closures.length - 1].lines.length === 0) {
        closures = closures.slice(0, -1)
        return true
      }
    }

    if (lines[index].trimStart().startsWith('#') || parsedLines.includes(index)) {
      return true
    }

    multilineString = matchMultilineText({ lines, index, filename, multilineString })
    if (multilineString.error) {
      return false
    }

    if (!lines[index].endsWith('<<<STRING') && multilineString.line) {
      return true
    }

    if (!parsedLines.includes(index)) {
      parsedLines.push(index)
      closures[closures.length - 1].lines.push(index)
    }

    return true
  })

  return closures.every(closure => {
    const firstLine = closure.lines.slice(0, 1).pop()
    const lastLine = closure.lines.slice(-1).pop()

    if (lines[firstLine] === 'function' || lines[firstLine].endsWith(' function')) {
      lines[firstLine] = `${lines[firstLine].slice(0, -8)}function ()`
    }

    if (lines[firstLine].includes('function use')) {
      lines[firstLine] = lines[firstLine].replace('function use', 'function () use')
    }

    if (lines[firstLine].includes('function (') || lines[firstLine].trimStart().startsWith('if ')) {
      lines[firstLine] = `${lines[firstLine]} {`
      if (lines[lastLine] === '') {
        lines[lastLine] = `${closure.indentation}}`
        return true
      }

      lines[lastLine] = lines[lastLine].replace('    }', '};  }')
    }

    return true
  })
}
