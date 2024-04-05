module.exports = parameters => {
  const expectedParameters = [
    'list',
    'carry',
    'iteration'
  ]

  const missingParameter = expectedParameters.find(parameter => {
    return !Object.keys(parameters).includes(parameter)
  })

  if (missingParameter) {
    throw Error(`Expected a parameter called ${missingParameter} in listAddition()`)
  }

  const { list, carry: initialValue, iteration } = parameters

  const callback = (accumulator, currentValue, currentIndex, array) => {
    return iteration({
      carry: accumulator,
      value: currentValue,
      index: currentIndex,
      list: array
    })
  }

  return list.reduce(callback, initialValue)
}
