/* eslint-disable no-underscore-dangle */
const express = require('express');
const fs = require('fs');
const { ObjectId } = require('mongoose').Types;
const User = require('../model/user');
const Message = require('../model/message');
const Room = require('../model/room');
const { parser } = require('../app');
const multer = require('multer');
const { checkAuthenticated } = require('../app');
const { sendDatabaseErrorResponse } = require('../app');
const {
  checkAndSanitizeInput,
  handleInputCheck,
  checkFileSize,
  maxFileKb,
} = require('../app');

const router = express.Router();

// var upload = multer({ dest: __dirname + '/public/uploads/' });
// var type = upload.single('image');

// TODO: make sure what the response would be AND adding polling here 
// no polling is fine
router.get('/getMessageViaRoom',
  //checkAuthenticated,
  async (req, res) => {
    //const { sender, receiver } = req.params;
    const sender = req.query.from;
    const receiver = req.query.to;    
    // console.log('req',req);
    // console.log('sender',sender);
    // console.log('receiver',receiver);
  
    var returnedMessage = []; //array
    const room = await Room.findOne({ $or: [{userList: [sender, receiver]}, {userList: [receiver, sender]}]});
    if (!room) {
      console.log("not a valid room");
      //res.status(550).json(`[!] Could not find room: ${sender} and ${receiver}`);
      //return;
    }
    const messageIDs = room.messageList; 
    await Promise.all(messageIDs.map(async (messageID) => {
      const message = await Message.findOne({_id:messageID});
      if (!message) {
        console.log("not a valid message");
        //res.status(503).json(`not a valid message`);
        //return;
      }
      if(message.message_type ==='text'){
        const textMessage = message.text_message_content; // now message is a text
        returnedMessage.push({content: textMessage, type: message.message_type, time:message.timeStamp, sender: message.from});
      }
      else if(message.message_type === 'audio/mpeg' ||
        message.message_type === 'video/mp4' ||
        message.message_type === 'image/jpeg'){
          const mediaMessage = message.media_message_content;
          returnedMessage.push({content: mediaMessage, type: message.message_type, time:message.timeStamp,sender: message.from});
      }
      else{
        console.log("not a valid message type");
          //res.status(503).json(`not a valid message type`);
          //return;
      }
    }));
    //console.log(returnedMessage);
    //res.status(200);
    res.send(returnedMessage);
  });

