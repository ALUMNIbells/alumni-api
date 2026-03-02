import cloudinary from "./cloudinary.js";
import streamifier from "streamifier";

export const uploadFile = (folder, public_id, buffer) => {
    return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
        {
        resource_type: "raw",
        folder,
        public_id,
        },
        (error, result) => {
        if (error) return reject(error);
        resolve(result);
        }
    );
    streamifier.createReadStream(buffer).pipe(stream);
    });
}