/*

Initialised container

Params in: null
Params out: container object

[0] = molecules
 */

const _ = require('lodash')
const { Container } = require('winston')
const AI = require('../AI/AI')
const FormatAs = require('../factories/FormatAs')
const Typecheck = require('../Typecheck')
const LewisAcidAtom = require('../reflection/LewisAcidAtom')
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

/**

*/
const ContainerFactory = (substrate, reagents, solvent, logger) => {


    try {


        Typecheck(
            {name: "reagents", value: reagents, type: "array"},
            {name: "logger", value: logger, type: "object"},
        )

		/**
		* @return { Object } The substrate of this container, including units
		*/
		const getSubstrate = function() {
			const container = this;
			return container.substrate[container.substrate.length - 1];
		  };
		  

/**

*/

        const renderReagentsAsSmiles = function() {
	  return this.reagents.map((reagent, i) => {
	    if (typeof reagent === "string") {
	      return reagent;
	    }

	    // Ensure reagent has a canonicalSmiles() property
	    if (!reagent.canonicalSmiles) {
	      throw new Error(`Reagent ${i} is missing a canonicalSmiles() method`);
	    }

	    return reagent.canonicalSmiles(false, reagent.atoms, logger) || reagent.smiles;
	  });
	}


        /**
		 * Remove a reagent from container
		 * 
        * @param reagent - logger The logger to use for filtering the s
        * @param logger
        */
        const removeReagent = function(reagent, logger) {
	  // Check logger argument type
	  // Asserts that the expected logger is an object.
	  if (typeof logger !== "object") {
	    throw new TypeError("Expected logger to be an object");
	  }

	  // TypeError Reagent cannot be a number
	  if (typeof reagent === "number") {
	    throw new TypeError("Reagent cannot be a number");
	  }

	  // reagents is a wildcard or an array of reagents
	  if (reagent === "*") {
	    this.reagents = [];
	  } else {
	    this.reagents = this.reagents.filter((r) => {

				if (undefined === r || undefined === reagent ) {
					try {
						throw new Error('Reagent should be an array')
					} catch (e) {
						logger.log('error', 'ContainerFactory() ' + e.stack)
						console.log(e.stack)
						process.exit
					}
				}
				return !_.isEqual(r[0].id, reagent[0].id)
			}
		);
	  }
	}

        
/**
*/
       const lookUpReagentBySmiles = function(smiles, logger) {
	  // Check arguments
	  if (typeof smiles !== "string") {
	    throw new TypeError("Expected smiles to be a string");
	  }
	  if (typeof logger !== "object") {
	    throw new TypeError("Expected logger to be an object");
	  }

	  return _.findIndex(this.reagents, (r) => {
	    if (typeof r === "string") {
	      return false;
	    }

	    const reagentSmiles = r.smiles_string || r.canonicalSmiles(false, r.atoms, logger);

	    return reagentSmiles === smiles;
	  }) !== -1;
	}

	/**
	 * Finds the position of the reagent in the reagents array
	 * 
	* @param reagent
	* @param logger
	* 
	* @return { number } The index of the reagent in the container
	*/
	const getReagentIndex = function(reagent, logger) {
		Typecheck(
			{ name: "reagent", value: reagent, type: "object" },
			{ name: "logger", value: logger, type: "object" }
		);
	
		// Look for a reagent in the container that matches the reagent.
		return this.reagents.findIndex((r) => {
			// Note: r is an array where the first item is the reagent and the second item is the number of units.
			// Check if the current reagent matches the reagent we are looking for.
			const reagentSmiles = r[0].canonicalSmiles ?? r.smiles;
			return typeof r !== "string" && FormatAs(reagent).SMILES(logger) === reagentSmiles;
		});
	}

	/**
	 * Finds the position of the substrate in the substrate array
	 * 
	* @param substrate
	* @param logger
	* 
	* @return { number } The index of the substrate in the container
	*/
	const getSubstrateIndex = function(substrate, logger) {
		Typecheck(
			{ name: "substrate", value: substrate, type: "object" },
			{ name: "logger", value: logger, type: "object" }
		);
	
		// Look for a reagent in the container that matches the reagent.
		return this.substrate.findIndex((r) => {
			// Note: r is an array where the first item is the substrate and the second item is the number of units.
			// Check if the current subtrate matches the substrate we are looking for.
			const substrateSmiles = r[0].canonicalSmiles ?? r.smiles;
			return typeof r !== "string" && FormatAs(substrate).SMILES(logger) === substrateSmiles;
		});
	}

   /**
   * Look for a reagent in the container and return true if it is the container, otherwise false.
   * 
   * @param reagent
   * @param logger
   * 
   * @return { boolean } Whether or not the reagent is in the container.
   */
   const lookUpReagent = function (reagent, logger) {
	Typecheck(
		{ name: "reagent", value: reagent, type: "object" },
		{ name: "logger", value: logger, type: "object" }
	);

	// Look for a reagent in the container that matches the reagent.
	const index = this.getReagentIndex(reagent, logger)

	// Return true or false depending if we have found matching reagent.
	return index !== -1;
};

	/**
	* Look for the reagent in the container and return the number of units.
	*
	* @param reagent
	* @param logger
	* 
	* @return { number } The number of units of the reagent left in the container. 
	*/
	const getTheNumberOfUnitsOfReagentInContainer = function (reagent, logger) {
		// Look for a reagent in the container that matches the reagent.
		const matching_reagent = this.reagents.find((r) => {

			if (typeof reagent[0] === "string") {
				return r[0] === reagent
			}

			// Note: r is an array where the first item is the reagent and the second item is the number of units.
			// Check if the current reagent matches the reagent we are looking for.
			const reagentSmiles = FormatAs(r[0]).SMILES(logger) ?? r.smiles;
			return typeof r !== "string" && FormatAs(reagent).SMILES(logger) === reagentSmiles;

		});

		return matching_reagent === undefined?0:matching_reagent[1]

	};


	/**
	* Look for the subtrate in the container and return the number of units.
	*
	* @param substrate
	* @param logger
	* 
	* @return { number } The number of units of the substrate left in the container. 
	*/
	const getTheNumberOfUnitsOfSubstrateInContainer = function (substrate, logger) {
		Typecheck(
			{ name: "substrate", value: substrate, type: "object" },
			{ name: "logger", value: logger, type: "object" }
		);
	
		// Look for the substrate in the container that matches the reagent.
		return this.substrate.find((r) => {
			// Note: r is an array where the first item is the substrate and the second item is the number of units.
			// Check if the current substrate matches the substrate we are looking for.
			const reagentSmiles = FormatAs(r[0]).SMILES ?? r.smiles;
			return typeof r !== "string" && FormatAs(substrate).SMILES(logger) === reagentSmiles;
		})[1];
	};
	

/**
*/
        const addSideProduct = function(sideProduct, logger) {
	  // Check arguments
	  if (typeof sideProduct !== "object" || Array.isArray(sideProduct) || sideProduct === null) {
	    throw new TypeError("Expected sideProduct to be an object");
	  }
	  if (typeof logger !== "object") {
	    throw new TypeError("Expected logger to be an object");
	  }

	  this.sideProducts.push(sideProduct);
	}


    /**
	* Add n units of reagent to the container.
	*
    * @param reagent - the reagent to add
    * @param units - number of units of reagent to add
    * @param logger - log what happens to log file
    */
    const addReagent = function (reagent, units, logger) {
		// Check arguments
		if (typeof units !== "number") {
			throw new TypeError("Expected units to be a number");
		}
		if (typeof logger !== "object") {
			throw new TypeError("Expected logger to be an object");
		}
	
		if (this.reagents.length === 0) {
			// No reagents added, so we don't need to check for the reagent in the container.
			this.reagents = [[reagent, units]];
		} else {
			// Get the number of units of matching reagent in the container
			const existingNumberOfUnits = this.numberOfUnitsOfReagent(reagent, logger);
	
			if (existingNumberOfUnits === 0) {
				// If we have 0 units, then we simply add the reagent.
				this.reagents.push([reagent, units]);
			} else {
				// If not, then we increase the number of units.
				const reagentIndex = this.reagentIndex(reagent, logger);
				this.reagents[reagentIndex][1] += existingNumberOfUnits;
			}
		}
	
		//this.react(logger);
	};

	/**
	* @param reagent_to_modify
	* @param reagent
	Remove?
	*/
	const modifyReagent = function(reagent_to_modify, reagent) {
		this.removeReagent(reagent_to_modify, logger);
		this.reagents.push(reagent);
	  };
	  
	
	  const addSolvent = function(solvent) {
		this.solvent = solvent
	  }


    /**
	* Add n units of substrate to the container. This will normally be called when a substrate if first added, when
	* or when a reagent has reacted with the substrate forming a new product.
	*
    * @param reagent - the substrate to add
    * @param units - number of units of reagent to add
    * @param logger - log what happens to log file
    */
    const addSubstrate = function (substrate, units, logger) {
		// Check arguments
		if (typeof units !== "number") {
			throw new TypeError("Expected units to be a number");
		}
		if (typeof logger !== "object") {
			throw new TypeError("Expected logger to be an object");
		}
		if (this.substrate.length > 0) {
			throw new Error('Substrate has already been added')
		}

		// The content of the substrate array will change according to the reactions.
		// eg If 10 units of substrate is protonated by 4 units of reagent then
		// the substrate array will be set to:
		// [[substrate, 6],[<protonated substrate, 4]
		this.substrate = [[substrate,units]];
	};
		

/**
*/
        const filterReagents = function(filter) {
	  Typecheck({ name: "filter", value: filter, type: "string" });

	  if (filter === '*') {
	    this.reagents = _.cloneDeep(this.reagents).map((stepReagents) => []);
	  } else {
	    this.reagents = this.reagents.filter((reagent) =>
	      reagent.some((r) => r.canonicalSmiles().includes(filter))
	    );
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
        const react = function (logger) {
			Typecheck({ name: "logger", value: logger, type: "object" });

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
		  
			const reactions = [Protonate, Deprotonate, SN2, SN1, E1, E2, LewisAcidBase];
			const reactants = this.orderedReactants
			reactants.map((reactant)=>{
				// Starts with substrate
				// Try simulating different reactions: protonation, deprotonation, acid-base
				const result = reactions.some((reaction) => {
					return reaction(this, logger) !== false
				});
				if (result) {
					let safety = 10;
					let stabilised = false;
					// This method will stabilise the reactant.
					while (safety > 0 && !stabilised) {
					  safety--;
					  stabilised = Stabilise(reactant, logger);
					  reactant[0] =
						  MoleuleFactory(
							  reactant[0].atoms,
							  reactant[0].conjugateBase,
							  reactant[0].conjugateAcid,
							  logger
						  )
					}
				}

			}) // map

		  };
		  
		  const orderedReactants = function(container) {
			// @todo
			return [
				container.getSubstrate[0],
				container.reagents
			]
		  }

        return {
            'substrate':substrate,
            'solvent':solvent,
            'reagents':reagents,
            'molecules':[],
            'removeReagent':removeReagent,
            'lookUpReagent':lookUpReagent,
            'addReagent':addReagent,
            'addSideProduct':addSideProduct,
            'side_products':[],
            'addSubstrate':addSubstrate,
            'renderReagentsAsSmiles': renderReagentsAsSmiles,
            'filterReagents': filterReagents,
            'lookUpReagentBySmiles': lookUpReagentBySmiles,
            'react': react,
			'numberOfUnitsOfReagent': getTheNumberOfUnitsOfReagentInContainer,
			'numberOfUnitsOfSubstrate': getTheNumberOfUnitsOfSubstrateInContainer,
			'reagentIndex': getReagentIndex,
			'substrateIndex': getSubstrateIndex,
			'getSubstrate': getSubstrate,
			'modifyReagent': modifyReagent,
			'addSolvent': addSolvent
        }

    } catch(e) {
		logger.log('error', 'ContainerFactory() '+e.stack)
		console.log(e.stack)
		process.exit
    }

}

module.exports = ContainerFactory
