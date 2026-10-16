const { sequences } = require('../../../database')

const updateSequence = async (sequence, transaction) => {
  await sequences(transaction ?? undefined)
    .where({ schemeId: sequence.schemeId })
    .update({ nextReturn: sequence.nextReturn })
}

module.exports = {
  updateSequence
}
