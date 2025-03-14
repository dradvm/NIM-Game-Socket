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
        id = Math.floor(1000 + Math.random() * 9000).toString();
    } while (generatedIds.has(id));

    generatedIds.add(id);
    return id;
}

var rooms = []

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
const findRoomByHostUserId = (userId) => rooms.find((room) => room.host.id === userId)
const removeUser = (userId) => {
    rooms.forEach((room) => {
        if (room.clients.map((client) => client.id).includes(userId)) {
            room.clients = room.clients.filter((client) => client.id !== userId)
            io.to(room.id).emit("players", room.clients.map((client) => client.name))
        }
    })
    rooms = rooms.filter((room) => room.clients.length !== 0)
}
const removeRoom = (room) => {
    room.clients.forEach((client) => {
        const clientSocket = io.sockets.sockets.get(client.id)
        if (clientSocket) {
            clientSocket.leave(room.id)
            if (room.host.id !== client.id) {
                clientSocket.emit("roomDeleted")
            }
        }
    })
    rooms = rooms.filter((r) => r !== room)
}

const exit = (socket) => {
    var room = findRoomByHostUserId(socket.id)

    if (room) {
        removeRoom(room)
    }
    else {
        removeUser(socket.id)
    }
    io.emit("loadRooms", rooms)
}

io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on("callLoadRooms", () => {
        socket.emit("loadRooms", rooms)

    })



    socket.on("createRoom", ({ username, roomname, level }) => {
        const roomId = generateRoomId()
        const gonggis = Array(level.numberGonggiBox).fill(0).map(() => Random.randomNumber(1, level.numberGonggiBox))
        const room = {
            id: roomId,
            level: level,
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
            turn: true,
            gonggis: gonggis.map((numberGonggi) => Array(numberGonggi).fill().map((_, i) => {
                return {
                    index: i,
                    isVisible: true,
                    color: Random.randomColor(),
                    shape: Random.randomShape()
                }
            })),
        }
        rooms.push(room)
        socket.join(roomId)
        io.emit("loadRooms", rooms)
        socket.emit("joinedRoom", {
            firstPlayer: true,
            level: room.level
        })
    })

    socket.on("resetGame", () => {
        const room = findRoomByUserId(socket.id)
        room.gonggis = Array(room.level.numberGonggiBox).fill(0).map(() => {
            const randomSize = Random.randomNumber(1, room.level.numberGonggiBox)
            return Array(randomSize).fill().map((_, i) => ({
                index: i,
                isVisible: true,
                color: Random.randomColor(),
                shape: Random.randomShape()
            }));
        })
        io.to(room.id).emit("gonggis", room.gonggis)
        room.turn = true
        io.to(room.id).emit("turn", room.turn)
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
            io.emit("loadRooms", rooms)
            socket.emit("joinedRoom", {
                firstPlayer: false,
                level: room.level
            })
            io.to(room.id).emit("players", room.clients.map((client) => client.name))
        }
        else {
            io.emit("loadRooms", rooms)
        }

    })

    socket.on("getGonggis", () => {
        const room = findRoomByUserId(socket.id)
        socket.emit("gonggis", room.gonggis)
    })

    socket.on("getPlayers", () => {
        const room = findRoomByUserId(socket.id)
        io.to(room.id).emit("players", room.clients.map((client) => client.name))
    })


    socket.on("selectGonggi", ({ index, indexBox }) => {
        const room = findRoomByUserId(socket.id)
        room.gonggis[indexBox].forEach((gonggi) => {
            if (gonggi.isVisible) {
                gonggi.isVisible = room.turn ? !(gonggi.index <= index) : !(gonggi.index >= index)
            }
        })
        room.turn = !room.turn
        io.to(room.id).emit("turn", room.turn)
        io.to(room.id).emit("gonggis", room.gonggis)
    })

    socket.on("quitRoom", () => {

        exit(socket)


    })

    socket.on("disconnect", () => {
        exit(socket)
        console.log(`User disconnected: ${socket.id}`);
    });
});

server.listen(3001, () => {
    console.log("Server is running on port 3003");
});
