import mongoose from "mongoose";

const noticationSchema = mongoose.Schema({
    from :{
        type :mongoose.Schema.Types.ObjectId,
        ref : "User",
        required : true
    },
    to :{
        type :mongoose.Schema.Types.ObjectId,
        ref : "User",
        required : true
    },
    type : {
        type:String,
        required:true,
        enum :["follow","like","comment"]
    },
    read :{
        type:Boolean,
        default : false
    }
},{timestamp:true})

const Notification = mongoose.model("Notification",noticationSchema)

export default Notification;