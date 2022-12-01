const axios = require('axios')
const fs = require('fs')
const ethers = require('ethers')
const { exportPolygonPDF } = require('./utils')

const POLYGON_SCAN_API_KEY = 'I8HP59YI9ARZHC2GW9SFA3R4CKHX3UFGS1'
const VALIDATOR_ADDRESS = '0xfb960a9450fc2f5dc8c6b1172932b678e287835f'
const MINTED_BLOCKS_URL = `https://api.polygonscan.com/api?module=account&action=getminedblocks`
const POLYGON_SENTINEL_URL =
  'https://sentinel.matic.network/api/v2/validators/54/checkpoints-signed'

function toBN (input) {
  if (String(input).includes('e')) {
    return ethers.BigNumber.from(toFixed(input))
  }

  return ethers.BigNumber.from(
    Number(input).toFixed().toLocaleString('fullwide', {
      useGrouping: false
    })
  )
}

const getValidatorPolygonNetworkRewards = async (month, year) => {
  let page = 1
  const offset = 10000

  let transactions = []
  while (true) {
    const url = `${MINTED_BLOCKS_URL}&address=${VALIDATOR_ADDRESS}&blocktype=blocks&page=${page}&offset=${offset}&apikey=${POLYGON_SCAN_API_KEY}`
    const { data } = await axios.get(url)

    if (data.result.length == 0) {
      break
    }

    transactions.push(...data.result)
    page++
  }

  const days = {}
  let totalMonthlyReward = ethers.BigNumber.from(0)
  for (let i = 0; i < transactions.length; i++) {
    const { timeStamp, blockReward } = transactions[i]
    const time = new Date(Number(timeStamp) * 1000)
    const m = time.getMonth() + 1
    const d = time.getDate()
    const y = time.getFullYear()
    const blockRewardBN = ethers.BigNumber.from(blockReward)

    if (m == month) {
      if (!days[d]) {
        days[d] = ethers.BigNumber.from(0)
        console.log(d)
      }
      days[d] = days[d].add(blockRewardBN)
      totalMonthlyReward = totalMonthlyReward.add(blockRewardBN)
    }
  }

  const parsedDays = {
    totalRewards: totalMonthlyReward,
    dailyRewards: {}
  }
  const keys = Object.keys(days)
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    parsedDays.dailyRewards[`${key}-${month}-${year}`] = {
      rewards: days[key]
    }
  }

  /* Example object returned
  {
    totalRewards: '3001995937518958676177',
    dailyRewards: [
      { date: '1-10-2022', rewards: '451635760442540284969' },
      { date: '2-10-2022', rewards: '513785606277894142170' },
      { date: '3-10-2022', rewards: '512197877285736960237' },
      { date: '4-10-2022', rewards: '582431948474995719905' },
      { date: '5-10-2022', rewards: '485347997097057799605' },
      { date: '6-10-2022', rewards: '184060402068804146605' },
      { date: '7-10-2022', rewards: '272536345871929622686' }
    ]
  }
  */

  console.log(parsedDays)
  return parsedDays
}

const getValidatorEthereumRewards = async (month, year, usefile) => {
  let start = false
  let end = false
  const TRANSACTIONS_PER_MONTH = 45 // avrage the number of transactions per month

  let { data: lastData } = await axios.get(POLYGON_SENTINEL_URL)
  const lastTimestamp = lastData.result[0].timestamp

  const { total, pageSize } = lastData.summary
  const pages = Number(Math.floor(total / pageSize)).toFixed()

  const lastTime = new Date(lastTimestamp * 1000)
  const lastTimeMonth = lastTime.getMonth() + 1
  const lastTimeYear = lastTime.getFullYear()

  if (month > lastTimeMonth || year > lastTimeYear) {
    console.log('Invalid date')
    return
  }

  let offset = 0
  if (month + 1 < lastTimeMonth && year == lastTimeYear && !usefile) {
    offset = TRANSACTIONS_PER_MONTH * (lastTimeMonth - month)
  }

  // console.log(offset)
  let totalValidatorReward = ethers.BigNumber.from('0')
  let totalComissionReward = ethers.BigNumber.from('0')

  let days = {}
  let totalTxs = 0
  while (true) {
    if (start && end) {
      // console.log('BREAK')
      break
    }

    let allData
    let len
    let transactions
    if (!usefile) {
      let { data } = await axios.get(
        `${POLYGON_SENTINEL_URL}?offset=${offset}&limit=20`
      )
      allData = data
      len = data.result.length
      transactions = [...data.result]
    } else {
      allData = JSON.parse(fs.readFileSync('polygon_data.json', 'utf-8'))
      len = allData.transactions.length
      transactions = [...allData.transactions]
      console.log(len)
    }

    if (len == 0) {
      // console.log('BREAK LEN')
      break
    }


    for (let j = 0; j < len; j++) {
      const { validatorReward, commissionedReward, timestamp } = transactions[j]
      const time = new Date(Number(timestamp) * 1000)
      const m = time.getMonth() + 1
      const d = time.getDate()
      const y = time.getFullYear()

      if (start && m != month && !usefile) {
        end = true
        console.log('END')
        break
      }

      if (m == month && y == year) {
        // console.log(time)
        start = true
        totalTxs++
        if (days[d] == undefined) {
          days[d] = ethers.BigNumber.from(0)
        }

        const _validatorReward = toBN(validatorReward)
        const _commissionedReward = toBN(commissionedReward)

        days[d] = days[d].add(_validatorReward)
        totalValidatorReward = totalValidatorReward.add(_validatorReward)
        totalComissionReward = totalComissionReward.add(_commissionedReward)
      }
    }
    offset++
    if (usefile) {
      break
    }
  }
  const parsedDays = {
    totalValidatorReward: totalValidatorReward,
    totalComissionReward: totalComissionReward,
    dailyRewards: []
  }

  const keys = Object.keys(days)
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    parsedDays.dailyRewards.push({
      date: `${key}-${month}-${year}`,
      rewards: days[key].toString()
    })
  }
  console.log(totalTxs)
  // console.log('totalMonthlyReward', totalMonthlyReward)
  // console.log('days[d]', days)
  return parsedDays
}

const main = async () => {
  const args = process.argv
  const argsObj = {}
  for (let i = 2; i < args.length; i++) {
    const arg = args[i].split('=')
    argsObj[arg[0]] = arg[1]
  }

  const month = Number(argsObj.month)
  const year = Number(argsObj.year)
  usefile = argsObj.useFile != undefined

  const ethereumData = await getValidatorEthereumRewards(month, year, usefile)
  console.log('Get Data From Ethereum done!!')
  const polygonData = await getValidatorPolygonNetworkRewards(month, year)
  console.log('Get Data From Polygon done!!')

  exportPolygonPDF(
    { polygonData, ethereumData },
    `reports/polygon-${month}-${year}.pdf`,
    month,
    year
  )
}

main()
