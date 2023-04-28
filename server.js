const express = require('express');
const app = express();
const bcrypt=require("bcrypt-nodejs");
const cors = require('cors');
const knex = require('knex'); 
const { response } = require('express');

const postgres = knex({
    client: 'pg',
    connection: {
        host : '127.0.0.1', //localhost
        user : 'adonis', //add your user name for the database here
        // port: 3001, // add your port number here
        password : '', //add your correct password in here/ we dont have so keep it empty don't fill qrong one
        database : 'smart-brain' //add your database name you created here
    }
  });

  

 

app.use(express.json());
app.use(cors());
 


 

app.get('/',(req,res)=>{

    postgres.select('*').from('users').then(data=>{
        res.json(data);
    })
    .catch(err =>res.status(400).json("Unable to get data "));
    

})
app.get('/job_listing', (req, res) => {
    postgres.select('*').from('job_listing').orderBy('order_index')
      .then(data => {
        res.json(data);
      })
      .catch(err => {
        console.log(err);
        res.status(400).json('Error getting job listings');
      });
  });
  
  
app.get('/profile/:id',(req,res)=>{
    const {id}=req.params ; 

    postgres.select('*').from('users').where('id' , id).then(data=>{
        if(data.length){
            res.json(data[0]);
        }
        else {
            res.status(400).json("User not found ");
        }
      
    })
    .catch(err =>res.status(400).json("Unable to get data "));


})

app.post('/signin',(req, res)=>{

 
    postgres.select('email' , 'hash').from('login')
        .where('email',req.body.email)
        .then(data=>{
        const isvalid =  bcrypt.compareSync(req.body.password , data[0].hash);
        console.log(isvalid);
             if(isvalid){
 
                return postgres.select('*').from('users')
                .where('email','=', req.body.email)
                .then(user=>{
                    console.log(user);
                    res.json(user[0]);
                })
                .catch(err =>res.status(400).json("Unable to get user"));
            
             }
             res.status(400).json("Wrong Credentials  ");
        })
        .catch(err =>res.status(400).json("Wrong "));
   
 
})

app.post("/register",(req,res)=>{
    const {email , name , password}=req.body;
 
    const hash = bcrypt.hashSync(password );
 
 
    postgres.transaction(trx=>{
        trx.insert({
            hash:hash , 
            email:email 
        })
        .into('login')
        .returning('email')
        .then( loginEmail=>{
                postgres('users')
                .returning('*')
                .insert({
                email:loginEmail[0].email,
                name:name,
                joined:new Date()
            })
            .then(users=>{
                res.json(users[0]);
            })
        })
        .then(trx.commit)
        .catch(trx.rollback)
    })
    .catch(err =>res.status(400).json("Unable to register "));
   

})

app.post('/job_listing', (req, res) => {
    const { job_title, company_name, location, job_description, contact_phone, contact_email, deadline } = req.body;
    
    postgres('job_listing')
      .insert({ job_title, company_name, location, job_description, contact_phone, contact_email, deadline })
      .returning('*')
      .then(data => res.json(data[0]))
      .catch(err => res.status(400).json('Unable to create job listing'));
  });


  app.post('/update_order_numbers', (req, res) => {
    const updatedOrderNumbers = req.body;
  
    postgres.transaction((trx) => {
      const queries = updatedOrderNumbers.map(({ id, order_index }) =>
        trx('job_listing').where('id', id).update('order_index', order_index)
      );
  
      Promise.all(queries)
        .then(() => {
          trx.commit();
          res.json({ success: true });
        })
        .catch((err) => {
          trx.rollback();
          console.error(err);
          res.status(500).json({ error: 'Unable to update order numbers' });
        });
    });
  });
  
app.listen(3001, ()=>{
    console.log("server is working ");
}); 


