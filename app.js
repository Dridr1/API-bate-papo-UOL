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
    to: joi.string().required(),
    text: joi.string().required(),
    type: joi.string().required()
})

// Participants Routes

app.post('/participants', async (req, res) => {
    const user = req.body;
    const validation = userSchema.validate(user);
    if (validation.error) {
        res.sendStatus(422);
        return;
    }
    try {
        await db.collection("participants").createIndex({ type: 1 }, { collation: { locale: 'pt', strength: 2 } });
        const isAlreadyInUse = await db.collection("participants").findOne({ name: user.name }, { collation: { locale: "pt", strength: 2 } })
        if (isAlreadyInUse) {
            res.sendStatus(409);
            return;
        }

        await db.collection("participants").insertOne({ ...user, lastStatus: Date.now() });
        await db.collection("messages").insertOne({ from: user.name, to: "Todos", text: "entra na sala...", type: "status", time: dayjs().format(`HH/mm/ss`) });

        res.sendStatus(201);
    } catch (error) {
        console.log(error);
    }
});

app.get("/participants", async (req, res) => {
    try {
        const participants = await db.collection("participants").find().toArray();
        res.status(200).send(participants);
    } catch (error) {
        res.send(error);
    }
});

// Messages Routes

app.post('/messages', async (req, res) => {
    const validMessage = messageSchema.validate(req.body, { abortEarly: true });
    if (validMessage.error) {
        return res.sendStatus(422);
    }
    try {
        const isOnline = await db.collection('participants').findOne({ name: req.headers.user });
        if (!isOnline) {
            return res.sendStatus(422);
        }
        await db.collection("messages").insertOne({ from: req.headers.user, ...req.body, time: dayjs().format("HH:mm:ss") });

        res.sendStatus(201);


    } catch (error) {
        res.send(error);
        return;
    }
});

app.get('/messages', async (req, res) => {
    try {
        const messages = await db.collection("messages").find().toArray();
        const filteredMessages = messages.filter(message => message.from === req.headers.user || message.to === req.headers.user || message.to === "Todos" || message.type === 'message');

        if (req.query.limit === undefined) {
            return res.status(200).send(filteredMessages);
        } else {
            return res.status(200).send(filteredMessages.slice(filteredMessages.length - parseInt(req.query.limit), filteredMessages.length));
        }
    } catch (error) {
        return res.send(error);
    }
});

app.listen(4000, () => {
    console.log(`|-----------------------------------|`);
    console.log(`| Running at https://localhost:4000 |`);
    console.log(`|-----------------------------------|`);
});