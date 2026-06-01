<template>
  <div class="quest-container">
    <canvas ref="mainCanvas" class="main-canvas"></canvas>

    <div
      class="music-btn"
      :class="{ paused: isMusicPaused }"
      @click="toggleMusic"
    >
      🎵
    </div>
    <audio ref="bgmRef" loop :src="birthdayBgm" autoplay></audio>

    <div
      v-for="msg in floatingMsgs"
      :key="msg.id"
      class="message-pop"
      :style="{ left: msg.x + 'px', top: msg.y + 'px' }"
    >
      {{ msg.text }}
    </div>

    <div class="ui-layer">
      <div class="glass-card animate-stage-in" :key="currentStage">
        <h1 class="title">{{ currentConfig.title }}</h1>

        <div v-if="currentConfig.image" class="media-container">
          <img
            :src="currentConfig.image"
            alt="Memory"
            class="birthday-img"
            :class="{ 'welcome-img': currentStage === 'welcome' }"
          />
        </div>

        <div v-if="currentStage === 'cake'" class="interaction-box">
          <div class="cake-emoji" @click="handleCakeClick">🎂</div>
          <div class="counter">快乐值：{{ cakeCount }} / 10</div>
          <div class="progress-bar">
            <div
              class="progress-inner"
              :style="{ width: cakeCount * 10 + '%' }"
            ></div>
          </div>
        </div>

        <div
          class="desc-box"
          :class="{
            'typing-style': currentStage === 'photo',
            'neon-text': currentStage === 'photo',
          }"
          v-html="currentStage === 'photo' ? typedHtml : currentConfig.desc"
        ></div>

        <button class="btn" @click="currentConfig.action">
          {{ currentConfig.btnText }}
        </button>
      </div>
    </div>

    <div v-if="showFullVideo" class="full-video-overlay">
      <video
        ref="fullVideoRef"
        :src="birthdayMov"
        class="full-screen-media"
        playsinline
        @ended="handleVideoEnded"
      ></video>

      <div class="close-video-btn" @click="handleVideoEnded">关闭 ✕</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
// 依然保持和物理引擎文件的解耦，让 JS 引擎文件专心负责 Canvas 刷新
import { Star } from "../fx/Star";
import { Balloon } from "../fx/Balloon";
import { Firework } from "../fx/Firework";

import birthdayBgm from "../assets/五月天-如烟.mp3";
import birthdayCake from "../assets/wyt.png";
import birthdayImg from "../assets/bubu.png";
import birthdayMov from "../assets/happybirthday.mov";

// --- 状态控制 ---
const currentStage = ref("welcome"); // 语义化状态：'welcome'(欢迎) | 'cake'(点蛋糕) | 'photo'(看照片)
const cakeCount = ref(0);
const isMusicPaused = ref(false);

const floatingMsgs = ref([]);
const typedHtml = ref("");

const mainCanvas = ref(null);
const bgmRef = ref(null);
let ctx = null;
let animationId = null;

let stars = [];
let balloons = [];
let fireworksList = [];

const randomMsgs = [
  "😂 快乐值 +10",
  "🎉 寿星气场变强",
  "🍰 卡路里无视",
  "✨ 烦恼自动删除",
  "🎁 好运加载中",
  "💰 财富值疯狂暴击 +999",
  "🚫 自动拦截一切水逆",
  "🍃 焦虑值已被系统清零",
];

// --- 🛠️ 核心：页面配置状态机（把内容和结构分离） ---
const stageConfigs = {
  welcome: {
    title: "✨ HAPPY BIRTHDAY",
    image: birthdayCake,
    desc: "",
    btnText: "START →",
    action: () => handleStageTransition("cake"),
  },
  cake: {
    title: "",
    desc: "",
    btnText: "点 🎂！",
    action: () => {
      /* 此时由点蛋糕本身触发通关，无需点击此按钮 */
    },
  },
  photo: {
    title: "🎉 生日快樂 平安健康",
    image: birthdayImg,
    desc: "", // 由打字机接管渲染
    btnText: "点击领取终极祝福 ✨",
    action: () => openBlessingVideo(),
  },
};

// 计算属性：当前激活的配置
const currentConfig = computed(() => stageConfigs[currentStage.value]);

// --- 业务流转逻辑 ---
const handleStageTransition = (nextStage) => {
  currentStage.value = nextStage;
  if (nextStage === "photo") {
    startTyping();
  }
};

