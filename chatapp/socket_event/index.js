import { GoogleGenAI } from "@google/genai"
import dotenv from "dotenv"

dotenv.config()

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "YOUR_API_KEY_HERE"
});

const clients = new Map()
let messages = []
let id = 1

export default (io, socket) => {
  const updateParticipants = () => {
    let participant = Array.from(clients.values()).join(", ")
    io.sockets.emit("updateParticipants", participant);
  }

  socket.on("getId", () => {
    id += 1;
    socket.emit("newId", id);
  })

  // 入室メッセージをクライアントに送信する
  socket.on("enterEvent", (data) => {
    socket.broadcast.emit("enterEvent", data)
    clients.set(socket.id, data)
    updateParticipants()
    //console.log(clients)
  })

  // 退室メッセージをクライアントに送信する
  socket.on("exitEvent", (data) => {
    socket.broadcast.emit("exitEvent", data)
    clients.delete(socket.id)
    updateParticipants()
  })

  // 投稿メッセージを送信する
  socket.on("publishEvent", (data) => {
    messages.unshift(data)
    //console.log(messages)
    io.sockets.emit("publishEvent", data)
  })

  //投稿を削除する
  socket.on("deleteEvent", (data) => {
    var newList = messages.filter((message) => message.id != data.id)
    messages = newList
    io.sockets.emit("deleteMessages", data)
    console.log(messages)
  })

  // ソケット切断時
  socket.on("disconnect", (reason) => {
    clients.delete(socket.id)
    updateParticipants()
    //console.log(reason)
  })

  socket.on("getMessages", (data) => {
    socket.emit("getMessages", messages)
  })

  socket.on("requestGemini", async (data) => {
    const chatHistory = messages.map(message => 
      `${message.user}: ${message.text}`
    ).join('\n');

    const prompt = `以下のチャット履歴を要約して、重要なポイントをまとめてください(新しいチャットが上にあり、古いチャットが下になっています。)：

チャット履歴(何も無い可能性があります。)):

${chatHistory}

(ここまでチャット履歴)
重要な情報、決定事項、注目すべき点を整理して、簡潔にまとめてください。特に、「決まっていること」「やらなければいけないこと」「相談事項」をまとめてください。`;
    console.log("DEBUG(prompt): " + prompt)

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      console.log("Gemini Response:", response.text);
      io.sockets.emit("updateGeminiResponse", response.text)
    } catch (error) {
      console.error("Gemini API Error:", error);
      io.sockets.emit("updateGeminiResponse", error)
    }
  })
}
