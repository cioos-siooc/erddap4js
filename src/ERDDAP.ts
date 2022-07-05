import fetch from "node-fetch";
import { griddapURLBuilder, griddapOptions } from "./griddap";
import { tabledapURLBuilder, tabledapOptions } from "./tabledap";

export default class ERDDAP {
  // url of server, eg, https://example.com/erddap/
  serverURL: string;

  // clean up url

  /**
   * 
   * @param {string} url - URL of erddap server, eg http://example.com/erddap
   * @param {boolean} debug -  Debug mode - turns on some extra console logging
   */
  constructor(url: string, private debug: boolean = false) {
    this.serverURL = ERDDAP.sanitizeERDDAPURL(url);
  }
  static isValid8601DateTime(str: string): boolean {
    if (typeof (str) !== 'string')
      return false

    // from https://stackoverflow.com/questions/28020805/regex-validate-correct-iso8601-date-string-with-time
    const regex8601 = /^(?:\d{4}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1\d|2[0-8])|(?:0[13-9]|1[0-2])-(?:29|30)|(?:0[13578]|1[02])-31)|(?:[1-9]\d(?:0[48]|[2468][048]|[13579][26])|(?:[2468][048]|[13579][26])00)-02-29)T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:Z|[+-][01]\d:[0-5]\d)$/;
    const regex8601DateOnly = /^\d{4}-[01]\d(-[0-3]\d)?$/;
    const isValidDate = Boolean(str.match(regex8601) || str.match(regex8601DateOnly));
    return isValidDate
  }

  static sanitizeERDDAPURL(url: string): string {
    // remove trailing "/"
    url = url.replace(/\/$/, "");

    if (!url.match(/https?:\/\//)?.length) {
      throw new Error("URL Must start wih http or https");
    }
    if (!url.endsWith("/erddap"))
      console.warn(`URL doesn't end in /erddap, trying anyway: ${url}`);
    return url;
  }

  // reshapes ERDDAP's json response so it's easier for web apps to consume
  // see tests/ERDDAP.test.ts for an example of the translation
  static reshapeJSON(erddapJSON: ERDDAP.JSONResponse): Record<string, unknown>[] {
    const { columnNames, rows } = erddapJSON.table;
    // for each row of data 

    return rows.map((rowArray) =>
      // combine the data with the column name to create an object
      rowArray.reduce((rowObject: Record<string, unknown>, value, i) => {
        rowObject[columnNames[i]] = value;
        return rowObject;
      }, {})
    );
  }

  // Query a url path such as "/tabledap/erdCinpKfmSFNH.json?id,size"
  // ERDDAP throws a 404 error when there is no data found, this returns an empty array instead
  async queryURL(urlpath: string): Promise<Record<string, unknown>[]> {
    const urlComplete = this.serverURL + urlpath;
    if (this.debug) console.warn(`FETCHING ${urlComplete}\n`)
    return fetch(urlComplete).then(async response => {
      if (!response.ok) {
        const responseText = await response.text();
        if (response.status == 404 && responseText.includes("nRows = 0"))
          return [];

        // if it wasn't "no-data error" then it's a real error
        throw new Error(`${ERDDAP.errorParser(responseText)}\n\nHTTP ${response.status} error while fetching \n${urlComplete}\n`);
      }
      return response.json().then(ERDDAP.reshapeJSON);
    });
  }
  /**
   * Tabledap query
   * @param {string} options.dataset - The dataset ID
   * @param {Array} options.variables - An array of variables to include in the results
   * @param {Array} options.constraints - Constrains to filter on, eg [["time",">","2005-11"]]
   * @param {boolean} options.distinct - Only return distinct values
   * @param {string} options.orderType - One of orderBy, orderByClosest, orderByCount, orderByLimit, orderByMax, orderByMin, orderByMinMax, orderByMean
   * @param {Array} options.orderVariables - Argument to pass to ordering function given in orderType
   * @returns {Object[]} Results array
   */
  async tabledap(options: tabledapOptions): Promise<Record<string, unknown>[]> {
    return this.queryURL(tabledapURLBuilder(options));
  }

  /**
  * Griddap query
  * @param {string} options.dataset - dataset ID
  * @param {Array} options.variables - An array of variables to include in the results
  * @param {Array} options.time - An array with time range and stride, eg ["2001-01-01T00:00:00Z","2001-01-01T00:00:00Z",2]
  * @param {Array} options.altitude - An array with altitude range
  * @param {Array} options.latitude - An array with latitude range
  * @param {Array} options.longitude - An array with longitude range
  * @returns {Object[]} Results array
  */
  async griddap(options: griddapOptions): Promise<Record<string, unknown>[]> {
    return this.queryURL(griddapURLBuilder(options));
  }

  /**
  * Parses ERDDAP's error responses
  */
  static errorParser(errorMessage: string): string {
    let pattern;
    // parse v1.8 errors
    if (errorMessage.startsWith('<!DOCTYPE html>'))
      pattern = /message\<\/b\> \<u\>(.*?)\<\/u\>/;
    // parse v2 errors
    else pattern = /message=\"(.*)\"/
    const re = new RegExp(pattern).exec(errorMessage) || [];

    if (re.length > 1)
      return re[1].replace(/\\n/g, "\n").replace(/\\/g, '').replace(/&quot;/g, '"');

    return errorMessage;
  }
  /**
   * Get metadata about a dataset, including global and variable attributes
   * @param {string} datasetID
   * @returns {Object[]} Results array
   */
  async info(datasetID: string): Promise<Record<string, unknown>[]> {
    if (!datasetID) throw new Error('Missing dataset ID');

    return this.queryURL(`/info/${datasetID}/index.json`);
  }

  /**
  * Get metadata about all datasets on the server, including griddap and tabledap.
  * Does not include variable information
  * @returns {Object[]} Results array
  */
  async allDatasets(): Promise<Record<string, unknown>[]> {
    // this gets griddap datasets too
    const res = await this.queryURL("/tabledap/allDatasets.json");

    return res
      .filter((e: Record<string, unknown>) => e.datasetID !== "allDatasets");
  }
}

// eslint-disable-next-line @typescript-eslint/no-namespace
namespace ERDDAP {
  // used in parsing ERDDAP's json response
  export interface JSONResponse {
    table: {
      columnNames: string[];
      rows: (string | number)[][];
    };
  }
}
