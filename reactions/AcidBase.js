const Set = require('../Set')
const Constants = require("../Constants")
const { loggers } = require('winston')
const { P } = require('../factories/PeriodicTable')
const _ = require('lodash');

const Typecheck = require('../Typecheck');
const FindStrongestBronstedLoweryBaseMolecule = require('../reflection/FindStrongestBronstedLoweryBaseMolecule');
const FindStrongestBronstedLoweryAcidMolecule = require('../reflection/FindStrongestBronstedLoweryAcidMolecule');
const LewisAcidBaseReaction = require('./LewisAcidBase');
const LewisAcidAtom = require('../reflection/LewisAcidAtom')
const LewisBaseAtom = require('../reflection/LewisBaseAtom')
const BronstedLoweryBaseAtom = require('../reflection/BronstedLoweryBaseAtom')
const BronstedLoweryAcidAtom = require('../reflection/BronstedLoweryAcidAtom')
const BronstedLoweryAcidBaseReaction = require('../reactions/BronstedLoweryAcidBaseReaction')

const colors = require('colors');
const MoleculeFactory = require('../factories/MoleculeFactory');
const AtomsFactory = require('../factories/AtomsFactory');
const Deprotonate = require('../actions/Deprotonate');
const MDeprotonate = require('../mechanisms/Deprotonate');
const ExtractOHLeavingGroups = require('../actions/ExtractOHLeavingGroups');

colors.enable()

