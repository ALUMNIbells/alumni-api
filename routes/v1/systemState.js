import express from "express";

import verifyTken from "../../verifyToken.js";
import SystemState from "../../models/systemState.js";

const router = express.Router();

router.post('/', ()=>{
    SystemState.create({
        currentSession: "2024/2025",
        alumniDues: 0,
        sourvenierPrice: 0
    });
});

router.patch('/', verifyTken, async (req, res)=>{
    try {
        await SystemState.findOneAndUpdate({
            
        }, {
            $set: {
                currentSession: req.body.currentSession,
                alumniDues: req.body.alumniDues,
                sourvenierPrice: req.body.sourvenierPrice
            }
        }, {
            new: true
        })
        res.status(200).json({message: 'System state updated successfully'}); 
    } catch (error) {
        console.log(error);
        res.status(500).json({message: 'Internal server error'});
    }
})


export default router;