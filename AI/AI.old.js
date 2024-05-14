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

const Typecheck = require('../Typecheck')
const render = require('../actions/render')
const Constants = require('../Constants')
const FunctionalGroups = require('../reflection/FunctionalGroups')
const SN1 = require('../reactions/SN1')
const SN2 = require('../reactions/SN2')
const BronstedLoweryAcidBaseReaction = require('../reactions/BronstedLoweryAcidBaseReaction')
const LewisAcidBaseReaction = require('../reactions/LewisAcidBaseReaction')
const Protonate = require('../mechanisms/Protonate')
const LeavingGroupRemoval = require('../mechanisms/LeavingGroupRemoval')
const FormatAs = require('../factories/FormatAs')
const AkylShift = require('../mechanisms/AkylShift')
const BondAtomToAtom = require('../mechanisms/BondAtomToAtomInSameMolecule')
const BreakBond = require('../mechanisms/BreakBondInSameMolecule')
const Deprotonate = require('../mechanisms/Deprotonate')
const ProtonTransfer = require('../mechanisms/ProtonTransfer')
const Reduce = require('../mechanisms/Reduce')
const Hydrate = require('../mechanisms/Hydrate')
const _ = require('lodash');

// Pinacol rearrangement
// Reductive amination (in process)

// Deprotonation -> leaving removal

const AI = (container, previous) => {

    Typecheck(
        {name: "container", value: container, type: "object"}
    )

    console.log("\nSTART:")
    console.log("Previous:")
    console.log(previous)

        // @todo

    // Akyl shift to be called before protonation
    // Lewis acid base to be called before deprotonation
    const last_action = previous[previous.length-1]

    if(previous.indexOf('reduction') !== -1 || false === Reduce(container)) {

        if (last_action === 'akyl shift' || false === AkylShift(container)) {

            if (previous.indexOf('lewis acid base') !== -1 || false == LewisAcidBaseReaction(container)) {

                if (previous.indexOf('protonation') !== -1 || false === Protonate(container) ) {

                    // eg [hydrate], [hydrate,break bond]
                    if (previous[previous.length -2] === "hydrate" || previous[previous.length -1] === "hydrate" || previous.indexOf('leaving group removal') !== -1 || false === LeavingGroupRemoval(container) ) {


                        if (previous.indexOf('break bond') !== -1 || false === BreakBond(container)) {

                            if (previous.indexOf('proton transfer') !== -1 || false === ProtonTransfer(container)) {


                                if (previous.indexOf('bond atom to atom') !== -1 || false === BondAtomToAtom(container)) {

                                    console.log("Bond atom to atom failed")

                                    if (previous[previous.length -1] === "protonationxyz" || previous[previous.length -1] === "deprotonation"  || false === Deprotonate(container)) {

                                        console.log("Deprotonation failed")
                                        console.log(previous[previous.length -1] === "protonationxyz")
                                        console.log(previous.indexOf('deprotonation') !== -1 )
                                        console.log(previous)

                                        if (previous.indexOf('hydrate') !== -1 || false === Hydrate(container)) {
                                            console.log("Hydrate failed")

                                            if (previous[previous.length -1] === "bronstedlowery" || previous.indexOf('bronstedlowery') !== -1 || false === BronstedLoweryAcidBaseReaction(container)) {

                                                console.log("Bronsted Lowery failed")

                                            } else {
                                                console.log("Bronsted Lowery [OK]")
                                                previous.push("bronstedlowery")
                                                console.log("Substrate after calling BronstedLowery()")
                                                AI(container, previous)
                                            }


                                        } else {
                                            console.log("Hydrate [OK]")
                                            previous.push("hydrate")
                                            console.log("Substrate after calling Hydrate()")
                                            AI(container, previous)
                                        }


                                    } else {
                                        console.log("Deprotonate [OK]")
                                        previous.push("deprotonation")
                                        console.log("Substrate after calling Deprotonation()")
                                        AI(container, previous)
                                    }




                                } else {

                                    console.log("Bond atom to atom [OK]")
                                    previous.push("bond atom to atom")
                                    console.log("Substrate after calling BondAtomToAtom()")
                                    AI(container, previous)

                                }



                            } else {
                                console.log("proton transfer [OK]")
                                console.log("Substrate after callling proton transfer")
                                previous.push("proton transfer")
                                AI(container, previous)
                            }


                        } else {
                            console.log("Break bond [OK]")
                            console.log("Substrate after callling break bond")
                            previous.push("break bond")
                            AI(container, previous)
                        }


                    } else {
                        console.log("Leaving group removal [OK]")
                        previous.push("leaving group removal")
                        console.log("Substrate after calling leaving group removal")
                        AI(container, previous)
                        //process.exit()
                    }


                } else {
                   console.log('Protonated [OK]:')
                    // CC([O+])(C)C(O)(C)C
                    previous.push("protonation")
                    AI(container, previous)
                }

            } else {
                console.log("Lewis acid base [OK]")
                previous.push("lewis acid base")
                console.log("Substrate after calling lewis acid base")
                AI(container, previous)
            }



        } else {

            console.log("Akyl shift [OK]")
            console.log("Substrate after calling AkylShift()")
            previous.push("akyl shift")
//        process.exit()
            AI(container, previous)

        }
    } else {
        console.log("Reduce [OK]")
        console.log("Substrate after calling Reduce()")
        previous.push("reduction")
        AI(container, previous)
    }


}

module.exports = AI