const AcidBase = (container, logger) => {


    let reagent_as_base = null
    let reagent_as_acid = null

    let reagent_is_base = false
    let reagent_is_acid = false

    try {


        Typecheck(
            {name: "container", value: container, type: "object"},
            {name: "container.getSubstrate()[0]", value: container.getSubstrate()[0], type: "object"},
            {name: "logger", value: logger, type: "object"},
        )

        if (null === container.getSubstrate()[0]) {
            throw new Error('Something went wrong. Substrate in container should not be null.')            
        }
    
        const available_reagents = container.reagents.map((r)=>{
            const reagent_smiles = r.canonicalSmiles(false, r.atoms, logger)
            return reagent_smiles
        }).join(', ')
        logger.log('debug', ('[AcidBase]] Available reagents: ' + available_reagents).bgYellow)

        // No reagent so return false
        if (0 === container.reagents.length) {
            logger.log('debug', 'No reagents found so not continuing with reaction'.bgRed)
            return false
        }

        // Determine if we are going to use the reagent as the base or the reagent as the acid.
        reagent_as_base = FindStrongestBronstedLoweryBaseMolecule(container.reagents, logger)
        reagent_as_acid = FindStrongestBronstedLoweryAcidMolecule(container.reagents, logger)

        // Reagent is A: or CA: so use reagent as the acid molecule.
        if ('A:' === reagent_as_acid || 'CA:' === reagent_as_acid || 'A+:' === reagent_as_acid) {
            logger.log('debug', ('[AcidBase] Reagent is A: or CA: so setting reagent as base to nothing').bgYellow)
            reagent_as_base = undefined
        }

         // Reagent is B: or CB: so use reagent as the base molecule.
        if ('B:' === reagent_as_base || 'CB:' === reagent_as_base || 'B+:' === reagent_as_base) {
            logger.log('debug', ('[AcidBase] Reagent is B: or CB: so setting reagent as acid to nothing').bgYellow)
            reagent_as_acid = undefined
        }

        // We don't have a reagent that can act either as base or acid molecule so return false.
        if (undefined === reagent_as_base && undefined === reagent_as_acid) {
            logger.log('debug', ('[AcidBase] Could not find reagent that can act as a base or reagent that can act as an acid').bgRed)
            return false
        }

        // Flag that we are using the reagent as the base molecule
        if (undefined !== reagent_as_base) {
            reagent_is_base = true
        } else {
            logger.log('debug', ('[AcidBase] Reagent as base is set to nothing').bgYellow)
        }

        // Flag that we are using the reagent as the acid molecule
        if (undefined !== reagent_as_acid) {
            reagent_is_acid = true

        } else {
            logger.log('debug', ('[AcidBase] reagent as acid is set to nothing').bgYellow)
        }

        let substrate_is_stronger_acid  = false
        let substrate_is_stronger_base  = false

        // Look for substrate carbocation
        const carbocation = _.find(container.getSubstrate()[0].atoms, (a)=>{
            return a.isCarbocation(container.getSubstrate()[0].atoms, logger)
        })

        // Determine whether we are going to use the substrate as the base molecule or as the acid molecule. 
        // If substrate has a carbocation then it is always an acid
        if (undefined !== carbocation) {
            substrate_is_stronger_acid = true
            substrate_is_stronger_base = false
            base_molecule = reagent_as_base
            acid_molecule = container.getSubstrate()[0]
        } else if('A:' === reagent_as_acid || 'A+:' === reagent_as_acid) {
            substrate_is_stronger_acid = false
            substrate_is_stronger_base = true
            base_molecule = container.getSubstrate()[0]
            acid_molecule = reagent_as_acid
        } else {

            // Reagent is base so set substrate as the acid molecule.
            if (-1 !== ['B:', 'CB:', 'B+:'].indexOf(reagent_as_base)) {
                substrate_is_stronger_acid = true
            } else if (-1 !== ['A:', 'CA:', 'A+:'].indexOf(reagent_as_base)) {
                // Reagent is acid so set substrate as the base molecule.
                substrate_is_stronger_acid = true
            } else if(undefined === reagent_as_acid) { 
                substrate_is_stronger_acid = true
            } else if(undefined === reagent_as_base) { 
                substrate_is_stronger_base = true
            } else {
                // Determine whether substrate is acid or base by pKa
                substrate_is_stronger_acid = container.getSubstrate()[0].pKa <= reagent_as_acid.pKa
                substrate_is_stronger_base = container.getSubstrate()[0].pKa >= reagent_as_base.pKa
            }
    
            logger.log('debug', ('[AcidBase] substrate is stronger base:' +substrate_is_stronger_base).bgYellow)
            logger.log('debug', ('[AcidBase] substrate is stronger acid:' +substrate_is_stronger_acid).bgYellow)
    
            // We have determined whether substrate is base molecule or acid molecule so set
            // base molecule and acid molecule accordingly.
            if (substrate_is_stronger_acid) {
                base_molecule = reagent_as_base
                acid_molecule = container.getSubstrate()[0]
            } else if (substrate_is_stronger_base) {
                acid_molecule = reagent_as_acid
                base_molecule = container.getSubstrate()[0]
            } else {
              //throw new Error('Unable to determine if substrate is the acid or the base.')
              return false
            }
    
        } // Finished determining where substrate is base molecule or acid molecule.


        if (undefined === base_molecule) {
            logger.log('debug', ('[AcidBase] No base molecule found').bgRed)
            return false
        } 

        if (undefined === acid_molecule) {
            logger.log('debug', ('[AcidBase] No acid molecule found').bgRed)
            return false
        } 


        // Get Lewis base atom, Lewis acid atom, Bronsted Lowery base atom, Bronsted Lowery acid atom.
        let lewis_acid_atom = -1 === ['CA:', 'A:', 'A+:'].indexOf(acid_molecule) ? LewisAcidAtom(acid_molecule, logger):acid_molecule
        const lewis_base_atom = -1 === ['B:', 'CB:', 'B+:'].indexOf(base_molecule) ? LewisBaseAtom(base_molecule, logger):base_molecule
        const bronsted_lowery_base_atom = -1 === ['B:', 'CB:', 'B+'].indexOf(base_molecule) ? BronstedLoweryBaseAtom(base_molecule, logger): base_molecule
        const bronsted_lowery_acid_atom = -1 === ['CA:', 'A:', 'A+:'].indexOf(acid_molecule) ? BronstedLoweryAcidAtom(acid_molecule, logger): acid_molecule

        // Exceptions
        // @todo
        if (undefined !== lewis_base_atom && undefined !== lewis_acid_atom && 'string' !== typeof lewis_base_atom && 'string' !== typeof lewis_acid_atom) {
            // @see Ritter
            // https://en.wikipedia.org/wiki/Ritter_reaction
            // We must be at least be able to hydrate a carbon with triple bond
            if ('O' === lewis_base_atom.atomicSymbol && 'C' === lewis_acid_atom.atomicSymbol && 1 !== lewis_acid_atom.tripleBonds(acid_molecule.atoms).length) {
                lewis_acid_atom = undefined
            }
        }


        const base_molecule_copy = _.cloneDeep(base_molecule)
        const acid_molecule_copy = _.cloneDeep(acid_molecule)
        

        // Determine if Lewis or Bronsted Lowery
        let is_lewis = false
        if (undefined !==  lewis_acid_atom && undefined !== lewis_base_atom && typeof lewis_acid_atom !== 'string' && typeof lewis_base_atom !== 'string') {
            // We have both a Lewis base atom and a Lewis acid atom so run Lewis reaction.

            LewisAcidBaseReaction(container, base_molecule, acid_molecule, lewis_base_atom, lewis_acid_atom, logger)
            if ('O' === base_molecule.canonicalSmiles(false, base_molecule.atoms, logger)) {
                // @todo
                // Hydration
                // Remove a hydrogen so that we avoid dehydration immediately after
                MDeprotonate(container, logger)
                const water = MoleculeFactory(
                    AtomsFactory('O', logger),
                    false,
                    false,
                    logger
                )
              //  container.addReagent(water, 1, logger)
            }
            is_lewis = true
        } else if (undefined !== bronsted_lowery_base_atom && undefined !== bronsted_lowery_acid_atom) {


            // Prevent reversals
            // 28/09
            //if (true === acid_molecule.conjugateAcid || true === base_molecule.conjugateBase) {
            if (false){
                logger.log('debug', ('[AcidBase] Not proceeding with Bronsted Lowery reaction as base or acid is a conjugate.').bgRed)
                return false
            }



            BronstedLoweryAcidBaseReaction(container, base_molecule, acid_molecule, bronsted_lowery_base_atom, bronsted_lowery_acid_atom, logger)  

            switch(acid_molecule) {
                case 'A:':
                    acid_molecule = 'CB:'
                    break
                case 'A+:':
                    acid_molecule = 'CB-:'
                    break
                case 'A-:':
                    acid_molecule = 'CB+:'
                    break
                case 'CA:':
                    acid_molecule = 'B:'
                    break
                case 'CA+:':
                    acid_molecule = 'B-:'
                    break                        
                case 'B:':
                    acid_molecule = 'CA:'
                    break
                case 'CB+:':
                    acid_molecule = 'B-:'
                    break                        
                case 'CB:':
                    acid_molecule = 'B:'
                    break
                case 'CB-:':
                    acid_molecule = 'B+:'
                    break
                }

            switch(base_molecule) {
                case 'A:':
                    base_molecule = 'CB:'
                    break
                case 'A+:':
                    base_molecule = 'CB-:'
                    break
                case 'A-:':
                    base_molecule = 'CB+:'
                    break                    
                case 'CA:':
                        base_molecule = 'B:'
                    break
                case 'CA+:':
                    base_molecule = 'B-:'
                    break
                case 'CA-:':
                    base_molecule = 'B+:'
                    break                    
                case 'B:':
                    base_molecule = 'CA:'
                    break
                case 'B+:':
                    base_molecule = 'CA-:'
                    break
                case 'B-:':
                    base_molecule = 'CA+:'
                    break
                case 'CB:':
                    base_molecule = 'A:'
                    break
                case 'CB+:':
                    base_molecule = 'A-:'
                    break
                case 'CB-:':
                    base_molecule = 'A+:'
                    break
                }
    
        } else {
            logger.log('debug', ('[AcidBase] Could not find target and base atoms.').bgRed)
            return false
        }

        // Add new reagent
        if (false === is_lewis) {
        if (true === reagent_is_acid && container.getSubstrate()[0].canonicalSmiles(false, container.getSubstrate()[0].atoms,logger) !== acid_molecule.canonicalSmiles(false, acid_molecule.atoms, logger))  {
            if (undefined === acid_molecule) {
                throw new Error('Acid molecule is undefined')
            }
            const new_reagent = typeof acid_molecule === 'string'? acid_molecule:MoleculeFactory(
                AtomsFactory(acid_molecule.canonicalSmiles(false, acid_molecule.atoms, false), logger),
                false,
                false,
                logger
            )
            container.addReagent(new_reagent, 1 , logger)
        } else if (true === reagent_is_base && container.getSubstrate()[0].canonicalSmiles(false, container.getSubstrate()[0].atoms,logger) !== base_molecule.canonicalSmiles(false, base_molecule.atoms, logger))  {
            if (undefined === base_molecule) {
                throw new Error('Base molecule is undefined')
            }
            const new_reagent = typeof base_molecule === 'string'? base_molecule:MoleculeFactory(
                AtomsFactory(base_molecule.canonicalSmiles(false, base_molecule.atoms, logger), logger),
                false,
                false,
                logger
            )
            container.addReagent(new_reagent, 1 , logger)
        }
       } 

       // Check that we don't have two water groups
        const oh_leaving_groups = ExtractOHLeavingGroups(_.cloneDeep(container.getSubstrate()[0]), logger)
        if (oh_leaving_groups.length > 1) {
            logger.log('debug', ('[AcidBase] Resulting substrate has more than one water group.').bgRed)
            return false
        }




    } catch(e) {
        console.log(e.stack)
        process.exit()
    }

   
}

module.exports = AcidBase











