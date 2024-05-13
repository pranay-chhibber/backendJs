import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import  {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose";

//@creating method for access token and refreshtoken
const generateAccessAndRefreshToken = async (userId) => {
        try {
            const user = await User.findById(userId)
            const accessToken= user.generateAccessToken()
            const refreshToken = user.generateRefreshToken()

            user.refreshToken = refreshToken
            await user.save({validateBeforeSave: false})

            return{accessToken, refreshToken}


        } catch (error) {
            throw new ApiError(500, "Something went wrong while genrating refresh and access token")
        }
    }

const registerUser = asyncHandler (async (req,res)=>{
    //@ get user details from frontend (using postmen if dont have frontend)
    //@ validation
    //@ check if already exists : username , email
    //@ check for images
    //@ check for images, check for avatars
    //@ upload them to cloudinary, avatar and image
    //@ create user object - create entry in db
    //@ remove password and refresh token field from response
    //@ check for user cerations
    //@ return response

    const{ fullName, email, username ,password} = req.body
    console.log("email : " , email );
/*
    if (fullName === ""){
        throw new ApiError(400, "Full NaM IS required")
    }
*/
//@ eiter this or the upper one

if ([fullName,email, username,password].some((field) => field?.trim() === "")

){
    ApiError(400,"All fields are required")
}

    const existedUser= await User.findOne({
        $or:[{username},{email}]
    })
    if(existedUser){
        throw new ApiError(409, "User with email or username already exist")
    }

    // console.log(req.files);

    const avatarOnLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files?.coverImage[0].path
    }
    
    if (!avatarOnLocalPath) {
        throw new ApiError (400,"Avatar file is required")
    }
    
    const avatar = await uploadOnCloudinary(avatarOnLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    

    if(!avatar){
        throw new ApiError (400,"Avatar file is required")
    }
    
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })
    const createUser = await User.findById(user._id).select("-password -refreshToken")
    
    if(!createUser){
        throw new ApiError (500,"Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createUser, "User registered Successfully")
    )
})

const loginUser = asyncHandler(async (req, res) =>{
    /*
    // @ get login details from frontend
    // @ checking username/email exist of not
    // @ if exist then check password match or not
    // @send token to database  
    // @ get the data which is submitted  by the respective user 
    // @ show it on the frontend part
    */
    //@ req body --> data
    //@ username or email
    //@ find the user
    //@ if no user then error
    //@password check --> if not then error 
    //@ if checked then generate access and refresh token
    //@ send cookies
    //@ successfully login


    const {email, username, password} = req.body

    if(!username && !email){
        throw new ApiError(400, "username or email is required")
    }
    //@or
    // if(!(username && email)){
    //     throw new ApiError(400, "username or email is required")
    // }
    const user =   await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user){
        throw new ApiError(404,"user does not exist")
    }
    const isPasswordvalid = await user.isPasswordCorrect(password)
    
    if(!isPasswordvalid){
        throw new ApiError(401,"Invalid user credentials")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const  options = {
        httpOnly: true,
        secure: true,
    }

    return  res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged in Successfully"
        )
    )

})
const logOutUser = asyncHandler(async (req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const  options = {
        httpOnly: true,
        secure: true,
    }
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {},"User logged out Successfully"))

})

const refreshAccessToken= asyncHandler(async(req,res)=>{
        const  incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

        if( !incomingRefreshToken){
            throw new ApiError(401, "unauthorized request")
        }
        
       try {
         const decodedtoken = jwt.verify(
             incomingRefreshToken,
             process.env.REFRESH_TOKEN_SECRET
         )
         
         const user = await User.findById(decodedtoken?._id)
         
         if(!user){
             throw new ApiError(401, "Invalid refresh token")
         }
 
         if (incomingRefreshToken !== user?.refreshToken) {
             throw new ApiError(401, "Refresh token is expired or used")
         }
 
         const options = {
             httpOnly:true,
             secure: true
         } 
         const  {accessToken,  newefreshToken} =  await generateAccessAndRefreshToken(user._id)
 
         return res
         .status(200)
         .cookie("accessToken",accessToken,options)
         .cookie("refreshToken",newefreshToken,options)
         .json(
             new ApiResponse(
                 200,
                 {accessToken,newefreshToken},
                 "Access token refreshed"
             )
         )
       } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token ")
       }

    })

const changeCurrentPassword = asyncHandler(async (req,res)=>{
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid Password")
    }
    user.password = password
    await user.save({validateBeforeSave:false})

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Password Changed succesfully"))
}) 

const getCurrentUser = asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(new ApiResponse(200,req.user,"current user fetched successfully"))
})
const updateAccountDetails = asyncHandler(async(req,res)=>{

   const {fullName,email,} = req.body

   if(!fullName || !email){
    throw new ApiError(400, "All fields are required")
   }
   const user =  await User.findByIdAndUpdate(
       req.user?._id,
        {
            $set: {
                fullName,
                email: email,
                
            }
        },
        {new: true}
    ).select("-password")


    return res
    .status(200)
    .json(new ApiResponse(200,user, "Account updated successfully"))
})

const updateUserAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file are required")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    
    if(!avatar.url){
        throw new ApiError(400, "Error while uploading avatar")
    }

    const user = await User.findByIdAndDelete(
        req.user?._id,
        {
            $set :{
                avatar: avatar.url
            }
        },
        {new : true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user, "Avatar updated successfully"))
})
const updateUserCoverImage = asyncHandler(async(req,res)=>{
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    
    if(!coverImage.url){
        throw new ApiError(400, "Error while uploading Cover image")
    }

    const user = await User.findByIdAndDelete(
        req.user?._id,
        {
            $set :{
                coverImage: coverImage.url
            }
        },
        {new : true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user, "Cover imagae updated successfully"))
})


const getUserChannelProfile = asyncHandler(async (req,res)=>{

    const {username } = req.params

    if(!username?.trim()){
        throw new ApiError(400,"username is missing")
    }

    // User.find({username})
        //@pipelines
    const channel = await User.aggregate([
        {
            $match:{
                username: username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields:{
                subscribersCount:{
                    $size: "$subscribers"
                },
                channelSubscribedToCount:{
                    $size: "$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if: {$in:[req.user?._id,"$subscribers.subscriber"]},
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelSubscribedToCount: 1,
                isSubscribed: 1,
                coverImage:1,
                avatar: 1,

            }
        }
    ])
    
    if(!channel?.length){
        throw new ApiError(400,"channel does not exist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "user channel fetched successfully")
    )
})
const getWatchHistory = asyncHandler(async (req,res)=>{

    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline:[
                {
                    $lookup:{
                        from: "users",
                        localField: "owner",
                        foreignField: "_id",
                        as: "owner",
                        pipeline:[
                            {
                                $lookup:{
                                    fullname:1,
                                    username:1,
                                    avatar:1
                                }
                            }
                        ]
                    }
                },
                {
                    $addFields:{
                        owner:{
                            $first: "$owner"
                        }
                    }
                }
            ]
            }
        }
    ])
    
    
    return res
    .status(200)
    .json(new ApiResponse(
                    200,
                    user[0].watchHistory,
                    "Watch history fetched successfully"

                ))
    
})

export {
    registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}