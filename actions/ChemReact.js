const _ = require('lodash');
const { Container } = require('winston');
const AI = require('../AI/AI');
const FormatAs = require('../factories/FormatAs');
const Typecheck = require('../Typecheck');
const LewisAcidAtom = require('../reflection/LewisAcidAtom');
const LewisBaseAtom = require('../reflection/LewisBaseAtom');
const LewisAcidBase = require('../reactions/LewisAcidBase');
const BronstedLoweryAcidBase = require('../reactions/BronstedLoweryAcidBase');
const Protonate = require('../mechanisms/Protonate');
const Deprotonate = require('../mechanisms/Deprotonate');
const SN2 = require('../reactions/SN2');
const SN1 = require('../reactions/SN1');
const E1 = require('../reactions/E1');
const E2 = require('../reactions/E2');
const AcidBase = require('../reactions/AcidBase');
const Stabilise = require('../actions/Stabilise');
const MoleculeFactory = require('../factories/MoleculeFactory');
const BronstedLoweryBaseAtom = require('../reflection/BronstedLoweryBaseAtom');
const BronstedLoweryAcidAtom = require('../reflection/BronstedLoweryAcidAtom');
const ConjugateBase = require('../reflection/ConjugateBase');
const ConjugateAcid = require('../reflection/ConjugateAcid');
const EquilibriumConstant = require('../reflection/EquilibriumConstant');
const FindStrongestLewisBaseMolecule = require('../reflection/FindStrongestLewisBaseMolecule');
const DoProtonation = require('../AI/Protonate');
const DoDeprotonation = require('../AI/Deprotonate');
const DoLewisAcidBase = require('../AI/LewisAcidBase');
const DoBronstedLoweryAcidBase = require('../AI/BronstedLoweryAcidBase');
const fetchAllPossibleReactions = require('../reflection/fetchAllPossibleReactions')
const determineMostLikelyNextReaction = require('../reflection/determineMostLikelyNextReaction')
const colors = require('colors');

colors.enable();

// Change to modelChemicalReaction
const ChemReact = (container) => {

        const determineWhetherContainerIsStableIsTrue = function(last_reaction) {
            return (reaction) => {
                return undefined !== last_reaction && last_reaction.reactant[0].canonicalSmiles === reaction.reactant[0].canonicalSmiles && last_reaction.substrate[0].canonicalSmiles === reaction.substrate[0].canonicalSmiles
            }
        }   

        const getReaction = function(most_likely_next_reaction) {
            return () => {
                return most_likely_next_reaction
            }
        }
   
        const recursivelyRunReactionsUntilContainerIsStable = function(last_reaction) {

            const possible_reactions_given_current_container_state = fetchAllPossibleReactions(container);

            if (possible_reactions_given_current_container_state.length > 0) {
                const reaction = determineMostLikelyNextReaction(possible_reactions_given_current_container_state);
                if (undefined === reaction || determineWhetherContainerIsStableIsTrue(last_reaction)(reaction)) {
                    return container
                }
                reaction.run(container)
                recursivelyRunReactionsUntilContainerIsStable(reaction)
            }

        }

        recursivelyRunReactionsUntilContainerIsStable()

        return;





}




module.exports = ChemReact;
