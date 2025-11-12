import jwt from 'jsonwebtoken';
import { createError } from './error.js';



const verifyTken = (req, res, next) =>{
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if(!token) return next(createError(401, "You are not authenticated"))

    jwt.verify(token, process.env.JWT_SECRET, (err, user)=>{
        if (err) return next(createError(403, "Token is not valid!"));
        req.user = user;
        next();
    })
}

export default verifyTken