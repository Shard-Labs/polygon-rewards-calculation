#! /bin/bash

# source env vars
source ci/ci.env

# setup node
npm install

# export report Polygon
node index.js year=$YEAR month=$MONTH page=$PAGE offset=$OFFSET

# export report Near
node near.js year=$YEAR month=$MONTH file=$FILE