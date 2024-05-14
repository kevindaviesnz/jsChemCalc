/* AtomFactory

Returns an atom array object

Atom array properties:

[
    atomic symbol -  eg 'C', 'O'. etc
    atomic number - number of protons
    number valence electrons
    max number of bonds when neutral
    charge
    atom id
    electron_pairs
]

 */

const _ = require('lodash');
const uniqid = require('uniqid');
const PeriodicTable = require('./PeriodicTable')
const Prototypes = require("../Prototypes")
Prototypes()
const Typecheck = require("../Typecheck")

const ResonanceStructures = (molecule) => {

    Typecheck(
        {name: "molecule", value: molecule, type: "object"},
    )

    const resonance_structures = []


    return resonance_structures

}


module.exports = ResonanceStructures
