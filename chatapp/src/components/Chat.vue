<script setup>
import { inject, ref, reactive, onMounted, vModelCheckbox } from "vue"
import socketManager from '../socketManager.js'
import io from "socket.io-client"

class Message {
  constructor(id, user, text, dateTime, isLabeled){
    this.id = id;
    this.user = user;
    this.text = text;
    this.dateTime = dateTime;
    this.isLabeled = isLabeled;
  }
}

var id;

const label_1 = "重要"
const label_2 = "旅行先"
const label_3 = "日程"
const label_4 = "交通手段"
const label_5 = "宿泊施設"
const label_6 = "予算"
const labels = [label_1, label_2, label_3, label_4, label_5, label_6]
// 各ラベルに対応するアイコンを追加
const labelIcons = [
  "priority_high", // 重要
  "place",         // 旅行先
  "calendar_today",// 日程
  "directions_car",// 交通手段
  "hotel",         // 宿泊施設
  "attach_money"   // 予算
]


// #region global state
const userName = inject("userName")
// #endregion

// #region local variable
const socket = socketManager.getInstance()
// #endregion

// #region reactive variable
const chatContent = ref("")
const participants = ref("")
const participantsList = ref([])
const messageList = reactive([])
const chatList = reactive([])
const isLabeled = reactive([false, false])
const isSelected = reactive([false, false])

const replyMessage = ref(null) // リプライ対象のメッセージ情報を格納
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
  if (chatContent.value.trim() === "") {
    alert("投稿内容を入力してください")
    return
  }
  const nowTime = new Date();
  const sendLabels = [...isLabeled]

  socket.emit("getId");
  const newId = id;

  // リプライメッセージがある場合は元のメッセージを追加
  let messageText = chatContent.value
  if (replyMessage.value) {
    messageText += " > " + replyMessage.value.text
  }

  const newMessage = new Message(newId, userName.value, messageText, nowTime, sendLabels)

  socket.emit("publishEvent", newMessage);
  // 入力欄を初期化
  chatContent.value = ""
  clearLabeled()
  // リプライメッセージをクリア
  replyMessage.value = null
}

const onDelete = (message) => {
  console.log(message)
  if (confirm("メッセージを削除します. よろしいですか?")){
  socket.emit("deleteEvent", message);
  }
}

function clearLabeled(){
  for (let i = 0; i < labels.length; i++){
    isLabeled[i] = false
  }
}

const isEqualArray = function (array1, array2) {
   var i = array1.length;
   if (i != array2.length) return false;

   while (i--) {
     if (array1[i] !== array2[i]) return false;
   }
   return true;
 };

 const select = function (isLabeled, isSelected){
  for(let i = 0; i < isSelected.length; i++){
    if(isLabeled[i] & isSelected[i] == true){
      return true
    }
  }
  return false
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


const onReset = () => {
  for(let i = 0; i < isSelected.length; i++){
    isSelected[i] = false
  }
}

const onChangeSelection = () =>{
  console.log(isSelected)
  // console.log(chatList[0])
  console.log(isEqualArray(messageList[0].isLabeled, isSelected))
}

// リプライボタンがクリックされた時の処理
const onReply = (chat, index) => {
  replyMessage.value = {
    text: chat,
    index: index,
    timestamp: new Date() // TODO: 元メッセージの時間に合わせる
  }
  console.log("リプライ先:", replyMessage.value)
}

// リプライをクリアする処理
const clearReply = () => {
  replyMessage.value = null
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
  //chatList.unshift(data.user + "さん: " + data.text)
  messageList.unshift(data)

  console.log(messageList)
}

// 参加者一覧を更新
const onReceiveUpdateParticipants = (data) => {
  participants.value = data
  participantsList.value = data.split(", ")
  console.log(participantsList, participants, data)
}

// 過去メッセージを取得
const onGetMessages = (data) => {
  data.forEach(function(element, index, array) {
    const message = Object.assign(new Message(), element)
    // chatList.push(message.user + "さん: " + message.text)
    messageList.unshift(message)
  })
}

const onReceiveDeleteMessages = (data) => {

  let indexToRemove = messageList.findIndex(message => message.id === data.id);

  if (indexToRemove !== -1) {
    messageList.splice(indexToRemove, 1);
  }
}

const onReceiveNewId = (data) => {
  id = data;
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
    // shownChatList = onChangeSelection()
    onReceivePublish(data)
  })

  // 参加者一覧更新を受け取ったら実行
  socket.on("updateParticipants", (data) => {
    onReceiveUpdateParticipants(data);
  })

  socket.on("getMessages", (data) => {
    onGetMessages(data)
  })

  socket.on("deleteMessages", (data) => {
    onReceiveDeleteMessages(data)
  })

  socket.on("newId", (data) => {
    onReceiveNewId(data)
  })
}
// #endregion

