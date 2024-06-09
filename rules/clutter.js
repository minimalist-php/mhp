const matchMultilineText = require('../lib/match_multiline_text.js')

module.exports = ({ lines, filename }) => {
  const clutter = {
    print: 'imprimir',
    echo: 'imprimir',
    print_r: 'imprimir',
    sizeof: 'list_length',
    count: 'magnitud',
    use: 'usar',
    null: 'nulo',
    true: 'verdadero',
    false: 'falso'
  }

  const aliases = {
    magnitud: 'count',
    imprimir: 'print_r',
    error: 'throw new Exception',
    usar: 'use',
    nulo: 'null',
    verdadero: 'true',
    falso: 'false'
  }

  let multilineString = {}
  return lines.every((line, index) => {
    multilineString = matchMultilineText({ lines, index, filename, multilineString })
    if (multilineString.error) {
      return false
    }

    if (multilineString.line) {
      return true
    }
    Object.keys(clutter).every(functionToAvoid => {
      if (
        lines[index].trimStart() === functionToAvoid ||
        lines[index].trimStart().startsWith(`${functionToAvoid}(`) ||
        lines[index].includes(` ${functionToAvoid}(`) ||
        lines[index].includes(`[${functionToAvoid}(`) ||
        lines[index].includes(`(${functionToAvoid}(`) ||
        lines[index].includes(` ${functionToAvoid} `) ||
        lines[index].endsWith(` ${functionToAvoid}`)
      ) {
        console.log(`${filename} ${index + 1}`, `- Use ${clutter[functionToAvoid]}() insted of ${functionToAvoid}()`)
        return false
      }

      return true
    })

    Object.keys(aliases).every(functionAlias => {
      lines[index] = lines[index].replaceAll(`[${functionAlias}(`, `[${aliases[functionAlias]}(`)
      lines[index] = lines[index].replaceAll(`(${functionAlias}(`, `(${aliases[functionAlias]}(`)
      lines[index] = lines[index].replaceAll(` ${functionAlias}(`, ` ${aliases[functionAlias]}(`)
      if (lines[index].trimStart().startsWith(`${functionAlias}(`)) {
        lines[index] = lines[index].replace(`${functionAlias}(`, `${aliases[functionAlias]}(`)
      }
      if (lines[index].endsWith(` ${functionAlias}`)) {
        lines[index] = lines[index].replaceAll(` ${functionAlias}`, ` ${aliases[functionAlias]}`)
      }

      return true
    })

    return true
  })
}
