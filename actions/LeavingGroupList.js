const { loggers } = require('winston')
const MoleculeFactory = require('../factories/MoleculeFactory')

const LeavingGroupList = (
    logger
) => {

    try {

        Typecheck(
            {name: "logger", value: logger, type: "object"},
        )

        const LeavingGroupList = [
    
            MoleculeFactory('[Br]', false, false, logger),
            MoleculeFactory('[F]', false, false, logger),
            MoleculeFactory('O', false, false, logger),
            MoleculeFactory('[Cl]', false, false, logger),
            MoleculeFactory('[I]', false, false, logger)
    
        ]

        return LeavingGroupList
    
    } catch(e) {
        logger.log('error', '[LeavingGroupList] ' + e.stack)
        console.log(e.stack)
        process.exit
    }
    
    
}

module.exports = LeavingGroupList