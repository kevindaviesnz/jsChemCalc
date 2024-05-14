
const Constants = require("../Constants")
const Typecheck = require('../Typecheck')
const render = require('./render')
const _ = require('lodash');
const should = require('should')
const MoleculeFactory = require('../factories/MoleculeFactory')
const FormatAs = require("../factories/FormatAs")

const IsOxidisationAgent = (molecule, logger) =>{

    try {

        if ('OA:' === molecule) {
            return true
        }

        Typecheck(
            {name:"molecule", value:molecule, type:"object"},
            {name:"logger", value:logger, type:"object"}
        )

        const oxidisation_agents = 
        [
        ]

        return oxidisation_agents.indexOf(molecule.canonicalSmiles(false, molecule.atoms, logger)) !== -1


    } catch(e) {
        logger.log('error', e.stack)
        console.log(e.stack)
        process.exit()
    }


}

module.exports = IsOxidisationAgent