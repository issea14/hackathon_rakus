<script setup>
import { inject, ref, reactive, onMounted, nextTick } from "vue"
import { useRouter } from "vue-router"
import socketManager from '../socketManager.js'

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
const label_3 = "観光場所"
const labels = [label_1, label_2, label_3]

// #region global state
const userName = inject("userName")
const router = useRouter()
// #endregion

// #region local variable
const socket = socketManager.getInstance()
const chatListRef = ref(null)
// #endregion

// #region reactive variable
const chatContent = ref("")
const participants = ref("")
const participantsList = ref([])
const chatList = reactive([])
const messageList = reactive([])
const isLabeled = reactive([false, false, false])
const isSelected = reactive([false, false, false])
const replyMessage = ref(null) // リプライ対象のメッセージ情報を格納
const availableLabels = reactive([
  { name: "重要", color: "#e74c3c", icon: "mdi-star" },
  { name: "交通手段", color: "#3498db", icon: "mdi-car" },
  { name: "観光場所", color: "#27ae60", icon: "mdi-camera" }
])
// #endregion

// #region lifecycle
onMounted(() => {
  registerSocketEvent()
  socket.emit("getMessages", "")
  scrollToBottom()
})
// #endregion

// #region methods
const scrollToBottom = () => {
  nextTick(() => {
    if (chatListRef.value) {
      chatListRef.value.scrollTop = chatListRef.value.scrollHeight
    }
  })
}

