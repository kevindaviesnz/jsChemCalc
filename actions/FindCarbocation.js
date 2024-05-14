
const Constants = require("../Constants")
const Typecheck = require('../Typecheck')
const render = require('./render')
const _ = require('lodash');
const should = require('should')
const MoleculeFactory = require('../factories/MoleculeFactory')

const FindCarbocation = (molecule) =>{

    
        // A carbocation is a molecule in which a carbon atom bears three bonds and a positive charge.
        const carbocation = _.find(molecule.atoms,(atom)=>{
            return atom.isCarbocation(molecule.atoms)
        })

        return carbocation === undefined?false:carbocation



}

module.exports = FindCarbocation