/*

Initialised container

Params in: null
Params out: container object

[0] = molecules
 */
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
const ChemReact = require('../actions/ChemReact')

/**

*/
const ContainerFactory = () => {


        /**
         * @return { Object } The last reactant added to the container, including units
         */
        const getReactant = function() {
            const container = this;
            return container.reactants[container.reactants.length - 1];
        };


        /**

        */

        const renderReactantsAsSmiles = function(reactants) {
            return reactants.map((reactant, i) => {
                if (undefined === reactant) {
                    return 'undefined'
                }
                if (typeof reactant[0] === "string") {
                    return reactant[0] + "{" + reactant[1] + "}";
                }
                return reactant[0].canonicalSmiles + "{" + reactant[1] + "}";
            });
        }

        const convertReactantsToSmiles = function(reactants) {
            return reactants.reduce((carry,reactant, i) => {
                if (typeof reactant[0] === "string") {
                    carry.push(reactant[0])
                } else {
                    carry.push(reactant[0].canonicalSmiles)
                }
                return carry
            }, []);
        }


        /**
         * Remove a reactant from container
         *
         * @param reactant - The reactant to remove
         * @param logger - logger The logger to use for filtering the s
         */
        const removeReactant = function(reactant) {
            this.reactants = this.reactants.filter((s) => {
                return !_.isEqual(s[0].canonicalSmiles, reactant[0].canonicalSmiles)
            });

        }

        const lookUpReactantBySmiles = function(smiles) {
            return _.findIndex(this.reactants, (r) => {
                if (typeof r === "string") {
                    return false;
                }

                const reactantSmiles = r[0].canonicalSmiles

                return reactantSmiles === smiles;
            }) !== -1;
        }

        /**
         * Finds the position of the reactant in the reagents array
         *
         * @param reactant
         * @param logger
         *
         * @return { number } The index of the reactant in the container
         */
        const getReactantIndex = function(reactant) {

            // Look for a reactant in the container that matches the reactant.
            return this.reactants.findIndex((r) => {
                // Check if the current reactant matches the reactant we are looking for.
                if (typeof reactant[0] === 'string') {
                    return r[0] === reactant[0]
                }
                const reactantSmiles = r[0].canonicalSmiles ?? r.smiles;
                return reactant.canonicalSmiles === reactantSmiles;
            });
        }

        /**
         * Look for a reactant in the container and return true if it is the container, otherwise false.
         *
         * @param reactant
         * @param logger
         *
         * @return { boolean } Whether or not the reactant is in the container.
         */
        const lookUpReactant = function(reactant) {
            // Look for a reactant in the container that matches the reactant.
            const index = this.reactantIndex(reactant)
            // Return true or false depending if we have found matching reactant.
            return index !== -1;
        };

        const findMatchingReactant = function(reactant) {
            const matching_reactant = this.reactants.find((r) => {
                if (typeof reactant[0] === "string") {
                    return r[0] === reactant
                }
                // Check if the current reactant matches the reactant we are looking for.
                const reactantSmiles = r[0].canonicalSmiles ?? r.smiles;
                return typeof r !== "string" && reactant.canonicalSmiles === reactantSmiles;

            });
            return matching_reactant
        }

        /**
         * Look for the reagent in the container and return the number of units.
         *
         * @param reactant
         * @param logger
         *
         * @return { number } The number of units of the reactant left in the container.
         */
        const getTheNumberOfUnitsOfReactantInContainer = function(reactant) {
            // Look for a reactant in the container that matches the reactant.
            const matching_reactant = this.findMatchingReactant(reactant)
            return matching_reactant === undefined ? 0 : matching_reactant[1]
        };


        /**
         * Add n units of reactant to the container.
         *
         * @param reactant - the reactant to add
         * @param units - number of units of reactant to add
         * @param logger - log what happens to log file
         */
        const addReactant = function(reactant, units) {
            // Get the number of units of matching reactant in the container
            const existingNumberOfUnits = this.numberOfUnitsOfReactant(reactant);

            if (existingNumberOfUnits === 0) {
                // If we have 0 units, then we simply add the reactant.
                this.reactants.push([reactant, units]);
            } else {
                // If not, then we increase the number of units.
                const reactantsIndex = this.reactantIndex(reactant);
                this.reactants[reactantsIndex][1] = existingNumberOfUnits + units;
            }

            //this.react(logger);
        };


        const addSolvent = function(solvent) {
            this.solvent = solvent
        }


        const filterReactants = function(filter) {
            Typecheck({
                name: "filter",
                value: filter,
                type: "string"
            });

            if (filter === '*') {
                this.reactants = _.cloneDeep(this.reactants).map((stepReactant) => []);
            } else {
                this.reactants = this.reactants.filter((reactant) =>
                    reactant.some((r) => r.canonicalSmiles().includes(filter)
                ));
            }
        }

        /**
         */

        /**
         * React a reagent with a substrate and stablise the result. If reaction is
         * successful then this will change the contents of the container.
         *
         * @param logger
         *
         * @return { boolean } false if no reaction, null otherwise
         */
        const reactv1 = function() {

            /*
            Handling multiple reagents.
            Example.
            A substrate is added to a container followed by an acid reagent that protonates
            the substrate. Afterwards the container container the protonated substrate, the
            conjugate base of the acid reagent, and leftover acid reagent.
            We then add a lewis base to the container.
            Does the lewis base react:
            	To just the protonated substrate?
            	To the protonated substrate and the reagents?
            	To the protonated substrate first, and then the reagents?
            	To the reagents first, then the protonated substrate?
            Answer: The lewis base can potentially react to both the protonated substrate
            and the reagents. The order of the reactions will depend on multiple factors
            including speed of the reactions, concentration etc.

            */

            // Try simulating different reactions: protonation, deprotonation, acid-base
            //const reactions = [Protonate, Deprotonate, SN2, SN1, E2, E1, LewisAcidBase];
            const reactions = [Protonate, Deprotonate, SN2, SN1, E1, E2, LewisAcidBase];
            const result = reactions.some((reaction) => {
                return reaction(this) !== false
            });

            // Returns true if the substrate has changed.
            if (result) {
                //console.log('ContainerFactory.js react()')
                //const substrate = this.getSubstrate()[0]
                //console.log(substrate.atoms[0].charge())
                //console.log(substrate.atoms[4].doubleBonds(substrate.atoms))
                //console.log(substrate.atoms[3].doubleBonds(substrate.atoms))

                // console.log(smiles)
                let safety = 10;
                let stabilised = false;

                //throw new Error('Last oxygen atom should not have a double bond')

                // This method will stabilise the substrate.
                while (safety > 0 && !stabilised) {
                    safety--;
                    stabilised = Stabilise(this.getSubstrate());
                    this.getSubstrate()[0] =
                        MoleculeFactory(
                            this.getSubstrate()[0].atoms,
                            this.getSubstrate()[0].conjugateBase,
                            this.getSubstrate()[0].conjugateAcid,
                        )
                }

                this.getSubstrate()[0] = MoleculeFactory(
                    this.getSubstrate()[0].atoms,
                    this.getSubstrate()[0].conjugateBase,
                    this.getSubstrate()[0].conjugateAcid,
                )

            } else {
                return false;
            }
        };

        const determineOrderOfReaction = function(container) {
            // @todo
            return [
                container.getSubstrate[0],
                container.reagents
            ]
        }

        const react = function() {
            ChemReact(this).react()
        }

        /*
        Checks if another container has the same reactants as another container
        */
        const reactantsAreTheSame = function(otherContainer) {
            let i = 0
            let same = true
            for (i ==- 0; i < otherContainer.reactants.length; i++) {
                if (this.reactants[i][0].canonicalSmiles !== otherContainer.reactants[i][0].canonicalSmiles || this.reactants[i][1] !== otherContainer.reactants[i][1]) {
                    same = false
                }
            }
            return same
        }

        const reactants = function() {
            return this.reactants
        }


        return {
            'removeReactant': removeReactant,
            'lookUpReactant': lookUpReactant,
            'addReactant': addReactant,
            'renderReactantsAsSmiles': renderReactantsAsSmiles,
            'convertReactantsToSmiles':convertReactantsToSmiles,
            'filterReactants': filterReactants,
            'lookUpReactantBySmiles': lookUpReactantBySmiles,
            'react': react,
            'numberOfUnitsOfReactant': getTheNumberOfUnitsOfReactantInContainer,
            'reactantIndex': getReactantIndex,
            'addSolvent': addSolvent,
            'findMatchingReactant': findMatchingReactant,
            'reactantsAreTheSame': reactantsAreTheSame,

            'reactants':[],

        }


}

module.exports = ContainerFactory