socket.emit("getMessages", "")
socket.emit("getId");

//ctrl+enter or command+enter で投稿
const onKeydownPublish = (e) =>{
  if (e.ctrlKey || e.metaKey){
    onPublish();
  }
}

</script>

<template>
  <div class="mx-auto my-5 px-4">
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    
    <h1 class="text-h3 font-weight-medium">Vue.js Chat チャットルーム</h1>
    <div class="mt-10">
      <p>ログインユーザ：{{ userName }}さん</p>
      <p>参加者: {{ participants }}</p>
      <div v-if="replyMessage" class="reply-message">
        <button class="clear-reply-button" @click="clearReply" title="返信をキャンセル">
          <span class="material-icons">close</span>
        </button>
        <span>返信先メッセージ：{{ replyMessage.text }}</span>
      </div>
      
      <textarea variant="outlined" placeholder="投稿文を入力してください" rows="4" class="area" v-model="chatContent" @keydown.enter="onKeydownPublish"></textarea>

      <div class="mt-5">
        <button class="button-normal" @click="onPublish">投稿</button>
        <button class="button-normal util-ml-8px" @click="onMemo">メモ</button>
      </div>
      <div class="mt-5" v-for = "(checked, i) in isLabeled" :key = i>
        <label for = "a">
          <input class = "label-input" type = "checkbox" v-model="isLabeled[i]"></input>
          {{ labels[i] }}
        </label>
      </div>
      <!-- <div v-if = "isSelected === [false, false]"></div> -->
      <!-- /*
      <div class="mt-5" v-if="chatList.length !== 0">
        <div v-if="!(isEqualArray(isSelected, [false, false]))">
          <ul>
            <li class="item mt-4" v-for="(message, i) in messageList.filter(message => select(message.isLabeled, isSelected))" :key="i">
              {{ message.text }}
            </li>
          </ul>
        </div>
        */ -->
        <div class="mt-5" v-if="messageList.length !== 0">
        <div v-if="!(isEqualArray(isSelected, [false, false]))">
          <ul>
            <li class="item mt-4" v-for="(message, i) in messageList.filter(message => select(message.isLabeled, isSelected))" :key="i">
            <div class="chat-item">
              <span class="chat-text">
                {{ message.user + "さん: " + message.text }}
              </span>
              <button class="reply-button" @click="onReply(message.txt, i)" title="リプライ">
                <span class="material-icons">reply</span>
              </button>
              <button class="button-normal" @click="onDelete(messageList[i])">削除</button>
            </div>
          </li>
          </ul>
        </div>
        <div v-else>
        <ul>
          <li class="item mt-4" v-for="(message, i) in messageList" :key="i">
            <div class="chat-item">
              <span class="chat-text">
                {{ message.user + "さん: " + message.text }}
              </span>
              <button class="reply-button" @click="onReply(chat, i)" title="リプライ">
                <span class="material-icons">reply</span>
              </button>
              <button class="button-normal" @click="onDelete(messageList[i])">削除</button>
            </div>
          </li>
        </ul>
        </div>

        <!-- <ul>
          <li class="item mt-4" v-for="(chat, i) in chatList" :key="i">
            <div class="chat-item">
              <span class="chat-text">{{ chat }}</span>
              <button class="reply-button" @click="onReply(chat, i)" title="リプライ">
                <span class="material-icons">reply</span>
              </button>
            </div>
          </li>
        </ul> -->

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

    <div class="menu-horizontal-container">
      <div class="participants-column">
        <div class="menu-item menu-profile">
          <span class="user-name">ログイン中のユーザ</span>
        </div>
        <div class="active-user">
          <span class="user-name">
            <div v-for="(participant, i) in participantsList" :key="i">
              {{ participant }}さん
            </div>
          </span>
        </div>
      </div>

      <div class="vertical-divider"></div>

      <div class="menu-item menu-labels">
        <p class="menu-title">ラベルで絞り込み</p>
        <div class="selected" v-for="(checked, i) in isSelected" :key="i">
          <label class="checkbox-label">
            <span class="material-icons">{{ labelIcons[i] }}</span>
            <span>{{ labels[i] }}</span>
            <input class="label-input" type="checkbox" v-model="isSelected[i]" @change="onChangeSelection">
          </label>
        </div>
        <button type="button" class="button-normal button-reset" @click="onReset">絞り込みをリセット</button>
      </div>
      </div>

    <div class="menu-item menu-actions">
      <router-link to="/" class="link">
      <button type="button" class="button-normal button-exit" @click="onExit">退室</button>
    </router-link>
    </div>
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

