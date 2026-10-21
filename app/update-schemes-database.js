const { getSchemes } = require('ffc-pay-schemes')
const { schemes } = require('./database')

const updateSchemesDatabase = async () => {
  console.log('Checking for updates to supported schemes')
  const supportedSchemes = getSchemes()

  for (const { schemeId, schemeName } of supportedSchemes) {
    const existingScheme = (await schemes().where({ schemeId }).first()) ?? null

    await schemes().insert({ schemeId, name: schemeName }).onConflict('schemeId').merge()

    const created = !existingScheme
    console.log(`${schemeName} ${created ? 'created' : 'updated'}`)
  }
}

module.exports = {
  updateSchemesDatabase
}
