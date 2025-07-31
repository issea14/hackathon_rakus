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
}
