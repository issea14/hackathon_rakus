<script setup>
import { inject, ref, reactive, onMounted, vModelCheckbox } from "vue"
import socketManager from '../socketManager.js'
import io from "socket.io-client"

class Message {
  constructor(user, text, dateTime, labels){
    this.user = user;
    this.text = text;
    this.dateTime = dateTime;
    this.labels = labels;
  }
}
const label_1 = "重要"
const label_2 = "交通手段"
const labels = [label_1, label_2]

// #region global state
const userName = inject("userName")
// #endregion

// #region local variable
const socket = socketManager.getInstance()
// #endregion

// #region reactive variable
const chatContent = ref("")
const participants = ref("")
const chatList = reactive([])
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
  const newMessage = new Message(userName.value, chatContent.value, nowTime, labels)
  //console.log(newMessage)
  socket.emit("publishEvent", newMessage);
  // 入力欄を初期化
  chatContent.value =""

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

// 参加者一覧を更新
const onReceiveUpdateParticipants = (data) => {
  participants.value = data
}

// 過去メッセージを取得
const onGetMessages = (data) => {
  data.forEach(function(element, index, array) {
    const message = Object.assign(new Message(), element)
    chatList.push(message.user + "さん: " + message.text)
  })
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

  // 参加者一覧更新を受け取ったら実行
  socket.on("updateParticipants", (data) => {
    onReceiveUpdateParticipants(data);
  })

  socket.on("getMessages", (data) => {
    onGetMessages(data)
  })
}
// #endregion

socket.emit("getMessages", "")

//ctrl+enter or command+enter で投稿
const onKeydownPublish = (e) =>{
  if (e.ctrlKey || e.metaKey){
    onPublish();
  }
}

</script>

<template>
  <div class="mx-auto my-5 px-4">
    <h1 class="text-h3 font-weight-medium">Vue.js Chat チャットルーム</h1>
    <div class="mt-10">
      <p>ログインユーザ：{{ userName }}さん</p>

      <p>参加者: {{ participants }}</p>
      <textarea variant="outlined" placeholder="投稿文を入力してください" rows="4" class="area" v-model="chatContent" @keydown.enter="onKeydownPublish"></textarea>

      <div class="mt-5">
        <button class="button-normal" @click="onPublish">投稿</button>
        <button class="button-normal util-ml-8px" @click="onMemo">メモ</button>
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
  <div class="hamburger-menu">
  <input type="checkbox" id="menu-btn-check">
  <label for="menu-btn-check" class="menu-btn">
    <span></span>
    <span></span>
    <span></span>
  </label>
  
  <div class="menu-content">
    <div class="menu-item menu-profile">
      <span class="user-name">ログイン中のユーザ名</span>
    </div>

    <div class = "active-user">
      <span class="user-name">{{ userName }}さん</span>
    </div>

    <div class="menu-item menu-labels">
      <p class="menu-title">ラベル一覧</p>
      <ul>
        <li><a href="#">ラベル１</a></li>
        <li><a href="#">ラベル２</a></li>
        <li><a href="#">ラベル３</a></li>
        </ul>
    </div>

    <div class="menu-item menu-actions">
      <router-link to="/" class="link">
      <button type="button" class="button-normal button-exit" @click="onExit">退室</button>
    </router-link>
    </div>
  </div>
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
  white-space: pre-line;
}

.util-ml-8px {
  margin-left: 8px;
}

.button-exit {
  color: #000;
  margin-top: 8px;
}

.hamburger-menu {
  position: fixed;
  right: 20px;
  top: 20px;
  z-index: 100;
}

#menu-btn-check {
  display: none;
}

.menu-btn {
  display: block;
  width: 33px;
  height: 33px;
  background: #333;
  border-radius: 50%;
  position: relative;
  cursor: pointer;
  z-index: 2;
}

.menu-btn span {
  display: block;
  width: 15px;
  height: 2px;
  background-color: #fff;
  position: absolute;
  left: 9px;
  transition: all 0.5s;
}

.menu-btn span:nth-of-type(1) {
  top: 9px;
}

.menu-btn span:nth-of-type(2) {
  top: 15px;
}

.menu-btn span:nth-of-type(3) {
  bottom: 9px;
}

#menu-btn-check:checked ~ .menu-btn span:nth-of-type(1) {
  top: 15px;
  transform: rotate(45deg);
}

#menu-btn-check:checked ~ .menu-btn span:nth-of-type(2) {
  opacity: 0;
}

#menu-btn-check:checked ~ .menu-btn span:nth-of-type(3) {
  top: 15px;
  transform: rotate(-45deg);
}

.menu-content {
  width: 100%;
  height: 100%;
  position: fixed;
  top: 0;
  right: -100%; 
  z-index: 1;
  background-color: #f1f1f1;
  transition: all 0.5s;
  padding-top: 60px;
}

.menu-content ul {
  padding: 0 20px;
}

.menu-content ul li {
  list-style: none;
  margin-bottom: 20px;
}

.menu-content ul li a {
  color: #333;
  text-decoration: none;
  font-size: 1.2rem;
}

#menu-btn-check:checked ~ .menu-content {
  right: 0; 
}

.menu-content {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  padding: 80px 20px 20px 20px; 
}

.active-user {
  width: 100%;
  max-width: 280px;
  border-bottom: 1px solid #ddd;
  padding: 20px 0;
  text-align: center; 
}

.menu-item {
  width: 100%;
  max-width: 280px; 
  border-bottom: 1px solid #ddd;
  padding: 20px 0;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-profile {
  display: flex;
  align-items: center;
  border-bottom: none;
  padding-bottom: 0; 
}

.user-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 15px;
}

.user-name {
  font-weight: bold;
}

.menu-labels .menu-title {
  font-size: 0.9em;
  color: #777;
  margin: 0 0 10px 0;
}

.menu-labels ul {
  padding: 0;
  list-style: none;
}

.menu-labels ul li a {
  display: block;
  padding: 10px 0;
  color: #333;
  text-decoration: none;
  transition: background-color 0.2s;
}
.menu-labels ul li a:hover {
  background-color: #e9e9e9;
}

.menu-actions {
  text-align: center;
}

</style>

