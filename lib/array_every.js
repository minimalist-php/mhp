module.exports = parameters => {
  const expectedParameters = [
    'array',
    'iteration'
  ]

  const missingParameter = expectedParameters.find(parameter => {
    return !Object.keys(parameters).includes(parameter)
  })

  if (missingParameter) {
    throw Error(`Expected a parameter called ${missingParameter} in arrayEvery()`)
  }

  const { array, iteration } = parameters

  if (array.length === 0) {
    throw Error('arrayEvery() cannot be used in empty arrays.')
  }

  const callback = (currentValue, index, array) => {
    return iteration({
      value: currentValue,
      index,
      array
    })
  }

  return array.every(callback)
}
