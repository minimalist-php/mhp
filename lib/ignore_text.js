const listAddition = require('php-bundler/lib/list_addition.js')

module.exports = (parameters) => {
  const expectedParameters = [
    'text',
    'transform'
  ]

  const missingParameter = expectedParameters.find(parameter => {
    return !Object.keys(parameters).includes(parameter)
  })

  if (missingParameter) {
    throw Error(`Expected a parameter called ${missingParameter} in ignoreText()`)
  }

  let { text, transform } = parameters
  const betweenBackticks = /`(?<=`).+?(?=`)`/g
  let matchedText = [...text.matchAll(betweenBackticks)]
  if (matchedText === undefined) {
    text = transform(text)
    if (typeof text !== 'string') {
      throw Error('transform() expected to return a value of type text')
    }
  }

  matchedText = matchedText.map(text => text[0])

  text = text.replaceAll(betweenBackticks, '<STRING>')
  text = transform(text)
  if (typeof text !== 'string') {
    throw Error('transform() expected to return a value of type text')
  }
  return listAddition({
    list: matchedText,
    carry: text,
    iteration: parameters => {
      const text = parameters.carry
      const match = parameters.value

      return text.replace('<STRING>', match)
    }
  })
}
