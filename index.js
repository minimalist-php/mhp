const { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } = require('fs')
const EventEmitter = require('events')
const chokidar = require('chokidar')
const phpArrayReader = require('php-array-reader')

const eventEmitter = new EventEmitter()

const watcher = chokidar.watch('index.legi', {
  persistent: true
})

if (!existsSync('manifiesto.legi')) {
  throw Error('Falta el manifiesto (manifiesto.legi)')
}

const manifestWatcher = chokidar.watch('manifiesto.legi', {
  persistent: true
})

watcher.on('change', () => eventEmitter.emit('compile'))
manifestWatcher.on('change', () => eventEmitter.emit('compile'))

const compile = ({ file, filename }) => {
  const lines = file.split('\n')

  const rules = [
    'clutter',
    'operators',
    'end_of_file',
    'spacing',
    'indentation',
    'comments',
    'conditions',
    'closures',
    'lists',
    'assignments',
    'expressions',
    'text',
    'blank_lines'
  ]

  const compiled = rules.every(rule => require(`./rules/${rule}.js`)({ lines, filename }))

  if (!compiled) {
    return { error: true }
  }

  return { compiled: lines.join('\n') }
}

const aModuleFilename = /(?<=use\(")(.*?)(?="\))/
const aModuleExpression = /use\("(.*?)"\)/

const closure = parameters => {
  let { name, code } = parameters

  code = code.split('\n')
  const source = code[0]

  code.splice(0, 1)
  code = code.join('\n')

  return `${source}\ndefine("${name}", function () {
${code}
})`
}

const resoveModule = ({ file, moduleFilename }) => {
  if (!moduleFilename) moduleFilename = file.match(aModuleFilename)
  if (!moduleFilename) return file
  moduleFilename = moduleFilename[0]

  let moduleFile, moduleFilenameWithVersion

  const manifestFile = readFileSync('manifiesto.legi', 'utf-8')
  let manifest = compile({ file: manifestFile, filename: 'manifiesto.legi' })
  if (manifest.error) {
    return false
  }

  if (!manifestFile.trimStart().startsWith('<- [')) {
    throw Error('El manifiesto debe devolver una lista')
  }

  manifest = phpArrayReader.fromString(manifest.compiled.replace('return ', ''))
  const repositorio = manifest.repositorio
  const versión = manifest.versión
  const modules = manifest.modules

  if (!repositorio || !versión) {
    throw Error('Se debe especificar el repositorio y la versión en el manifiesto (manifiesto.legi)')
  }

  moduleFilenameWithVersion = moduleFilename

  if (!moduleFilenameWithVersion.includes('@')) {
    let moduleVersion = modules.find(module => module.includes(moduleFilename))
    moduleVersion = moduleVersion.split('@')[1].split('/')[0]
    moduleFilenameWithVersion = `${moduleFilenameWithVersion}@${moduleVersion}`
  }

  try {
    moduleFile = readFileSync(`php_modules/${moduleFilenameWithVersion}.php`, 'utf-8')
  } catch (error) {
    moduleFile = readFileSync(moduleFilenameWithVersion, 'utf-8')

    watcher.add(moduleFilenameWithVersion)
  }

  if (moduleFile.startsWith('<?php')) {
    moduleFile = moduleFile.replace('<?php\n', '')
  } else {
    moduleFilenameWithVersion = `${repositorio}@${versión}/${moduleFilename}`
    moduleFile = compile({ file: moduleFile, filename: moduleFilename })
    if (moduleFile.error) {
      return
    }

    moduleFile = moduleFile.compiled
  }

  moduleFile = closure({
    name: moduleFilenameWithVersion,
    code: moduleFile.trimEnd()
  })

  let bundle = file.replace(aModuleExpression, `constant("${moduleFilenameWithVersion}")()`)
  if (!bundle.includes('# </php-modules>\n')) {
    bundle = `\n# <php-modules>\n\n# </php-modules>\n\n${bundle}`
  }
  if (!bundle.includes(moduleFile)) {
    bundle = bundle.replace('# </php-modules>\n', `${moduleFile};\n\n# </php-modules>\n`)
  }

  const anotherModuleFilename = bundle.match(aModuleFilename)

  if (anotherModuleFilename) {
    return resoveModule({
      file: bundle,
      moduleFilename: anotherModuleFilename
    })
  }

  return bundle
}

const handleFile = () => {
  console.clear()

  const manifestFile = readFileSync('manifiesto.legi', 'utf-8')

  let manifest = compile({ file: manifestFile, filename: 'manifiesto.legi' })
  if (manifest.error) {
    return false
  }

  if (!manifestFile.trimStart().startsWith('<- [')) {
    throw Error('manifiesto.legi must return a list')
  }

  const mainFile = readFileSync('index.legi', 'utf-8')
  if (mainFile === '') {
    return
  }

  let bundle = compile({ file: mainFile, filename: 'index.legi' })
  if (bundle.error) {
    return
  }

  bundle = resoveModule({ file: bundle.compiled })

  writeFileSync('index.php', `<?php\n${bundle}`)
}

eventEmitter.on('compile', handleFile)

let needUpdate

const manifestFile = readFileSync('manifiesto.legi', 'utf-8')
let manifest = compile({ file: manifestFile, filename: 'manifiesto.legi' })
if (manifest.error) {
  return false
}

if (!manifestFile.trimStart().startsWith('<- [')) {
  throw Error('manifiesto.legi must return a list')
}

manifest = phpArrayReader.fromString(manifest.compiled.replace('return ', ''))
const { repositorio, versión, modules } = manifest

if (!repositorio || !versión) {
  throw Error('Se debe especificar el repositorio y la versión en el manifiesto (manifiesto.legi)')
}

if (existsSync('php_modules/manifiesto.legi')) {
  const installedModules = readFileSync('php_modules/manifiesto.legi', 'utf-8')
  if (installedModules !== manifestFile) {
    needUpdate = true
  }
}

if (modules && !existsSync('php_modules/manifiesto.legi')) {
  if (!existsSync('php_modules')) {
    mkdirSync('php_modules')
  }
  writeFileSync('php_modules/manifiesto.legi', manifestFile)
  needUpdate = true
}

if (!needUpdate) {
  eventEmitter.emit('compile')
}

if (needUpdate) {
  modules.every(async (module, index) => {
    let moduleFile = await fetch(module).then(async response => {
      const text = await response.text()
      if (response.status === 404) {
        console.log(text)
        rmSync('php_modules/manifiesto.legi')
        return false
      }
      return text
    })

    if (!moduleFile) return false

    moduleFile = moduleFile.replace('<?php', `<?php\n# ${module}`)
    const moduleParts = module.split('/')

    const vendor = moduleParts[4]
    const [repositorio, versión] = moduleParts[5].split('@')

    if (!existsSync(`php_modules/${vendor}`)) {
      mkdirSync(`php_modules/${vendor}`)
    }

    writeFileSync(`php_modules/${vendor}/${repositorio}@${versión}.php`, moduleFile)

    if (index === modules.length - 1) {
      eventEmitter.emit('compile')
    }

    return true
  })
}
