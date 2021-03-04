import { createApp } from 'vue'
import App from './App.vue'

import './assets/css/bootstrap-4.5.3.min.css'
import './assets/css/xapps-dist.css'
import './assets/css/xapps-routed-dist.css'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faArrowRight, faCheck, faLock, faCreditCard } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

library.add(faArrowRight, faCheck, faLock, faCreditCard)

const app = createApp(App)

import { createI18n } from 'vue-i18n'

import { languages, defaultLocale } from './locale/index.js'
const messages = Object.assign(languages)

const i18n = createI18n({
    locale: defaultLocale,
    fallbackLocale: 'en',
    messages
})

app.use(i18n)
app.component('fa', FontAwesomeIcon)

const urlParams = new URLSearchParams(window.location.search)
const token = urlParams.get('xAppToken')

app.config.globalProperties.token = token
app.config.globalProperties.endpoint = 'https://xappsbackendforxumm.loca.lt'

app.mount('#app')
