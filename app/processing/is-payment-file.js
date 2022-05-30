const isPaymentFile = (filename) => {
  return /^FFC.*csv$/.test(filename)
}

module.exports = isPaymentFile
