const _ = require('lodash')

const IS_BRONSTED_LOWERY_BASE = 1
const IS_BRONSTED_LOWERY_ACID = 2
const IS_LEWIS_BASE = 3
const IS_LEWIS_ACID = 4

const CanDoLewisAcidBase = require('../AI/LewisAcidBase')
const CanDoBronstedLoweryAcidBase = require('../AI/BronstedLoweryAcidBase')
const BronstedLoweryAcidBase = require('../reactions/BronstedLoweryAcidBase')
const LewisAcidBase = require('../reactions/LewisAcidBase')

const determineMostLikelyNextReaction = (possible_reactions) => {


    if (possible_reactions.length === 0) {
        return
    }

    const possibleReactionsCheckedForGenericReactantOrGenericSubstrate
        = fetchReactionsThatHaveGenericReactantOrGenericSubstrate(possible_reactions).length === 0?
            possible_reactions: fetchReactionsThatHaveGenericReactantOrGenericSubstrate(possible_reactions)

    const reactant = determineReactantToUse(possibleReactionsCheckedForGenericReactantOrGenericSubstrate)

    if (noMoreReactions(reactant)) {
        return
    }

    const reactionsThatUseTheReactant = fetchReactionsThatUseTheReactant(possibleReactionsCheckedForGenericReactantOrGenericSubstrate)(reactant)
    const bronstedLoweryBaseSubstrate = determineBronstedLoweryBaseSubstrateToUse(reactant, reactionsThatUseTheReactant);
    const bronstedLoweryAcidSubstrate = determineBronstedLoweryAcidSubstrateToUse(reactant, reactionsThatUseTheReactant);
    const lewisBaseSubstrate = determineLewisBaseSubstrateToUse(reactant, reactionsThatUseTheReactant)
    const lewisAcidSubstrate = determineLewisAcidSubstrateToUse(reactant, reactionsThatUseTheReactant)

    // @todo refactor
    const fetchReactionFn = fetchReaction(reactionsThatUseTheReactant)
    if (reactant[0].hasElectrophilicCarbon) {
         // If the reactant has an electrophilic carbon then it is a Lewis Acid.
         // If the reactant has an electrohilic carbon then we only do a lewis acid base reaction.
         // determineLewisBaseSubstrateToUse() should check if a lewis acid base reaction is possible using the substrate and reactant
         if (undefined !== lewis_base_substrate) {
            const reaction = fetchReactionFn(lewisBaseSubstrate)
            reaction.run = function(_container) {
                LewisAcidBase(_container, lewisBaseSubstrate, reactant)
             }
             return reaction
         }
    } else if (undefined !== bronstedLoweryBaseSubstrate && undefined !== bronsted_lowery_acid_substrate) {
         if (bronsted_lowery_acid_substrate.pKa < bronstedLoweryBaseSubstrate.pKa) {
            const reaction = fetchReactionFn(bronstedLoweryAcidSubstrate)
            reaction.run = function(_container) {
                BronstedLoweryAcidBase(_container, reactant, bronstedLoweryAcidSubstrate)
             }
             return reaction
         } else {
            const reaction = fetchReactionFn(bronstedLoweryBaseSubstrate)
            reaction.run = function(_container) {
                BronstedLoweryAcidBase(_container, bronstedLoweryBaseSubstrate, bronstedLoweryAcidSubstrate)
             }
             return reaction
         }
    } else if (undefined !== bronstedLoweryBaseSubstrate) {
         const reaction = fetchReactionFn(bronstedLoweryBaseSubstrate)
         reaction.run = function(_container) {
            BronstedLoweryAcidBase(_container, bronstedLoweryBaseSubstrate, bronstedLoweryAcidSubstrate)
         }
         return reaction
    } else if(undefined !== bronstedLoweryAcidSubstrate) {
         const reaction = fetchReactionFn(bronstedLoweryAcidSubstrate)
         reaction.run = function(_container) {
            BronstedLoweryAcidBase(_container, reactant, bronstedLoweryAcidSubstrate)
         }
         return reaction
    } else if(undefined !== lewisBaseSubstrate) {
         const reaction = fetchReactionFn(lewisBaseSubstrate)
         reaction.run = function(_container) {
            LewisAcidBase(_container, lewisBaseSubstrate, reactant)
         }
         return reaction
    } else if(undefined !== lewisAcidSubstrate) {
         const reaction = fetchReactionFn(lewisAcidSubstrate)
         reaction.run = function(_container) {
            LewisAcidBase(_container, reactant, lewisAcidSubstrate)
         }
         return reaction
    }


};

