
var http = require("http");
const express = require('express');
var Twit = require('twit');
const uuidv1 = require('uuid/v1');
var fs = require('fs');
var redis = require('redis');
var uniqid = require('uniqid');

const app = express();
var word = 'taco'; //keyword para buscar en tweets
var valores;
var uid = "";
var keyword1 = "";
var time = "";
var date = "";
var uidParm1;

//levanta el cliente de elasticsearch
var elasticsearch = require('elasticsearch');
var clientElastic = new elasticsearch.Client({
   hosts: 'http://localhost:9200',
   log: 'trace'
});


//manda un ping para verificar que si esta funcionando el server
clientElastic.ping({
     requestTimeout: 30000,
 }, function(error) {
     if (error) {
         console.error('elasticsearch cluster is down!');
     } else {
         console.log('Everything is ok');
     }
 });

//levanta el cliente de Redis
var clientRedis = redis.createClient();    //levanta al cliente de redis
   clientRedis.on('error', function(err){
   console.log('Something went wrong ', err)
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
  //PENDIENTE: usar promises para madar respuesta de lo guardado
  res.send('Fecha: '+date+'    Hora: '+time+'    Keyword: '+keyword1+'   UID: '+uid + '    Valores guardardos: '+valores); //respuesta al cliente
});

//Busqueda de keyword con UID
app.get('/search/:keyword/:uid', function (req, res) {
  uid1 = req.params.uid; //Obtiene el UID de la URL
  word = req.params.keyword;//obtiene el keyword de la URL
  SaveLogs(uid1, word); //Envia el keyword y UID para guardar en LOGS
  res.send('Fecha: '+date+'    Hora: '+time+'    Keyword: '+keyword1+'   UID: '+uid); //respuesta al cliente
});

app.get('/query/:keyword', function (req, res) {
  word = req.params.keyword;
  //busqueda a elasticsearch con la keyword
  clientElastic.search({
    index: 'tweet',
    //type: 'tweets',
    body: {
      query: {
        match: {
            "texto" : `${word}`
        }
      }
    }
  }).then(function (resp) {
      var hits = resp.hits.hits;
      res.send(hits);
  }, function (err) {
      console.trace(err.message);
  });

/*
  clientElastic.search({
      index: 'tweet',
      type: 'get',
      body: {
        query: {
          match: {
            "texto": `${word}`
          }
        }
      }
  }).then(function (resp) {
      console.log(resp);
      res.send(resp);
  }, function (err) {
      console.trace(err.message);
  });
/*
  const response = await clientElastic.search({
  index: 'tweet',
  body: {
    query: {
      match: {
        "texto": `${word}`
      }
    }
  }
})

for (const tweet of response.hits.hits) {
  console.log('Respuesta:', tweet);
}
*/
});

app.get('/historial/:uidParm', function (req, res) {
  uidParm1 = req.params.uidParm;

  clientElastic.search({
    index: 'logsapp',
    //type: 'tweets',
    body: {
      query: {
        match: {
            "UID" : `${uidParm1}`
        }
      }
    }
  }).then(function (resp) {
      var hits = resp.hits.hits;
      res.send(hits);
  }, function (err) {
      console.trace(err.message);
  });
});

/*
//crea indice
 clientclientElastic.indices.create({
     index: 'tweet'
 }, function(err, resp, status) {
     if (err) {
         console.log(err);
     } else {
         console.log("create", resp);
     }
 });

//crea index logs
clientElastic.indices.create({
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
      uid = uniqid();
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

  clientElastic.index({
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
  clientRedis.exists(word, function(err, reply) {
      if (reply === 1) { //busca si la keyword esta en la db
        console.log('Key encontrada \n');
        clientRedis.smembers(word, function(err, names){
        console.log(names);
        });
          clientRedis.quit();

      }else{

        var T = new Twit({ //credenciales para twitter
          consumer_key:         'your_consumer_key',
          consumer_secret:      'your_consumer_secret',
          access_token:         'your_access_token',
          access_token_secret:  'your_access_token_secret',
        })


        T.get('search/tweets', { q: word , since: 2017-07-10, count:5 }, function(err, data, response) {
        //console.log(data);
        var len = Object.keys(data.statuses).length;
        console.log(len);
         for (i = 0 ; i < len ; i++) { //for para guardar todos los resultados

           //console.log(data.statuses[i].text);
           //console.log(data.statuses[i]);

           //guarda en variable text el texto del tweet
          text = JSON.stringify(data.statuses[i].text)
          //guarda cada respuesta de twitter a elasticsearch
          clientRedis.sadd(word, text); //guarda resultados en un set en Redis
          clientElastic.index({
          index: 'tweet',//especificas el indice a guardar
          type: 'posts', //metodo para elastic (POST)
          body: {
               "key": word, //campos que se desean guardar
               "texto": text,
           }
          }, function(err, resp, status) {
                  console.log(resp);
                }); //fin elastic
        }//fin for

        //imprime los valores de la keyword en Redis
        clientRedis.smembers(word, function(err, names){
        console.log(names);
        valores = names;
        });

      });//fin llamada a twitter
      }
    });


}


module.exports = app;
//elasticsearch-6.4.0/./bin/elasticsearch

//kibana-6.4.0-darwin-x86_64/./bin/kibana
//http://localhost:5601
