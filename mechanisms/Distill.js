
/*

Remove all everything from container except the substrate.
 */

const Constants = require("../Constants")
const Typecheck = require('../Typecheck')
const findLeavingGroupAtom = require('../reflection/findLeavingGroupAtom')
const LewisBaseAtom = require('../reflection/LewisBaseAtom')
//const MoleculeFactory = require('../factories/MoleculeFactory')
const _ = require('lodash')
const nucleophilicAttack = require('./NucleophilicAttack')
const leavingGroupRemoval = require('./LeavingGroupRemoval')
//const deprotonate = require('../mechanisms/deprotonate')
//const FindBronstedLoweryBaseAtom = require('../reflection/BronstedLoweryBaseAtom')
//const FindBronstedLoweryAcidAtom = require('../reflection/BronstedLoweryAcidAtom')
const AtomFactory = require('../factories/AtomFactory')
const { Format } = require("logform")
const RemoveAtom = require('../actions/RemoveAtom')
const ReplaceAtom = require('../actions/ReplaceAtom')
const MoleculeFactory = require("../factories/MoleculeFactory")
const AddAtom = require('../actions/AddAtom')
const { Container } = require("winston")
const ContainerFactory = require("../factories/ContainerFactory")


const Distill = (container, logger) => {

    try {


        Typecheck(
            {name: "container", value: container, type: "object"},
            {name: "logger", value: logger, type: "object"}
        )

        // ContainerFactory(substrate, reagents, solvent, logger) 
        /*
        container = ContainerFactory(
            container.getSubstrate()[0],
            [],
            null,
            logger
        )*/

        container.reagents = []
        

        return container

    } catch(e) {
        logger.log('error', 'Deprotonate() ' + e)
        console.log(e.stack)
        process.exit()
    }

}


module.exports = Distill