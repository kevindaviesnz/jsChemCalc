
const Constants = require("../Constants")
const Typecheck = require('../Typecheck')
const render = require('./render')
const _ = require('lodash');
const should = require('should')
const MoleculeFactory = require('../factories/MoleculeFactory')
const FormatAs = require("../factories/FormatAs")

const IsReducingAgent = (molecule, logger) =>{

    try {

        Typecheck(
            {name:"molecule", value:molecule, type:"object"},
            {name:"logger", value:logger, type:"object"}
        )

        const reducing_agents = 
        [
            '[BH4-].[Na+]',
            '[B-]C#N.[Na+]',
            '[BH-](OC(=O)C)(OC(=O)C)OC(=O)C.[Na+]'
        ]

        return reducing_agents.indexOf(false, molecule.atoms, logger) !== -1


    } catch(e) {
        logger.log('error', 'IsReducingAgent() '+e.stack)
        console.log(e.stack)
        process.exit()
    }



}

module.exports = IsReducingAgent