//@ we added experimental Dev script in package.json file instead of writting require and config here 
// require('dotenv').config({path: './env'})
import dotenv from "dotenv"
import connectDB from './db/index.js'
import { app } from "./app.js"

dotenv.config({
    path: './env'
})
// const port = process.env.PORT || 8000

connectDB()
.then(()=>{
    app.on("error", (error)=>{
        console.log("Errr: ",error);
        throw error
    })
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`Server is running at port : ${process.env.PORT}`);
    })
})
.catch((err)=>{ 
    console.log("MongoDB connection failed !!! " ,err);

})











//@ We can create DB connection using this but this makes the index.js file messy and it doesnt looks professional so we create separate DB folder and import the data into index.js
/*
const app = express()
(async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", (error)=>{
            console.log("ERROR: " , error);
            throw error
        })
        app.listen(process.env.PORT , ()=>{
            console.log(`App is listening on port ${process.env.PORT} `);
        })
    } catch (error) {
        console.error("ERROR: " ,error)
        throw error
    }
})()
*/