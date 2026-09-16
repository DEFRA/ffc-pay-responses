const { getSchemes } = require('ffc-pay-schemes')
const db = require('./data')

const updateSchemesDatabase = async () => {
  console.log('Checking for updates to supported schemes')
  const schemes = getSchemes()

  for (const { schemeId, schemeName } of schemes) {
    const [, created] = await db.scheme.upsert({
      schemeId,
      name: schemeName
    })
    console.log(`${schemeName} ${created ? 'created' : 'updated'}`)
  }
}

module.exports = {
  updateSchemesDatabase
}
