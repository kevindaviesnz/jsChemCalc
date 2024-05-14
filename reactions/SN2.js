/*

An SN2 reaction is when a nucleophile attacks a carbon that is bonded to a leaving group. The nucleophile attacks
the carbon because the carbon is partial positive charge due to the leaving group. When the nucleophile attacks the carbon
it causes the bond between the leaving group and the carbon to break.

Requirements:
Nucleophile with a pair of electrons to donate.
Carbon attached to leaving group.
A good leaving group.
Carbon that is NOT a tertiary carbon ie is bonded to at least one hydrogen atom.

Good leaving groups are typically weak bases, and weak bases are the conjugate bases of strong aicds. Halides are the most
common leaving groups in SN2 reactions.

Hydroxide ion (OH-), alkoxides (RO-) and amide ion (NH2-) are bad leaving groups.

SN1 reactions use protic solvents. Protic solvents are those that contain O-H or N-H bonds such as water and alcohols.

SN2 reactions use aprotic solvents. Aprotic solvents have no N-H or O-H bonds such as dimethyl sufoxide, CH2CL2, and ethers (R-O-R).

* In an SN2 reaction the carbon attached to the leaving group is attacked by the reagent nucleophile atom, forming a bond and pushing out the leaving group.

Example:
acetone (solvent, C(=0)(C)C) + ethyl chloride (substrate) =ad


SN2 reactions prefer aprotic solvents. Aprotic solvents have no N-H or O-H bonds such as dimethyl sufoxide, CH2CL2, and ethers (R-O-R).
The SN2 reaction is a type of reaction mechanism that is common in organic chemistry. In this mechanism, one bond is broken and one bond is formed synchronously, i.e.,
 in one step. SN2 is a kind of nucleophilic substitution reaction mechanism. Since two reacting species are involved in the slow (rate-determining) step, this leads to the
 term substitution nucleophilic (bi-molecular) or SN2, the other major kind is SN1.[1] Many other more specialized mechanisms describe substitution reactions.
The reaction type is so common that it has other names, e.g. "bimolecular nucleophilic substitution", or, among inorganic chemists, "associative substitution" or
"interchange mechanism".

Params in: container
Params out: container

*/

/*

CALL findNucleophileAtomInContainer using container RETURN nucleophile atom
CALL findSN2CarbonAtom using container return SN2 carbon atom
CALL findLeavingGroupAtomBondedToSN2CarbonAtom using SN2 leaving group atom
GET electron pair from nucleophile atom
GET carbon + leaving group atom electron pair from SN2 carbon atom
CALL pushElectronPair using nucleophile atom, SN2 carbon atom, electron pair, container RETURNING container
CALL pushElectronPair using SN2 carbon atom, leaving group atom,  carbon + leaving group atom electron pair, container RETURNING container
 */

const Typecheck = require('../Typecheck')
const Constants = require("../Constants")
const LewisBaseAtom  = require("../reflection/LewisBaseAtom")
const LewisAcidAtom  = require("../reflection/LewisAcidAtom")
const LewisAcidBase = require("../reactions/LewisAcidBase")
const _ = require('lodash');
const nucleophilicAttack = require('../mechanisms/NucleophilicAttack')
const { N } = require('../factories/PeriodicTable')
const ExtractLeavingGroups = require('../actions/ExtractLeavingGroups')
const RemoveLeavingGroup = require('../actions/RemoveLeavingGroup')

const SN2 = (container, logger) => {

    Typecheck(
        {name: "container", value: container, type: "object"},
        {name: "logger", value: logger, type: "object"},
    )

    if (container.solvent !== "polar aprotic") {
        logger.log('debug', 'SN2 no polar aprotic solvent'.bgRed);
        return false;
    }

    // Requirements:
    // Reagent nucleophile
    // Leaving group on substrate
    // Solvent???
    // The nucleophile (Lewis base) attacks a carbon attached to a leaving group, replacing the leaving group.

    // Determine if the substrate is attacking the reagent (substrate has no leaving group) or the reagent
    // is attacking the substrate (substrate has a leaving group).
    let nucleophile_molecule = null
    let leaving_group_molecule = null
    let target_molecule = null
    let products = null


    try {
        products = RemoveLeavingGroup(container.getSubstrate(),logger)
        if (products === false) {

            const reagents = container.reagents.filter((reagent) => {
                return ExtractLeavingGroups(reagent, logger).length > 0
            })
            if (reagents.length === 0) {
                throw new Error('SN2() No reagent found that has a leaving group')
            }
            products = RemoveLeavingGroup(reagents[0],logger)
            if (products === false) {
                throw new Error('SN2() No leaving groups found on substrate')
            }
            container.addReagent(products.leaving_group,1,  logger)
            nucleophile_molecule = container.getSubstrate()[0]
            leaving_group_molecule = products.leaving_group
            container.addReagent(leaving_group_molecule, 1, logger)
        } else {
            return LewisAcidBase(container, logger)
        }
    } catch(e) {
        console.log(e)
        logger.log('debug', e)
        process.exit()
        return false
    }

    

}

module.exports = SN2
