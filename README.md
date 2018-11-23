# API Search on Twitter ELK Stack
App desarrollada para la clase de datos 2 de la UFM, cumpliendo las siguientes Epics

>*As a search application API user
I want to be able to get related information to some keywords I may enter in a simple form
And keep those searches in my history so I can run same search again
And create as many searches as I require
And receive a notification when new information is available*

>*As a search application administrator
I want to be able to understand usage metrics from all users
And run reports from historical information
And have directional usage metrics in real time
And have visibility of potential problems in the system.
And visualize potential revenue we could get by having a fee by search*

## Funcionalidad
Esta app fue desarrollado con NodeJS con las siguientes dependencias >(npm install.txt)
- express
- http-server
- promised-twit
- file-system
- redis
- uniqid
- elasticsearch

Las herramientas y estrategias para la gestion de datos
* Redis (cache)
* Elasticsearch (DB index)
* Kibana (Viasualize)
* Logstach (Pipeline)

## Instalación
1. Instalar dependencias con npm mirar archivo >(npm install.txt)
2. Crear Indixes en Elasticsearch
```
node createIndex.js
```
3. Mapear Elasticsearch
```
node mapp.js
```
4. Levantar el servidor
```
node server.js
```

 
