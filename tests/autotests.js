
const lookupMolecule = require('../actions/LookupMolecule')
const MoleculeFactory = require('../factories/MoleculeFactory')
const PubChemLookup = require('../actions/LookupPubChem')
const Constants = require('../Constants')
const ContainerFactory = require('../factories/ContainerFactory')
const _ = require('lodash');

const AddSubstrateToContainer = require('../actions/AddSubstrateToContainer')
const AddReagentToContainer = require('../actions/AddReagentToContainer')
const ReactionDecisionTree = require('../AI/ReactionDecisionTree')
const Typecheck = require('../Typecheck')
const AtomsFactory = require('../factories/AtomsFactory')
const FindBronstedLoweryAcidAtom = require('../reflection/FindBronstedLoweryAcidAtom')
const FindBronstedLoweryBaseAtom = require('../reflection/FindBronstedLoweryBaseAtom')
const findLewisBaseAtom = require('../reflection/LewisBaseAtom')
// Install using npm install pubchem-access
const pubchem = require("pubchem-access").domain("compound");
const uniqid = require('uniqid')

// Install using npm install mongodb --save
const MongoClient = require('mongodb').MongoClient
const assert = require('assert');
const ExtractAtomGroup = require('../actions/ExtractAtomGroup')

// Install using npm install dotenv
require("dotenv").config()

// -----------------------------------------------
// Cleavage
/*
const methyloxonium = MoleculeFactory(AtomsFactory('C[O+]'),logger)
const methyloxonium_atoms = methyloxonium[Constants().atoms]
const parent_atom = methyloxonium_atoms[3]
const child_atom = methyloxonium_atoms[6]
methyloxonium_methyloxonium.extractAtomGroup(atoms, parent_atom, child_atom).map((atom)=>{
//    console.log(atom)
})
*/
// -----------------------------------------------

// Establish database connection
const uri = "mongodb+srv://" + process.env.MONGODBUSER + ":" + process.env.MONGODBPASSWORD + "@cluster0.awqh6.mongodb.net/chemistry?retryWrites=true&w=majority";

console.log('Connecting to database, please wait ...')
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect(err => {

    assert.equal(err, null) // Check database connection was successful

    const db = client.db("chemistry")
    console.log("Database connection successful")

    // Formatting
    // SCHEMBL9068684
    const SCHEMBL9068684_smiles = FormatAs(MoleculeFactory(AtomsFactory('CC(C)([N+](C)(C)C)O'),logger)).SMILES(logger)
    SCHEMBL9068684_smiles.should.be.equal('CC(O)(C)[N+](C)(C)C')

    const methanamine_smiles = FormatAs(MoleculeFactory(AtomsFactory('CN(C)C')),logger).SMILES(logger)
    methanamine_smiles.should.be.equal('CN(C)C')
    const acetone_smiles = FormatAs(MoleculeFactory(AtomsFactory('CC(=O)C')),logger).SMILES(logger)
    acetone_smiles.should.be.equal('CC(C)=O')

    const sulphuric_acid_smiles = FormatAs(MoleculeFactory(AtomsFactory('OS(=O)(=O)O')),logger).SMILES(logger)
    //const sulphuric_acid_smiles = FormatAs(MoleculeFactory('OS(=Br)(=N)C')).SMILES(logger)
    sulphuric_acid_smiles.should.be.equal('OS(O)(=O)=O')
    const hydrogen_sulphate_smiles = FormatAs(MoleculeFactory('OS(=O)([O-])=O')).SMILES(logger)
    hydrogen_sulphate_smiles.should.be.equal('OS(=O)([O-])=O')
    const hydronium_smiles = FormatAs(MoleculeFactory('[O+]')).SMILES(logger)
    hydronium_smiles.should.be.equal('[O+]')


    const first_test_smiles = FormatAs( MoleculeFactory('CC1=CC2=C(C=C1)OCO2')).SMILES(logger)
    first_test_smiles.should.be.equal('CC(C=C2)=CC1=C2OCO1')

    const second_test_smiles = FormatAs(MoleculeFactory('CNC(C)CC1=CC=CC=C1')).SMILES(logger)
    second_test_smiles.should.be.equal('CNC(C)CC1=CC=CC=C1')

    // @todo molecules where there is no starting atom
    const benzene = MoleculeFactory('C1=CC=CC=C1')
    //const benzene_smiles = FormatAs(benzene).SMILES(logger)
    //benzene_smiles.should.be.equal('abcde')

    const charge_test_smiles = FormatAs(MoleculeFactory('[CH3+]')).SMILES(logger)
    charge_test_smiles.should.be.equal('[C+]')
    console.log('Autotests complete.')

})


