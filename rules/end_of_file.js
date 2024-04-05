module.exports = ({ lines, filename }) => {
  const endsWithBlankLine = lines.slice(-1)[0] === ''
  const endsWithTwoBlankLines = lines.slice(-1)[0] === '' && lines.slice(-2)[0] === ''

  if (!endsWithBlankLine || endsWithTwoBlankLines) {
    console.log(filename, '- The file must end with one blank line')
    return false
  }

  return true
}
