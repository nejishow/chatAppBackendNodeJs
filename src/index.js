const express = require('express')
const http = require('http')
const path = require('path') // use it to serve up a public directory
const socketio = require('socket.io')
const moment = require("moment")
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express()
const server = http.createServer(app) // express does it already but we do this to use socket.io
const io = socketio(server) // socketio needs the raw http server, when express creates it behind the scene we dont have access to i

app.use(express.json())
const port = process.env.PORT || 3000 //process.env.PORT 
const publicDirectoryPath = path.join(__dirname, '../public/')
app.use(express.static(publicDirectoryPath)) // we link it to the public folder

// app.use(router)
generateMessage = (username, message) => {
    const data = {
        username: username,
        time: moment(new Date().getTime()).format('LLL'),
        message: message
    }
    return data
}

io.on('connection', (socket) => {   // it was app.listen before

    socket.on('join', ({ username, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, username, room })

        if (error) {
            return callback({ error: error })
        }
        socket.join(user.room) //user.room is better because it has been trimmed, data room hasn't
        socket.broadcast.to(user.room).emit("broadcast", generateMessage("Admin",[user.username, ' has joined the chat'])) // send to everyone but this connection

        callback(user)

        io.to(user.room).emit('roomData',{
            room: user.room,
            users: getUsersInRoom(user.room)
        })
    })
    socket.emit('message', generateMessage("Admin","Welcome ")) // send to this particular connecton
    socket.on("message", (message, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('message', generateMessage(user.username, message)) // send to everyone
        callback()
    })
    socket.on("disconnect", () => {
        const user = removeUser(socket.id)
        if (user) {
            io.to(user.room).emit("message", generateMessage("Admin", [user.username, " just left the chat"]))
            io.to(user.room).emit('roomData',{
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }

    })
    socket.on("sendLocation", (position) => {
        const user = getUser(socket.id)
        message = [user.username, " has shared his location, long: ", position.long, ", lat: ", position.lat]
        socket.broadcast.to(user.room).emit("message", generateMessage(message))
    })
})



server.listen(port, () => {   // it was app.listen before
    console.log("server is up on port ", port);
})
