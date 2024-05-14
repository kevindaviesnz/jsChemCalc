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
    logger
)  {


	const all_atoms = _.cloneDeep(atoms)
    
    try {

        Typecheck(
            {name: "atoms", value: atoms, type: "array"},
            {name: "is_conjugate_base", value: is_conjugate_base, type: 'boolean'},
            {name: "is_conjugate_acid", value: is_conjugate_acid, type: 'boolean'},
            {name: "logger", value: logger, type: "object"},
        )

/**
*/

        // Check atoms for broken bonds
        // For each atom check if the atom has at least one bond
        /**
        */
        const moleculePKA = function() {
			//console.log(this)
			const functionalGroups = this.functionalGroups(logger);
			const pKa = pKaFn(this, logger);
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
				canonicalSmiles(false, atoms, logger) === 'O[S](=O)(=O)O' && pKa.sulphuricAcid,
				canonicalSmiles(false, atoms, logger) === '[O-][S](=O)(=O)O' && pKa.protonatedSulphuricAcid,
				canonicalSmiles(false, atoms, logger) === 'O' && pKa.water,
				canonicalSmiles(false, atoms, logger) === '[O-]' && pKa.hydroxide,
				canonicalSmiles(false, atoms, logger) === '[O+]' && pKa.hydronium,
				canonicalSmiles(false, atoms, logger) === '[H+]' && pKa.proton
			].filter(Boolean).sort((a, b) => b - a);

			return PKas.length ? PKas[0] : null;
		}


        const molecularFormula = (logger) =>{
            return ''
        }

        const CID = (logger) => {
            return ''
        }

        const IUPACName = (logger) => {
            return ''
        }

        const heavyAtomCount = (logger) => {
            return null
        }

        const tags = (logger) => {
            return []
        }

/**
*/
        const netDoubleBondCount = (logger) => () => {
	  const doubleBondsCount = this.atoms.reduce((carry, atom, index, arr) => {
	    carry += atom.doubleBonds(arr).length;
	    return carry;
	  }, 0);

	  return doubleBondsCount / 2;
	};

/**
*/
	const netCharge = (logger) => () => {
	  if (typeof logger !== "object") {
	    throw new Error("logger must be an object");
	  }

	  const chargeSum = this.atoms.reduce((carry, atom, index, arr) => {
	    carry += atom.charge(arr, logger);
	    return carry;
	  }, 0);

	  return chargeSum;
	};


        const charge = (logger) => {

        }

/**
*/
        const compressed = function(atoms, logger) {
	  Typecheck(
	    {name: "atoms", value: atoms, type: "array"},
	    {name: "logger", value: logger, type: "object"}
	  )

	  return atoms.map((atom) => {
	    if (atom.atomicSymbol === 'H') {
	      return atom
	    }

	    const bonds = atom.bonds(atoms, logger).map((bond) => {
	      return bond.bond_type + bond.atom.atomicSymbol + bond.atom.atomId
	    })

	    return {
	      atomId: atom.atomId,
	      atomicSymbol: atom.atomicSymbol,
	      charge: atom.charge(atoms, logger),
	      bonds: JSON.stringify(bonds),
	      electrons: JSON.stringify(atom[Constants().electron_index])
	    }
	  })
	}

/**
*/
/*
	const functionalGroups = function(atoms, logger) {
		this.canonicalSmiles = FormatAs(this).SMILES(logger);
		this.atoms = atoms || this.atoms
		return FunctionalGroups(this, logger)
	}
	*/

/**
*/
/*
	const isHydrohalicAcid = function(logger) {
		return this.atoms.length === 2 && this.atoms[0].atomicSymbol === 'H' && this.atoms[1].isHalide()
	}
	*/

/**
*/
/*
        const isWeakBase = function(logger) {
		if (!logger || typeof logger !== "object") {
			throw new Error("Invalid logger object");
		}

		const smiles = FormatAs(this).SMILES(logger);

		// Molecules with the 'CN' functional group are weak bases
		const weakBaseFunctionalGroup = "CN";
		return smiles.includes(weakBaseFunctionalGroup);
	};
*/
/**
*/
/*
	const isWeakLewisBase = function(logger) {
		if (!logger || typeof logger !== "object") {
			throw new Error("Invalid logger object");
		}

		const smiles = FormatAs(this).SMILES(logger);

		// Molecules with the 'CN' functional group are weak bases
		const weakBaseFunctionalGroup = "CN";
		return smiles.includes(weakBaseFunctionalGroup);
	}
*/
/**
*/
/*
	const isStrongLewisBase = function(logger) {
	  if (!logger || typeof logger !== "object") {
	    throw new Error("Invalid logger object");
	  }

	  // For now just return true if the molecule is an amine
	  return this.functionalGroups().amine.length > 0;
	};
*/
/**
*/
/*
	const isStrongAcid = function(logger) {
		if (!logger || typeof logger !== "object") {
		  throw new Error("Invalid logger object");
		}
  
		if (this === "A+:") {
		  return true;
		}
  
		if (this.isWeakBase(logger)) {
		  // Most weak bases are not strong acids.
		  return false;
		}
  
		const smiles = FormatAs(this).SMILES(logger);
  
		// Sulfuric acid and sulfonic acid are strong acids
		const strongAcids = ["OS(=O)(=O)O", "O[S](=O)(=O)O"];
		return strongAcids.includes(smiles);
	  };
*/
/**
*/
	const id = function(logger) {
	  const uniqid = require('uniqid');
	  return uniqid().substr(uniqid().length - 3, 3);
	};
	
/**

*/



/**
*/
	const molecule = {
	    id: id(logger),
	   // functionalGroups: functionalGroups(all_atoms, logger),
	   functionalGroups: function(logger) {
		this.canonicalSmiles = FormatAs(this).SMILES(logger);
		//this.atoms = atoms || this.atoms
		const functional_groups = FunctionalGroups(this, logger)
		return functional_groups
   },
	    //pKa:moleculePKA(),
		pKa: function() {
			//console.log(this)
			//throw new Error('testing')
			return '@todo - pKa'
		},
	    conjugateBase: is_conjugate_base,
	    conjugateAcid: is_conjugate_acid,
	    atoms: Object.values(all_atoms),
		isHydrohalicAcid:function(logger) {
			return this.atoms.length === 2 && this.atoms[0].atomicSymbol === 'H' && this.atoms[1].isHalide()
		}
	 };
	 
	 

/**
*/
       
	    molecule.canonicalSmiles = FormatAs(molecule).SMILES;
	    molecule.molecularFormula = molecularFormula(logger);
	    molecule.CID = CID(logger);
	    molecule.IUPACName = IUPACName(logger);
	    molecule.charge = charge(logger);
	    molecule.heavyAtomCount = heavyAtomCount(logger);
	    molecule.tags = tags(logger);
	    molecule.netCharge = netCharge(logger);
	    molecule.netDoubleBondCount = netDoubleBondCount(logger);
	    molecule.compressed = compressed(atoms, logger);

	    /**
	    * @param logger
	    * 
	    * @return { boolean } True if
	    */
	    molecule.isWeakBase = function(logger) {
			// throw an error if logger is not an object
			if (!logger || typeof logger !== "object") {
				throw new Error("Invalid logger object");
			}
	
			const smiles = FormatAs(this).SMILES(logger);

			// hydrogen sulphate
			if ('[O-][S](=O)(=O)O' === smiles) {
				return true
			}
	
			// Molecules with the 'CN' functional group are weak bases
			const weakBaseFunctionalGroup = "CN";
			return smiles.includes(weakBaseFunctionalGroup);
		};
		
	    molecule.isWeakLewisBase = function(logger) {
			if (!logger || typeof logger !== "object") {
				throw new Error("Invalid logger object");
			}
	
			const smiles = FormatAs(this).SMILES(logger);
	
			// Molecules with the 'CN' functional group are weak bases (not correct)
			//const weakBaseFunctionalGroup = "CN";
			//return smiles.includes(weakBaseFunctionalGroup);
			// @todo
			return false
		};
	    molecule.isStrongLewisBase = function(logger) {
			if (!logger || typeof logger !== "object") {
			  throw new Error("Invalid logger object");
			}
	  
			// For now just return true if the molecule is an amine
			return this.functionalGroups(logger).amine.length > 0;
		};
	    molecule.isStrongAcid = function(logger) {
			if (!logger || typeof logger !== "object") {
			  throw new Error("Invalid logger object");
			}
	  
			if (this === "A+:") {
			  return true;
			}
	  
			if (this.isWeakBase(logger)) {
			  // Most weak bases are not strong acids.
			  return false;
			}
	  
			const smiles = FormatAs(this).SMILES(logger);
	  
			// Sulfuric acid and sulfonic acid are strong acids
			const strongAcids = ["OS(=O)(=O)O", "O[S](=O)(=O)O"];
			return strongAcids.includes(smiles);
		};

//
	return molecule

        

    } catch(e) {
        console.log('MoleculeFactory() '+e)
        console.log(e.stack)
        process.exit()
    }

}

module.exports = MoleculeFactory
