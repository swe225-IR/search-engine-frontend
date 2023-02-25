import Vue from 'vue'
import Vuex from 'vuex'
import API from '../assets/js/api'
import analyticsModule from './modules/analytics';
// import API from '@/assets/js/api.js';

Vue.use(Vuex)

const api = new API();

export default new Vuex.Store({
  modules: {
    analytics: analyticsModule,
  },
  state: {
    results: {
      query: ``,
      hits: [],
      totalHits: 0,
    },
    pageSize: 40,
    lowestPage: 0,
    loadingLinkInfo: false,
  },
  mutations: {
    UPDATE_RESULTS(state, newResults) {
      state.results = newResults;
    },
    UPDATE_LOWEST_PAGE(state, newLowestPage) {
      state.lowestPage = newLowestPage;
    },
  },
  actions: {
    async search(context, { query, page }) {

      context.commit(`UPDATE_RESULTS`, {
        hits: [],
        totalHits: 0,
        query,
      })

      let result;
      try {


        if (page) {

          // don't load all previous pages if search starts at a very high page (e.g. after a reload)
          if (page * context.getters.pageSize > 1000) {

            result = await api.search(query, (page-1) * context.getters.pageSize, context.getters.pageSize);
            context.commit(`UPDATE_LOWEST_PAGE`, page);

          } else {

            result = await api.search(query, 0, page * context.getters.pageSize);
            context.commit(`UPDATE_LOWEST_PAGE`, 1);

          }

        } else {

          result = await api.search(query, 0, context.getters.pageSize);
          context.commit(`UPDATE_LOWEST_PAGE`, 1);

        }

      } catch (err) {
        console.warn(err);
        throw new Error(`Couldn't load results!`);
      }

      if (result.query !== query) {
        console.warn(`Query got corrupted on the way!`);
        await context.dispatch(`analytics/trackEvent`, `corruptedQuery`);
      }

      context.commit('UPDATE_RESULTS', result);
    },
    async loadNextPage(context) {
      let result;
      if (context.getters.results.totalHits <= (context.getters.lowestPage - 1) * context.getters.pageSize + context.getters.results.hits.length) {
        throw new Error("No more pages!");
      }
      try {
          result = await api.search(context.getters.results.query, (context.getters.lowestPage-1)*context.getters.pageSize + context.getters.results.hits.length, context.getters.pageSize);
      } catch (err) {
        console.warn(err);
        throw new Error(`Couldn't load additional results!`);
      }

      if (result.query !== context.getters.results.query) {
        console.warn(`Query got corrupted on the way!`);
      }

      // combine the new results with the existing ones
      result.hits = [...context.getters.results.hits, ...result.hits];

      context.commit('UPDATE_RESULTS', result);

    },
  },
  getters: {
    results: state => state.results,
    pageSize: state => state.pageSize,
    lowestPage: state => state.lowestPage,
    loadingLinkInfo: state => state.loadingLinkInfo,
  }
})
