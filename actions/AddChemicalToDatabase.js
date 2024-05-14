
//const sleep = require('atomic-sleep')

const AddChemicalToDatabase = (db) => {

    return (db) => {
        return (onSuccess)=> {
            return (search) =>{

                return (chemical)=>{
                    if (undefined === chemical['tags'] || chemical['tags'] === null) {
                        chemical['tags'] = []
                    }
                    chemical['tags'].push(search.replace(/\(\)/g, ""))

                    db.collection("molecules").insertOne(chemical, (err, result) => {
                        if (err) {
                            console.log(err)
                            process.exit()
                        } else {
                        }
                        onSuccess(chemical, 'added_chemical_to_database')
                    })

                }
            }
        }
    }
}

module.exports = AddChemicalToDatabase