import { expect } from "chai";
import "mocha";

import { tabledapURLBuilder } from "../src/tabledap";

describe("tabledap", function () {
  it("should generate a tabledap URL", function () {
    expect(
      tabledapURLBuilder({
        dataset: "23",
        variables: ["time"],
        constraints: [["time", ">", "2005-01-01"]]
      })
    ).to.equal("/tabledap/23.json?time&time>2005-01-01");
  });
  it("should generate a tabledap URL", function () {
    expect(
      tabledapURLBuilder({
        dataset: "23",
        variables: ["time"],
        constraints: [["time", ">", "now-7 days"]]
      })
    ).to.equal("/tabledap/23.json?time&time>now-7 days");
  });
  it("should work with quoted or unquoted numerics", function () {
    expect(
      tabledapURLBuilder({
        dataset: "blah",
        variables: ["time"],
        constraints: [["depth", ">", 100], ["depth", "<", "200"]]
      })
    ).to.equal('/tabledap/blah.json?time&depth>100&depth<200');
  });
  it("should quote string values", function () {
    expect(
      tabledapURLBuilder({
        dataset: "blah",
        variables: ["time"],
        constraints: [["species", "=", "hippo"]]
      })
    ).to.equal('/tabledap/blah.json?time&species="hippo"');
  });
  it("should quote all =~ values", function () {
    expect(
      tabledapURLBuilder({
        dataset: "blah",
        variables: ["time"],
        constraints: [["species", "=~", 123]]
      })
    ).to.equal('/tabledap/blah.json?time&species=~"123"');
  });
  it("should work with multiple constraints", function () {
    expect(
      tabledapURLBuilder({
        dataset: "23",
        variables: ["time"],
        constraints: [["time", ">", "2005-01-01"], ["time", "<=", "2005-01-01"]]
      })
    ).to.equal("/tabledap/23.json?time&time>2005-01-01&time<=2005-01-01");

  });
  it("should work without return variables", function () {
    expect(
      tabledapURLBuilder({
        dataset: "23",
        constraints: [["time", ">", "2005-01-01"]]
      })
    ).to.equal("/tabledap/23.json?&time>2005-01-01");
  });
  it("should work without constrains or variables", function () {
    expect(
      tabledapURLBuilder({
        dataset: "23",
      })
    ).to.equal("/tabledap/23.json");
  });
  it("distinct()", function () {
    expect(
      tabledapURLBuilder({
        dataset: "23",
        distinct: true
      })
    ).to.equal("/tabledap/23.json?&distinct()");
  });
  it("orderBy", function () {
    expect(
      tabledapURLBuilder({
        dataset: "23",
        orderType: "orderBy",
        orderVariables: ['time']
      })
    ).to.equal('/tabledap/23.json?&orderBy("time")');
  });
  it("should fail unrecognized options", function () {
    expect(() =>
      tabledapURLBuilder({
        // @ts-ignore
        myNewOption: "TRUE"
      })
    ).to.throw();
  });
  it("should fail with bad order type", function () {
    expect(() =>
      tabledapURLBuilder({
        dataset: "23",
        orderType: "bad bad bad",
        orderVariables: ["time"]
      })
    ).to.throw();
  });
  it("should fail with no dataset specified", function () {
    expect(
      // @ts-ignore
      () => tabledapURLBuilder({})
    ).to.throw();
  });
  it("should fail lat compared to >90 ", function () {
    expect(
      () => tabledapURLBuilder({ dataset: "sdf", constraints: [["latitude", "<=", "1234"]] })
    ).to.throw();
  });

  it("or long compared to >180", function () {
    expect(
      () => tabledapURLBuilder({ dataset: "sdf", constraints: [["longitude", "<=", "1234"]] })
    ).to.throw();
  });

  it("should fail with no orderby variables", function () {
    expect(() =>
      tabledapURLBuilder({
        dataset: "23",
        orderType: "orderByLimit",
        orderVariables: []
      })
    ).to.throw();
  });
  it("should fail with bad constraint operator", function () {
    expect(() =>
      tabledapURLBuilder({
        dataset: "23",
        constraints: [["time", "is more recent than", "2005"]]
      })
    ).to.throw();
  });
});
