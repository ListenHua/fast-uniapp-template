import App from './App'

// #ifndef VUE3
import Vue from 'vue'
import 'uno.css'
import './uni.promisify.adaptor'
Vue.config.productionTip = false
App.mpType = 'app'
const app = new Vue({
  ...App
})
app.$mount()
// #endif

// #ifdef VUE3
import { createSSRApp } from 'vue'
import uviewPlus from 'uview-plus'
import http from './common/request'
export function createApp() {
  const app = createSSRApp(App)
  app.config.globalProperties.$http = new http()
  app.use(uviewPlus)
  return {
    app
  }
}
// #endif