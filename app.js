import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import joi from "joi";
import { MongoClient } from "mongodb";
import dayjs from "dayjs";

dotenv.config();

// Contection to DB
const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;
mongoClient.connect(() => {
    db = mongoClient.db("chatUOL");
});

const app = express();
app.use(express.json());
app.use(cors());

// Schemes
const userSchema = joi.object({
    name: joi.string().required()
});

const messageSchema = joi.object({
    from: joi.string().required(),
    to: joi.string().required(),
    text: joi.string().required(),
    type: joi.string().required()
})

// Participants Routes

app.post('/participants', async (req, res) => {
    const user = req.body;
    const validation = userSchema.validate(user);
    if(validation.error){
        res.sendStatus(422);
        return;
    }
    try {
        const isThereAnyoneWithThisName = await db.collection("participants").findOne({name: user.name});
        if(isThereAnyoneWithThisName){
            res.sendStatus(409);
            return;
        }

        await db.collection("participants").insertOne({...user, lastStatus: Date.now()});
        await db.collection("messages").insertOne({from: user.name, to: "Todos", text: "entra na sala...", type: "status", time: dayjs().format(`HH/mm/ss`)});

        res.sendStatus(201);
    } catch (error) {
        console.log(error);
    }
})

app.listen(4000, () => {
    console.log(`|-----------------------------------|`);
    console.log(`| Running at https://localhost:4000 |`);
    console.log(`|-----------------------------------|`);
});