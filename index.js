const process = require('process')
const axios = require('axios').default
const ethers = require('ethers')
const jsPDF = require('jspdf')
const fs = require('fs')
const currency = require('currency.js')

let days = {}
var totalRewards = ethers.BigNumber.from('0')
var validatorRewards = ethers.BigNumber.from('0')
var commissionedRewards = ethers.BigNumber.from('0')
var delegatorsTotalRewards = ethers.BigNumber.from('0')
var totalVaidatorRewards = ethers.BigNumber.from('0')

async function main () {
  // configuration
  config = {
    // the month
    month: 1,
    // sentinel url endpoint
    year: 2022,
    // url
    url:
      'https://sentinel.matic.network/api/v2/validators/54/checkpoints-signed?limit=19000',
    // json file path
    file: ''
  }

  // Parse argv
  var args = process.argv.slice(2)

  for (let index = 0; index < args.length; index++) {
    const element = String(args[index])
    const arg = element.split('=')
    config[arg[0]] = arg[1]
  }

  const { url, month, year } = config

  // check if use local or remote data
  let res
  if (config.file !== '') {
    res = JSON.parse(fs.readFileSync('./data.json'))
  } else {
    res = (await axios.get(url)).data
  }
  const dir = 'reports'
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
  }
  const output = `${dir}/polygon-${month}-${year}.pdf`
  const { result } = res

  for (let index = 0; index < result.length; index++) {
    const {
      totalReward,
      validatorReward,
      commissionedReward,
      delegatorsReward,
      timestamp
    } = result[index]

    var date = new Date(timestamp * 1000)
    if (date.getMonth() + 1 == month) {
      let day = `${date.getDate()}-${month}-${year}`

      if (date.getDate() <= 9) {
        day = `0${day}`
      }

      if (days[day] == undefined) {
        days[day] = ethers.BigNumber.from('0')
      }

      const _totalReward = toBN(totalReward)
      const _validatorReward = toBN(validatorReward)
      const _commissionedReward = toBN(commissionedReward)
      const _delegatorsReward = toBN(delegatorsReward)

      validatorRewards = validatorRewards.add(_validatorReward)
      commissionedRewards = commissionedRewards.add(_commissionedReward)

      delegatorsTotalRewards = delegatorsTotalRewards.add(_delegatorsReward)

      totalRewards = totalRewards.add(_totalReward)
      totalVaidatorRewards = totalVaidatorRewards
        .add(_validatorReward)
        // .add(_commissionedReward)

      days[day] = days[day].add(_validatorReward).add(_commissionedReward)
    }
  }
  exportPDF(output, month, year)
}

function toBN (input) {
  if (String(input).includes('e')) {
    return ethers.BigNumber.from(toFixed(input))
  }

  return ethers.BigNumber.from(
    Number(input)
      .toFixed()
      .toLocaleString('fullwide', {
        useGrouping: false
      })
  )
}

function toFixed (x) {
  if (Math.abs(x) < 1.0) {
    var e = parseInt(x.toString().split('e-')[1])
    if (e) {
      x *= Math.pow(10, e - 1)
      x = '0.' + new Array(e).join('0') + x.toString().substring(2)
    }
  } else {
    var e = parseInt(x.toString().split('+')[1])
    if (e > 20) {
      e -= 20
      x /= Math.pow(10, e)
      x += new Array(e + 1).join('0')
    }
  }
  return x
}

function exportPDF (output, month, year) {
  const doc = new jsPDF.jsPDF('p', 'mm', 'a4')
  doc.text(`Shard Labs: 54`, 10, 20)

  doc.text(`${month}-${year}`, 180, 20)

  doc.text(
    `Total Rewards: ${currency(
      ethers.utils.formatEther(totalVaidatorRewards.toString()),
      {
        symbol: ''
      }
    ).format()}`,
    10,
    28
  )

  doc.text(
    `Total Validator Rewards:  ${currency(
      ethers.utils.formatEther(validatorRewards.sub(commissionedRewards).toString()),
      {
        symbol: ''
      }
    ).format()}`,
    10,
    36
  )

  doc.text(
    `Total Commission Rewards: ${currency(
      ethers.utils.formatEther(commissionedRewards.toString()),
      {
        symbol: ''
      }
    ).format()}`,
    10,
    44
  )

  doc.line(00, 52, 210, 52)

  const daysList = Object.entries(days)
  let offset = 0
  for (let i = daysList.length - 1; i >= 0; i--) {
    const amount = ethers.utils.formatEther(daysList[i][1].toString())
    doc.text(
      `${daysList[i][0]}: ${' '.repeat(80)}${currency(amount, {
        symbol: ''
      }).format()}`,
      10,
      60 + offset * 7
    )
    offset++
  }
  doc.save(output)
}
main()
  .then()
  .catch(e => {
    console.log(e)
    process.exit(1)
  })
