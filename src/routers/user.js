const express = require('express')
const router = new express.Router()
const Rooms = require('../db/models/room')
const Users = require("../db/models/users")
const auth = require('../middleware/auth')
const multer = require('multer')
const sharp = require('sharp')
const { sendWelcomeMail, sendCancellationMail } = require('../emails/account')

var corsOptions = {
    origin: 'http://localhost:4200/',
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

router.post('/users', async (req, res) => { //create a new user
    const user = new Users(req.body)
    user.searchName = new String(req.body.name + req.body.Lname).toLowerCase()
    try {
        await user.save()
        sendWelcomeMail(user.email, user.name)
        const token = await user.generateAuthToken()
        res.status(201).send({ user, token })

    } catch (error) {
        res.status(400).send(error)

    }

})


router.post('/users/login', async (req, res) => { // log the user in
    try {
        const user = await Users.findByCredentials(req.body.email, req.body.password)   // function created with userSchema.Static , check the model        
        const token = await user.generateAuthToken()
        res.send({ user, token })
    } catch (error) {
        res.status(400).send("Veuillez entrer les bons credentials")
    }
})
router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token //enleve le token utilisé des autres tokens enregistré pour k seul le device en question se deconnecte
        })
        await req.user.save()
        res.send()
    } catch (error) {
        res.status(500).send()
    }
})

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send()
    } catch (error) {
        res.status(500).send()
    }
})

router.get('/users/me', auth, async (req, res) => { // get user's info
    res.send(req.user)
})
router.get('/users/allFriends', auth, async (req, res) => { // get user's friends  to finish this
    res.send(req.user.friends)
})
router.get('/users/request', auth, async (req, res) => { // get user's friends  to finish this
    res.send(req.user.request)
})
router.patch('/users/seeNotif', auth, async (req, res) => { // get user's friends  to finish this
    req.user.request.updateMany()
    res.send(req.user.friends)
})

router.get('/users/:id', async (req, res) => {  //find user by id
    const id = req.params.id
    try {
        const user = await Users.findById(id)
        if (!user) {
            return res.status(404).send()
        }
        res.send(user)

    } catch (error) {
        res.status(500).send()
    }
})

router.post('/users/friend', auth, async (req, res) => {  //find user by username
    const username = req.body.username.toLowerCase()
    const users = []
    try {
        const users1 = await Users.find({});
        users1.forEach((user) => {
            if (user.searchName.includes(username)) {
                users.push(user)
            }
        });

        if (users.length == 0) {
            return res.send({ "error": "Pas d'utilisateur sous ce nom" })
        }
        res.send(users)

    } catch (error) {
        res.status(500).send({ "error": error | "Oups une erreur est survenue veuillez reesseyer" })
    }
})

router.patch('/users/friendRequest', auth, async (req, res) => {  //friendship request
    const updates = Object.keys(req.body)
    const allowedUpdates = ["id"]
    const isvalid = updates.every((update) => allowedUpdates.includes(update))
    if (!isvalid) {
        return res.sendStatus(400).send({ 'error': 'invalid operations' })
    }
    try {
        req.user.friends = req.user.friends.concat({ _id: req.body.id, status: "pending" })
        const friend = await Users.findById(req.body.id)
        friend.request = friend.request.concat({ _id: req.user._id, status: "pending" })
        await req.user.save()
        await friend.save()
        res.status(201).send()

    } catch (error) {
        res.status(500).send({ "error": "Oups une erreur est survenue veuillez reesseyer" })
    }
})
router.patch('/users/deleteFriend', auth, async (req, res) => {
    await Users.findByIdAndUpdate(req.body.id, { $pull: { friends: { _id: req.user._id, status: "friend" } } })
    // change request and friend status from the receiver
    await Users.findByIdAndUpdate(req.user._id, { $pull: { request: { _id: req.body.id, status: "friend" } } })

    res.status(201).send()
})
router.patch('/users/answerRequest', auth, async (req, res) => {  //friendship request

    try {
        if (req.body.answer == 'yes') {
            // change friend status from sender
            await Users.findByIdAndUpdate(req.body.id, { $pull: { friends: { _id: req.user._id, status: "pending" } } })
            await Users.findByIdAndUpdate(req.body.id, { $push: { friends: { _id: req.user._id, status: "friend" } } })
            // change request and friend status from the receiver
            await Users.findByIdAndUpdate(req.user._id, { $push: { friends: { _id: req.body.id, status: "friend" } } })
            await Users.findByIdAndUpdate(req.user._id, { $pull: { request: { _id: req.body.id, status: "pending" } } })
            const friend = await Users.findById(req.body.id)
            const body = {
                '_id': req.body.id + req.user_id,
                "name": req.user.name +'&'+ friend.name,
                "people": [
                    {
                        "_id": req.body.id
                    },
                    {
                        "_id": req.user._id
                    }
                ],
                "status": true
            }
            const room = new Rooms(body)
            await room.save()
            res.status(201).send(room)
        } else {
            //change friend status from sender
            await Users.findByIdAndUpdate(req.body.id, { $pull: { friends: { _id: req.user._id, status: "pending" } } })
            //change request status from receiver
            await Users.findByIdAndUpdate(req.user._id, { $pull: { request: { _id: req.body.id, status: "pending" } } })
            res.status(201).send()
        }


    } catch (error) {
        res.status(500).send(error)
    }
})

router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ["name", "age", "password"]
    const isvalid = updates.every((update) => allowedUpdates.includes(update))
    if (!isvalid) {
        return res.sendStatus(400).send({ 'error': 'invalid operations' })
    }
    try {                       //
        updates.forEach((update) => req.user[update] = req.body[update]) // ce code est fait pour utiliser le middleware l'autre en bas a eté commenté
        await req.user.save()                                           // le middleware est programmé avec la fonction save donc il faut utiliser save

        res.send(req.user)
    } catch (error) {
        res.sendStatus(500).send()
    }
})
router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove()
        sendCancellationMail(req.user.email, req.user.name)
        res.send(req.user)
    } catch (error) {
        res.sendStatus(500).send()
    }
})
const upload = new multer({
    limits: {
        fileSize: 500000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Please upload a picture'))
        }
        return cb(undefined, true)
    }
})
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 200 }).png().toBuffer()  // req.file.buffer est le
    req.user.avatar = buffer
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})

router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send()
})

router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await Users.findById(req.params.id)
        if (!user || !user.avatar) {
            res.status(404).send()
        }
        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    } catch (error) {
        res.status(400).send()

    }
})
// router.use(router)
module.exports = router