const formatTime = (dateTime) => {
  return new Date(dateTime).toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatDate = (dateTime) => {
  return new Date(dateTime).toLocaleDateString('ja-JP', {
    month: 'short',
    day: 'numeric'
  })
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

const select = function (messageLabels, selectedLabels){
  for(let i = 0; i < selectedLabels.length; i++){
    if(messageLabels[i] && selectedLabels[i]){
      return true
    }
  }
  return false
}

const onKeydownPublish = (e) => {
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault()
    onPublish()
  }
}
// #endregion

// #region browser event handler
const onPublish = () => {
  if (chatContent.value.trim() === "") {
    return
  }

  const nowTime = new Date()

  // リプライメッセージがある場合は元のメッセージを追加
  let messageText = chatContent.value.trim()
  if (replyMessage.value) {
    messageText += " > " + replyMessage.value.text
  }

  const sendLabels = labels.filter((label, index) => isLabeled[index])
  const newMessage = new Message(userName.value, messageText, nowTime, sendLabels)

  messageList.unshift(newMessage)
  socket.emit("publishEvent", newMessage)
  chatContent.value = ""
  clearLabeled()
  // リプライメッセージをクリア
  replyMessage.value = null
  scrollToBottom()
}

const onExit = () => {
  socket.emit("exitEvent", userName.value + "さんが退室しました。")
  router.push({ name: "login" })
}

const onReset = () => {
  for(let i = 0; i < isSelected.length; i++){
    isSelected[i] = false
  }
}

const onChangeSelection = () =>{
  console.log(isSelected)
}

// リプライボタンがクリックされた時の処理
const onReply = (message) => {
  replyMessage.value = {
    text: message.text,
    user: message.user,
    timestamp: message.dateTime
  }
  console.log("リプライ先:", replyMessage.value)
}

// リプライをクリアする処理
const clearReply = () => {
  replyMessage.value = null
}


const onReceivePublish = (data) => {
  chatList.unshift(data)
  messageList.unshift(data)
  scrollToBottom()
}

const onReceiveUpdateParticipants = (data) => {
  participants.value = data
  participantsList.value = data.split(", ")
}

const onGetMessages = (data) => {
  data.forEach(function(element, index, array) {
    const message = Object.assign(new Message(), element)
    chatList.push(message)
    messageList.push(message)
  })
  scrollToBottom()
}
// #endregion

// #region local methods
const registerSocketEvent = () => {
  socket.on("publishEvent", (data) => {
    onReceivePublish(data)
  })

  socket.on("updateParticipants", (data) => {
    onReceiveUpdateParticipants(data)
  })

  socket.on("getMessages", (data) => {
    onGetMessages(data)
  })
}
// #endregion
</script>

<template>
  <div class="chat-container">
    <!-- ハンバーガーメニュー -->
    <div class="hamburger-menu">
      <input type="checkbox" id="menu-btn-check"> <!-- メニューのチェックボックス -->
      <label for="menu-btn-check" class="menu-btn"> <!-- メニューボタン -->
        <span></span>
        <span></span>
        <span></span>
      </label>

      <div class="menu-content">
        <div class="menu-item menu-profile">
          <span class="user-name">ログイン中</span>
        </div>

        <div class="active-user">
          <span class="user-name">
            <div v-for="(participant, i) in participantsList" :key="i">
              {{ participant }}さん
            </div>
          </span>
        </div>

        <div class="menu-item menu-labels">
          <p class="menu-title">ラベルフィルター</p>
          <div class="filter-checkboxes">
            <label
              v-for="(label, i) in labels"
              :key="i"
              class="filter-checkbox"
            >
              <input
                type="checkbox"
                v-model="isSelected[i]"
                @change="onChangeSelection"
                class="checkbox-input"
              >
              <v-icon
                :icon="availableLabels[i].icon"
                size="16"
                :color="isSelected[i] ? availableLabels[i].color : '#95a5a6'"
              ></v-icon>
              <span class="filter-text">{{ label }}</span>
            </label>
          </div>
          <v-btn
            variant="outlined"
            size="small"
            @click="onReset"
            class="reset-filter-btn"
          >
            フィルターリセット
          </v-btn>
        </div>

        <div class="menu-item menu-actions">
          <button type="button" class="button-normal button-exit" @click="onExit">退室</button>
        </div>
      </div>
    </div>

    <!-- メインコンテンツ -->
    <div class="chat-main">

      <!-- タイトル部分 -->
      <div class="chat-header">
        <h1 class="chat-title">旅行計画チャットルーム</h1>
        <p class="user-info">{{ userName }} さんでログイン中</p>
      </div>

      <!-- チャットエリア -->
      <div class="chat-messages" ref="chatListRef">
        <div class="messages-container">
          <!-- メッセージリスト -->
          <div
            v-for="(message, index) in (isEqualArray(isSelected, [false, false, false]) ? chatList : messageList.filter(message => {
              if (!message.labels) return false;
              for(let i = 0; i < isSelected.length; i++) {
                if(isSelected[i] && message.labels.includes(labels[i])) {
                  return true;
                }
              }
              return false;
            }))"
            :key="index"
            :class="[
              'message-item',
              {
                'own-message': message.user === userName,
              }
            ]"
          >
            <div class="message-bubble">
              <div class="message-header">
                <span class="message-user">{{ message.user }}</span>
                <button class="reply-button" @click="onReply(message)" title="リプライ">
                  <v-icon size="16">mdi-reply</v-icon>
                </button>
              </div>
              <div class="message-content">{{ message.text }}</div>
              <div v-if="message.labels && message.labels.length > 0" class="message-labels">
                <v-chip
                  v-for="label in message.labels"
                  :key="label"
                  size="x-small"
                  :color="availableLabels.find(l => l.name === label)?.color"
                  class="message-label"
                >
                  <v-icon
                    size="12"
                    :icon="availableLabels.find(l => l.name === label)?.icon"
                    start
                  ></v-icon>
                  {{ label }}
                </v-chip>
              </div>
              <div class="message-meta">
                <span class="message-time">{{ formatTime(message.dateTime) }}</span>
                <span class="message-date">{{ formatDate(message.dateTime) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 投稿エリア -->
      <div class="chat-input-area">
        <div class="input-container">
          <!-- リプライ表示 -->
          <div v-if="replyMessage" class="reply-section">
            <div class="reply-message">
              <v-icon color="primary" size="16">mdi-reply</v-icon>
              <span class="reply-text">{{ replyMessage.user }}さんへの返信: {{ replyMessage.text }}</span>
              <v-btn
                icon
                size="x-small"
                variant="text"
                @click="clearReply"
                class="clear-reply-btn"
              >
                <v-icon size="16">mdi-close</v-icon>
              </v-btn>
            </div>
          </div>

          <!-- ラベル選択 -->
          <div class="label-selection">
            <p class="label-title">ラベルを選択:</p>
            <div class="label-checkboxes">
              <label
                v-for="(label, i) in labels"
                :key="i"
                class="label-checkbox"
                :class="{ 'selected': isLabeled[i] }"
              >
                <input
                  type="checkbox"
                  v-model="isLabeled[i]"
                  class="checkbox-input"
                >
                <v-icon
                  :icon="availableLabels[i].icon"
                  size="16"
                  :color="isLabeled[i] ? availableLabels[i].color : '#95a5a6'"
                ></v-icon>
                <span class="label-text">{{ label }}</span>
              </label>
            </div>
          </div>

          <!-- メッセージ入力 -->
          <div class="message-input-section">
            <div class="input-wrapper">
              <v-textarea
                v-model="chatContent"
                placeholder="メッセージを入力してください... (Ctrl+Enter / Cmd+Enterで送信)"
                variant="outlined"
                rows="3"
                no-resize
                class="chat-textarea"
                @keydown.enter="onKeydownPublish"
              ></v-textarea>
              <v-btn
                @click="onPublish"
                color="primary"
                size="large"
                class="send-button"
                :disabled="!chatContent.trim()"
              >
                <v-icon>mdi-send</v-icon>
              </v-btn>
            </div>
          </div>
        </div>
      </div>

      <!-- 退室ボタン -->
      <div class="exit-section">
        <v-btn
          @click="onExit"
          block
          varilant="outlined"
          color="success"
          class="exit-main-button"
        >
          退室
        </v-btn>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ページ全体のスタイル */
.chat-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  position: relative;
}

/* メインコンテンツ */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
  padding: 2rem 1rem;
  gap: 1rem;
}

