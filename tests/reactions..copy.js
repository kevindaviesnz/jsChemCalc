const MongoClient = require('mongodb').MongoClient
const FindBronstedLoweryAcidAtom = require('../reflection/FindBronstedLoweryAcidAtom')
const FindBronstedLoweryBaseAtom = require('../reflection/FindBronstedLoweryBaseAtom')
const FindLewisAcidAtom = require('../reflection/LewisAcidAtom')
const FindLewisBaseAtom = require('../reflection/LewisBaseAtom')
const NucleophilicAttack = require('../mechanisms/NucleophilicAttack')
const CarbocationRearrangement = require('../mechanisms/CarbocationRearrangement')
const ProtonTransfer = require('../mechanisms/ProtonTransfer')
const Deprotonate = require('../mechanisms/Deprotonate')
const PushElectronPair = require('../mechanisms/PushElectronPair.remove')
const Constants = require('../Constants')
const MoleculeFactory = require('../factories/MoleculeFactory')
const CanonicalSmiles = require('../factories/CanonicalSmiles')
const Log = require('../Log')
//const _ = require('lodash');

console.log('Connecting to database, please wait ...')

// Install using npm install dotenv
require("dotenv").config()

const assert = require('assert');

const uri = "mongodb+srv://" + process.env.MONGODBUSER + ":" + process.env.MONGODBPASSWORD + "@cluster0.awqh6.mongodb.net/chemistry?retryWrites=true&w=majority";

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect(err => {

    assert.equal(err, null) // Check database connection was successful

    const db = client.db("chemistry")

    console.log("Database connection successful")

    const protonTransferTest = (substrate, expected_product) => {

        if(substrate.smiles === undefined) {
            console.log(substrate)
            throw Error('Substrate smiles field is undefined')
        }

        const molecule = MoleculeFactory(substrate.smiles)

        const molecule_after_proton_transfer = ProtonTransfer(molecule)

        const molecule_after_proton_transfer_smiles = CanonicalSmiles(molecule_after_proton_transfer)
        molecule_after_proton_transfer_smiles.render().should.be.equal(expected_product.smiles)

    }

    carbocationRearrangementTest = (substrate, expected_product) => {

        if(substrate.smiles === undefined) {
            console.log(substrate)
            throw Error('Substrate smiles field is undefined')
        }

        if(expected_product.smiles === undefined) {
            console.log(expected_product)
            throw Error('Expected substrate product smiles field is undefined')
        }

        if (substrate.smiles.indexOf('+') === -1) {
            console.log(substrate.smiles)
            throw new Error('Substrate does not have a carbocation')
        }

        const molecule = MoleculeFactory(substrate.smiles)
        const unprocessed_molecule = _.cloneDeep(molecule)

        CarbocationRearrangement(molecule)

        if (_.isEqual(molecule, unprocessed_molecule)) {
            throw new Error('Failed to make any changes to molecule')
        }

        const molecule_smiles_object = CanonicalSmiles(molecule)
        const molecule_smiles = molecule_smiles_object.render()

        if (expected_product.smiles !== molecule_smiles) {
            console.log('Debug information:')
            molecule[Constants().molecule_atoms_index].map((atom)=> {
                if (atom.atomicSymbol !== 'H') {
                    console.log('Atom: ' + atom.atomicSymbol + ' Charge:' + atom.charge(molecule[Constants().molecule_atoms_index]))
                }
            })
            console.log('Expected smiles: ' + expected_product.smiles)
            console.log('Actual smiles: ' + molecule_smiles)
            throw new Error('Expected and actual smiles do not match')
        }

        console.log('Reaction completed')

    }

    const acidBaseReactionElectronPairShareTest  = (substrate, reagent, expected_substrate_product) => {

        if(substrate.smiles === undefined) {
            console.log(substrate)
            throw Error('Substrate smiles field is undefined')
        }

        if(reagent.smiles === undefined) {
            console.log(reagent)
            throw Error('Reagent smiles field is undefined')
        }

        if(expected_substrate_product.smiles === undefined) {
            console.log(expected_substrate_product)
            throw Error('Expected substrate product smiles field is undefined')
        }

        // Test acid base reaction where the acid accept a pair of electrons from the base.
        // The acid molecule is the molecule being attacked therefore it is the substrate
        const acid_molecule = MoleculeFactory(substrate.smiles)

        const acid_atom = FindLewisAcidAtom(acid_molecule)

        if (undefined === acid_atom || false === acid_atom) {
            throw new Error('Acid atom not found')
        }
        if (!Array.isArray(acid_atom)) {
            console.log(acid_atom)
            throw new Error('Acid atom should be an array')
        }
        // The base molecule is the molecule doing the attacking therefore it is the reagent.
        const base_molecule = MoleculeFactory(reagent.smiles)
        const base_atom = FindLewisBaseAtom(base_molecule)
        if (undefined === base_atom) {
            throw new Error('Base atom not found')
        }
        if (!Array.isArray(base_atom)) {
            console.log(base_atom)
            throw new Error('Base atom should be an array')
        }

        // Push electron pair from base atom (reagent) to acid atom (substrate)
        PushElectronPair(base_atom, base_molecule, acid_atom, acid_molecule)

        const acid_molecule_smiles_object = CanonicalSmiles(acid_molecule)
        const acid_molecule_smiles = acid_molecule_smiles_object.render()
        if (expected_substrate_product.smiles !== acid_molecule_smiles) {
            console.log('Debug information:')
            acid_molecule[Constants().molecule_atoms_index].map((atom)=> {
                if (atom.atomicSymbol !== 'H') {
                    console.log('Atom: ' + atom.atomicSymbol + ' Charge:' + atom.charge(acid_molecule[Constants().molecule_atoms_index]))
                }
            })
            console.log('Expected smiles: ' + expected_substrate_product.smiles)
            console.log('Actual smiles: ' + acid_molecule_smiles)
            throw new Error('Expected and actual smiles do not match')
        }

    }

    const acidBaseReactionProtonTest  = (substrate, reagent, expected_substrate_product, expected_reagent_product) => {

        if(substrate.smiles === undefined) {
            console.log(substrate)
            throw Error('Substrate smiles field is undefined')
        }

        if(reagent.smiles === undefined) {
            console.log(reagent)
            throw Error('Reagent smiles field is undefined')
        }

        if(expected_substrate_product.smiles === undefined) {
            console.log(expected_substrate_product)
            throw Error('Expected substrate product smiles field is undefined')
        }

        if(expected_reagent_product.smiles === undefined) {
            console.log(expected_reagent_product)
            throw Error('Expected reagent product smiles field is undefined')
        }

        // Test acid base reaction where the acid gives up a proton and the base accepts a proton
        // The acid molecule is the molecule being attacked therefore it is the substrate
        // Acid molecule should lose a proton.
        const acid_molecule = MoleculeFactory(substrate.smiles)
        const proton_acid_atom = FindBronstedLoweryAcidAtom(acid_molecule)
        if (undefined === proton_acid_atom) {
            throw new Error('Proton not found')
        }
        if (!Array.isArray(proton_acid_atom)) {
            console.log(proton_acid_atom)
            throw new Error('Proton should be an array')
        }
        // The base molecule is the molecule doing the attacking therefore it is the reagent.
        // Base molecule should gain a proton.
        const base_molecule = MoleculeFactory(reagent.smiles)
        const base_atom = FindBronstedLoweryBaseAtom(base_molecule)
        const proton_acid_atom_hydrogens_before_deprotonation = proton_acid_atom.hydrogens(acid_molecule[Constants().molecule_atoms_index])
        const base_atom_hydrogens_before_deprotonation = base_atom.hydrogens(base_molecule[Constants().molecule_atoms_index])
        Deprotonate(proton_acid_atom, acid_molecule, base_atom, base_molecule, logger)
        proton_acid_atom.hydrogens(acid_molecule[Constants().molecule_atoms_index]).length.should.be.lessThan(proton_acid_atom_hydrogens_before_deprotonation.length)
        base_atom.hydrogens(base_molecule[Constants().molecule_atoms_index]).length.should.be.greaterThan(base_atom_hydrogens_before_deprotonation.length)

        const base_molecule_smiles = CanonicalSmiles(base_molecule)
        base_molecule_smiles.render().should.be.equal(expected_reagent_product.smiles)

        const acid_molecule_smiles = CanonicalSmiles(acid_molecule)
        const s = acid_molecule_smiles.render()
        if (s !== expected_substrate_product.smiles) {
            console.log('Debug information:')
            acid_molecule[Constants().molecule_atoms_index].map((atom)=>{
                if (atom.atomicSymbol !== 'H') {
                    console.log('Atom:' + atom.atomicSymbol)
                    console.log('Charge: ' + atom.charge(acid_molecule[Constants().molecule_atoms_index]))
                    console.log(atom.electronPairs)
                }
            })
            throw new Error('Expected ' + s + ' to be ' + expected_substrate_product.smiles)
        }
        acid_molecule_smiles.render().should.be.equal(expected_substrate_product.smiles)

    }

    // Process through reactions
    const FetchReactions = (reactions_db)=> {

        // @see https://www.guru99.com/mongodb-query-document-using-find.html
        reactions_db.collection('known_reactions').find().forEach((reaction)=>{

            /*
            {
              _id: new ObjectId("5ffe76f9aa57e37f1739664a"),
              reaction: 'pinacol Rearrangement',
              substrate: { name: 'pinacol', smiles: 'CC(C)(C(C)(C)O)O' },
              reagents: [ { name: 'strong acid', smiles: 'SA' } ],
              products: [ { name: 'pinacolone', smiles: 'CC(=O)C(C)(C)C' } ]
            }
            {
              _id: new ObjectId("62366f6d98f7c423842ef82d"),
              reaction: 'acid base',
              substrate: { name: 'sulphuric acid', smiles: 'OS(=O)(=O)O' },
              reagents: [ [ [Object] ] ],
              products: [
                { name: 'hydrogen sulfate', smiles: 'OS(=O)(=O)[O-]' }
                { name: 'hydronium', smiles: '[O+]' }
              ]
            }
*/
            Log("Running reaction " +reaction._id.toString() + ' (' + reaction.reaction + ')')

            switch(reaction.reaction) {
                case 'acid base (proton)':
                    console.log("Doing acid base reaction (proton)")
                    acidBaseReactionProtonTest(reaction.substrate, reaction.reagents[0][0], reaction.products[0], reaction.products[1])
                    break
                case 'acid base (electron pair share)':
                    console.log("Doing acid base reaction (electron pair share)")
                    acidBaseReactionElectronPairShareTest(reaction.substrate, reaction.reagents[0][0], reaction.products[0])
                    break
                case 'proton transfer':
                    console.log("Doing proton transfer")
                    protonTransferTest(reaction.substrate, reaction.products[0])
                    break
                case 'carbocation rearrangement (hydride shift)':
                case 'carbocation rearrangement (akyl shift)':
                    console.log("Doing carbocation rearrangement")
                    carbocationRearrangementTest(reaction.substrate, reaction.products[0])
                    break


            }
        })

    }

    console.log("Fetching reactions")
    FetchReactions(db)

})