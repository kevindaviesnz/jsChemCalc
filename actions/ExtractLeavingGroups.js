
const Constants = require("../Constants")
const Typecheck = require('../Typecheck')
const render = require('./render')
const _ = require('lodash');
const should = require('should')
const MoleculeFactory = require('../factories/MoleculeFactory')
const ExtractHalideLeavingGroups = require("./ExtractHalideLeavingGroups")
const ExtractOHLeavingGroups = require("./ExtractOHLeavingGroups")

const ExtractLeavingGroups = (molecule) =>{

        const atoms = molecule.atoms

        const oh_atoms = _.cloneDeep(atoms)
        const halide_atoms = _.cloneDeep(atoms)

        const OHLeavingGroups = ExtractOHLeavingGroups(molecule)
        const HalideLeavingGroups = ExtractHalideLeavingGroups(molecule, halide_atoms)

        return [...OHLeavingGroups, ...HalideLeavingGroups]

}

module.exports = ExtractLeavingGroups