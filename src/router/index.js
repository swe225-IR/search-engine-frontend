import Vue from 'vue'
import VueRouter from 'vue-router'

import Home from '../views/Home.vue'
import Search from '../views/Search.vue'
import FourOhFour from '../views/FourOhFour.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/search',
    redirect: {
      name: 'Home',
    }
  },
  {
    path: '/search/:query',
    name: 'Search',
    component: Search,
  },
  // 404, leave this as last route!!!
  {
    path: '/*',
    component: FourOhFour
  },
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
  // parseQuery: (query) => {
  //   console.log(`query:`, query)
  //   decodeURIComponent(query)
  // },
  // stringifyQuery: (query) => {
  //   console.log(`query:`, query)
  //   encodeURIComponent(query)
  // },
})

export default router