router.post('/sendMessage',//roomID from frontend, generated by MongoDB, 
//maintain the state which room we are in 
  //checkAuthenticated,
//   checkAndSanitizeInput(),
//   handleInputCheck,
  function (req, res){
    //message_id, message_type, time stamp, text_message_content,from, to
    // send request from frontend (text_message_content, from, to, message_type)
    const roomID = req.body.roomID;
    // const message_id = req.params;
    const text = req.body.text_message_content;
    // const media_content = req.files.media_message_content;
    const messageType = req.body.message_type;
    const sender = req.body.from;
    const receiver = req.body.to;

    const time = Date.now().toString();
    // console.log('message_id',message_id);
    // console.log(req.body);

    const newRoom = new Room({
      roomNum: roomID, 
      userList: [sender,receiver],
      messageList: []
    })
    
    if (messageType === 'text') {
        const newTextMessage = new Message ({
            // message_id,
            message_type: messageType,
            timeStamp : time,
            text_message_content: text,
            from: sender,
            to: receiver,
        });
        
        newTextMessage.save()
        .then((message) => {
            const messageId = message._id;
            // console.log('messageId',messageId);
          Room.findOne(
            { $or: [{userList: [sender, receiver]}, {userList: [receiver, sender]} ]}, (err,room) =>{
              if(!room){
                room = newRoom;
                room.messageList.push(messageId);
                newRoom.save();
              }
              else{
                room.messageList.push(messageId);
                room.save();
              }
              if(err) {logError(`Cannot create a chat room`,err,response);}
              //done(err,room);
            } 
          // Room.findOneAndUpdate(
          //   { _id: ObjectId(roomID)}, // just get id for room schema
          //   { $push: { messageList: ObjectId(message._id) }}
          )
            .then(() => {
              res.sendStatus(201);
            })
            .catch((err) => sendDatabaseErrorResponse(err, res));
        })
        .catch((err) => console.log(err));
        // send text message, create message object, add it to the room (room number, list of users, array of messages) 
    }
    else if(messageType === 'audio/mpeg'){
      // let audio;
      // console.log('media con',media_content);
      // audio = fs.readFileSync(media_content.path).
      

      const media_content = req.files.media_message_content;
      const newAudioMessage = new Message ({
        message_type: messageType,
        timeStamp : time,
        media_message_content: media_content.data,
        from: sender,
        to: receiver,
    });
    // console.log(newAudioMessage);
      // send audio message, blob (convert to binary, store to db)
      //audio = fs.readFileSync(media_content).toString('base64');
      // fs.unlinkSync(media_content);
      // here use GridFS to convert?


     
      
      newAudioMessage.save()
      .then((message) => {
          const messageId = message._id;
          // console.log('messageId',messageId);
        Room.findOne(
          { $or: [{userList: [sender, receiver]}, {userList: [receiver, sender]} ]}, (err,room) =>{
            if(!room){
              room = newRoom;
              room.messageList.push(messageId);
              newRoom.save();
            }
            else{
              room.messageList.push(messageId);
              room.save();
            }
            if(err) {logError(`Cannot create a chat room`,err,response);}
            //done(err,room);
          } 
        // Room.findOneAndUpdate(
        //   { _id: ObjectId(roomID)}, // just get id for room schema
        //   { $push: { messageList: ObjectId(message._id) }}
        )
          .then(() => {
            res.sendStatus(201);
          })
          .catch((err) => sendDatabaseErrorResponse(err, res));
      })
      .catch((err) => console.log(err));
      // send text message, create message object, add it to the room (room number, list of users, array of messages) 
        
    }
    
    else if (messageType === 'video/mp4'){
        // send video message, blob 
        const media_content = req.files.media_message_content;
        const newVideoMessage = new Message ({
          message_type: messageType,
          timeStamp : time,
          media_message_content: media_content.data,
          from: sender,
          to: receiver,
      });
      // console.log(newVideoMessage);

      newVideoMessage.save()
      .then((message) => {
          const messageId = message._id;
          console.log('messageId',messageId);
        Room.findOne(
          { $or: [{userList: [sender, receiver]}, {userList: [receiver, sender]} ]}, (err,room) =>{
            if(!room){
              room = newRoom;
              room.messageList.push(messageId);
              newRoom.save();
            }
            else{
              room.messageList.push(messageId);
              room.save();
            }
            if(err) {logError(`Cannot create a chat room`,err,response);}
            //done(err,room);
          } 
        // Room.findOneAndUpdate(
        //   { _id: ObjectId(roomID)}, // just get id for room schema
        //   { $push: { messageList: ObjectId(message._id) }}
        )
          .then(() => {
            res.sendStatus(201);
          })
          .catch((err) => sendDatabaseErrorResponse(err, res));
      })
      .catch((err) => console.log(err));

    }
    else if (messageType === 'image/jpeg'){
        // send the image to 
        // image = Buffer.from(image, 'base64');
        const media_content = req.files.media_message_content;
        const newImageMessage = new Message ({
          message_type: messageType,
          timeStamp : time,
          media_message_content: media_content.data, // may need to change back
          from: sender,
          to: receiver,
      });
      // console.log(newImageMessage);
      console.log('message type',typeof(media_content));
      newImageMessage.save()
      .then((message) => {
          const messageId = message._id;
          // console.log('messageId',messageId);
        Room.findOne(
          { $or: [{userList: [sender, receiver]}, {userList: [receiver, sender]} ]}, (err,room) =>{
            if(!room){
              room = newRoom;
              room.messageList.push(messageId);
              newRoom.save();
            }
            else{
              room.messageList.push(messageId);
              room.save();
            }
            if(err) {logError(`Cannot create a chat room`,err,response);}
            //done(err,room);
          } 
        // Room.findOneAndUpdate(
        //   { _id: ObjectId(roomID)}, // just get id for room schema
        //   { $push: { messageList: ObjectId(message._id) }}
        )
          .then(() => {
            res.sendStatus(201);
          })
          .catch((err) => sendDatabaseErrorResponse(err, res));
      })
      .catch((err) => console.log(err));

    }
    else {
        // message type is not correct
      res.status(422);
      res.json('Invalid file type.');
      return;
    }

    
  });
  module.exports = router;