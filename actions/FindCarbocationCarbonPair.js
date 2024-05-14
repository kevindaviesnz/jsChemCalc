
const Constants = require("../Constants")
const Typecheck = require('../Typecheck')
const render = require('./render')
const _ = require('lodash');
const should = require('should')
const MoleculeFactory = require('../factories/MoleculeFactory')
const FindCarbocation = require('../actions/FindCarbocation')
const FindAlkeneCarbonAtoms = require('../actions/FindAlkeneCarbonAtoms')
const env = require('../env')

const FindCarbocationCarbonPair = (molecule) =>{


                // 'this' is a molecule
                const carbocation = FindCarbocation(molecule)

                if (carbocation === false) {
                    return false
                }

               // const atoms = molecule.atoms

                const carbon_bonds = _.find(carbocation.bonds(molecule.atoms), (bond)=>{
                    return bond.atom.atomicSymbol === 'C' && bond.bondType == ''
                })

                if (undefined === carbon_bonds) {
                    return false
                }

                if (0 === carbon_bonds.length) {
                    return false
                }

                const carbon = carbon_bonds.atom

                return [carbon, carbocation]




}

module.exports = FindCarbocationCarbonPair