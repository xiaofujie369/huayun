import { createRouter, createWebHistory } from "vue-router";

import Register from "../pages/Register.vue";
import Login from "../pages/Login.vue";
import Gallery from "../pages/Gallery.vue";
import Upload from "../pages/Upload.vue";
import PhotoView from "../pages/PhotoView.vue";
import ShareView from "../pages/ShareView.vue";

const routes = [
  { path: "/", redirect: "/gallery" },
  { path: "/register", component: Register },
  { path: "/login", component: Login },
  { path: "/gallery", component: Gallery },
  { path: "/upload", component: Upload },
  { path: "/photo/:id", component: PhotoView },
  { path: "/share/:key", component: ShareView },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;

