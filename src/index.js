const express = require('express')
const http = require('http')
const path = require('path') // use it to serve up a public directory
const socketio = require('socket.io')
const cors = require("cors")
const moment = require("moment")
const userRouter = require('./routers/user')
const taskRouter = require('../src/routers/task')
require('./db/mongoose')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')
var corsOptions = {
    origin: 'http://localhost:4200',
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
  }
const app = express()
const server = http.createServer(app) // express does it already but we do this to use socket.io
const io = socketio(server) // socketio needs the raw http server, when express creates it behind the scene we dont have access to i

app.use(express.json())
app.options('*', cors(corsOptions)) // include before other routes

const port = process.env.PORT || 3000 //process.env.PORT  // je viens d'automatiser les variables d'environnment|| 3000 //quand heroku voudra mettre deployer sur le port 80 ca sera automatiques sinn il prend 3000
const publicDirectoryPath = path.join(__dirname, '../public/')
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-Width, Content-Type, Accept,Authorization");
    res.header('Access-Control-Allow-Methods', 'PATCH','PUT, POST, GET, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }  });
app.use(express.static(publicDirectoryPath)) // we link it to the public folder
app.use(express.json()) //parse incoming json into object

app.use(userRouter) //c'est comme ca qu'on utilise les routeurs à la racine de l'app
app.use(taskRouter)


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






