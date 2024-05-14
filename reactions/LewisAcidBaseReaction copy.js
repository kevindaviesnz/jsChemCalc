/*

A Lewis Lowery acid base reaction is when a molecule or atom (base) donates an electron pair to another molecule of atom (acid).

Params in: container
Return: container

Example:
@see https://chem.libretexts.org/Courses/Mount_Royal_University/Chem_1202/Unit_2%3A_Acids_and_Bases/15.09%3A_Lewis_Acids_and_Bases figure 2/9.1
boron trichloride (acid) + diethyl ether (base)
Product: Cl3BO(CH2CH3)2
 */

/*

First we get whether the substrate can be the base molecule, acid molecule, or both. We do this by getting the base atom and 
acid atom respectively from the substrate.

Next we look for a reagent that can be used as the base molecule and a reagent that can be used as the acid molecule.

If neither such reagents can be found then we RETURN false as at the very least we need either a reagent that can be used
as the base molecule and a reagent that can be used as the acid molecule.

Similarly if the substrate can neither be used as the base molecule or acid molecule then we RETURN false.

If we can't find a reagent that can used used as the base molecule AND the substrate can't be used as the base molecule
then we RETURN false as we don't have anything that can be used as the base molecule.

Likewise, if we can't find a reagent that can be used as the acid molecule AND the substrate can't be used as the acid molecule
then we RETURN false as we don't have anything that can be used as the acid molecule.

If we don't have a reagent that can be used as a base molecule then we set the base molecule to the substrate and the acid molecule to the reagent 
that can be used as the acid molecule. Note that at this point if we don't have a reagent that can be used
as the base molecule we will have a reagent that can be used as the acid molecule. Also if don't have a reagent that can be used as a base molecule then
we will have a substrate that can used as the base molecule.

Else if we don't have a reagent that can be used as the acid molecule then we set the acid molecule to the substrate and the base molecule to the reagent that
can be used as the base molecule.

Else 

(If we reach this point this point we will have a reagent that can be used as a base molecule and possibly a reagent that
can be used as the acid molecule).

if we don't have a substrate that can be used as the base molecule then we set the base molecule to the reagent that can be used as the base
molecule and the acid molecule to the substrate.

Else if we don't have a substrate that can be used as the acid molecule we set the base molecule to the substrate and the reagent to the reagent 
that can be used as the acid molecule.


Else

(At this point we have both a reagent that be used as the base molecule AND a reagent that can be used as the acid molecule and a 
substrate that can be used as both the base molecule and the substrate)

If the reagent that be used as an acid molecule is more acidic that the substrate when used as a acid molecule then we set the reagent that
can be used as an acid molecule to the acid molecule and the base molecule to the substrate.

Else if the reagent that can be used as an acid molecule is less acidic that the substrate then we set the substrate to the acid molecule
and the base molecule to the reagent that can be used as the base molecule.

Else

(At this point the reagent that can be used as the acid molecule has the same acidity as the substrate when used as the acid molecule)

If the reagent that can be used as a base molecule is more base than the substrate when used as the base molecule then we set
the base molecule to the reagent that can be used as the base molecule and the acid molecule to the substrate.

Else if the reagent that can be used as a base molecule is less base than the substrate when used as the base molecule then we set
the acid molecule to the reagent that can be used as the base molecule and the base molecule to the substrate.

Else we return false as we are unable to determine the base molecule and the acid molecule.

Finally we use the bond the base molecule to attack the acid molecule.







GET reagent to use as base as possible_base_reagent_molecule
GET reagent atom to use as base atom as possible_base_reagent_atom
GET reagent to use as acid as possible_acid_reagent_molecule
GET reagent atom to use as acid atom as possible_reagent_acid_atom

GET substrate base atom as substrate_base_atom
GET substrate acid atom as substrate_acid_atom

IF substrate_base_atom is NULL AND substrate_acid_atom IS NULL
    RETURN FALSE substrate base atom and substrate acid are both NULL
END IF

IF possible_acid_reagent_molecule is NULL AND possible_base_reagent_molecule IS NULL
    RETURN FALSE possible acid reagent and base reagent molecules are both NULL
END IF

IF possible_base_reagent_molecule is NULL AND substrate_base_atom IS NULL
    RETURN FALSE Neither substrate or reagent can be used as the base molecule
END IF

IF possible_acid_reagent_molecule is NULL AND substrate_acid_atom IS NULL
    RETURN FALSE Neither substrate or reagent can be used as the acid molecule
END IF


IF possible_base_reagent_molecule is NULL AND substrate_base_atom IS NOT NULL
    SET base_molecule to container substrate
    SET acid_molecule to possible_acid_reagent_molecule
ELSE possible_acid_reagent_molecule IS NULL AND substrate_acid_atom IS NOT NULL
    SET base_molecule to possible_reagent_base_molecule
    SET acid_molecule to container substrate
ELSE IF substrate_base_atom IS NOT NULL AND substrate_acid_atom IS NOT NULL AND possible_acid_atom IS NOT NULL AND possible_base_atom IS NOT NULL
    IF substrate base atom has negative charge OR substrate atom has partial negative charge AND substrate acid atom has no charge
        SET base_molecule to container substrate
        SET acid_molecule to possible_acid_reagent_molecule
    ELSE IF substrate acid atom has positive charge OR substrate acid atom has partial positive charge AND substrate base atom has no charge  
        SET base_molecule to possible_reagent_base_molecule
        SET acid_molecule to container substrate  
    ELSE 
        RETURN FALSE
    END IF
ELSE
    THROW ERROR unable to determine base and or acid molecule    
END IF



 */

