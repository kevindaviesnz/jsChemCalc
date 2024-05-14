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



const lookupMolecule = require('../actions/LookupMolecule')
const MoleculeFactory = require('../factories/MoleculeFactory')
const PubChemLookup = require('../actions/LookupPubChem')
const CanonicalSmiles = require('../factories/CanonicalSmiles')
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

/*
const pkl = PubChemLookup((err)=>{
    console.log(err)
    process.exit()
})
*/

// C(C)(C(N))C => CC(C)CN
// Install using npm install mongodb --save
const MongoClient = require('mongodb').MongoClient
const assert = require('assert');

// Install using npm install dotenv
require("dotenv").config()

// -----------------------------------------------
// Cleavage
/*
const methyloxonium = MoleculeFactory('C[O+]')
const methyloxonium_atoms = methyloxonium[Constants().molecule_atoms_index]
const parent_atom = methyloxonium_atoms[3]
const child_atom = methyloxonium_atoms[6]
methyloxonium_atoms.extractAtomGroup(parent_atom, child_atom).map((atom)=>{
//    console.log(atom)
})
*/
// -----------------------------------------------
// Branches & nomenclature


// Establish database connection
//          mongodb+srv://user:<password>@cluster0.awqh6.mongodb.net/myFirstDatabase?retryWrites=true&w=majority
const uri = "mongodb+srv://" + process.env.MONGODBUSER + ":" + process.env.MONGODBPASSWORD + "@cluster0.awqh6.mongodb.net/chemistry?retryWrites=true&w=majority";

console.log('Connecting to database, please wait ...')
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


client.connect(err => {

    assert.equal(err, null) // Check database connection was successful

    const db = client.db("chemistry")

    console.log("Database connection successful")

    // Branches
    const benzene = MoleculeFactory('C1=CC=CC=C1')
    const benzene_test = CanonicalSmiles(db, benzene)
    const benzene_atoms = benzene[Constants().molecule_atoms_index]
    const benzene_branches = benzene_test.branches(benzene_atoms)
    console.log(benzene_atoms)
    console.log(benzene_branches)

    process.error()
    
})



let s = ''

s = 'CC(C)([O-])[N+](C)(C)C'
const azanium_ion = MoleculeFactory(s)
azanium_ion[Constants().molecule_atoms_index].filter((atom)=> {
    return atom.atomicSymbol !== 'H'
}).map((atom)=>{
    console.log(atom.atomId)
    console.log(atom[Constants().electron_pairs_index ])
})
const azanium_ion_smiles_object = CanonicalSmiles(azanium_ion)
const azanium_ion_branches = azanium_ion_smiles_object.branches(azanium_ion[Constants().molecule_atoms_index])
const azanium_ion_branch_with_substituents = azanium_ion_smiles_object.addSubstituents(azanium_ion[Constants().molecule_atoms_index], azanium_ion_branches[0], [],0)
const azanium_ion_smiles = azanium_ion_smiles_object.render()
console.log(s)
console.log(azanium_ion_smiles)
process.error()

s = '[O-]S(=O)(=O)O'
const deprotonated_sulphuric_acid_molecule = MoleculeFactory(s)
deprotonated_sulphuric_acid_molecule[Constants().molecule_atoms_index].filter((atom)=> {
    return atom.atomicSymbol !== 'H'
}).map((atom)=>{
//    console.log(atom.atomId)
//    console.log(atom[Constants().electron_pairs_index ])
})
const deprotonated_sulphuric_acid_molecule_smiles_object = CanonicalSmiles(deprotonated_sulphuric_acid_molecule)
const deprotonated_sulphuric_acid_molecule_branches = deprotonated_sulphuric_acid_molecule_smiles_object.branches(deprotonated_sulphuric_acid_molecule[Constants().molecule_atoms_index])
const deprotonated_sulphuric_acid_molecule_branch_with_substituents = deprotonated_sulphuric_acid_molecule_smiles_object.addSubstituents(deprotonated_sulphuric_acid_molecule[Constants().molecule_atoms_index], deprotonated_sulphuric_acid_molecule_branches[0], [],0)
//console.log(deprotonated_sulphuric_acid_molecule_branch_with_substituents)
const deprotonated_sulphuric_acid_molecule_smiles = deprotonated_sulphuric_acid_molecule_smiles_object.render()
console.log(deprotonated_sulphuric_acid_molecule_smiles)

process.error()

s = 'CC(C(C))C'
s = 'CC(C)([N+](C)(C)C)O'
const n2 = MoleculeFactory(s)
n2[Constants().molecule_atoms_index].filter((atom)=> {
    return atom.atomicSymbol !== 'H'
}).map((atom)=>{
    //console.log(atom.atomId)
    //console.log(atom[Constants().electron_pairs_index ])
})
const n_2_test = CanonicalSmiles(n2)
const n_2_branch = n_2_test.branches(n2[Constants().molecule_atoms_index])[0]
//console.log('Branch')
//console.log(n_2_branch)
const n_2_keys = Object.keys(n_2_branch)
const n_2_branch_with_substituents = n_2_test.addSubstituents(n2[Constants().molecule_atoms_index], n_2_branch, [],0)
//console.log('Branch with substituents')
//console.log(n_2_branch_with_substituents)
console.log('Atoms')
n2[Constants().molecule_atoms_index].filter((atom)=> {
    return atom.atomicSymbol !== 'H'
}).map((atom)=>{
    console.log(atom.atomId)
    console.log(atom[Constants().electron_pairs_index ])
})
console.log(n_2_test.render())
//n_2_test.nomenclature().should.equal('2-methylbutane')



