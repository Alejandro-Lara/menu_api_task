const express = require ('express');
const app = express();
app.use(express.json());
const sqlite3 = require('sqlite3').verbose();

let db = new sqlite3.Database(':memory:', (err)=>{
  if(err){
    return console.error(err.message);
  }
  console.log('Connected to the temporary database');
});

db.serialize(function(){ //Setting up the table for the task
  db.run(`create table Sections(id integer, name varchar(30),primary key(id))`);
  //db.run(`insert into Sections values(?,?)`,[100,"FakeSection"]);
});
//assuming that the id of a menu section is the only thing that needs to be unqiue

app.get('/menusection', (req,res)=>{

  db.all('Select * from Sections',(err,rows)=>{
    if(err){
      res.json({'error':true,'message':'Error occured'+err});
    }
    else{
      res.json({"MenuSection":rows});
    }
  });

});

app.get('/menusection/:id', (req,res)=>{

  db.get('select * from Sections where id = ?',req.params.id,(err,row)=>{
    if(err){
      res.json({'error':true,'message':'Error occured'+err});
    }
    else{
      res.json({"MenuSection":[row]});
    }
  });
});

app.post('/menusection', (req,res)=>{
  db.run(`insert into Sections(name) values(?)`,req.body.name,function(err){
    if(err){
      res.json({'success':false,'message':'Error occured'+err});
    }
    else{ //according to documentation, a successfull insert only returns id of the new tuple
          //so I'll have to query for it to complete the response
      db.get('select * from Sections where id = ?',this.lastID,(err,row)=>{
        if(err){
          res.json({'error':true,'message':'Could not find new tuple! '+err});
        }
        else{
          res.json({"success":true,'MenuSection':[row]});
        }
      });
    }

  });
});

app.post('/menusection/:id',(req,res)=>{
  db.run(`update Sections set name = ? where id = ?`,[req.body.name,req.params.id],function(err){
    if(err){
      res.json({'success':false,'message':'Error occured'+err});
    }
    else if(this.changes == 0){
      res.json({'success':false,'message':'No section with that id was found'});
    }
    else{
      db.get('select * from Sections where id = ?',req.params.id,(err,row)=>{
        if(err){
          res.json({'error':true,'message':'Could not find updated tuple! '+err});
        }
        else{
          res.json({"success":true,'MenuSection':[row]});
        }
      });
    }
  });
});

app.delete('/menusection/:id',(req,res)=>{
  db.run('delete from Sections where id = ?',req.params.id,function(err){
    if(err){
      res.json({'success':false,'message':'Error occured'+err});
    }
    else if(this.changes == 0){
      res.json({'success':false,'message':'No section with that id was found'});
    }
    else{
      res.json({'success':true});
    }
  });
});


const server = app.listen(3000,() => console.log('Listening on port 3000'));

process.on('SIGINT', ()=>{ //for a complete shutdown on CTRL+C from terminal
  db.close((err) => {
    if (err) {
      console.error(err.message);
    };
  });
  server.close(()=>{
    console.log('Api services have ended.')
  });
})
