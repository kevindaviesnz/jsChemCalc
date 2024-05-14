
const Constants = require("../Constants")
const Typecheck = require('../Typecheck')
const render = require('./render')
const _ = require('lodash');
const should = require('should')
const MoleculeFactory = require('../factories/MoleculeFactory')

const FindAlkeneCarbonAtoms = (molecule) =>{

        const alkene_carbon = _.find(molecule.atoms, (atom)=>{
            if('C'!==atom.atomicSymbol) {
                return false
            }
            const double_bonds = atom.doubleBonds(molecule.atoms)
            if (double_bonds.length === 0) {
                return false
            }
            const double_carbon_bond = _.find(double_bonds, (db)=>{
                return 'C' === db.atom.atomicSymbol
            })
            return undefined !== double_carbon_bond
        })

        if (undefined === alkene_carbon) {
            return false
        }

        const double_bond_carbon = _.find(alkene_carbon.doubleBonds(molecule.atoms), (db)=>{
            return 'C' === db.atom.atomicSymbol
        }).atom

        if (alkene_carbon.hydrogens(molecule.atoms).length > double_bond_carbon.hydrogens(molecule.atoms).length) {
            return {
                'least_saturated_carbon':alkene_carbon,
                'most_saturated_carbon':double_bond_carbon
            }
        } else {
            return {
                'least_saturated_carbon':double_bond_carbon,
                'most_saturated_carbon':alkene_carbon
            }

        }



}

module.exports = FindAlkeneCarbonAtoms