.reply-button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 10px;
  min-width: 28px;
  height: 28px;
}

.reply-button .material-icons {
  font-size: 16px;
}

.reply-button:hover {
  background-color: #0056b3;
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
  margin-bottom: 0;
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
  max-width: 340px;
  border-bottom: 1px solid #ddd;
  padding: 20px 0;
  text-align: center;
}

.menu-item {
  width: 100%;
  max-width: 340px;
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
  font-size: 1.2rem;
}

.menu-labels .menu-title {
  font-size: 1rem;
  color: #777;
  margin: 0 0 10px 0;
}

.menu-labels ul {
  padding: 0;
  list-style: none;
}

.label-button {
  display: flex;
  align-items: center;
  gap: 12px; 
  width: 100%;
  background: none;
  border: none;
  padding: 10px 5px; 
  cursor: pointer;
  text-align: left;
  font-size: 1.2rem;
  color: #333;
  transition: background-color 0.2s;
  border-radius: 4px;
}

.label-button:hover {
  background-color: #e9e9e9;
}

.label-button .material-icons {
  font-size: 1.5rem;
}

.menu-actions {
  text-align: center;
}

.reply-message {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.clear-reply-button {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 4px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.clear-reply-button .material-icons {
  font-size: 16px;
}

.clear-reply-button:hover {
  background-color: #c82333;
}

.menu-horizontal-container {
  display: flex;
  justify-content: space-evenly;  
  align-items: flex-start;
  width: 100%;
  max-width: 340px;
  border-bottom: 1px solid #ddd;  
  padding: 20px 0;
}

.menu-horizontal-container > div.participants-column,
.menu-horizontal-container > div.menu-labels {
  display: flex;
  flex-direction: column;
}

.menu-horizontal-container .menu-item,
.menu-horizontal-container .active-user {
  border-bottom: none;  
  padding: 0;  
  width: auto;  
  max-width: none;  
}
.menu-horizontal-container .menu-profile {
  padding-bottom: 10px;
}

.vertical-divider {
  width: 1px;
  align-self: stretch;
  background-color: #ccc;  
}

.menu-horizontal-container .active-user {
  text-align: left;
}

.menu-horizontal-container .active-user .user-name div {
  font-size: 1.2rem;
  padding: 5px 0;   
  color: #333;   
}

.menu-labels .menu-title {
  font-size: 1rem;
  color: #777;
  margin: 0 0 10px 0;
  /* ★追加：少しだけ左に余白を持たせる */
  padding-left: 5px;
}

/* ★追加：チェックボックスとラベルのスタイル */
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 5px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.checkbox-label:hover {
  background-color: #e9e9e9;
}

.checkbox-label .material-icons {
  font-size: 1.5rem;
  color: #555;
}

.checkbox-label span {
  font-size: 1.2rem;
  color: #333;
}

.checkbox-label .label-input {
  /* チェックボックスを右端に配置 */
  margin-left: auto; 
  /* サイズを少し大きくする */
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.button-reset {
  margin-top: 15px;
  width: 100%;
  padding: 8px 0;
  font-size: 1.1rem;
}

</style>
