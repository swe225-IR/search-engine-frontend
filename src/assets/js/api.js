export default class API {

    constructor() {
        this.apiEndpoint = `/api_v2`;
    }

    parseResult(rawResults, query) {
        return {
            hits: this.parseHits(rawResults.data.hits),
            totalHits: rawResults.data.total_number,
            queryTime: rawResults.data.query_time,
            query,
        };

    }

    parseHits(rawHits) {
        return rawHits.map(hit => {
            return {
                id: hit.doc_id,
                score: hit.score,
                data: hit.source,
            }
        })
    }

    /**
     *
     * @param {String} query The search query
     * @param {Number} offset The amount of results to skip
     * @param {Number} limit The page size
     * @param {Object} [options] Advanced search options
     * @param {Boolean} [options.filenameOnly] Only search filename?
     * @param {Boolean} [options.matchPhrase] Use (exact) phrase matching instead of regular matching?
     * @param {Object} [options.extensions] Manage file extensions of search results
     * @param {String} [options.extensions.mode="off"] What to do with these extensions (include or exclude)
     * @param {Array<String>} [options.extensions.list] Array of extensions that will be included/excluded
     */
    // eslint-disable-next-line no-unused-vars
    /*  search(query, offset = 0, limit = 20, options = {}) {
        return new Promise((resolve, reject) => {

          options.filenameOnly = options.filenameOnly || false;
          options.matchPhrase = options.matchPhrase || false;
          options.extensions = options.extensions || {};
          options.extensions.mode = options.extensions.mode || `off`;
          options.extensions.list = options.extensions.list || [];

          options = JSON.parse(JSON.stringify(options))

          // remove leading dots
          options.extensions.list = options.extensions.list.map(x => {
            if (x[0] === `.`) {
              return x.slice(1)
            } else {
              return x
            }
          })
          console.log(`options.extensions.list:`, options.extensions.list)
          //TODO hopefully temporary workaround until `extension` field is changed to be case-insensitive in Elasticsearch
          options.extensions.list = [...options.extensions.list, ...options.extensions.list.map(x => x.toLowerCase()), ...options.extensions.list.map(x => x.toUpperCase())]


          let requestBody = {
            size: limit,
            from: offset,
            highlight: {
              fields: {
                url: {},
                filename: {},
              }
            }
          }

          let searchField;
          if (options.filenameOnly) {
            searchField = {
              filename: query, // search filename field
            }
          } else {
            searchField = {
              url: query, // search url field
            }
          }

          requestBody.query = {
            bool: {
              must: [
                options.matchPhrase ? { match_phrase: searchField } : { match: searchField },
              ],
              should: [
                options.matchPhrase ? { match_phrase: { filename: query } } : { match: { filename: query } }  // make results that include the query in the filename have a higher score when searching the url field
              ],
              must_not: [],
            }
          }

          let filterTerm = {
            terms: {
              extension: options.extensions.list
            },
          }

          if (options.extensions.mode === `include`) {
            requestBody.query.bool.must.push(filterTerm)
          } else if (options.extensions.mode === `exclude`) {
            requestBody.query.bool.must_not.push(filterTerm)
          }

          console.log(`requestBody:`, requestBody);

          fetch(`${this.apiEndpoint}?q=${query}`, {
            mode: 'cors',
            method: 'GET',
            // headers: {
            //   // 'Content-Type': 'application/json',
            //
            // },
            // body: JSON.stringify(requestBody),
          })
          .then(response => {
            return response.json();
          })
          .then(result => {
            return resolve(this.parseResult(result, query, options));
          })
          .catch(err => {
            console.warn(`Failed to fetch results:`, err);
            return reject(`Couldn't fetch results!`);
          })

        })
      }*/

    // eslint-disable-next-line no-unused-vars
    search(query, offset = 0, limit = 20, options = {}) {
        return new Promise((resolve, reject) => {
            let url = `/api_v2/query?q=` + encodeURIComponent(`${query}`) + `&offset=` + encodeURIComponent(`${offset}`) + `&limit=` + encodeURIComponent(`${limit}`)
            fetch(url, {method: 'GET'})
                .then(response => {
                    return response.json();
                })
                .then(result => {
                    return resolve(this.parseResult(JSON.parse(result), query));
                })
                .catch(err => {
                    console.warn(`Failed to fetch results:`, err);
                    return reject(`Couldn't fetch results!`);
                })

        })
    }
}