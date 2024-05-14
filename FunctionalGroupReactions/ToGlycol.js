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
Here we have a glycole and we are applying different reactions in reverse to determine possible pathways to get to the glycol.
*/

// A glycol is a molecule that has two -OH groups.
const ToGlycol = function(
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


        //container_after_previous_mechanism_was_applied.substrate.atoms.checkBonds('DeprotonateReverse', logger)
        let computed_previous_container = _.cloneDeep(container_after_previous_mechanism_was_applied)
        let carbonyl_carbon_carbon_with_terminal_oxygen_bonds

        // Dihyroxylation (alkene -> glycol)
        // @see https://chem.libretexts.org/Bookshelves/Organic_Chemistry/Map%3A_Organic_Chemistry_(Smith)/12%3A_Oxidation_and_Reduction/12.09%3A_Dihydroxylation
        // Look for oxygen atom bonded to Os atom and also bonded to carbon atom
        const terminal_oxygen = _.find(computed_previous_container.getSubstrate()[0].atoms, (a)=>{
            if('O' !== a.atomicSymbol || a.isTerminalAtom(computed_previous_container.getSubstrate()[0].atoms) === false) {
                return false
            }

            const terminal_oxygen_bonds = a.bonds(computed_previous_container.getSubstrate()[0].atoms)
            const carbonyl_carbon = _.find(terminal_oxygen_bonds, (b)=>{
                return "C" === b.atom.atomicSymbol
            }).atom

            // Dihydroxylation
            // @see Org Chem for dummies P203
            // Look for adjacent terminal oxygen eg C(O)C(O)
            carbonyl_carbon_carbon_with_terminal_oxygen_bonds = carbonyl_carbon.bonds(computed_previous_container.getSubstrate()[0].atoms, logger).filter((b)=>{
                if ('C' !== b.atom.atomicSymbol) {
                    return false
                }
                const child_bonds = b.atom.bonds(computed_previous_container.getSubstrate()[0].atoms, logger)
                const o_atom_bond = _.find(child_bonds, (o_b)=>{
                    return 'O' === o_b.atom.atomicSymbol && o_b.atom.isTerminalAtom(computed_previous_container.getSubstrate()[0].atoms, logger)
                })
                return undefined !== o_atom_bond
            })

            return carbonyl_carbon_carbon_with_terminal_oxygen_bonds.length > 0

        })


        let computed_previous_container_cloned = _.cloneDeep(computed_previous_container)
        // @todo can have more than one adjacent oxygen
        const adjacent_carbon = carbonyl_carbon_carbon_with_terminal_oxygen_bonds[0].atom
        const adjacent_oxygen = _.find(adjacent_carbon.bonds(computed_previous_container.getSubstrate()[0].atoms, logger), (b)=>{
                             return 'O' === b.atom.atomicSymbol && b.atom.isTerminalAtom(computed_previous_container.getSubstrate()[0].atoms)
        }).atom
                         
                         // Create oxmium dioxide molecule that we will bond to the two oxygens
                         const oxmium_dioxide = MoleculeFactory(
                             AtomsFactory("O=[Os]=O", logger),
                             false,
                             false,
                             logger
                         )
 
                         const os_atom = _.find(oxmium_dioxide.atoms, (a)=>{
                             return 'Os' === a.atomicSymbol
                         })
 
                         // Remove proton from terminal oxygen
                         const proton = terminal_oxygen.hydrogens(computed_previous_container.getSubstrate()[0].atoms)[0]
                         computed_previous_container.getSubstrate()[0].atoms = proton.breakBond(terminal_oxygen, computed_previous_container.getSubstrate()[0], logger)
                         // Remove proton from atom
                         _.remove(computed_previous_container.getSubstrate()[0].atoms, (a)=>{
                             return a.atomId === proton.atomId
                         })
 
                         // Remove proton from adjacent oxygen
                         const a_proton = adjacent_oxygen.hydrogens(computed_previous_container.getSubstrate()[0].atoms)[0]
                         computed_previous_container.getSubstrate()[0].atoms = a_proton.breakBond(adjacent_oxygen, computed_previous_container.getSubstrate()[0], logger)
                         // Remove proton from atom
                         _.remove(computed_previous_container.getSubstrate()[0].atoms, (a)=>{
                             return a.atomId === proton.atomId
                         })
 
 
                         terminal_oxygen.makeDativeBond(os_atom, false, computed_previous_container.getSubstrate()[0].atoms, logger)
                         adjacent_oxygen.makeDativeBond(os_atom, false, computed_previous_container.getSubstrate()[0].atoms, logger)
                         computed_previous_container.getSubstrate()[0].atoms = [...computed_previous_container.getSubstrate()[0].atoms, ...oxmium_dioxide.atoms]
                         computed_previous_container.getSubstrate()[0].smiles_string = computed_previous_container.getSubstrate()[0].canonicalSmiles(false, computed_previous_container.getSubstrate()[0].atoms, logger)
                         computed_previous_container.reagents = []
                         const water = MoleculeFactory(
                             AtomsFactory("O", logger),
                             false,
                             false,
                             logger
                         )
                         computed_previous_container.addReagent(water, 1, logger)
                         if (pathways.length > 0) {
                            pathways[pathways.length-1].push([computed_previous_container])
                         } else {
                            pathways.push([computed_previous_container])
                         }
 
                         const d_oxygen = _.find(computed_previous_container.getSubstrate()[0].atoms, (a)=>{
                             if ("O" !== a.atomicSymbol && "" === a.charge(computed_previous_container.getSubstrate()[0].atoms, logger)) {
                                 return false
                             }
                             const d_oxygen_bonds = a.bonds(computed_previous_container.getSubstrate()[0].atoms, logger)
                             const os_bond = _.find(d_oxygen_bonds, (b)=>{
                                 return "Os" === b.atom.atomicSymbol
                             })
                             if (undefined === os_bond) {
                                 return false
                             }
                             const c_bond = _.find(d_oxygen_bonds, (b)=>{
                                 return "C" === b.atom.atomicSymbol
                             })
                             return undefined !== c_bond
                         })
                     
                         computed_previous_container_cloned = _.cloneDeep(computed_previous_container)
                         // Break bond between oxygen and carbon. This should create a carbocation.
                         // CO[Os] -> C O[Os]
                         const d_oxygen_carbon = _.find(d_oxygen.bonds(computed_previous_container.getSubstrate()[0].atoms, logger), (b) =>{
                             return "C" === b.atom.atomicSymbol
                         }).atom
                         computed_previous_container.getSubstrate()[0].atoms = d_oxygen_carbon.breakDativeBond(d_oxygen, computed_previous_container.getSubstrate()[0], logger)
                         const m_os_atom = _.find(d_oxygen.bonds(computed_previous_container.getSubstrate()[0].atoms, logger), (b) =>{
                             return "Os" === b.atom.atomicSymbol
                         }).atom
                         
                         // Add another bond between oxygen and osidium atom.
                         // O[Os] => O=[Os]
                         computed_previous_container.getSubstrate()[0].atoms = d_oxygen.makeDativeBond(m_os_atom, false, computed_previous_container.getSubstrate()[0].atoms, logger)
                         
                         
                         // Add another bond between the second oxygen bonded to the osidium atom and the osidium atom.
                         // O[Os] => O=[Os]
                         const d_2_oxygen = _.find(m_os_atom.bonds(computed_previous_container.getSubstrate()[0].atoms, logger), (b)=>{
                             return "O" === b.atom.atomicSymbol && b.atom.atomId !== d_oxygen.atomId
                         }).atom
                         computed_previous_container.getSubstrate()[0].atoms = d_2_oxygen.makeDativeBond(m_os_atom, false, computed_previous_container.getSubstrate()[0].atoms, logger)
             
                         computed_previous_container.getSubstrate()[0].smiles_string = computed_previous_container.getSubstrate()[0].canonicalSmiles(false, computed_previous_container.getSubstrate()[0].atoms, logger)
             
                         // Break bond between the second oxygen and the carbon that it is bonded to. This should create two molecules. Carbon should keep the
                         // electron pair so we can form a double bond between the carbon and the carbocation (d_oxygen_carbon).
                         const d_2_oxygen_carbon = _.find(d_2_oxygen.bonds(computed_previous_container.getSubstrate()[0].atoms, logger), (b) =>{
                             return "C" === b.atom.atomicSymbol
                         }).atom
                         let reagent_atoms = ExtractAtomGroup(
                             computed_previous_container.getSubstrate()[0],
                             computed_previous_container.getSubstrate()[0].atoms,
                             d_2_oxygen_carbon, // parent 
                             d_2_oxygen, // eg nitrogen
                             logger
                         )
                         const reagent = MoleculeFactory (
                             reagent_atoms,
                             false,
                             false,
                             logger
                         )
                         reagent.smiles_string = reagent.canonicalSmiles(false, reagent.atoms, logger)
                         computed_previous_container.reagents = []
                         computed_previous_container.addReagent(reagent, 1, logger)
                         d_2_oxygen_carbon.electronPairs = d_2_oxygen_carbon.electronPairs.filter((p)=>{
                             return p.length > 1
                         })
 
                         computed_previous_container.getSubstrate()[0].atoms = RemoveAtoms(
                             computed_previous_container.getSubstrate()[0],
                             reagent.atoms,
                             logger
                         )
                             
                         // Determine molecule id
                         const temp = container_after_previous_mechanism_was_applied.substrate.atoms.filter((a)=>{
                            return 'C' === a.atomicSymbol
                        })[0].electronPairs[0][0]
                        const molecule_id = temp.split(".")[1].substring(0, temp.split(".")[1].length-1)
                         
                         // Add electrons to carbon so we can bond it to the carbocation.
                         // @todo replace 110 with random number
                         d_2_oxygen_carbon.electronPairs.push(['C.' + molecule_id + '110'])
                         d_2_oxygen_carbon.electronPairs.push(['C.' + molecule_id + '111'])
 
                         // Bond the oxygen carbons creating a double bond.
                         computed_previous_container.getSubstrate()[0].atoms = d_2_oxygen_carbon.makeDativeBond(d_oxygen_carbon, false, container_after_previous_mechanism_was_applied.substrate.atoms, logger)
                         computed_previous_container.getSubstrate()[0].smiles_string = null
                         pathways[pathways.length-1].push(_.cloneDeep(computed_previous_container))
                         computed_previous_container = computed_previous_container_cloned
 


            

        return pathways


    } catch(e) {
        logger.log('error', '[ToGlycol] ' + e)
        console.log(e.stack)
        process.exit()
    }


}

module.exports = ToGlycol