/*

tabledap query builder


*/

import ERDDAP from "./ERDDAP";

const operators = ["!=", "=~", "<=", ">=", "=", "<", ">"];

export interface tabledapOptions {
  dataset: string;
  variables?: string[];
  constraints?: any[][];
  distinct?: boolean;
  orderType?: string;
  orderVariables?: string[];
}

export function tabledapURLBuilder(options: tabledapOptions): string {
  {
    const {
      dataset,
      variables = [],
      constraints = [],
      distinct,
      orderType,
      orderVariables = []
    } = options;

    // validate constraints
    const orderByOptions = [
      "orderBy",
      "orderByClosest",
      "orderByCount",
      "orderByLimit",
      "orderByMax",
      "orderByMin",
      "orderByMinMax",
      "orderByMean"
    ];

    const optionFieldNames = ['dataset', 'variables', 'constraints', 'distinct', 'orderType', 'orderVariables']

    Object.keys(options).forEach(k => {
      if (!optionFieldNames.includes(k)) {
        throw new Error(`Option '${k}' is not supported. The options are: ${optionFieldNames}`)
      }
    })

    if (!dataset) throw new Error("Missing 'dataset' option");

    if (orderType) {
      if (!orderByOptions.includes(orderType)) {
        throw new Error(
          `Order type given was '${orderType}'. It must be one of: ${orderByOptions}`
        );
      }
      // orderByCount doesnt need a variable list
      if (!orderVariables.length && orderType !== 'orderByCount') {
        throw new Error("At least one variable must be given to order by. eg {..., orderVariables: ['time']}");
      }
    }
    // constraints should be an array of arrays
    constraints.forEach(constraint => {
      if (constraint.length !== 3)
        throw new Error("Constraint must be an array of arrays with 3 elements, eg constraints: [['temperature','>=',1]] ");

      const [variable, operator, value] = constraint;

      // ERDDAP expects text to be quoted
      if (variable !== 'time' && (operator == '=~' ||
        (typeof value == 'string' && isNaN(value as any) && !(value.startsWith('"') && value.endsWith('"'))))) {
        constraint[2] = `"${value}"`;
      }

      if (!operators.includes(operator))
        throw new Error(
          `Invalid operator: '${operator}'. Must be one of: '${operators}'`
        );
      // NaN is usually allowed
      if (value !== 'NaN') {

        // some basic type checking of special case variables (LLAT variables)
        switch (variable) {
          case "time":
            // Allowed: "1985-07-01T00:00:00Z", "2005-12","now","NaN", "now-7 days" etc
            if (!ERDDAP.isValid8601DateTime(value) && !value.startsWith('now') && value != "NaN")
              throw new Error(`Invalid date: "${value}". Should look like: 2005-07-01T00:00:00Z, 2005-07-05, 2005-06`);
            break;
          case "latitude":
          case "lat":
            if (Math.abs(value) > 90)
              throw new Error("Invalid lat: " + value);
            break;
          case "longitude":
          case "lon":
            if (Math.abs(value) > 180)
              throw new Error("Invalid long: " + value);
            break;

          case "depth":
          case "altitude":
            if (parseFloat(value) == NaN)
              throw new Error("Invalid depth/altitude: " + value);
            break;
        }
      }
    });

    let query = `/tabledap/${dataset}.json`;

    const expressions = [];
    if (variables.length) expressions.push(variables.join());
    else console.warn("No 'variables' field given, retrieving all variables")
    if (constraints.length)
      expressions.push(constraints.map(e => e.join("")).join("&"));
    if (distinct) expressions.push("distinct()");
    if (orderType && orderVariables)
      expressions.push(`${orderType}("${orderVariables.join()}")`);

    // erddap requires the '?&' if there are no return variables
    if (expressions.length) query += '?' + (variables.length ? '' : '&') + expressions.join("&");

    return query;
  }
}
