//Build a page that opens a server connection, retrieves the case 
//from MongoDB and displays a page using EJS
var express = require('express');
var app = express();
var _ = require('lodash');
var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var async = require('async');


//Get necessary environment variables fr heroku in order to login to db
var mongoURL = process.env.MONGOURL;


//configuration needed for using EJS
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use('/public', express.static(__dirname + '/public')); //public contains the style sheets
  /*app.use(express.bodyParser());*/
  app.use(express.json());
  app.use(express.urlencoded());
});

//Routes
app.get('/', function(req, res) {
  
  var title = 'CaseAce'
  var header = 'CaseAce';

  res.render('index', {
    locals: {
      'title': title,
      'header': header
    }
  })
})

app.get('/:community/leaderboard', function(req, res) {
  
  var community = req.params.community,
  title = 'Leader Board',
  header = 'Leader Board';
  //Retrieve all of the individual scores from MongoDB in the collection Users
  MongoClient.connect(mongoURL, function(err, db){
  if (err){throw err;}
  db.collection(community+'Users', function(err, collection) { //returns the collection 'Users'
      collection.find().toArray(function(err, users) { //users is an array of objects, each object is a user and their scores
        res.render('leaderboard', {
          locals: {
            'title': title,
            'header': header,
            'users': JSON.stringify(users), //we need to take the array of objects and turn it into JSON
            'community':community
          }
        })
      })
    })
  })
})

app.get('/:community/currentcase', function(req, res) {

  var community = req.params.community //whatever is in between the slashes before leaderboard is stored as req.params.community
  var title = 'CaseAce Current Case'
  var header = 'Current Case';

  //Retrieve the case from MongoDB collection 'Cases' that matches today's date
  MongoClient.connect(mongoURL, function(err, db){
  if (err){throw err;}
  db.collection(community+'Cases', function(err, collection) { //returns the collection 'Cases'
    collection.findOne({'CurrentCase':'yes'}, function(err, item){//find just one item/case that has the CurrentCase field = "yes"
      if(!item){
        res.render('error', {
          locals: {
            'title': 'Oops!',
            'header': 'Oops!',
            'errorMessage': 'Sorry. Looks like a case has not yet been designated as the Current Case.',
            'community':community
          }
        })
      }
      else {
        res.render('currentCase', {
          locals: {
            'title': title,
            'header': header,
            'Case': item,
            'community':community
          }
        })
      }
    })
  })
  })
})

app.get('/:community/pastcases', function(req, res) {
  
  var community = req.params.community
  var title = 'CaseAce Past Cases'
  var header = 'Past Cases';

  //Retrieve pastCases from MongoDB collection pastCases
  MongoClient.connect(mongoURL, function(err, db){
  if (err){throw err;}
  db.collection(community+'Cases', function(err, collection) { //returns the collection 'Cases'
    //find just one item/case that has CurrentCase field set to 'past'
    collection.findOne({'CurrentCase':'past'}, function(err, item){
      if(!item){
        res.render('error', {
          locals: {
            'title': 'Oops!',
            'header': 'Oops!',
            'errorMessage': 'Sorry. Looks like a case has not yet been designated as the Past Case.',
            'community':community
          }
        })
      }
      else {
        res.render('pastCases', {
          locals: {
            'title': title,
            'header': header,
            'Case': item,
            'community':community
          }
        })
      }
    })
  })
  })
})

//This is for showing the cases as a list
app.get('/:community/pastCasesList', function(req, res) {
  
  var community = req.params.community,
  title = 'CaseAce Past Cases',
  header = 'Past Cases',
  casesBeforeDate = [];

  //Retrieve pastCases from MongoDB collection pastCases
  MongoClient.connect(mongoURL, function(err, db){
  if (err){throw err;}
  db.collection(community+'Cases', function(err, collection) { //returns the collection 'Cases'
    //find just one item/case that has CurrentCase field set to 'past'
    collection.find().toArray(function(err, cases){
      if(!cases){
        res.render('error', {
          locals: {
            'title': 'Oops!',
            'header': 'Oops!',
            'errorMessage': 'Sorry. Looks like there are no past cases',
            'community':community
          }
        })
      }
      else {
        //only display cases with debut days before today and aren't the current case
        var today = new Date();
        cases.forEach(function(item){
          var year = parseInt(item.Date.slice(0,4)),
          mth = parseInt(item.Date.substr(5,7)),
          day = parseInt(item.Date.substr(8,10)),
          dateOfCase = new Date();
          dateOfCase.setFullYear(year,mth-1,day);
          if (dateOfCase < today && item.CurrentCase != 'yes'){
            casesBeforeDate.push(item)
          }
        })
        res.render('pastCasesList', {
          locals: {
            'title': title,
            'header': header,
            'Cases': casesBeforeDate,
            'community':community
          }
        })
      }
    })
  })
  })
})

