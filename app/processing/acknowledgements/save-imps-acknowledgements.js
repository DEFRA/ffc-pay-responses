const { impsBatchNumbers, impsAcknowledgements } = require('../../database')

const saveImpsAcknowledgements = async (content, transaction) => {
  const acknowledgements = []

  const batchRecords = await Promise.all(content.map(acknowledgement =>
    impsBatchNumbers(transaction ?? undefined)
      .select('batchNumber')
      .where({ invoiceNumber: acknowledgement.invoiceNumber, frn: acknowledgement.frn })
      .first()
  ))

  for (const [index, acknowledgement] of content.entries()) {
    const batchRecord = batchRecords[index]
    if (!batchRecord) {
      console.error(`No batch number found for invoiceNumber: ${acknowledgement.invoiceNumber}, frn: ${acknowledgement.frn}`)
      continue
    }
    const { batchNumber } = batchRecord
    acknowledgements.push({
      batchNumber,
      invoiceNumber: acknowledgement.invoiceNumber,
      frn: acknowledgement.frn,
      success: acknowledgement.success ? 'I' : 'R'
    })
  }

  if (acknowledgements.length > 0) {
    await impsAcknowledgements(transaction ?? undefined).insert(acknowledgements)
    console.log(`Saved ${acknowledgements.length} IMPS acknowledgements for future return files`)
  } else {
    console.log('No IMPS acknowledgements to save')
  }
}

module.exports = {
  saveImpsAcknowledgements
}
