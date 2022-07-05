# erddap4js - ERDDAP JavaScript interface for the browser & Node

[![Node.js CI](https://github.com/n-a-t-e/erddap4js/workflows/Node.js%20CI/badge.svg)](https://github.com/n-a-t-e/erddap4js/actions)
[![Coverage Status](https://coveralls.io/repos/github/n-a-t-e/erddap4js/badge.svg?branch=master)](https://coveralls.io/github/n-a-t-e/erddap4js?branch=master)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![NPM](https://nodei.co/npm/erddap4js.png?mini=true)](https://npmjs.org/package/erddap4js)

Simple [ERDDAP](https://coastwatch.pfeg.noaa.gov/erddap/index.html) library for JS, written in TypeScript. Works in Node or the browser. Supports tabledap and griddap queries. Browser version is dependency free.

## Quickstart

### Browser example

See a demo in demo/browser/index.html

Copy the file dist/browser/erddap4js.js to the same folder with your HTML file.

```html
<script src="erddap4js.js"></script>
<script>
  document.addEventListener("DOMContentLoaded", async function () {
    const erddapServer = new ERDDAP("https://coastwatch.pfeg.noaa.gov/erddap");

    const tableData = await erddapServer.tabledap({
      dataset: "erdCinpKfmSFNH",
      variables: ["id", "common_name"],
      constraints: [
        ["time", ">=", "2007-06-24T00:00:00Z"],
        ["size", ">=", 140],
        ["common_name", "=~", ".*urchin.*"],
      ],
      distinct: true,
    });
  });
</script>
```

### Node example

The import is different, the rest is the same as the browser example above.

```bash
npm install erddap4js
```

```js
const ERDDAP = require("erddap4js").default;
```

See a demo in demo/node/query.js

## Documentation

- [ERDDAP()](#ERDDAP)
- [tabledap()](#tabledap)
- [griddap()](#griddap)
- [info()](#info)
- [allDatasets()](#allDatasets)

### ERDDAP()

```js
const erddapServer = new ERDDAP("https://coastwatch.pfeg.noaa.gov/erddap");
```

To use debug mode add a second argument of `true`, this will console log URLs of all queries.

### tabledap()

- Everything is case sensitive
- Constraints are ANDed together
- Operators are `!=`, `=~`, `<=`, `>=`, `=`, `<`, `>`
- Order types are: `orderBy`, `orderByClosest`, `orderByCount`, `orderByLimit`, `orderByMax`, `orderByMin`, `orderByMinMax`, `orderByMean`

```js
await erddapServer.tabledap({
  dataset: "erdCinpKfmSFNH",
  variables: ["id", "common_name"],
  constraints: [
    ["time", ">=", "2007-06-24T00:00:00Z"],
    ["common_name", "=~", ".*urchin.*"],
  ],
  orderType: "orderBy", // optional
  orderVariables: ["common_name"], // must have unless it's "orderByCount"
  distinct: true, // optional
});
```

Sample response:

```js
[{ id: "Anacapa (Landing Cove)", common_name: "Red sea urchin" } ... ];
```

### griddap()

- Constraints are set differently for griddap.
- make sure to match number of dimensions with that of the dataset
- dimension properties must be ordered as they appear in the dataset (time, altitude, latitude, longitude)
- to add a `stride` argument (to get every nth value), add another element to the range array, eg `["2010-12-16T12:00:00Z", "2010-12-16T12:00:00Z",3]`

```js
await erddapServer.griddap({
  dataset: "jplAmsreSstMon_LonPM180",
  time: ["2010-12-16T12:00:00Z", "2010-12-16T12:00:00Z"],
  latitude: [50, 50],
  longitude: [-150, -120],
  variables: ["tos", "tosNobs", "tosStderr"],
});
```

Sample response:

```js
[ { time: '2010-12-16T12:00:00Z',
  latitude: 50.5,
  longitude: -150,
  tos: 6.109735,
  tosNobs: 3175,
  tosStderr: 0.6101171 }, ... ]
```

### info()

Get variable and global attribute information for this dataset

```js
await erddapServer.info("erdCinpKfmSFNH");
```

Sample response:

```js
[ { "Row Type": "attribute",
    "Variable Name": "NC_GLOBAL",
    "Attribute Name": "acknowledgement",
    "Data Type": "String",
    "Value": "NOAA NESDIS COASTWATCH, NOAA SWFSC ERD, Channel Islands National Park, National Park Service"
    },
    ...
  { "Row Type": "variable",
    "Variable Name": "longitude",
    "Attribute Name": "",
    "Data Type": "double",
    "Value": "",
  }, ...]
```

### allDatasets()

Get metadata for all datasets- griddap, tabledap and others

```js
await erddapServer.allDatasets();
```

Sample response:

```js
[
  {
    datasetID: 'jplAmsreSstMon',
    accessible: 'public',
    institution: 'Remote Sensing Systems',
    dataStructure: 'grid',
    cdm_data_type: 'Grid',
    class: 'EDDGridSideBySide',
    title: 'AMSRE Model Output, obs4MIPs NASA-JPL, Global, 1 Degree, 2002-2010, Monthly',
      ... many more fields ...
  }, ... ]
```

## CORS

Lots of ERDDAP servers won't support CORS, so you may run into this issue while trying to use ERDDAP in your browser. Read more about [CORS and ERDDAP](https://coastwatch.pfeg.noaa.gov/erddap/download/setup.html#CORS)

## Development

- `npm run build` - build the 'dist' directory
- `npm test` to run tests
- `npm run coverage` - to build a folder 'coverage' to see coverage reports in your browser
- `act` - test Github Actions with [act](https://github.com/nektos/act)
