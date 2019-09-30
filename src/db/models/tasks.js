const mongoose = require('mongoose')

const taskSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    completed: {
        type: Boolean,
        default: false
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User' // fait la liaison
    }
},
{
    timestamps: true     // permet de creer automatiquement createdAt and updatedAt, c'est une option 
})

const Tasks = mongoose.model("Tasks", taskSchema)

module.exports = Tasks