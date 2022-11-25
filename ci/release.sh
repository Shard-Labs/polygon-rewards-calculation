#! /bin/bash

# source env vars
source ci/ci.env

# setup node
npm install

# export report Polygon
# node index.js year=$YEAR month=$MONTH
node index.js year=$YEAR month=9 useFile=true
node index.js year=$YEAR month=8 useFile=true
node index.js year=$YEAR month=7 useFile=true
node index.js year=$YEAR month=6 useFile=true
node index.js year=$YEAR month=5 useFile=true
node index.js year=$YEAR month=4 useFile=true
node index.js year=$YEAR month=3 useFile=true
node index.js year=$YEAR month=2 useFile=true
node index.js year=$YEAR month=1 useFile=true

# export report Near
# node near.js year=$YEAR month=$MONTH file=$FILE