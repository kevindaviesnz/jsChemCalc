const Set = require('../Set')
const Constants = require("../Constants")
const { loggers } = require('winston')
const { P } = require('../factories/PeriodicTable')
const _ = require('lodash');

const Typecheck = require('../Typecheck')

const FunctionalGroups = (molecule) => {


        if (undefined === molecule) {
            throw new Error('Molecule is undefined')
        }

     const alcohol = function() {
        // COH
        // Look for neutral oxygen with one hydrogen bond and bonded to a carbon
        const oxygen = _.find(molecule.atoms, (atom)=>{
            return 'O' == atom.atomicSymbol 
                && 0 == atom.charge( molecule.atoms) 
                && 1 == atom.hydrogens(molecule.atoms).length 
                && 1 === atom.carbonBonds(molecule.atoms).length
        })

        if (undefined===oxygen) {
            return []
        }

        const carbon = _.find(oxygen.bonds(molecule.atoms), (bond)=>{
            return 'C' === bond.atom.atomicSymbol 
        })

        return [oxygen, carbon]

    }

    const protonatedAlcohol = function() {
        // C[O+]
        // Look for oxygen with two hydrogen bonds and bonded to a carbon
      //  console.log('protonatedAlcohol')
       // console.log(molecule.canonicalSmiles)
        const oxygen = _.find(molecule.atoms, (atom)=>{
            return 'O' == atom.atomicSymbol 
                && 1 == atom.charge( molecule.atoms) 
             //   && 2 == atom.hydrogens(molecule.atoms).length 
             //   && 1 === atom.carbonBonds(molecule.atoms).length
        })

        if (undefined===oxygen) {
            return []
        }

        const carbon_bond = _.find(oxygen.bonds(molecule.atoms), (bond)=>{
            return 'C' === bond.atom.atomicSymbol 
        })

        if (undefined === carbon_bond) {
            return []
        }
        
        //console.log(oxygen)

        return [oxygen, carbon_bond.atom]

    }

        const akylHalide = function() {
            // CX
            return []
        }

        const protonatedAmine = function() {
            // R[+]N(R)(R)
            // Amines are compounds that result from replacing one or more of the hydrogens bonded
            // to ammonia with a carbon-containing substituent.
            // Look for nitrogen with at least one carbon bond
            const nitrogen = _.find(molecule.atoms, (atom)=>{
                return 'N' == atom.atomicSymbol && 1 == atom.charge( molecule.atoms) && atom.carbonBonds(molecule.atoms).length > 0
            })

            if (undefined===nitrogen) {
                return []
            }

            const carbon_bonds = nitrogen.bonds(molecule.atoms).filter((bond)=>{
                return 'C' === bond.atom.atomicSymbol 
            })

            if (0 === carbon_bonds.length) {
                return []
            }

            const carbons = carbon_bonds.map((b)=>{
                return b.atom
            })

            return [nitrogen, ...carbons]
        }


        const amine = function() {
            // RN(R)(R)
            // Amines are compounds that result from replacing one or more of the hydrogens bonded
            // to ammonia with a carbon-containing substituent.
            // Look for nitrogen with at least one carbon bond
            const nitrogen = _.find(molecule.atoms, (atom)=>{
                return 'N' == atom.atomicSymbol && 0 == atom.charge( molecule.atoms) && atom.carbonBonds(molecule.atoms).length > 0
            })

            if (undefined===nitrogen) {
                return []
            }

            const carbons = nitrogen.bonds(molecule.atoms).filter((bond)=>{
                return 'C' === bond.atom.atomicSymbol 
            })

            return [nitrogen, ...carbons]
        }

        const nitrile = function() {
            // C#N
            // Look for nitrogen with triple bond to carbon
            const nitrogen = _.find(molecule.atoms, (atom)=>{
                const carbon_triple_bonds = atom.tripleBonds(molecule.atoms).filter((b)=>{
                    return b.bond_type === '#'
                })
                return 'N' == atom.atomicSymbol && 0 == atom.charge( molecule.atoms) &&  1 === carbon_triple_bonds.length
            })

            if (undefined===nitrogen) {
                return []
            }

            const carbon = _.find(nitrogen.bonds(molecule.atoms), (bond)=>{
                return 'C' === bond.atom.atomicSymbol && bond.bond_type === '#'
            })

            return [nitrogen, carbon]

        }

        const protonatedNitrile = function() {
            // C#N
            // Look for nitrogen with triple bond to carbon
            const nitrogen = _.find(molecule.atoms, (atom)=>{
                const carbon_triple_bonds = atom.tripleBonds(molecule.atoms).filter((b)=>{
                    return b.bond_type === '#'
                })
                return 'N' == atom.atomicSymbol && 1 == atom.charge( molecule.atoms) &&  1 === carbon_triple_bonds.length
            })

            if (undefined===nitrogen) {
                return []
            }

            const carbon = _.find(nitrogen.bonds(molecule.atoms), (bond)=>{
                return 'C' === bond.atom.atomicSymbol && bond.bond_type === '#'
            }).atom

            return [nitrogen, carbon]

        }

        const aldehyde = function() {
            // RC(=O)H
            // Look for neutral oxygen with double bond to carbon
            const oxygen = _.find(molecule.atoms, (atom)=>{
                return 'O' == atom.atomicSymbol && 0== atom.charge( molecule.atoms) && 1 == atom.doubleBonds(molecule.atoms).length
            })

            if (undefined===oxygen) {
                return []
            }

            const carbonal_carbon = oxygen.bonds(molecule.atoms)[0].atom

            const carbonal_hydrogens = carbonal_carbon.hydrogens(molecule.atoms)

            if (carbonal_hydrogens.length !== 1) {
                return []
            }

            return [oxygen, carbonal_carbon, carbonal_hydrogens[0]]
        }

        const carboxylicAcid = function() {
           
            // RC(=O)OH
            const oxygen = _.find(molecule.atoms, (atom)=>{
                return 'O' == atom.atomicSymbol && 0== atom.charge( molecule.atoms) && 1 == atom.doubleBonds(molecule.atoms).length
            })

            if (undefined===oxygen) {
                return []
            }

            const carbonal_carbon = oxygen.bonds(molecule.atoms)[0].atom
          
            // Look for non carbonyl oxygen attached to the carbonyl carbon
            const non_carbonyl_oxygen_bond = _.find(carbonal_carbon.bonds(molecule.atoms), (b)=>{
                return b.atom.atomicSymbol === 'O' && b.atom.bondType === ''
            })
            if (undefined !== non_carbonyl_oxygen_bond) {
                return [oxygen, carbonal_carbon, non_carbonyl_oxygen_bond.atom]
            } else {
                return []
            }
            x
        }

        const amide = function() {
            // RC(=O)N(C)(C)
            return []
        }

        const ketone = function() {

            if ([] === carboxylicAcid()) {
                return []
            }

            // RC(=O)R
            // Look for neutral oxygen with double bond to carbon
            const oxygen = _.find(molecule.atoms, (atom)=>{
                return 'O' == atom.atomicSymbol && 0== atom.charge( molecule.atoms) && 1 == atom.doubleBonds(molecule.atoms).length
            })

            if (undefined===oxygen) {
                return []
            }

            const carbonal_carbon = oxygen.bonds(molecule.atoms)[0].atom

            const carbonal_carbons = carbonal_carbon.bonds(molecule.atoms).filter(
                (b)=>{
                    return 'C' === b.atom.atomicSymbol
                }
            ).map((b)=>{
                return b.atom
            })

            return [oxygen, carbonal_carbon, ...carbonal_carbons]
        }

        const protonatedKetone = function() {
            // RC(=[O+])R
            // Look for positively charged oxygen with double bond to carbon
            const oxygen = _.find(molecule.atoms, (atom)=>{
                return 'O' == atom.atomicSymbol && 1== atom.charge( molecule.atoms) && 1 == atom.doubleBonds(molecule.atoms).length
            })

            if (undefined===oxygen) {
                return []
            }

            const carbonal_carbon = oxygen.bonds(molecule.atoms)[0].atom

            const carbonal_carbons = carbonal_carbon.bonds(molecule.atoms).filter(
                (b)=>{
                    return 'C' === b.atom.atomicSymbol
                }
            ).map((b)=>{
                return b.atom
            })

            return [oxygen, carbonal_carbon, ...carbonal_carbons]

        }

        const ester = function() {
            // RC(=O)OR
            return []
        }

        const ether = function() {
            return []
        }

        const alkane = function() {

            const atoms_no_hydrogens = molecule.atoms.atomsNoHydrogens()
            

            const non_carbons = atoms_no_hydrogens.filter((a)=>{
                return 'C' !== a.atomicSymbol
            })

            if (non_carbons.length > 0) {
                return []
            }

            const non_single_bonds = atoms_no_hydrogens.filter((a)=>{
                return 0 !== a.doubleBonds(molecule.atoms).length || 0 !== a.tripleBonds(molecule.atoms).length
            })

            if (non_single_bonds.length > 0) {
                return []
            }

            return atoms_no_hydrogens
        }

        const alkene = function() {

            const atoms_no_hydrogens = molecule.atoms.atomsNoHydrogens()
            
            const non_carbons = atoms_no_hydrogens.filter((a)=>{
                return 'C' !== a.atomicSymbol
            })

            if (non_carbons.length > 0) {
                return []
            }

            const double_bond_pairs = []

            atoms_no_hydrogens.map((a)=>{
                const double_bonds = a.doubleBonds(molecule.atoms)
                if (0 !== double_bonds.length || 0 !== a.tripleBonds(molecule.atoms).length) {
                    double_bond_pairs.push([a, double_bonds[0].atom])
                }
                return a
            })

            return double_bond_pairs
        }

        const imine = function() {
            // N=C
            const nitrogen = _.find(molecule.atoms, (atom)=>{
                return 'N' == atom.atomicSymbol && 0 == atom.charge( molecule.atoms) && 1 === atom.doubleBonds(molecule.atoms).length
            })

            if (undefined===nitrogen) {
                return []
            }

            const bond_to_carbon = nitrogen.bonds(molecule.atoms).filter((bond)=>{
                return 'C' === bond.atom.atomicSymbol && bond.bond_type === '='
            }).pop()

            if (undefined === bond_to_carbon) {
                return []
            }

            return [nitrogen, bond_to_carbon.atom]
        }

        const glycol = function() {
            // Look for two adjacent -OH groups
            const terminal_oxygen = _.find(molecule.atoms, (a)=>{
                return 'O' === a.atomicSymbol && a.isTerminalAtom(molecule.atoms)
            })
            if (undefined === terminal_oxygen) {
                return false
            }
            
            const terminal_oxygen_bonds = terminal_oxygen.bonds(molecule.atoms)

            // 27 April 2023
            const carbonyl_carbon_bond = _.find(terminal_oxygen_bonds, (b)=>{
                return "C" === b.atom.atomicSymbol
            })

            if (undefined === carbonyl_carbon_bond) {
                return false
            }

            const carbonyl_carbon = carbonyl_carbon_bond.atom

            if(undefined === carbonyl_carbon) {
                return false
            }

            // Look for adjacent terminal oxygen eg C(O)C(O)
            const carbonyl_carbon_carbon_with_terminal_oxygen_bonds = carbonyl_carbon.bonds(molecule.atoms).filter((b)=>{
                if ('C' !== b.atom.atomicSymbol) {
                    return false
                }
                const child_bonds = b.atom.bonds(molecule.atoms)
                const o_atom_bond = _.find(child_bonds, (o_b)=>{
                    return 'O' === o_b.atom.atomicSymbol && o_b.atom.isTerminalAtom(molecule.atoms)
                })
                return undefined !== o_atom_bond
            })
            if (undefined === carbonyl_carbon_carbon_with_terminal_oxygen_bonds) {
                return false
            }

            if (carbonyl_carbon_carbon_with_terminal_oxygen_bonds.length > 0) {
                return true
            }

        }



        return {
            'alcohol': alcohol(),
            'protonatedAlcohol': protonatedAlcohol(),
            'alkane': alkane(),
            'akylHalide': akylHalide(),
            'amine' : amine(),
            'nitrile' : nitrile(),
            'aldehyde' : aldehyde(),
            'carboxylicAcid' : carboxylicAcid(),
            'amide' : amide(),
            'imine' : imine(),
            'ketone': ketone(),
            'alkene': alkene(),
            'ester' : ester(),
            'ether' : ether(),
            'glycol' : glycol(),
            'protonatedAmine':protonatedAmine(),
            'protonatedCarboxylicAcid':[],
            'protonatedKetone':protonatedKetone(),
            'protonatedNitrile':protonatedNitrile()
         }



   
}

module.exports = FunctionalGroups











