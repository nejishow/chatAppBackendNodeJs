const mongoose = require("mongoose")

const chatSchema = new mongoose.Schema({
    sentBy: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User' // fait la liaison
    },
    receivedBy: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User' // fait la liaison
    },
    body: {
        type: String,
        required: true
    },
    idRoom: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Room' // fait la liaison
    }


}, {
    timestamps: true
})
chatSchema.virtual('room', { //creer une liaison virtuelle, les donnees ne sont pas save dans la db,
    ref: 'Rooms',
    localField: 'idRoom', //la reference idRoom dans cette db equivaut à _id dans la db des rooms
    foreignField: '_id'
})

const Chats = mongoose.model("Chats", chatSchema)
module.exports = Chats