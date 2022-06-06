# polygon-rewards-calculation

## Setup
1. Run `npm install`

### Export Reports
You can export reports using the following command 

#### Simple export
- Export November 2021 data: **`node index.js year=2021 month=11`**
- Export January  2022 data: **`node index.js year=2022 month=1`**
- Export April    2022 data: **`node index.js year=2022 month=4`**

#### Using Local File
- Export November 2021 data: **`node index.js year=2021 month=11 file={file.json}`**

#### Using Local URL
- Export November 2021 data: **`node index.js year=2021 month=11 url={url}`**

A PDF file will be generated with the name **`${month}-${year}.pdf`**