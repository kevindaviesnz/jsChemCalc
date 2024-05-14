// @see https://www.masterorganicchemistry.com/2012/08/22/rearrangement-reactions-2-alkyl-shifts/
// See https://www.masterorganicchemistry.com/2012/08/15/rearrangement-reactions-1-hydride-shifts/

/*

FIND carbocation - carbon bond
IF carbocation - carbon bond NOT FOUND
    RETURN false
END IF

SET carbocation type AS 1 OR 2 OR 3 (primary, secondary, tertiary)

CLONE molecule atoms AS hydride shift atoms
CLONE molecule atoms AS akyl shift atoms

IF carbon on carbocation - carbon bond HAS hydrogen
    SHIFT hydrogen to carbocation
    SET hydride shift carbocation type AS 1 OR 2 OR 3 (primary, secondary, tertiary)
END IF

IF carbon on carbocation - carbon bond HAS akyl group
    SHIFT akyl group to carbocation
    SET akyl group shift carbocation type AS 1 OR 2 OR 3 (primary, secondary, tertiary)
END IF

IF NEITHER hydride shift OR akyl group shift
    RETURN false
ENDIF

IF hydride shift carbocation type > akyl group shift carbocation type
   SET molecule atoms TO hydride shift atoms
ELSE
   SET molecule atoms TO akyl shift atoms
END IF
 */

const Constants = require('../Constants')
const Typecheck = require("../Typecheck")
const _ = require('lodash');
const FormatAs = require('../factories/FormatAs');
const FindCarbocationCarbonPair = require('../actions/FindCarbocationCarbonPair');
const { C } = require('../factories/PeriodicTable');
const MoleculeFactory = require('../factories/MoleculeFactory');

const AkylShift = (container, logger) => {

    try {

        Typecheck(
            {name: "container", value: container, type: "object"},
            {name: "logger", value: logger, type: "object"},
        )

        if (Array.isArray(container)) {
                throw new Error('Container should be an object, not an array.')
        }

        // ShiftAkylGroup() can return false
        container.getSubstrate()[0] = ShiftAkylGroup(container.getSubstrate()[0], logger)
 

    } catch(e) {

        logger.log('error', 'AkylShift() '+e)
        console.log(e.stack)
        process.exit()

    }




}

module.exports = AkylShift