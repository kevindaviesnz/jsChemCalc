const ExtractLeavingGroups = require('../actions/ExtractLeavingGroups')

const FindSN1CarbonAtom = (molecule) => {

    // Get partially charged carbocation attached to a leaving group.
    return partial_charged_carbocation = molecule.atoms.filter((atom)=> {
        if (atom.charge(molecule.atoms, logger) === '&+' && ExtractLeavingGroups(atom,logger).length > 0) {
            return true
        }
        return false
    })[0]

}

module.exports = FindSN1CarbonAtom