//This is so that when you see the cases as a list, you can click on a link and get to one of them
app.get('/:community/getCase/:caseID', function(req, res) {
  
  var community = req.params.community,
  caseID = req.params.caseID,
  title = 'CaseAce Past Cases',
  header = 'Past Cases';

  //Retrieve pastCases from MongoDB collection pastCases
  MongoClient.connect(mongoURL, function(err, db){
  if (err){throw err;}
  db.collection(community+'Cases', function(err, collection) { //returns the collection 'Cases'
    //find just one item/case that has the correct object ID
    collection.findOne({'_id': new ObjectID(caseID)}, function(err, item){
      if(!item){
        res.render('error', {
          locals: {
            'title': 'Oops!',
            'header': 'Oops!',
            'errorMessage': 'Sorry. Looks like there is no case for this date',
            'community':community
          }
        })
      }
      else {
        res.render('pastCases', {
          locals: {
            'title': title,
            'header': header,
            'Case': item,
            'community':community
          }
        })
      }
    })
  })
  })
})

app.post('/:community/storeAnswerAction', function(req, res) {

var community = req.params.community,
title = 'Submission received',
header = 'Submission received',
username = req.body.Username,
email = req.body.Email,
diagnosisAnswer = req.body.DiagnosisAnswer,
explanation = req.body.Explanation,
date = req.body.Date,
submitTime = new Date().getTime(); //time is in milliseconds since Jan 1 1970

//connect to database collection "Answers"
MongoClient.connect(mongoURL, function(err, db){
  if (err){throw err;}
  db.createCollection(community+'Answers', {w:1}, function(err, collection) {
    var answerCollection = db.collection(community+'Answers');
    //Check to make sure that username and email match
    answerCollection.findOne({'username':username}, function(err, user){
      if (user && user.email != email){
        res.render('error', {
          locals: {
            'title': 'Oops!',
            'header': 'Oops!',
            'errorMessage': 'Sorry, your username and email do not match.  Either this username has already been taken or you have entered in a different email.  Please hit the back button and resubmit with a new username or the same email you\'ve used previously.',
            'community':community
          }
        })
      }
      else {
        //Add the username, caseDate, diagnosisAnswer and explanation as an independent entry in to the database
        answerCollection.insert({'date':date,'submitTime':submitTime, 'username':username, 'email':email, 'diagnosisAnswer':diagnosisAnswer, 'explanation':explanation}, {w:1}, function(err, result){
          res.render('success', {
          locals: {
            'title': title,
            'header': header,
            'successMessage': 'Your answer has been recorded',
            'community':community
            }
          })
        })
      }
    })
  })
})
})

//This route shows all the admin links on a single page
app.get('/:community/admin', function(req, res) {
  
  var community = req.params.community,
  title = 'Admin Panel',
  header = 'Admin Panel';

  res.render('admin', {
    locals: {
      'title': title,
      'header': header,
      'community':community
    }
})
}) 

app.get('/:community/gradeAnswers', function(req, res) {
  
  var community = req.params.community,
  title = 'Grade Answers',
  header = 'Grade Answers';

  res.render('chooseGradeAnswersDate', {
    locals: {
      'title': title,
      'header': header,
      'community':community
    }
})
}) 

//This route displays all answers that correspond to the date chosen in /gradeAnswers
app.post('/:community/gradeAnswers2', function(req, res) {

  var community = req.params.community,  
  title = 'Grade Answers',
  header = 'Grade Answers',
  Date = req.body.Date;
  //Retrieve case answers for desired date from MongoDB collection Answers
  MongoClient.connect(mongoURL, function(err, db){
  if (err){throw err;}
    var answerCollection = db.collection(community+'Answers');
    answerCollection.findOne({'date':Date}, function(err, answers) {
      //Make sure that there are answers for a case on that date
      if(!answers){
        res.render('error', {
          locals: {
            'title': 'Oops!',
            'header': 'Oops!',
            'errorMessage': 'There are currently no answers for a case in the database that debuted on that date',
            'community':community
          }
        })
      }
      else {
        answerCollection.find({'date':Date}).toArray(function(err, answers) { //find all the answers with the case date that matches Date and returns the items in an array
          res.render('gradeAnswers', {
            locals: {
              'title': title,
              'header': header,
              'Answers': answers,
              'Date': Date,
              'community':community
            }
          })
        })
      }
    })
  })
})


