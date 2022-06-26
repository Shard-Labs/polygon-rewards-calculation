const process = require('process')
const axios = require('axios').default
const ethers = require('ethers')
const jsPDF = require('jspdf')
const fs = require('fs')
const currency = require('currency.js')
const parseCSV = require('csv-parser')

const rewardKey = "Rewards Ⓝ"

async function main () {
  // configuration
  config = {
    // the month
    month: 1,
    // sentinel url endpoint
    year: 2022,
    // url
    url: '',
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

  const { month, year } = config
  const dir = 'reports'
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
  }
  const output = `${dir}/near-${month}-${year}.pdf`

  let rewardsPerDay = {}
  let rewardsPerMonth = 0
  fs.createReadStream('./near_data.csv')
    .pipe(parseCSV({}))
    .on('data', data => {
      const { date } = data
      const dateTime = new Date(String(date).split(' ')[0])
      if (dateTime.getMonth() + 1 == month) {
        if (rewardsPerDay[dateTime.getDate()] === undefined) {
          rewardsPerDay[dateTime.getDate()] = 0
        }
        rewardsPerDay[dateTime.getDate()] = data[rewardKey]
        rewardsPerMonth += Number(data[rewardKey])
      }
    })
    .on('end', () => {
      exportPDF(output, rewardsPerMonth, rewardsPerDay, month, year)
    })
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

function exportPDF (output, rewardsPerMonth, rewardsPerDay, month, year) {
  const doc = new jsPDF.jsPDF('p', 'mm', 'a4')
  doc.text(`Shard Labs: jakov-shardlabs.near`, 10, 20)

  doc.text(`${month}-${year}`, 160, 20)

  doc.text(
    `Total Rewards: ${currency(rewardsPerMonth, {
      symbol: ''
    }).format()}`,
    10,
    28
  )

  doc.line(00, 36, 210, 36)

  let offset = 0
  for (const key in rewardsPerDay) {
    let day = `${key}-${month}-${year}`
    if (Number(key) <= '9' && Number(key) >= '0') {
      day = '0' + day
    }
    doc.text(
      `${day}: ${' '.repeat(80)}${rewardsPerDay[key]}`,
      10,
      44 + offset * 7
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
