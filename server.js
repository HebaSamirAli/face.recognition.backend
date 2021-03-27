const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');
const { response } = require('express');

//const { json } = require('body-parser');

//db connection on heroku ................
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0
const db = knex({
    client: 'pg',
    connection: {
       connectionString : process.env.DATABASE_URL,
       ssl : true,
       sslfactory = org.postgresql.ssl.NonValidatingFactory,
       sslmode = require
    //    rejectUnauthorized : false
    }
});

// db connection localy ................
// const db = knex({
//     client: 'pg',
//     connection: {
//        host : '127.0.0.1',
//        user : 'postgres',
//        password : 'bebo',
//        database : 'facerecognition'
//     },
// });


// Build App .......................................
const app = express();
app.use(bodyParser.json());
app.use(cors());

// Root GET all Users data ........... all done ...... for check
app.get('/', (req,res) => {
    res.json('faceRecognition server is working !!!!!!!!!');
})
//.......................................


// MARK SIGN IN
// Sign in route ......................... all done
app.post('/signin', (req,res) => {
    db.select('email','hash').from('login')
        .where('email', '=', req.body.email )
        .then(data => {
            const isValid = bcrypt.compareSync(req.body.password,data[0].hash);
            if (isValid) {
                return db.select('*').from('users')
                    .where('email','=',req.body.email)
                    .then(user => {
                        res.json(user[0]);
                    })
                    .catch(err => res.status(400).json('unable to signin'))
            }else {
                res.status(400).json('Wrong Credentials')
            }
    })
    .catch(err => res.status(400).json('Wrong Credentials'))
})


// MARK REGISTER
// register .............................. all done
app.post('/register', (req,res) => {
    const { email, name, password } = req.body;
    if (email === "" || name === "" || password === ""){
        res.status(400).json('unable to register due to missing data')
    }else {
    const hash = bcrypt.hashSync(password);
    
    db.transaction(trx => {
        trx.insert({
            hash: hash,
            email: email
        })
            .into('login')
            .returning('email')
            .then(loginEmail => {
                return trx('users')
                    .returning('*')
                    .insert({
                        email : loginEmail[0],
                        name : name,
                        entries : 0,
                        joined : new Date()
                    })
                    .then(user => {
                        res.json(user[0]);
                    })
            })
                .then(trx.commit)
                .catch(trx.rollback)
    })
    .catch(err => res.status(400).json('unable to register or add to data'))
    }       
})

// MARK USER PROFILE
// get user profile ....................... all done
app.get('/profile/:id', (req,res) => {
    const { id } = req.params;
    return db.select('*').from('users').where({id})
        .then(user => {
            if (user.length){
                res.json(user[0]);
            }else {
                res.status(400).json('Not found');
            }
    })
        .catch(err => res.status(400).json('Error Getting User'))
})


// MARK UPDATE USER ENTRIES
// update user data ....................... all done
app.put('/image', (req,res) => {
    const {id} = req.body;
    
    db('users').where('id' , '=' , id)
        .increment('entries',1)
        .returning('entries')
        .then(entries => {
            res.json(entries[0])
        })
        .catch(err => res.status(400).json('unable to get entries count'))
})

// ........................ bcrypt-nodejs
// bcrypt.hash("bacon", null, null, function(err, hash) {
//     // Store hash in your password DB.
// });

// // Load hash from your password DB.
// bcrypt.compare("bacon", hash, function(err, res) {
//     // res == true
// });
// bcrypt.compare("veggies", hash, function(err, res) {
//     // res = false
// });

app.listen(process.env.PORT || 3001, () => {
    console.log(`app is running on port ${process.env.PORT}`);
})

