const moment = require('moment')

module.exports = async function(client) {
  const blockRecord = await client.one(
    `
      SELECT * FROM blocks
      ORDER BY timestamp DESC
      LIMIT 1;
    `
  )

  if (!blockRecord) throw new Error('no block found')

  const transactionsRecords = await client.query(
    `
      SELECT * FROM transactions
      WHERE block_id = $1;
    `,
    [blockRecord.id]
  )

  const now = moment()
  const before = moment()
    .subtract((+process.env.TIME_DIFFERENCE + +now.format('HH')) % 24, 'hours')
    .subtract(+now.format('mm'), 'minutes')
    .subtract(+now.format('ss'), 'seconds')
    .toDate()
    .toISOString()

  const stats = await client.one(
    `
      SELECT
        sum(transactions.vtho_burn) AS dailyVTHOBurn,
        count(transactions.*) AS dailyTransactions,
        sum(transactions.clauses) AS dailyClauses
      FROM blocks
      JOIN transactions
      ON blocks.id = transactions.block_id
      WHERE blocks.timestamp > $1;
    `,
    [before]
  )

  return {
    block: {
      id: blockRecord.id,
      number: blockRecord.number,
      parentId: blockRecord.parent_id,
      timestamp: blockRecord.timestamp,
      gasUsed: blockRecord.gas_used,
      signer: blockRecord.signer,
    },
    transactions: transactionsRecords.map(transaction => ({
      id: transaction.id,
      blockId: transaction.block_id,
      contract: transaction.contract,
      delegator: transaction.delegator,
      origin: transaction.origin,
      gas: transaction.gas,
      clauses: transaction.clauses,
      vthoBurn: transaction.vtho_burn,
      gasUsed: transaction.gas_used,
      paid: transaction.paid,
      reward: transaction.reward,
    })),
    stats: {
      dailyTransactions: +stats.dailytransactions,
      dailyClauses: +stats.dailyclauses,
      dailyVTHOBurn: +stats.dailyvthoburn,
    },
  }

}
