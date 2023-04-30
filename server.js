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

  

  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    next();
  });

  ``

app.use(express.json());
app.use(cors());
 


 

app.get('/',(req,res)=>{

    postgres.select('*').from('users').then(data=>{
        res.json(data);
    })
    .catch(err =>res.status(400).json("Unable to get data "));
    

})
app.get('/jobs/interested-users', (req, res) => {
  postgres.select('job_listing.id', 'job_listing.job_title', 'job_listing.company_name')
    .from('interested_jobs')
    .join('job_listing', 'interested_jobs.job_id', '=', 'job_listing.id')
    .distinct()
    .then(jobIds => {
      const promises = jobIds.map(job => {
        const { id, job_title, company_name } = job;
        return postgres.select('users.name', 'users.email')
          .from('interested_jobs')
          .join('users', 'interested_jobs.user_id', '=', 'users.id')
          .where('job_id', '=', id)
          .then(users => ({ id, job_title, company_name, users }));
      });
      Promise.all(promises).then(results => res.json(results));
    })
    .catch(err => res.status(400).json("Unable to get data"));
});

app.get('/jobs/interested-jobs/:userId', (req, res) => {
  const { userId } = req.params;

  postgres.select('job_listing.*')
    .from('interested_jobs')
    .join('job_listing', 'interested_jobs.job_id', '=', 'job_listing.id')
    .where('interested_jobs.user_id', '=', userId)
    .distinct()
    .then(jobs => {
      res.json(jobs);
    })
    .catch(err => res.status(400).json("Unable to get data"));
});


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



 
  
  app.post('/archive/:id', (req, res) => {
    const { id } = req.params;
    const { is_active} = req.body;
  

    postgres('job_listing')
      .where('id', '=', id)
      .update({
        is_active,
      })
      .returning('*')
      .then(job => res.json(job[0]))
      .catch(err => res.status(400).json("Unable to archive job listing"));
  });

 



  
 

app.post('/jobs/interested', (req, res) => {
  const { user_id, job_id } = req.body;
  // console.log("intrested",user_id , job_id);
  postgres('interested_jobs')
    .insert({ user_id, job_id })
    .returning('*')
    .then(interest => res.json(interest))
    .catch(err => res.status(400).json("Unable to save interest"));
});

app.delete('/jobs/interested', (req, res) => {
  const { user_id, job_id } = req.body;
  postgres('interested_jobs')
    .where({ user_id, job_id })
    .del()
    .then(() => res.json(`User ${user_id} no longer interested in job ${job_id}`))
    .catch(err => res.status(400).json("Unable to remove interest"));
});

app.listen(3001, ()=>{
    console.log("server is working ");
}); 





