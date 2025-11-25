<template>
  <div class="page">
    <div class="login-card">
      <h2 class="title">欢迎回来</h2>

      <div class="input-block">
        <label>邮箱</label>
        <input v-model="email" placeholder="请输入邮箱" />
      </div>

      <div class="input-block">
        <label>密码</label>
        <input v-model="password" type="password" placeholder="请输入密码" />
      </div>

      <button class="btn" @click="login">登录</button>

      <div class="bottom">
        还没有账号？
        <router-link to="/register">立即注册</router-link>
      </div>

      <p class="error" v-if="error">{{ error }}</p>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      email: "",
      password: "",
      error: "",
    };
  },

  methods: {
    async login() {
      this.error = "";

      if (!this.email || !this.password) {
        this.error = "请输入邮箱和密码";
        return;
      }

      try {
        const res = await fetch("/functions/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: this.email,
            password: this.password,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          this.error = data.error || "登录失败";
          return;
        }

        // 保存 Session Token
        localStorage.setItem("huayun_token", data.token);

        // 跳转图库页面
        this.$router.push("/gallery");
      } catch (err) {
        this.error = "网络错误，请稍后重试";
      }
    },
  },
};
</script>

<style scoped>
.page {
  width: 100%;
  height: 100vh;
  background: linear-gradient(135deg, #b48cff, #ff9ecd);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.login-card {
  width: 380px;
  background: rgba(255, 255, 255, 0.32);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 28px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.18);
}

.title {
  text-align: center;
  margin-bottom: 20px;
  font-size: 22px;
  font-weight: 700;
  color: #ffffff;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}

.input-block {
  display: flex;
  flex-direction: column;
  margin-bottom: 15px;
}

.input-block label {
  color: white;
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 500;
}

.input-block input {
  padding: 10px 14px;
  border-radius: 12px;
  border: none;
  outline: none;
  font-size: 15px;
  background: rgba(255, 255, 255, 0.75);
  transition: 0.2s;
}

.input-block input:focus {
  background: #ffffff;
}

.bottom {
  margin-top: 12px;
  text-align: center;
  font-size: 14px;
  color: #fff;
}

.bottom a {
  color: #fff;
  font-weight: bold;
}

.error {
  margin-top: 10px;
  color: #ff4d4f;
  font-size: 14px;
  text-align: center;
}
</style>

