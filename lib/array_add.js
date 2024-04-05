module.exports = parameters => {
  const expectedParameters = [
    'array',
    'carry',
    'iteration'
  ]

  const missingParameter = expectedParameters.find(parameter => {
    return !Object.keys(parameters).includes(parameter)
  })

  if (missingParameter) {
    throw Error(`Expected a parameter called ${missingParameter} in arrayAdd()`)
  }

  const { array, carry: initialValue, iteration } = parameters

  const callback = (accumulator, currentValue, currentIndex, array) => {
    return iteration({
      carry: accumulator,
      value: currentValue,
      index: currentIndex,
      array
    })
  }

  return array.reduce(callback, initialValue)
}