s = 'CC(C)C(C)C'
//console.log(s)
const n1 = MoleculeFactory(s)
n1[Constants().molecule_atoms_index].filter((atom)=> {
    return atom.atomicSymbol !== 'H'
}).map((atom)=>{
    //console.log(atom.atomId)
    //console.log(atom[Constants().electron_pairs_index ])
})
const n_1_test = CanonicalSmiles(n1)
const n_1_branch = n_1_test.branches(n1[Constants().molecule_atoms_index])[0]
//console.log('Branch')
//console.log(n_1_branch)
const n_1_keys = Object.keys(n_1_branch)
n_1_keys.length.should.be.equal(4)
Object.keys(n_1_branch[n_1_keys[0]]).length.should.be.equal(0)
Object.keys(n_1_branch[n_1_keys[1]]).length.should.be.equal(0)
Object.keys(n_1_branch[n_1_keys[2]]).length.should.be.equal(0)
const n_1_branch_with_substituents = n_1_test.addSubstituents(n1[Constants().molecule_atoms_index], n_1_branch, [],0)
//console.log('Branch with substituents:')
//console.log(n_1_branch_with_substituents)
Object.keys(n_1_branch_with_substituents).length.should.be.equal(4)
Object.keys(n_1_branch_with_substituents[n_1_keys[0]]).length.should.be.equal(0)
Object.keys(n_1_branch_with_substituents[n_1_keys[1]]).length.should.be.equal(1)
Object.keys(n_1_branch_with_substituents[n_1_keys[2]]).length.should.be.equal(1)
Object.keys(n_1_branch_with_substituents[n_1_keys[3]]).length.should.be.equal(0)
n_1_test.nomenclature().should.equal('2,3-dimethylbutane')




process.error()

//const test = MoleculeFactory('CC(C)([N+](C)(C)C)O')
const test = MoleculeFactory('CC(C)(N(C)(C)(C))O')
const c_test = CanonicalSmiles(test)
const test_atoms = test[Constants().molecule_atoms_index]
console.log('Test atoms')
test_atoms.map((atom)=>{
    if (atom.atomicSymbol !== 'H') {
        console.log(atom)
    }
})
console.log(c_test.render())
process.error()


const ketone = MoleculeFactory('CC(=[O+])C')
//console.log(ketone)
const ketone_test = CanonicalSmiles(ketone)
const ketone_atoms = ketone[Constants().molecule_atoms_index]
console.log(ketone_test.render())







/*
'gef' etc are atom ids.
[
  [ gef: [], geh: [], gej: [] ],
  [ gef: [], geh: [], gel: [] ],
  [ gej: [], geh: [], gef: [] ],
  [ gej: [], geh: [], gel: [] ],
  [ gel: [], geh: [], gef: [] ],
  [ gel: [], geh: [], gej: [] ]
]

 */
//console.log(branches)

//console.log(ketone_test.render())

// Subsituent branches
const butanone = MoleculeFactory('CC(=O)CC')
console.log('Atoms (butanone')
console.log(butanone[Constants().molecule_atoms_index])
const butatone_test = CanonicalSmiles(butanone)
console.log(butanone[butanone[Constants().molecule_atoms_index]])
process.error()
const butatone_branches = butatone_test.branches(butanone[Constants().molecule_atoms_index])
const butatone_branch_with_substituents = butatone_test.addSubstituents(butatone_branches[0], [],0)
console.log('Branch with substituents:')
console.log(butatone_branch_with_substituents)
process.error()
// -----------------------------------------------

const sodium_ion = MoleculeFactory('[Na+]')
const sodium_ion_smiles_test = CanonicalSmiles(sodium_ion)
sodium_ion_smiles_test.render().should.be.equal('[Na+]')

const sulphuric_acid = 'OS(=O)(=O)O'
console.log(sulphuric_acid)
const sulphuric_acid_molecule = MoleculeFactory(sulphuric_acid)
sulphuric_acid_molecule.should.be.an.Array()
const sulphuric_acid_atoms = sulphuric_acid_molecule[Constants().molecule_atoms_index]
/*
sulphuric_acid_atoms.map((atom)=>{
    console.log(atom)
})
 */
