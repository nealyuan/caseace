//Build a page that opens a server connection, retrieves the case 
//from MongoDB and displays a page using EJS
var express = require('express');
var app = express();
var _ = require('lodash');
var MongoClient = require('mongodb').MongoClient;

//configuration needed for using EJS
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use('/public', express.static(__dirname + '/public')); //public contains the style sheets
  app.use(express.bodyParser());
});

//Routes

// Dummy past cases
var past_cases = [
    { description: 'Healthy 25 y/o man', date: '10/23/2013', id: 1 },
    { description: '67 y/o woman with syncope', date: '10/29/2013', id: 2 },
    { description: '30 y/o man with palpitations', date: '11/01/2013', id: 3 }
];

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

app.get('/leaderboard', function(req, res) {
  
  var title = 'Leader Board'
  var header = 'Leader Board';
  //Retrieve all of the individual scores from MongoDB in the collection Rank
  MongoClient.connect("mongodb://caseaceapi:groupmed@paulo.mongohq.com:10073/CaseAceDB", function(err, db){
  if (err){throw err;}
  db.collection('Rank', function(err, collection) { //returns the collection 'Rank'
      collection.find().toArray(function(err, ranks) { //ranks is an array of objects, each object is a person and their scores
        res.render('leaderboard', {
          locals: {
            'title': title,
            'header': header,
            'ranks': JSON.stringify(ranks) //we need to take the array of objects and turn it into JSON
          }
        })
      })
    })
  })
})

app.get('/currentcase', function(req, res) {
  
  var title = 'CaseAce Current Case'
  var header = 'Current Case';

  //Retrieve the case from MongoDB collection 'Cases' that matches today's date
  MongoClient.connect("mongodb://caseaceapi:groupmed@paulo.mongohq.com:10073/CaseAceDB", function(err, db){
  if (err){throw err;}
  db.collection('Cases', function(err, collection) { //returns the collection 'pastCases'
    collection.findOne({'CurrentCase':'yes'}, function(err, item){//find just one item/case that has the CurrentCase field = "yes"
        res.render('currentCase', {
          locals: {
            'title': title,
            'header': header,
            'Case': item
          }

        })
      })
    })
  })
})

app.get('/pastcases', function(req, res) {
  
  var title = 'CaseAce Past Cases'
  var header = 'Past Cases';

  //Retrieve pastCases from MongoDB collection pastCases
  MongoClient.connect("mongodb://caseaceapi:groupmed@paulo.mongohq.com:10073/CaseAceDB", function(err, db){
  if (err){throw err;}
  db.collection('Cases', function(err, collection) { //returns the collection 'Cases'
    //find just one item/case that has CurrentCase field set to 'past'
    collection.findOne({'CurrentCase':'past'}, function(err, item){
        res.render('pastCases', {
          locals: {
            'title': title,
            'header': header,
            'Case': item
          }

        })
      })
    })
  })
})


app.post('/storeAnswerAction', function(req, res) {

var title = 'Submission received'
var header = 'Submission received'
var username = req.body.Username,
email = req.body.Email,
diagnosisAnswer = req.body.DiagnosisAnswer,
explanation = req.body.Explanation,
date = req.body.Date;

//connect to database collection "Answers"
MongoClient.connect("mongodb://caseaceapi:groupmed@paulo.mongohq.com:10073/CaseAceDB", function(err, db){
  if (err){throw err;}
  db.createCollection('Answers', {w:1}, function(err, collection) {
    var answerCollection = db.collection('Answers');
    //Add the username, caseDate, diagnosisAnswer and explanation as an independent entry in to the database
    answerCollection.insert({'date':date,'username':username, 'email':email, 'diagnosisAnswer':diagnosisAnswer, 'explanation':explanation}, {w:1}, function(err, result){
            res.render('caseStoreSuccess', {
            locals: {
              'title': title,
              'header': header
              }
            })
          })
      })
  })
})

//This route allows user to choose the date of the case whose answers the user wants to grade
app.get('/gradeAnswers', function(req, res) {
  
  var title = 'Grade Answers'
  var header = 'Grade Answers';

  res.render('chooseGradeAnswersDate', {
    locals: {
      'title': title,
      'header': header,
    }
})
}) 

