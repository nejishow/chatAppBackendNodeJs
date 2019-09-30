const jwt = require('jsonwebtoken')
const User = require('../db/models/users')


const auth = async (req, res, next) => {

    try {        
        const token = req.header('Authorization')        
        const decode = jwt.verify(token, process.env.JWT_SECRET)  // secret code pour creer le token        
        const user = await User.findOne({ _id: decode._id, 'tokens.token': token })
        if (!user) {
            throw new Error()
        }
        req.token = token
        req.user = user   //on attache l'user retrouvé dans la requete pour gagner du temps, on ne veut pas faire la mm chose deux fois
        next()
    } catch (error) {        
        res.status(401).send('Please authenticate first')
    }
}

module.exports = auth