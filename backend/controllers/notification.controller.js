import Notification from "../models/notification.model.js";

export const getNotification = async (req, res) => {
    try {
        const userId = req.user._id;
        const notification = await Notification.find({ to :userId})
        .populate({
            path:"from",
            select:"username profileImg"
        })
        await Notification.updateMany({to:userId},{read:true});
        res.status(200).json(notification)
    } catch (error) {
        console.error(`Error In getNotification controller:", ${error}`);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

export const deleteNotification = async (req, res) => {
    try {
        const userId = req.user._id;
        
        await Notification.deleteMany({to:userId});
        res.status(200).json({ message: "Notifications deleted successfully" });
       
    } catch (error) {
        console.error(`Error In deleteNotification controller:", ${error}`);
        res.status(500).json({ error: "Internal Server Error" });
    }
}