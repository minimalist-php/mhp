const matchMultilineText = require('../lib/match_multiline_text.js')
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

      if (lines[entry].trimStart().startsWith('if ') || lines[entry].includes(' if ') || lines[entry].includes('if(') || lines[entry].includes('if (')) {
        return `${filename} ${entry + 1} - Usa signos de interrogación para código condicional`
      }

      if (lines[entry].trimStart().startsWith('¿ ')) {
        return `${filename} ${entry + 1} - Sobra un espacio después del signo de interrogación de apertura`
      }

      if (lines[entry].endsWith(' ?')) {
        return `${filename} ${entry + 1} - Sobra un espacio antes del signo de interrogación de cierre`
      }

      if (lines[entry].trimStart().startsWith('¿') || lines[entry].endsWith('?')) {
        if (!lines[entry].trimStart().startsWith('¿')) {
          return `${filename} ${entry + 1} - Falta el signo de interrogación de apertura`
        }
        if (!lines[entry].endsWith('?')) {
          return `${filename} ${entry + 1} - Falta el signo de interrogación de cierre`
        }
        lines[entry] = `${' '.repeat(lines[entry].length - lines[entry].trimStart().length)}${lines[entry].trimStart().replace('¿', 'if (').slice(0, -1)})`
      }
    }
  })

  if (!error) {
    return true
  }
  console.log(error)
}