/* チャットタイトル */
.chat-header {
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  text-align: center;
  animation: slideUp 0.6s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.chat-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.user-info {
  color: #7f8c8d;
  font-size: 1rem;
  /* ユーザー名のみ 強調 */
  font-weight: bold;
  margin-top: 4px;
  display: inline-block;
}

/* チャットメッセージエリア */
.chat-messages {
  flex: 1;
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  padding: 1.5rem;
  max-height: 400px;
  min-height: 300px;
}

.messages-container {
  display: flex;
  flex-direction: column-reverse;
  gap: 1rem;
}

.message-item {
  display: flex;
  align-items: flex-start;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-item.own-message {
  justify-content: flex-end;
}


.message-bubble {
  max-width: 70%;
  background: #f8f9fa;
  border-radius: 18px;
  padding: 12px 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.own-message .message-bubble {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
}


.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  font-size: 0.8rem;
  opacity: 0.7;
}

.reply-button {
  background: rgba(52, 152, 219, 0.1);
  border: none;
  border-radius: 8px;
  padding: 4px 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.reply-button:hover {
  background: rgba(52, 152, 219, 0.2);
}

.reply-section {
  margin-bottom: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 12px;
  border-left: 4px solid #3498db;
}

.reply-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.reply-text {
  flex: 1;
  font-size: 0.9rem;
  color: #2c3e50;
}

.clear-reply-btn {
  min-width: auto !important;
  width: 24px !important;
  height: 24px !important;
}

.filter-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin-bottom: 1rem;
}

.filter-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.filter-checkbox:hover {
  background: rgba(255, 255, 255, 0.1);
}

.filter-text {
  font-size: 0.9rem;
  color: #2c3e50;
}

.reset-filter-btn {
  width: 100%;
  margin-top: 0.5rem;
}

.message-user {
  font-weight: 600;
}

.message-meta {
  display: flex;
  gap: 0.5rem;
  font-size: 0.75rem;
}

.message-content {
  font-size: 0.95rem;
  line-height: 1.4;
  word-wrap: break-word;
  white-space: pre-line;
}

.message-labels {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.message-label {
  height: 20px;
}

/* 投稿エリア */
.chat-input-area {
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}

.label-selection {
  margin-bottom: 1rem;
}

.label-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.label-checkboxes {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.label-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem 1rem;
  border-radius: 12px;
  transition: all 0.3s ease;
  border: 2px solid #ecf0f1;
}

.label-checkbox.selected {
  background: #f8f9fa;
  border-color: #3498db;
}

.checkbox-input {
  display: none;
}

.label-text {
  font-size: 0.9rem;
  font-weight: 500;
  color: #2c3e50;
}

.message-input-section {
  display: flex;
  gap: 1rem;
}

.input-wrapper {
  display: flex;
  gap: 1rem;
  width: 100%;
  align-items: flex-end;
}

.chat-textarea {
  flex: 1;
  border-radius: 12px;
}

.send-button {
  border-radius: 12px;
  height: 56px;
  width: 56px;
  min-width: 56px;
  box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
  transition: all 0.3s ease;
}

.send-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(52, 152, 219, 0.4);
}

/* 退室ボタン */
.exit-section {
  text-align: center; /* 退室ボタンの位置を中央に */
}

/* 退室ボタンのスタイル */
.exit-main-button {
  border-radius: 12px; /* 退室ボタンの角を丸く */
  font-weight: 800; /* 退室ボタンのフォントを太く */
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
}

/* 退室ボタンのホバー効果 */
.exit-main-button.v-btn--outlined:hover {
  background-color: rgba(40,167,69,0.1) !important; /* ホバー時の薄緑 */
}



/* ハンバーガーメニュー（元のデザインを保持） */
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
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 50%;
  position: relative;
  cursor: pointer;
  z-index: 2;
  transition: all 0.3s ease;
}

.menu-btn:hover {
  background: rgba(255, 255, 255, 0.3);
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
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.9));
  backdrop-filter: blur(20px);
  transition: all 0.5s;
  padding-top: 80px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  padding: 80px 20px 20px 20px;
}

#menu-btn-check:checked ~ .menu-content {
  right: 0;
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

.user-name {
  font-weight: bold;
  color: #2c3e50;
}

.menu-labels .menu-title {
  font-size: 0.9em;
  color: #777;
  margin: 0 0 10px 0;
}

.menu-actions {
  text-align: center;
}

.button-exit {
  color: #fff;
  background: linear-gradient(135deg, #94e54d, #36eb09); /* 退室ボタンのグラデーション */
  margin-top: 15px;
}

/* スクロールバーのカスタマイズ */
.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}

/* レスポンシブデザイン */
@media (max-width: 768px) {
  .chat-main {
    padding: 1rem 0.5rem;
  }

  .chat-header {
    padding: 1.5rem;
  }

  .chat-title {
    font-size: 1.5rem;
  }

  .message-bubble {
    max-width: 85%;
  }

  .label-checkboxes {
    justify-content: center;
  }

  .input-wrapper {
    flex-direction: column;
    align-items: stretch;
  }

  .send-button {
    height: 48px;
    width: 100%;
    min-width: auto;
  }
}
</style>
