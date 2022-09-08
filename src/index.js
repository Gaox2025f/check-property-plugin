const fs = require('fs')

class CheckPropertyPlugin {
    constructor(options = {}) {
        this.options = { ...options };
    }
    apply(compiler) {
        if (this.options.propertyName) {
            const pluginName = CheckPropertyPlugin.name;
            let allValues = []
            const problematicPropertyLocations = []
            const propertyName = this.options.propertyName || 'id'
            const checkType = this.options.checkType || 'duplicate'
            const fileName = this.options.fileName || 'problematic-properties.txt'
            compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
                compilation.hooks.buildModule.tap( pluginName, (module) => {
                    if (module && module.resource && !module.resource.includes('node_modules') && module.resource.endsWith('.js')) {
                        fs.readFile(module.resource, 'utf-8', function(err, dataStr) {
                            if (err) {
                                console.log('the err is', err)
                            } else {
                                const reg = new RegExp(' ' + propertyName + '=".*?"', 'g')
                                const strs = dataStr.match(reg)
                                if (strs) {
                                    const values = strs.map(str => {
                                      return [str.split('=')[1], module.resource]
                                    })
                                    allValues = allValues.concat(values)
                                }
                            }
                        })
                    }
                });
                compilation.hooks.finishModules.tap(pluginName, module => {
                    const res = {}
                    if (checkType === 'duplicate') {
                        for (let i = 0; i < allValues.length; i++) {
                            if (res[allValues[i][0]]) {
                                problematicPropertyLocations.push(allValues[i])
                            } else {
                                res[allValues[i][0]] = true
                            }
                        }
                    }
                    let resultStr = ''
                    for (let i = 0; i < problematicPropertyLocations.length; i++) {
                        resultStr += problematicPropertyLocations[i] + '\n\n'
                    }
                    fs.writeFile(fileName, resultStr, function(err) {
                        if (err) {
                            throw err;
                        }
                    });
                })
            });
        }
    }
}

module.exports = { CheckPropertyPlugin };