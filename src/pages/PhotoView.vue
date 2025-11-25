<template>
  <div class="photo-page">
    <button class="back-btn" @click="$router.push('/gallery')">← 返回图库</button>

    <div class="photo-card" v-if="photo">
      <img :src="photo.url" class="main-photo" />

      <div class="info">
        <h3>{{ photo.filename }}</h3>
        <p>大小：{{ formatSize(photo.size) }}</p>
        <p>上传时间：{{ photo.created_at }}</p>

        <button class="btn share-btn" @click="createShare">生成分享链接</button>

        <div v-if="shareUrl" class="share-box">
          分享链接已生成：  
          <a :href="shareUrl" target="_blank">{{ shareUrl }}</a>
        </div>
      </div>
    </div>

    <div class="comments-area">
      <h3>评论</h3>

      <div v-if="comments.length === 0" class="empty-comment">暂无评论</div>

      <div v-for="c in comments" :key="c.id" class="comment-item">
        <div class="avatar">{{ c.nickname[0] }}</div>
        <div>
          <div class="c-name">{{ c.nickname }}</div>
          <div class="c-text">{{ c.content }}</div>
          <div class="c-time">{{ c.created_at }}</div>
        </div>
      </div>

      <div class="comment-box">
        <textarea v-model="newComment" placeholder="写下你的评论..." />
        <button class="btn" @click="submitComment">发布</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      photo: null,
      comments: [],
      newComment: "",
      shareUrl: "",
    };
  },

  async mounted() {
    const id = this.$route.params.id;
    const token = localStorage.getItem("huayun_token");

    if (!token) {
      this.$router.push("/login");
      return;
    }

    const res = await fetch(`/functions/photo/detail?id=${id}`, {
      headers: {
        Authorization: "Bearer " + token,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error);
      this.$router.push("/gallery");
      return;
    }

    this.photo = data.photo;
    this.comments = data.comments;
  },

  methods: {
    formatSize(size) {
      if (size < 1024) return size + " B";
      if (size < 1024 * 1024) return (size / 1024).toFixed(1) + " KB";
      return (size / 1024 / 1024).toFixed(1) + " MB";
    },

    async submitComment() {
      if (!this.newComment.trim()) return;

      const token = localStorage.getItem("huayun_token");
      const id = this.$route.params.id;

      const res = await fetch("/functions/comment/add", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          photo_id: id,
          content: this.newComment,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        this.comments.unshift(data.comment);
        this.newComment = "";
      } else {
        alert(data.error);
      }
    },

    async createShare() {
      const token = localStorage.getItem("huayun_token");

      const res = await fetch("/functions/share/create", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ photo_id: this.photo.id }),
      });

      const data = await res.json();

      if (res.ok) {
        this.shareUrl = data.url;
      } else {
        alert(data.error);
      }
    },
  },
};
</script>

<style scoped>
.photo-page {
  padding: 20px;
}

.back-btn {
  background: none;
  border: none;
  font-size: 16px;
  color: #555;
  cursor: pointer;
  margin-bottom: 16px;
}

.photo-card {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
}

.main-photo {
  max-width: 60%;
  border-radius: 12px;
  box-shadow: 0 0 12px rgba(0, 0, 0, 0.15);
}

.info {
  flex: 1;
}

.share-btn {
  margin-top: 14px;
}

.share-box {
  margin-top: 10px;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 8px;
  font-size: 14px;
}

.comments-area {
  margin-top: 30px;
}

.comment-item {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
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
  font-weight: 700;
}

.c-name {
  font-weight: 700;
}

.c-text {
  margin-top: 2px;
}

.c-time {
  font-size: 12px;
  color: #888;
}

.comment-box {
  margin-top: 20px;
  display: flex;
  gap: 12px;
}

.comment-box textarea {
  flex: 1;
  height: 70px;
  border-radius: 12px;
  border: 1px solid #ddd;
  padding: 10px;
  resize: none;
}

.comment-box .btn {
  height: 40px;
  align-self: flex-end;
}
</style>

