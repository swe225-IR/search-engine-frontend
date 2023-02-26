<template>
  <div
      class="w-full h-full p-4"
  >

    <vue-headful :title="pageTitle"/>

    <div
        class="flex-row justify-start md:flex md:mb-4"
    >

      <div
          class="flex-shrink-0 text-center md:w-20 md:text-left"
      >
        <router-link
            class="hover:text-green-400"
            :to="{
            name: `Home`
          }"
        >
          <h1
              class="text-3xl font-semibold cursor-pointer md:py-1"
          >
            <span class="hidden md:inline">LHL</span>
            <span class="inline md:hidden">LHL Search Engine</span>
          </h1>
        </router-link>

      </div>

      <SearchField
          class="h-auto ml-0 md:w-3/5 lg:w-256"
          v-model="searchQuery"
          v-observe-visibility="handleVisibilityChanged"
          :focus="false"
          :placeholder="`${results.queryTime}`"
          @search="search(searchQuery)"/>


            <div class="flex flex-row flex-grow-0 h-12 mt-1 ml-2 text-base md:w-2/5">
              <div class="flex flex-col justify-center h-full pr-2 text-lg font-bold tracking-wider">
                <span>Query Time:</span>
              </div>
              <div class="flex flex-row h-full overflow-hidden">
                <div class="flex flex-col justify-center h-auto leading-4 break-words">
                  <span>{{ results.queryTime }} s</span>
                </div>
              </div>
            </div>

      <div class="flex flex-row flex-grow-0 h-12 mt-1 ml-2 text-base md:w-2/5">
        <div class="flex flex-col justify-center h-full pr-2 text-lg font-bold tracking-wider">
          <span>Total Items:</span>
        </div>
        <div class="flex flex-row h-full overflow-hidden">
          <div class="flex flex-col justify-center h-auto leading-4 break-words">
            <span>{{ results.totalHits }} web pages</span>
          </div>
        </div>

      </div>

    </div>

    <transition
        name="scrollToTopButton"
        enter-active-class="transition-transform duration-300 transform motion-reduce:transition-none"
        enter-class="translate-x-32"
        enter-to-class=""
        leave-active-class="transition-transform duration-300 transform motion-reduce:transition-none"
        leave-class=""
        leave-to-class="translate-x-32"
    >
      <div
          class="fixed bottom-0 right-0 w-12 h-12 mb-10 mr-10 bg-gray-100 border border-black rounded-md shadow-lg cursor-pointer dark:border-gray-700 dark:bg-gray-900"
          v-if="scrollToTopButton"
          @click="scrollToTop"
      >
        <svg
            class="w-full h-full text-gray-700"
            width="84"
            height="84"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
            xmlns="http://www.w3.org/2000/svg"
        >
          <title>Back to top</title>
          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
          <polyline points="6 15 12 9 18 15"/>
        </svg>
      </div>
    </transition>

    <ResultList
        class="flex flex-row justify-start w-full h-auto pb-16"
        :results="results"
        :pageSize="pageSize"
        :lowestPage="lowestPage"
        :scrollToInitialPage="highestPage"
        :message="message"
        :disableInfiniteScroll="infiniteScrollDisabled"
        @end-of-list="loadNextPage"
        @message-button="handleMessageButton($event)"
    />

  </div>
</template>

<script>

import SearchField from '@/components/SearchField';
import ResultList from '@/components/ResultList';

