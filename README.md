# API bate-papo UOL
An API based on a nostalgic brazillian internet site called "Bate-Papo UOL"
 
## Setting everything up
### What you will need:
* MongoDB
* NodeJS
* npm
### How to run this API locally:
* install the dependencies necessary to run the API (``` npm i ``` on a terminal) 
* Run a Mongo data base (``` mongod --dbpath <path> ```)
* Run Mongo or Mongosh and write you database adress at the MONGO_URI in the .env file
* Run the app.js file with node
* Start requesting to the API :)
* If you want to see it working with a front-end I suggest you to use this one:
> https://github.com/bootcamp-ra/front-bate-papo-uol

## Features
### This API has the following routes that request changes in the DB:
* POST /participants

Defines the name you want to use in the chat. It is case insensitive and only insert you name if the name is no already in use.

* GET /participants

Get the name of every participant. Return an array in the following format:
```
{
    _id: new ObjectID(<Number>),
    name: <String>,
    lastStatus: <timestamp> (Date.now())
};
```

* POST /messages

Insert a new message in the messages collection. It has to receive a body with the following format when doing a request at the fron-end:
```
{
    to: <String (User)>,
    type: <String ("private_message", "message", "status")>
    text: <String>
};
```
Also, the user who sent the message must be sent in the request headers as User:
```
request.post('url/messages', body, {
    headers: {
        User: username
    }
});
```

* GET /messages

Get all messages stored in the messages collection returning an array of objects with the following format: 
```
{
    from: <String>,
    to: <String>,
    type: <String ("private_message", "message", "status")>,
    text: <String>,
    time: <String>(dayjs().format("HH:mm:ss"))
};
```

* DELETE /messages/:messageID

Search a message in the messages collection by ObjectId and if the message belongs tho who sent the request (this is verified by the user sent at the headers just like what is sent at the post /messages route) the message will be deleted.

* PUT /messages/:messageID

Receive a new message object just like the POST /messages route, the difference here ist that this new object changes a message specified by the ObjectID. It only edit the message if the User in the headers is the same as the user of the selected message.

* POST /status

The API checks each 15 seconds if the participants updated his lastTime timestamp every 10 seconds. This route update the timestamp of the user specified in the Headers with ``` Date.now() ```

### Data Sanitization
This API don't store HTML tags and unnecessary white spaces by default ;)

--- 

## Technologies used
![Node.js](https://img.shields.io/static/v1?style=for-the-badge&message=Node.js&color=339933&logo=Node.js&logoColor=FFFFFF&label=)
![MongoDB](https://img.shields.io/static/v1?style=for-the-badge&message=MongoDB&color=47A248&logo=MongoDB&logoColor=FFFFFF&label=)
![npm](https://img.shields.io/static/v1?style=for-the-badge&message=npm&color=CB3837&logo=npm&logoColor=FFFFFF&label=)
![Express](https://img.shields.io/static/v1?style=for-the-badge&message=Express&color=000000&logo=Express&logoColor=FFFFFF&label=)

## My workspace

![Visual Studio Code](https://img.shields.io/static/v1?style=for-the-badge&message=Visual+Studio+Code&color=007ACC&logo=Visual+Studio+Code&logoColor=FFFFFF&label=)
![Fedora](https://img.shields.io/static/v1?style=for-the-badge&message=Fedora&color=51A2DA&logo=Fedora&logoColor=FFFFFF&label=)
![GitHub](https://img.shields.io/static/v1?style=for-the-badge&message=GitHub&color=181717&logo=GitHub&logoColor=FFFFFF&label=)
![Google Chrome](https://img.shields.io/static/v1?style=for-the-badge&message=Google+Chrome&color=4285F4&logo=Google+Chrome&logoColor=FFFFFF&label=)
