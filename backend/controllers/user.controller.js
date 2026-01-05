import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "cloudinary"

export const getProfile = async(req,res)=>{

    try {
        const {username} = req.params;
        const user =await User.findOne({username})

        if(!user){
            return res.status(404).json({message:"user not found"})
        }
        res.status(200).json(user);

    } catch (error) {
        console.log(`Error in Getprofile controller ${error}`)
        res.status(500).json({error:"Internal server error"})
    }
}

export const followUnfollowUser = async(req,res)=>{
    try {
        const {id} = req.params;
        const userToModify = await User.findById({_id : id})
        const currentUser = await User.findById({_id : req.user._id})

        if(id.toString() === req.user._id.toString()){
            return res.status(404).json({error:"you can't unfollow or follow yourself"})
        }

        if(!userToModify || !currentUser){
            return res.status(404).json({error :"user not found"})
        }

        const isFollowing = currentUser.following.includes(id);

        if(isFollowing){
             await User.findByIdAndUpdate({_id:id},{$pull:{followers:req.user._id}})
             await User.findByIdAndUpdate({_id:req.user._id},{$pull:{following:id}})
             res.status(200).json({message:"Unfollow successfully"})
             
        }else{
            await User.findByIdAndUpdate({_id:id},{$push:{followers:req.user._id}})
            await User.findByIdAndUpdate({_id:req.user._id},{$push:{following:id}})
            const newNotification = new  Notification({
                type : "follow",
                from : req.user._id,
                to : userToModify._id
            })
            await newNotification.save();
            res.status(200).json({message:"Follow successfully"})
        }

    } catch (error) {
        console.log(`Error in followUnfollowUser controller ${error}`)
        res.status(500).json({message:'internal server error'})
    }
}

export const getSuggestedUsers = async(req,res)=>{
    try {
        const userId = req.user._id;
        const userFollowedByMe = await User.findById({_id:userId}).select("-password")

        const users = await User.aggregate([
            {
                $match : {
                    _id : { $ne : userId}
                }
            },
            {
                $sample :{
                    size:10
                }
            }
        ])

        const filteredUser = users.filter((user)=> !userFollowedByMe.following.includes(user._id))

        const suggestedUsers = filteredUser.slice(0,4)

        suggestedUsers.forEach((user)=>(user.password = null))
        res.status(200).json(suggestedUsers)
    } catch (error) {
        console.log(`Error in getsuggestedUser controller ${error}`)
        res.status(500).json({message:'internal server error'})
    }
}


export const updateUser = async (req, res) => {
  try {
    const userId = req.user._id;

    // ✅ ALLOWED FIELDS (SMALL ADDITION)
    const allowedFields = [
      "username",
      "fullName",
      "email",
      "currentPassword",
      "newPassword",
      "bio",
      "link",
      "profileImg",
      "coverImg",
    ];

    // ✅ CHECK FOR INVALID FIELDS (SMALL ADDITION)
    const invalidFields = Object.keys(req.body).filter(
      (key) => !allowedFields.includes(key)
    );

    if (invalidFields.length > 0) {
      return res.status(404).json({
        error: `Invalid fields: ${invalidFields.join(", ")}`,
      });
    }

    const {
      username,
      fullName,
      email,
      currentPassword,
      newPassword,
      bio,
      link,
    } = req.body;

    let { profileImg, coverImg } = req.body;

    let user = await User.findById({ _id: userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (
      (!newPassword && currentPassword) ||
      (!currentPassword && newPassword)
    ) {
      return res.status(404).json({
        error: "plz provide both newpassword and currenpassword",
      });
    }

    if (currentPassword && newPassword) {
      const isMatch = await bcrypt.compare(
        currentPassword,
        user.password
      );
      if (!isMatch) {
        return res
          .status(404)
          .json({ error: "current Password is incorrect" });
      }

      if (newPassword.length < 6) {
        return res.status(404).json({
          error: "password Must have six characters",
        });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

     if(profileImg){
            if (user.profileImg){
                await cloudinary.uploader.destroy(user.profileImg.split("/").pop().split(".")[0])
            }
            const uploadedResponce = await cloudinary.uploader.upload(profileImg);
            user.profileImg = uploadedResponce.secure_url;
        }
        if(coverImg){
             if (user.coverImg){
                await cloudinary.uploader.destroy(user.coverImg.split("/").pop().split(".")[0])
            }
            const uploadedResponce = await cloudinary.uploader.upload(coverImg);
            user.coverImg = uploadedResponce.secure_url;
        }

    user.fullName = fullName || user.fullName;
    user.email = email || user.email;
    user.username = username || user.username;
    user.bio = bio || user.bio;
    user.link = link || user.link;
    user.profileImg = profileImg || user.profileImg;
    user.coverImg = coverImg || user.coverImg;

    user = await user.save();
    user.password = null;

    return res.status(200).json(user);
  } catch (error) {
    console.log(`Error in updateUser controller ${error}`);
    res.status(500).json({ message: "internal server error" });
  }
};