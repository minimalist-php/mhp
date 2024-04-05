module.exports = ({ lines, index, filename, multilineString }) => {
  if (lines[index].endsWith('<<<STRING')) {
    const indentation = lines[index].length - lines[index].trimStart().length
    multilineString = { line: lines[index], index, indentation }
    return multilineString
  }

  if (lines[index].trimStart().startsWith('STRING')) {
    multilineString = {}
    return multilineString
  }

  if (!lines[index].endsWith('`')) {
    return multilineString
  }

  if (multilineString.line && lines[index].trimStart() === '`') {
    const indentation = lines[index].length - lines[index].trimStart().length

    if (indentation !== multilineString.indentation) {
      return multilineString
    }

    const linesAfter = [
      lines[index + 1],
      lines[index + 2]
    ]

    if (indentation === 0 && (linesAfter[0] !== '' || linesAfter[1] === '')) {
      console.log(`${filename} ${index + 1}`, '- There must be one blank line after each top level multiline string')
      return { error: true }
    }

    lines[index] = `${' '.repeat(indentation)}STRING`
    multilineString = {}
    return multilineString
  }

  const multilineStringDeclaration = ([...lines[index].matchAll(/`/g)].length % 2) !== 0
  if (!multilineString.line && multilineStringDeclaration) {
    const linesBefore = [
      lines[index - 1],
      lines[index - 2]
    ]

    if (linesBefore[0] !== undefined) {
      if (!lines[index].startsWith(' ')) {
        if (linesBefore[0] !== '' || linesBefore[1] === '') {
          console.log(`${filename} ${index + 1}`, '- There must be one blank line before each top level multiline string')
          return { error: true }
        }
      }
    }

    lines[index] = `${lines[index].slice(0, -1)}<<<STRING`
    const indentation = lines[index].length - lines[index].trimStart().length
    multilineString = { line: lines[index], index, indentation }
  }

  return multilineString
}
