/*

Initialised container

Params in: null
Params out: container object

[0] = molecules
 */

const FormatAs = require('../factories/FormatAs')
const Typecheck = require("../Typecheck");

const Container= (container) => {

    try {


        const toJSON = function() {

        }

        const SMILES = function(logger) {


            Typecheck(
                {name: "logger", value: logger, type: "object"}
            )

            return {
                'substrate': null===container.getSubstrate()[0]?'No substrate found':container.getSubstrate()[0].canonicalSmiles(false, container.getSubstrate()[0].atoms,logger) + '  ' + container.getSubstrate()[0].conjugateBase + ' ' + container.getSubstrate()[0].conjugateAcid,
                'reagents': container.reagents == null? []:container.reagents.map((reagent)=>{
                    const reagent_smiles  = reagent.canonicalSmiles(false, reagent.atoms, logger)
                    return undefined === reagent_smiles?reagent:reagent_smiles + '  ' + reagent.conjugateBase + ' ' + reagent.conjugateAcid
                })

            }

        }

        return {
            'toJSON':toJSON,
            'SMILES':SMILES,
        }

    } catch(e) {
        logger.log('error', 'view/Container() '+e.stack)
        console.log(e.stack)
        process.exit()
    }

}

module.exports = Container