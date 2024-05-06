import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";


const videoSchema = new Schema(
    {
        videoFile:{
            type: String, //@Cloudnary url
            required: true
        },
        thumbnail:{
            type: String, //@Cloudnary url
            required: true
        },
        title:{
            type: String, 
            required: true
        },
        description:{
            type: String, 
            required: true
        },
        duration:{
            type: Number, //@ using Cloudnary 
            required: true
        },
        views:{
            type: Number, //@ using Cloudnary 
            default: 0
        },
        isPublish:{
            type: Boolean, //@ using Cloudnary 
            default: true
        },
        owner:{
            type: Schema.Types.ObjectId, //@ using Cloudnary 
            ref: "User"
        },
    }, 
    {
        timestamps: true 
    }
);


videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.Model("Video", videoSchema);