// 蛋糕点击动作
const handleCakeClick = (e) => {
  if (cakeCount.value >= 10) return;
  cakeCount.value++;
  launchFirework(e.clientX, e.clientY); // 真实的破空升空烟花

  // 飘字冒泡
  const msgId = Date.now() + Math.random();
  floatingMsgs.value.push({
    id: msgId,
    text: randomMsgs[Math.floor(Math.random() * randomMsgs.length)],
    x: e.clientX - 50,
    y: e.clientY - 40,
  });
  setTimeout(
    () =>
      (floatingMsgs.value = floatingMsgs.value.filter((m) => m.id !== msgId)),
    900,
  );

  if (cakeCount.value >= 10) {
    setTimeout(() => handleStageTransition("photo"), 1000);
  }
};

// 打字机效果
const finalText =
  "承承宝贝 愿你新的一岁：\n\n💰 钱包越来越鼓\n🍰 蛋糕热量自动消失\n😴 熬夜永远不长痘\n🎮 快乐天天在线";
let charIndex = 0;
const startTyping = () => {
  const type = () => {
    if (charIndex < finalText.length) {
      const char = finalText.charAt(charIndex);
      typedHtml.value += char === "\n" ? "<br/>" : char;
      charIndex++;
      setTimeout(type, 50);
    }
  };
  setTimeout(type, 400);
};

// 大招：全屏疯狂烟花
const showFullVideo = ref(false); // 控制全屏大视频是否显示
const fullVideoRef = ref(null); // 绑定全屏视频的 DOM 元素
let autoBlessTimer = null;

const openBlessingVideo = () => {
  showFullVideo.value = true;

  setTimeout(() => {
    const videoElement = fullVideoRef.value;
    if (videoElement) {
      videoElement.muted = false; // 🔥 关键：大视频一定要有声音！
      videoElement.currentTime = 0; // 从头开始播放

      videoElement
        .play()
        .then(() => {
          // // 为了防止声音冲突，大视频播放时可以把背景 BGM 暂停
          if (bgmRef.value) bgmRef.value.pause();
        })
        .catch((err) => {
          console.log("视频播放失败，可能需要用户再次点击授权", err);
        });
    }
  }, 50);
};

const handleVideoEnded = () => {
  showFullVideo.value = false; // 关闭全屏播放器

  if (bgmRef.value && !isMusicPaused.value) {
    bgmRef.value.play().catch(() => {});
  }

  // 视频放完后，作为奖励，触发疯狂烟花暴击（持续6秒）
  autoBlessTimer = setInterval(() => {
    launchFirework();
  }, 200);
};

// --- Canvas 物理引擎基础驱动 ---
const launchFirework = (clickX, clickY) => {
  const canvas = mainCanvas.value;
  if (!canvas) return;
  const startX = clickX || Math.random() * canvas.width;
  const startY = canvas.height + 10;
  const targetX = clickX || Math.random() * canvas.width;
  const targetY =
    clickY || Math.random() * canvas.height * 0.3 + canvas.height * 0.1;
  fireworksList.push(new Firework(startX, startY, targetX, targetY));
};

const render = () => {
  const w = mainCanvas.value.width;
  const h = mainCanvas.value.height;
  ctx.fillStyle = "rgba(15, 8, 20, 0.22)";
  ctx.fillRect(0, 0, w, h);

  stars.forEach((s) => s.draw(ctx));

  if (currentStage.value === "photo" && Math.random() < 0.035) {
    balloons.push(new Balloon(w, h)); // 气球升空
  }
  for (let i = balloons.length - 1; i >= 0; i--) {
    balloons[i].update();
    balloons[i].draw(ctx);
    if (balloons[i].y < -120) balloons.splice(i, 1);
  }

  for (let i = fireworksList.length - 1; i >= 0; i--) {
    fireworksList[i].update();
    fireworksList[i].draw(ctx);
    if (fireworksList[i].isDead()) fireworksList.splice(i, 1);
  }
  animationId = requestAnimationFrame(render);
};

let envFireworkTimer = setInterval(() => {
  if (currentStage.value !== "cake") launchFirework();
}, 4000);

onMounted(() => {
  ctx = mainCanvas.value.getContext("2d");
  const resize = () => {
    mainCanvas.value.width = window.innerWidth;
    mainCanvas.value.height = window.innerHeight;
  };
  window.addEventListener("resize", resize);

  resize();
  stars = Array.from(
    { length: 60 },
    () => new Star(mainCanvas.value.width, mainCanvas.value.height),
  );
  render();
});

onUnmounted(() => {
  cancelAnimationFrame(animationId);
  clearInterval(envFireworkTimer);
  if (autoBlessTimer) clearInterval(autoBlessTimer);
});

const toggleMusic = () => {
  const m = bgmRef.value;
  if (m.paused) {
    m.play();
    isMusicPaused.value = false;
  } else {
    m.pause();
    isMusicPaused.value = true;
  }
};
</script>

