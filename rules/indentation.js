module.exports = ({ lines, filename }) => {
  const indentation = [
    0,
    4,
    8,
    12,
    16
  ]

  return lines.every((line, index) => {
    const lineIndentation = lines[index].length - lines[index].trimStart().length
    if (lineIndentation > 16) {
      console.log(`${filename} ${index + 1}`, '- Too much nesting, refactoring is needed.')
      return false
    }

    if (!indentation.includes(lineIndentation)) {
      console.log(`${filename} ${index + 1}`, '- Bad indentation')
      return false
    }

    return true
  })
}
