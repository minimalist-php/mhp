module.exports = parameters => {
  const expectedParameters = [
    'list',
    'iteration'
  ]

  const missingParameter = expectedParameters.find(parameter => {
    return !Object.keys(parameters).includes(parameter)
  })

  if (missingParameter) {
    throw Error(`Expected a parameter called ${missingParameter} in arrayAdd()`)
  }

  const { list, iteration } = parameters

  const lookFor = () => {
    let found
    list.find((element, entry, list) => {
      const something = iteration({ list, element, entry })
      if (something) {
        found = something
        return true
      }
    })
    return found
  }

  return lookFor()
}
