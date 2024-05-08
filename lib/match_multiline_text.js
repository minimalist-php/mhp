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

  if (multilineString.line && !lines[index].trimStart().startsWith('`')) {
    return multilineString
  }

  if (multilineString.line && lines[index].trimStart().startsWith('`')) {
    const indentation = lines[index].length - lines[index].trimStart().length

    if (indentation !== multilineString.indentation) {
      return multilineString
    }

    lines[index] = lines[index].replace('`', `${' '.repeat(indentation)}STRING`)
    multilineString = {}
    return multilineString
  }

  const multilineStringDeclaration = ([...lines[index].matchAll(/`/g)].length % 2) !== 0
  if (!multilineString.line && multilineStringDeclaration) {
    lines[index] = `${lines[index].slice(0, -1)}<<<STRING`
    const indentation = lines[index].length - lines[index].trimStart().length
    multilineString = { line: lines[index], index, indentation }
  }

  return multilineString
}
