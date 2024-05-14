
const readline = require('readline');
const help = require('help')('usage.txt')
const lookupMolecule = require('./actions/LookupMolecule')
const PubChemLookup = require('./actions/LookupPubChem')
const ContainerManager = require('./managers/ContainerManager')
const MoleculeManager = require('./managers/MoleculeManager')
//const AtomsManager = require('./managers/AtomsManager')
const ContainerFactory = require('./factories/ContainerFactory')
const MoleculeFactory = require('./factories/MoleculeFactory')
const AtomsFactory = require('./factories/AtomsFactory')
const ChemReact = require('./actions/ChemReact')

const Prototypes = require("./Prototypes")
Prototypes()

const logger = require('./logger')

// Install using npm install pubchem-access
const pubchem = require("pubchem-access").domain("compound");
const uniqid = require('uniqid')

const pkl = PubChemLookup((err)=>{
    console.log(err)
    process.exit()
})

const moleculeLookup = function(container, search) {

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
                false,
                false
            )
            const updatedContainer = ContainerManager().addReactant(container, molecule, 1);
            console.log("Running ...")
            ChemReact(updatedContainer)
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

// Install using npm install mongodb --save
const MongoClient = require('mongodb').MongoClient
const assert = require('assert');


const env = require('./env')

// Establish database connection
//          mongodb+srv://user:<password>@cluster0.awqh6.mongodb.net/myFirstDatabase?retryWrites=true&w=majority
const uri = "mongodb+srv://" + env.user + ":" + env.password + "@cluster0.awqh6.mongodb.net/chemistry?retryWrites=true&w=majority";


// ---------------------------------------------------------


console.log('Connecting to the database, please wait ...');
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect(err => {
    if (err) {
        console.error('Error connecting to the database:', err);
        // Handle the error, e.g., retry, exit the application, or display an error message.
    } else {
        const db = client.db("chemistry");
        console.log("Database connection successful");

        // You can perform database operations here.

        // ******************************
        const container = ContainerFactory();
        let i = 0;
        
        const processLine = (line, container) => {
            if (line.trim() === 'help') {
                help();
            } else if (line.trim() === 'q' || line.trim() === 'q') {
                console.log('Goodbye!');
                process.exit();
            } else if (line.trim().substr(0, 1) === '+') { // + sulphuric acid
                const regex = /\+\s*(\S+)/;
                const match = regex.exec(line.trim());
                if (match) {
                    const result = match[1];
                    const molecule = MoleculeFactory(
                        AtomsFactory(result, logger),
                        false,
                        false
                    )
                    const updatedContainer = ContainerManager().addReactant(container, molecule, 1);
                    console.log("Running ...")
                    ChemReact(updatedContainer)
                }
            } else if (line.trim().substr(0, 1) === "=") {
                console.log(ContainerManager().reactantsAsSmiles(container.reactants))
            }
            rl.prompt();
        };
        
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        
        rl.on('line', (line) => {
            processLine(line, container);
        });
        
        const _help = () => {
            // Implement your help function here
        };
        
        rl.prompt();

        // ******************************


        client.close(); // Close the database connection when you're done.
    }
});

console.log('Got here');

//--------------------------------------------------

