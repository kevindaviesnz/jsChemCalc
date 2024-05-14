/*
REMOVE
A Bronsted Lowery acid base reaction is when a molecule or atom (acid) donates a proton to a molecule or atom (base).
The proton must be bonded to another atom as otherwise we are protonating.

Params in: electron pair donor atom, electron pair donor molecule, proton donor, proton donor molecule, container
Return: container

Example:
HCl + water = Cl- H3O+
 */

/*

GET electron pair from electron pair donor atom
GET proton from proton donor
CALL pushElectronPair using proton, base atom, base atom electron pair, container RETURN container CREATING bond between between proton and base atom
CALL pushElectronPair using acid atom, proton, container RETURN container BREAKING bond between proton and acid atom

            IF there is a reagent proton donor and substrate proton donor
               // @see https://chem.libretexts.org/Bookshelves/General_Chemistry/Book%3A_Structure_and_Reactivity_in_Organic_Biological_and_Inorganic_Chemistry_(Schaller)/I%3A__Chemical_Structure_and_Properties/14%3A_Concepts_of_Acidity/14.09%3A_Proton_Donor_Strength-_pKa
               DETERMINE proton donor and acceptor
            ELSE IF reagent proton donor is NOT false and substrate proton acceptor is NOT false
               SET proton donor to reagent proton donor

            ENDIF

 */
const Constants = require("../Constants")
const Typecheck = require("../Typecheck")
const BronstedLoweryAcidAtom = require('../reflection/BronstedLoweryAcidAtom')
const BronstedLoweryBaseAtom = require('../reflection/BronstedLoweryBaseAtom')
const deprotonate = require('../actions/Deprotonate')
const ContainerView = require('../view/Container')
const LewisBaseAtom = require('../reflection/LewisBaseAtom')
const _ = require('lodash');
const { C } = require("../factories/PeriodicTable")
const MoleculeFactory = require("../factories/MoleculeFactory")
const AtomsFactory = require("../factories/AtomsFactory")
//const FindWeakestAcid = require("../reflection/FindWeakestBronstedLoweryAcidMolecule")

const BronstedLoweryAcidBaseReaction = (container, base_molecule, acid_molecule,  base_atom, acid_atom, logger) => {

    try {

        Typecheck(
            {name: "container", value: container, type: "object"},
            {name: "logger", value: logger, type: "object"},
        )


        if (null === container.getSubstrate()[0]) {
            throw new Error('Something went wrong. Substrate in container should not be null.')            
        }

        if (null === acid_molecule) {
            throw new Error('Something went wrong. Acid molecule should not be null.')            
        }

        if (null === base_molecule) {
            throw new Error('Something went wrong. Base molecule should not be null.')            
        }

        if (null === base_atom) {
            throw new Error('Something went wrong. Base atom should not be null.')            
        }

        if (null === acid_atom) {
            throw new Error('Something went wrong. Acid atom should not be null.')            
        }

        const available_reagents = container.reagents.map((r)=>{
            const reagent_smiles = undefined === r.canonicalSmiles?r.smiles:r.canonicalSmiles(false, r.atoms,logger)
            return typeof r === 'string'? r: reagent_smiles + ' ' + (r.conjugateBase?'conjugate base':'is not conjugate base') + ' ' + (r.conjugateAcid?'conjugate acid':'is not conjugate acid')
        }).join(', ')
        logger.log('debug', ('[BronstedLoweryAcidBaseReaction]] Available reagents: ' + available_reagents).bgYellow)

        let reagent = _.isEqual(container.getSubstrate()[0], base_molecule)?acid_molecule:base_molecule
        
        const reagent_before_reaction = _.cloneDeep(reagent)

        // Here we describe what the base atom does to the target atom.
        // We pass in a copy of the reagent as we do not want the original in the container being overridden.
        // It is the copy of the reagent that will change and afterwards we add it to the container.
        if (_.isEqual(base_molecule, reagent)) {

            // Reagent is attacking the substrate
            const products = deprotonate(_.cloneDeep(reagent), base_atom, acid_molecule, acid_atom, logger)
            const reagent_copy = products.base_molecule
            container.getSubstrate()[0] = products.target_molecule



            const reagent__copy_conjugate_acid = typeof reagent === 'string'?'CA:':MoleculeFactory(
                AtomsFactory(reagent_copy.canonicalSmiles(false, reagent_copy.atoms, logger), logger),
                false,
                true, // is conjugate acid
                logger
            )

            container.getSubstrate()[0] = MoleculeFactory(
                AtomsFactory(container.getSubstrate()[0].canonicalSmiles(false, container.getSubstrate()[0].atoms,logger), logger),
                true, // is conjugate base
                false,
                logger
            )


            container.addReagent(reagent__copy_conjugate_acid, 1, logger)

        } else {

            // Substrate is attacking the reagent
            const substrate_copy = _.cloneDeep(container.getSubstrate()[0])
            const products = deprotonate(container.getSubstrate()[0], base_atom, reagent, acid_atom, logger)


            // Reagent is the acid
            reagent = products.target_molecule
            container.getSubstrate()[0] = products.base_molecule




           const reagent_conjugate_base = typeof reagent === 'string'?'CB:':MoleculeFactory(
            AtomsFactory(reagent.canonicalSmiles, logger),
                true, // is conjugate base
                false,
                logger
            )

            container.getSubstrate()[0] = MoleculeFactory(
                AtomsFactory(container.getSubstrate()[0].canonicalSmiles(false, container.getSubstrate()[0].atoms,logger), logger),
                false,
                true, // is conjugate acid
                logger
            )

            container.addReagent(reagent_conjugate_base, 1, logger)

            const after_reagents = container.reagents.map((r)=>{
                const reagent_smiles = undefined === r.canonicalSmiles?r.smiles:r.canonicalSmiles(false, r.atoms,logger) 
                return typeof r === 'string'? r: reagent_smiles + ' ' + (r.conjugateBase?'conjugate base':'is not conjugate base') + ' ' + (r.conjugateAcid?'conjugate acid':'is not conjugate acid')
            }).join(', ')
            logger.log('debug', ('[BronstedLoweryAcidBaseReaction] Available reagents after reaction: ' + after_reagents).bgYellow.bold)

    
        }
    
        container.removeReagent(reagent_before_reaction, logger)
       
        return true
    
    
    } catch(e) {
        logger.log('error', ('[BronstedLoweryAcidBaseReaction] '+e).bgRed)
        console.log(e.stack)
        process.exit()

    }

}

module.exports = BronstedLoweryAcidBaseReaction
