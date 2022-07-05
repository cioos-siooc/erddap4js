/*

Griddap query builder

example options:
{
  dataset: "jplAmsreSstMon_LonPM180",
  time: ["2010-12-16T12:00:00Z", "2010-12-16T12:00:00Z"],
  latidude: [50, 50],
  longitude: [-150, -120],
  variables: ['tos', 'tosNobs', 'tosStderr']
}

Any grid dimensions will work, as long as they are specified in the same order as the dataset
*/

import ERDDAP from "./ERDDAP";

export interface griddapOptions {
  dataset: string;
  variables: string[];
  [key: string]: any;
}
function isValidGriddapTime(str: string): boolean {
  if (str.startsWith('last')) return true;
  if (str.includes('NaN') || str.includes('now')) return false;
  return ERDDAP.isValid8601DateTime(str);
}

// erdddap can have values eg 'last' or 'last-10.5' refer to last value in dataset?
export function griddapURLBuilder(options: griddapOptions): string {
  if (!options) throw new Error("Must supply options object")
  const { dataset, variables } = options;

  if (!dataset) throw new Error("Missing dataset");

  const dimensions = Object.keys(options).filter(key => !['dataset', 'variables'].includes(key))

  if (!dimensions.length) throw new Error(`Must give at least one dimension. One of ${dimensions.join()}`)

  const triplets = dimensions.map((dimension: string) => {
    const value = options[dimension];
    const dimensionArr = value || []

    if (dimensionArr.length && dimensionArr.length < 2)
      throw new Error(`Must supply Start and Stop for dimension "${dimension}". eg "depth: [1,2]"`);

    const [start, stop, stride] = dimensionArr;

    if (typeof (stride) !== 'undefined' && (!Number.isInteger(stride) || Number.parseInt(stride) == 0))
      throw new Error(`Invalid stride: '${stride}'. Must be an integer !=0`)

    if (start == null || stop == null)
      throw new Error(`Must supply start and stop values for dimension '${dimension}`)

    // 'last' allowed as value in  all fields
    if (!(typeof (value) == 'string' && value.startsWith('last'))) {
      switch (dimension) {
        case 'time':
          if (!isValidGriddapTime(start) || !isValidGriddapTime(stop))
            throw new Error(`Invalid time: ${value}. Must be in format yyyy-MM-ddTHH:mm:ssZ`);
          break;
        case 'latitude':
        case 'lat':
          break;
        case 'longitude':
        case 'lon':
        case 'long':
          break;
        case 'depth':
          break;
        case 'altitude':
          break;
        default:
          break;
      }
    }
    return `[(${start}):${stride || 1}:(${stop})]`;

  }).filter(e => e);
  if (!triplets.length) throw new Error("Must filter on at least one dimension.")
  const joined = variables.map(var1 => var1 + "" + triplets.join("")).join();

  const query = `/griddap/${dataset}.json?${joined}`;

  return query;
}
