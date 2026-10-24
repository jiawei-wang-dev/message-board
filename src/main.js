import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { startAuthListener } from './composables/useAuth'
import './assets/main.css'

startAuthListener()

createApp(App).use(router).mount('#app')
