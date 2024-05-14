function ReactionFactory(container, reactant, substrate, solvent, logger) {

    try {

        function tryBronstedLowery(reactant, substrate, savedState, logger) {

            const did_bronstedlowery = false === DoBronstedLoweryAcidBase
               (_.cloneDeep(reactant), _.cloneDeep(substrate), logger)?false:
               BronstedLoweryAcidBase(container, reactant, acid_substrate, logger
            ))? false === DoBronstedLoweryAcidBase
                   (_.cloneDeep(substrate), _.cloneDeep(substrate), logger)?false:
                   BronstedLoweryAcidBase(container, reactant, acid_substrate, logger
            )

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

         function reactant(reactant, substrate, solvent, previousContainer) {
             return {
                'reactant':reactant,
                'substrate':substrate,
                'solvent':solvent,
                'previousContainer':previousContainer,
                'reactionName': determineReactionName(reactant substrate, solvent)
                'container':container
             }
         }

         // Main -------------------------------------------------------------
         if (reactant[0].canonicalSmiles === substrate.canonicalSmiles) {
             return false
         }

         // SAVE container state
         const savedState = saveState(container, reactant, base_substrate, acid_substrate);

         // Note where there is an electrophilic carbon lewis acid base takes priority.
         if (reactant[0].hasElectrophilicCarbon || substrate[0].hasElectrophilicCarbon
         ) {

             const random_number = Math.floor(Math.random() * 10);
             if (random_number !== 5) { // 9 in 10 chance of a lewis base acid reaction
                // Try Lewis and if it fails try other reaction types.
                if (false === tryLewisAcidBase(reactant, substrate, solvent, logger)
                     && false === tryBronstedLowery(reactant, substrate, solvent, logger)
                     && false === doOther() // place holder
                ) {
                    return false
                } else {
                   const [previousContainer, reactant, base_substrate, acid_substrate] = restoreState(savedState);
                   return reactant(reactant, substrate, solvent, previousContainer) {
                }
             } else {
                if (false === tryBronstedLowery(reactant, substrate, solvent, logger)
                     && false === tryBronstedLowery(reactant, substrate, solvent, logger)
                     && false === doOther() // place holder
                ) {
                   return false
                } else {
                   const [previousContainer, reactant, base_substrate, acid_substrate] = restoreState(savedState);
                   return reactant(reactant, substrate, solvent, previousContainer) {
                }
             }

         } else {

             if (false === tryBronstedLowery(reactant, substrate, solvent, logger)
                   && false === tryLewisAcidBase(reactant, substrate, solvent, logger)
                   && false === doOther() // place holder
             ) {
                   return false
             } else {
                const [previousContainer, reactant, base_substrate, acid_substrate] = restoreState(savedState);
                return reactant(reactant, substrate, solvent, previousContainer) {
             }

         }


    } catch(e) {
        console.log('[ReactionFactory] ' + e)
        console.log(e.stack)
        process.exit(3, `[AtomsFactory]  Terminated due to fatal error`)
    }

}

module.exports = ReactionFactory

