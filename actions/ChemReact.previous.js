
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
const BronstedLoweryAcidBase = require('../reactions/BronstedLoweryAcidBase')
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
const DoProtonation = require('../AI/Protonate')
const DoDeprotonation = require('../AI/Deprotonate')
const DoLewisAcidBase = require('../AI/LewisAcidBase')
const DoBronstedLoweryAcidBase = require('../AI/BronstedLoweryAcidBase')

const colors = require('colors');

colors.enable()


const ChemReact = (container, logger) =>{

    try {

        // Bronsted Lowery
        function fetchRandomSubstrateByAcidity(reactant, used_reactants, allow_generic, logger) {

            // Look for generic acid
            if (allow_generic) {
                const generic_acid = _.find(container.reactants, (r)=>{
                    return 'A:' === r[0] || 'CA:' === r[0]
                })

                if (undefined !== generic_acid) {
                    return generic_acid
                }
            }

            const reactive_reactants = container.reactants.filter((r) => {
                return false !== DoBronstedLoweryAcidBase(_.cloneDeep(reactant), _.cloneDeep(r), logger)
            })

            if (0 === reactive_reactants.length) {
                return undefined
            }

            const reactants_filtered = reactive_reactants.filter((r) => {
                // Don't repeat the same failed reaction using exactly the same reactant and substrate
                return undefined === used_reactants[reactant[0].id]
                || -1 === used_reactants[reactant[0].id].indexOf(r[0].id)
            }).filter((r)=>{
                return r[1] > 0
            }).filter((r) => {
                return typeof r[0] === 'string' || undefined !== BronstedLoweryAcidAtom(r[0], reactant[0], logger) // acidMolecule, baseMolecule, logger
            }).filter((r) => {
                return !_.isEqual(reactant[0], r[0])
            })

            const reactants_acidity_map = reactants_filtered.reduce((obj, r) => {
                obj[r[0].pKa * r[1] + 100] = r // @todo we add 100 to avoid negative indexes
                return obj
            }, {})


            // Extract the indices (keys) from the object and convert them to an array of numbers
            const indices = Object.keys(reactants_acidity_map).map(Number);

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

            const acid_substrate = reactants_acidity_map[selectedIndex]

            if (_.isEqual(acid_substrate, reactant)) {
                throw new Error('[React] acid substrate and reactant should not be the same.')
            }

            return acid_substrate

        }

        function fetchRandomSubstrateByLewisAcidity(reactant, reaction_map, logger) {

            const reactive_substrates = container.reactants.filter((substrate)=>{
                return substrate[0].canonicalSmiles !== reactant[0].canonicalSmiles && false !== DoLewisAcidBase(reactant, substrate, logger)
            })

            if (0 === reactive_substrates.length) {
                return undefined
            }


            //             console.log('[ChemReact] Reactants in container ' + container.renderReactantsAsSmiles(container.reactants).toString().bgGreen)
            console.log('[ChemReact] fetchRandomSubstrateByLewisAcidity ' + reactant[0].canonicalSmiles)
            console.log(container.renderReactantsAsSmiles(reactive_substrates).toString().bgBlue)
            // @todo
            // For now assume that if one of the reactants has a electrophilic carbon
            // then that will be the reactant selected.
            const electrophilic_reactants = reactive_substrates.filter((r)=>{
                return r.hasElectrophilicCarbon
            })

            if (electrophilic_reactants.length > 0) {
                console.log(`[ChemReact] Got ${electrophilic_reactants[0][0].canonicalSmiles} as lewis acid`)
                return electrophilic_reactants[0]
            }

            const reactants_filtered = reactive_substrates.filter((r) => {
                // Don't repeat the same failed reaction using exactly the same reactant and substrate
                return undefined === reaction_map[reactant[0].id]
                || -1 === reaction_map[reactant[0].id].indexOf(r[0].id)
            }).filter((r)=>{
                return r[1] > 0
            }).filter((r) => {
                return typeof r[0] !== 'string' && undefined !== LewisAcidAtom(r[0], logger)
            }).filter((r) => {
                return !_.isEqual(reactant[0], r[0])
            })

            const reactants_acidity_map = reactants_filtered.reduce((obj, r) => {
                // lewis acids that are carbocations are highly reactive.
                // Note: pKa is irrelevant with regards to lewis acids and bases
                // @todo - this is basically a placeholder until reactivity is done.
                const index = r[1] * r[0].hasElectrophilicCarbon?(Math.floor(Math.random() * 10) !==5?100:1):1
                obj[index + r[0].atoms.length] = r // @todo we add 100 to avoid negative indexes
                return obj
            }, {})


            // Extract the indices (keys) from the object and convert them to an array of numbers
            const indices = Object.keys(reactants_acidity_map).map(Number);

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

            return reactants_acidity_map[selectedIndex]
            const acid_substrate = reactants_acidity_map[selectedIndex]
            if (_.isEqual(acid_substrate, reactant)) {
                throw new Error('[React] acid substrate and reactant should not be the same.')
            }

            return acid_substrate


        }

        // Bronsted Lowery
        function fetchRandomSubstrateByBasity(reactant, used_reactants, allow_generic, logger) {

            // Look for generic base
            const generic_base = _.find(container.reactants, (r)=>{
                return 'B:' === r[0] || 'CB:' === r[0]
            })

            if (undefined !== generic_base) {
                return generic_base
            }


            const reactive_reactants = container.reactants.filter((r) => {
                // Add equilibirum check
                //
                return undefined === used_reactants[r[0].id] && r[0].canonicalSmiles !== reactant[0].canonicalSmiles && false !== DoBronstedLoweryAcidBase(_.cloneDeep(r), _.cloneDeep(reactant), logger)
              //  return false !== DoProtonation(_.cloneDeep(r), _.cloneDeep(reactant), logger)
              //  && bronstedLoweryProtonationEquilibriumCheck(null, reactant, null, logger)
            })

            const reactants_filtered = reactive_reactants.filter((r) => {
                // Don't repeat the same failed reaction using exactly the same reactant and substrate
                return  undefined === used_reactants[reactant[0].id]
                || -1 === used_reactants[reactant[0].id].indexOf(r[0].id)
            }).filter((r)=>{
                return r[1] > 0
            }).filter((r) => {
                return typeof r[0] === 'string' || undefined !== BronstedLoweryBaseAtom(r[0], reactant[0], logger) // baseMolecule, acidMolecule, logger
            }).filter((r) => {
                return !_.isEqual(reactant[0], r[0])
            })

            const reactants_basity_map = reactants_filtered.reduce((obj, r) => {
                obj[r[0].pKa * r[1] + 100] = r // @todo we add 100 to avoid negative indexes
                return obj
            }, {})

            // Extract the indices (keys) from the reactants map and convert them to an array of numbers
            const indices = Object.keys(reactants_basity_map).map(Number);

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

            const base_substrate = reactants_basity_map[selectedIndex]
            if (_.isEqual(base_substrate, reactant)) {
                throw new Error('[React] base substrate and reactant should not be the same.')
            }

            return base_substrate
        }

        // @todo repeated code
        function fetchRandomSubstrateByLewisBasity(reactant, reaction_map, logger) {

            const reactive_substrates = container.reactants.filter((substrate)=>{
                return substrate[0].canonicalSmiles !== reactant[0].canonicalSmiles && false !== DoLewisAcidBase(substrate, reactant, logger)
            })

            if (0 === reactive_substrates.length) {
                return undefined
            }

            const reactants_filtered = container.reactants.filter((r) => {
                // Don't repeat the same failed reaction using exactly the same reactant and substrate
                return undefined === reaction_map[reactant[0].id]
                || -1 === reaction_map[reactant[0].id].indexOf(r[0].id)
            }).filter((r)=>{
                return r[1] > 0
            }).filter((r) => {
                return  typeof r[0] !== 'string' && undefined !== LewisBaseAtom(r[0], logger)
            }).filter((r) => {
                return !_.isEqual(reactant[0], r[0])
            })

            const reactants_basity_map = reactants_filtered.reduce((obj, r) => {
                // Note: pKa is irrelevant for lewis acids and bases
                // @todo - this is basically a placeholder until reactivity is done.
                obj[r[1] + r[0].atoms.length] = r
                return obj
            }, {})

            // Extract the indices (keys) from the reactants map and convert them to an array of numbers
            const indices = Object.keys(reactants_basity_map).map(Number);

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

            const base_substrate = reactants_basity_map[selectedIndex]
            if (_.isEqual(base_substrate, reactant)) {
                throw new Error('[React] base substrate and reactant should not be the same.')
            }

            return base_substrate

        }

        function fetchRandomReactantByReactionRate(used_reactants, logger) {


                   const reactive_reactants = container.reactants.filter((r) => {
                       return undefined === used_reactants[r[0].id]
                   }).filter((r)=>{
                       const possible_substrate_acid = _.cloneDeep(fetchRandomSubstrateByAcidity(r, {}, true, logger))
                       const possible_substrate_base = _.cloneDeep(fetchRandomSubstrateByBasity(r, {}, true, logger))
                       const possible_lewis_acid = _.cloneDeep(fetchRandomSubstrateByLewisAcidity(r, {}, logger))
                       const possible_lewis_base = _.cloneDeep(fetchRandomSubstrateByLewisAcidity(_.cloneDeep(r), {}, logger))
                       return false !== possible_substrate_acid || false !== possible_substrate_base || false !== possible_lewis_acid || false !== possible_lewis_base
                   })

                   if (reactive_reactants.length === 0) {
                   /*
                       [ChemReact] NO REACTANCTS FOUND

                         at fetchRandomReactantByReactionRate (actions/ChemReact.js:298:25)

                     console.log
                       [ChemReact] 2 Reactants in container CCC(=[O+])C{1},[O-][S](=O)(=O)O{1},CN{1}
                   */
                       console.log('[ChemReact] NO REACTANCTS FOUND')
                       console.log('[ChemReact] 2 Reactants in container ' + container.renderReactantsAsSmiles(container.reactants).toString().bgGreen)
                       return
                   }

                   // @todo
                   // {"level":"info","message":"Got reactant CCCC(=[O+])C base substrate none acid substrate none lewis base substrate none,lewis acid substrate none"}
                   // For now assume that if one of the reactants has a electrophilic carbon
                   // then that will be the reactant selected.
                   const electrophilic_reactants = reactive_reactants.filter((r)=>{
                       return r[0].hasElectrophilicCarbon
                   })

                   let reactant = null

                   if (electrophilic_reactants.length > 0) {
                       reactant = electrophilic_reactants[0]
                       if (false === DoProtonation(
                                   _.cloneDeep(fetchRandomSubstrateByAcidity(reactant, {}, true, logger)),
                                   _.cloneDeep(reactant), logger
                                )
                                && false == DoDeprotonation(
                                   _.cloneDeep(fetchRandomSubstrateByBasity(reactant, {}, true, logger)),
                                   _.cloneDeep(reactant), logger)
                               && false === DoLewisAcidBase(
                                   _.cloneDeep(reactant),
                                   _.cloneDeep(fetchRandomSubstrateByLewisAcidity(reactant, {}, logger)),
                                   logger
                               ) && false ===  DoLewisAcidBase(
                                   _.cloneDeep(fetchRandomSubstrateByLewisAcidity(reactant, {}, logger)),
                                   _.cloneDeep(reactant),
                                   logger
                               )){
                         //  unreactive_reactants.push(reactant)
                         //  reactant = fetchRandomReactantByReactionRate(unreactive_reactants)
                       } else {
                          return reactant
                       }
                   } else {


                       const reactants_reaction_rate_map = reactive_reactants.reduce((obj, reactant) => {
                           // reactants that are carbocations are highly reactive.
                           // @todo this is basically a placeholder until reactivity is done.
                           const index = Math.random() * 100 * reactant[0].hasElectrophilicCarbon?(Math.floor(Math.random() * 10)!==5?100:1):1
                           obj[index] = reactant // @todo need to calculate reaction rate and use this as the index
                           return obj
                       }, {})

                       // Extract the indices (keys) from the reactants map and convert them to an array of numbers
                       const indices = Object.keys(reactants_reaction_rate_map).map(Number);

                       // @todo repeated code
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

                       // At this point we have filtered out all reactants that are not reactive.
                       return reactants_reaction_rate_map[selectedIndex]

                   }

         }

        function logFailedReaction(reaction_map, reactant, substrate ) {
            if (undefined === reactant || undefined === substrate) {
                return reaction_map
            }
            if (undefined === reaction_map[reactant[0].id]) {
                reaction_map[reactant[0].id] = []
            }
            reaction_map[reactant[0].id].push(substrate[0].id)
            // Also do the reverse
            if (undefined === reaction_map[substrate[0].id]) {
                reaction_map[substrate[0].id] = []
            }
            if (-1 === reaction_map[substrate[0].id].indexOf(reactant[0].id)) {
                reaction_map[substrate[0].id].push(reactant[0].id)
            }
            return reaction_map
        }

        // Function to save the state
        function saveState(...args) {
           return function () {
             return args;
           };
        }

        // Function to restore the state
        function restoreState(savedState) {
           return savedState();
        }

        function bronstedLoweryProtonationEquilibriumCheck(savedState, reactant, number_of_reactions, logger) {
            // Protonation protonates the substrate (base) using the reactant (acid)
            // Next we determine of the conjugate acid / base is already in the container.If they
            // are we determine the chance of protonation happening by calculating the equilibrium constant.
            const [container_saved, reactant_saved, base_substrate_saved] = restoreState(savedState);
            const conjugate_acid_of_substrate = ConjugateAcid(_.cloneDeep(base_substrate_saved[0]), _.cloneDeep(reactant_saved[0]), logger) // baseMolecule, acidMolecule, logger
            const conjugate_base_of_reactant = ConjugateBase(_.cloneDeep(reactant_saved[0]), logger) // acidMolecule, logger
            if(false === container_saved.lookUpReactant(conjugate_acid_of_substrate, logger) && false === container_saved.lookUpReactant(conjugate_base_of_reactant, logger)){
                number_of_reactions++
                return true
            } else {
               // Here we have the conjugate base and acid already in the container.
               // Next we calculate the equilibrum constant. This tells us at what point the reactants and products will be
               // at equilibrium (the conjugate acid and conjugate base are the products of reacting the reactant
               // with the substrate).
               // We also need to determine whether products are favoured over the reactants or vice versa. In an acid base reaction the position
               // of equilibrium always favours the stronger acid and stronger base to form the weaker acid and weaker base. This means
               // that if the reactants are stronger than the products then they products are favoured, and vice versa.
               // Note that roughly speaking the same thing applies if we have stronger acid + weaker base or weaker acid and
               // stronger base. @todo For now we will just say the position of equilibrium favours the side with the weaker acid.
               // Calculate the equilibrium constant
               const equilibrium_constant = EquilibriumConstant(reactant[0], conjugate_acid_of_substrate) //30199.51720402019
               // Here the reactant before protonation is a strong acid so the products are favoured.
               const products_favoured = reactant[0].pKa < conjugate_base_of_reactant.pKa // reactant is an acid
               // Example:
               // When acetic acid is reacted with ammonia, products are favoured. The equilibrium constant is 30199.51720402019
               // meaning that if we started out with equal amounts of acetic acid and ammonia the reaction would
               // prefer the products 30199.51720402019 to 1.
               // Here if the products are favoured we get the ratio of products over reactants and
               // if reactants are favoured the ratio of reactants over products.
               // We do this to determine whether the reactants and products are already at
               // equilibrium.
               const units_of_conjugate_base_of_reactant = container.numberOfUnitsOfReactant(conjugate_base_of_reactant)
               // Ratio of products over reactants
               const ratio = units_of_conjugate_base_of_reactant / reactant[1] // product / reactant

                if (products_favoured && ratio >= 1) {
                    return true
                }

               // If the ratio is less than the equilibrium constant ratio then we know that the reaction
               // has not reached equilibrium. We use the ratio to determine the chance of protonation occurring
                if (
                    (products_favoured && ratio < 1) ||
                    ratio < equilibrium_constant
                ) {
                    // We get a random number between 0 and the equilibrum to simulate the chance of
                    // a reaction occuring (products favoured) or no reaction (reactants favoured.)
                    const random_number = Math.floor(Math.random() * equilibrium_constant + 1);
                    if (products_favoured) {
                        // High chance of reaction occuring
                        if (random_number != equilibrium_constant) {
                            // Protonation would have happened
                            number_of_reactions++
                            return true
                        } else {
                            // Protonation would not have happened due to equilibrium.
                            // Reset container etc

                            // Log failed protonation reaction ie in any case the reactant will not deprotonate the substrate.
                           logFailedReaction(reaction_map, reactant, base_substrate)

                            return false
                        }
                    } else {
                        // Low chance of reaction occuring
                        if (random_number === equilibrium_constant) {
                            // Protonation still happened despite there being a low chance.
                            number_of_reactions++
                            return true
                        } else {
                            // Protonation would not have happened due to equilibrium.
                            // Reset container etc
                            return false
                        }
                    }
                }

            }
        }

        function bronstedLoweryDeprotonationEquilibriumCheck(savedState, acid_substrate, number_of_reactions, logger) {
            const [container_saved, reactant_saved, acid_substrate_saved] = restoreState(savedState);
            const conjugate_acid_of_reactant = ConjugateAcid(_.cloneDeep(reactant_saved[0]), acid_substrate, logger) // baseMolecule, acidMolecule, logger
            const conjugate_base_of_substrate = ConjugateBase(_.cloneDeep(acid_substrate_saved[0]), logger)
            if (false === container_saved.lookUpReactant(conjugate_acid_of_reactant, logger) && false === container_saved.lookUpReactant(conjugate_base_of_substrate, logger)) {
              number_of_reactions++
              return true
            } else {
                const equilibrium_constant = EquilibriumConstant(acid_substrate[0], conjugate_acid_of_reactant) //30199.51720402019
                const products_favoured = acid_substrate[0].pKa < conjugate_acid_of_reactant.pKa
                // Ratio of products over reactants
                const units_of_conjugate_acid_of_reactant = container.numberOfUnitsOfReactant(conjugate_acid_of_reactant)
                const ratio = units_of_conjugate_acid_of_reactant / acid_substrate[1] // product / reactant
                if (
                    (products_favoured && ratio < 1) ||
                    ratio < equilibrium_constant
                ) {
                    // We get a random number between 0 and the equilibrum to simulate the chance of
                    // a reaction occuring (products favoured) or no reaction (reactants favoured.)
                    const random_number = Math.floor(Math.random() * equilibrium_constant + 1);
                    if (products_favoured) {
                        // High chance of reaction occuring
                        if (random_number != equilibrium_constant) {
                            number_of_reactions++
                            return true
                        } else {
                            // Log failed deprotonation reaction ie in any case the reactant will not deprotonate the substrate.
                            logFailedReaction(reaction_map, reactant, acid_substrate)
                            return false
                        }
                    } else {
                        // Low chance of reaction occuring
                        if (random_number === equilibrium_constant) {
                            number_of_reactions++
                            return true
                        } else {
                            // Log failed deprotonation reaction ie in any case the reactant will not deprotonate the substrate.
                            logFailedReaction(reaction_map, reactant, acid_substrate)
                            return false
                        }
                    }
                }
            }
        }

        // Remoce
        function tryBronstedLoweryProtonation(container, reactant, base_substrate, reaction_map, logger) {
            const protonated = undefined === base_substrate?false:(false === DoProtonation(_.cloneDeep(base_substrate), _.cloneDeep(reactant), logger)?false:Protonate(container, base_substrate, reactant, logger))
            if (false === protonated) {
                return false
            }
            return true
        }

        // Remove
        function tryBronstedLoweryDeprotonation(container, reactant, acid_substrate, reactant_map, logger) {
            const deprotonated = undefined === acid_substrate?false:(false === DoDeprotonation(_.cloneDeep(acid_substrate), _.cloneDeep(reactant), logger)?false:Deprotonate(container, acid_substrate, reactant, logger))
            if (false === deprotonated) {
                return false
            }
            return true
        }

        function tryBronstedLowery(reactant, base_substrate, acid_substrate, savedState, logger) {

            let did_bronstedlowery = false
            const previous_container = _.cloneDeep(container)

            if (undefined !== base_substrate) {
                did_bronstedlowery = undefined === base_substrate?false:
                    (false===DoBronstedLoweryAcidBase(_.cloneDeep(base_substrate), _.cloneDeep(reactant), logger)?false:BronstedLoweryAcidBase(container, base_substrate, reactant, logger))
            } else if(undefined !== acid_substrate) {
                did_bronstedlowery = undefined === acid_substrate?false:
                    (false===DoBronstedLoweryAcidBase(_.cloneDeep(reactant), _.cloneDeep(acid_substrate), logger)?false:BronstedLoweryAcidBase(container, reactant, acid_substrate, logger))
            }

            if (false !== did_bronstedlowery) {
                // We now need to check if there was actually any changes to the reactants (
                // eg no changes will happen if the reactants and products are already at equilibrium)
                const no_change = container.reactantsAreTheSame(previous_container, logger)
                if (no_change) {
                    const [container, reactant, base_substrate, acid_substrate] = restoreState(savedState);
                    return false
                } else {
                    return true
                }
            }

            return false

        }

        function tryLewisAcidBase(reactant, lewis_base_substrate, lewis_acid_substrate, savedState, logger) {

            // Lewis acid base
            // Here we randomly determined that a lewis base reaction would have
            // most likely occured or, determined that Bronsted Lowery
            // will fail, and in either case not because of equilibrium.
            if (undefined === lewis_acid_substrate && undefined ===lewis_base_substrate) {
                return false
            } else {
                // Try lewis base reaction where the substrate is the base molecule and the reactant is the acid molecule.
                const substrate_reactant_combined_molecule = undefined !== lewis_base_substrate?
                    (false === DoLewisAcidBase(lewis_base_substrate, reactant, logger)?false:LewisAcidBase(container, lewis_base_substrate, reactant, logger))
                    :false
                // Note: A mechanism function should all have the same signature: container, reactant, substrate, logger.let combined_molecule = undefined !== lewis_base_substrate?LewisAcidBase(container, lewis_base_substrate, reactant, logger):false
                // @todo combined_molecule should either an object or undefined,
                if (false !== substrate_reactant_combined_molecule) { // reactant is acid, substrate is base
                    Stabilise(substrate_reactant_combined_molecule[0], 0, logger)
                    return true
                } else {
                   // Try lewis base reaction where the substrate is the acid molecule and the reactant is the base molecule.
                   const reactant_substrate_combined_molecule = undefined !==lewis_acid_substrate?
                       (false===DoLewisAcidBase(reactant, lewis_acid_substrate, logger)?false:LewisAcidBase(container, reactant, lewis_acid_substrate, logger)):
                       false
                   if (false !== reactant_substrate_combined_molecule) {
                       Stabilise(reactant_substrate_combined_molecule [0], 0, logger)
                       number_of_reactions++
                   } else {
                       const [container, reactant, base_substrate, acid_substrate] = restoreState(savedState);
                       return false
                   }
                }
            }

        }

        function doOther() {
            // Tried prontonate, deprotonate, lewis acid base
            // Try other reactions
            return false
        }

        function logUsedReactant(used_reactants, reactant, base_substrate, acid_substrate) {
           // logFailedReaction(reaction_map, reactant, acid_substrate, logger)
            //logFailedReaction(reaction_map, reactant, base_substrate, logger)
            if (undefined === used_reactants[reactant[0].id]) {
                used_reactants[reactant[0].id] = []
            }
            if (undefined !== base_substrate) {
                used_reactants[reactant[0].id].push(base_substrate[0].id)
            }
            if (undefined !== acid_substrate) {
                used_reactants[reactant[0].id].push(acid_substrate[0].id)
            }
        }

        function reactReactantWithSubstrate(reactant, container, used_reactants, logger) {


            //	console.log('Round: ' + round +' , Starting reactants in container ' + container.renderReactantsAsSmiles(starting_reactants))
            logger.info('[ChemReact] Reactants in container ' + container.renderReactantsAsSmiles(container.reactants).toString().bgGreen)
            console.log('[ChemReact] Reactants in container ' + container.renderReactantsAsSmiles(container.reactants).toString().bgGreen)

            console.log(`[ChemReact] Got ${reactant[0].canonicalSmiles} as reactant`)


           // if (undefined !== reactant) {

                const base_substrate = fetchRandomSubstrateByBasity(reactant, used_reactants, true, logger)
                if (_.isEqual(base_substrate, reactant)) {
                    throw new Error('[React] base substrate and reactant should not be the same.')
                }

                const acid_substrate = fetchRandomSubstrateByAcidity(reactant, used_reactants, true, logger)
                if (_.isEqual(base_substrate, reactant)) {
                    throw new Error('[React] acid substrate and reactant should not be the same.')
                }

                const lewis_base_substrate = (fetchRandomSubstrateByLewisBasity(reactant, used_reactants, logger))
                if (_.isEqual(lewis_base_substrate, reactant)) {
                    throw new Error('[React] lewis base substrate and reactant should not be the same.')
                }

                const lewis_acid_substrate =(fetchRandomSubstrateByLewisAcidity(reactant, used_reactants, logger))
                if (_.isEqual(lewis_acid_substrate, reactant)) {
                    throw new Error('[React] lewis acid substrate and reactant should not be the same.')
                }

                logger.info(`[ChemReact] Got reactant ${reactant[0].canonicalSmiles} base substrate ${undefined !== base_substrate?base_substrate[0].canonicalSmiles:'none'} acid substrate ${undefined !== acid_substrate?acid_substrate[0].canonicalSmiles:'none'} lewis base substrate ${undefined !== lewis_base_substrate?lewis_base_substrate[0].canonicalSmiles:'none'},lewis acid substrate ${undefined !== lewis_acid_substrate?lewis_acid_substrate[0].canonicalSmiles:'none'}`)

                if (undefined === base_substrate && undefined === acid_substrate && undefined === lewis_base_substrate && undefined === lewis_acid_substrate) {
                     used_reactants[reactant[0].id] = -1
                }

                // Note that water can act as both a base and an acid.
                // Reactant is an acid
                /*
                The reaction between the conjugate base of sulfuric acid ([HSO4]^-) and CCCC-C would likely involve [HSO4]^- acting as a Brønsted-Lowry acid and
                donating a proton (H+) to CCCC-C, which acts as a Brønsted-Lowry base. This reaction is a protonation reaction.
                */
                // If any of the reactants is a carbocation then we give it a low chance
                // of a bronsted lowery
                if (reactant[0].hasElectrophilicCarbon ||
                       (undefined !== lewis_acid_substrate && lewis_acid_substrate[0].hasElectrophilicCarbon) ||
                       (undefined !== lewis_base_substrate && lewis_base_substrate[0].hasElectrophilicCarbon)
                   ) {
                       const savedState = saveState(container, reactant, base_substrate, acid_substrate);
                       const random_number = Math.floor(Math.random() * 10);
                        if (random_number !== 5) { // 9 in 10 chance of a lewis base acid reaction
                          // Try Lewis and if it fails try other reaction types.
                          if (false === tryLewisAcidBase(reactant, lewis_base_substrate, lewis_acid_substrate, savedState, logger)
                              && false === tryBronstedLowery(reactant, base_substrate, acid_substrate, savedState, logger)
                              && false === doOther() // place holder
                          ) {
                             const [container, reactant, base_substrate, acid_substrate] = restoreState(savedState);
                             logUsedReactant(used_reactants, reactant, base_substrate, acid_substrate)
                             return false
                          }
                       } else {
                          // Try Bronsted but if it failes then try Lewis, and if that fails try other.
                          if (false === tryBronstedLowery(reactant, base_substrate, acid_substrate, savedState, logger)
                             && false ===  tryLewisAcidBase(reactant, lewis_base_substrate, lewis_acid_substrate, savedState, logger)
                             && false === doOther() // place holder
                          ) {
                             const [container, reactant, base_substrate, acid_substrate] = restoreState(savedState);
                             logUsedReactant(used_reactants, reactant, base_substrate, acid_substrate)
                             return false
                          }
                     }

                 } else {

                     // Try Bronsted but if it fails then try Lewis, and if that fails try other.
                     const savedState = saveState(container, reactant, base_substrate, acid_substrate);
                     // Try Bronsted but if it failes then try Lewis, and if that fails try other.
                     if (false === tryBronstedLowery(reactant, base_substrate, acid_substrate, savedState, logger)
                         && false ===  tryLewisAcidBase(reactant, lewis_base_substrate, lewis_acid_substrate, savedState, logger)
                         && false === doOther() // place holder
                     ) {
                         const [container, reactant, base_substrate, acid_substrate] = restoreState(savedState);
                         logUsedReactant(used_reactants, reactant, base_substrate, acid_substrate)
                         return false
                     }

                 }

          //  }

            return true

        }

        const react = function() {

            const used_reactants = {}

            if (container.reactants.length > 1) {
                const initial_reactant = container.reactants[container.reactants.length-1]
                reactReactantWithSubstrate(initial_reactant, container, used_reactants, logger)
                console.log(`Finished reacting initial_reactant ${initial_reactant[0].canonicalSmiles}`)
            } else {
                return
            }

            let reaction = true

            do {

                // Remove any reactants with 0 units
                container.reactants = container.reactants.filter((reactant)=>{
                    return reactant[1] > 0
                })

                const reactant = fetchRandomReactantByReactionRate(used_reactants, logger)
                if (undefined !== reactant) {
                    reaction =container.reactants.length >1?reactReactantWithSubstrate(reactant, container, used_reactants, logger):false
                } else {
                    reaction = false
                }

                i++

             } while (false === reaction && i < 10)

            // Remove reactants that have units set to 0
            // @todo Check if this is necessary.
            container.reactants = container.reactants.filter((r) => {
                return r[1] > 0
            })
        }

        return {
            'react': react,
            'reactReactantWithSubstrate': reactReactantWithSubstrate,
            'fetchRandomSubstrateByLewisAcidity': fetchRandomSubstrateByLewisAcidity
        }


    } catch(e) {
        logger.log('error', 'React() '+e.stack)
        console.log(e.stack)
        process.exit(1, `[ChemReact] Fatal error.`)
    }



}

module.exports = ChemReact