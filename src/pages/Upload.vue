<template>
  <div class="upload-page">
    <h2 class="title">上传图片</h2>

    <div
      class="upload-area"
      @dragover.prevent
      @drop.prevent="handleDrop"
      @click="triggerSelect"
    >
      <p>拖拽图片到这里，或点击选择文件</p>
      <input ref="fileInput" type="file" accept="image/*" multiple @change="handleSelect" />
    </div>

    <div v-if="files.length > 0" class="file-list">
      <div v-for="(f, index) in files" :key="index" class="file-item">
        <span>{{ f.name }}</span>
        <span>{{ formatSize(f.size) }}</span>
      </div>
    </div>

    <button class="btn upload-btn" @click="startUpload" :disabled="uploading">
      {{ uploading ? "上传中..." : "开始上传" }}
    </button>

    <div v-if="progress > 0" class="progress">
      <div class="bar" :style="{ width: progress + '%' }"></div>
    </div>

    <button class="back-btn" @click="$router.push('/gallery')">返回图库</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      files: [],
      uploading: false,
      progress: 0,
    };
  },

  methods: {
    triggerSelect() {
      this.$refs.fileInput.click();
    },

    handleSelect(event) {
      this.files = [...event.target.files];
    },

    handleDrop(event) {
      this.files = [...event.dataTransfer.files];
    },

    formatSize(size) {
      if (size < 1024) return size + " B";
      if (size < 1024 * 1024) return (size / 1024).toFixed(1) + " KB";
      return (size / 1024 / 1024).toFixed(1) + " MB";
    },

    async startUpload() {
      if (this.files.length === 0) return;

      const token = localStorage.getItem("huayun_token");
      if (!token) {
        this.$router.push("/login");
        return;
      }

      this.uploading = true;
      this.progress = 0;

      const form = new FormData();
      this.files.forEach(f => form.append("file", f));

      try {
        const res = await fetch("/functions/photo/upload", {
          method: "POST",
          headers: {
            Authorization: "Bearer " + token,
          },
          body: form,
        });

        if (!res.ok) {
          alert("上传失败");
          this.uploading = false;
          return;
        }

        // 假装进度到 100%
        this.progress = 100;
        setTimeout(() => {
          this.$router.push("/gallery");
        }, 600);

      } catch (err) {
        alert("网络错误，请稍后重试");
      }
    },
  },
};
</script>

<style scoped>
.upload-page {
  padding: 20px;
}

.title {
  margin-bottom: 20px;
  font-size: 22px;
  font-weight: 700;
}

.upload-area {
  margin: 20px 0;
  padding: 40px 20px;
  background: rgba(255, 255, 255, 0.7);
  border: 2px dashed #b48cff;
  border-radius: 16px;
  text-align: center;
  cursor: pointer;
}

.upload-area p {
  font-size: 16px;
  color: #666;
}

.upload-area input {
  display: none;
}

.file-list {
  margin-top: 20px;
}

.file-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid #eee;
}

.upload-btn {
  margin-top: 20px;
  width: 100%;
}

.progress {
  margin-top: 20px;
  width: 100%;
  background: #eee;
  height: 10px;
  border-radius: 6px;
  overflow: hidden;
}

.bar {
  height: 100%;
  background: linear-gradient(135deg, #b48cff, #ff9ecd);
  transition: width 0.3s;
}

.back-btn {
  margin-top: 20px;
  width: 100%;
  padding: 10px 16px;
  border-radius: 12px;
  background: #ddd;
  border: none;
  cursor: pointer;
}
</style>

