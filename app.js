import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";

const app = express();
app.use(express.json());
app.use(cors());



app.listen(4000, () => {
    console.log(`|-----------------------------------|`);
    console.log(`| Running at https://localhost:4000 |`);
    console.log(`|-----------------------------------|`);
});