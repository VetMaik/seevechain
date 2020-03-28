const { Framework } = require('@vechain/connex-framework')
const { Driver, SimpleNet } = require('@vechain/connex.driver-nodejs')
const commands = require('../commands')
const client = require('../database')
const actions = require('../actions')

async function subscribeToVechainBlocks(io) {
  const driver = await Driver.connect(new SimpleNet('https://vethor-node.vechain.com/'))
  const thor = new Framework(driver).thor
  const tick = thor.ticker()

  while (true) {
    const head = await tick.next()
    await getBlock(thor, head.number, client)
    io.emit('serverSendLatest', await actions.getLatest())
  }
}

async function getBlock(thor, number, client) {
  const block = await thor.block(number).get()
  if (!block) {
    return await getBlock(thor, number, client)
  } else {
    await commands.saveBlock({ client, block })
    for (const txId of block.transactions) {
      await getTransaction(thor, txId, block, client)
    }
  }
  return block
}

async function getTransaction(thor, txId, block, client) {
  try {
    const transaction = await thor.transaction(txId).get()
    const receipt = await thor.transaction(txId).getReceipt()

    if (!receipt || !transaction) {
      await getTransaction(thor, txId, block, client)
    } else {
      await commands.saveTransaction({ client, transaction, receipt, block })
    }
  } catch(error) {
    if (error.message.includes('head: leveldb: not found')) {
      await getTransaction(thor, txId, block, client)
    } else throw error
  }
}

module.exports = {
  subscribeToVechainBlocks,
  getBlock,
  getTransaction,
}
