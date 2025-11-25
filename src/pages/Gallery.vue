<template>
  <div class="gallery-page">
    <div class="top-bar">
      <h2>我的图库</h2>
      <router-link to="/upload" class="btn upload-btn">上传图片</router-link>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-if="!loading && photos.length === 0" class="empty">
      暂无图片，点击右上角上传吧！
    </div>

    <div class="masonry" v-if="photos.length > 0">
      <div
        v-for="p in photos"
        :key="p.id"
        class="photo-card"
        @click="openPhoto(p.id)"
      >
        <img :src="p.url" :alt="p.filename" />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      photos: [],
      loading: true,
    };
  },

  async mounted() {
    const token = localStorage.getItem("huayun_token");
    if (!token) {
      this.$router.push("/login");
      return;
    }

    try {
      const res = await fetch("/functions/photo/list?page=1&limit=100", {
        headers: {
          Authorization: "Bearer " + token,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          this.$router.push("/login");
          return;
        }
      }

      this.photos = data.photos || [];
    } catch (err) {
      console.error("加载失败:", err);
    }

    this.loading = false;
  },

  methods: {
    openPhoto(id) {
      this.$router.push(`/photo/${id}`);
    },
  },
};
</script>

<style scoped>
.gallery-page {
  padding: 20px;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.top-bar h2 {
  font-size: 22px;
  font-weight: 700;
  color: #333;
}

.upload-btn {
  padding: 8px 14px;
  border-radius: 12px;
  background: linear-gradient(135deg, #b48cff, #ff9ecd);
  color: white;
  text-decoration: none;
  font-weight: bold;
}

.loading,
.empty {
  text-align: center;
  font-size: 16px;
  margin-top: 40px;
  color: #aaa;
}

/* Masonry 瀑布流布局 */
.masonry {
  column-count: 3;
  column-gap: 15px;
}

.photo-card {
  width: 100%;
  margin-bottom: 15px;
  break-inside: avoid;
  cursor: pointer;
  transition: 0.2s;
}

.photo-card:hover {
  transform: scale(1.02);
}

.photo-card img {
  width: 100%;
  border-radius: 12px;
  display: block;
}

/* 手机端布局 */
@media (max-width: 768px) {
  .masonry {
    column-count: 2;
  }
}

@media (max-width: 480px) {
  .masonry {
    column-count: 1;
  }
}
</style>

