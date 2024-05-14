const jsonfile = require('jsonfile')

// reactions_db.collection('known_reactions').find().forEach((reaction)
class CacheClient {
    constructor() {
    }
    db(db_name) {
        return new class {
            constructor() {
            }
            collection(collection_name) {
                return new class {
                    constructor(collection_name) {
                        this.collection_name = 'known_reactions'
                    }
                    find() {
                        return new class {
                            constructor() {
                            }
                            forEach(callback) {
                                let file = './cache/' + collection_name + '.json'
                                jsonfile.readFile(file)
                                    .then(json=> {
                                        json.map((item)=>{
                                            callback(item)
                                        })
                                    })
                                    .catch(e=>{
                                        console.log(e)
                                        process.exit()
                                    })

                            }
                        }
                    }
                }
            }

        }
    }

}
module.exports = CacheClient