//This route takes answers inputed after /gradeAnswers and then updates user tallies in db
app.post('/:community/gradeAnswersAction', function(req, res) {
var community = req.params.community,
responses = req.body, //responses is an object with properties being usernamePoints or usernameSuperbExp and values being numbers
usernamesRaw = [],//an array of the usernames that are raw from the response and need to be processed to get rid of "points" and "superbExp" from the end
usernames = [],//an array of the cleaned up usernames
points = [],//an array of points in the format [user1Points, user1SuperbExp, user2Points, user2SuperbExp,...]
totalPoints = parseInt(req.body.totalPoints),
Date = req.body.Date, //date of case being graded
SuperbExplanations = [], //array containing all users with superb explanations
FirstSolvers = []; //array containing first three users who solved case

for(var property in responses) {
  usernamesRaw.push(property);
  points.push(parseInt(responses[property]));
}

//get rid of the last 2 entries in usernamesRaw and points, b/c those entries contains total points and Date
usernamesRaw = usernamesRaw.slice(0, usernamesRaw.length-2);
points = points.slice(0, points.length-2);

//now clean up the raw username array
for (var i = 0; i < usernamesRaw.length-1; i+=2){ //you iterate by 2 b/c there's a double for each username with usernamePoints and usernameSuperbExp
  var usernameLength = usernamesRaw[i].length - 6;
  usernames.push(usernamesRaw[i].slice(0,usernameLength)); //slice off the "Points" from "usernamePoints" to be left with just "username"
}

//store the firstSolvers as the first 3 usernames in the usernames array that have correct answers
for (var i = 0, j = 0; j < 3 && i < usernames.length; i++)
{
  if (points[2*i] > 0){
  FirstSolvers.push(usernames[i]);
  j++;
  }
}

MongoClient.connect(mongoURL, function(err, db){
  if (err){throw err;}
  db.createCollection(community+'Users', {w:1}, function(err, collection) {
    var userCollection = db.collection(community+'Users');



    storeEverything(storeSuperbExplanations);

    function storeEverything(callback){
      //build an array of objects.  Each obj has properties: username, numCorrectPts, superbExplanationsPts
      var objectArray = [];
      for (var i = 0; i < usernames.length; i++){
        //build up the object
        var userObj = new Object();
        userObj.username = usernames[i];
        userObj.numCorrectPts = points[2*i];
        userObj.superbExplanationsPts = points[2*i+1];
        objectArray.push(userObj);
      }
      //async.each will take objectArray, run storeUserPts on each obj in objectArray, and then execute storeSuperbExplanations function when all callbacks fr various calls of storeUserPts have returned 
      async.each(objectArray, storeUserPts, callback);
    }

    function storeUserPts(userObj, callback){ //storeUserPts must have a callback in order to be run by async.each
      var numCorrect = 0, numTotal = 0, superbExplanations = 0;
      var username = userObj.username, numCorrectPts = userObj.numCorrectPts, superbExplanationsPts = userObj.superbExplanationsPts;
      //In "userCollection", find the username, if the username doesn't exist, create new entry
      //Also find and store the numCorrect, numtotal, superbExplanations as variables

      userCollection.findOne({'username':username}, function(err, user){
        //if the user exists, then tally up points from previous
        if(user) {
          numCorrect = user.numCorrect, numTotal = user.numTotal, superbExplanations = user.superbExplanations;
        }

        //push username into array of SuperbExplanations if user had a superb explanation
        if (superbExplanationsPts > 0)
        {
          SuperbExplanations.push(username);
        }

        //add in the new points from the grading to the past point tallies
        numCorrect += numCorrectPts;
        numTotal += totalPoints;
        superbExplanations += superbExplanationsPts;

        //update the points in the database for the user, "upsert" is used to add an entry if there isn't a user entry with that name
        userCollection.update({'username':username}, {$set:{'numCorrect':numCorrect, 'numTotal':numTotal, 'superbExplanations':superbExplanations}}, {upsert:true,w:1}, function(err, result){
          if (err){throw err;}          
          callback(err);
          })        
      })
    }

    //Update the list of usernames with SuperbExplanations and FirstSolvers to the case in the db
    function storeSuperbExplanations(){
    db.createCollection(community+'Cases', {w:1}, function(err, collection) {
      var caseCollection = db.collection(community+'Cases');
      //In "caseCollection", find the case with the Date "Date", then in that document
      //set the fields to the new values
      var SuperbExplanationsString = SuperbExplanations.join(", ");
      var FirstSolversString = FirstSolvers.join(", ");
      caseCollection.update({'Date':Date}, {$set:{'SuperbExplanations':SuperbExplanationsString, 'FirstSolvers':FirstSolversString}}, {w:1}, function(err, result){
        if (!err){
          res.render('success', {
          locals: {
            'title': 'Grading Submitted',
            'header': 'Grading Submitted',
            'successMessage': 'Your grading has been recorded.  Leaderboard is updated.',
            'community':community
            }
          })
        }
      })
    })
    }    

  })
  })
})


