import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credential: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

//@ Importing routes
import userRouter from "./routes/user.routes.js";

//@ routes declarations
app.use("/api/v1/users", userRouter);

//? path of the upper method
//? http://localhost:8000/api/v1/users/register

export { app };