sulphuric_acid_atoms.should.be.an.Array()
sulphuric_acid_atoms[0].should.be.an.Array()
sulphuric_acid_atoms[0].atomicSymbol.should.be.a.String()
sulphuric_acid_molecule.moleculeHydrogens().should.be.an.Array()
if ( 2 !== sulphuric_acid_molecule.moleculeHydrogens().length) {
    console.log(sulphuric_acid_molecule)
    throw new Error('Sulphuric acid molecule should have two hydrogens')
}
sulphuric_acid_molecule.moleculeHydrogens().length.should.be.equal(2)
const sulphuric_acid_smiles_test = CanonicalSmiles(sulphuric_acid_molecule)
sulphuric_acid_smiles_test.render().should.be.equal(sulphuric_acid)

// Charges
const methanium= MoleculeFactory('[C+]N')
methanium[Constants().molecule_atoms_index][2].charge(methanium).should.be.equal(1)
const methylamide= MoleculeFactory('[C-]N')
methylamide[Constants().molecule_atoms_index][3].charge(methylamide).should.be.equal(-1)
const carbon= MoleculeFactory('C')
carbon[Constants().molecule_atoms_index][4].charge(carbon).should.be.equal(0)
const carbocation= MoleculeFactory('[C+]')
carbocation[Constants().molecule_atoms_index][3].charge(carbocation).should.be.equal(1)
const carbanion= MoleculeFactory('[C-]')
carbanion[Constants().molecule_atoms_index][4].charge(carbanion).should.be.equal(-1)
const oxygen= MoleculeFactory('O')
oxygen[Constants().molecule_atoms_index][2].charge(oxygen).should.be.equal(0)
const hydronium= MoleculeFactory('[O+]')
hydronium[Constants().molecule_atoms_index][3].charge(hydronium).should.be.equal(1)
const oxidanide = MoleculeFactory('[O-]')
oxidanide[Constants().molecule_atoms_index][1].charge(oxidanide).should.be.equal(-1)
const aminooxidanide = MoleculeFactory('[O-]N')
aminooxidanide[Constants().molecule_atoms_index][1].charge(aminooxidanide).should.be.equal(-1)
const aminooxidanium = MoleculeFactory('[O+]N')
aminooxidanium[Constants().molecule_atoms_index][2].charge(aminooxidanium).should.be.equal(1)
const nitrogen = MoleculeFactory('N')
nitrogen[Constants().molecule_atoms_index][3].charge(nitrogen).should.be.equal(0)
const ammonium = MoleculeFactory('[N+]')
ammonium[Constants().molecule_atoms_index][4].charge(ammonium).should.be.equal(1)
const azanide = MoleculeFactory('[N-]')
azanide[Constants().molecule_atoms_index][2].charge(azanide).should.be.equal(-1)
const xyz = MoleculeFactory('[N-]O')
xyz[Constants().molecule_atoms_index][2].charge(xyz).should.be.equal(-1)
const hydroxyammonium = MoleculeFactory('[N+]O')
hydroxyammonium[Constants().molecule_atoms_index][3].charge(hydroxyammonium).should.be.equal(1)

// Hydrogen counts
const hydroxylamine = MoleculeFactory('ON')
/*
hydroxylamine[Constants().molecule_atoms_index].map((atom)=>{
    console.log(atom[0])
    console.log(atom.electronPairs)
})
 */
hydroxylamine[Constants().molecule_atoms_index][1].atomicSymbol.should.be.equal("O")
//console.log(hydroxylamine[Constants().molecule_atoms_index][1].atomicSymbol)
hydroxylamine[Constants().molecule_atoms_index][1].hydrogens(hydroxylamine[Constants().molecule_atoms_index]).length.should.be.equal(1)


/*
const t = "CC[O+](CC)([B-](Cl)(Cl)(Cl))"
const t_molecule = MoleculeFactory(t)
const t_smiles_test = CanonicalSmiles(t_molecule)
console.log(t_smiles_test.render())
t_smiles_test.render().should.be.equal(t)
progress.error()
*/



const hydroxide = "[O-]"
console.log(hydroxide)
const hyroxide_atoms = AtomsFactory(hydroxide).filter((atom)=>{
    return atom.atomicSymbol !== "H"
})
/*
hyroxide_atoms.map((atom)=>{
    console.log(atom[0])
    console.log(atom.electronPairs)
})
 */
const hydroxide_molecule = MoleculeFactory(hydroxide)
const hydroxide_smiles_test = CanonicalSmiles(hydroxide_molecule)
console.log(hydroxide_smiles_test.render())
hydroxide_smiles_test.render().should.be.equal(hydroxide)

