const ExtractLeavingGroups = require('../actions/ExtractLeavingGroups')

const FindSN1LeavingGroup = (molecule, partial_charged_carbocation) => {

    // Get partially charged carbocation attached to a leaving group.
    return ExtractLeavingGroups(partial_charged_carbocation.atoms, logger)[0]

}

module.exports = FindSN1CarbonAtom