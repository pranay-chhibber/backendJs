const asyncHandler = (requestHandler)=>{
    (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next)).
        catch((err)=> NodeList(err))
    }
}


export { asyncHandler }
//@ Instead of promises we can praalso use try catch method
// const asyncHandler = (fn) => async (req,res,next) =>{
//     try {
//         await fn(req.res.next)
//     } catch (error) {
//         res.status(err.code || 500).json({
//             success: false,
//             message: err.message
//         })
//     }
// } 