<style scoped>
/* 容器及全局常驻元素样式 */
.quest-container {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: #0f0814;
}
.main-canvas {
  position: absolute;
  inset: 0;
  z-index: 1;
}
.ui-layer {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

/* 唯一的中央动态卡片 */
.glass-card {
  width: 100%;
  max-width: 450px;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 26px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  padding: 20px 25px;
  text-align: center;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4);
  color: #fff;
}

/* 照片/GIF 专用美化样式 */
.media-container {
  width: 100%;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 15px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  background: #000;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
}
.birthday-img {
  width: 100%;
  display: block;
  object-fit: fill;
  max-height: 220px;
}

.welcome-img {
  max-height: 460px !important;
}

/* 文本与打字机盒子 */
.desc-box {
  font-size: 15px;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 15px;
}
.desc-box.typing-style {
  text-align: left;
  background: rgba(0, 0, 0, 0.25);
  padding: 15px;
  border-radius: 12px;
  min-height: 140px;
  border-left: 4px solid #ff6b8b;
}

.desc-box.typing-style.neon-text {
  text-align: left;
  background: rgba(0, 0, 0, 0.4);
  padding: 18px;
  border-radius: 12px;
  min-height: 140px;
  border-left: 4px solid #ff6b8b;
  font-weight: bold;
  font-size: 16px;

  /* 添加霓虹发光文字阴影 */
  text-shadow: 0 0 4px rgba(255, 255, 255, 0.2);

  /* 触发闪闪发光动画：2秒内变换5种颜色，呼吸般闪烁 */
  animation: discoFlicker 2.5s infinite alternate ease-in-out;
}

/* 🎆 迪斯科闪烁变色动画 */
@keyframes discoFlicker {
  0% {
    color: #ff6b8b;
    text-shadow: 0 0 8px #ff6b8b;
  }
  25% {
    color: #ff8e53;
    text-shadow: 0 0 10px #ff8e53;
  }
  50% {
    color: #ffeb3b;
    text-shadow: 0 0 12px #ffeb3b;
  }
  75% {
    color: #2196f3;
    text-shadow: 0 0 10px #2196f3;
  }
  100% {
    color: #e040fb;
    text-shadow: 0 0 8px #e040fb;
  }
}

/* 其余组件内固有交互样式 */
.title {
  font-size: 28px;
  margin: 10px 0px;
  font-weight: bold;
}
.highlight {
  color: #ff6b8b;
  font-weight: bold;
}
.btn {
  padding: 12px 32px;
  border: none;
  border-radius: 50px;
  background: linear-gradient(90deg, #ff6b8b, #ff8e53);
  color: white;
  font-size: 15px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 5px 15px rgba(255, 107, 139, 0.4);
  transition: transform 0.2s;
}
.btn:hover {
  transform: scale(1.03);
}
.cake-emoji {
  font-size: 85px;
  margin: 5px 0;
  cursor: pointer;
  user-select: none;
  display: inline-block;
  animation: wobble 1.5s infinite ease-in-out;
}
.counter {
  font-size: 17px;
  color: #ff8e53;
  font-weight: bold;
}
.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  margin: 12px 0;
  overflow: hidden;
}
.progress-inner {
  height: 100%;
  background: linear-gradient(90deg, #ff6b8b, #ff8e53);
  transition: width 0.3s ease;
}
.music-btn {
  position: fixed;
  right: 20px;
  top: 20px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
  cursor: pointer;
  animation: spin 5s linear infinite;
}
.music-btn.paused {
  animation-play-state: paused;
  opacity: 0.4;
}
.message-pop {
  position: fixed;
  pointer-events: none;
  background: #fff;
  color: #ff4f7a;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: bold;
  z-index: 99;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  animation: popUp 0.8s ease-out forwards;
}

/* 切换页面时的过渡特效动画 */
.animate-stage-in {
  animation: slideUpIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

/* 全屏视频遮罩层 */
.full-video-overlay {
  position: fixed;
  inset: 0;
  z-index: 999; /* 保证绝对在最顶层 */
  background: #000000;
  display: flex;
  justify-content: center;
  align-items: center;
  animation: fadeIn 0.4s ease forwards;
}

/* 视频本身满屏适配 */
.full-screen-media {
  width: 100vw;
  height: 100vh;
  object-fit: contain; /* 保证视频不因拉伸变形，上下或左右留黑边符合电影质感 */
}

/* 右上角跳过按钮 */
.close-video-btn {
  position: absolute;
  top: 30px;
  right: 30px;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #fff;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  backdrop-filter: blur(5px);
  z-index: 1000;
}
.close-video-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes wobble {
  0%,
  100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-4deg);
  }
  75% {
    transform: rotate(4deg);
  }
}
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
@keyframes popUp {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  15% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(-40px);
  }
}
@keyframes slideUpIn {
  0% {
    opacity: 0;
    transform: translateY(25px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
