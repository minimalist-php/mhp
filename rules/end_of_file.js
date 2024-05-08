module.exports = ({ lines, filename }) => {
  const endsWithBlankLine = lines.slice(-1)[0] === ''
  const endsWithTwoBlankLines = lines.slice(-1)[0] === '' && lines.slice(-2)[0] === ''

  if (!endsWithBlankLine) {
    console.log(`${filename} ${lines.length}`, '- Missing one blank line')
    return false
  }

  if (endsWithTwoBlankLines) {
    console.log(`${filename} ${lines.length}`, '- Invalid blank line')
    return false
  }

  return true
}
