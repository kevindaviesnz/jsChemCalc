/*

An SN1 reaction is when a leaving group leaves, creating a carbocation (C+). A nucleophile then attacks the carbocation
forming a bond.

Requirements:
Nucleophile with a pair of electrons to donate.
Carbon attached to leaving group.
A good leaving group.
Carbon that is preferably a tertiary carbon.

Good substrates for the SN1 reaction are those that form a stable carbocation. In order these are:

Tertiary and benzylic (carbon bonded to benzene)
Secondary and alylic
Primary (worse)

SN1 reactions use protic solvents. Protic solvents are those that contain O-H or N-H bonds such as water and alcohols.

SN2 reactions use aprotic solvents. Aprotic solvents have no N-H or O-H bonds such as dimethyl sufoxide, CH2CL2, and ethers (R-O-R).

* In an SN1 reaction the leaving group first leaves, forming a carbocaton (positively charged carbon). The carbocation is then attacked by the protic solvent oxygen / nitrogen atom, forming a bond.


The SN1 reaction is a substitution reaction in organic chemistry. "SN" stands for "nucleophilic substitution", and the "1" says that the rate-determining step is unimolecular.[1][2]
Thus, the rate equation is often shown as having first-order dependence on electrophile and zero-order dependence on nucleophile. This relationship holds for situations where the amount of
 nucleophile is much greater than that of the carbocation intermediate. Instead, the rate equation may be more accurately described using steady-state kinetics. The reaction involves a
 carbocation intermediate and is commonly seen in reactions of secondary or tertiary alkyl halides under strongly basic conditions or, under strongly acidic conditions, with secondary or t
 ertiary alcohols. With primary and secondary alkyl halides, the alternative SN2 reaction occurs. In inorganic chemistry, the SN1 reaction is often known as the dissociative mechanism.
 This dissociation pathway is well-described by the cis effect. A reaction mechanism was first proposed by Christopher Ingold et al. in 1940.[3] This reaction does not depend much on the strength
 of the nucleophile unlike the SN2 mechanism. This type of mechanism involves two steps. The first step is the reversible ionization of Alkyl halide in the presence of aqueous acetone or an
 aqueous ethyl alcohol. This step provides a carbocation as an intermediate.

Example:
tert-Butyl bromide (substrate with leaving group) + 2H2O (protic solvent) = Br- + H3O+ tert-Butyl alcohol

Example
@see https://chem.libretexts.org/Courses/University_of_Illinois_Springfield/UIS%3A_CHE_267_-_Organic_Chemistry_I_(Morsch)/Chapters/Chapter_07%3A_Alkyl_Halides_and_Nucleophilic_Substitution/7.12%3A_The_SN1_Mechanism
substrate: 2-Bromo-2-methylpropane
reagent: sodium cyanide
solvent: diethyl ether

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

const SN1 = (container, logger) => {

    Typecheck(
        {name: "container", value: container, type: "object"},
        {name: "logger", value: logger, type: "object"},
    )

    if (container.solvent !== "protic") {
        logger.log('debug', 'SN1 no protic solvent'.bgRed);
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
                throw new Error('SN1() No reagent found that has a leaving group')
            }
            products = RemoveLeavingGroup(reagents[0],logger)
            if (products === false) {
                throw new Error('SN1() No leaving groups found on substrate')
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

module.exports = SN1
