
const readline = require('readline');
const help = require('help')('usage.txt')
const PubChemLookup = require('../actions/LookupPubChem')
const LookupMolecule = require('../actions/LookupMolecule')(PubChemLookup)
const ContainerManager = require('../managers/ContainerManager')
const MoleculeManager = require('../managers/MoleculeManager')
//const AtomsManager = require('../managers/AtomsManager')
const ContainerFactory = require('../factories/ContainerFactory')
const MoleculeFactory = require('../factories/MoleculeFactory')
const AtomsFactory = require('../factories/AtomsFactory')
const ChemReact = require('../actions/ChemReact')

const Prototypes = require("../Prototypes")
Prototypes()

const logger = require('../logger')

// Install using npm install pubchem-access
const pubchem = require("pubchem-access").domain("compound");
const uniqid = require('uniqid')

// Install using npm install mongodb --save
const MongoClient = require('mongodb').MongoClient
const assert = require('assert');

const env = require('../env')

// Establish database connection
// ongodb+srv://user:<password>@cluster0.awqh6.mongodb.net/myFirstDatabase?retryWrites=true&w=majority
const uri = "mongodb+srv://" + env.user + ":" + env.password + "@cluster0.awqh6.mongodb.net/chemistry?retryWrites=true&w=majority";

console.log('Connecting to the database, please wait ...');
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect(err => {

    const testPinacolRearrangementFn = testPinacolRearrangement(client)

    if (err) {
        console.error('Error connecting to the database:', err);
        process.exit()
    } else {

        const db = client.db("chemistry");
        console.log("Database connection successful");

        testPinacolRearrangementFn(db)

        //const lookupMoleculeFn = LookupMolecule(db)(onLookUpMoleculeSuccess(client))(onAddedMoleculeToDBSuccess(client))
        //lookupMoleculeFn('SMILES')('CCC(=O)CC')
    }

});

function testPinacolRearrangement(client) {

    return (db) => {

        const lookupMoleculeFn = LookupMolecule(db)

        // @see https://en.wikipedia.org/wiki/Pinacol_rearrangement
        // Add pinacol to the container
        const container = ContainerFactory([], [], null, logger)
        const pinacol = MoleculeFactory(
            AtomsFactory('CC(C)(C(C)(C)O)O', logger)
        )
        const container_with_pinacol_added = ContainerManager().addReactant(container, pinacol, 1)
        const container_with_pinacol_and_acid_added = ContainerManager().addReactant(container_with_pinacol_added, 'A', 1)

        ChemReact(container_with_pinacol_and_acid_added)

    }
}

function onLookUpMoleculeSuccess(client) {
    return function(molecule) {
        console.log('Found ' + molecule.CanonicalSMILES + ' in local database.')
    }
}

function onAddedMoleculeToDBSuccess(client) {
    return function(molecule) {
        console.log('Added ' + molecule.CanonicalSMILES + ' to local database.')
        client.close()
        process.exit()
    }
}

function renderProducts(client) {
    return function(db) {
        const lookupMoleculeFn = LookupMolecule(db)
            (LookupMoleculeFn(onLookUpMoleculeSuccess(client)))
            (onAddedMoleculeToDBSuccess(client))
        container.reactants.map((reactant)=>{
            lookupMoleculeFn('SMILES')(reactant[0].canonicalSmiles)
            return reactant
        })
    }
}