const me = "CC(CC4=CC=CO=C4)NC"
console.log(me)
const me_atoms = AtomsFactory(me).filter((atom)=>{
    return atom.atomicSymbol !== "H"
})
const first_me_carbon_test_atom = me_atoms[0]
const second_me_carbon_test_atom = me_atoms[1]
const third_me_carbon_test_atom = me_atoms[2]
const fourth_me_carbon_test_atom = me_atoms[3]
const fifth_me_carbon_test_atom = me_atoms[4]
const sixth_me_carbon_test_atom = me_atoms[5]
const seventh_me_carbon_test_atom = me_atoms[6]
const eighth_me_carbon_test_atom = me_atoms[7]
const ninth_me_carbon_test_atom = me_atoms[8]
const tenth_me_carbon_test_atom = me_atoms[10]
const me_nitrogen_test_atom = me_atoms[9]
me_nitrogen_test_atom.atomicSymbol.should.be.equal('N')
// First carbon should be bonded to second carbon
first_me_carbon_test_atom.isSingleBondedTo(second_me_carbon_test_atom).should.be.true()
// First carbon should be NOT be bonded to nitrogen
first_me_carbon_test_atom.isSingleBondedTo(me_nitrogen_test_atom).should.be.false()
first_me_carbon_test_atom.isDoubleBondedTo(me_nitrogen_test_atom).should.be.false()
// First carbon should be NOT be bonded to tenth carbon
first_me_carbon_test_atom.isSingleBondedTo(tenth_me_carbon_test_atom).should.be.false()
first_me_carbon_test_atom.isDoubleBondedTo(tenth_me_carbon_test_atom).should.be.false()
// Second carbon should be bonded to third carbon
second_me_carbon_test_atom.isSingleBondedTo(third_me_carbon_test_atom).should.be.true()
// Second carbon should be bonded to nitrogen
second_me_carbon_test_atom.isSingleBondedTo(me_nitrogen_test_atom).should.be.true()
// Third carbon should be bonded to fourth carbon
third_me_carbon_test_atom.isSingleBondedTo(fourth_me_carbon_test_atom).should.be.true()
// Fourth carbon should be double bonded to fifth carbon
fourth_me_carbon_test_atom.isDoubleBondedTo(fifth_me_carbon_test_atom).should.be.true()
// Fourth carbon should be bonded to ninth carbon
fourth_me_carbon_test_atom.isSingleBondedTo(ninth_me_carbon_test_atom).should.be.true()
// Fifth carbon should be bonded to sixth carbon
fifth_me_carbon_test_atom.isSingleBondedTo(sixth_me_carbon_test_atom).should.be.true()
// Sixth carbon should be double bonded to seventh carbon
sixth_me_carbon_test_atom.isDoubleBondedTo(seventh_me_carbon_test_atom).should.be.true()
// Seventh carbon should be bonded to eighth carbon
seventh_me_carbon_test_atom.isSingleBondedTo(eighth_me_carbon_test_atom).should.be.true()
// Eighth carbon should be double bonded to ninth carbon
eighth_me_carbon_test_atom.isDoubleBondedTo(ninth_me_carbon_test_atom).should.be.true()
// Ninth carbon should be be NOT bonded to nitrogen
ninth_me_carbon_test_atom.isSingleBondedTo(me_nitrogen_test_atom).should.be.false()
ninth_me_carbon_test_atom.isDoubleBondedTo(me_nitrogen_test_atom).should.be.false()
// Nitrogen should be bonded to tenth carbon
me_nitrogen_test_atom.isSingleBondedTo(tenth_me_carbon_test_atom).should.be.true()
const me_molecule = MoleculeFactory(me)
const me_smiles_test = CanonicalSmiles(me_molecule)
console.log(me_smiles_test.render())
me_smiles_test.render().should.be.equal(me)
//progress.error()


const sodium_cyanide = '[C-]#N.[Na+]'
console.log(sodium_cyanide)
const sodium_cyanide_atoms = AtomsFactory(sodium_cyanide).filter((atom)=>{
    return atom.atomicSymbol !== "H"
})
/*
sodium_cyanide_atoms.map((atom)=>{
    console.log(atom[0])
    console.log(atom.electronPairs)
})
 */
