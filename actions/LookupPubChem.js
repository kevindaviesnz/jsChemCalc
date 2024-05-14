/*

Look up a chemical

Params in: chemical name or SMILES
Params out: molecule object

 */
const Typecheck = require('../Typecheck')
const render = require('../actions/render')
//const request = require('request');
// https://www.npmjs.com
const get = require('simple-get')
// Install using 'npm install'
const sleep = require('atomic-sleep')

const LookupPubChem = (Err) => {

    const _log = (msg) => {
        console.log('[LookupPubchem] Got error ' + msg)
        if (false) {
            console.log(msg)
        }
    }

    const properties = ["IUPACName", "MolecularFormula", "MolecularWeight",
        "CanonicalSMILES", "IsomericSMILES", "InChI", "InChIKey",
        "XLogP", "ExactMass", "MonoisotopicMass", "TPSA",
        "Complexity", "Charge", "HBondDonorCount", "HBondAcceptorCount",
        "RotatableBondCount", "HeavyAtomCount", "IsotopeAtomCount", "AtomStereoCount",
        "DefinedAtomStereoCount", "UndefinedAtomStereoCount", "BondStereoCount", "DefinedBondStereoCount",
        "UndefinedBondStereoCount", "CovalentUnitCount", "Volume3D", "XStericQuadrupole3D",
        "YStericQuadrupole3D", "ZStericQuadrupole3D", "FeatureCount3D", "FeatureAcceptorCount3D",
        "FeatureDonorCount3D", "FeatureAnionCount3D", "FeatureCationCount3D", "FeatureRingCount3D",
        "FeatureHydrophobeCount3D", "ConformerModelRMSD3D", "EffectiveRotorCount3D", "ConformerCount3D",
        "Fingerprint2D"]

    const searchBySMILES = (name, db, callback) =>{
        const name_no_quotes = name.replace(/['"]+/g, '').trim()

    //    console.log('[LookupPubchem] Searching by smiles')

        // Make API call to pubchem
        // @see https://pubchempy.readthedocs.io/en/latest/guide/properties.html
        /*
         Multiple properties may be specified in a list, or in a comma-separated string. The available properties are: MolecularFormula, MolecularWeight,
         CanonicalSMILES, IsomericSMILES, InChI, InChIKey, IUPACName, XLogP, ExactMass, MonoisotopicMass, TPSA, Complexity, Charge, HBondDonorCount,
          HBondAcceptorCount, RotatableBondCount, HeavyAtomCount, IsotopeAtomCount, AtomStereoCount, DefinedAtomStereoCount, UndefinedAtomStereoCount,
          BondStereoCount, DefinedBondStereoCount, UndefinedBondStereoCount, CovalentUnitCount, Volume3D, XStericQuadrupole3D, YStericQuadrupole3D,
           ZStericQuadrupole3D, FeatureCount3D, FeatureAcceptorCount3D, FeatureDonorCount3D, FeatureAnionCount3D, FeatureCationCount3D, FeatureRingCount3D,
           FeatureHydrophobeCount3D, ConformerModelRMSD3D, EffectiveRotorCount3D, ConformerCount3D.
         */
        const uri = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/' + encodeURIComponent(name_no_quotes.replace(/\(\)/g, "")) + '/property/' + properties.join(',') + '/JSON'

        const opts = {
            method: 'GET',
            url: uri,
            body: {
                key: 'value'
            },
            json: true
        }

        get.concat(opts, function (err, res, body) {

            if (err) {
                // Lookup failed
               console.log('[LookupPubChem] Lookup by smiles failed ' + err)
                Err(err)
            } else {
              // console.log('[LookupPubChem] status ' + res.statusCode) // 200
                if (res.statusCode !== 200) {
                    console.log('[LookupPubchem] Tried searching for ' + name_no_quotes)
                    console.log(uri)
                    console.log(body)
                    console.log('[LookupPubchem] exiting')
                    process.exit()
                    Err(err)
                } else {
                    // console.log(body.PropertyTable.Properties[0])
                   // console.log('[LookupPubchem] Got chemical from PubChem, waiting 10 secs')
                    setTimeout(() => {  }, 100) 
                    sleep(10000)
                 //   console.log('[LookupPubchem] Callling callback')
                    callback(body.PropertyTable.Properties[0])
                }
            }
        })

    }


    const searchByName = (name, db, callback) => {

        const name_no_quotes = name.replace(/['"]+/g, '').trim()
       // console.log('[LookupPubchem] Got chemical from PubChem, waiting 10 secs')
        setTimeout(() => {  }, 100) 
        sleep(10000)
        setTimeout(function() {
        }, Math.floor(Math.random() * 3000))

        // Make API call to pubchem
        // @see https://pubchempy.readthedocs.io/en/latest/guide/properties.html
        /*
         Multiple properties may be specified in a list, or in a comma-separated string. The available properties are: MolecularFormula, MolecularWeight,
         CanonicalSMILES, IsomericSMILES, InChI, InChIKey, IUPACName, XLogP, ExactMass, MonoisotopicMass, TPSA, Complexity, Charge, HBondDonorCount,
          HBondAcceptorCount, RotatableBondCount, HeavyAtomCount, IsotopeAtomCount, AtomStereoCount, DefinedAtomStereoCount, UndefinedAtomStereoCount,
          BondStereoCount, DefinedBondStereoCount, UndefinedBondStereoCount, CovalentUnitCount, Volume3D, XStericQuadrupole3D, YStericQuadrupole3D,
           ZStericQuadrupole3D, FeatureCount3D, FeatureAcceptorCount3D, FeatureDonorCount3D, FeatureAnionCount3D, FeatureCationCount3D, FeatureRingCount3D,
           FeatureHydrophobeCount3D, ConformerModelRMSD3D, EffectiveRotorCount3D, ConformerCount3D.
         */
        const uri = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/' + name_no_quotes + '/property/CanonicalSMILES,IUPACName,MolecularFormula,Charge,MolecularWeight,HeavyAtomCount/JSON'
        const uri2 ='https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/benzene/property/CanonicalSMILES,IUPACName,MolecularFormula,Charge,MolecularWeight,HeavyAtomCount/JSON'

       // console.log('[LookupPubChem] uri ' + uri)

        const opts = {
            method: 'GET',
            url: uri,
            body: {
                key: 'value'
            },
            json: true
        }

        get.concat(opts, function (err, res, body) {
            if (err) {
                // Lookup failed
               // console.log('LookupPubChem] Failed search by name ' + err)
                Err(err)
               // console.log("[LookupPubChem] There was an error searching by name  " + name_no_quotes)
               // console.log("[LookupPubChem] Searching by SMILES instead")
                searchBySMILES(name, db, callback)
            } else {
               // console.log('[LookupPubChem] Status after searching by name ' + res.statusCode) // 200
               // console.log('[LookupPubchem] Callling callback after searching by name')
                console.log(body.PropertyTable.Properties[0])
                callback(body.PropertyTable.Properties[0])
            }
        })

    }


    const searchByCID = (CID, db, callback) => {

        setTimeout(function() {
        }, Math.floor(Math.random() * 3000))

        request('https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/' + CID + '/property' + properties.join(',') + '/JSON', {json: true}, (err, res, body) => {
            if (err) {
                // Lookup failed
                Err(err)
                console.log('PubchemLookup FetchByCID()')
                process.exit()
            } else {
                // Lookup was successful but there was a search error
                if (undefined !== body.Fault || undefined !== body.Code) {
                    console.log('Error FetchByCID() ' + CID)
                    Err(body)
                    console.log('PubchemLookup FetchByCID()')
                    process.exit()
                } else {
                    // Search by CID went ok. Call the callback passing in the UPAC name.
                    callback(body.PropertyTable.Properties[0])
                }
            }
        })
    }

    const FetchSubstructuresByListKey = (list_key, db, callback, debug_statement) => {

        _log("Using list key " + list_key)
        _log('Callling https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/listkey/' + list_key + '/property/' + properties.join(',') + '/JSON')

        // https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/listkey/3433188641421175200/JSON
        process.exit()

        request('https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/listkey/' + list_key + '/property/' + properties.join(',') + '/JSON', { json: true }, (err, res, body) => {
            if (err) {
                Err(err)
                console.log('PubchemLookup FetchSubstructuresByListLey()')
                process.exit()
            } else {
                if (undefined !== body.Fault || undefined !== body.Code) {
                    console.log('listkey error - ' + list_key + debug_statement)
                    console.log(body)
                    Err(body)
                    // process.exit()
                } else {

                    /*{
                      "IdentifierList": {
                        "CID": [
                          1615,
                          71285,*/
                    if (undefined !== body.Waiting ){
                        FetchSubstructuresByListKey(list_key, db, callback)
                    } else {

                        body.PropertyTable.Properties.map(
                            (molecule) => {
                                // console.log('PubchemLookup - substructures - delaying one second')

                                setTimeout(function() {
                                }, Math.floor(Math.random() * 3000))

                                callback(molecule, db)
                            }
                        )
                    }
                }
            }

        })

    }

    const fetchSubstructuresBySMILES = (SMILES, db, callback, debug_statement) => {


        console.log("[LookupPubchem] Fetching substructures")

        request('https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/fastsubstructure/SMILES/' + encodeURIComponent(SMILES) + '/property/CanonicalSmiles,IUPACName/JSON?StripHydrogen=true', { json: true }, (err, res, body) => {
            if (err) {
                Err(err)
                console.log('PubchemLookup FetchSubstructuresBySMILES()')
                process.exit()
            } else {
                if (undefined !== body.Fault) {
                    console.log('Error FetchSubstructuresBySMILES() ' + SMILES)
                    console.log(body)
                    console.log('PubchemLookup FetchSubstructuresBySMILES()')
                    process.exit()
                } else {

                    if (undefined !== body.PropertyTable ) {
                        body.PropertyTable.Properties.map(
                            (molecule) => {
                                callback(molecule, db, SMILES)
                            }
                        )
                    }

                }
            }
        })


    }

    return {

        fetchSubstructuresBySMILES: fetchSubstructuresBySMILES,
        searchBySMILES: searchBySMILES,
        searchByName: searchByName,
        searchByCID: searchByCID
    }

}

module.exports = LookupPubChem
