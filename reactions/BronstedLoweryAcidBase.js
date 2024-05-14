
const Constants = require("../Constants")
const Typecheck = require("../Typecheck")
const BronstedLoweryAcidAtom = require('../reflection/BronstedLoweryAcidAtom')
const BronstedLoweryBaseAtom = require('../reflection/BronstedLoweryBaseAtom')
const deprotonate = require('../actions/Deprotonate')
const ContainerView = require('../view/Container')
const LewisBaseAtom = require('../reflection/LewisBaseAtom')
const _ = require('lodash');
const { C, B } = require("../factories/PeriodicTable")
const MoleculeFactory = require("../factories/MoleculeFactory")
const AtomsFactory = require("../factories/AtomsFactory")
const ConjugateAcid = require("../reflection/ConjugateAcid")
const ConjugateBase = require("../reflection/ConjugateBase")
const EquilibriumConstant = require("../reflection/EquilibriumConstant")
const ProductsOrReactantsFavoured = require("../reflection/ProductsOrReactantsFavoured")
const EquilibriumConcentrations = require('../reflection/EquilibriumConcentrations')
const Stabilise = require('../actions/Stabilise')
const RemoveLeavingGroup = require('../actions/RemoveLeavingGroup')
const MoleculeManager = require('../managers/MoleculeManager')

//const FindWeakestAcid = require("../reflection/FindWeakestBronstedLoweryAcidMolecule")

