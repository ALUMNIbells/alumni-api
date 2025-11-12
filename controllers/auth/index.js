import Student from "../../models/Student.js";
import Transaction from "../../models/Transaction.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { Resend } from 'resend';
import { getEnv, listEnv } from "swiftenv";

const {RESEND_API_KEY} = listEnv();
const resend = new Resend(RESEND_API_KEY); 

export const SignUp = async (req, res, next) => {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(req.body.password, salt);
    const user = await Student.findOne({email: req.body.email}); 
    if (user) {
        return res.status(400).json({message: 'User already exists'});
    }
    const transaction = await Transaction.findOne({email: req.body.email, status: 'completed'});
    if(!transaction){
        return res.status(400).json({message: 'No payment record found for this email. Please complete your payment before signing up.'});
    }
    let token, tokenExpiry;
    //generate verification token and send email (omitted for brevity)
    token = Math.floor(100000 + Math.random() * 900000).toString();
    tokenExpiry = Date.now() + 5 * 60 * 1000; // 30 minutes from now

    const newUser = new Student({
        matricNo: transaction.matricNo,
        fullName: transaction.fullName,
        email: transaction.email,
        phone: transaction.phone,
        college: transaction.college,
        course: transaction.course,
        password: hash,
        token,
        tokenExpiry
    });
    await newUser.save();

    const data = {
        to: req.body.email,
        subject: "Verify your email address",
        text: `Your verification token is ${token}`,
    };

    await resend.emails.send(data);

    return res.status(200).json({message: 'User created successfully'});
}

export const SignIn = async (req, res, next) => {
    const user = await Student.findOne({email: req.body.email});
    if (!user) {
        return res.status(404).json({message: 'User not found'});
    }
    if(!user.verified) {
        return res.status(401).json({message: 'Email not verified'});
    }
    const isPasswordCorrect = bcrypt.compareSync(req.body.password, user.password);
    if (!isPasswordCorrect) {
        return res.status(400).json({message: 'Invalid password'});
    }
    const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn: '1d'});
    return res.status(200).json({token, user: {id: user._id, fullName: user.fullName, email: user.email}});
}

export const VerifyEmail = async (req, res, next) => {
    const { email, token } = req.body;
    const user = await Student.findOne({email});
    if (!user) {
        return res.status(404).json({message: 'User not found'});
    }
    if (user.verified) {
        return res.status(400).json({message: 'Email already verified'});
    }
    if (user.token !== token) {
        return res.status(400).json({message: 'Invalid token'});
    }
    if (user.tokenExpiry < Date.now()) {
        return res.status(400).json({message: 'Token expired'});
    }
    user.verified = true;
    user.token = null;
    user.tokenExpiry = null;
    await user.save();
    return res.status(200).json({message: 'Email verified successfully'});
}

export const ResendVerificationToken = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await Student.findOne({email});
        if (!user) {
            return res.status(404).json({message: 'User not found'});
        }
        if (user.verified) {
            return res.status(400).json({message: 'Email already verified'});
        }
        const token = Math.floor(100000 + Math.random() * 900000).toString();
        const tokenExpiry = Date.now() + 5 * 60 * 1000; // 30 minutes from now
        user.token = token;
        user.tokenExpiry = tokenExpiry;
        await user.save();

        const data = {
            to: email,
            subject: "Resend: Verify your email address",
            text: `Your new verification token is ${token}`,
        };

        await resend.emails.send(data);

        return res.status(200).json({message: 'Verification token resent successfully'});
    } catch (error) {
        console.error(error);
        return res.status(500).json({message: 'Internal server error'});
    }
    
}