app.get('/:community/setCurrentCase', function(req, res) {
  
  var community = req.params.community,
  title = 'Set the Current Case',
  header = 'Set the Current Case';
  res.render('setCurrentCase', {
    locals: {
      'title': title,
      'header': header,
      'community': community
    }
  })   
})

app.post('/:community/setCurrentCaseAction', function(req, res) {

var community = req.params.community,
title = 'Current Case successfully set',
header = 'Current Case successfully set',
Date = req.body.Date;

//connect to database collection "Cases"
MongoClient.connect(mongoURL, function(err, db){
  if (err){throw err;}
  db.createCollection(community+'Cases', {w:1}, function(err, collection) {
    var caseCollection = db.collection(community+'Cases');
    //Make sure that there is a case that exists for that date
    collection.findOne({'Date': Date}, function(err, item){
      if(!item){
        res.render('error', {
          locals: {
            'title': 'Oops!',
            'header': 'Oops!',
            'errorMessage': 'There is currently no case in the database that debuts on that date',
            'community': community
          }
        })
      }
      else {
        //Make sure that the case that you'd like to set as current isn't already the current case 
        collection.findOne({'CurrentCase':'yes'}, function(err, item){
          if(item.Date == Date){
            res.render('caseStoreSuccess', {
              locals: {
                'title': title,
                'header': header,
                'Date': Date,
                'community': community
              }
            })
          }
          else {
            //Find the case that used to be the past case, update the case's field CurrentCase to 'no'
            caseCollection.update({'CurrentCase': 'past'}, {$set:{'CurrentCase':'no'}}, {w:1}, function(err, result){
              if (!err){
                //Find the case that used to be the current case, update the case's field CurrentCase to 'past'
                caseCollection.update({'CurrentCase': 'yes'}, {$set:{'CurrentCase':'past'}}, {w:1}, function(err, result){
                  if (!err){
                    //Find the case that will be the current case, update the case's field CurrentCase to 'yes'
                    caseCollection.update({'Date': Date}, {$set:{'CurrentCase':'yes'}}, {w:1}, function(err, result){
                      if (!err){
                        res.render('caseStoreSuccess', {
                          locals: {
                            'title': title,
                            'header': header,
                            'Date': Date,
                            'community': community
                          }
                        })
                      }
                    })
                  }
                })
              }
            })
          }
        })
      }
    })
  })
})
})

app.get('/:community/setPastCase', function(req, res) {
  
  var community = req.params.community,
  title = 'Set the Past Case',
  header = 'Set the Past Case';
  res.render('setPastCase', {
    locals: {
      'title': title,
      'header': header,
      'community': community
    }
  })   
})

app.post('/:community/setPastCaseAction', function(req, res) {

  var community = req.params.community,
  title = 'Past Case successfully set',
  header = 'Past Case successfully set',
  Date = req.body.Date;

//connect to database collection "Cases"
MongoClient.connect(mongoURL, function(err, db){
  if (err){throw err;}
  db.createCollection(community+'Cases', {w:1}, function(err, collection) {
    var caseCollection = db.collection(community+'Cases');
    //make sure that a case exists for the desired date
    caseCollection.findOne({'Date':Date}, function (err, Case){
      if (!Case) {
        res.render('error', {
          locals: {
            'title': 'Oops',
            'header': 'Oops',
            'errorMessage': 'Sorry. There is no case in the database with that debut date.',
            'community':community
          }
        })
      }
      else {
        //Find the case that used to be the past case, update the case's field CurrentCase to 'no'
        caseCollection.update({'CurrentCase': 'past'}, {$set:{'CurrentCase':'no'}}, {w:1}, function(err, result){
          if (!err){
            //Find the case that will be the past case, update the case's field CurrentCase to 'past'
            caseCollection.update({'Date': Date}, {$set:{'CurrentCase':'past'}}, {w:1}, function(err, result){
              if (!err){
                res.render('caseStoreSuccess', {
                  locals: {
                    'title': title,
                    'header': header,
                    'Date': Date,
                    'community': community
                  }
                })
              }
            })
          }
        })
      }
    })
  })
})
})



