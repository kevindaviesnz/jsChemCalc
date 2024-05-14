
const Typecheck = require('../Typecheck')

const AddReactionStepToDatabase = (db, logger, reaction_step, reactionStepFoundCallback, reactionStepAddedCallback) => {

    Typecheck(
        {name: "reaction_step", value: reaction_step, type: "object"}, // JSON object
        {name: "logger", value: logger, type: "object"},
        {name: "reactionStepFoundCallback", value: reactionStepFoundCallback, type: "function"},
        {name: "reactionStepAddedCallback", value: reactionStepAddedCallback, type: "function"},
        {name: "db", value: db, type: 'object'}
    )

    const search_object = {
        $and: [
            {
                // @todo remove 'testing'
                "mechanism": reaction_step.mechanism + 'testing'
            },
            {
                "precursor_substrate_SMILES": reaction_step.precursor_substrate_SMILES
            },
            {
                "chemical_substrate_SMILES": reaction_step.chemical_substrate_SMILES
            }
        ]
    }

    db.collection('pathways').findOne(search_object, function (Err, result) {

        if (Err) {
            console.log(Err)
            logger.log('verbose', 'Error looking up reaction step in database.' + Err)
            process.exit()
        } else {

            if (null === result) { // reaction step has not already been added
                db.collection("pathways").insertOne(reaction_step, (err, result) => {
                    if (err) {
                        logger.log('verbose', 'Error looking up reaction step in database.' + err)
                        process.exit()
                    } else {
                        logger.log('verbose', 'Added reaction step to database.' + err)
                        reactionStepAddedCallback(reaction_step)
                    }
                })
            } else {
            //    logger.log('verbose', 'Reaction step found in database.')
                reactionStepFoundCallback(reaction_step)
            }
        }

    })


}

module.exports = AddReactionStepToDatabase