const BronstedLoweryAcidBase = (container, base_molecule_in_container, acid_molecule_in_container, logger) => {


    if ('CB:' === acid_molecule_in_container[0]) {
        return false
    }

    if ('A:' === base_molecule_in_container[0]) {
        return false
    }

        const determineIfReactionIsReversible = function(base_molecule_in_container, acid_molecule_in_container_deprotonated) {
            const base_atom = BronstedLoweryBaseAtom(base_molecule_in_container[0], acid_molecule_in_container[0], logger)
            const acid_atom = BronstedLoweryAcidAtom(acid_molecule_in_container_deprotonated[0], base_molecule_in_container_protonated[0], logger)
            const is_reversible = base_atom.atomicSymbol === 'C' || acid_atom.atomicSymbol === 'C'
            return is_reversible
        }

        // Save the initial concentration of base and substrate
        const initial_concentration_of_base_molecule = _.cloneDeep(base_molecule_in_container[1]);
        const initial_concentration_of_acid_molecule = _.cloneDeep(acid_molecule_in_container[1]);

        if (base_molecule_in_container[1] === 0 || base_molecule_in_container[1] === 0) {
            return
        }

        // Create instances of protonated base molecule and deprotonated acid molecule
        const base_molecule_in_container_protonated = _.cloneDeep(base_molecule_in_container);
        const acid_molecule_in_container_deprotonated = _.cloneDeep(acid_molecule_in_container);

        // Deprotonate the acid molecule
        acid_molecule_in_container_deprotonated[0] = ConjugateBase(_.cloneDeep(acid_molecule_in_container[0]), logger);

        // Protonate the base molecule
        base_molecule_in_container_protonated[0] = ConjugateAcid(_.cloneDeep(base_molecule_in_container[0]), null, logger)
        // Look for any leaving groups and remove
        // Returns an array where the first item is the molecule minus the leaving group, and the second item is the leaving group
        const molecule_plus_leaving_group = RemoveLeavingGroup(base_molecule_in_container_protonated[0], logger)
        if (false !== molecule_plus_leaving_group) {
            // Not a reversible reaction so need to bother with equilibriums
            // Stabilise if required - eg if there is carbocation formed
            const moleculeManager = new MoleculeManager()
            // Return false if unsuccessful - this will immediately stabilise a carbocation by bonding it with an atom in the same molecule.
            const molecule_with_dative_bond_between_two_bonded_atoms = moleculeManager.addDativeBondBetweenBondedAtoms(null, molecule_plus_leaving_group[0], logger)
            if (false !== molecule_with_dative_bond_between_two_bonded_atoms) {
                base_molecule_in_container_protonated[0] = molecule_with_dative_bond_between_two_bonded_atoms            
            } else {
                base_molecule_in_container_protonated[0] = molecule_plus_leaving_group[0]
                base_molecule_in_container_protonated[0] = Stabilise(base_molecule_in_container_protonated[0], 0)
            }
            container.addReactant(molecule_plus_leaving_group[1], base_molecule_in_container_protonated[1])
            container.removeReactant(base_molecule_in_container, logger)
            container.removeReactant(acid_molecule_in_container, logger)
        } else {

            if (typeof base_molecule_in_container[0] !== "string" && typeof acid_molecule_in_container[0] !== "string") {
               
                // Set concentrations to match concentrations at equilibrium.
                // We now need to adjust the respective volumes according to equilibrium.
                // For now for Bronsted Lowery assume reactions are always reversible.
                // For ammonia + acetic acid this will be approx 1/30000 in favor of the products.
                const equilibrium_constant = EquilibriumConstant(acid_molecule_in_container[0], base_molecule_in_container_protonated[0], acid_molecule_in_container[1],base_molecule_in_container_protonated[1], logger);
            //  const equilibrium_constant = 30199.51720402019
                // Set pKa etc
                base_molecule_in_container[0] = MoleculeFactory(
                    base_molecule_in_container[0].atoms,
                )

                // Set pKa etc
                acid_molecule_in_container[0] = MoleculeFactory(
                    acid_molecule_in_container[0].atoms,
                )

                const products_preferred = ProductsOrReactantsFavoured(acid_molecule_in_container[0])(base_molecule_in_container_protonated[0]) === 1
                const equilibrium_concentrations = EquilibriumConcentrations(products_preferred, acid_molecule_in_container[1], base_molecule_in_container[1], equilibrium_constant, logger);
                base_molecule_in_container[1] = equilibrium_concentrations.B
                acid_molecule_in_container[1] = equilibrium_concentrations.HA
                base_molecule_in_container_protonated[1] = equilibrium_concentrations.CA
                acid_molecule_in_container_deprotonated[1] = equilibrium_concentrations.CB
            }
        }
        
        if (typeof base_molecule_in_container_protonated[0] !== "string") {
            base_molecule_in_container_protonated[0] = MoleculeFactory(
                base_molecule_in_container_protonated[0].atoms
            )
        }

        if (typeof acid_molecule_in_container_deprotonated[0] !== "string") {
            acid_molecule_in_container_deprotonated[0] = MoleculeFactory(
                acid_molecule_in_container_deprotonated[0].atoms
            )
        }

        // If base is generic then remove it from the container and also acid molecule
        // as a generic base will consume all the acid molecule
        if (typeof base_molecule_in_container[0] === "string") {
            base_molecule_in_container[1] = 0
            acid_molecule_in_container[1] = 0
        }

        // If acid is generic then remove it from the container and also the base 
        // molecule as a generic base will consume all the base molecule.
        if (typeof acid_molecule_in_container[0] === "string") {
            acid_molecule_in_container[1] = 0
            base_molecule_in_container[1] = 0
        }
        
        // Remove any reactant with 0 units.
        container.reactants = container.reactants.filter((reactant)=>{
            return reactant[1] > 0
        })

        // container.removeReactant(base_molecule_in_container_protonated, logger)
       // container.removeReactant(acid_molecule_in_container_deprotonated, logger)
        if (base_molecule_in_container_protonated[1] > 0) {
            container.addReactant(base_molecule_in_container_protonated[0], base_molecule_in_container_protonated[1], logger);
        }
        if (acid_molecule_in_container_deprotonated[1] > 0) {
            container.addReactant(acid_molecule_in_container_deprotonated[0], acid_molecule_in_container_deprotonated[1], logger);
        }
    

}


module.exports = BronstedLoweryAcidBase