function fetchReactionsThatHaveGenericReactantOrGenericSubstrate(reactions) {
    return reactions.filter((reaction)=> {
        return ('B:' === reaction.reactant[0]  || 'A:' === reaction.reactant[0]
            || 'B:' === reaction.substrate[0]  || 'A:' === reaction.substrate[0])
        && ('CB:' !== reaction.reactant[0] && 'CA:' !== reaction.reactant[0]
        && 'CB:' !== reaction.substrate[0] && 'CA:' !== reaction.substrate[0])
    })
}

function fetchReactionsThatUseTheReactant(possibleReactions) {
    return (reactant) =>{
        return possibleReactions.filter((reaction)=> {
            return reaction.reactant[0].canonicalSmiles === reactant[0].canonicalSmiles;
        })
    }
}

function determineReactantToUse (possibleReactions) {

    const electrophilic_reaction = _.find(possibleReactions, (reaction)=>{
        return reaction.reactant[0].hasElectrophilicCarbon
    })
     if (undefined !== electrophilic_reaction) {
         return electrophilic_reaction.reactant
     }

     const reactionsPKaRateMap = generateReactionsPKAMap(possibleReactions)

     // Extract the indices (keys) from the reactants map and convert them to an array of numbers
     const indices = Object.keys(reactionsPKaRateMap).map(Number);

     // Calculate the total weight (sum of indices)
     const totalWeight = indices.reduce((acc, index) => acc + index, 0);

     // Generate a random value between 0 and the total weight
     const randomValue = Math.random() * totalWeight;

     // Initialize variables to keep track of cumulative weight and the selected index
     let cumulativeWeight = 0;
     let selectedIndex;

     // Iterate through the indices to find the selected index
     for (let i = 0; i < indices.length; i++) {
         cumulativeWeight += indices[i];
         if (randomValue <= cumulativeWeight) {
             selectedIndex = indices[i];
             break;
         }
     }

     return reactionsPKaRateMap[selectedIndex].reactant


}

function generateReactionsPKAMap (reactions) {

    const reactions_pKa_map = reactions.reduce((pka_map, reaction) => {
    const reactant_pka = 'A:' === reaction.reactant[0] || 'CB:' === reaction.reactant[0]?0
                :'B:' === reaction.reactant[0] || 'CA:' === reaction.reactant[0]?9999999:
                reaction.reactant[0].pKa
    const index = reactant_pka * reaction.reactant[1] + 100 // we add 100 to avoid negative indexes
    pka_map[index] = reaction // @todo we add
    return pka_map
    }, {})

    return reactions_pKa_map
}

function noMoreReactions (baseOrAcidReactant) {
    return undefined === baseOrAcidReactant
}

function determineBronstedLoweryBaseSubstrateToUse (reactant, reactionsThatUseTheReactant) {

    const reactionsWithTheReactantAsTheAcidAndBronstedLoweryBase = reactionsThatUseTheReactant.filter((reaction)=>{
        return false !== CanDoBronstedLoweryAcidBase(_.cloneDeep(reaction.substrate), _.cloneDeep(reactant))
    })

   const reactionsBasityMap = generateReactionsPKAMap(reactionsWithTheReactantAsTheAcidAndBronstedLoweryBase)

   if (Object.keys(reactionsBasityMap).length === 0) {
       return
   }

   return fetchBaseSubstrateByWeight(reactionsBasityMap)

}

function fetchBaseSubstrateByWeight (reactionsBasityMap) {

    // Extract the indices (keys) from the reactants map and convert them to an array of numbers
    const indices = Object.keys(reactionsBasityMap).map(Number);

    // Calculate the total weight (sum of indices)
    const totalWeight = indices.reduce((acc, index) => acc + index, 0);

    // Generate a random value between 0 and the total weight
    const randomValue = Math.random() * totalWeight;

    // Initialize variables to keep track of cumulative weight and the selected index
    let cumulativeWeight = 0;
    let selectedIndex;

    // Iterate through the indices to find the selected index
    for (let i = 0; i < indices.length; i++) {
        cumulativeWeight += indices[i];
        if (randomValue <= cumulativeWeight) {
            selectedIndex = indices[i];
            break;
        }
    }

    const baseSubstrate = reactionsBasityMap[selectedIndex].substrate

    return baseSubstrate

}

