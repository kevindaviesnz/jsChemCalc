const _ = require('lodash')

const CanDoLewisAcidBase = require('../AI/LewisAcidBase')
const CanDoBronstedLoweryAcidBase = require('../AI/BronstedLoweryAcidBase')

/*
Here we test each reactant against all the other reactants and if a
reaction could happen we save it into an array
*/
const fetchAllPossibleReactions = (container) => {

   const reactantsNoConjugates = fetchReactantsFromContainerWhereReactantIsNotAConjugate(container)
   const all_possible_reactions = reactantsNoConjugates.reduce((reactions, reactant, index)=>{

      const other_reactants = fetchAllOtherReactantsWhereReactantIsNotTheSameAsTheCurrentReactantAndOtherReactantIsNotAConjugate(container)(reactant)

      const possibleReactionsBetweenCurrentReactantAndEachOtherReactant = fetchAllPossibleReactionsBetweenReactantAndEachOtherReactant(reactant, other_reactants)
      return [...reactions, ... possibleReactionsBetweenCurrentReactantAndEachOtherReactant]

   }, []).filter((reaction)=>{
      return undefined !== reaction && 'CA:' !== reaction.reactant[0] && 'CB:' !== reaction.reactant[0] && 'CB:' !== reaction.substrate[0] && 'CA:' !== reaction.substrate[0]
   })


   return all_possible_reactions



        function fetchAllPossibleReactionsBetweenReactantAndEachOtherReactant(reactant, other_reactants) {
             return other_reactants
                .reduce((current_reactant_reactions, other_reactant)=>{
                      if (reactant[0].canonicalSmiles !== other_reactant[0].canonicalSmiles && false === allReactionsUsingCurrentReactantWillFail(reactant, other_reactant)) {
                           current_reactant_reactions.push(
                              {
                                 'solvent':container.solvent,
                                 'reactant':reactant,
                                 'substrate':other_reactant,
                                 'run': undefined // placeholder - gets set later
                              }
                           )  
                      }    
                      return current_reactant_reactions
                },[]
            )
        }

        function generateFunctionToRunReaction(reactant, substrate) {
            // If at least one of the reaction types (eg Lewis acid base) will
            // succeed then return a function that when called will
            // run that reaction. Otherwise return false.
            return true === allReactionsUsingCurrentReactantWillFail(reactant, substrate)?
                undefined:
                function(_container) {
                   if (reactant[0].hasElectrophilicCarbon) {
                       const random_number = Math.floor(Math.random() * 10);
                       return random_number !== 5 &&
                            (
                               LewisAcidBase(_container, substrate, reactant) ||
                               BronstedLoweryAcidBase(_container, reactant, substrate) ||
                               DoOther(_container, reactant, substrate)
                            )
                   } else {
                       return LewisAcidBase(_container, substrate, reactant) ||
                            BronstedLoweryAcidBase(_container, reactant, substrate) ||
                            DoOther(_container, reactant, substrate)
                   }
                }
        }

        function allReactionsUsingCurrentReactantWillFail(reactant, substrate) {
            return false === CanDoBronstedLoweryAcidBase(reactant, substrate) &&
                   false === CanDoLewisAcidBase(reactant, substrate) &&
                   false === CanDoOther(reactant, substrate)

        }

        // Placeholder
        function CanDoOther(reactant, substrate) {
            return false
        }

};

function fetchReactantsFromContainerWhereReactantIsNotAConjugate(container) {
   return container.reactants.filter((reactant)=>{
      return 'CB:' !== reactant[0] && 'CA:' !== reactant[0]
   })

}

function fetchAllOtherReactantsWhereReactantIsNotTheSameAsTheCurrentReactantAndOtherReactantIsNotAConjugate(container) {
   return (reactant) => {
      if ('CB:' === reactant[0] || 'CA:' === reactant[0]) {
         return []
      }
      const other_reactants = container.reactants.filter((r)=>{
         return ('CB:' !== r[0] && 'CA:' !== r[0] && typeof r[0] === "string") || r[0].canonicalSmiles !== reactant[0].canonicalSmiles
      })
      return other_reactants
   }
}


module.exports = fetchAllPossibleReactions