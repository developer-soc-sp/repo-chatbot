const express = require('express');
const bodyParser = require('body-parser');
const functions = require('firebase-functions');
const {webhookClient, Card} = require('dialogflow-fulfillment');
const { dialogflow, BasicCard, Button } = require('actions-on-google');
const requestLib = require('request');


const app = dialogflow();
//init db
const admin = require('firebase-admin');
var serviceAccount = require("./serviceAccount.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://firstagent-f1e8f.firebaseio.com"
});
const db = admin.firestore();

app.intent('BookTableIntent', (conv,{name,phone,date,time,persons}) =>{
    // Get parameter from Dialogflow with the string to add to the database
    const databaseEntry = { name: name, date: date, time:time, persons:persons, hphone: phone};
    //book a table
    booktable(conv,databaseEntry);
    conv.ask(`Done! A booking is made for "${name}" on "${date}" at "${time}"  for "${persons}" persons.`);
});
app.intent('CancelBookingGetPhoneIntent', (conv,{hphone}) =>{
    // Get parameter from Dialogflow with the string to add to the database
    const databaseQuery = hphone;
    //book a table
    return getQueries(hphone,conv).then((output)=>{
        conv.ask("Which booking do you wish to cancel?");
        return console.log("CancelBookingGetPhoneIntent executed");
    }) 
});
app.intent('CancelBookingGetBookingIndexIntent', (conv,{hphone,number}) =>{
    // Get parameter from Dialogflow with the string to add to the database
    const databaseQuery = number;
    var str = "";
    //book a table
    return deleteBooking(hphone,conv).then((output)=>{
        conv.ask("Which booking do you wish to cancel?");
        return console.log("CancelBookingGetPhoneIntent executed");
    }) 
});

function deleteBooking (hphone,conv) {
    return new Promise((resolve, reject) => {
        var bookingRef = db.collection('table_booking').doc(hphone).collection('bookings');
        bookingRef
        //.where("name", "==", "Ronnie")
        .get().then(snapshot => {
          //var str = "There are " + snapshot.docs.length;
          var count = 0;
          snapshot.forEach(doc => {
            var dt = new Date(doc.data().date);
            var time = new Date(doc.data().time);
            if(dt > Date.now()){
                console.log('Found doc with id:', doc.id);
                count++;
                //str += 'Found doc with id:' + doc.id;
                str += count + ". Your booking date is " + dt.toDateString();
                str +="at " + dt.toTimeString();
            }
          });
          str = "There are " + count + " bookings." + str 
          conv.add(str);
          resolve(str);
        })
        .catch(err => {
            console.log('Error getting documents', err);
            conv.add("Error");
            reject("test");
        });
    });
}

app.intent('QueryBookingIntent', (conv,{hphone}) =>{
    // Get parameter from Dialogflow with the string to add to the database
    const databaseQuery = hphone;
    //book a table
    return getQueries(hphone,conv).then((output)=>{
        //conv.ask("Resolved");
        return console.log("getQueries executed");
    }) 
});

function getQueries (hphone,conv) {
    return new Promise((resolve, reject) => {
        var bookingRef = db.collection('table_booking').doc(hphone).collection('bookings');
        bookingRef
        //.where("name", "==", "Ronnie")
        .get().then(snapshot => {
          //var str = "There are " + snapshot.docs.length;
          var str = "";
          var count = 0;
          snapshot.forEach(doc => {
            var dt = new Date(doc.data().date);
            var time = new Date(doc.data().time);
            if(dt > Date.now()){
                console.log('Found doc with id:', doc.id);
                count++;
                //str += 'Found doc with id:' + doc.id;
                str += count + ". Your booking date is " + dt.toDateString();
                str +="at " + time.toTimeString().slice(1,time.toTimeString().indexOf("GMT+")+".");
            }
          });
          str = "There are " + count + " bookings." + str 
          var card = new new SimpleResponse({
              speech: 'Howdy, this is GeekNum. I can tell you fun facts about almost any number, my favorite is 42. What number do you have in mind?',
              text: 'Howdy! I can tell you fun facts about almost any number. What do you have in mind?',
            });
          conv.add(card);
          conv.add(str);
          resolve(str);
        })
        .catch(err => {
            console.log('Error getting documents', err);
            conv.add("Error");
            reject("test");
        });
    });
}

function booktable(conv,databaseEntry){
    // Get the database collection 'dialogflow' and document 'agent' and store
    // the document  {entry: "<value of database entry>"} in the 'agent' document
    var phone = databaseEntry.hphone;
    var addDoc = db.collection('table_booking').doc(phone).collection('bookings').add(databaseEntry)
    .then(ref => {
      console.log('Added document with ID: ', ref.id);
    });   
}

app.intent('Default Welcome Intent', conv => {
  conv.ask('Welcome to my agent!');
});

app.intent('Default Fallback Intent', conv => {
  conv.ask(`I didn't understand`);
  conv.ask(`I'm sorry, can you try again?`);
});

app.intent('PlayGame', conv => {
  //conv.data.secret = parseInt(Math.random()*100+1);
  conv.data.testParam = 'testing';
  var secret = parseInt(Math.random()*100+1);
  var context = conv.contexts.get('playgamecontext');
  //context.parameters.secret ='22';
  conv.contexts.set('playgamecontext',5,{'secret':secret});
  conv.ask("Let's play a game. Guess a number between 1 to 100."+ secret);
  //conv.ask("secret = " + secret);
  for (const context of conv.contexts) {
    console.log("Context:" + context.name);
  }
});

app.intent('GuessNumber', conv => {
  const guessParam = conv.parameters.number;
  const secretParam = conv.parameters.secret;
  if(parseInt(guessParam) > secretParam){
    conv.ask("That is incorrect! Guess lower" + secretParam);
  }else if(parseInt(guessParam) < secretParam){
    conv.ask("That is incorrect! Guess higher" + secretParam);
  }
  else{
    conv.close("Good!");  
    conv.contexts.delete('playgamecontext');
  }
});

app.intent('GetFood', conv => {
  const nameParam = conv.parameters.givenname;
  const foodParam = conv.parameters.food;
  conv.ask('Hi ' + nameParam +' I will remember that you like ' + foodParam );
  admin.database().ref('/names').push({name: nameParam, food: foodParam}).then((snapshot) => {
    // Redirect with 303 SEE OTHER to the URL of the pushed object in the Firebase console.
    console.log('database write sucessful: ' + snapshot.ref.toString());
  });
});

app.intent('TestIntent', conv => {
    return addTestData(conv).then((output)=>{
        conv.add("Resolved");
        return console.log("TestIntent executed");
    })
  });
 function addTestData(conv){
    return new Promise((resolve, reject) => {
        var addDoc = db.collection('testing').add({
            name: 'Tokyo',
            country: 'Japan'
          })
        .then(ref => {
          conv.add('Hi, This is a test and I will write an entry into firebase '+ ref.id +'\n  \n');
          console.log('Added document with ID: ', ref.id);
          resolve("Good" + ref.id);
        }); 
    }).catch(err => {
        console.log('Error getting documents', err);
        conv.add("Error");
        reject("test");
    });
 }
//app.dialogflowFirebaseFulfillment = functions.https.onRequest(app);
const expressApp = express().use(bodyParser.json(), app);

expressApp.post('/fulfillment', app);
//expressApp.listen(3000);
var listener = expressApp.listen(process.env.PORT,
  process.env.IP,
  function(){
      console.log("server started");
      console.log("listening on port " +
      listener.address().port);
  });