const sodium_cyanide_carbon_test_atom = sodium_cyanide_atoms[0]
const sodium_cyanide_nitrogen_test_atom = sodium_cyanide_atoms[1]
const sodium_cyanide_sodium_test_atom = sodium_cyanide_atoms[2]
sodium_cyanide_carbon_test_atom.atomicSymbol.should.be.equal("C")
sodium_cyanide_nitrogen_test_atom.atomicSymbol.should.be.equal("N")
sodium_cyanide_sodium_test_atom.atomicSymbol.should.be.equal("Na")
// Carbon should be triple bonded to nitrogen
sodium_cyanide_carbon_test_atom.isSingleBondedTo(sodium_cyanide_nitrogen_test_atom).should.be.false()
sodium_cyanide_carbon_test_atom.isDoubleBondedTo(sodium_cyanide_nitrogen_test_atom).should.be.false()
sodium_cyanide_carbon_test_atom.isTripleBondedTo(sodium_cyanide_nitrogen_test_atom).should.be.true()
// Carbon should NO be bonded to sodium
sodium_cyanide_carbon_test_atom.isSingleBondedTo(sodium_cyanide_sodium_test_atom).should.be.false()
// Nitrogen should NOT be bonded to sodium
sodium_cyanide_nitrogen_test_atom.isSingleBondedTo(sodium_cyanide_sodium_test_atom).should.be.false()
// Carbon should have negative charge
sodium_cyanide_carbon_test_atom.charge(sodium_cyanide_atoms).should.be.equal(-1)
// Sodium should have positive charge
sodium_cyanide_sodium_test_atom.charge(sodium_cyanide_atoms).should.be.equal(1)
const sodium_cyanide_molecule = MoleculeFactory(sodium_cyanide)
const sodium_cyanide_smiles_test = CanonicalSmiles(sodium_cyanide_molecule)
console.log(sodium_cyanide_smiles_test.render())
sodium_cyanide_smiles_test.render().should.be.equal(sodium_cyanide)
const boron_trichloride = "B(Cl)(Cl)(Cl)"
console.log(boron_trichloride)
const boron_trichloride_atoms = AtomsFactory(boron_trichloride).filter((atom)=>{
    return atom.atomicSymbol !== "H"
})
const boron_trichloride_boron_test_atom = boron_trichloride_atoms[0]
const boron_trichloride_first_chlorine_test_atom = boron_trichloride_atoms[1]
const boron_trichloride_second_chlorine_test_atom = boron_trichloride_atoms[2]
const boron_trichloride_third_chlorine_test_atom = boron_trichloride_atoms[3]
// Boron should be bonded to first chlorine
boron_trichloride_boron_test_atom.isSingleBondedTo(boron_trichloride_first_chlorine_test_atom).should.be.true()
// Boron should be bonded to second chlorine
boron_trichloride_boron_test_atom.isSingleBondedTo(boron_trichloride_second_chlorine_test_atom).should.be.true()
// Boron should be bonded to third chlorine
boron_trichloride_boron_test_atom.isSingleBondedTo(boron_trichloride_third_chlorine_test_atom).should.be.true()
// First chlorine should be NOT bonded to second chlorine
boron_trichloride_first_chlorine_test_atom.isSingleBondedTo(boron_trichloride_second_chlorine_test_atom).should.be.false()
// Second chlorine should be NOT bonded to third chlorine
boron_trichloride_second_chlorine_test_atom.isSingleBondedTo(boron_trichloride_third_chlorine_test_atom).should.be.false()

const boron_trichloride_molecule = MoleculeFactory(boron_trichloride)
const boron_trichloride_smiles_test = CanonicalSmiles(boron_trichloride_molecule)
console.log(boron_trichloride_smiles_test.render())
boron_trichloride_smiles_test.render().should.be.equal(boron_trichloride)

 //progress.error()





/*

const benzene_atoms2 = AtomsFactory(benzene).filter((atom)=>{
    return atom.atomicSymbol !== "H"
})

//console.log(benzene_atoms)
const first_carbon_test_atom = benzene_atoms[0]
const second_carbon_test_atom = benzene_atoms[1]
const third_carbon_test_atom = benzene_atoms[2]
const fourth_carbon_test_atom = benzene_atoms[3]
const fifth_carbon_test_atom = benzene_atoms[4]
const sixth_carbon_test_atom = benzene_atoms[5]
// First carbon should be double bonded to second carbon
first_carbon_test_atom.isDoubleBondedTo(second_carbon_test_atom).should.be.true()
// Second carbon should be bonded to third carbon
third_carbon_test_atom.isBondedTo(second_carbon_test_atom).should.be.true()
// Third carbon should be double bonded to fourth carbon
fourth_carbon_test_atom.isDoubleBondedTo(third_carbon_test_atom).should.be.true()
// Fourth carbon should be bonded to fifth carbon
fifth_carbon_test_atom.isBondedTo(fourth_carbon_test_atom).should.be.true()
// Fifth carbon should be double bonded to sixth carbon
fifth_carbon_test_atom.isDoubleBondedTo(sixth_carbon_test_atom).should.be.true()
// Sixth carbon should be bonded to first carbon
sixth_carbon_test_atom.isBondedTo(first_carbon_test_atom).should.be.true()


const benzene_molecule = MoleculeFactory(benzene)
const benzene_smiles_test = CanonicalSmiles(benzene_molecule)
console.log(benzene_smiles_test.render())
benzene_smiles_test.render().should.be.equal(benzene)


// const af = AtomsFactory("[B-]([O+](CC)CC)(Cl)(Cl)Cl")
// benzene
//  CC(CC1=CC2=C(C=C1)OCO2)NC
//const s = "CC(CC1=CC2=C(C=C1)OCO2)NC"
//const s = "CF(BrCl1=IP2=(B=N1)OCO2)NS"
//const s = "CCl(PBr1=BS2=F(Cl=S1)OCP2)NC"
//const s = "C=C"
const s = "C(N)(O)"
const atoms = AtomsFactory(s)
 */
/*
atoms.map((atom)=>{
    console.log(atom[0])
    console.log(atom.electronPairs)
})
*/
const nitrogen_test_atom = atoms.filter((atom)=>{
    return atom.atomicSymbol === "N"
}).pop()
const oxygen_test_atom = atoms.filter((atom)=>{
    return atom.atomicSymbol === "O"
}).pop()
const carbon_test_atom = atoms.filter((atom)=>{
    return atom.atomicSymbol === "C"
}).pop()
// There should be no bond between the nitrogen and oxygen atom
nitrogen_test_atom.isSingleBondedTo(oxygen_test_atom).should.be.false()
// There should be a bond between the nitrogen and carbon atom
nitrogen_test_atom.isSingleBondedTo(carbon_test_atom).should.be.true()
// There should be a bond between the oxygen and carbon atom
oxygen_test_atom.isSingleBondedTo(carbon_test_atom).should.be.true()
const m = MoleculeFactory(s)
const smiles_test = CanonicalSmiles(m)
smiles_test.render().should.be.equal(s)

