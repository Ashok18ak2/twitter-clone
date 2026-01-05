import User from "../models/user.model.js";
import cloudinary from "cloudinary";
import Post from "../models/post.model.js";
import Notification from "../models/notification.model.js";


export const createPost = async(req,res)=>{
    try {
        const {text}=req.body;
        let {img} = req.body;
        
        const userId = req.user._id.toString();

        const user = await User.findOne({_id : userId})

        if (!user){
            return res.status(404).json({error:"User not found"})
        }

        if(!text && !img){
            return res.status(404).json({error:"Post must have img or Text"})
        }

        if(img){
            const uploadedResponce = await cloudinary.uploader.upload(img);
            img = uploadedResponce.secure_url;
        }
        const newPost = new Post({
            user : userId,
            text,
            img
        })

        await newPost.save();
        res.status(201).json(newPost)

    } catch (error) {
        console.log(`Error in create post controller : ${error}`);
        res.status(500).json({error:"Internal server error"})
    }
}

export const deletePost = async(req,res)=>{
    try {
        const {id} = req.params;
        const post = await Post.findOne({_id :id});

        if(!post){
            res.status(404).json({error:"Post not found"})
        }

        if (post.user.toString() !== req.user._id.toString()){
            return res.status(403).json({error:"You are not authorized to delete this post"})
        }
        if(post.img){
            const imgId = post.img.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(imgId);
        }

        await Post.findByIdAndDelete({_id:id});
        res.status(200).json({message:"Post deleted successfully"})

    } catch (error) {
        console.log(`Error in create deletepost controller : ${error}`);
        res.status(500).json({error:"Internal server error"})
    }
}

export const createComment = async(req,res)=>{
    try {
        const {text} = req.body;
        const postId = req.params.id;
        const userId = req.user._id;
        if(!text){
            return res.status(404).json({error:"Comment text is required"})
        }
        const post = await Post.findOne({_id:postId});
        if(!post){
            return res.status(404).json({error:"Post not found"})
        }
        const comment = {
            user : userId,
            text
        }
        const newNotification = new  Notification({
            type : "comment",
            from : req.user._id,
            to : post.user
        })
        await newNotification.save();
        post.comments.push(comment);
        await post.save();
        const updatedPost = await Post.findById(postId).populate({
            path: 'comments.user',
            select: 'username profileImg fullName'
        });
        
        return res.status(201).json(updatedPost.comments);
    } catch (error) {
        console.log(`Error in create post controller : ${error}`);
        res.status(500).json({error:"Internal server error"})
    }
}

export const likeUnlikedpost = async(req,res)=>{
    try {
        const userId = req.user._id;
        const {id:postId} = req.params;

        const post = await Post.findOne({_id :postId});

        if(!post){
            return res.status(404).json({error:"Post not found"})
        }

      const userLikedPost = post.likes.some(
      (id) => id && id.toString() === userId.toString());
        
        if(userLikedPost){
            await post.updateOne({ $pull: { likes: userId } } );
            await User.updateOne({_id:userId},{$pull:{likedPosts:postId}})

            const updatedLikes = post.likes.filter((id)=>id.toString() !== userId.toString())
            return res.status(200).json(updatedLikes)
        }else{
          post.likes.push(userId);
          await User.updateOne({_id:userId},{$push:{likedPosts:postId}})
          await post.save();
          const notification = new Notification({
            type : "like",
            from : userId,
            to : post.user
          })
          await notification.save();
          const updatedLikes = post.likes;
          res.status(200).json(updatedLikes)
        }
    }catch (error) {
        console.log(`Error in likeUnlikepost controller : ${error}`);
        res.status(500).json({error:"Internal server error"})
    }
}

export const getAllPosts = async(req,res)=>{
    try {
        const posts = await Post.find().sort({createdAt: -1}).populate({
            path :"user",
            select : "-password"
        })
        .populate({
            path:"comments.user",
            select : ["-password","-email","-following","-followers","-bio","-link"]
        })
        if(posts.length === 0){
            return  res.status(200).json([])
        }
        res.status(200).json(posts)
    } catch (error) {
        console.log(`Error in getAllPosts controller : ${error}`);
        res.status(500).json({error:"Internal server error"})
    }
}

export const getLikedPosts = async(req,res)=>{
    try {
        const userId= req.params.id;
        const user = await User.findById({_id:userId})
        if(!user){
            return res.status(404).json({error:"User Not Found"})
        }
        const likedPosts = await Post.find({_id:{$in :user.likedPosts}})
        .populate({
            path :"user",
            select:"-password"
        })
        .populate({
            path : "comments.user",
            select:["-password","-email","-following","-followers","-bio","-link"]

        })
        return res.status(200).json(likedPosts);

    } catch (error) {
        console.log(`Error in getLikedPosts controller : ${error}`);
        res.status(500).json({error:"Internal server error"})
    }
}

export const getFollowingPosts = async(req,res)=>{
    try {
        const userId = req.user._id;
        const user = await User.findById({_id:userId});
        if(!user){
            return res.status(404).json({error:"User Not Found"});
        }
        const following =user.following;
        const feedPosts = await Post.find({user : {$in :following}})
            .sort({createdAt:-1})
            .populate({
            path :"user",
            select:"-password"
            })
            .populate({
            path : "comments.user",
            select:["-password","-email","-following","-followers","-bio","-link"]

        })
        res.status(200).json(feedPosts);
    } catch (error) {
        console.log(`Error in getFollowingPosts controller : ${error}`);
        res.status(500).json({error:"Internal server error"})
    }
}

export const getUserPost = async(req,res)=>{
    try {
        const {username} = req.params;
        const user = await User.findOne({username})
        if(!user){
            return res.status(404).json({error:"User Not Found"})
        }
         const posts = await Post.find({user:user._id})
        .sort({createdAt:-1})
            .populate({
            path :"user",
            select:"-password"
            })
            .populate({
            path : "comments.user",
            select:["-password","-email","-following","-followers","-bio","-link"]

        })
        res.status(200).json(posts);

       
    }catch (error) {
        console.log(`Error in getUserPost controller : ${error}`);
        res.status(500).json({error:"Internal server error"})
    }
}