function determineBronstedLoweryAcidSubstrateToUse (reactant, reactionsThatUseTheReactant) {

    const reactionsWithTheReactantAsTheBaseAndBronstedLoweryAcid = reactionsThatUseTheReactant.filter((reaction)=>{
        return false !== CanDoBronstedLoweryAcidBase(_.cloneDeep(reactant), _.cloneDeep(reaction.substrate))
    })


     // If we have a reaction where the acid molecule has an electrophilic carbon then return that reaction
    const electrophilic_reactants = reactionsWithTheReactantAsTheBaseAndBronstedLoweryAcid.filter((reaction)=>{
         return reaction.substrate[0].hasElectrophilicCarbon
     })

     if (electrophilic_reactants.length > 0) {
         return electrophilic_reactants[0].substrate
     }
     const reactionsAcidityMap = generateReactionsPKAMap(reactionsWithTheReactantAsTheBaseAndBronstedLoweryAcid)

     if (0 === Object.keys(reactionsAcidityMap).length) {
         return
     }

     const acidSubstrate = fetchAcidSubstrateByWeight(reactionsAcidityMap)

     return acidSubstrate

}

function fetchAcidSubstrateByWeight(reactionsAcidityMap) {

    // Extract the indices (keys) from the object and convert them to an array of numbers
    const indices = Object.keys(reactionsAcidityMap).map(Number);

    // Calculate the total inverse weight (sum of inverse indices)
    const totalInverseWeight = indices.reduce((acc, index) => acc + 1 / index, 0);

    // Generate a random value between 0 and the total inverse weight
    const randomValue = Math.random() * totalInverseWeight;

    // Initialize variables to keep track of cumulative inverse weight and the selected index
    let cumulativeInverseWeight = 0;
    let selectedIndex;

    // Iterate through the indices to find the selected index
    for (let i = 0; i < indices.length; i++) {
      cumulativeInverseWeight += 1 / indices[i];
      if (randomValue <= cumulativeInverseWeight) {
          selectedIndex = indices[i];
          break;
      }
    }

    const acidSubstrate = reactionsAcidityMap[selectedIndex].substrate

    return acidSubstrate

}


function determineLewisBaseSubstrateToUse (reactant, reactionsThatUseTheReactant) {

    const reactionsWithTheReactantAsTheAcidAndLewisBase = reactionsThatUseTheReactant.filter((reaction)=>{
    return false !== CanDoLewisAcidBase(reaction.substrate, reactant)
    })


    if (0 === reactionsWithTheReactantAsTheAcidAndLewisBase.length) {
        return
    }

    const lewisBaseSubstrate = fetchBaseSubstrateByWeight(reactionsWithTheReactantAsTheAcidAndLewisBase)

    return lewisBaseSubstrate

}

function determineLewisAcidSubstrateToUse(reactant, reactionsThatUseTheReactant) {

    const reactions_WithTheReactantAsTheBaseAndLewisAcid = reactionsThatUseTheReactant.filter((reaction)=>{
        return false !== CanDoLewisAcidBase(reactant, reaction.substrate)
    })

    if (0 === reactions_WithTheReactantAsTheBaseAndLewisAcid.length) {
        return
    }
    const lewisAcidSubstrate = fetchAcidSubstrateByWeight(reactions_WithTheReactantAsTheBaseAndLewisAcid)

    return lewisAcidSubstrate

}

function fetchReaction (reactionsThatUseTheReactant) {

    return (substrate) =>{
        const reaction =  _.find(reactionsThatUseTheReactant, (reaction) => {
            return reaction.substrate[0] === substrate[0]
                    || (typeof reaction.substrate[0] !== "string"
                    && typeof substrate[0] !== "string"
                    && reaction.substrate[0].canonicalSmiles === substrate[0].canonicalSmiles)
            })
            return reaction
    }
}

module.exports = determineMostLikelyNextReaction