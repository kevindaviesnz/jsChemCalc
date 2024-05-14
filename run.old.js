/*

INIT prompt

PARSE command:

     init container:
        CALL ContainerFactory RETURN container

     add <chemical>:
        CALL lookupMolecule using <chemical> RETURN molecule
        IF molecule is solvent
            CALL addSolventToContainer RETURN container (should also call reactionDecisionTree)
        ELSE
            CALL addSubstrateToContainer using molecule RETURN container (should also call reactionDecisionTree)
        ENDIF

    show container:

    distill:

    synthesise <chemical>:


 */

    const readline = require('readline');
    const help = require('help')('usage.txt')
    const render = require('./actions/render')
    const ContainerFactory = require('./factories/ContainerFactory')
    const lookupMolecule = require('./actions/LookupMolecule')
    const addSolventToContainer = require('./actions/AddSolventToContainer')
    const addSubstrateToContainer = require('./actions/AddSubstrateToContainer')
    const addReagentToContainer = require('./actions/AddReagentToContainer')
    const isSolvent = require('./reflection/isSolvent')
    const MoleculeFactory = require('./factories/MoleculeFactory')
    const PubChemLookup = require('./actions/LookupPubChem')
    const Constants = require("./Constants")
    const RenderContainer = require("./actions/RenderContainer")
    
    // Install using npm install pubchem-access
    const pubchem = require("pubchem-access").domain("compound");
    const uniqid = require('uniqid')
    
    const pkl = PubChemLookup((err)=>{
        console.log(err)
        process.exit()
    })
    
    
// Install using npm install mongodb --save
const MongoClient = require('mongodb').MongoClient
const assert = require('assert');

// Install using npm install dotenv
require("dotenv").config()

// Establish database connection
//          mongodb+srv://user:<password>@cluster0.awqh6.mongodb.net/myFirstDatabase?retryWrites=true&w=majority
const uri = "mongodb+srv://" + process.env.MONGODBUSER + ":" + process.env.MONGODBPASSWORD + "@cluster0.awqh6.mongodb.net/chemistry?retryWrites=true&w=majority";


console.log('Connecting to database, please wait ...')
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


client.connect(err => {

    assert.equal(err, null) // Check database connection was successful

    const db = client.db("chemistry")

    console.log("Database connection successful")

    const onMoleculeNotFound =  (onMoleculeAddedToDBCallback) => {
        return (search) => {
            console.log("Molecule not found " + search)
            process.error()
            // searchByName()
            pkl.searchBySMILES(search.replace(/\(\)/g, ""), db, (molecule_from_pubchem) => {
                if (molecule_from_pubchem !== null) {
                    console.log("Molecule found in pubchem")
                    AddChemicalToDatabase()
                    db.collection("molecules").insertOne(molecule_from_pubchem, (err, result) => {
                        if (err) {
                            console.log(err)
                            client.close()
                            process.exit()
                        } else {
                            onMoleculeAddedToDBCallback(search)
                        }
                    })

                }
            })
        }
    }


    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: "ChemCalc 3 > Enter a command or type help\n> "
    })

    rl.prompt()

    let container = null

    let tag = null

    rl.on('line', (line) => {

        const line_trimmed = line.trim()

        if (line_trimmed.toLowerCase() === 'help') {
                    help()
                    rl.prompt()
                } else if (line_trimmed === "") {
            rl.prompt()
        } else if (line_trimmed === "q" || line_trimmed === "q") {
                           console.log('Exiting ...')
                           process.exit()
                       } else if (line_trimmed === 'flask') {
            if (container !== null) {
                render(RenderContainer(container))
            } else {
                container = ContainerFactory()
                render('Flask is empty')
            }
            rl.prompt()
        } else if (["add polar aprotic solvent","add polar protic solvent", "add non-polar solvent"].indexOf(line_trimmed.toLowerCase())!==-1) {

            // Init container if required
            if (null === container) {
                container = ContainerFactory()
            }

            const solvent = line_trimmed.toLowerCase().substr(3)

            addSolventToContainer(container, solvent)

            rl.prompt()

        } else if (line_trimmed.toLowerCase().substr(0, 4) === "add ") { // "add 1 water", "add solvent water"

            // Init container if required
            if (null === container) {
                container = ContainerFactory()
            }

            // Add a substance to the container
            const regex = /add\s(.+?)\s(.+)/
            const components = regex.exec(line_trimmed)
            if (components[1] ===null) {
                console.log('Please specify number of units or solvent eg add 1 water, add solvent water')
                rl.prompt
            } else {
                const units = components[1]
                const chemical_name = components[2]

                lookupMolecule((search) => {
                    if (tag === null) {
                        console.log('Chemical not found. Please try again using SMILES or IUPAC name.')
                        tag = search
                        rl.prompt
                    }
                }, db, chemical_name, "IUPACName", PubChemLookup, tag).then(
                    // "resolves" callback
                    (chemical) => {
                        const molecule = MoleculeFactory(
                            chemical.atoms,
                            logger
                        )
                        if (units === 'solvent') {
                            addSolventToContainer(container, molecule)
                        } else {
                            molecule[1] = units
                            // Container is empty
                            if (null === container[Constants().substrate_index]) {
                                // Substrate and solvent can be the same.
                                addSubstrateToContainer(container, molecule, units * 1)
                            } else {
                                addReagentToContainer(container, molecule, units * 1)
                            }
                        }
                        rl.prompt()
                    },
                    // Error
                    (search) => {
                        if (tag === null) {
                            console.log('Chemical not found. Please try again using SMILES or IUPAC name.')
                            tag = search
                            console.log('tag 2 "' + tag)
                            rl.prompt
                        }

                    }
                )
            }

        } else {
            console.log("Command not recognized")
            rl.prompt()
        }

    })

})