export default {
  name: `Search`,
  components: {
    SearchField,
    ResultList,
  },
  data: function () {
    return {
      searchQuery: ``,
      message: {
        text: ``,
        level: `normal`,
      },
      highestPage: 1,
      loadingResults: false,
      orientation: window.screen.orientation ? window.screen.orientation.type : `landscape-primary`,
      scrollToTopButton: false,
      initialPage: 1,
    };
  },
  computed: {
    results: function () {
      return this.$store.getters.results;
    },
    stats: function () {
      return this.$store.getters.stats;
    },
    pageSize: function () {
      return this.$store.getters.pageSize;
    },
    lowestPage: function () {
      return this.$store.getters.lowestPage;
    },
    infiniteScrollDisabled: function () {

      return this.results.hits.length === 0 || (this.results.hits.length % this.pageSize) !== 0 || this.loadingResults || this.highestPage === 0;
    },
    pageTitle: function () {
      return this.searchQuery === `` ? `LHL Search Engine` : `LHL - ${this.searchQuery}${this.highestPage > 1 ? ` (${this.highestPage})` : ``}`;
    },
  },
  methods: {
    async search(query, page = 1) {

      console.log(`query:`, query)
      if (query === ``) {
        console.warn(`Empty query`)
        return this.$router.push({
          to: `Home`,
        })
      }

      try {

        // update the query in the URL path
        if (page === 1 || this.initialPage <= 1) {
          this.$router.push({
            name: `Search`,
            params: {
              query,
            },
          })
        } else {
          this.$router.push({
            name: `Search`,
            // inline parameters
            params: {
              query,
            },
            // query parameters
            query: {
              p: this.initialPage,
            }
          })
        }

        this.loadingResults = true;
        this.message = {
          text: `Loading Results...`,
          level: `normal`,
        }
        this.$store.dispatch(`search`, {query, page});
        this.highestPage = page;

        if (this.$route.query.p && Number(this.$route.query.p) !== this.highestPage) {
          this.$router.push({
            name: `Search`,
            // inline parameters
            params: {
              query,
            },
            // query parameters
            query: {
              p: this.highestPage,
            }
          })
        }

        if (this.results.hits.length === 0) {
          this.message = {
            text: `No links found!`,
            level: `warning`,
          }
        } else {
          this.message = {
            text: ``,
            level: ``,
          }
        }

        return true;

      } catch (err) {

        this.message = {
          text: `Couldn't load search results :/`,
          level: `error`,
        }
        console.error(err);
        return false;

      } finally {
        this.loadingResults = false;
      }

    },
    async loadNextPage() {

      if (this.lowestPage === 0) {
        return;
      }

      // elastic search only serves the first 10k results over the regular API
      if ((this.highestPage + 1) * this.$store.getters.pageSize > 10000) {
        this.message = {
          text: `Sorry, but as of now we can only show you the first 10000 results. If you need more, please either use the database dump or contact us about this issue!`,
          level: `warning`,
          button: {
            label: `Download Database Dump`,
            payload: `dbDump`,
          },
        }

        await this.$store.dispatch(`analytics/trackEvent`, `resultLimitExceeded`);
        return
      }

      // console.log(`this.$store.getters.results.hits:`, this.$store.getters.results.hits);

      if (!(this.$store.getters.results.hits.length > 0)) {
        return;
      }

      this.message = {
        text: `Loading the next Page...`,
        level: `normal`,
      }

      await this.$store.dispatch(`analytics/trackEvent`, `loadNextPage`);

      try {

        this.loadingResults = true;
        await this.$store.dispatch(`loadNextPage`);
        this.highestPage = this.highestPage + 1;

        await this.$router.push({
          path: this.$router.path,
          // inline parameters
          params: {
            query: this.searchQuery,
          },
          // query parameters
          query: {
            p: this.highestPage,
          }
        })

        console.log(`this.highestPage:`, this.highestPage)

        if (this.results.hits.length === 0) {
          this.message = {
            text: `No more links to load!`,
            level: `normal`,
          };
        } else {
          this.message.text = ``;
        }

      } catch (err) {
        if (err.message === `No more pages!`){
          this.message = {
            text: `No more links to load!`,
            level: `normal`,
          };
        } else {
          this.message = {
            text: `Error while loading more links :/`,
            level: `error`,
            button: {
              label: `Retry`,
              payload: `loadNextPage`,
            }
          }
        }

      } finally {
        this.loadingResults = false;
      }

    },
    handleOrientationChange() {
      this.orientation = window.screen.orientation ? window.screen.orientation.type : `landscape-primary`;
    },
    handleVisibilityChanged(isVisible) {
      this.scrollToTopButton = !isVisible
    },
    handleMessageButton(payload) {

      switch (payload) {
        case `loadNextPage`:
          this.loadNextPage();
          break;
        case `dbDump`:
          this.$router.push({
            name: `Download`,
          })
          break;

        default:
          break;
      }

    },
    scrollToTop() {
      scrollTo(0, 0)
    }
  },
  created() {

    this.searchQuery = this.query;

  },
  mounted() {

    this.searchQuery = this.$route.params.query;
    console.log(`this.searchQuery:`, this.searchQuery)
    let currentPage = Number(this.$route.query.p) || 0;

    if (this.searchQuery !== ``) {

      if (currentPage > 1) {
        this.initialPage = currentPage;
        this.search(this.searchQuery, currentPage).then(() => {
        })

        this.$store.dispatch(`analytics/trackEvent`, `scrolledPageReload`); // tracks if a page was reloaded that was previously scrolled to a higher page

      } else {
        this.search(this.searchQuery);
      }
    } else {
      // console.warn(`Empty query!`)
      this.$router.push({
        to: `Home`,
      })
    }

    window.addEventListener(`orientationchange`, this.handleOrientationChange);

    this.$store.dispatch(`analytics/trackView`, `/search`);

  },
  beforeDestroy() {

  }
}
</script>
