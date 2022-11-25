const fs = require('fs')
const axios = require('axios')

const POLYGON_SENTINEL_URL =
  'https://sentinel.matic.network/api/v2/validators/54/checkpoints-signed'

const main = async (month, year) => {
  let offset = 0
  while (true) {
    const transactions = []

    const trx = JSON.parse(fs.readFileSync('polygon_data.json', 'utf-8'))
    const { data } = await axios.get(
      `${POLYGON_SENTINEL_URL}?offset=${trx.offset}`
    )
    console.log('offset', offset)

    if (data.result.length == 0) {
      console.log('Finished!!')
      return
    }
    for (let j = 0; j < data.result.length; j++) {
      const tx = data.result[j]

      const time = new Date(Number(tx.timestamp) * 1000)

      const m = time.getMonth() + 1
      const d = time.getDate()
      const y = time.getFullYear()
      if (m <= month && year == y) {
        console.log(time)
        transactions.push(tx)
      }
    }

    trx.transactions.push(...transactions)
    trx.offset = offset
    fs.writeFileSync('polygon_data.json', JSON.stringify(trx))
    offset++
  }
}

main(10, 2022)
