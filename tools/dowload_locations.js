require('dotenv').config()

const fetch = require('node-fetch')
const pick = require('object.pick')
const MongoClient = require('mongodb').MongoClient

const locations_url = 'https://guad.publicbikesystem.net/ube/gbfs/v1/en/station_information'

const elements_list = [
    'station_id',
    'name',
    'address',
    'post_code',
    'capacity',
    'rental_methods'
]

function formatLocation(station) {
    return {
        ...pick(station, elements_list),
        location: {
            coordinates: [
                station.lon,
                station.lat
            ],
            type : "Point"
        }
    }
}

function getStations() {
    return fetch(locations_url)
        .then(resp => resp.json())
        .then(station_information => station_information.data.stations.map(formatLocation))
}

async function run () {
    let stations = await getStations()
    let mongoClient = await MongoClient.connect(process.env['DB_URI'], { useNewUrlParser: true })
    
    let db = mongoClient.db(process.env['DATABASE'])
    let collection = db.collection(process.env['DB_COLLECTION'])
   
    collection.insertMany(stations)

    mongoClient.close()
}

run()
    .catch(err => {
        console.error(err)
        process.exit(1)
    })