app.get('/:community/storeCase', function(req, res) {
  
  var community = req.params.community,
  title = 'Store a Case to Database',
  header = 'Store a Case';
  res.render('storeCase', {
    locals: {
      'title': title,
      'header': header,
      'community': community
    }

  })   
})

app.post('/:community/storeCaseAction', function(req, res) {

var community = req.params.community,
title = 'Case Storage Successful',
header = 'Success';
var Case = {
CurrentCase: 'no',
Date: req.body.Date,
FlexibleText1: req.body.FlexibleText1,
FlexibleText2: req.body.FlexibleText2,
HPI: req.body.HPI,
PMH: req.body.PMH,
MedsAllergies: req.body.MedsAllergies,
SHxHRB: req.body.SHxHRB,
FHx: req.body.FHx,
PE: req.body.PE,
LabsStudies: req.body.LabsStudies,
Imaging: req.body.Imaging,
Citation: req.body.Citation,
Question: req.body.Question,
FirstSolvers: req.body.FirstSolvers,
SuperbExplanations: req.body.SuperbExplanations,
Diagnosis: req.body.Diagnosis,
FurtherDetails: req.body.FurtherDetails,
StudentWithExplanation: req.body.StudentWithExplanation,
StudentExplanation: req.body.StudentExplanation,
KeyPointsExplanation: req.body.KeyPointsExplanation
};

//Add in the proper image tags for lightbox
for (var property in Case)
{
if (Case[property] != null)
{
  var stringArray = Case[property].split("");
  for (var i = 0; i < stringArray.length - 9; i++)
  {
        if ((stringArray.slice(i, i+10).join("") == "<img src=\"")&&(stringArray.slice(i-23, i-9).join("") != "data-lightbox="))    //data-lightbox= is to ensure that this isn't already an image tag that's been fixed
        {         
          var url = getURL(stringArray.slice(i+10, stringArray.length));
          var stringToAdd1 = "<a href = \"" + url + "\" data-lightbox=\"images\"><img src=\"" + url + "\" width = \"180\"></a>"; 
          stringArray.splice(i,12+url.length+12,stringToAdd1); // "12+url.length" ensures that you remove the old <img src = ...>
        }
    }
    Case[property] = stringArray.join("");
}
}
function getURL (string){
  var stringArray = [];
  for (var i = 0; i < string.length; i++)
  {
    if (string[i] != "\"")
    {
      stringArray.push(string[i]);
    }
    else
    {
      return stringArray.join("");
    }   
  }
}

//connect to database collection "Cases"
MongoClient.connect(mongoURL, function(err, db){
  if (err){throw err;}
  db.createCollection(community+'Cases', {w:1}, function(err, collection) {
    var caseCollection = db.collection(community+'Cases');
    //Insert/Update the Case into the collection
    caseCollection.update({'Date':Case.Date}, Case, {upsert:true,w:1}, function(err, result){
      /*caseCollection.save(Case, {safe:true,w:1}, function(err, result){*/
      if (!err){
        res.render('caseStoreSuccess', {
          locals: {
            'title': title,
            'header': header,
            'Date': Case.Date,
            'community': community
          }
        })
      }        
    })
  })
})
})

app.get('/:community/storeSolvers', function(req, res) {
  
  var community = req.params.community,
  title = 'Store Solvers to Database',
  header = 'Store Solvers';
  res.render('storeSolvers', {
    locals: {
      'title': title,
      'header': header,
      'community': community
    }

  })   
})

