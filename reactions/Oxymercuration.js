
const MoleculeFactory = require('../factories/MoleculeFactory')
const AtomFactory = require('../factories/AtomFactory')
const LewisAcidAtom = require('../reflection/LewisAcidAtom')
const LewisBaseAtom = require('../reflection/LewisBaseAtom')
const Constants = require("../Constants")
const Typecheck = require('../Typecheck')
const _ = require('lodash');
const MakeCarbocation = require('../actions/MakeCarbocation')
const AtomsFactory = require('../factories/AtomsFactory')
const ExtractOHLeavingGroups = require('../actions/ExtractOHLeavingGroups')
const FindCarbocation = require('../actions/FindCarbocation')
const AddAtom = require('../actions/AddAtom')
const { ConnectionCheckOutFailedEvent } = require('mongodb')

const env = require('../env')
const BondAtomToAtomInSameMolecule = require('../mechanisms/BondAtomToAtomInSameMolecule')
const Deprotonate = require('../mechanisms/Deprotonate')
const Reduce = require('../mechanisms/Reduce')
const LewisAcidBaseReaction = require('./LewisAcidBaseReaction')
const BreakBondInSameMolecule = require('../mechanisms/BreakBondInSameMolecule')

const { Container } = require('winston')
const NucleophillicAttackOnSubstrate = require('../mechanisms/NucleophilicAttackOnSubstrate')

const Oxymercuration = (container, logger) => {

    try {

        // Not correct:  CC([O-])(C(C)(C)[O+])C [hydration] ---> CC(O)(C(C)(C)C)[O+]
        Typecheck(
            {name: "molecule", value: container.getSubstrate()[0], type: "object"},
            {name: "logger", value: logger, type: "object"}
        )

        
    //    container.getSubstrate()[0].atoms.checkBonds('Oxymercuration', logger)

        // Oxymercuration of an alkene
        // @see Org. Chem. for Dum. p201
       // const fg = container.getSubstrate()[0].functionalGroups(),alkene
        if (container.getSubstrate()[0].functionalGroups(logger).alkene.length > 0) {

            // @see https://en.wikipedia.org/wiki/Oxymercuration_reaction (Other applications)
            // @see https://www.chemistrysteps.com/oxymercuration-demercuration/
            // Check we have all the required reagents
            if (false === container.lookUpReagent(
                MoleculeFactory(
                    AtomsFactory('[Hg](O[Ac])O[Ac]', logger),
                    false,
                    false,
                    logger    
                ),
                logger
            )) {
                if (env.debug) {
                    logger.log(env.debug_log, ('[Oxymercuration] No mercuric acetate Hg(OAc)2 reagent found.').bgRed)
                }
                return false
            }

            // Double bond breaks and attacks Hg on reagent
            /*
            Oxymercuration can be fully described in three steps (the whole process is sometimes called deoxymercuration), which is illustrated in stepwise fashion to the right.
             In the first step, the nucleophilic double bond attacks the mercury ion, ejecting an acetoxy group. The electron pair on the mercury ion in turn attacks a carbon 
             on the double bond, forming a mercuronium ion in which the mercury atom bears a positive charge. The electrons in the highest occupied molecular orbital of the 
             double bond are donated to mercury's empty 6s orbital and the electrons in mercury's dxz (or dyz) orbital are donated in the lowest unoccupied molecular orbital 
             of the double bond.

            In the second step, the nucleophilic water molecule attacks the more substituted carbon, liberating the electrons participating in its bond with mercury. 
            The electrons collapse to the mercury ion and neutralizes it. The oxygen in the water molecule now bears a positive charge.

            In the third step, the negatively charged acetoxy ion that was expelled in the first step attacks a hydrogen of the water group, forming the waste product HOAc. 
            The two electrons participating in the bond between oxygen and the attacked hydrogen collapse into the oxygen, neutralizing its charge and creating the final 
            alcohol product.
            */

            const mercuric_acetate = container.reagents[0]
            const mercuric_acetate_acid_atom = LewisAcidAtom(mercuric_acetate, logger) // should be Hg
            //BreakBondInSameMolecule(container, logger)
            // Look for C=C bond where one of the carbons is a terminal carbon
            const double_carbon_bond = _.find(container.getSubstrate()[0].atoms, (atom)=>{
                if ('C' !== atom.atomicSymbol) {
                    return false
                }
                const double_bond = _.find(atom.doubleBonds(container.getSubstrate()[0].atoms, logger), (bond)=>{
                    return bond.atom === 'C' && bond.bond_type === "=" && bond.atom.isTerminalAtom(container.getSubstrate()[0].atoms, logger)
                })
                return undefined !== double_bond 
            })

            if (undefined === double_carbon_bond) {
                if (env.debug) {
                    logger.log(env.debug_log, ('[Oxymercuration] N0 C=C bond found where one of the carbons is a terminal carbon').bgRed)
                }
                return false
            }
            container.getSubstrate()[0].atoms = double_carbon_bond.parent.bondAtomToAtom(double_carbon_bond.atom, false, container.getSubstrate()[0].atoms, logger)

            // Break one of the Hg-O bonds removing one of the OAc groups
            const mercuric_acetate_container = ContainerFactory(null, [], null, logger)
            mercuric_acetate_container.addSubstrate(mercuric_acetate, 1, logger)
            BreakBondInSameMolecule(mercuric_acetate_container, logger)




            // Water attacks carbocation


            // Bond Hg (reagent) to terminal carbon
            /*
            const NucleophillicAttackOnSubstrate = (
    container,
    substrate_electron_pair_acceptor_atom, 
    reagent_electron_pair_donor_atom, 
    reagent_electron_pair_donor_molecule, 
    logger
)*/
            NucleophillicAttackOnSubstrate(container, double_carbon_bond.atom, mercuric_acetate_base_atom, mercuric_acetate)    
            
            // Most substituted carbon - Hg bond breaks forming a carbocation
            BreakBondInSameMolecule(container, logger)
            
            // Water attacks the carbocation
            const water = container.reagents[1]
            const water_base_atom = LewisBaseAtom(water, logger)
            NucleophillicAttackOnSubstrate(container, double_carbon_bond.parent, water_base_atom, water)    

            // OH2 group is deprotonated
            Deprotonate(container, logger)

            // Substrate is reduced, replacing the HgOAc group with hydrogen
            container.getSubstrate()[0].addReagent("NaBH4")
            Reduce(container, logger)

        }

        return true

    } catch(e) {
        logger.log('error', ('[Oxymercuration] '+e).bgRed)
        console.log(e.stack)
        process.exit()
    }

}

module.exports =  Oxymercuration