//This route displays all answers that correspond to the date chosen in /gradeAnswers
app.post('/gradeAnswers2', function(req, res) {
  
  var title = 'Grade Answers'
  var header = 'Grade Answers'
  var Date = req.body.Date;
  //Retrieve case answers for desired date from MongoDB collection Answers
  MongoClient.connect("mongodb://caseaceapi:groupmed@paulo.mongohq.com:10073/CaseAceDB", function(err, db){
  if (err){throw err;}
  db.collection('Answers', function(err, collection) { //returns the collection 'Answers'
    collection.find({'date':Date}).toArray(function(err, answers) { //find all the answers with the case date that matches Date and returns the items in an array
        res.render('gradeAnswers', {
          locals: {
            'title': title,
            'header': header,
            'Answers': answers
          }
        })
      })
    })
  })
})


//This route takes answers inputed after /gradeAnswers and then updates user tallies in db
app.post('/gradeAnswersAction', function(req, res) {
var responses = req.body; //responses is an object with properties being usernamePoints or usernameSuperbExp and values being numbers
var usernamesRaw = [];//an array of the usernames that are raw from the response and need to be processed to get rid of "points" nad "superbExp" from the end
var usernames = [];//an array of the cleaned up usernames
var points = [];//an array of points in the format [user1Points, user1SuperbExp, user2Points, user2SuperbExp,...]
var totalPoints = points[points.length-1];

for(var property in responses) {
  usernamesRaw.push(property);
  points.push(responses[property]);
}

//get rid of the last entry in usernamesRaw and points, b/c that entry contains total points
usernamesRaw = usernamesRaw.slice(0, usernamesRaw.length-1);
points = points.slice(0, points.length-1);

//now clean up the raw username array
for (var i = 0; i < usernamesRaw.length-1; i+=2){ //you iterate by 2 b/c there's a double for each username with usernamePoints and usernameSuperbExp
  var usernameLength = usernamesRaw[i].length - 6;
  usernames.push(usernamesRaw[i].slice(0,usernameLength)); //slice of the "Points" from "usernamePoints" to be left with just "username"
}

MongoClient.connect("mongodb://caseaceapi:groupmed@paulo.mongohq.com:10073/CaseAceDB", function(err, db){
  if (err){throw err;}
  db.createCollection('Users', {w:1}, function(err, collection) {
    var userCollection = db.collection('Users');
    for (var i = 0; i < usernames.length; i++){
      var username = usernames[i], numCorrect = 0, numTotal = 0, superbExplanations = 0;
    //In "userCollection", find the username, if the username doesn't exist, create new entry
    //Also find and store the numCorrect, numtotal, superbExplanations as variables
      userCollection.findOne({'username':usernames[i]}, function(err, user){
        if(!user){
          console.log(username);
          userCollection.insert({'username':username, 'numCorrect':0, 'numTotal':0, 'superbExplanations':0}, {w:1}, function(err, result){
            if (err){throw err;}
            })
        }
        else{console.log('user does exist');}

        //usernames = [user1, user3, user2], but when this runs it displays and stores three 'user2's prob b/c of async?

/*        if (err){
          userCollection.insert({'username': usernames[i], 'numCorrect':0, 'numTotal':0, 'superbExplanations':0}, {w:1}, function(err, result){
            if (err){throw err;}
            var numCorrect = 0, numTotal = 0, superbExplanations = 0;
            })
        }
        else {
          var numCorrect = user.numCorrect, numTotal = user.numTotal, superbExplanations = user.superbExplanations;
        }
        userCollection.update({'username':usernames[i]}, {$set:{'numCorrect':points[2*i-1]+numCorrect, 'numTotal':totalPoints+numTotal, 'superbExplanations':points[2*i]+superbExplanations}}, {w:1}, function(err, result){
          if (err){throw err;}
        })*/
      })
    }
  })
})

})


app.get('/setCurrentCase', function(req, res) {
  
  var title = 'Set the Current Case'
  var header = 'Set the Current Case';
  res.render('setCurrentCase', {
    locals: {
      'title': title,
      'header': header,
    }
  })   
})

