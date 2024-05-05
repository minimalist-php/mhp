const matchMultilineText = require('php-bundler/lib/match_multiline_text.js')
const ignoreText = require('php-bundler/lib/ignore_text.js')
const arrayForEach = require('../lib/array_for_each.js')
const arrayCompose = require('../lib/array_compose.js')

module.exports = ({ lines, filename }) => {
  const indentation = [
    '                ',
    '            ',
    '        ',
    '    ',
    ''
  ]

  let closure = false
  const closures = []
  const parsedLines = []

  let multilineString = {}
  indentation.every(indentationLevel => {
    lines.every((line, index) => {
      if (lines[index].trimStart().startsWith('#') || lines[index] === '' || parsedLines.includes(index)) {
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

      if (currentIndentationLevel && lines[index].includes('function (')) {
        closures.push([index])

        if (!lines[index].includes(' : ')) {
          parsedLines.push(index)
        }

        closure = true
        return true
      }

      if (!currentIndentationLevel && closure) {
        closures[closures.length - 1].push(index)
        parsedLines.push(index)
        return true
      }

      if (currentIndentationLevel && closure) {
        parsedLines.push(index)
        closure = false
        return true
      }

      return true
    })
    return true
  })

  closures.push([])
  lines.every((line, index) => {
    if (lines[index].trimStart().startsWith('#') || lines[index] === '' || parsedLines.includes(index)) {
      return true
    }

    multilineString = matchMultilineText({ lines, index, filename, multilineString })
    if (multilineString.error) {
      return false
    }

    if (!lines[index].endsWith('<<<STRING') && multilineString.line) {
      return true
    }

    closures[closures.length - 1].push(index)
    parsedLines.push(index)

    return true
  })

  return closures.every(closure => {
    const closureFirstLine = closure.find(() => true)
    let assignments = []
    closure.every(index => {
      lines[index] = lines[index].replaceAll('reference_to ', '&$')
      const firstLine = closureFirstLine === index

      if (firstLine && lines[index].includes('function (')) {
        let scopeAssignments = lines[index].match(/(?<=function \().*?(?=\))/g)
        if (scopeAssignments) {
          scopeAssignments = [...scopeAssignments][0]

          if (scopeAssignments !== '') {
            assignments = assignments.concat(scopeAssignments.replace('...', ''))
          }
        }
        scopeAssignments = lines[index].match(/(?<=use \().*?(?=\))/g)
        if (scopeAssignments) {
          scopeAssignments = [...scopeAssignments][0]
          if (scopeAssignments !== '') {
            scopeAssignments = scopeAssignments.split(', ').map(assignment => {
              return assignment.replace('&$', '')
            })
            assignments = assignments.concat(scopeAssignments)
          }
        }
      }

      let assignmentBadSpacing = false

      arrayCompose([
        {
          text: lines[index],
          transform: line => {
            if (line.includes(':') && !line.includes(' : ')) {
              assignmentBadSpacing = true
            }

            return line
          }
        },
        ignoreText
      ])

      if (assignmentBadSpacing) {
        console.log(`${filename} ${index + 1}`, '- There must be a space before and after the colon.')
        return false
      }

      if (!firstLine || (firstLine && !lines[index].includes('function ('))) {
        const assignment = lines[index].split(' : ')
        if (assignment.length > 1) {
          lines[index] = lines[index].replace(' : ', ' = ')
          assignments = assignments.concat([assignment[0].trimStart()])
        }
      }

      assignments.every((assignment) => {
        if (lines[index].startsWith(assignment) && !lines[index].startsWith('$')) {
          lines[index] = lines[index].replaceAll(`${assignment} =`, `$${assignment} =`)
        }

        if (lines[index].startsWith(`${assignment}(`)) {
          lines[index] = lines[index].replace(`${assignment}(`, `$${assignment}(`)
        }

        const assignmentsReplacements = [
          [` ${assignment} `, ` $${assignment} `],
          [`...${assignment})`, `...$${assignment})`],
          [`(${assignment} `, `($${assignment} `],
          [`(${assignment})`, `($${assignment})`],
          [`(${assignment},`, `($${assignment},`],
          [`(${assignment}(`, `($${assignment}(`],
          [`, ${assignment},`, `, $${assignment},`],
          [` ${assignment})`, ` $${assignment})`],
          [` ${assignment}(`, ` $${assignment}(`],
          [` ${assignment};`, ` $${assignment};`],
          [` ${assignment}[`, ` $${assignment}[`],
          [`(${assignment}[`, `($${assignment}[`],
          [`[${assignment}]`, `[$${assignment}]`],
          [`[${assignment} `, `[$${assignment} `],
          [` ${assignment},`, ` $${assignment},`]
        ]

        arrayForEach({
          array: assignmentsReplacements,
          iteration: element => {
            const [assignment, replacement] = element
            lines[index] = arrayCompose([
              {
                text: lines[index],
                transform: line => {
                  return line.replaceAll(assignment, replacement)
                }
              },
              ignoreText
            ])
          }
        })

        if (lines[index].trimStart().startsWith(`"${assignment}"`) && !lines[index].includes(' => ')) {
          lines[index] = lines[index].replace(`"${assignment}"`, `$${assignment}`)
        }
        if (lines[index].endsWith(` ${assignment}`)) {
          lines[index] = lines[index].replaceAll(` ${assignment}`, ` $${assignment}`)
        }

        return true
      })
      return true
    })
    return true
  })
}
