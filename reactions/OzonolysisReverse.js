const Constants = require("../Constants")
const Typecheck = require('../Typecheck')
const _ = require('lodash');
const AtomFactory = require('../factories/AtomFactory')
const AtomsFactory = require('../factories/AtomsFactory')
const MoleculeFactory = require('../factories/MoleculeFactory')
const FormatAs = require('../factories/FormatAs')
const Synthesise = require('../AI/Synthesise')
const Reverse = require('../mechanisms/Reverse')
const uniqid = require('uniqid');
const LeavingGroupList = require('../actions/LeavingGroupList')
const Hydrate = require('../mechanisms/Hydrate')
const Protonate = require('../mechanisms/Protonate');
const AcidBase = require("../reactions/AcidBase");
const BronstedLoweryBaseAtom = require('../reflection/BronstedLoweryBaseAtom');
const { C } = require("../factories/PeriodicTable");
const AddAtom = require("../actions/AddAtom");
const ExtractAtomGroup = require('../actions/ExtractAtomGroup');
const { at } = require("lodash");
const RemoveAtoms = require("../actions/RemoveAtoms")

const env = require('../env')

/*
Important note:
Here we have a ketone and we are applying different reactions in reverse to determine possible pathways to get to the ketone.
*/

const OzonolysisReverse = function(
    container_after_previous_mechanism_was_applied, 
    logger
) {


    try {

        Typecheck(
            {name: "container_after_previous_mechanism_was_applied", value: container_after_previous_mechanism_was_applied, type: "object"},
            {name: "container_after_previous_mechanism_was_applied.substrate", value: container_after_previous_mechanism_was_applied.substrate, type: "object"},
            {name: "logger", value: logger, type: "object"}
        )

        const pathways = []

        let computed_previous_container = _.cloneDeep(container_after_previous_mechanism_was_applied)

        const side_product = computed_previous_container.side_products[0]
        if (undefined === side_product) {
            return false
        }

        const substrate_ketone_atoms = computed_previous_container.getSubstrate()[0].functionalGroups(logger).ketone // [oxygen, carbonal_carbon, ...carbonal_carbons]

        const side_product_ketone_atoms = side_product.functionalGroups(logger).ketone // [oxygen, carbonal_carbon, ...carbonal_carbons]

        if (substrate_ketone_atoms.length === 0) {
            return false
        }

       // const substrate_carbonyl_oxygen = substrate_ketone_atoms[0] // O7
        const substrate_carbonyl_oxygen_index = substrate_ketone_atoms[0].atomIndex(computed_previous_container.getSubstrate()[0].atoms)
        const substrate_carbonyl_oxygen = computed_previous_container.getSubstrate()[0].atoms[substrate_carbonyl_oxygen_index] // O7
        const substrate_carbonyl_carbon_index = substrate_ketone_atoms[1].atomIndex(computed_previous_container.getSubstrate()[0].atoms)
        const substrate_carbonyl_carbon = computed_previous_container.getSubstrate()[0].atoms[substrate_carbonyl_carbon_index] // C2

        // Determine molecule id
        const temp = container_after_previous_mechanism_was_applied.substrate.atoms.filter((a)=>{
            return 'C' === a.atomicSymbol
        })[0].electronPairs[0][0]
        const molecule_id = temp.split(".")[1].substring(0, temp.split(".")[1].length-1)

        // Ozonolysis
        // @see Org Chem for Dummies p205
        // @see https://byjus.com/chemistry/ozonolysis-of-alkenes-alkynes-mechanism/
        if (computed_previous_container.side_products.length === 1) {
            if (side_product_ketone_atoms.length > 0) {
                const computed_previous_container_cloned = _.cloneDeep(computed_previous_container)
                
                const side_product_carbonyl_oxygen_index =  side_product_ketone_atoms[0].atomIndex(side_product.atoms) 
                const side_product_carbonyl_oxygen = side_product.atoms[side_product_carbonyl_oxygen_index] // O1
                const side_product_carbonyl_carbon_index =  side_product_ketone_atoms[1].atomIndex(side_product.atoms) 
                const side_product_carbonyl_carbon = side_product.atoms[side_product_carbonyl_carbon_index] // C3
               
               // Reverse reduction of "oxonide"
               const new_oxygen_atom = AtomFactory("O", 0, 0, 0, "", molecule_id, logger)
               // Bond carbonyl carbon atom from each ketone (substrate, side_product) to the oxygen atom creating a new substrate, and breaking the O=C bonds.
               // Shift bond between substrate carbonyl oxygen and the substrate carbonyl carbon to the new oxygen atom
               computed_previous_container.getSubstrate()[0].atoms = substrate_carbonyl_carbon.shiftBond(substrate_carbonyl_oxygen, new_oxygen_atom, computed_previous_container.getSubstrate()[0], logger)
               // Shift bond between side product carbonyl oxygen and the side product carbonyl carbon to the new oxygen atom
               computed_previous_container.getSubstrate()[0].atoms = side_product_carbonyl_carbon.shiftBond(side_product_carbonyl_oxygen, new_oxygen_atom, computed_previous_container.getSubstrate()[0], logger)
               computed_previous_container.side_products[0].atoms.map((a)=>{
                computed_previous_container.getSubstrate()[0].atoms.push(a)
                return a
           })
               computed_previous_container.getSubstrate()[0].atoms.push(new_oxygen_atom)
               computed_previous_container.side_products = []
               // Bond the original substrate carbonyl oxygen and former side_product carbonyl oxygen together.
              // computed_previous_container.getSubstrate()[0].atoms = substrate_carbonyl_oxygen.makeDativeBond(side_product_carbonyl_oxygen, false, computed_previous_container.getSubstrate()[0].atoms, logger)
               substrate_carbonyl_oxygen.makeBond(side_product_carbonyl_oxygen, logger)
               // Add container to pathways
               if (pathways.length > 0) {
                    pathways[pathways.length-1].push([_.cloneDeep(computed_previous_container)])
               } else {
                     pathways.push([_.cloneDeep(computed_previous_container)])
               }

               // Form carbonyl oxide and ketone molecules.
               // Shift bond between carbon and the oxygen atom (former substrate carbonyl oxygen) that is bonded to an oxygen atom to the carbon 
               // and the oxygen atom  (former new oxygen atom) that is bonded to two carbons,
               // creating a double bond between the carbon and the oxygen atom that is bonded to two carbons.
               computed_previous_container.getSubstrate()[0].atoms = substrate_carbonyl_carbon.shiftBond(substrate_carbonyl_oxygen, new_oxygen_atom, computed_previous_container.getSubstrate()[0], logger)
               // Break bond between the oxygen atom (former new oxygen atom) above and the other carbon atom (former side product carbonyl carbon) it is bonded to. 
               // This should result in two molecules.
               // Leaving group
              //computed_previous_container.getSubstrate()[0].atoms = new_oxygen_atom.breakDativeBond(side_product_carbonyl_carbon, computed_previous_container.getSubstrate()[0], logger)
              let new_side_product_atoms = ExtractAtomGroup(
                computed_previous_container.getSubstrate()[0],
                computed_previous_container.getSubstrate()[0].atoms,
                new_oxygen_atom, // parent 
                side_product_carbonyl_carbon, 
                logger
            )
                // @todo Carbon atom should not have free electrons after calling ExtractAtomGroup()
                // @hack
                side_product_carbonyl_carbon.electronPairs =  side_product_carbonyl_carbon.electronPairs.filter((ep)=>{
                    return ep.length > 1
                })
                const new_side_product = MoleculeFactory (
                    new_side_product_atoms,
                    false,
                    false,
                    logger
                )
               // Add a bond between the carbon atom (former side product carbonyl carbon) above and the oxygen atom (former side product carbonyl oxygen) that it is still
               // bonded to.
               // 9 Mar 2023
               //computed_previous_container.getSubstrate()[0].atoms = side_product_carbonyl_oxygen.makeDativeBond(side_product_carbonyl_carbon, false, computed_previous_container.getSubstrate()[0].atoms, logger)
                new_side_product.atoms = side_product_carbonyl_oxygen.makeDativeBond(side_product_carbonyl_carbon, false, new_side_product.atoms, logger)
                computed_previous_container.side_products = []
                computed_previous_container.side_products.push(new_side_product)
               // Add container to pathways
               pathways[pathways.length-1].push([_.cloneDeep(computed_previous_container)])

               // Shift bond between the side product carybonyl carbon and the side product carbonyl oxygen to the substrate carbonyl carbon.
               // Shift bond between substrate carbonyl carbon and the former new oxygen atom to the substrate oxygen atom.
               // Add container to pathways.
               pathways[pathways.length-1].push([_.cloneDeep(computed_previous_container)])
                
               // Form molonzonide intermediate
               // Shift bond from the substrate carbonyl carbon - new oxygen atom to substrate carbonyl carbon - side product carboxyl carbon.
               // New oxygen atom should now be single bonded to the substrate carbonyl carbon.
               // This will bond the substrate and side product together
               // Add new side product atoms to substrate.
               computed_previous_container.side_products[0].atoms.map((a)=>{
                    computed_previous_container.getSubstrate()[0].atoms.push(a)
                    return a
               })
               computed_previous_container.getSubstrate()[0].atoms = substrate_carbonyl_carbon.shiftBond(new_oxygen_atom, side_product_carbonyl_carbon, computed_previous_container.getSubstrate()[0], logger)
               // Shift bond from side product carbonyl oxygen - side product carbonyl carbon to side product carbonyl oxygen - substrate carbonyl oxygen.
               // forming a temporary double bond.
               computed_previous_container.getSubstrate()[0].atoms = side_product_carbonyl_oxygen.shiftBond(side_product_carbonyl_carbon, substrate_carbonyl_oxygen, computed_previous_container.getSubstrate()[0], logger)
               // Shift bond from side product carbonyl oxygen - substrate carbonyl oxygen to substrate carbonyl oxygen - new oxygen atom.
             //  throw new Error('Fails to bond new oxygent atom to substrate carbonyl oxygen')
               computed_previous_container.getSubstrate()[0].atoms = substrate_carbonyl_oxygen.shiftBond(side_product_carbonyl_oxygen, new_oxygen_atom, computed_previous_container.getSubstrate()[0], logger)

               // Remove new side product.
               computed_previous_container.side_products = []
            
               // Form alkene, ozone molecules.
               // Shift bond from the substrate carbonyl carbon - new oxygen atom to substrate carbonyl carbon - side product carbonyl carbon, forming a
               // C=C bond. Carbon will now have 5 bonds.
               computed_previous_container.getSubstrate()[0].atoms = substrate_carbonyl_carbon.shiftBond(new_oxygen_atom, side_product_carbonyl_carbon, computed_previous_container.getSubstrate()[0], logger)
               // Break side product carbonyl carbon - side product carbonyl oxygen bond creating two molecules.
               let ozone_atoms = ExtractAtomGroup(
                computed_previous_container.getSubstrate()[0],
                computed_previous_container.getSubstrate()[0].atoms,
                side_product_carbonyl_carbon, // parent // sp3
                side_product_carbonyl_oxygen, // sp1
                logger
               )

               // Bond side product carbonyl oxygen to substrate carbonyl oxygen creating a double bond. This is the reagent and should be ozone.
               ozone_atoms = side_product_carbonyl_oxygen.makeDativeBond(substrate_carbonyl_oxygen, false, ozone_atoms, logger)

               // @todo For further investigation. ExtractAtomGroup() does not remove the side_product_carbonyl_carbon - side_product_carbonyl_oxygen
               // pair from side_product_carbonyl_oxygen.
               // @hack
               side_product_carbonyl_oxygen.electronPairs = side_product_carbonyl_oxygen.electronPairs.map((ep)=>{
                    if (ep.length == 1) {
                        return ep
                    }
                    const parts = ep[1].split(".")
                    if(side_product_carbonyl_carbon.atomId === parts[1]) {
                        ep.pop()
                    }
                    return ep
               })

               const ozone = MoleculeFactory(
                    ozone_atoms, 
                    false, 
                    false, 
                    logger
               )

               computed_previous_container.reagents = []
               computed_previous_container.addReagent(ozone, 1, logger)
               pathways[pathways.length-1].push([_.cloneDeep(computed_previous_container)])

               computed_previous_container = computed_previous_container_cloned

            }
        }
        
        return pathways


    } catch(e) {
        logger.log('error', '[ToKetone] ' + e)
        console.log(e.stack)
        process.exit()
    }


}

module.exports = OzonolysisReverse