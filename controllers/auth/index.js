import Student from "../../models/Student.js";
import Transaction from "../../models/Transaction.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { Resend } from 'resend';
import { getEnv, listEnv } from "swiftenv";
import Admin from "../../models/Admin.js";
import { emailVerificationTemplate } from "../../utils/emailTemplates.js";

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
    tokenExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes from now

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


    const { data, error } = await resend.emails.send({
        from: 'Bells University Alumni Association <noreply@notifications.bellsuniversityalumni.com>',
        to: req.body.email,
        subject: 'Verify your email address',
        html: emailVerificationTemplate(transaction.fullName, token),
    });

    if (error) {
        return console.error({ error });
    }

    console.log({ data });

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
    const token = jwt.sign({id: user._id, email: user.email, fullName: user.fullName, role: 'student'}, process.env.JWT_SECRET, {expiresIn: '1d'});
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

        const { data, error } = await resend.emails.send({
            from: 'Bells University Alumni Association <noreply@notifications.bellsuniversityalumni.com>',
            to: email,
            subject: 'Verify your email address',
            html: emailVerificationTemplate(user.fullName, token),
        });

        if (error) {
            return console.error({ error });
        }

        console.log({ data });

        return res.status(200).json({message: 'Verification token resent successfully'});
    } catch (error) {
        console.error(error);
        return res.status(500).json({message: 'Internal server error'});
    }
    
}

export const AddAdmin = async (req, res, next) => {
    if(req.user.role !== 'admin'){
        return res.status(403).json({message: 'You are not authorized to perform this action'});
    }
    if(!req.body.email || !req.body.password || !req.body.fullName){
        return res.status(400).json({message: 'Missing required fields.'});
    }
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(req.body.password, salt);
    const user = await Admin.findOne({email: req.body.email}); 
    if (user) {
        return res.status(400).json({message: 'User already exists'});
    }
    
    const newUser = new Admin({
       ...req.body,
        password: hash,
    });
    await newUser.save();

    return res.status(200).json({message: 'User created successfully'});

}
export const AdminSignIn = async (req, res, next) => {
    const user = await Admin.findOne({email: req.body.email});
    if (!user) {
        return res.status(404).json({message: 'User not found'});
    }
    const isPasswordCorrect = bcrypt.compareSync(req.body.password, user.password);
    if (!isPasswordCorrect) {
        return res.status(400).json({message: 'Invalid password'});
    }
    const token = jwt.sign({id: user._id, email: user.email, fullName: user.fullName, role: 'admin'}, process.env.JWT_SECRET);
    return res.status(200).json({token, user: {id: user._id, fullName: user.fullName, email: user.email}});
}

export const DeleteAdmin = async (req, res, next) => {
    if(req.user.role !== 'admin'){
        return res.status(403).json({message: 'You are not authorized to perform this action'});
    }
    const { adminId } = req.params;
    const user = await Admin.findById(adminId);
    if (!user) {
        return res.status(404).json({message: 'User not found'});
    }
    await user.remove();
    return res.status(200).json({message: 'User deleted successfully'});
}

export const GetAllAdmins = async (req, res, next) => {
    if(req.user.role !== 'admin'){
        return res.status(403).json({message: 'You are not authorized to perform this action'});
    }
    const admins = await Admin.find().select('-password');
    return res.status(200).json(admins);
}

export const AdminChangePassword = async (req, res, next) => {
    if(req.user.role !== 'admin'){
        return res.status(403).json({message: 'You are not authorized to perform this action'});
    }
    const user = await Admin.findById(req.user.id);
    if (!user) {
        return res.status(404).json({message: 'User not found'});
    }
    const isPasswordCorrect = bcrypt.compareSync(req.body.currentPassword, user.password);
    if (!isPasswordCorrect) {
        return res.status(400).json({message: 'Invalid current password'});
    }
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(req.body.newPassword, salt);
    user.password = hash;
    await user.save();
    return res.status(200).json({message: 'Password changed successfully'});
}

    

