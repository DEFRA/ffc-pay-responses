const blobStorage = require('../storage')

const processPaymentFile = async (filename) => {
  // Delete payment file sent from DAX. A copy of the file already exists in the payment service.
  console.info(`Processing ${filename}`)
  try {
    await blobStorage.deleteFile(filename)
    console.log('Payment File sent from DAX, has been deleted :', filename)
  } catch (err) {
    console.error(`Failed to delete payment file: ${filename}`, err)
  }
}

module.exports = processPaymentFile
