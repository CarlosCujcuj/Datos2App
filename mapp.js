var elasticsearch = require('elasticsearch');
var valores;
//levanta el cliente de elasticsearch
var clientElastic = new elasticsearch.Client({
   hosts: 'http://localhost:9200'
   //,log: 'trace'
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


/// 2.)-----mappear los indices
clientElastic.indices.putMapping({
  index: 'tweet',
  type: 'consultas',
  body: {
    properties: {
      'key': {'type': 'keyword'},
      'texto': {'type': 'text'}
    }
  }
},function(err,resp,status){
    if (err) {
      console.log(err);
    }
    else {
      console.log(resp);
    }
});

clientElastic.indices.putMapping({
  index: 'logsapp',
  type: 'logs',
  body: {
    properties: {
      'date': {'type': 'date', 'format':'yyyy-MM-dd' },
      'time' : {'type':'date', 'format' : 'HH:mm:ss' },
      'timestamp': {'type': 'date', 'format':'yyyy-MM-dd HH:mm:ss' },
      'key': {'type': 'keyword'},
      'uuids': {'type': 'keyword'}
    }
  }
},function(err,resp,status){
    if (err) {
      console.log(err);
    }
    else {
      console.log(resp);
    }
});
