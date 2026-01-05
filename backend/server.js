import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoute from "./routes/auth.route.js"
import userRoute from "./routes/user.route.js"
import postRoute from "./routes/post.route.js"
import notificationRoute from "./routes/notification.route.js"
import connectDB from "./db/connectDB.js";
import cookieParser from "cookie-parser";
import cloudinary from "cloudinary";
import path from "path"

dotenv.config()

cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret :process.env.CLOUDINARY_API_SECRET_KEY
})

const app = express();
const PORT = process.env.PORT;
const __dirname = path.resolve();

app.use(cors({
    origin: process.env.NODE_ENV === "production" ? false : "http://localhost:5173",
    credentials: true
}));
app.use(express.json(
  {
    limit: "5mb"
  }
))
app.use(cookieParser())
app.use(express.urlencoded({
  extended: true
}))

app.use("/api/auth" , authRoute);
app.use("/api/users" , userRoute)
app.use("/api/posts", postRoute);
app.use("/api/notifications", notificationRoute);
  

if (process.env.NODE_ENV === "production"){
  app.use(express.static(path.join(__dirname,"/frontend/dist")))
  app.use((req,res)=>{
    res.sendFile(path.resolve(__dirname,"frontend","dist","index.html"))
  })
}

app.listen(PORT,()=>{
    console.log(`Server is running on port number ${PORT}`)
    connectDB();
})