
const Constants = require("../Constants")
const Typecheck = require('../Typecheck')
const render = require('../actions/render')
const _ = require('lodash');
const should = require('should')
const MoleculeFactory = require('../factories/MoleculeFactory')

// @todo Remove
const MakeEmptyMolecule = (logger) =>{

    Typecheck(
        {name: "logger", value: logger, type: "object"},
    )

    return  MoleculeFactory(
        [],
        logger
    )

}

module.exports = MakeEmptyMolecule