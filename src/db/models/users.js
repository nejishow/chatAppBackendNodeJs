const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Tasks = require('../models/tasks')
const Chats = require('../models/chat')
const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        Lname: {
            type: String,
            required: true,
            trim: true
        },
        searchName: {
            type: String,
            trim: true
        },
        email: {
            type: String,
            required: true,
            trim: true,
            unique: true,  // mieux vaut configurer ca des le debut sinn  tu es obligé de supprimer la db et ca deviendra effectif apres
            lowercase: true,
            validate(value) {
                const isEmail = validator.isEmail(value) //verifie si c'est un email
                if (!isEmail) {
                    throw new Error('no email')
                }
            }
        },
        age: {
            type: Number,
            default: 0,
            validate(value) {
                if (value < 0) {
                    throw new Error("Veuillez s'il vous plait fournir un age correct")
                }
            }
        },
        password: {
            type: String,
            required: true,
            minlength: 6,
            trim: true,
            validate(value) {
                if (value.includes("password")) {
                    throw new Error("please provide a better password")
                }
            }
        },
        tokens: [{
            token: {
                type: String,
                required: true
            }
        }],
        friends: [{
            _id: {
                type: String,
            },
            status : {
                type:String
            }
        }],
        request: [{
            _id: {
                type: String,
            },
            status : {
                type:String
            }
        }],
        avatar: {
            type: Buffer
        },
    }, {
        timestamps: true
    })

    userSchema.virtual('tasks', { //creer une liaison virtuelle, les donnees ne sont pas save dans la db,
        ref: 'Tasks',
        localField: '_id', //la reference _id dans cette db equivaut à owner dans la db des tasks
        foreignField: 'owner'
    })
    userSchema.virtual('chats', { //creer une liaison virtuelle, les donnees ne sont pas save dans la db,
        ref: 'Chats',
        localField: '_id', //la reference _id dans cette db equivaut à owner dans la db des tasks
        foreignField: 'sentBy'
    })
    userSchema.virtual('chats', { //creer une liaison virtuelle, les donnees ne sont pas save dans la db,
        ref: 'Chats',
        localField: '_id', //la reference _id dans cette db equivaut à owner dans la db des tasks
        foreignField: 'receivedBy'
    })


userSchema.statics.findByCredentials = async (email, password) => {  // userSchema.statics te permet de creer des fonctions utilisables depuis le model respectif dans notre cas "Users"
    const user = await User.findOne({ email })
    if (!user) {
        throw new Error("Unable to login")
    }
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
        throw new Error("Unable to login")
    }
    return user
}

// middleware
userSchema.methods.generateAuthToken = async function () { // la difference entre statics & methods, static works with model ex: Users , method works with instance ex: user
    const user = this
    const token = await jwt.sign({ _id: user._id.toString() }, 'thisismynewcourse')
    user.tokens = user.tokens.concat({ token: token })

    await user.save()
    return token
}
userSchema.methods.toJSON = function () {  //ca filtre les donnees retournees via json as light as possible, pas besoin de token psword e avatar
    const user = this
    const userObject = user.toObject()
    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar
    return userObject
}


//delete user's tasks when he is deleted

userSchema.pre('remove', async function (next) {
    const user = this
    await Tasks.deleteMany({ owner: user._id })
    await Chats.deleteMany({ sentBy: user._id })

    next()
})




userSchema.pre('save', async function (next) {  // hash the password before saving
    const user = this
    if (user.isModified("password")) {
        user.password = await bcrypt.hash(user.password, 8)
    }
    next() // indispensable sinn operation pending
})
const User = mongoose.model('User', userSchema)

module.exports = User