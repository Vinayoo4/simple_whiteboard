import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { seedData } from './shared/seed';
import './styles/index.css';

const app = createApp(App);

app.use(router);

app.mount('#app');

seedData().catch(err => console.error('seed failed', err));
