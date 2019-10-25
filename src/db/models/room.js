const mongoose = require("mongoose")

const roomSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    people: [
        {
            id: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                ref: 'Users' // fait la liaison
            }
        }
    ],
    status:{
        type: Boolean,
        required: true
    }

})

const Rooms = mongoose.model("Rooms", roomSchema)
module.exports = Rooms