var http = require("http");
const express = require('express');
var Twit = require('promised-twit')
var fs = require('fs');
var redis = require('redis');
var uniqid = require('uniqid');
var elasticsearch = require('elasticsearch');
const profiler = require('v8-profiler')
const app = express();
//levanta al cliente de redis
var clientRedis = redis.createClient();

//Declaracion de variables
var word = ""; //keyword para buscar en tweets
var valores="";
var uid = "";
var keyword1 = "";
var time = "";
var date = "";
var resultText = "";
var uidParm1;

const snapshot = profiler.takeSnapshot()

snapshot.export(function(error, result){
  fs.writeFileSync('nodehero.heapsnapshot', result)
  snapshot.delete()

})

setTimeout(function(){
  const snapshotAfter = profiler.takeSnapshot()
  snapshotAfter.export(function(error, result){
    fs.writeFileSync('nodehero-2.heapsnapshot', result)
    snapshotAfter.delete()
    process.exit()
  })

},3000)


//levanta el cliente de elasticsearch
var clientElastic = new elasticsearch.Client({
   hosts: 'http://localhost:9200'
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

//End Point Inicio
app.get('/', function (req, res) {
    res.send('Especifique su operacion: SEARCH - QUERY - HISTORIAL ');
});


//End Point Search word
    app.get('/search/:keyword', function (req, res) {
        console.log("End Point Search New User");  
        word = req.params.keyword; //Obtiene el keyword de la URL
        uid1 = req.params.uid; //Obtiene el UID de la URL
        SaveLogs(uid1,word) //Envia el keyword y UID para guardar en LOGS
        //Esperar datos asincronicos con promesa.
        Consulta().then(function(result){
            // Do stuff
            console.log("Datos obtenidos");
            res.send('Fecha: '+date+  +'Hora: '+time+'    Keyword: '+word+'   UID: '+uid + ' Valores guardardos: '+resultText);
        
        }).catch(function(error){
            // Handle error
        });
});

//End Point Search word of a user register
app.get('/search/:keyword/:uid', function (req, res) {
    word = req.params.keyword; //Obtiene el keyword de la URL
    uid1 = req.params.uid; //Obtiene el UID de la URL
    console.log("End Point Search User " + uid1);  
    SaveLogs(uid1, word); //Envia el keyword y UID para guardar en LOGS
    Consulta().then(function(result){
        // Do stuff
        console.log("Datos obtenidos");
        res.send('Fecha: '+date+  +'Hora: '+time+'    Keyword: '+word+'   UID: '+uid + ' Valores guardardos: '+resultText);//respuesta al cliente
      
    }).catch(function(error){
        // Handle error
    });
});

//End Point query word on dbs
app.get('/query/:keyword', function (req, res) {
    word = req.params.keyword;
    //busqueda a elasticsearch con la keyword
    console.log('Buscando en DBS');
    clientElastic.search({
        index: 'tweet',
        type: 'consultas',
        body: {
            query: {
                match: { "key": `${word}` }
            },
        }
    },function (error, response,status) {
        if (error){
            console.log("search error: "+error)
        }
        else {
            response.hits.hits.forEach(function(hit){
                valores += 'Texto:  '+hit._source.texto + '          ';
                console.log(valores);
            })
            res.send(valores);
            valores = '';
        }
    });
});

//End Point historial por usuario
app.get('/historial/:uidParm', function (req, res) {
    uidParm1 = req.params.uidParm;
    console.log('Busqueda de historial usuario ' + uidParm1);
    clientElastic.search({
        index: 'logsapp',
        type: 'logs',
        body: {
        query: {
            match: { "uuids": `${uidParm1}` }
        },
        }
    },function (error, response,status) {
        if (error){
            console.log("search error: "+error)
        }
        else {
            response.hits.hits.forEach(function(hit){
                valores += 'timestamp:   '+hit._source.timestamp + '     ';
                valores += 'Key:   '+hit._source.key + '     ';
            })
            res.send(valores);
            valores = '';
        }
    });
});

//GUARDA LOGS EN CSV
function SaveLogs(uid1, word){
    keyword1 = word;
    time = new Date().toLocaleTimeString(); // HH/MM/SS
    date = new Date().toLocaleDateString(); // MM/DD/YYYY
    dateAndTime = date + ' ' + time;

    var newLine= "\r\n";
    var fields = "";

    if (uid1 == null) {
        uid = uniqid();
        console.log(uid);
    }else{
        uid = uid1;
    }

    fs.stat('LOGS/logs.csv', function (err, stat) {
        if (err == null) { //BUSCA SI EL ARCHIVO EXISTE
            console.log('File exists');
            csv = date+','+ time +','+ keyword1 +','+ uid+'\n';
            fs.appendFile('LOGS/logs.csv', csv, function (err) {
                if (err) throw err;
                console.log('The "data to append" was appended to file!');
            });
        }
        else { 
            // SI NO ENCUENTRA EL FILE, CREA UNO NUEVO
            //write the headers and newline
            console.log('New log file create');
                fields= (fields + newLine);

                fs.writeFile('LOGS/logs.csv', fields, function (err, stat) {
                    if (err) throw err;
                    console.log('file saved');
                });
        }
    });

    clientElastic.index({
    index: 'logsapp',//especificas el indice a guardar
    type: 'logs', //metodo para elastic (POST)
    body: {
        "timestamp" : dateAndTime,
        "date" : date,
         "time": time,
         "key": keyword1,
         "uuids": uid,
    }
    }, function(err, resp, status) {
            console.log(resp);
        });

}

//Consulta al API
function Consulta(){
    
    return new Promise(function(resolve, reject){
        clientRedis.exists(word, function(err, reply) {
        if (reply === 1) { //busca si la keyword esta en la db
            console.log('Key encontrada \n');
            clientRedis.smembers(word, function(err, names){
            console.log(names);
            valores = names;
            });
            clientRedis.quit();

        }else{

            var T = new Twit({ //credenciales para twitter
            consumer_key:         'your_consumer_key',
            consumer_secret:      'your_consumer_secret',
            access_token:         'your_access_token',
            access_token_secret:  'your_access_token_secret',
            });


            T.get('search/tweets', { q: word , since: 2017-07-10, count:5 }).then( function(result) {
                console.log('Datos encontrados en API de twiter \n');
                resolve('exito');
                        
                var len = Object.keys(result.data.statuses).length;
                console.log(len);
                for (i = 0 ; i < len ; i++) { //for para guardar todos los resultados
                
                    text = JSON.stringify(result.data.statuses[i].text);
                    resultText = resultText + text;
                    //guarda cada respuesta de twitter a elasticsearch
                    clientRedis.sadd(word, text); //guarda resultados en un set en Redis
                    //Insercion a elastic search
                    clientElastic.index({
                        index: 'tweet',//especificas el indice a guardar
                        type: 'consultas', //metodo para elastic (POST)
                        body: {
                            "key": word, //campos que se desean guardar
                            "texto": text,
                        }
                        }, function(err, resp, status) {
                                console.log(resp);
                            }); //fin elastic
     
                }//fin for

            });//fin llamada a twitter
        }
        });
    });

}


module.exports = app;
//elasticsearch-6.4.0/./bin/elasticsearch
//kibana-6.4.0-darwin-x86_64/./bin/kibana
//http://localhost:5601
//redis-server
