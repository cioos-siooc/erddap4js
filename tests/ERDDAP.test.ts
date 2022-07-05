import { expect } from "chai";
import "mocha";

import ERDDAP from "../src/ERDDAP";
describe("ERDDAP class", function () {

  describe("constructor()", function () {
    it("constructs", function () {
      const erddapServer = new ERDDAP("http://example.com/erddap/", true)
      expect(erddapServer.serverURL).to.eq("http://example.com/erddap")
    })
  });

  describe("reshapeJSON", function () {
    it("reshapes ERDDAP's json response to an array of objects", function () {
      const input = {
        table: {
          columnNames: ["a", "b", "c"],
          rows: [
            ["val1", "val2", "val3"],
            ["val4", "val5", "val6"]
          ]
        }
      };

      const expected = [
        {
          a: "val1",
          b: "val2",
          c: "val3"
        },
        {
          a: "val4",
          b: "val5",
          c: "val6"
        }
      ];
      const output = ERDDAP.reshapeJSON(input);
      expect(output).deep.equal(expected);
    });
  });

  describe("sanitizeERDDAPURL", function () {
    it("validates and sanitizes ERDDAP server URL", function () {
      expect(ERDDAP.sanitizeERDDAPURL("http://example.com/erddap/")).to.equal(
        "http://example.com/erddap"
      );
      expect(() => ERDDAP.sanitizeERDDAPURL("example.com/erddap/")).to.throw();
    });
  });
  describe("isValid8601DateTime", function () {
    it("validates times", function () {
      expect(ERDDAP.isValid8601DateTime("not a time")).to.equal(false);
    });
    it("accepts ISO 8601 strings", function () {
      expect(ERDDAP.isValid8601DateTime("2020-03-13T12:00:00Z")).to.equal(true);
    });
  });


  /*
  Error {
    code=400;
    message="Bad Request: Query error: Unrecognized constraint variable="a".";
  }
  */


  describe("ERDDAP.errorParser", function () {
    it("returns error message", function () {
      expect(ERDDAP.errorParser(
        `Error {
          code=400;
          message="Bad Request: Query error: Unrecognized constraint variable="a".";
      }`
      )).to.equal(
        'Bad Request: Query error: Unrecognized constraint variable="a".'
      );

    });
    it("returns error message for older erddap as well", function () {
      expect(ERDDAP.errorParser(
        `<!DOCTYPE html><html><head><title>Apache Tomcat/8.5.11 - Error report</title><style type="text/css">h1 {font-family:Tahoma,Arial,sans-serif;color:white;background-color:#525D76;font-size:22px;} h2 {font-family:Tahoma,Arial,sans-serif;color:white;background-color:#525D76;font-size:16px;} h3 {font-family:Tahoma,Arial,sans-serif;color:white;background-color:#525D76;font-size:14px;} body {font-family:Tahoma,Arial,sans-serif;color:black;background-color:white;} b {font-family:Tahoma,Arial,sans-serif;color:white;background-color:#525D76;} p {font-family:Tahoma,Arial,sans-serif;background:white;color:black;font-size:12px;} a {color:black;} a.name {color:black;} .line {height:1px;background-color:#525D76;border:none;}</style> </head><body><h1>HTTP Status 500 - Your query produced no matching results. Query error: For variable=lat_coamps axis#1=lon Constraint=&quot;[(-150):1:(-150)]&quot;: Start=&quot;-150&quot; is less than the axis minimum=0 (and even -0.0).</h1><div class="line"></div><p><b>type</b> Status report</p><p><b>message</b> <u>Your query produced no matching results. Query error: For variable=lat_coamps axis#1=lon Constraint=&quot;[(-150):1:(-150)]&quot;: Start=&quot;-150&quot; is less than the axis minimum=0 (and even -0.0).</u></p><p><b>description</b> <u>The server encountered an internal error that prevented it from fulfilling this request.</u></p><hr class="line"><h3>Apache Tomcat/8.5.11</h3></body></html>`
      )).to.equal(
        'Your query produced no matching results. Query error: For variable=lat_coamps axis#1=lon Constraint="[(-150):1:(-150)]": Start="-150" is less than the axis minimum=0 (and even -0.0).'
      );

    });
  });
  describe("ERDDAP.isValid8601DateTime", function () {
    it("parses dates", function () {
      expect(ERDDAP.isValid8601DateTime('1985-07-01T00:00:00Z'), "1").to.be.true;
      expect(ERDDAP.isValid8601DateTime('2001-01-01'), "2").to.be.true;
      expect(ERDDAP.isValid8601DateTime('2010-02'), "3").to.be.true;
      // expect(ERDDAP.isValid8601DateTime('now'), "4").to.be.true;
      // expect(ERDDAP.isValid8601DateTime('NaN'), "5").to.be.true;
      expect(ERDDAP.isValid8601DateTime('2005'), "6").to.be.false;
    });
  });
})