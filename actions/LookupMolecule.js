// MoleculeLookup
const Typecheck = require('../Typecheck')

//const pubchem = require("pubchem-access").domain("compound");
const AddChemicalToDatabase = require('../actions/AddChemicalToDatabase')
const render = require('../actions/render')
const MoleculeFactory = require('../factories/MoleculeFactory')
//const { processScopeQueue } = require('terminal-kit/ScreenBufferHD')

function LookupMolecule (PubChemLookup) {

    const pkl = PubChemLookup((err)=>{
        console.log('[LookupMolecule] An error has occurred.')
        console.log(err)
        process.exit()
    })

    return (db) => {

        const addChemicalToDatabase = AddChemicalToDatabase(db)


        return (onLookupMoleculeSuccess) => {

            return (onAddedMoleculeToDBSuccess) => {
            
                const addChemicalToDatabaseWithCallback = addChemicalToDatabase(db)(onAddedMoleculeToDBSuccess)
    
                return (search_type) => {
    
                    return (search) => {
    
                        const addChemicalToDatabaseWithSearchTerm = addChemicalToDatabaseWithCallback(search)
    
                        tryLookingUpMoleculeLocallyThenTryLookingUpInPubChem()
    
                        function tryLookingUpMoleculeLocallyThenTryLookingUpInPubChem(){
    
                            db.collection('molecules').findOne(generateSearchObject(), function (Err, molecule) {
    
                                // An error occurred
                                if (Err) {
                                    console.log(Err)
                                    process.exit()
                                }
    
                                if (null !== molecule) {
                                    onLookupMoleculeSuccess(molecule)
                                } else {
                                    tryLookingUpMoleculeInPubChemBySmilesThenByName()
                                }
    
                            })
                        }
    
                        function tryLookingUpMoleculeInPubChemBySmilesThenByName() {
                            if (search_type === 'SMILES') {
                                tryLookingUpMoleculeInPubChemBySmiles()
                            } else {
                                tryLookingUpMoleculeInPubChemByName()
                            }
                        }
    
                        function tryLookingUpMoleculeInPubChemBySmiles() {
                            pkl.searchBySMILES(search.replace(/\(\)/g, ""), db, (molecule_from_pubchem) => {
                                if (null === molecule_from_pubchem) {
                                    tryLookingUpMoleculeInPubChemByName()
                                } else {
                                    addChemicalToDatabaseWithSearchTerm(molecule_from_pubchem)
                                }
                            })
                        }
    
                        function tryLookingUpMoleculeInPubChemByName() {
                            pkl.searchByName(search.replace(/\(\)/g, ""), db, (molecule_from_pubchem) => {
                                if (null === molecule_from_pubchem) {
                                   // console.log('[LookupMolecule] Unable to find molecule in pubchem using both name and smiles searches.')
                                } else {
                                    addChemicalToDatabaseWithSearchTerm(molecule_from_pubchem)
                                }
                            })
                        }
    
                        function generateSearchObject() {
                            // {$or:[{'tags':{$in:['water']}}]}
                            // Note do not search by CanonicalSmiles as this may be different from the one in tags
                            // which takes priority.
                            const search_object = {
                                $or: [
                                    {
                                        'tags': {
                                            $in: [search.replace(/['"]+/g, '').trim()]
                                        }
                                    },
                                    {
                                        "IUPACName": search.replace(/['"]+/g, '').trim()
                                    }
                                ]
                            }
                            return search_object
                        }
    
                    }
    
                }
    
            }
    


        }


    }

}


module.exports = LookupMolecule

















