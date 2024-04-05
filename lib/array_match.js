module.exports = parameters => {
  const expectedParameters = [
    'value',
    'default',
    'array'
  ]

  const missingParameter = expectedParameters.find(parameter => {
    return !Object.keys(parameters).includes(parameter)
  })

  if (missingParameter) {
    throw Error(`Expected an parameter called ${missingParameter} in arrayMatch()`)
  }

  const { array, value } = parameters
  const _default = parameters.default

  const _case = array.find(element => {
    const expectedParameters = [
      'case',
      'assign'
    ]

    const missingParameter = expectedParameters.find(parameter => {
      return !Object.keys(element).includes(parameter)
    })

    if (missingParameter) {
      throw Error(`Expected a parameter called ${missingParameter} in array argument of arrayMatch()`)
    }

    return element.case === value
  })

  if (!_case) {
    return _default
  }

  return _case.assign
}
