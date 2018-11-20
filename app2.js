
var http = require("http");
const express = require('express');
const app = express();
var Twit = require('twit');
const uuidv1 = require('uuid/v1');
var fs = require('fs');

var word = 'taco'; //keyword para buscar en tweets
var uid = "";
var keyword1 = "";
var time = "";
var date = "";

var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
   hosts: 'http://localhost:9200',
   log: 'trace'
});


app.get('/', function (req, res) {
    res.send('Especifique su operacion');
});

//Busqueda de SOLO keyword
app.get('/search/:keyword', function (req, res) {
  word = req.params.keyword; //obtiene el keyword de la URL
  uid1 = req.params.uid; //Obtiene el UID de la URL
  SaveLogs(uid1,word) //Envia el keyword y UID para guardar en LOGS
  //Consulta();
  res.send('Fecha: '+date+'    Hora: '+time+'    Keyword: '+keyword1+'   UID: '+uid); //respuesta al cliente
});

//Busqueda de keyword con UID
app.get('/search/:keyword/:uid', function (req, res) {
  uid1 = req.params.uid; //Obtiene el UID de la URL
  word = req.params.keyword;//obtiene el keyword de la URL
  SaveLogs(uid1, word); //Envia el keyword y UID para guardar en LOGS
  res.send('Fecha: '+date+'    Hora: '+time+'    Keyword: '+keyword1+'   UID: '+uid); //respuesta al cliente
});


/*
//crea indice
 client.indices.create({
     index: 'tweet'
 }, function(err, resp, status) {
     if (err) {
         console.log(err);
     } else {
         console.log("create", resp);
     }
 });

//crea index logs
client.indices.create({
    index: 'logsapp'
}, function(err, resp, status) {
    if (err) {
        console.log(err);
    } else {
        console.log("create", resp);
    }
});
*/

//GUARDA LOGS EN CSV
function SaveLogs(uid1, word){
  keyword1 = word;
  time = new Date().toLocaleTimeString(); // HH/MM/SS
  date = new Date().toLocaleDateString(); // MM/DD/YYYY
  dateAndTime = date + ' ' + time;

  var newLine= "\r\n";

  if (uid1 == null) {
      uid = uuidv1();
      console.log(uid);
  }else{
      uid = uid1;
  }

  /*
  fs.stat('LOGS/logs.csv', function (err, stat) {
      if (err == null) { //BUSCA SI EL ARCHIVO EXISTE
          console.log('File exists');

          csv = date+','+ time +','+ keyword1 +','+ uid+'\n';
          fs.appendFile('LOGS/logs.csv', csv, function (err) {
              if (err) throw err;
              console.log('The "data to append" was appended to file!');
          });
      }
      else { // SI NO ENCUENTRA EL FILE, CREA UNO NUEVO
          //write the headers and newline
          console.log('New file, just writing headers');
          fields= (fields + newLine);

          fs.writeFile('LOGS/logs.csv', fields, function (err, stat) {
              if (err) throw err;
              console.log('file saved');
          });
      }
  });
  */

  client.index({
  index: 'logsapp',//especificas el indice a guardar
  type: 'posts', //metodo para elastic (POST)
  body: {
       "timestamp": dateAndTime, //campos que se desean guardar
       "keyword": keyword1,
       "UID": uid,
   }
  }, function(err, resp, status) {
          console.log(resp);
          });

}




//Consulta al API
function Consulta(){


  client.ping({
       requestTimeout: 30000,
   }, function(error) {
       if (error) {
           console.error('elasticsearch cluster is down!');
       } else {
           console.log('Everything is ok');
       }
   });



  var T = new Twit({ //credenciales para twitter
    consumer_key:         'zUZhwuDWTcLAyBTheAy7XEy5L',
    consumer_secret:      't8TdKvQVLEm1SHFYIAWQPS0eXxEDRe5XEIZOINecZnpLvBl6DH',
    access_token:         '1027718053-qR9BjZM0tporXLzMBFwHTY7VvDh4HoupspDOUCT',
    access_token_secret:  'Aed4VyOZvYtGtd4DmytNXBahK6yDU2jKlPfdMk6X9CBMT',
  })




    T.get('search/tweets', { q: word , since: 2017-07-10, count:1 }, function(err, data, response) {
    //console.log(data);
    var len = Object.keys(data.statuses).length;
    console.log(len);
     for (i = 0 ; i < len ; i++) { //for para guardar todos los resultados

       //console.log(data.statuses[i].text);
       //console.log(data.statuses[i]);

      text = JSON.stringify(data.statuses[i].text)
      client.index({
      index: 'tweet',//especificas el indice a guardar
      type: 'posts', //metodo para elastic (POST)
      body: {
           "key": word, //campos que se desean guardar
           "texto": text,
       }
      }, function(err, resp, status) {
              console.log(resp);
              });
    }

    });

}




module.exports = app;
//elasticsearch-6.4.0/./bin/elasticsearch

//kibana-6.4.0-darwin-x86_64/./bin/kibana
//http://localhost:5601