app.post('/setCurrentCaseAction', function(req, res) {

var title = 'Set Current Case Successful'
var header = 'Success'
var Date = req.body.Date;

//connect to database collection "Cases"
MongoClient.connect("mongodb://caseaceapi:groupmed@paulo.mongohq.com:10073/CaseAceDB", function(err, db){
  if (err){throw err;}
  db.createCollection('Cases', {w:1}, function(err, collection) {
    var caseCollection = db.collection('Cases');
    //Make sure that the case that you'd like to set as current isn't already the current case 
    collection.findOne({'CurrentCase':'yes'}, function(err, item){
      if(err){throw err;}
      if(item.Date == Date){
        console.log('This case is already the current case')
        res.render('caseStoreSuccess', {
          locals: {
            'title': title,
            'header': header
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
                    console.log('Current case and Past case have been updated');
                    res.render('caseStoreSuccess', {
                      locals: {
                        'title': title,
                        'header': header
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

app.get('/storeCase', function(req, res) {
  
  var title = 'Store a Case to Database'
  var header = 'Store a Case';
  res.render('storeCase', {
    locals: {
      'title': title,
      'header': header,
    }

  })   
})

app.post('/storeCaseAction', function(req, res) {

var title = 'Case Storage Successful'
var header = 'Success'
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
        if (stringArray.slice(i, i+10).join("") == "<img src=\"")
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
MongoClient.connect("mongodb://caseaceapi:groupmed@paulo.mongohq.com:10073/CaseAceDB", function(err, db){
  if (err){throw err;}
  db.createCollection('Cases', {w:1}, function(err, collection) {
    var caseCollection = db.collection('Cases');
    //Insert the Case into the collection
    caseCollection.insert(Case, {w:1}, function(err, result){
      if (!err){
        console.log('Case successfully inserted!');
        res.render('caseStoreSuccess', {
          locals: {
            'title': title,
            'header': header
          }
        })
      }
    })

  })
})

})

app.get('/storeSolvers', function(req, res) {
  
  var title = 'Store Solvers to Database'
  var header = 'Store Solvers';
  res.render('storeSolvers', {
    locals: {
      'title': title,
      'header': header,
    }

  })   
})

app.post('/storeSolversAction', function(req, res) {

var title = 'Answerer Storage Successful'
var header = 'Success'
var Date = req.body.Date,
FirstSolvers = req.body.FirstSolvers,
SuperbExplanations = req.body.SuperbExplanations,
StudentWithExplanation = req.body.StudentWithExplanation,
StudentExplanation = req.body.StudentExplanation;

//connect to database collection "Cases"
MongoClient.connect("mongodb://caseaceapi:groupmed@paulo.mongohq.com:10073/CaseAceDB", function(err, db){
  if (err){throw err;}
  db.createCollection('Cases', {w:1}, function(err, collection) {
    var caseCollection = db.collection('Cases');
    //In "caseCollection", find the case with the Date "Date", then in that document
    //set the fields to the new values
    caseCollection.update({'Date':Date}, {$set:{'FirstSolvers':FirstSolvers,'SuperbExplanations':SuperbExplanations,
      'StudentWithExplanation':StudentWithExplanation, 'StudentExplanation':StudentExplanation}}, {w:1}, function(err, result){
      if (!err){
        console.log('Solvers successfully inserted!');
        res.render('caseStoreSuccess', {
          locals: {
            'title': title,
            'header': header
          }
        })
      }
    })

  })
})

})



/*
app.get('/storeCase', function(req, res) {
  
  var title = 'Store a Case to Database'
  var header = 'Store Case';

  //Retrieve pastCases from MongoDB collection pastCases
  MongoClient.connect("mongodb://caseaceapi:groupmed@paulo.mongohq.com:10073/CaseAceDB", function(err, db){
  if (err){throw err;}
  db.collection('pastCases', function(err, collection) { //returns the collection 'pastCases'
      collection.find().toArray(function(err, pastCases) {

        res.render('currentCase', {
          locals: {
            'title': title,
            'header': header,
            'pastCases': pastCases
          }

        })
      })
    })
  })
})

*/

app.listen(8000);
