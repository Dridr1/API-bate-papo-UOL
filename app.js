import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import joi from "joi";
import { MongoClient, ObjectId } from "mongodb";
import dayjs from "dayjs";
import { stripHtml } from "string-strip-html";
dotenv.config();
const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;
mongoClient.connect(() => {
    db = mongoClient.db("chatUOL");
});
const app = express();
app.use(express.json());
app.use(cors());
const userSchema = joi.object({
    name: joi.string().required()
});
const messageSchema = joi.object({
    to: joi.string().required(),
    text: joi.string().required(),
    type: joi.string().required()
});
const updateMessageSchema = joi.object({
    to: joi.string().required(),
    text: joi.string().required(),
    type: joi.string().valid("message", "private_message").required()
});
app.post('/participants', async (req, res) => {
    const user = stripHtml(req.body.name).result.trim();
    const validation = userSchema.validate({ name: user });
    if (validation.error) {
        res.sendStatus(422);
        return;
    }
    try {
        await db.collection("participants").createIndex({ type: 1 }, { collation: { locale: 'pt', strength: 2 } });
        const isAlreadyInUse = await db.collection("participants").findOne({ name: user }, { collation: { locale: "pt", strength: 2 } })
        if (isAlreadyInUse) {
            res.sendStatus(409);
            return;
        }

        await db.collection("participants").insertOne({ name: user, lastStatus: Date.now() });
        await db.collection("messages").insertOne({ from: user, to: "Todos", text: "entra na sala...", type: "status", time: dayjs().format(`HH:mm:ss`) });

        res.sendStatus(201);
    } catch (error) {
        res.send(error);
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
app.post('/messages', async (req, res) => {
    const validMessage = messageSchema.validate(req.body, { abortEarly: true });
    if (validMessage.error) {
        return res.sendStatus(422);
    }
    try {
        const user = stripHtml(req.headers.user).result.trim();
        const isOnline = await db.collection('participants').findOne({ name: user });
        if (!isOnline) return res.sendStatus(422);

        const message = {
            from: stripHtml(req.headers.user).result.trim(),
            to: stripHtml(req.body.to).result.trim(),
            text: stripHtml(req.body.text).result.trim(),
            type: stripHtml(req.body.type).result.trim(),
            time: dayjs().format("HH:mm:ss")
        };

        await db.collection("messages").insertOne(message);
        res.sendStatus(201);
    } catch (error) {
        res.send(error);
        return;
    }
});
app.get('/messages', async (req, res) => {
    const user = stripHtml(req.headers.user).result.trim();
    try {
        const messages = await db.collection("messages").find().toArray();
        const filteredMessages = messages.filter(message => message.from === user || message.to === user || message.to === "Todos" || message.type === 'message');

        if (req.query.limit === undefined) {
            return res.status(200).send(filteredMessages);
        } else {
            return res.status(200).send(filteredMessages.slice(filteredMessages.length - parseInt(req.query.limit), filteredMessages.length));
        }
    } catch (error) {
        return res.send(error);
    }
});
app.delete('/messages/:messageID', async (req, res) => {
    const user = stripHtml(req.headers.user).result.trim();
    const id = new ObjectId(req.params.messageID);

    try {
        const messageToBeDeleted = await db.collection("messages").findOne({ _id: id });
        if (!messageToBeDeleted) return res.sendStatus(404);
        else if (messageToBeDeleted.from !== user) return res.sendStatus(401);

        await db.collection("messages").deleteOne({ _id: id });
        res.sendStatus(200);
    } catch (error) {
        res.sendStatus(error);
    }
});
app.put("/messages/:messageID", async (req, res) => {
    const user = stripHtml(req.headers.user).result.trim();
    const message = req.body;
    const id = new ObjectId(req.params.messageID);
    const validate = updateMessageSchema.validate(message);

    if (validate.error) return res.sendStatus(422);
    try {
        const messageToBeUpdated = await db.collection("messages").findOne({ _id: id });
        const isValidUser = await db.collection("participants").findOne({ name: user });

        if (!messageToBeUpdated) return res.sendStatus(404);
        else if (!isValidUser) return res.sendStatus(404);
        else if (messageToBeUpdated.from !== user) return res.sendStatus(401);
        
        await db.collection("messages").updateOne({_id: new ObjectId(req.params.messageID)}, {$set: {
            to: stripHtml(message.to).result.trim(),
            text: stripHtml(message.text).result.trim(),
            type: stripHtml(message.type).result.trim(),
            time: dayjs().format("HH:mm:ss")
        }});
        
        res.sendStatus(200);
    } catch (error) {
        res.send(error);
    }
});
app.post("/status", async (req, res) => {
    const user = stripHtml(req.headers.user).result.trim();
    try {
        const isOnline = await db.collection('participants').findOne({ name: user });
        if (!isOnline) {
            return res.sendStatus(404);
        }
        await db.collection("participants").updateOne({ _id: isOnline._id }, { $set: { lastStatus: Date.now() } });
        res.sendStatus(200);
    } catch (error) {
        res.send(error);
    }
});
setInterval(async () => {
    try {
        const participants = await db.collection("participants").find().toArray();
        for (const participant of participants) {
            if (Date.now() - participant.lastStatus > 10000) {
                await db.collection("participants").deleteOne({ _id: participant._id });
            }
        }
    } catch (error) {
        console.log(error);
    }
}, 15000);
app.listen(5000, () => {
    console.log(`|-----------------------------------|`);
    console.log(`| Running at https://localhost:5000 |`);
    console.log(`|-----------------------------------|`);
});