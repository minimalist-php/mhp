module.exports = ({ lines, filename }) => {
  const indentation = [
    '            ',
    '        ',
    '    ',
    ''
  ]

  return indentation.every(indentationLevel => {
    let arrayDeclaration = {}
    return lines.every((line, index) => {
      const currentIndentationLevel = lines[index].startsWith(indentationLevel) && !lines[index].startsWith(`${indentationLevel} `)

      if (arrayDeclaration.line && lines[index] === '') {
        return true
      }

      if (arrayDeclaration.line) {
        if (lines[index].includes(' : function ')) {
          lines[index] = lines[index].replace(' : function ', ' => function ')
          const item = lines[index].split(' => ')[0].trimStart()
          lines[index] = lines[index].replace(item, `\`${item}\``)
        }
      }

      if (!arrayDeclaration.line && currentIndentationLevel && (lines[index].endsWith('[') || lines[index].endsWith('('))) {
        const linesBefore = [
          lines[index - 1],
          lines[index - 2]
        ]

        if (linesBefore[0] !== undefined) {
          if (!lines[index].startsWith(' ')) {
            if (linesBefore[0] !== '' || linesBefore[1] === '') {
              console.log(`${filename} ${index + 1}`, '- There must be one blank line before each top level array')
              return false
            }
          }
        }
        arrayDeclaration = { line: lines[index], index }
        return true
      }

      if (currentIndentationLevel && arrayDeclaration.line) {
        const linesAfter = [
          lines[index + 1],
          lines[index + 2]
        ]

        if (!lines[index].startsWith(' ') && (linesAfter[0] !== '' || linesAfter[1] === '')) {
          console.log(lines[index], `${filename} ${index + 1}`, '- There must be one blank line after each top level array')
          return false
        }

        arrayDeclaration = {}
        return true
      }

      const arrayItemsScope = lines[index].startsWith(`${indentationLevel}    `) && !lines[index].startsWith(`${indentationLevel}     `)

      if (arrayItemsScope && arrayDeclaration.line) {
        if (['{', '('].every(lineEnd => !lines[index].endsWith(lineEnd))) {
          if (!lines[index].trimStart().startsWith('`')) {
            let item = lines[index].trimStart()
            if (!item.startsWith(']')) {
              if (lines[index].trimStart().startsWith('"') || lines[index].trimStart().startsWith("'")) {
                console.log(`${filename} ${index + 1}`, '- Strings must be assigned using backticks (`).')
                return false
              }
              if (item.includes(':')) {
                if (!item.includes(' : ')) {
                  console.log(`${filename} ${index + 1}`, '- There must be a space before and after the colon.')
                  return false
                }
                item = item.split(' : ')[0]
                if (!lines[index].trimStart().startsWith('}')) {
                  lines[index] = lines[index].replace(` ${item} `, ` \`${item}\` `)
                }
              }

              const startsWithANumber = item.trimStart().match(/^\d/)
              if (!lines[index].includes(' : ') && !lines[index].trimStart().startsWith('}') && !startsWithANumber) {
                lines[index] = lines[index].replace(item, `\`${item}\``)
              }
            }
          }

          if ([']', ')'].every(nextLineStart => !lines[index + 1].trimStart().startsWith(nextLineStart))) {
            if (!lines[index].endsWith('[')) {
              lines[index] = `${lines[index]},`
            }
          }
          lines[index] = lines[index].replace(' : ', ' => ')
        }
      }

      return true
    })
  })
}
