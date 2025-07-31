<script setup>
import { inject, ref } from "vue"
import { useRouter } from "vue-router"
import socketManager from '../socketManager.js'

// ユーザーアイコンのインポート
import userIcon from '../images/user-solid.svg'

// #region global state
const userName = inject("userName")
// #endregion

// #region local variable
const router = useRouter()
const socket = socketManager.getInstance()
// #endregion

// #region reactive variable
const inputUserName = ref("")
// #endregion

// #region browser event handler
const onEnter = () => {
  // ユーザー名が入力されているかチェック
  if (inputUserName.value.trim() === "") {
    alert("ユーザー名を入力してください")
    return
  }

  // 入室メッセージを送信
  socket.emit("enterEvent", inputUserName.value.trim())

  // 全体で使用するnameに入力されたユーザー名を格納
  userName.value = inputUserName.value.trim()

  // チャット画面へ遷移
  router.push({ name: "chat" })
}
// #endregion
</script>


<template>
  <div class="login-container"> <!-- ページ全体のスタイル -->
    <div class="login-card"> <!-- ログインカードのスタイル -->

      <!-- ヘッダーセクション -->
      <div class="header-section">
        <div class="icon-wrapper">
          <img :src="userIcon" alt="ユーザーアイコン" class="header-user-icon" /> <!-- ユーザーアイコン -->
        </div>
        <h1 class="login-title">ラベリングで管理する旅行計画チャット</h1> <!-- タイトル -->
        <p class="login-subtitle">チャットルームへようこそ</p> <!-- サブタイトル -->
      </div>

      <!-- フォームセクション -->
      <div class="form-section">
        <div class="input-group">
          <label class="input-label">ユーザー名</label>
          <v-text-field
            v-model="inputUserName"
            placeholder="ユーザー名を入力してください"
            variant="outlined"
            density="comfortable"
            class="username-input"
            @keyup.enter="onEnter"
          >
            <template #prepend-inner> <!-- 入力欄の先頭にアイコンを表示 -->
              <img :src="userIcon" alt="ユーザーアイコン" class="input-user-icon" />
            </template>
          </v-text-field>
          <!--
          placeholder : 入力欄のヒント
          variant : テキストフィールドのスタイル(枠線のみ)
          density : テキストフィールドの広さ
          prepend-inner-icon : 入力欄の先頭にアイコンを表示
          @keyup.enter : Enterキーで入室処理を実行(onEnterメソッドの呼び出し)
          -->
        </div>

        <!-- 入室ボタン -->
        <v-btn
          @click="onEnter"
          color="primary"
          size="large"
          class="enter-button"
          block
        >
          入室する
        </v-btn>
        <!--
        @click : ボタンがクリックされたときにonEnterメソッドを呼び出す
        color : ボタンの色
        size : ボタンのサイズ
        class : ボタンのスタイル
        block : ボタンを横幅いっぱいに広げる
        -->

      </div>

      <!-- フッターセクション -->
      <div class="footer-section">
        <p class="footer-text">チャットを始めましょう！</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ヘッダーのアイコン */
.header-user-icon {
  position: absolute;    /* 親 .icon-wrapper に対する絶対配置 */
  top: 50%;              /* 親の縦方向 50% の位置 */
  left: 50%;             /* 親の横方向 50% の位置 */
  transform: translate(-50%, -50%); /* 自身の中心をその座標に合わせる */
  width: 48px;
  height: 48px;
}

/* テキストフィールド内のアイコン */
.input-user-icon {
  width: 24px;
  height: 24px;
  margin: 0 5px 0 0; /* アイコンの右側にスペースを確保 */
  display: inline-block; /* インラインブロックでテキストと同じ行に配置 */
  vertical-align: middle; /* 中央揃え */
  border-right: 1px solid #ccc; /* アイコンの右側に薄い線 */
  padding-right: 12px; /* アイコンとテキストの間にスペースを確保 */
}

/* ログイン画面のスタイル */
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); /* グラデーション背景 */
  display: flex;
  align-items: center; /* 縦方向中央揃え */
  justify-content: center; /* 横方向中央揃え */
  padding: 20px; /* 画面端からの余白 */
}

/* ログインカードのスタイル */
.login-card {
  background: white; /* 白背景 */
  border-radius: 20px; /* 角丸 */
  padding: 40px; /* 内側の余白 */
  max-width: 400px; /* 最大幅 */
  width: 100%; /* 幅を100%に設定 */
  text-align: center; /* テキストを中央揃え */
  animation: slideUp 0.6s ease-out; /* スライドアップアニメーション(Reload時) */
}

/* スライドアップアニメーション */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(35px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ヘッダーセクションのスタイル */
.header-section {
  margin-bottom: 30px; /* ヘッダーとフォームの間の余白 */
}


.icon-wrapper {
  position: relative;    /* 子要素に absolute を効かせる */
  background: linear-gradient(135deg, #3498db, #2980b9); /* グラデーション背景 */
  width: 80px;
  height: 80px;
  border-radius: 50%; /* 円形にする */
  display: flex;
  align-items: center; /* 縦方向中央揃え */
  justify-content: center; /* 横方向中央揃え */
  margin: 0 auto 20px; /* 上下中央揃え */
  box-shadow: 0 10px 30px rgba(52, 152, 219, 0.3); /* 影 */
}

/* タイトルのスタイル */
.login-title {
  font-size: 2rem; /* タイトルのフォントサイズ */
  margin-bottom: 8px; /* タイトルとサブタイトルの間の余白 */
  background: linear-gradient(135deg, #667eea, #764ba2); /* グラデーション(背景と同じ色) */
  -webkit-background-clip: text; /* テキストの背景をクリップ */
  -webkit-text-fill-color: transparent; /* テキストの色を透明にしてグラデーションを適用 */
  background-clip: text; /* テキストの背景をクリップ */
}

/* サブタイトルのスタイル */
.login-subtitle {
  color: #7f8c8d;
  font-size: 1rem;
  margin-bottom: 0;
}

/* フォームセクションのスタイル */
.form-section {
  margin-bottom: 30px; /* フォームとフッターの間の余白 */
}

/* 入力フィールドのスタイル */
.input-group {
  text-align: left; /* テキストを左揃え */
  margin-bottom: 20px; /* 入力フィールドとボタンの間の余白 */
}

/* 入力ラベルのスタイル */
.input-label {
  display: block;
  color: #2c3e50;
  margin-bottom: 8px; /* ラベルと入力フィールドの間の余白 */
  font-size: 0.9rem;
}

.username-input {
  margin-bottom: 5px; /* 入力フィールドとボタンの間の余白 */
}

.enter-button {
  border-radius: 12px;
  height: 48px;
  font-weight: 600;
  text-transform: none;
  box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
  transition: all 0.3s ease;
}

/* 入室ボタンのホバー効果(カーソル指示時) */
.enter-button:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(52, 152, 219, 0.4);
}


/* フッターセクションのスタイル */
.footer-section {
  border-top: 2px solid #ecf0f1; /* フッターの上に薄い線 */
  padding-top: 20px; /* フッターの内側の余白 */
}

.footer-text {
  color: #95a5a6;
  font-size: 0.9rem;
  margin: 0;
}

/* スマートフォンやタブレット向けのレスポンシブデザイン */
@media (max-width: 480px) {
  .login-card {
    padding: 30px 20px;
    margin: 10px;
  }

  .login-title {
    font-size: 1.5rem;
  }

  .icon-wrapper {
    width: 60px;
    height: 60px;
  }

}

</style>
