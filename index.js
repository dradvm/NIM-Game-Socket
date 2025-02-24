const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const Random = require("./utils/random")

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Cho phép tất cả client kết nối
    },
});
const generatedIds = new Set();

function generateRoomId() {
    let id;
    do {
        id = Math.floor(1000 + Math.random() * 9000).toString(); // 4 chữ số
    } while (generatedIds.has(id));

    generatedIds.add(id);
    return id;
}

const rooms = []

const findRoom = (roomId) => rooms.find((room) => room.id === roomId)
const findRoomByUserId = (userId) => rooms.find((room) => {
    var check = false
    room.clients.forEach((client) => {
        if (client.id === userId) {
            check = true
        }
    })
    return check
});

io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on("callLoadRooms", () => {
        socket.emit("loadRooms", rooms)

    })



    socket.on("createRoom", ({ username, roomname }) => {
        console.log("Tạo phòng")
        const roomId = generateRoomId()
        const gonggis = Array(3).fill(0).map(() => Random.randomNumber(1, 3))
        const roomDetail = {
            id: roomId,
            host: {
                id: socket.id,
            },
            name: roomname,
            maxPlayer: 2,
            clients: [{
                id: socket.id,
                name: username
            }],
            state: "Đang đợi",
            gonggis: gonggis,
            gonggiItems: gonggis.map((numberGonggi) => Array(numberGonggi).fill().map((_, i) => {
                return {
                    index: i,
                    isVisible: true,
                    color: Random.randomColor(),
                    shape: Random.randomShape()
                }
            }))
        }
        rooms.push(roomDetail)
        console.log(rooms)
        socket.join(roomId)
        socket.emit("loadRooms", rooms)
        socket.emit("joinedRoom", {
            firstPlayer: true
        })
    })

    socket.on("joinRoom", ({ username, roomId }) => {
        const room = findRoom(roomId)

        if (room.clients.length < room.maxPlayer) {
            room.clients.push({
                id: socket.id,
                name: username
            })

            if (room.clients.length === room.maxPlayer) {
                room.state = "Đang chơi"
            }

            socket.join(roomId)
            socket.emit("loadRooms", rooms)
            socket.emit("joinedRoom", {
                firstPlayer: false
            })
        }
        else {
            socket.emit("loadRoom")
        }

    })

    socket.on("getGonggis", () => {
        const room = findRoomByUserId(socket.id)
        console.log(room.gonggis)
        socket.emit("gonggis", room.gonggis)
    })

    socket.on("getGonggiItems", () => {
        const room = findRoomByUserId(socket.id)
        socket.emit("gonggiItems", room.gonggiItems)
    })

    socket.on("selectGonggi", ({ newGonggis, newGonggiItems, indexBox }) => {
        const room = findRoomByUserId(socket.id)
        room.gonggis = newGonggis
        room.gonggiItems[indexBox] = newGonggiItems
        socket.emit("gonggis", room.gonggis)
        socket.emit("gonggiItems", room.gonggiItems)
    })

    // Xử lý khi người dùng ngắt kết nối
    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

server.listen(3002, () => {
    console.log("Server is running on port 3002");
});
