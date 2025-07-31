<script setup>
import { inject, ref, reactive, onMounted } from "vue"
import socketManager from '../socketManager.js'
import io from "socket.io-client"

class Message {
  constructor(user, text, dateTime, isLabeled){
    this.user = user;
    this.text = text;
    this.dateTime = dateTime;
    this.isLabeled = isLabeled;
  }
}

const labels = ["重要", "交通手段"]

// #region global state
const userName = inject("userName")
// #endregion

// #region local variable
const socket = socketManager.getInstance()
// #endregion

// #region reactive variable
const chatContent = ref("")
const chatList = reactive([])
const isLabeled = reactive([false, false])
// isLabeled.value = [false, false]
// #endregion

// #region lifecycle
onMounted(() => {
  registerSocketEvent()
})
// #endregion

// #region browser event handler
// 投稿メッセージをサーバに送信する
const onPublish = () => {
  //console.log("a")
  const nowTime = new Date();
  const sendLabels = [...isLabeled]
  const newMessage = new Message(userName.value, chatContent.value, nowTime, sendLabels)
  console.log(newMessage)
  socket.emit("publishEvent", newMessage);
  // 入力欄を初期化
  chatContent.value = ""
  clearLabeled()
}

function clearLabeled(){
  for (let i = 0; i < labels.length; i++){
    isLabeled[i] = false
  }
}
// 退室メッセージをサーバに送信する
const onExit = () => {

  socket.emit("exitEvent", userName.value + "さんが退室しました。")

}

// メモを画面上に表示する
const onMemo = () => {
  // メモの内容を表示
  chatList.unshift(userName.value + "さんのメモ：" + chatContent.value)
  // 入力欄を初期化
  chatContent.value = ""
}

// #endregion

// #region socket event handler
// サーバから受信した入室メッセージ画面上に表示する
const onReceiveEnter = (data) => {
  chatList.unshift(data + "さんが入室しました。")
}

// サーバから受信した退室メッセージを受け取り画面上に表示する
const onReceiveExit = (data) => {
  chatList.unshift(data)
}

// サーバから受信した投稿メッセージを画面上に表示する
const onReceivePublish = (data) => {
  chatList.unshift(data.user + "さん: " + data.text)
}
// #endregion

// #region local methods
// イベント登録をまとめる
const registerSocketEvent = () => {
  // 入室イベントを受け取ったら実行
  socket.on("enterEvent", (data) => {
    onReceiveEnter(data)
  })

  // 退室イベントを受け取ったら実行
  socket.on("exitEvent", (data) => {
    onReceiveExit(data)
  })

  // 投稿イベントを受け取ったら実行
  socket.on("publishEvent", (data) => {
    onReceivePublish(data)
  })
}
// #endregion
</script>

<template>
  <div class="mx-auto my-5 px-4">
    <h1 class="text-h3 font-weight-medium">Vue.js Chat チャットルーム</h1>
    <div class="mt-10">
      <p>ログインユーザ：{{ userName }}さん</p>
      <textarea variant="outlined" placeholder="投稿文を入力してください" rows="4" class="area" v-model="chatContent"></textarea>
      <div class="mt-5">
        <button class="button-normal" @click="onPublish">投稿</button>
        <button class="button-normal util-ml-8px" @click="onMemo">メモ</button>
      </div>
      <!-- <div class="mt-5" v-if="labels.length !== 0">
          <input class = "label-input" v-for = "(label, i) in labels" :key = "i" v-model = "isLabeled.value" type = "checkbox">
      </div> -->
      <div class="mt-5" v-for = "(checked, i) in isLabeled" :key = i>
        <label for = "a">
          <input class = "label-input" type = "checkbox" v-model="isLabeled[i]"></input>
          {{ labels[i] }}
        </label>
      </div>
      <div class="mt-5" v-if="chatList.length !== 0">
        <ul>
          <li class="item mt-4" v-for="(chat, i) in chatList" :key="i">{{ chat }}</li>
        </ul>
      </div>
    </div>
    <router-link to="/" class="link">
      <button type="button" class="button-normal button-exit" @click="onExit">退室する</button>
    </router-link>
  </div>
</template>

<style scoped>
.link {
  text-decoration: none;
}

.area {
  width: 500px;
  border: 1px solid #000;
  margin-top: 8px;
}

.item {
  display: block;
}

.util-ml-8px {
  margin-left: 8px;
}

.button-exit {
  color: #000;
  margin-top: 8px;
}
</style>