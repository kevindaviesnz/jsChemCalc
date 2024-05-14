/*

@see https://www.masterorganicchemistry.com/2010/05/21/lets-talk-about-the-12-elimination/
@see https://cdn.masterorganicchemistry.com/wp-content/uploads/2017/08/3-mech19.png?_ga=2.237710665.832783806.1638748877-827591198.1638748877
@see @see https://www.masterorganicchemistry.com/2017/03/22/reactions-of-dienes-12-and-14-addition/

Note: reversal of 1,2 addition

Bond electron pair donor to carbon atom
Break bond between carbon and oxygen atom



 */
const Constants = require("../Constants")
const Typecheck = require('../Typecheck')
const FindBreakBondToCarbonAtom =  require('../reflection/FindBreakBondToCarbonAtom')
const _ = require('lodash');
/*

Bond two atoms together within the same molecule.


 */

/*

Params in: container

 */

/*

IF CALL getSourceAtomTargetAtomBond using source atom, target atom
    REMOVE electron pair from source atom
ELSE
    COPY electron pair from source atom to target atom
ENDIF

 */


const LeavingGroupRemoval = require('../mechanisms/LeavingGroupRemoval')
const BondAtomToAtom = require('./BondAtomToAtomInSameMolecule')
const FormatAs = require('../factories/FormatAs')

const OneTwoElimination = (container, logger) => {

    try {
        if (Array.isArray(container)) {
            throw new Error('Container should be an object, not an array.')
        }
    } catch(e) {
        console.log('container')
        console.log(container)
        console.log(e)
        process.exit()
    }

    Typecheck(
        {name: "molecule", value: container.getSubstrate()[0], type: "object"},
    )

 //   logger.log('debug', 'Attempting 1,2 Elimination - ' + FormatAs(container.getSubstrate()[0]).SMILES(logger))

    /*
    In real life the bond occurs first but for our purposes we do the
    leaving group elimination first.
     */
    try {
        if (LeavingGroupRemoval(container, logger) === false) {
            throw new Error('1,2 Elimination - No leaving group')
        }
        BondAtomToAtom(container, logger)
    } catch(e) {
      //  console.log(e)
      //  logger.log('debug', e)
        return false
    }

   // logger.log('debug', 'Successfully completed 1,2 Elimination - ' + FormatAs(container.getSubstrate()[0]).SMILES(logger))

    return true


}


module.exports = OneTwoElimination