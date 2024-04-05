module.exports = parameters => {
  const expectedParameters = [
    'array',
    'iteration'
  ]

  const missingParameter = expectedParameters.find(parameter => {
    return !Object.keys(parameters).includes(parameter)
  })

  if (missingParameter) {
    throw Error(`Expected a parameter called ${missingParameter} in arrayForEach()`)
  }

  const { array, iteration } = parameters
  return array.forEach(iteration)
}
