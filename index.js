const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose');
//const bodyParser = require('body-parser');
require('dotenv').config()


app.use(cors())
app.use(express.static('public'))
app.use(express.json());
app.use(express.urlencoded({ extended: true}));
//app.use(bodyParser.json()); same as express.json but outdated
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});




//connect to database
mongoose.connect(process.env.MONGO_URI, {});
const db = mongoose.connection;


//listen for error in the connection process
db.on('error', console.error.bind(console, 'connection error'));


//listen for a sucessful connection
db.once('open', () => {
  console.log('Connected to MongoDb')
})




//Define userschema and model
const userschema = new mongoose.Schema({
  username: String,
    description: String,
    duration: Number,
    date: String,
    logs: [{
      description: String,
      duration: Number,
      date: String,
    }]
});
const userModel = mongoose.model('userModel', userschema);








app.post('/api/users', (req, res) => {
  const users = req.body.username
 
  //create a new user document with the username field
  const newUser = new userModel({
    username: users
  });


  //save the new user to the db
   newUser.save()
  .then( savedUser => {
    res.json({
      username: savedUser.username,
      _id: savedUser._id
    })
  })
  .catch ( ()=> {
    res.json({
      err: 'Failed to save user'
    })
  })
});


//get the array of users saved in db
app.get('/api/users', (req, res) => {




  userModel.find()
  .then(users => {
    res.json(users)
  })
  .catch(() => {
    res.json({
      err: 'Failed to get users'
    })
  })


})




app.post('/api/users/:_id/exercises', (req, res) => {
  //take data from the form
  const userid = req.params._id;
  const description = req.body.description;
  const duration = 60;
  let date;
  if (req.body.date) {
    date = req.body.date;
  } else {
    date = new Date();
  }






  const dateFormat = new Date(date).toDateString();


  //create an updated document
const updateData = {
  description: description,
  duration: duration,
  date: dateFormat
}








//find the id and save the update to db
userModel.findById(userid)
.then(user => {
  if (user) {
    user.logs.push(updateData);
    user.save() // Save updated user
    .then(updatedUser => {
      res.json({
        username: updatedUser.username,  
         _id: updatedUser._id,
         description: updateData.description,
         duration: updateData.duration,
         date: updateData.date
   })
    })
    .catch(error => {
      res.status(500).json({ error: 'Error saving exercise log' });
    });
   
  } else {
    res.status(400).json({ error: 'User not found'})
  }
})
.catch(error => {
  res.json({ err: 'Error with updating user'});
  res.status(500).json({ error: 'User not updated'})
})
});






app.get('/api/users/:_id/logs', (req, res) => {
  const userid = req.params._id;
  const { to, from, limit} = req.query; //destructure from query
 


  userModel.findById(userid)
  .then(user => {
    // If the user has no logs, create a default log
    let logs = user.logs.length ? user.logs : [{ description: "No exercise yet", duration: 0, date: new Date().toDateString() }];


    //filter log by from date
    if (from) {
      const fromDate = new Date(from);
      logs = logs.filter( log => new Date(log.date) >= fromDate)
    }
   
//filter log by to date
if (to) {
  const toDate = new Date(to);
  logs = logs.filter( log => new Date(log.date) <= toDate)
}


//limit the number of logs you receive
if(limit) {
  logs = logs.slice(0, Number(limit))
}


    res.json({
      username: user.username,
      count: logs.length,
      _id: user._id,
      log: logs
    })
  })
  .catch(() => {
    res.json({
      err: 'Failed to get users'
    })
  })
})







const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
