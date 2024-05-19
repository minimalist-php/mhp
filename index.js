const { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } = require('fs')
const EventEmitter = require('events')
const chokidar = require('chokidar')
const phpArrayReader = require('php-array-reader')

const eventEmitter = new EventEmitter()

const watcher = chokidar.watch('index.mhp', {
  persistent: true
})

if (!existsSync('manifest.mhp')) {
  throw Error('manifest.mhp file required')
}

const manifestWatcher = chokidar.watch('manifest.mhp', {
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

const aModuleFilename = /(?<=module\(")(.*?)(?="\))/
const aModuleExpression = /module\("(.*?)"\)/

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

  const manifestFile = readFileSync('manifest.mhp', 'utf-8')
  let manifest = compile({ file: manifestFile, filename: 'manifest.mhp' })
  if (manifest.error) {
    return false
  }

  if (!manifestFile.trimStart().startsWith('return [')) {
    throw Error('manifest.mhp must return a list')
  }

  manifest = phpArrayReader.fromString(manifest.compiled.replace('return ', ''))
  const repository = manifest.repository
  const version = manifest.version
  const modules = manifest.modules

  if (!repository || !version) {
    throw Error('manifest.mhp must include repository and version')
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
    moduleFilenameWithVersion = `${repository}@${version}/${moduleFilename}`
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

  const manifestFile = readFileSync('manifest.mhp', 'utf-8')

  let manifest = compile({ file: manifestFile, filename: 'manifest.mhp' })
  if (manifest.error) {
    return false
  }

  if (!manifestFile.trimStart().startsWith('return [')) {
    throw Error('manifest.mhp must return a list')
  }

  const mainFile = readFileSync('index.mhp', 'utf-8')
  if (mainFile === '') {
    return
  }

  let bundle = compile({ file: mainFile, filename: 'index.mhp' })
  if (bundle.error) {
    return
  }

  bundle = resoveModule({ file: bundle.compiled })

  writeFileSync('index.php', `<?php\n${bundle}`)
}

eventEmitter.on('compile', handleFile)

let needUpdate

const manifestFile = readFileSync('manifest.mhp', 'utf-8')
let manifest = compile({ file: manifestFile, filename: 'manifest.mhp' })
if (manifest.error) {
  return false
}

if (!manifestFile.trimStart().startsWith('return [')) {
  throw Error('manifest.mhp must return a list')
}

manifest = phpArrayReader.fromString(manifest.compiled.replace('return ', ''))
const { repository, version, modules } = manifest

if (!repository || !version) {
  throw Error('manifest.mhp must include repository and version')
}

if (existsSync('php_modules/manifest.mhp')) {
  const installedModules = readFileSync('php_modules/manifest.mhp', 'utf-8')
  if (installedModules !== manifestFile) {
    needUpdate = true
  }
}

if (modules && !existsSync('php_modules/manifest.mhp')) {
  if (!existsSync('php_modules')) {
    mkdirSync('php_modules')
  }
  writeFileSync('php_modules/manifest.mhp', manifestFile)
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
        rmSync('php_modules/manifest.mhp')
        return false
      }
      return text
    })

    if (!moduleFile) return false

    moduleFile = moduleFile.replace('<?php', `<?php\n# ${module}`)
    const moduleParts = module.split('/')

    const vendor = moduleParts[4]
    const [repository, version] = moduleParts[5].split('@')

    if (!existsSync(`php_modules/${vendor}`)) {
      mkdirSync(`php_modules/${vendor}`)
    }

    writeFileSync(`php_modules/${vendor}/${repository}@${version}.php`, moduleFile)

    if (index === modules.length - 1) {
      eventEmitter.emit('compile')
    }

    return true
  })
}
