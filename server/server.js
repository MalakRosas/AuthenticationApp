import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import DB_CONNECTION from './connection.js';
import dotenv from "dotenv";
import authRoutes from './routes/authRoutes.js'
dotenv.config();
const app = express(); 
app.use(express.json());
app.use(cookieParser());
app.use(cors({origin: 'http://localhost:3000', credentials: true}));
app.use("/", authRoutes);

app.listen(5000, async () => {
  await DB_CONNECTION(); 
  console.log("Server Running");
});