/*



 */
const Typecheck = require('../Typecheck')
const Constants = require('../Constants')
const LewisAcidAtom = require('../reflection/LewisAcidAtom')
const LewisBaseAtom = require('../reflection/LewisBaseAtom')
const MoleculeFactory = require('../factories/MoleculeFactory')
const nucleophilicAttackOnSubstrate = require('../mechanisms/NucleophilicAttackOnSubstrate')
const nucleophilicAttackOnReagent = require('../mechanisms/NucleophilicAttackOnReagent')
const _ = require('lodash');
const { S, B, P, C } = require('../factories/PeriodicTable')
const AtomsFactory = require('../factories/AtomsFactory')
// https://www.npmjs.com/package/colors
var colors = require('colors');
const BronstedLoweryAcidAtom = require('../reflection/BronstedLoweryAcidAtom')
const BronstedLoweryBaseAtom = require('../reflection/BronstedLoweryBaseAtom')
const ENV = require('../env')

colors.enable()

const LewisAcidBaseReaction = (container, base_molecule, acid_molecule, base_atom, acid_atom, logger) => {

    try {


        Typecheck(
            {name: "container", value: container, type: "object"},
            {name: "base_molecule", value: base_molecule, type: "object"},
            {name: "acid_molecule", value: acid_molecule, type: "object"},
            {name: "base_atom", value: base_atom, type: "array"},
            {name: "acid_atom", value: acid_atom, type: "array"},
            {name: "logger", value: logger, type: "object"},
        )

        container.getSubstrate()[0].atoms.checkBonds('LewisAcidBase', logger)

        logger.log('debug', ('[LewisAcidBaseReaction] acid atom ' + (undefined === acid_atom || null===acid_atom?'none':acid_atom.atomicSymbol)).yellow)
        logger.log('debug', ('[LewisAcidBaseReaction] base atom ' + (null===base_atom?'none':base_atom.atomicSymbol)).yellow)

 
        let combined_molecule = null
    
        const base_molecule_before = _.cloneDeep(base_molecule)
    
        if (_.isEqual(base_molecule, container.getSubstrate()[0])) {

            combined_molecule = nucleophilicAttackOnReagent(
                container,
                acid_atom,
                base_atom,
                acid_molecule,
                logger
            )

            container.removeReagent(base_molecule, logger)



            container.getSubstrate()[0] = combined_molecule
            container.removeReagent(acid_molecule, logger)    


    
        } else {

               nucleophilicAttackOnSubstrate(
                    container,
                    acid_atom,
                    base_atom,
                    base_molecule,
                    logger
                )

    

                // Ignore - 
                // @todo - should be able to specify units so that if there are more units of reagent
                // than units of substrate then reagent will not be consumed.
                if (false) {
                    // hydrating
                } else {
                    if (ENV.debug) {
                        logger.log(ENV.debug_log, ("[LewisAcidBaseReaction] Reagent consumed by substrate.").bgYellow)
                    }
                    container.removeReagent(base_molecule, logger)
                }

        }



        container.getSubstrate()[0].atoms.checkBonds('LewisAcidBase', logger)
        
        return true



    } catch(e) {

        logger.log('debug', 'LewisAcidBaseReaction() '+e)
        console.log(e.stack)
        process.exit()

    }



}

module.exports = LewisAcidBaseReaction