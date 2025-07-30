const clients = new Map()

export default (io, socket) => {
  const updateParticipants = () => {
    // let participant = "";
    // clients.forEach((value, key, map) => {participant = participant + value + ", "})
    let participant = Array.from(clients.values()).join(", ")
    io.sockets.emit("updateParticipants", participant);
  }

  // 入室メッセージをクライアントに送信する
  socket.on("enterEvent", (data) => {
    socket.broadcast.emit("enterEvent", data)
    clients.set(socket.id, data)
    updateParticipants()
    console.log(clients)
  })

  // 退室メッセージをクライアントに送信する
  socket.on("exitEvent", (data) => {
    socket.broadcast.emit("exitEvent", data)
    clients.delete(socket.id)
    updateParticipants()
  })

  // 投稿メッセージを送信する
  socket.on("publishEvent", (data) => {
    io.sockets.emit("publishEvent", data)
  })

  // ソケット切断時
  socket.on("disconnect", (reason) => {
    clients.delete(socket.id)
    updateParticipants()
    console.log(reason)
  })
}
