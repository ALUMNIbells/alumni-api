import express from "express";

import verifyTken from "../../verifyToken.js";
import SystemState from "../../models/systemState.js";

const router = express.Router();

router.post('/', verifyTken,  async(req, res)=>{
    try {
        if(req.user.role !== 'admin' && req.user.role !== 'super-admin'){
            return res.status(403).json({message: 'Forbidden: You do not have permission to perform this action.'});
        }
        const existing = await SystemState.findOne();
        if(existing){
            return res.status(400).json({message: 'System state already initialized'});
        }
        const doc = await SystemState.create({
            currentSession: "2025/2026",
            fees:{
                alumniDues: 20700,
                alumniDonation: 1700,
                studentTranscript: 0
            },
            souvenirs: []
        })
        res.status(201).json(doc);
        
    } catch (error) {
        console.log(error);
        res.status(500).json({message: 'Internal server error'});
    }
});

router.patch('/', verifyTken, async (req, res)=>{
    try {
        if(req.user.role !== 'admin' && req.user.role !== 'super-admin'){
            return res.status(403).json({message: 'Forbidden: You do not have permission to perform this action.'});
        }

        const { currentSession, fees, souvenirs } = req.body;
        const systemState = await SystemState.findOne();
        if (!systemState) {
            return res.status(404).json({ message: 'System state not found.' });
        }

        if (currentSession) systemState.currentSession = currentSession;
        if (fees){
            systemState.fees.alumniDues = fees.alumniDues || systemState.fees.alumniDues;
            systemState.fees.alumniDonation = fees.alumniDonation || systemState.fees.alumniDonation;
            systemState.fees.studentTranscript = fees.studentTranscript || systemState.fees.studentTranscript;
        }

        await systemState.save();
        res.status(200).json(systemState);
    } catch (error) {
        console.log(error);
        res.status(500).json({message: 'Internal server error'});
    }
})

//add souvenir
router.post('/souvenir', verifyTken, async (req, res)=>{
    try {
        if(req.user.role !== 'admin' && req.user.role !== 'super-admin'){
            return res.status(403).json({message: 'Forbidden: You do not have permission to perform this action.'});
        }
        const { sku, name, price } = req.body;
        if (!sku || !name) {
            return res.status(400).json({ message: 'Missing required fields.' });
        }
        const systemState = await SystemState.findOne();
        if (!systemState) {
            return res.status(404).json({ message: 'System state not found.' });
        }
        systemState.souvenirs.push({ sku, name, price });
        await systemState.save();
        res.status(201).json(systemState);
    } catch (error) {
        console.log(error);
        res.status(500).json({message: 'Internal server error'});
    }
})

//get souvenirs
router.get("/souvenirs", async (req, res) => {
  try {
    const state = await SystemState.findOne().lean();
    const souvenirs = state?.souvenirs ?? [];
    return res.status(200).json(souvenirs);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

//udate souvenir
router.patch('/souvenir/:sku', verifyTken, async (req, res)=>{
    try {
        if(req.user.role !== 'admin' && req.user.role !== 'super-admin'){
            return res.status(403).json({message: 'Forbidden: You do not have permission to perform this action.'});
        }
        const { sku } = req.params;
        const { name, price, active } = req.body;
        const systemState = await SystemState.findOne();
        if (!systemState) {
            return res.status(404).json({ message: 'System state not found.' });
        }
        const souvenir = systemState.souvenirs.find(s => s.sku === sku);
        if (!souvenir) {
            return res.status(404).json({ message: 'Souvenir not found.' });
        }
        if (name) souvenir.name = name;
        if (price) souvenir.price = price;
        if (active !== undefined) souvenir.active = active;
        await systemState.save();
        res.status(200).json(systemState);
    } catch (error) {
        console.log(error);
        res.status(500).json({message: 'Internal server error'});
    }
})

router.delete('/souvenir/:sku', verifyTken, async(req,res)=>{
    try {
        const systemState = await SystemState.findOne();
        if (!systemState) {
            return res.status(404).json({ message: 'System state not found.' });
        }
        const souvenirIndex = systemState.souvenirs.findIndex(s => s.sku === req.params.sku);
        if (souvenirIndex === -1) {
            return res.status(404).json({ message: 'Souvenir not found.' });
        }
        systemState.souvenirs.splice(souvenirIndex, 1);
    } catch (error) {
        
    }
})

export default router;