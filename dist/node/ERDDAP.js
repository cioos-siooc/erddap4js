"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = __importDefault(require("node-fetch"));
const griddap_1 = require("./griddap");
const tabledap_1 = require("./tabledap");
class ERDDAP {
    // clean up url
    /**
     *
     * @param {string} url - URL of erddap server, eg http://example.com/erddap
     * @param {boolean} debug -  Debug mode - turns on some extra console logging
     */
    constructor(url, debug = false) {
        this.debug = debug;
        this.serverURL = ERDDAP.sanitizeERDDAPURL(url);
    }
    static isValid8601DateTime(str) {
        if (typeof (str) !== 'string')
            return false;
        // from https://stackoverflow.com/questions/28020805/regex-validate-correct-iso8601-date-string-with-time
        const regex8601 = /^(?:\d{4}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1\d|2[0-8])|(?:0[13-9]|1[0-2])-(?:29|30)|(?:0[13578]|1[02])-31)|(?:[1-9]\d(?:0[48]|[2468][048]|[13579][26])|(?:[2468][048]|[13579][26])00)-02-29)T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:Z|[+-][01]\d:[0-5]\d)$/;
        const regex8601DateOnly = /^\d{4}-[01]\d(-[0-3]\d)?$/;
        const isValidDate = Boolean(str.match(regex8601) || str.match(regex8601DateOnly));
        return isValidDate;
    }
    static sanitizeERDDAPURL(url) {
        var _a;
        // remove trailing "/"
        url = url.replace(/\/$/, "");
        if (!((_a = url.match(/https?:\/\//)) === null || _a === void 0 ? void 0 : _a.length)) {
            throw new Error("URL Must start wih http or https");
        }
        if (!url.endsWith("/erddap"))
            console.warn(`URL doesn't end in /erddap, trying anyway: ${url}`);
        return url;
    }
    // reshapes ERDDAP's json response so it's easier for web apps to consume
    // see tests/ERDDAP.test.ts for an example of the translation
    static reshapeJSON(erddapJSON) {
        const { columnNames, rows } = erddapJSON.table;
        // for each row of data 
        return rows.map((rowArray) => 
        // combine the data with the column name to create an object
        rowArray.reduce((rowObject, value, i) => {
            rowObject[columnNames[i]] = value;
            return rowObject;
        }, {}));
    }
    // Query a url path such as "/tabledap/erdCinpKfmSFNH.json?id,size"
    // ERDDAP throws a 404 error when there is no data found, this returns an empty array instead
    queryURL(urlpath) {
        return __awaiter(this, void 0, void 0, function* () {
            const urlComplete = this.serverURL + urlpath;
            if (this.debug)
                console.warn(`FETCHING ${urlComplete}\n`);
            return node_fetch_1.default(urlComplete).then((response) => __awaiter(this, void 0, void 0, function* () {
                if (!response.ok) {
                    const responseText = yield response.text();
                    if (response.status == 404 && responseText.includes("nRows = 0"))
                        return [];
                    // if it wasn't "no-data error" then it's a real error
                    throw new Error(`${ERDDAP.errorParser(responseText)}\n\nHTTP ${response.status} error while fetching \n${urlComplete}\n`);
                }
                return response.json().then(ERDDAP.reshapeJSON);
            }));
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
    tabledap(options) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.queryURL(tabledap_1.tabledapURLBuilder(options));
        });
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
    griddap(options) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.queryURL(griddap_1.griddapURLBuilder(options));
        });
    }
    /**
    * Parses ERDDAP's error responses
    */
    static errorParser(errorMessage) {
        let pattern;
        // parse v1.8 errors
        if (errorMessage.startsWith('<!DOCTYPE html>'))
            pattern = /message\<\/b\> \<u\>(.*?)\<\/u\>/;
        // parse v2 errors
        else
            pattern = /message=\"(.*)\"/;
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
    info(datasetID) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!datasetID)
                throw new Error('Missing dataset ID');
            return this.queryURL(`/info/${datasetID}/index.json`);
        });
    }
    /**
    * Get metadata about all datasets on the server, including griddap and tabledap.
    * Does not include variable information
    * @returns {Object[]} Results array
    */
    allDatasets() {
        return __awaiter(this, void 0, void 0, function* () {
            // this gets griddap datasets too
            const res = yield this.queryURL("/tabledap/allDatasets.json");
            return res
                .filter((e) => e.datasetID !== "allDatasets");
        });
    }
}
exports.default = ERDDAP;
