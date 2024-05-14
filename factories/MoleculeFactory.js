const AtomsFactory = require('./AtomsFactory')
const AtomFactory = require('./AtomFactory')
const pKaFn = require('../reflection/pKa')
const Typecheck = require('../Typecheck')
const Constants = require('../Constants')
const { LoggerLevel } = require('mongodb')
const _ = require('lodash');
const { createLogger } = require('winston')
const FunctionalGroups = require('../reflection/FunctionalGroups')
const FormatAs = require('../factories/FormatAs')
const { C } = require('./PeriodicTable')


const MoleculeFactory = function(
    atoms,
    is_conjugate_base,
    is_conjugate_acid,
)  {

	const all_atoms = _.cloneDeep(atoms)
    
/**
*/



        // Check atoms for broken bonds
        // For each atom check if the atom has at least one bond
        /**
        */
        const moleculePKA = function(molecule) {
			//console.log(this)
			const functionalGroups = molecule.functionalGroups;
			const pKa = pKaFn(molecule);

			if (typeof pKa === "number") {
				return pKa
			}

			const PKas = [
				functionalGroups.alcohol.length && pKa.alcohol,
				functionalGroups.protonatedAlcohol.length && pKa.protonatedAlcohol,
				functionalGroups.protonatedAmine.length && pKa.protonatedAmine,
				functionalGroups.alkane.length && pKa.alkane,
				functionalGroups.akylHalide.length && pKa.akylHalide,
				functionalGroups.amine.length && pKa.amine,
				functionalGroups.nitrile.length && pKa.nitrile,
				functionalGroups.protonatedNitrile.length && pKa.protonatedNitrile,
				functionalGroups.aldehyde.length && pKa.aldehyde,
				functionalGroups.carboxylicAcid.length && pKa.carboxylicAcid,
				functionalGroups.amide.length && pKa.amide,
				functionalGroups.ketone.length && pKa.ketone,
				functionalGroups.ester.length && pKa.ester,
				functionalGroups.ether.length && pKa.ether,
				functionalGroups.protonatedKetone.length && pKa.protonatedKetone,
				molecule.canonicalSmiles === 'O[S](=O)(=O)O' && pKa.sulphuricAcid,
				molecule.canonicalSmiles === '[O-][S](=O)(=O)O' && pKa.protonatedSulphuricAcid,
				molecule.canonicalSmiles === 'O' && pKa.water,
				molecule.canonicalSmiles === '[O-]' && pKa.hydroxide,
				molecule.canonicalSmiles === '[O+]' && pKa.hydronium,
				molecule.canonicalSmiles === '[H+]' && pKa.proton,
			].filter(Boolean).sort((a, b) => b - a);

			return PKas.length ? PKas[0] : null;
		}


        const molecularFormula = () =>{
            return ''
        }

        const CID = () => {
            return ''
        }

        const IUPACName = () => {
            return ''
        }

        const heavyAtomCount = () => {
            return null
        }

        const tags = () => {
            return []
        }

/**
*/
        const netDoubleBondCount = function(molecule) {
	  const doubleBondsCount = molecule.atoms.reduce((carry, atom, index, arr) => {
	    carry += atom.doubleBonds(arr).length;
	    return carry;
	  }, 0);

	  return doubleBondsCount / 2;
	};

/**
*/
	const netCharge = function(molecule) {

	  const chargeSum = molecule.atoms.reduce((carry, atom, index, arr) => {
	    carry += atom.charge(arr);
	    return carry;
	  }, 0);

	  return chargeSum;
	};


        const charge = () => {

        }

/**
*/
        const compressed = function(atoms) {
	  Typecheck(
	    {name: "atoms", value: atoms, type: "array"}
	  )

	  return atoms.map((atom) => {
	    if (atom.atomicSymbol === 'H') {
	      return atom
	    }

	    const bonds = atom.bonds(atoms).map((bond) => {
	      return bond.bond_type + bond.atom.atomicSymbol + bond.atom.atomId
	    })

	    return {
	      atomId: atom.atomId,
	      atomicSymbol: atom.atomicSymbol,
	      charge: atom.charge(atoms),
	      bonds: JSON.stringify(bonds),
	      electrons: JSON.stringify(atom[Constants().electron_index])
	    }
	  })
	}


	const id = function() {
	  const uniqid = require('uniqid');
	  return uniqid().substr(uniqid().length - 3, 3);
	};
	
/**

*/

const functionalGroups = (molecule) => {
	molecule.canonicalSmiles = FormatAs(molecule).SMILES();
	//this.atoms = atoms || this.atoms
	const functional_groups = FunctionalGroups(molecule)
	return functional_groups
}


const isWeakBase = function(molecule) {

			const smiles = FormatAs(molecule).SMILES();

			// hydrogen sulphate
			if ('[O-][S](=O)(=O)O' === smiles) {
				return true
			}
	
			// Molecules with the 'CN' functional group are weak bases
			const weakBaseFunctionalGroup = "CN";
			return smiles.includes(weakBaseFunctionalGroup);

}

const isWeakLewisBase = function(molecule) {

	const smiles = FormatAs(molecule).SMILES();

	// Molecules with the 'CN' functional group are weak bases (not correct)
	//const weakBaseFunctionalGroup = "CN";
	//return smiles.includes(weakBaseFunctionalGroup);
	// @todo
	return false
}

const isStrongLewisBase = function(molecule) {

	  // For now just return true if the molecule is an amine
	  return functionalGroups(molecule).amine.length > 0;

}

const isStrongAcid = function(molecule) {

	  if (molecule === "A+:") {
		return true;
	  }

	  if (isWeakBase(molecule)) {
		// Most weak bases are not strong acids.
		return false;
	  }

	  const smiles = FormatAs(molecule).SMILES();

	  // Sulfuric acid and sulfonic acid are strong acids
	  const strongAcids = ["OS(=O)(=O)O", "O[S](=O)(=O)O"];
	  return strongAcids.includes(smiles);
}

const isHydrohalicAcid = function(molecule) {
	return molecule.atoms.length === 2 && molecule.atoms[0].atomicSymbol === 'H' && molecule.atoms[1].isHalide()
}

const bonds =  function(molecule) {
	const bonds = molecule.atoms.filter((atom)=>{
		return atom.atomicSymbol !== 'H'
	}).map((atom=>{
		const b = []
		const bonds = atom.bonds(molecule.atoms)
		bonds.map((bond)=>{
			const parent_charge = bond.parent.charge()
			const child_charge = bond.atom.charge()
			const parent = parent_charge !== 0?'[' + bond.parent.atomicSymbol + '<' + parent_charge + '>]':bond.parent.atomicSymbol
			const child = child_charge !== 0?'[' + bond.atom.atomicSymbol + '<' + child_charge + '>]':bond.atom.atomicSymbol
			b.push(parent + bond.parent.index + bond.bondType + child + bond.atom.index)
			return b
		})
		return b
	}))
	return bonds
}

const hasCarbocation = function(molecule) {
    return undefined !== _.find(molecule.atoms, (atom)=>{
       return atom.isCarbocation(molecule.atoms)
    })
}

const hasElectrophilicCarbon = function(molecule) {
    return undefined !== _.find(molecule.atoms, (atom)=>{
       if (atom.atomicSymbol === 'C') {
           if (atom.isCarbocation(molecule.atoms)) {
               return true
           }
           // Look for C=[O+] bond
           return undefined !== _.find(atom.doubleBonds(molecule.atoms), (bond)=>{
               return bond.atom.atomicSymbol === 'O' && bond.atom.charge(molecule.atoms) === 1
           })
       }
       return false
    })
}

/**
*/
	const molecule = {
	    id: id(),
	    conjugateBase: is_conjugate_base,
	    conjugateAcid: is_conjugate_acid,
	    atoms: Object.values(all_atoms)
	 };

	 molecule.functionalGroups = functionalGroups(molecule)
	 

	 
	 
/**
*/
       
	    molecule.canonicalSmiles = FormatAs(molecule).SMILES();
	    molecule.molecularFormula = molecularFormula();
	    molecule.CID = CID();
	    molecule.IUPACName = IUPACName();
	    molecule.charge = charge();
	    molecule.heavyAtomCount = heavyAtomCount();
	    molecule.tags = tags();
	    molecule.netCharge = netCharge(molecule);
	    molecule.netDoubleBondCount = netDoubleBondCount(molecule);
	    molecule.compressed = compressed(atoms);
		molecule.isHydrohalicAcid = isHydrohalicAcid(molecule)
		molecule.bonds = bonds(molecule)

		molecule.isSubstrate = false

		molecule.pKa = moleculePKA(molecule)
		molecule.hasCarbocation = hasCarbocation(molecule)
		molecule.hasElectrophilicCarbon = hasElectrophilicCarbon(molecule)

	return molecule

        


}

module.exports = MoleculeFactory
