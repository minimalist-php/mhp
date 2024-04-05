module.exports = array => {
  return array.reduce((accumulator, _function) => {
    return _function(accumulator)
  })
}