//progress.error()







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

    const onMoleculeFound = (expected_smiles) => {
        return (chemical) => {

            const molecule = MoleculeFactory(
                chemical.CanonicalSMILES,
                chemical.MolecularFormula,
                chemical.CID,
                chemical.IUPACName,
                chemical.Charge,
                chemical.HeavyAtomCount,
                chemical.tags
            )

            //console.log(molecule[Constants().molecule_atoms_index])

            const cs = CanonicalSmiles(molecule)
            const atoms = molecule[Constants().molecule_atoms_index].filter((atom)=>{
                return atom.atomicSymbol !== 'H'
            })

            /*
                        console.log('Atoms')
                        atoms.map((atom)=>{
                            const atom_bonds = atom.bonds(atoms).map((bond)=>{
                                return bond.atom.atomId
                            })
                            console.log(atom.atomicSymbol + ' ' + atom.atomId + '(' + atom_bonds + ')')
                        })
                        console.log('atoms done')

             */

            //const smiles = cs.canonicalSMILES(atoms[0], null, '', 0)
            const smiles_test = CanonicalSmiles(molecule)
            const smiles = smiles_test.render()

            if (expected_smiles !== smiles) {
                console.log('Expected SMILES: '+ expected_smiles)
                console.log('Actual: ' +smiles)
                throw new Error("SMILES do not match")
            }
        }
    }

    const onError = (search) => {
        console.log('Chemical not found. Please try again using SMILES or IUPAC name.')
    }


    // boron trichloride
    lookupMolecule(db, 'boron trichloride', "IUPACName", logger, PubChemLookup).then(
        // "resolves" callback
        onMoleculeFound('B(Cl)(Cl)(Cl)'),
        onError
    )




    // diethyl ether
    lookupMolecule(db, 'ethoxyethane', "IUPACName", PubChemLookup).then(
        // "resolves" callback
        onMoleculeFound('CCOCC'),
        onError
    )

    // 2-Bromo-2-methylpropane
    lookupMolecule(db, '2-Bromo-2-methylpropane', "IUPACName", PubChemLookup).then(
        // "resolves" callback
        onMoleculeFound('CC(C)(C)(Br)'),
        onError
    )

    lookupMolecule(db, 'aminomethanol', "IUPACName", PubChemLookup).then(
        // "resolves" callback
        onMoleculeFound('C(N)(O)'),
        onError
    )

    lookupMolecule(db, '2-aminoethanol', "IUPACName", PubChemLookup).then(
        // "resolves" callback
        onMoleculeFound('C(CO)(N)'),
        onError
    )

    lookupMolecule(db, '2-(hydroxymethylamino)ethanol', "IUPACName", PubChemLookup).then(
        // "resolves" callback
        onMoleculeFound('C(CO)(NCO)'),
        onError
    )

    // H3O+
    lookupMolecule(db, 'oxidanium', "IUPACName", PubChemLookup).then(
        // "resolves" callback
        onMoleculeFound('[O+]'),
        onError
    )

    // Cl-
    lookupMolecule(db, 'chloride', "IUPACName", PubChemLookup).then(
        // "resolves" callback
        onMoleculeFound('[Cl-]'),
        onError
    )


    // sodium cyanide
    lookupMolecule(db, 'sodium cyanide', "IUPACName", PubChemLookup).then(
        // "resolves" callback
        onMoleculeFound('[C-]#N.[Na+]'),
        onError
    )


    /*
    const onAddSolventSuccess = (container, solvent) => {
        if (container[Constants().container_solvent_index] === null) {
            console.log("Failed to add solvent to container")
        }else if (!_.isEqual(solvent, container[Constants().container_solvent_index])) {
            console.log("Added wrong substance as solvent to container")
        } else {
            console.log("Successfully added solvent to container")
            AddSubstanceToContainer(
                addSubstanceError,
                onAddSubstrateSuccess,
                db,
                container,
                "HCl",
                1,
                "HCl"
            )
        }
    }

     */

    /*
    const onSubstanceSuccess = (container, solvent) => {
        if (container[Constants().container_solvent_index] === null) {
            console.log("Failed to add solvent to container")
        }else if (!_.isEqual(solvent, container[Constants().container_solvent_index])) {
            console.log("Added wrong substance as solvent to container")
        } else {
            console.log("Successfully added solvent to container")
        }
    }

     */

    // onError, onAddSolventSuccess, db, container, chemical_name, units, tag
    /*
    AddSubstanceToContainer(
        addSubstanceError,
        onSubstanceSuccess,
        db,
        container,
        "water",
        "solvent",
        "water"
    )
    */

    // Reaction testing


    /*
    const addSolventCallback = (onAddSolventSuccess, container) => {
        return (solvent) => {
            AddSolventToContainer (onAddSolventSuccess, container, solvent)
        }
    }

     */

    const container = ContainerFactory()
    if (container[Constants().container_substrate_index] !== null) {
        console.log('Container substrate should be null')
    }
    if (container[Constants().container_reagent_index] !== null) {
        console.log('Container reagent should be null')
    }
    if (container[Constants().container_solvent_index] !== null) {
        console.log('Container solvent should be null')
    }
    if (container[Constants().container_molecules_index].length !== 0) {
        console.log('Container should container no molecules')
    }

    const addSubstanceError = (search) => {
        console.log('Chemical not found. Please try again using SMILES or IUPAC name.')
    }

    const onReactionError = (container) => {

    }

    // Reflection testing

    // Bronsted Lowery Acid
    // Water may be protonated by sulfuric acid:
    // H2SO4 + H2O ⇌ H3O+ + HSO4
    // A Bronsted Lowery acid is a molecule or atom that donates a proton (H+).
    const sulphuric_acid = MoleculeFactory('OS(=O)(=O)O')
    const proton_acid_atom = FindBronstedLoweryAcidAtom(sulphuric_acid)
    if (undefined === proton_acid_atom) {
        throw new Error('Proton not found')
    }
    if (!Array.isArray(proton_acid_atom)) {
        console.log(proton_acid_atom)
        throw new Error('Proton should be an array')
    }
    proton_acid_atom.atomicSymbol.should.be.a.String()
    proton_acid_atom.atomicSymbol.should.be.equal('O')
    proton_acid_atom.electronPairs.length.should.be.equal(6)
    proton_acid_atom.hydrogens(sulphuric_acid[Constants().molecule_atoms_index]).length.should.be.equal(1)

    const water = MoleculeFactory('O')
    const bronsted_lowery_base_atom = FindBronstedLoweryBaseAtom(water)
    console.log(bronsted_lowery_base_atom)
    bronsted_lowery_base_atom.atomicSymbol.should.be.a.String()
    bronsted_lowery_base_atom.atomicSymbol.should.be.equal('O')
    bronsted_lowery_base_atom.electronPairs.length.should.be.equal(6)
    bronsted_lowery_base_atom.hydrogens(water[Constants().molecule_atoms_index]).length.should.be.equal(2)
    progress.error()

    // Mechanisms testing
    //




    const onAcidBaseReactionCompletedCallback = (expected_substrate_smiles, expected_reagent_smiles) => {

        return (container) => {

            Typecheck(
                {name:"container", value:container, type:"array"},
                {name:"expected_substrate_smiles", value:expected_substrate_smiles, type:"string"},
                {name:"expected_reagent_smiles", value:expected_substrate_smiles, type:"string"},
            )

            if (container[Constants().container_substrate_index]===null && expected_substrate_smiles !== null) {
                throw new Error("Product substrate should be null")
            } else {
                const substrate_molecule = container[Constants().container_substrate_index]
                const sm = CanonicalSmiles(substrate_molecule)
                const substrate_atoms = substrate_molecule[Constants().molecule_atoms_index].filter((atom) => {
                    return atom.atomicSymbol !== 'H'
                })
               // const substrate_smiles = sm.canonicalSMILES(substrate_atoms[0], null, '', 0)
                const substrate_smiles = sm.render()
                substrate_smiles.should.be.equal(expected_substrate_smiles)

                lookupMolecule(db, substrate_smiles, "SMILES", PubChemLookup).then(
                    (chemical) => {
                        const new_substrate = MoleculeFactory(
                            chemical.CanonicalSMILES,
                            chemical.MolecularFormula,
                            chemical.CID,
                            chemical.IUPACName,
                            chemical.Charge,
                            chemical.HeavyAtomCount,
                            chemical.tags
                        )
                        console.log("New substrate:")
                        console.log(new_substrate)
                    },
                    onError
                )

            }


            if (container[Constants().container_reagent_index] === null && expected_reagent_smiles !== null) {
                throw new Error("Product should be null")
            } else {
                console.log(container[Constants().container_reagent_index])
                const reagent_molecule = container[Constants().container_reagent_index]
                if (reagent_molecule !== null) {
                    console.log("reagent molecule")
                    console.log(reagent_molecule)
                    const rm = CanonicalSmiles(reagent_molecule)
                    const reagent_atoms = reagent_molecule[Constants().molecule_atoms_index].filter((atom) => {
                        return atom.atomicSymbol !== 'H'
                    })
                    const reagent_smiles = rm.canonicalSMILES(reagent_atoms[0], null, '', 0)
                    reagent_smiles.should.be.equal(expected_reagent_smiles)

                    lookupMolecule(db, reagent_smiles, "SMILES", PubChemLookup).then(
                        (chemical) => {
                            const new_reagent = MoleculeFactory(
                                chemical.CanonicalSMILES,
                                chemical.MolecularFormula,
                                chemical.CID,
                                chemical.IUPACName,
                                chemical.Charge,
                                chemical.HeavyAtomCount,
                                chemical.tags
                            )
                            console.log("New reagent:")
                            console.log(new_reagent)
                        },
                        onError
                    )
                }
            }

            console.log("Tests completed")
        }

    }

    const onAddAcidBaseReagentSuccess = (expected_substrate_smiles, expected_reagent_smiles) => {
        return (container, reagent) => {
            Typecheck(
                {name:"container", value:container, type:"array"},
                {name:"reagent", value:reagent, type:"array"},
                {name:"expected_substrate_smiles", value:expected_substrate_smiles, type:"string"},
                {name:"expected_reagent_smiles", value:expected_substrate_smiles, type:"string"},
            )
            if (container[Constants().container_reagent_index] === null) {
                console.log("Failed to add reagent to container")
            } else if (!_.isEqual(reagent, container[Constants().container_reagent_index])) {
                console.log("Added wrong substance as reagent to container")
            } else {
                console.log("Successfully added reagent to container")
                //ReactionDecisionTree(onReactionError, onAcidBaseReactionCompletedCallback(expected_substrate_smiles, expected_reagent_smiles), container)
            }
        }
    }


    const onAcidBaseReagentFoundCallback = (onAddAcidBaseReagentSuccess, container, expected_substrate_smiles, expected_reagent_smiles) => {
        return (chemical) => {
            Typecheck(
                {name:"onAddAcidBaseReagentSuccess", value:onAddAcidBaseReagentSuccess, type:"function"},
                {name:"container", value:container, type:"array"},
                {name:"expected_substrate_smiles", value:expected_substrate_smiles, type:"string"},
                {name:"expected_reagent_smiles", value:expected_substrate_smiles, type:"string"},
                {name:"chemical", value:chemical, type:"object"},
            )
            const reagent = MoleculeFactory(
                chemical.CanonicalSMILES,
                chemical.MolecularFormula,
                chemical.CID,
                chemical.IUPACName,
                chemical.Charge,
                chemical.HeavyAtomCount,
                chemical.tags
            )
            reagent.should.be.an.Array()
            AddReagentToContainer(onAddAcidBaseReagentSuccess(expected_substrate_smiles, expected_reagent_smiles), container, reagent)
        }
    }

    const onAddAcidBaseSubstrateSuccess = (expected_substrate_smiles, expected_reagent_smiles) => {

        return (container, substrate) => {
            Typecheck(
                {name:"container", value:container, type:"array"},
                {name:"expected_substrate_smiles", value:expected_substrate_smiles, type:"string"},
                {name:"expected_reagent_smiles", value:expected_substrate_smiles, type:"string"},
                {name:"substrate", value: substrate, type:"object"},
            )
            if (container[Constants().container_substrate_index] === null) {
                console.log("Failed to add substrate to container")
            } else if (!_.isEqual(substrate, container[Constants().container_substrate_index])) {
                console.log("Added wrong substance as substrate to container")
            } else {
                console.log("Successfully added substrate to container")

                lookupMolecule(db, 'diethyl ether', "IUPACName", PubChemLookup).then(
                    onAcidBaseReagentFoundCallback(onAddAcidBaseReagentSuccess, container, expected_substrate_smiles, expected_reagent_smiles),
                    onError
                )
            }
        }
    }

    const onAcidBaseSubstrateFoundCallback = (onAddAcidBaseSubstrateSuccess, container, expected_substrate_smiles, expected_reagent_smiles) => {
        return (chemical) => {
            Typecheck(
                {name:"onAddAcidBaseSubstrateSuccess", value:onAddAcidBaseSubstrateSuccess, type:"function"},
                {name:"container", value:container, type:"array"},
                {name:"expected_substrate_smiles", value:expected_substrate_smiles, type:"string"},
                {name:"expected_reagent_smiles", value:expected_substrate_smiles, type:"string"},
                {name:"chemical", value: chemical, type:"object"},
            )
            const substrate = MoleculeFactory(
                chemical.CanonicalSMILES,
                chemical.MolecularFormula,
                chemical.CID,
                chemical.IUPACName,
                chemical.Charge,
                chemical.HeavyAtomCount,
                chemical.tags
            )
            substrate.should.be.a.Array()
            AddSubstrateToContainer(onAddAcidBaseSubstrateSuccess(expected_substrate_smiles, expected_reagent_smiles), container, substrate)
        }
    }

    // Bronsted Lowery
    /*
    lookupMolecule(db, 'HCL', "IUPACName", PubChemLookup).then(
        // "resolves" callback
        onAcidBaseSubstrateFoundCallback(onAddAcidBaseSubstrateSuccess, container, "[Cl-]", "[O+]"),
        onError
    )
     */

    // Lewis
    lookupMolecule(db, 'boron trichloride', "IUPACName", PubChemLookup).then(
        onAcidBaseSubstrateFoundCallback(onAddAcidBaseSubstrateSuccess, container, "CC[O+](CC)([B-](Cl)(Cl)(Cl))", null),
        onError
    )




})

