<template>
  <div id="app-root">
    <BirthdayQuest v-if="viewMode === 'quest'" />

    <div v-else class="other-page">
      <h2>其他后续页面预留位置</h2>
      <button @click="viewMode = 'quest'">返回神秘挑战</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import BirthdayQuest from "./components/Birthday.vue";

// 轻松控制处于哪一个主页面
const viewMode = ref("quest");
</script>

<style>
/* 清理全局样式阻碍 */
html,
body,
#app,
#app-root {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  background-color: #000;
}
</style>
