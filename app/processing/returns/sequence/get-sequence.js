const { sequences } = require('../../../database')

const getSequence = async (schemeId, transaction) => {
  return (await sequences(transaction ?? undefined)
    .where({ schemeId })
    .forUpdate()
    .first()) ?? null
}

module.exports = {
  getSequence
}
