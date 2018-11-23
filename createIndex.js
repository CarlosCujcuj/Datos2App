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


//   1.)-----crea indices
 clientElastic.indices.create({
   index: 'tweet'
 },function(err,resp,status) {
   if(err) {
     console.log(err);
   }
   else {
     console.log("create",resp);
   }
 });


 clientElastic.indices.create({
   index: 'logsapp'
 },function(err,resp,status) {
   if(err) {
     console.log(err);
   }
   else {
     console.log("create",resp);
   }
 });
