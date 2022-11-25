const fs = require('fs')
const jsPDF = require('jspdf')
const currency = require('currency.js')
const ethers = require('ethers')

function exportPolygonPDF (data, output, month, year) {
  if (!fs.existsSync('reports')) {
    fs.mkdirSync('reports', { recursive: true })
  }

  const { polygonData, ethereumData } = data
  const doc = new jsPDF.jsPDF('p', 'mm', 'a4')
  doc.text(`Shard Labs: 54`, 10, 20)

  doc.text(`${month}-${year}`, 180, 20)

  doc.text(
    `Ethereum Rewards: ${currency(
      ethers.utils.formatEther(ethereumData.totalValidatorReward.toString()),
      {
        symbol: ''
      }
    ).format()}`,
    10,
    28
  )

  // doc.text(
  //   `Total Ethereum Validator Rewards:  ${currency(
  //     ethers.utils.formatEther(
  //       ethereumData.totalValidatorReward
  //         .sub(ethereumData.totalComissionReward)
  //         .toString()
  //     ),
  //     {
  //       symbol: ''
  //     }
  //   ).format()}`,
  //   10,
  //   36
  // )

  // doc.text(
  //   `Total Ethereum Commission Rewards: ${currency(
  //     ethers.utils.formatEther(ethereumData.totalComissionReward.toString()),
  //     {
  //       symbol: ''
  //     }
  //   ).format()}`,
  //   10,
  //   44
  // )

  // doc.line(00, 52, 210, 52)

  doc.text(
    `Polygon Rewards: ${currency(
      ethers.utils.formatEther(polygonData.totalRewards.toString()),
      {
        symbol: ''
      }
    ).format()}`,
    10,
    36
  )

  doc.text(
    `Total Rewards: ${currency(
      ethers.utils.formatEther(polygonData.totalRewards.add(ethereumData.totalValidatorReward).toString()),
      {
        symbol: ''
      }
    ).format()}`,
    10,
    44
  )

  doc.line(00, 52, 210, 52)

  const ethDaysList = ethereumData.dailyRewards
  const polDaysList = polygonData.dailyRewards
  let offset = 0

  doc.text(`Date ${' '.repeat(60)} Polygon ${' '.repeat(10)} Ethereum`, 10, 60)

  for (let i = ethDaysList.length - 1; i >= 0; i--) {
    doc.text(`${ethDaysList[i].date}`, 10, 68 + offset * 7)

    const ethAmount = ethers.utils.formatEther(
      ethDaysList[i].rewards.toString()
    )

    const polygonReward = polDaysList[ethDaysList[i].date]
    console.log(ethDaysList[i]?.date, polygonReward)
    if (polygonReward) {
      const polAmount = ethers.utils.formatEther(
        polygonReward.rewards.toString()
      )
      doc.text(
        `${' '.repeat(72)}${currency(polAmount, {
          symbol: ''
        }).format()}`,
        10,
        68 + offset * 7
      )
    } else {
      doc.text(`${' '.repeat(72)} ${'  -'}`, 10, 68 + offset * 7)
    }

    doc.text(
      `${' '.repeat(100)}${currency(ethAmount, {
        symbol: ''
      }).format()}`,
      10,
      68 + offset * 7
    )
    offset++
  }
  doc.save(output)
}

module.exports = {
  exportPolygonPDF
}
