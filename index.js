require('dotenv').config()

const Koa = require('koa')
const Router = require('koa-router')
const MongoClient = require('mongodb').MongoClient

const fetch = require('node-fetch')

const app = new Koa()
const router = new Router()

const statusUri = "https://guad.publicbikesystem.net/ube/gbfs/v1/en/station_status"

function findFormat({lon, lat, maxDistance = 500}) {
  return {
    "location": { 
      "$near" : {
        "$geometry" : {
        "type" : "Point" ,
        "coordinates" : [parseFloat(lon), parseFloat(lat)] },
        "$maxDistance" : parseInt(maxDistance)
      }
    }
  }
}

router.get('/', async (ctx, next) => {
  let mongoClient = await MongoClient.connect(process.env['DB_URI'], { useNewUrlParser: true })

  let db = mongoClient.db(process.env['DATABASE'])
  let collection = db.collection(process.env['DB_COLLECTION'])

  let query = findFormat(ctx.query)
  let stations = await collection.find(query).toArray()
  let status = await fetch(statusUri).then(res => res.json()).then(res => res.data.stations)
  
  ctx.body = stations.map(station => {
    let stationStatus = status.find(el => el.station_id == station.station_id)

    return {
      ...station,
      ...stationStatus
    }
  })
  
  mongoClient.close()
})

app
  .use(router.routes())
  .use(router.allowedMethods())

app.listen(3000)