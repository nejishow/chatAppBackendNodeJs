const express = require('express')
const router = new express.Router()
const Tasks = require('../db/models/tasks')
const auth = require('../middleware/auth')

router.post('/tasks', auth, async (req, res) => {
    const task = new Tasks({
        ...req.body,
        owner: req.user._id
    })
    try {
        await task.save()
        res.send(task)
    } catch (error) {
        res.status(400).send(error)
    }

})
// get /task?completed=true
// get /task?limit=2&skip=2
// get /task?sortBy=createdAt:desc
router.get('/tasks', auth, async (req, res) => {
    const match = {}
    const sort = {}
    if (req.query.completed) {
        match.completed = req.query.completed === 'true'
    }
    if(req.query.sortBy) {
        const part = req.query.sortBy.split(':')
        sort[part[0]] = sort[part[1]]=== 'desc'? -1 : 1
    }
    try {

       // const tasks = await Tasks.find({ owner: req.user._id }) old command

        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit : parseInt(req.query.limit),
                sort
            }
        }).execPopulate()
        if (!req.user.tasks) {
            return res.status(404).send()
        }
        res.send(req.user.tasks)
    } catch (error) {
        res.status(500).send()

    }
})
router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id
    try {
        const task = await Tasks.findOne({ _id, owner: req.user._id })
        if (!task) {
            return res.status(404).send()
        }
        res.send(task)
    } catch (error) {
        res.status(500).send()
    }
})

router.patch('/tasks/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ["name", "completed", "description"]
    const isvalid = updates.every((update) => allowedUpdates.includes(update))
    if (!isvalid) {
        res.sendStatus(400).send({ 'error': 'bad request' })
    }
    try {
        const task = await Tasks.findOne({ _id: req.params.id, owner: req.user._id })

        //   const task = await Tasks.findByIdAndUpdate(req.params.id, req.body, { runValidators: true, new: true })
        if (!task) {
            return res.sendStatus(404).send()
        }
        updates.forEach((update) => task[update] = req.body[update])
        await task.save()
        res.send(task)
    } catch (error) {
        res.sendStatus(500).send()
    }
})
router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Tasks.findOneAndDelete({ _id: req.params.id, owner: req.user._id })
        if (!task) {
            return res.sendStatus(404).send()
        }
        res.send(task)
    } catch (error) {
        res.sendStatus(500).send()
    }
})
module.exports = router