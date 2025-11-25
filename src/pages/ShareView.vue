<template>
  <div class="share-page">

    <!-- 加载中 -->
    <div v-if="loading" class="loading">加载中...</div>

    <!-- 密码输入界面 -->
    <div v-if="needPassword && !verified" class="password-box">
      <h3>请输入访问密码</h3>
      <input v-model="password" type="password" placeholder="分享密码" />
      <button class="btn" @click="submitPassword">验证</button>
      <p class="error" v-if="error">{{ error }}</p>
    </div>

    <!-- 显示内容（照片） -->
    <div v-if="verified && type === 'photo'" class="content">
      <h2>图片分享</h2>

      <img :src="photo.url" class="shared-photo" />

      <div class="info">
        <p>文件名：{{ photo.filename }}</p>
        <p>大小：{{ formatSize(photo.size) }}</p>
        <p>上传：{{ photo.created_at }}</p>
      </div>

      <h3 class="comment-title">评论</h3>

      <div v-if="comments.length === 0" class="empty-comment">
        暂无评论
      </div>

      <div v-for="c in comments" :key="c.id" class="comment-item">
        <div class="avatar">{{ c.nickname[0] }}</div>
        <div>
          <div class="c-name">{{ c.nickname }}</div>
          <div class="c-text">{{ c.content }}</div>
          <div class="c-time">{{ c.created_at }}</div>
        </div>
      </div>
    </div>

    <!-- 显示内容（相册） -->
    <div v-if="verified && type === 'album'" class="content">
      <h2>{{ album.title }}</h2>

      <div class="album-grid">
        <img v-for="p in photos" :key="p.id" :src="p.url" />
      </div>
    </div>

  </div>
</template>

<script>
export default {
  data() {
    return {
      loading: true,
      needPassword: false,
      verified: false,
      password: "",
      error: "",
      type: "",
      photo: null,
      comments: [],
      album: null,
      photos: [],
    };
  },

  async mounted() {
    const key = this.$route.params.key;

    const res = await fetch(`/functions/share/detail?key=${key}`);
    const data = await res.json();

    this.loading = false;

    if (!res.ok) {
      this.error = data.error;
      return;
    }

    // 需要密码
    if (data.need_password) {
      this.needPassword = true;
      return;
    }

    // 不需要密码 → 直接显示
    this.applyShareData(data);
    this.verified = true;
  },

  methods: {
    async submitPassword() {
      this.error = "";
      const key = this.$route.params.key;

      const res = await fetch("/functions/share/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          share_key: key,
          password: this.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        this.error = data.error;
        return;
      }

      // 密码正确
      this.applyShareData(data);
      this.verified = true;
    },

    applyShareData(data) {
      this.type = data.type;

      if (data.type === "photo") {
        this.photo = data.photo;
        this.comments = data.comments;
      }

      if (data.type === "album") {
        this.album = data.album;
        this.photos = data.photos;
      }
    },

    formatSize(size) {
      if (size < 1024) return size + " B";
      if (size < 1024 * 1024) return (size / 1024).toFixed(1) + " KB";
      return (size / 1024 / 1024).toFixed(1) + " MB";
    },
  },
};
</script>

<style scoped>
.share-page {
  padding: 20px;
}

.loading {
  text-align: center;
  margin-top: 40px;
  color: #888;
}

/* 密码输入 */
.password-box {
  max-width: 400px;
  margin: 40px auto;
  padding: 20px;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 0 20px rgba(0,0,0,0.1);
}

.password-box input {
  width: 100%;
  padding: 12px;
  margin-top: 10px;
  border-radius: 12px;
  border: 1px solid #ddd;
}

.error {
  color: #ff4d4f;
  margin-top: 10px;
  text-align: center;
}

/* 图片内容 */
.shared-photo {
  width: 100%;
  max-width: 700px;
  display: block;
  margin: 20px auto;
  border-radius: 12px;
}

.info {
  text-align: center;
  margin: 10px 0 20px;
}

/* 评论 */
.comment-title {
  margin-top: 20px;
  font-size: 18px;
}

.empty-comment {
  margin-top: 20px;
  text-align: center;
  color: #aaa;
}

.comment-item {
  display: flex;
  gap: 12px;
  margin-top: 14px;
}

.avatar {
  width: 40px;
  height: 40px;
  background: #b48cff;
  color: #fff;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
}

.c-name {
  font-weight: bold;
}

.c-time {
  font-size: 12px;
  color: #888;
}

/* 相册布局 */
.album-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
}

.album-grid img {
  width: 100%;
  border-radius: 10px;
}
</style>
