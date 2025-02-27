const { DefaultAzureCredential } = require('@azure/identity')
const { BlobServiceClient } = require('@azure/storage-blob')
const config = require('./config').storageConfig
let blobServiceClient
let containersInitialised

if (config.useConnectionStr) {
  console.log('Using connection string for BlobServiceClient')
  blobServiceClient = BlobServiceClient.fromConnectionString(config.connectionStr)
} else {
  console.log('Using DefaultAzureCredential for BlobServiceClient')
  const uri = `https://${config.storageAccount}.blob.core.windows.net`
  blobServiceClient = new BlobServiceClient(uri, new DefaultAzureCredential({ managedIdentityClientId: config.managedIdentityClientId }))
}

const container = blobServiceClient.getContainerClient(config.container)

const initialiseContainers = async () => {
  if (config.createContainers) {
    await container.createIfNotExists()
  }
  await initialiseFolders()
  containersInitialised = true
}

const initialiseFolders = async () => {
  const placeHolderText = 'Placeholder'
  const inboundClient = container.getBlockBlobClient(`${config.inboundFolder}/default.txt`)
  const archiveClient = container.getBlockBlobClient(`${config.archiveFolder}/default.txt`)
  const quarantineClient = container.getBlockBlobClient(`${config.quarantineFolder}/default.txt`)
  const returnClient = container.getBlockBlobClient(`${config.returnFolder}/default.txt`)
  await inboundClient.upload(placeHolderText, placeHolderText.length)
  await archiveClient.upload(placeHolderText, placeHolderText.length)
  await quarantineClient.upload(placeHolderText, placeHolderText.length)
  await returnClient.upload(placeHolderText, placeHolderText.length)
}

const getBlob = async (folder, filename) => {
  containersInitialised ?? await initialiseContainers()
  return container.getBlockBlobClient(`${folder}/${filename}`)
}

const getInboundFileList = async () => {
  containersInitialised ?? await initialiseContainers()

  const fileList = []
  for await (const file of container.listBlobsFlat({ prefix: config.inboundFolder })) {
    fileList.push(file.name.replace(`${config.inboundFolder}/`, ''))
  }

  return fileList
}

const downloadFile = async (filename) => {
  const blob = await getBlob(config.inboundFolder, filename)
  const downloaded = await blob.downloadToBuffer()
  return downloaded.toString()
}

// Copies blob from one folder to another folder and deletes blob from original folder
const moveFile = async (sourceFolder, destinationFolder, filename) => {
  const sourceBlob = await getBlob(sourceFolder, filename)
  const destinationBlob = await getBlob(destinationFolder, filename)
  const copyResult = await (await destinationBlob.beginCopyFromURL(sourceBlob.url)).pollUntilDone()

  if (copyResult.copyStatus === 'success') {
    await sourceBlob.delete()
    return true
  }

  return false
}

const archiveFile = (filename) => {
  return moveFile(config.inboundFolder, config.archiveFolder, filename)
}

const quarantineFile = (filename) => {
  return moveFile(config.inboundFolder, config.quarantineFolder, filename)
}

const deleteFile = async (filename) => {
  const sourceBlob = await getBlob(config.inboundFolder, filename)
  await sourceBlob.delete()
}

const getReturnBlobClient = async (filename) => {
  return getBlob(config.returnFolder, filename)
}

module.exports = {
  getInboundFileList,
  downloadFile,
  archiveFile,
  quarantineFile,
  deleteFile,
  getReturnBlobClient,
  blobServiceClient
}
