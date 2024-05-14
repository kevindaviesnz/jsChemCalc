function ContainerManager() {

        const renderReactantsAsSmiles = function(reactants) {
            return reactants.map((reactant, i) => {
                if (undefined === reactant) {
                    return 'undefined'
                }
                if (typeof reactant[0] === "string") {
                    return reactant[0];
                }
                return reactant[0].canonicalSmiles
            });
        }

    function getReactantByIndex(container, reactant_index) {
        return undefined === container.reactants[reactant_index]?undefined:container.reactants[reactant_index]
    }

    function findMatchingReactant(container, reactant) {
        const matching_reactant = container.reactants.find((r) => {
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
     * Add n units of reactant to the container.
     *
     * @param reactant - the reactant to add
     * @param units - number of units of reactant to add
     * @param logger - log what happens to log file
     */
    function addReactant(container, reactant, units) {
        // Get the number of units of matching reactant in the container
        const existingNumberOfUnits = fetchTheNumberOfUnitsOfTheReactantInTheContainer(container, reactant);

        if (existingNumberOfUnits === 0) {
            // If we have 0 units, then we simply add the reactant.
            container.reactants.push([reactant, units]);
        } else {
            // If not, then we increase the number of units.
            const reactantsIndex = fetchTheNumberOfUnitsOfTheReactantInTheContainer(reactant, logger);
            container.reactants[reactantsIndex][1] = existingNumberOfUnits + units;
        }

        return container

        //this.react(logger);
    };

    /**
     * Look for the reagent in the container and return the number of units.
     *
     * @param container
     * @param reactant
     * @param logger
     *
     * @return { number } The number of units of the reactant left in the container.
     */
    function fetchTheNumberOfUnitsOfTheReactantInTheContainer(container, reactant) {
        // Look for a reactant in the container that matches the reactant.
        const matching_reactant = findMatchingReactant(container, reactant)
        return matching_reactant === undefined ? 0 : matching_reactant[1]
    };

    function findMatchingReactant (container, reactant) {

        const matching_reactant = container.reactants.find((r) => {
            if (typeof reactant[0] === "string") {
                return r[0] === reactant
            }
            // Check if the current reactant matches the reactant we are looking for.
            const reactantSmiles = r[0].canonicalSmiles ?? r.smiles;
            return typeof r !== "string" && reactant.canonicalSmiles === reactantSmiles;

        });
        return matching_reactant
    }

    return {
        'addReactant':addReactant,
        'reactantsAsSmiles':renderReactantsAsSmiles
    }




}

module.exports = ContainerManager
