
const _ = require('lodash')
const {
    Container
} = require('winston')
const AI = require('../AI/AI')
const FormatAs = require('../factories/FormatAs')
const Typecheck = require('../Typecheck')
const LewisAcidAtom = require('../reflection/LewisAcidAtom')
const LewisBaseAtom = require('../reflection/LewisBaseAtom')
const LewisAcidBase = require('../reactions/LewisAcidBase')
const Protonate = require('../mechanisms/Protonate');
const Deprotonate = require('../mechanisms/Deprotonate');
const SN2 = require('../reactions/SN2')
const SN1 = require('../reactions/SN1')
const E1 = require('../reactions/E1')
const E2 = require('../reactions/E2')
const AcidBase = require('../reactions/AcidBase');
const Stabilise = require('../actions/Stabilise');
const MoleculeFactory = require('../factories/MoleculeFactory');
const BronstedLoweryBaseAtom = require('../reflection/BronstedLoweryBaseAtom')
const BronstedLoweryAcidAtom = require('../reflection/BronstedLoweryAcidAtom')
const ConjugateBase = require('../reflection/ConjugateBase')
const ConjugateAcid = require('../reflection/ConjugateAcid')
const EquilibriumConstant = require('../reflection/EquilibriumConstant')
const FindStrongestLewisBaseMolecule = require('../reflection/FindStrongestLewisBaseMolecule')


function fetchRandomReactantByCriteria(container, reaction_map, criteriaFn, allow_generic, logger) {
    if (allow_generic) {
        const generic_reactant = _.find(container.reactants, (r) => r[0].startsWith('A:') || r[0].startsWith('CA:'));
        if (generic_reactant) {
            return generic_reactant;
        }
    }

    const filteredReactants = container.reactants.filter((r) => {
        return (
            !reaction_map[r[0].id] ||
            reaction_map[r[0].id].indexOf(r.id) === -1
        ) && r[1] > 0 && criteriaFn(r[0], logger) && !_.isEqual(container.reactants[0], r[0]);
    });

    if (filteredReactants.length === 0) {
        return null;
    }

    const reactantsAcidityMap = filteredReactants.reduce((obj, r) => {
        obj[r[0].pKa * r[1] + 100] = r;
        return obj;
    }, {});

    const indices = Object.keys(reactantsAcidityMap).map(Number);
    const totalInverseWeight = indices.reduce((acc, index) => acc + 1 / index, 0);
    const randomValue = Math.random() * totalInverseWeight;

    let cumulativeInverseWeight = 0;
    let selectedIndex;

    for (let i = 0; i < indices.length; i++) {
        cumulativeInverseWeight += 1 / indices[i];
        if (randomValue <= cumulativeInverseWeight) {
            selectedIndex = indices[i];
            break;
        }
    }

    return reactantsAcidityMap[selectedIndex];
}

function handleFailedReaction(reaction_map, reactant, substrate) {
    if (!reaction_map[reactant.id]) {
        reaction_map[reactant.id] = [];
    }
    if (!reaction_map[reactant.id].includes(substrate.id)) {
        reaction_map[reactant.id].push(substrate.id);
    }

    if (!reaction_map[substrate.id]) {
        reaction_map[substrate.id] = [];
    }
    if (!reaction_map[substrate.id].includes(reactant.id)) {
        reaction_map[substrate.id].push(reactant.id);
    }
}

function simulateReaction(container, reactant, substrate, reactionFn, logger) {
    const result = reactionFn(container, substrate, reactant, logger);
    return result !== false;
}


const React = (container, logger) =>{

    try {

        const reaction_map = {};
        let no_reactions = false;
        let i = 0;

        do {
            let number_of_reactions = 0;
            // function fetchRandomReactantByCriteria(container, reaction_map, criteriaFn, allow_generic, logger) {
            const reactant = fetchRandomReactantByCriteria(
                container,
                reaction_map,
                (__reactant, logger) => {
                    return true
                },
                true,
                logger
            );

            if (!reactant) {
                break;
            }

            const base_substrate = fetchRandomReactantByCriteria(
                container,
                reaction_map,
                (__reactant, logger) => {
                    return typeof __reactant[0] === 'string' || undefined !== BronstedLoweryBaseAtom(__reactant[0], logger)
                },
                true,
                logger
            );
            const acid_substrate = fetchRandomReactantByCriteria(
                container,
                reaction_map,
                (__reactant, logger) => {
                    return typeof __reactant[0] === 'string' || undefined !== BronstedLoweryAcidAtom(__reactant[0], logger)
                },
                true,
                logger
            );

            let protonated = false;
            let deprotonated = false;
            let reaction_failed = false;

            // Acid-Base Reaction
            if (reactant[0].pKa < acid_substrate[0].pKa) {
                protonated = simulateReaction(container, base_substrate, reactant, Protonate, logger);
                if (!protonated) {
                    reaction_failed = true;
                }
            } else if (acid_substrate[0].pKa < reactant[0].pKa) {
                deprotonated = simulateReaction(container, acid_substrate, reactant, Deprotonate, logger);
                if (!deprotonated) {
                    reaction_failed = true;
                }
            }

            if (protonated || deprotonated) {
                number_of_reactions++;
            } else if (reaction_failed) {
                handleFailedReaction(reaction_map, reactant, base_substrate);
            }

            // Lewis Acid-Base Reaction
            if (!protonated && !deprotonated && (LewisAcidAtom(reactant[0], logger) || LewisBaseAtom(reactant[0], logger))) {
                const lewis_base_substrate = fetchRandomReactantByCriteria(
                    container,
                    reaction_map,
                    (__reactant, logger) => {
                        return  typeof __reactant[0] !== 'string' && undefined !== LewisBaseAtom(__reactant[0], logger)                        
                    },
                    false,
                    logger
                );
                if (lewis_base_substrate) {
                    protonated = simulateReaction(container, lewis_base_substrate, reactant, Protonate, logger);
                    if (protonated) {
                        number_of_reactions++;
                    }
                }
            }

            if (number_of_reactions === 0) {
                no_reactions = true;
            }

            i++;
        } while (!no_reactions && i < container.reactants.length);




        // Remove reactants that have units set to 0
        // @todo Check if this is necessary.
        container.reactants = container.reactants.filter((r) => {
            return r[1] > 0
        })


        console.log('React.js:Reaction done, reactants in container ' + container.renderReactantsAsSmiles(container.reactants))





    } catch(e) {
        logger.log('error', 'React() '+e.stack)
        console.log(e.stack)
        process.exit()
    }



}

module.exports = React