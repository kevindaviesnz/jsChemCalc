const Typecheck = require('../Typecheck')
const render = require('../actions/render')
const Constants = require('../Constants')
const FunctionalGroups = require('../reflection/FunctionalGroups')
const SN1 = require('../reactions/SN1')
const SN2 = require('../reactions/SN2')
const BronstedLoweryAcidBaseReaction = require('../reactions/BronstedLoweryAcidBaseReaction')
const LewisAcidBaseReaction = require('../reactions/LewisAcidBaseReaction')

/*

@see @see https://www.masterorganicchemistry.com/2017/09/01/reductive-amination/
@see https://cdn.masterorganicchemistry.com/wp-content/uploads/2017/08/3-mech19.png?_ga=2.237710665.832783806.1638748877-827591198.1638748877

Params in: container
Returns: container

Tested with:
Reductive amination

Is there a substrate?
    Y - Does the substrate have a leaving group?
        Y - Is there a solvent?
            Y - Is the solvent protic (contains O-H or N-H bonds)
                Y - SN1() or E1()
                STOP
            N - Is the solvent aprotic (contains no N-H or O-H bonds)
                Y - SN2() or E2()
                STOP
        N - // no solvent
    N - Is there a reagent?
        Y - FIND reagent proton donor
            FIND substrate proton donor
            FIND reagent proton acceptor
            FIND substrate proton acceptor
            Is there reagent proton donor + substrate +proton acceptor OR reagent proton acceptor + substrate + proton donor?
            Y - BronstedLoweryAcidBaseReaction()
            N - FIND reagent electron pair donor
                FIND substrate electron pair donor
                FIND reagent electron pair acceptor
                FIND substrate electron pair acceptor
                Is there reagent electron pair donor + substrate +electron pair acceptor OR reagent electron pair acceptor + substrate + electron pair donor?
                Y - LewisAcidBaseReaction()

        N - // No leaving group and no reagent


N - // No substrate

            Is there a atom that can donate an electron pair (nucleophile)?
                Y - Is there a carbon bonded to a leaving group?
                        Y - Is there a solvent and is the solvent protic?
                            Does the carbon atom have at least one carbon bond?
                            Y - E1()
                            N - SN1()
                            STOP
                        N - Is there a solvent and is the solvent polar and aprotic?
                            Y - SN2()
                            N - Is the leaving group OH?
                                Y - Get carbon atom bonded to the oxygen atom
                                    Get oxygen atom
                                    oneTwoElimination(molecule, carbon atom, oxygen atom, electron pair donor atom)
                                 N - STOP
                N - Is there a carbonyl group?
                    Y - Get carbonyl carbon
                        Get carbonyl oxygen
                        oneTwoAddition(carbonyl molecule, carbonyl carbon, carbonyl oxygen, electron pair donor)
                    N - Is there an OX atom bonded to a carbon atom?
                        Y - oneTwoElimination()
            N

#########################################################################

            Y - BronstedLoweryAcidBaseReaction()
            N - Is there an atom that can accept an electron pair (Lewis acid)?
                Y - LewisAcidBaseReaction()
                N - Is there an OX atom bonded to a carbon atom?
                    Y - Is the oxygen atom and the electron pair donor atom on the same molecule?
                         Y - Get carbon atom bonded to the oxygen atom
                             Get oxygen atom
                             oneTwoElimination(molecule, carbon atom, oxygen atom, electron pair donor atom)
                         N - STOP
                     N - STOP

#########################################################################

 */

const Reaction = (container) => {

    Typecheck(
        {name: "container", value: container, type: "array"}
    )

    /*
    Is there a substrate?
    Y - Does the substrate have a leaving group?
        Y - Is there a solvent?
            Y - Is the solvent protic (contains O-H or N-H bonds)
                Y - SN1() or E1()
                STOP
            N - Is the solvent aprotic (contains no N-H or O-H bonds)
                Y - SN2() or E2()
                STOP
        N - // no solvent
    N - Is there a reagent?
        Y - FIND reagent proton donor
            FIND substrate proton donor
            FIND reagent proton acceptor
            FIND substrate proton acceptor
            Is there reagent proton donor + substrate +proton acceptor OR reagent proton acceptor + substrate + proton donor?
            Y - BronstedLoweryAcidBaseReaction()
            N - FIND reagent electron pair donor
                FIND substrate electron pair donor
                FIND reagent electron pair acceptor
                FIND substrate electron pair acceptor
                Is there reagent electron pair donor + substrate +electron pair acceptor OR reagent electron pair acceptor + substrate + electron pair donor?
                Y - LewisAcidBaseReaction()

        N - // No leaving group and no reagent
     */

    /*
    if (
        SubstitutionElimination(container) === false
        && (LewisAcidBaseReaction(container) || BronstedLoweryAcidBaseReaction(container)) === false
        && (Protonate(container)||Deprotonate(container) === false
        && LeavingGroupRemoval(container) === false
        && CarbocationShift(container) === false

    )) {

    }


        Protonate(container) || Deprotonate(container)


    // @see Pinacol rearrangement
    Protonate(container.molecule)
    let products = LeavingGroupRemoval(container.molecule)
    CarbocationShift(products[0])
    BondAtomtoAtom(products[0])
    Protonate(products[0])
    products = LeavingGroupRemoval(products[0])


     */
}

module.exports = Reaction