app.post('/:community/storeSolversAction', function(req, res) {

var community = req.params.community,
title = 'Solver Storage Successful',
header = 'Solver Storage Successful',
Date = req.body.Date,
StudentWithExplanation = req.body.StudentWithExplanation,
StudentExplanation = req.body.StudentExplanation;

//connect to database collection "Cases"
MongoClient.connect(mongoURL, function(err, db){
  if (err){throw err;}
  db.createCollection(community+'Cases', {w:1}, function(err, collection) {
    var caseCollection = db.collection(community+'Cases');
    //make sure that a case exists for the desired date
    caseCollection.findOne({'Date':Date}, function (err, Case){
      if (!Case) {
        res.render('error', {
          locals: {
            'title': 'Oops',
            'header': 'Oops',
            'errorMessage': 'Sorry. There is no case in the database with that debut date. Go back and choose another debut date',
            'community': community
          }
        })
      }
      else {
        //In "caseCollection", find the case with the Date "Date", then in that document
        //set the fields to the new values
        caseCollection.update({'Date':Date}, {$set:{'StudentWithExplanation':StudentWithExplanation, 'StudentExplanation':StudentExplanation}}, {w:1}, function(err, result){
          if (!err){
            res.render('caseStoreSuccess', {
              locals: {
                'title': title,
                'header': header,
                'Date': Date,
                'community': community
              }
            })
          }
        })
      }
    })
  })
})
})

app.get('/:community/setViewCase', function(req, res) {
  
  var community = req.params.community,
  title = 'Choose a Case to View',
  header = 'Choose a Case to View';
  res.render('setViewCase', {
    locals: {
      'title': title,
      'header': header,
      'community': community
    }
  })   
})

app.get('/:community/setViewCaseList', function(req, res) {
  
  var community = req.params.community,
  title = 'Choose a Case to View',
  header = 'Choose a Case to View';
  
  MongoClient.connect(mongoURL, function(err, db){
  if (err){throw err;}
  db.collection(community+'Cases', function(err, collection) { //returns the collection 'Cases'
    collection.find().toArray(function(err, cases){
       if (!cases){
        res.render('error', {
          locals: {
            'title': 'Oops!',
            'header': 'Oops!',
            'errorMessage': 'Sorry. There are no cases in the database.',
            'community': community 
          }
        })
       }
       else {
        res.render('viewCaseList', {
          locals: {
            'title': title,
            'header': header,
            'Cases': cases,
            'community': community
          }
        })
      }
    })
  })
  })   
})


app.get('/:community/viewCaseList/:caseID', function(req, res) {
  
  var community = req.params.community,
  caseID = req.params.caseID,
  title = 'View a Case',
  header = 'View a Case';

  //Retrieve pastCases from MongoDB collection Cases
  MongoClient.connect(mongoURL, function(err, db){
  if (err){throw err;}
  db.collection(community+'Cases', function(err, collection) { //returns the collection 'Cases'
    //find just one item/case that has the correct object ID
    collection.findOne({'_id': new ObjectID(caseID)}, function(err, item){
      if(!item){
        res.render('error', {
          locals: {
            'title': 'Oops!',
            'header': 'Oops!',
            'errorMessage': 'Sorry. Looks like there is no case for this date',
            'community':community
          }
        })
      }
      else {
        res.render('viewCase', {
          locals: {
            'title': title,
            'header': header,
            'Case': item,
            'community':community
          }
        })
      }
    })
  })
  })
})



app.post('/:community/setViewCaseAction', function(req, res) {

var community = req.params.community,
title = 'View a Case',
header = 'View a Case',
Date = req.body.Date;

  //Retrieve the case from MongoDB collection 'Cases' that matches today's date
  MongoClient.connect(mongoURL, function(err, db){
  if (err){throw err;}
  db.collection(community+'Cases', function(err, collection) { //returns the collection 'Cases'
    collection.findOne({'Date':Date}, function(err, item){
       if (!item){
        res.render('error', {
          locals: {
            'title': 'Oops!',
            'header': 'Oops!',
            'errorMessage': 'Sorry. There is no case with that debut date in the database.',
            'community': community 
          }
        })
       }
       else {
        res.render('viewCase', {
          locals: {
            'title': title,
            'header': header,
            'Case': item,
            'community': community
          }
        })
      }
    })
  })
  })

})

app.post('/:community/editCaseAction', function(req, res) {  
  var community = req.params.community,
  title = 'Edit Case',
  header = 'Edit Case',
  Date = req.body.Date;
  
  //Retrieve the case from MongoDB collection 'Cases' that matches today's date
  MongoClient.connect(mongoURL, function(err, db){
  if (err){throw err;}
  db.collection(community+'Cases', function(err, collection) { //returns the collection 'Cases'
    collection.findOne({'Date':Date}, function(err, item){
        res.render('editCase', {
          locals: {
            'title': title,
            'header': header,
            'Case': item,
            'community':community
          }
        })
      })
    })
  })


})

app.get('/submitCase', function(req, res){
  res.render('submitCase', {
    locals: {
      'title': 'I\'ve got a case!',
      'header': 'I\'ve got a case!'
    }
  })
})

app.listen(process.env.PORT || 8000);
