const { DefaultAzureCredential } = require('@azure/identity')
const { BlobServiceClient } = require('@azure/storage-blob')
const config = require('./config').storageConfig
let blobServiceClient
let containersInitialised

if (config.useConnectionStr) {
  blobServiceClient = BlobServiceClient.fromConnectionString(config.connectionStr)
} else {
  const uri = `https://${config.storageAccount}.blob.core.windows.net`
  blobServiceClient = new BlobServiceClient(uri, new DefaultAzureCredential())
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
  await inboundClient.upload(placeHolderText, placeHolderText.length)
  await archiveClient.upload(placeHolderText, placeHolderText.length)
  await quarantineClient.upload(placeHolderText, placeHolderText.length)
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
const moveFile = async (sourceFolder, destinationFolder, sourceFilename, destinationFilename) => {
  const sourceBlob = await getBlob(sourceFolder, sourceFilename)
  const destinationBlob = await getBlob(destinationFolder, destinationFilename)
  const copyResult = await (await destinationBlob.beginCopyFromURL(sourceBlob.url)).pollUntilDone()

  if (copyResult.copyStatus === 'success') {
    await sourceBlob.delete()
    return true
  }

  return false
}

const archiveFile = (filename, archiveFilename) => {
  return moveFile(config.inboundFolder, config.archiveFolder, filename, archiveFilename)
}

const quarantineFile = (filename, quarantineFilename) => {
  return moveFile(config.inboundFolder, config.quarantineFolder, filename, quarantineFilename)
}

const deleteFile = async (filename) => {
  const sourceBlob = await getBlob(config.inboundFolder, filename)
  await sourceBlob.delete()
}

module.exports = {
  getInboundFileList,
  downloadFile,
  archiveFile,
  quarantineFile,
  deleteFile,
  blobServiceClient
}
