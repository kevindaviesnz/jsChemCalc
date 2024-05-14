const MongoClient = require('mongodb').MongoClient


const LewisAcidAtom = require('../reflection/LewisAcidAtom')
const LewisBaseAtom = require('../reflection/LewisBaseAtom')
const LewisAcidBaseReverse = require('../reactions/LewisAcidBaseReverse')
const NucleophilicAttack = require('../mechanisms/NucleophilicAttack')
const CarbocationRearrangement = require('../mechanisms/CarbocationRearrangement')
const LewisAcidBaseReaction = require('../reactions/LewisAcidBaseReaction')
const AkylShift = require('../mechanisms/AkylShift')
const BondAtomToAtom = require('../mechanisms/BondAtomToAtomInSameMolecule')
const BreakBond = require('../mechanisms/BreakBondInSameMolecule')
const Hydrate = require('../mechanisms/Hydrate')
const Reduce = require('../mechanisms/Reduce')
const Oxidise = require('../mechanisms/Oxidise')
const OxidiseReverse = require('../mechanisms/OxidationReverse')
const LeavingGroupRemoval = require('../mechanisms/LeavingGroupRemoval')
const HydrideShift = require('../mechanisms/HydrideShift')
const ProtonTransfer = require('../mechanisms/ProtonTransfer')
const Deprotonate = require('../mechanisms/Deprotonate')
const Protonate = require('../mechanisms/Protonate')
const Distill = require('../mechanisms/Distill')
const Constants = require('../Constants')
const MoleculeFactory = require('../factories/MoleculeFactory')
const ContainerFactory = require('../factories/ContainerFactory')
const BronstedLoweryAcidBase = require('../reactions/BronstedLoweryAcidBaseReaction')
const AI = require('../AI/AI')
const _ = require('lodash');
const Typecheck = require('../Typecheck')
const OneTwoElimination = require('../mechanisms/OneTwoElimination')
const OneTwoAddition = require('../mechanisms/OneTwoAddition')
const BreakBondInSameMoleculeReverse = require('../mechanisms/BreakBondInSameMoleculeReverse')
const CacheClient = require('../cache/CacheClient')
const SN2 = require('../reactions/SN2')
const BondAtomToAtomInSameMolecule = require('../mechanisms/BondAtomToAtomInSameMolecule')
const ContainerView = require('../view/Container')
const AtomsFactory = require('../factories/AtomsFactory')
const AddAtom = require('../actions/AddAtom')
const HydrohalicAcidAdditionOnDoubleBond= require('../reactions/HydrohalicAcidAdditionOnDoubleBond')
const HydrohalicAcidAdditionOnDoubleBondReverse = require('../reactions/HydrohalicAcidAdditionOnDoubleBondReverse')
const RitterReverse = require("../reactions/RitterReverse")

const Prototypes = require("../Prototypes")
Prototypes()

console.log('Connecting to database, please wait ...')

// Install using npm install dotenv
require("dotenv").config()

const assert = require('assert');
const winston = require('winston');
const { template, at } = require('lodash')
const { errorMonitor } = require('events')
const { Container } = require('winston')
const { P, H } = require('../factories/PeriodicTable')
const { bgRed } = require('colors')
const Oxymercuration = require('../reactions/Oxymercuration')
const E1 = require('../reactions/E1')
const E1Reverse = require('../reactions/E1Reverse')
const OxidisationReverse = require('../mechanisms/OxidationReverse')
const DeprotonateReverse = require('../mechanisms/DeprotonateReverse')
const OxymercurationReverse = require('../reactions/OxymercurationReverse')
const ReductiveAminationReverse = require('../reactions/ReductiveAminationReverse')

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'user-service' },
    transports: [
        //
        // - Write all logs with importance level of `error` or less to `error.log`
        // - Write all logs with importance level of `info` or less to `combined.log`
        //
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ],
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (true) {
    logger.add(new winston.transports.Console({
        format: winston.format.simple(),
    }));
}

const acetamide = MoleculeFactory(
    AtomsFactory('CC(C)(C)NC(C)=O', logger),
    false,
    false, 
    logger
)
const acetamide_container = ContainerFactory(null, [], null, logger)
acetamide_container.addSubstrate(acetamide, 1, logger)
//const ritter_reverse_containers_pathways = RitterReverse(acetamide_container, logger)
//const ritter_reverse_containers = ritter_reverse_containers_pathways[0]
const ritter_smiles =  acetamide_container.getSubstrate()[0].canonicalSmiles(false, acetamide_container.getSubstrate()[0].atoms, logger)
if ("CC(C)(C)NC(=O)C" !== ritter_smiles) {
    throw new Error('Substrate should be CC(C)(C)NC(=O)C but got ' +  ritter_smiles + ' instead.')
}
console.log('Ritter smiles ok')

const w = MoleculeFactory(
    AtomsFactory('O', logger),
    false,
    false, 
    logger
)
const w_smiles = w.canonicalSmiles(false, w.atoms, logger)
console.log('water ok')



const bromoamine = MoleculeFactory(
    AtomsFactory('BrCNC(C)C', logger),
    false,
    false, 
    logger
)
const bromoamine_container = ContainerFactory(null, [], null, logger)
bromoamine_container.addSubstrate(bromoamine, 1, logger)
// 5.BrC[N+]=C(C)C -> reduce -> BrCNC(C)C
// 4.BrCNC(C)([O+])C -> 1,2 Elimination BrC[N+]=C(C)C
// 3.BrC[N+]C(C)(C)O -> Proton Transfer BrCNC(C)(C)[O+]
// 2.C=[O+] + BrCN -> 1,2 Addition -> BrC[N+]C(C)(C)O
// 1.C=O -> Protonation C=[O+]
const reductive_amination_reverse_containers_pathways = ReductiveAminationReverse(bromoamine_container, logger)
const reductive_amination_reverse_containers = reductive_amination_reverse_containers_pathways[0]
const reductive_amination_smiles =  reductive_amination_reverse_containers[0].substrate.canonicalSmiles(false, reductive_amination_reverse_containers[0].substrate.atoms, logger)
if ("CC(=O)C" !== reductive_amination_smiles) {
    throw new Error('Substrate should be CC(=O)C but got ' +  reductive_amination_smiles + ' instead.')
}
console.log('Reductive amination reverse ok')

const tert_alcohol = MoleculeFactory(
    AtomsFactory('CC(O)(C)(C)', logger),
    false,
    false, 
    logger
)

const tert_alcohol_container = ContainerFactory(null, [], null, logger)
tert_alcohol_container.addSubstrate(tert_alcohol, 1, logger)
// OC(C)CC[Hg]O[Ac] -> reduce -> CC(O)(C)(C)
const oxymercuraton_reverse_containers_pathways = OxymercurationReverse(tert_alcohol_container, logger)
const oxymercuraton_reverse_containers = oxymercuraton_reverse_containers_pathways[0]
// "C=C(C)C"
const oxymerc_smiles =  oxymercuraton_reverse_containers[0].substrate.canonicalSmiles(false, oxymercuraton_reverse_containers[0].substrate.atoms, logger)
if ("C=C(C)C" !== oxymerc_smiles) {
    throw new Error('Substrate should be C=C(C)C but got ' +  oxymerc_smiles + ' instead.')
}
console.log('Oxymercuration reverse ok')
console.log('Done')
process.exit()

const oxymerc_1 = MoleculeFactory(
    AtomsFactory('C([C+](C)C)[Hg]O[Ac]', logger),
    false,
    false,
    logger
)
const oxymerc_1_smiles = oxymerc_1.canonicalSmiles(false, oxymerc_1.atoms, logger)
if ('C[C+](C)C[Hg]O[Ac]' !== oxymerc_1_smiles) {
    throw new Error('Substrate should be C[C+](C)C[Hg]O[Ac] but got ' +  oxymerc_1_smiles + ' instead.')
}
console.log('oxymerc_1 ok')
const oxymerc_1_container = ContainerFactory(null, [], null, logger)
oxymerc_1_container.addSubstrate(oxymerc_1, 1, logger)
const break_bond_reverse_container = BreakBondInSameMoleculeReverse(oxymerc_1_container, logger)
break_bond_reverse_container.getSubstrate()[0].smiles_string = break_bond_reverse_container.getSubstrate()[0].canonicalSmiles(false, break_bond_reverse_container.getSubstrate()[0].atoms, logger)
if ('CC1(C)(C[Hg+]1O[Ac])' !== break_bond_reverse_container.getSubstrate()[0].smiles_string) {
    throw new Error('After reversing bond break substrate should be CC1(C)(C[Hg+]1O[Ac]) but got ' + break_bond_reverse_container.getSubstrate()[0].smiles_string + ' instead.')
}
console.log('oxymerc_1 BreakBondInSameMoleculeReverse() ok')

const oxymerc_2 = MoleculeFactory(
    AtomsFactory('CC1(C[Hg]1[O+][Ac])(C)', logger), // CC1(C)(C[Hg+]1)O[Ac] , CC1(C[Hg]1[O+][Ac])(C)
    false,
    false,
    logger
)
const oxymerc_2_smiles = oxymerc_2.canonicalSmiles(false, oxymerc_2.atoms, logger)
if ('CC1(C)(C[Hg+]1[O+][Ac])' !== oxymerc_2_smiles) {
    throw new Error('Substrate should be CC1(C)(C[Hg+]1[O+][Ac]) but got ' +  oxymerc_2_smiles + ' instead.')
}
console.log('oxymerc_2 ok')

// m ring
const m_ring = MoleculeFactory(
    AtomsFactory('CC(CC1=CC=CC=C1)NC', logger), 
    false,
    false,
    logger
)
const m_container = ContainerFactory(null, [], null, logger)
m_container.addSubstrate(m_ring, 1, logger)
const e1_reverse_container = E1Reverse(m_container, logger)
const e_1_smiles = e1_reverse_container.getSubstrate()[0].canonicalSmiles(false, e1_reverse_container.getSubstrate()[0].atoms, logger)
if ('CC(NC)CC1(C=CC=CC1)Cl' !== e_1_smiles) {
    throw new Error('After applying E1Reverse() container substrate should be CC(NC)CC1(C=CC=CC1)Cl but got ' +  e_1_smiles + ' instead.')
}
const m_smiles = m_ring.canonicalSmiles(false, m_ring.atoms, logger)
if ('CC(NC)CC1C=CC=CC=1' !== m_smiles) {
    throw new Error('Smiles should be CC(NC)CC1C=CC=CC=1 but got ' +  m_smiles + ' instead.')
}
console.log('m_ring ok')

// md ring
const md_ring = MoleculeFactory(
    AtomsFactory('CC(CC1=CC2=C(C=C1)OCO2)NC', logger), 
    false,
    false,
    logger
)
const md_smiles = md_ring.canonicalSmiles(false, md_ring.atoms, logger)
if ('CC(NC)CC1C=CC2OCOC=2C=1' !== md_smiles) {
    throw new Error('Smiles should be CC(NC)CC1C=CC2OCOC=2C=1 but got ' +  md_smiles + ' instead.')
}
console.log('md_ring ok')

const one_three_benzodioxole = MoleculeFactory(
    AtomsFactory('C2OC1=CC=CC=C1O2', logger), 
    false,
    false,
    logger
)
const one_three_benzodioxole_smiles = one_three_benzodioxole.canonicalSmiles(false, one_three_benzodioxole.atoms, logger)
if ('C1OC2=CC=CC=C2O1' !== one_three_benzodioxole_smiles) {
    throw new Error('Smiles should be C1OC2=CC=CC=C2O1 but got ' +  one_three_benzodioxole_smiles + ' instead.')
}
console.log('one_three_benzodioxole ok')

// aniline
const aniline = MoleculeFactory(
    AtomsFactory('NC1=CC=CC=C1', logger), 
    false,
    false,
    logger
)
const aniline_smiles = aniline.canonicalSmiles(false, aniline.atoms, logger)
if ('NC1C=CC=CC=1' !== aniline_smiles) {
    throw new Error('Smiles should be NC1C=CC=CC=1 but got ' +  aniline_smiles + ' instead.')
}
console.log('aniline ok')

// benzene
const benzene = MoleculeFactory(
    AtomsFactory('C1=CC=CC=C1', logger), 
    false,
    false,
    logger
)
const benzene_smiles = benzene.canonicalSmiles(false, benzene.atoms, logger)
if ('C1=CC=CC=C1' !== benzene_smiles) {
    throw new Error('Smiles should be C1=CC=CC=C1 but got ' +  benzene_smiles + ' instead.')
}
console.log('benzene ok')

// cyclohexane
const cyclohexane = MoleculeFactory(
    AtomsFactory('C1CCCCC1', logger), 
    false,
    false,
    logger
)
const cyclohexane_smiles = cyclohexane.canonicalSmiles(false, cyclohexane.atoms, logger)
if ('C1CCCCC1' !== cyclohexane_smiles) {
    throw new Error('Smiles should be C1CCCCC1 but got ' + cyclohexane_smiles + ' instead.')
}
console.log('cyclohexane ok')

// cyclopropane
const cyclopropane_ring = MoleculeFactory(
    AtomsFactory('C1CC1', logger), 
    false,
    false,
    logger
)
const cyclopropane_smiles = cyclopropane_ring.canonicalSmiles(false, cyclopropane_ring.atoms, logger)
if ('C1CC1' !== cyclopropane_smiles) {
    throw new Error('Smiles should be C1CC1 but got ' +  cyclopropane_smiles + ' instead.')
}
console.log('cyclopropane ok')

// cyclopropylamine
const cyclopropylamine_ring = MoleculeFactory(
    AtomsFactory('C1CC1N', logger), 
    false,
    false,
    logger
)
const cyclopropylamine_smiles = cyclopropylamine_ring.canonicalSmiles(false, cyclopropylamine_ring.atoms, logger)
if ('NC1CC1' !== cyclopropylamine_smiles) {
    throw new Error('Smiles should be NC1CC1 but got ' +  cyclopropylamine_smiles + ' instead.')
}
console.log('cyclopropylamine ok')

console.log('all done')
process.exit()




process.exit()





process.exit()












process.exit()

// Reduce (oxymercuration)
const r_o = MoleculeFactory(
    AtomsFactory('C(C(C)(O)C)[Hg]O[Ac]', logger), 
    false,
    false,
    logger
)
const ro_container = ContainerFactory(null, [], null, logger)
ro_container.addSubstrate(r_o, 1, logger)
ro_container.addReagent('NaBH4', 1, logger)
Reduce(ro_container, logger)
const r_o_smiles = ro_container.getSubstrate()[0].canonicalSmiles(false, ro_container.getSubstrate()[0].atoms, logger)
if ('CC(C)(O)C' !== r_o_smiles) {
    throw new Error('After applying Reverse() container substrate should be CC(C)(O)C but got ' +  r_o_smiles + ' instead.')
}
console.log('ok')

// Test LewisAcidBaseReverse() error
const l_b = MoleculeFactory(
    AtomsFactory('C(CC1(CC(CC=C1)Cl)Cl)[N+]CO', logger), 
    false,
    false,
    logger
)
const lb_container = ContainerFactory(null, [], null, logger)
lb_container.addSubstrate(l_b, 1, logger)
LewisAcidBaseReverse(lb_container, logger)
console.log('Test LewisAcidBaseReverse() error - OK')


// Reduce
const r_a = MoleculeFactory(
    AtomsFactory('CC[N+]=C', logger), 
    false,
    false,
    logger
)
const ra_container = ContainerFactory(null, [], null, logger)
ra_container.addSubstrate(r_a, 1, logger)
ra_container.addReagent('NaBH3CN', 1, logger)
Reduce(ra_container, logger)
const r_a_smiles = ra_container.getSubstrate()[0].canonicalSmiles(false, ra_container.getSubstrate()[0].atoms, logger)
if ('CCNC' !== r_a_smiles) {
    throw new Error('After applying Reverse() container substrate should be CCNC but got ' +  r_a_container.canonicalSmiles + ' instead.')
}
console.log('ok')
process.exit()


// Oxymercuration
const mercuric_acetate = MoleculeFactory(
    AtomsFactory('[Hg](O[Ac])O[Ac]', logger), 
    false,
    false,
    logger
)
const isobutene_1 = MoleculeFactory(
    AtomsFactory('C(C)(C)=C', logger), 
    false,
    false,
    logger
)

let isobutene_container = ContainerFactory(null, [], null, logger)
isobutene_container.addSubstrate(isobutene_1, 1, logger)
isobutene_container.addReagent(mercuric_acetate, 1, logger)
Oxymercuration(isobutene_container, logger)
console.log(isobutene_container.getSubstrate()[0].canonicalSmiles(false, container.getSubstrate()[0].atoms,logger))
console.log('ok')
process.exit()


// CC(=[O+])CC1=CC2=C(C=C1)[O+]C[O+]2
const dep_rev = MoleculeFactory(
    AtomsFactory('CC(=[O+])CC1=CC2=C(C=C1)[O+]C[O+]2', logger), 
    false,
    false,
    logger
)
const dep_rev_container = ContainerFactory(null, [], null, logger)
dep_rev_container.addSubstrate(dep_rev, 1, logger)
DeprotonateReverse(dep_rev_container, logger)
console.log('ok')
process.exit()


// [HydrohalicReverse] CC([O+])[C+]C1=CC2=C(C=C1)OCO2
// [E1] CC([O+])[C+]C1=CC2=C(C=C1)OCO2
// [E1] CC([O+])(CC1=CC2=C(C=C1)OCO2)[O+]
const e1_test_molecule_3 = MoleculeFactory(
    AtomsFactory('CC([O+])(CC1=CC2=C(C=C1)OCO2)[O+]', logger), 
    false,
    false,
    logger
)
const e1_test_molecule_container_3 = ContainerFactory(null, [], null, logger)
e1_test_molecule_container_3.addSubstrate(e1_test_molecule_3, 1, logger)
E1(e1_test_molecule_container_3, logger)
console.log('ok')
process.exit()


const e1_reverse_test_molecule_3 = MoleculeFactory(
    AtomsFactory('CC(=O)CC1(CC2(C(C(C1)Cl)OCO2)Cl)Cl', logger), // CC2C[O+]2
    false,
    false,
    logger
)
const e1_reverse_test_molecule_container_3 = ContainerFactory(null, [], null, logger)
e1_reverse_test_molecule_container_3.addSubstrate(e1_reverse_test_molecule_3, 1, logger)
const e1_reverse_test_molecule_container_reverse_3 = E1Reverse(e1_reverse_test_molecule_container_3, logger)
console.log('ok')
process.exit()

// 'CC(=O)CC1(CC2(C(C(C1)Cl)OCO2)Cl)Cl'
// CC(=[O+])CC1(CC2=C(C=C1)[O+]C[O+]2)Cl
// CC([O-])[C+]C1(CC2=C(C=C1)OCO2)Cl
// CC(=O)CC1(CC2(C(C(C1)Cl)OCO2)Cl)Cl
const e1_molecule_1 = MoleculeFactory(
    AtomsFactory('CC(=O)CC1(CC2(C(C(C1)Cl)OCO2)Cl)Cl', logger), // CC2C[O+]2
    false,
    false,
    logger
)
const e1_molecule_container_4 = ContainerFactory(null, [], null, logger)
e1_molecule_container_4.addSubstrate(e1_molecule_1, 1, logger)
const e1_res = E1(e1_molecule_container_4, logger)
console.log('ok')
process.exit()








// [E1Reverse] Calling E1Reverse() for CC([O-])[C+]C1=CC2=C(C=C1)OCO2
const e1_reverse_test_molecule_2 = MoleculeFactory(
    AtomsFactory('CC([O-])[C+]C1=CC2=C(C=C1)OCO2', logger),
    false,
    false,
    logger
)
const e1_reverse_test_molecule_container_2 = ContainerFactory(null, [], null, logger)
e1_reverse_test_molecule_container_2.addSubstrate(e1_reverse_test_molecule_2, 1, logger)
const e1_reverse_test_molecule_container_reverse_2 = E1Reverse(e1_reverse_test_molecule_container_2, logger)
console.log('ok')
process.exit()

// Reversal doesn't work for CC(=O)CC1(CC2=C(C=C1)OCO2)Cl
/*
const t = MoleculeFactory(
    AtomsFactory('CC(=O)CC1(CC2(C(C=C1)OCO2)Cl)Cl', logger),
    false,
    false,
    logger
)
*/
const e1_reverse_test_molecule = MoleculeFactory(
    AtomsFactory('CC(=O)CC1(CC2=C(C=C1)OCO2)Cl', logger),
    false,
    false,
    logger
)
const e1_reverse_test_molecule_container = ContainerFactory(null, [], null, logger)
e1_reverse_test_molecule_container.addSubstrate(e1_reverse_test_molecule, 1, logger)
const e1_reverse_test_molecule_container_reverse = E1Reverse(e1_reverse_test_molecule_container, logger)

// Oxidisation
// Reversal : CC(=[O+])CC1=CC2=C(C=C1)OCO2
const possibly_oxidised_molecule = MoleculeFactory(
    AtomsFactory('CC(=[O+])CC1=CC2=C(C=C1)OCO2', logger),
    false,
    false,
    logger
)
const possibly_oxidised_molecule_container = ContainerFactory(null, [], null, logger)
possibly_oxidised_molecule_container.addSubstrate(possibly_oxidised_molecule, 1, logger)
const possibly_oxidised_molecule_container_reverse = OxidisationReverse(possibly_oxidised_molecule_container, logger)

// E1


const two_Chloro_2_methylpropane = MoleculeFactory(
    AtomsFactory('C(C)(C)(C)Cl', logger), 
    false,
    false,
    logger
)
const two_Chloro_2_methylpropane_container = ContainerFactory(null, [], null, logger)
two_Chloro_2_methylpropane_container.addSubstrate(two_Chloro_2_methylpropane, 1, logger)
two_Chloro_2_methylpropane_container.addReagent('B:', 1, logger)
E1(two_Chloro_2_methylpropane_container, logger)
if( two_Chloro_2_methylpropane_container.getSubstrate()[0].canonicalSmiles(false, container.getSubstrate()[0].atoms,logger) !== 'C(=C)(C)C'){
    throw new Error('Container substrate should be C(=C)(C)C but got ' +  two_Chloro_2_methylpropane_container.getSubstrate()[0].canonicalSmiles(false, container.getSubstrate()[0].atoms,logger) + ' instead.')
}
two_Chloro_2_methylpropane_container.reagents = []
const two_Chloro_2_methylpropane_container_reverse = E1Reverse(two_Chloro_2_methylpropane_container, logger)
if( two_Chloro_2_methylpropane_container_reverse.substrate.canonicalSmiles !== 'C(C)(C)(C)Cl'){
    throw new Error('Container substrate should be C(C)(C)(C)Cl but got ' +  two_Chloro_2_methylpropane_container_reverse.substrate.canonicalSmiles + ' instead.')
}
console.log('ok')

// Hyrohalic acid addition
const hydrochloric_acid = MoleculeFactory(
    AtomsFactory('Cl', logger), 
    false,
    false,
    logger
)
const isobutene_container_1 = ContainerFactory(null, [], null, logger)
isobutene_container_1.addSubstrate(isobutene_1, 1, logger)
isobutene_container_1.addReagent(hydrochloric_acid, 1, logger)
HydrohalicAcidAdditionOnDoubleBond(isobutene_container_1, logger)
if(isobutene_container_1.substrate.canonicalSmiles !== 'C(C)(C)(C)Cl'){
    throw new Error('Container substrate should be C(C)(C)(C)Cl but got ' +  isobutene_container_1.substrate.canonicalSmiles + ' instead.')
}
const isobutene_container_1_reverse = HydrohalicAcidAdditionOnDoubleBondReverse(isobutene_container_1, logger)
if(isobutene_container_1_reverse.substrate.canonicalSmiles !== 'C(=C)(C)C'){
    throw new Error('Container substrate should be C(=C)(C)C but got ' +  isobutene_container_1_reverse.substrate.canonicalSmiles + ' instead.')
}
console.log('ok')
process.exit()




// Oxidisation
const propylene = MoleculeFactory(
    AtomsFactory('CC=C', logger),
    false,
    false,
    logger
) 
let propylene_container = ContainerFactory(null, [], null, logger)
propylene_container.addSubstrate(propylene, 1, logger)
propylene_container.addReagent('OA:', 1, logger)
// @todo AI (see below)
Oxidise(propylene_container, logger)
if ('CC(C)=O' !== propylene_container.getSubstrate()[0].canonicalSmiles(false, container.getSubstrate()[0].atoms,logger)) {
    throw new Error('Propylene after oxidisation should be CC(C)=O but got ' + propylene_container.getSubstrate()[0].canonicalSmiles(false, container.getSubstrate()[0].atoms,logger))
    process.exit()
}
propylene_container = OxidiseReverse(propylene_container, logger) // Result: "C=CC"
if ('C=CC' !== propylene_container.getSubstrate()[0].canonicalSmiles(false, container.getSubstrate()[0].atoms,logger)) {
    throw new Error('Propylene after reversing oxidisation should be C=CC but got ' + propylene_container.getSubstrate()[0].canonicalSmiles(false, container.getSubstrate()[0].atoms,logger))
    process.exit()
}
console.log('All ok (oxidisation')
process.exit()

const uri = "mongodb+srv://" + process.env.MONGODBUSER + ":" + process.env.MONGODBPASSWORD + "@cluster0.awqh6.mongodb.net/chemistry?retryWrites=true&w=majority";

const client = new MongoClient(uri, {useNewUrlParser: true, useUnifiedTopology: true});


const water = MoleculeFactory(
    AtomsFactory('O',logger),
    false,
    false,
    logger
)

// Find the oxygen atom
const oxygen_atom = _.find(water.atoms, (atom)=>{
    return atom.atomicSymbol === 'O'
})

const abc = MoleculeFactory(
    AtomsFactory('CC[C+]NC', logger),
    false,
    false,
    logger
) 

const atom_to_be_hydrated = LewisAcidAtom(abc, logger)
console.log('atom to be hydrated:')
console.log(atom_to_be_hydrated)
console.log('oxygen atom')
console.log(oxygen_atom)

const wabc = AddAtom(abc, oxygen_atom, logger) // return a molecule


const bwabc = atom_to_be_hydrated.bondAtomToAtom(oxygen_atom, true, wabc.atoms, logger)

console.log('Atoms:')
bwabc.atoms.map((a)=>{
    if (a.atomicSymbol !== 'H') {
        console.log(a)
    }
    return a
})

console.log('bwabc canonical smiles:' + bwabc.canonicalSmiles)
if (bwabc.canonicalSmiles !== 'CCC(NC)[O+]') {
    console.log(bwabc.canonicalSmiles)
    throw new Error('Molecule should be CCC(NC)[O+] but got ' + bwabc.canonicalSmiles)
    process.exit()
}

process.exit()

// Process through reactions
const FetchReactions = (reactions_db, logger) => {


    try {


        Typecheck(
            {name: "reactions_db", value: reactions_db, type: "object"},
            {name: "logger", value: logger, type: "object"}
        )

        // @todo
        const test_wittig = false
        
        const test_reductive_amination = true
        const test_pinacol = true
        const test_ritter = true
        

        const water = MoleculeFactory(
            AtomsFactory('O', logger),
            false,
            false,
            logger
        )

        if (test_pinacol) {

            logger.log('info', 'TESTING PINACOL')

            const container_history = []

            let pinacol_container = ContainerFactory(null, [], null, logger)
    
            // Pinacol
            const pinacol = MoleculeFactory(
                AtomsFactory('CC(O)(C)C(O)(C)C', logger),
                false,
                false,
                logger
            )
        
            // Add pinacol to container
            logger.log('info', ('container + ' + pinacol.canonicalSmiles).bgBlue)
            pinacol_container.addSubstrate(pinacol, 1, logger)
            pinacol_container = AI(pinacol_container, 0, container_history, [], false, logger)
            
            const acid = 'A:'
        
            // Add acid to container
            logger.log('info', ('container + ' + 'A:').bgBlue)
            pinacol_container.addReagent(acid, 1, logger)
            
            pinacol_container = AI(pinacol_container, 0, container_history, [], false, logger)
        
            console.log('Pinacol container after running reaction:')
            console.log(ContainerView(pinacol_container).SMILES(logger))
    
            if ('CC(C)(C(=O)C)C' !== pinacol_container.getSubstrate()[0].canonicalSmiles(false, container.getSubstrate()[0].atoms,logger)) {
                throw new Error('[Pinacol Rearrangement test] Expected CC(C)(C(=O)C)C but got ' + pinacol_container.getSubstrate()[0].canonicalSmiles(false, container.getSubstrate()[0].atoms,logger))
            }
    
    
        }

        if (test_reductive_amination) {

            console.log("\n\n")
            console.log('TESTING REDUCTIVE AMINATION')

            const container_history = []
    
            // Reductive amination
            let reductive_amination_container = ContainerFactory(null, [], null, logger)
    
            const formaldehyde = MoleculeFactory(
                AtomsFactory('C=O', logger),
                false,
                false,
                logger
            )    
    
            // Add formaldehyde to container
            logger.log('info', ('container + ' + formaldehyde.canonicalSmiles).bgBlue)
            reductive_amination_container.addSubstrate(formaldehyde, 1, logger)
            reductive_amination_container = AI(reductive_amination_container, 0, container_history, [], false, logger)
    
            const sulphuric_acid = MoleculeFactory(
                AtomsFactory('OS(=O)(=O)O', logger),
                false,
                false,
                logger
            )    
            
            // Add sulphuric acid to container
            logger.log('info', ('container + ' + sulphuric_acid.canonicalSmiles).bgBlue)
            reductive_amination_container.addReagent(sulphuric_acid, 1, logger)
            reductive_amination_container = AI(reductive_amination_container, 0, container_history, [], false, logger)
    
            if ('C=[O+]' !== reductive_amination_container.getSubstrate()[0].canonicalSmiles(false, container.getSubstrate()[0].atoms,logger)) {
                throw new Error('[Reductive amination test] Expected C=[O+] but got ' + reductive_amination_container.getSubstrate()[0].canonicalSmiles(false, container.getSubstrate()[0].atoms,logger))
            }

            const propylamine = MoleculeFactory(
                AtomsFactory('NCCC', logger),
                false,
                false,
                logger
            )    
            
            // Add propylamine to container
            logger.log('info', ('container + ' + propylamine.canonicalSmiles).bgBlue)
            reductive_amination_container.reagents = []
            reductive_amination_container.addReagent(propylamine, 1, logger)
            reductive_amination_container = AI(reductive_amination_container, 0, container_history, [], false, logger)

            if ('C(O)[N+]CCC' !== reductive_amination_container.getSubstrate()[0].canonicalSmiles(false, container.getSubstrate()[0].atoms,logger)) {
                throw new Error('[Reductive amination test] Expected C(O)[N+]CCC but got ' + reductive_amination_container.getSubstrate()[0].canonicalSmiles(false, container.getSubstrate()[0].atoms,logger))
            }

    
            const oxonium = MoleculeFactory(
                AtomsFactory('[O+]', logger),
                false,
                false,
                logger
            ) 
            
            // Add oxonium to container
            logger.log('info', ('container + ' + oxonium.canonicalSmiles).bgBlue)
            reductive_amination_container.addReagent(oxonium, 1, logger)
            reductive_amination_container = AI(reductive_amination_container, 0, container_history, [], false,  logger)


            if ('C=[N+]CCC' !== reductive_amination_container.getSubstrate()[0].canonicalSmiles(false, container.getSubstrate()[0].atoms,logger)) {
                throw new Error('[Reductive amination test] Expected C=[N+]CCC but got ' + reductive_amination_container.getSubstrate()[0].canonicalSmiles(false, container.getSubstrate()[0].atoms,logger))
            }

    
          //  console.log("\n\n")
            // Distill
            logger.log('info', ('Distilling').bgBlue)
            Distill(reductive_amination_container, logger)
            logger.log('info', ('container + water').bgBlue)
            reductive_amination_container.addReagent(water, 1, logger)
            reductive_amination_container = AI(reductive_amination_container, 0, container_history, [], false, logger)
           
            if ('C=NCCC' !== reductive_amination_container.getSubstrate()[0].canonicalSmiles(false, container.getSubstrate()[0].atoms,logger)) {
                throw new Error('[Reductive amination test] Expected C=NCCC but got ' + reductive_amination_container.getSubstrate()[0].canonicalSmiles(false, container.getSubstrate()[0].atoms,logger))
            }

         //   throw new Error('Got here')
    
    
          //  console.log("\n\n")
            // Add reducing agent
            logger.log('info', ('Distilling').bgBlue)
            Distill(reductive_amination_container, logger)
            console.log('Adding reducing agent to container'.bgBlue)
            reductive_amination_container.addReagent('RA:', 1, logger)
            //reductive_amination_container = AI(reductive_amination_container, 0, container_history, [], true, logger)
            Reduce(reductive_amination_container, logger)
    
            console.log('Reductive amination container after running reaction:')
            console.log(ContainerView(reductive_amination_container).SMILES(logger))
            
    
            if ('CNCCC' !== reductive_amination_container.getSubstrate()[0].canonicalSmiles(false, container.getSubstrate()[0].atoms,logger)) {
                throw new Error('[Reductive amination test] Expected CNCCC but got ' + reductive_amination_container.getSubstrate()[0].canonicalSmiles(false, container.getSubstrate()[0].atoms,logger))
            }
    
    
        }

        if (test_wittig) {
            console.log("\n\n")

            // Wittig
            console.log('Testing wittig')
            let wittig_container = ContainerFactory(null, [], null, logger)
    
            const acetaldehyde = MoleculeFactory(
                AtomsFactory('C(=O)C', logger),
                false,
                false,
                logger
            )    
            logger.log('info', 'container + acetaldehyde'.bgBlue)
            wittig_container.addSubstrate(acetaldehyde, 1, logger)
            wittig_container = AI(wittig_container, 0, [], false, logger)
    
    
            const phoshorane = MoleculeFactory(
                AtomsFactory('[C-](CCC)[P+](C1=CC=CC=C1)(C2=CC=CC=C2)C3=CC=CC=C3', logger),
                false,
                false,
                logger
            )    
            
            // Add phosphorane
            logger.log('info', ('container + phosphorane').bgBlue)
             wittig_container.addReagent(phoshorane, 1, logger)
             wittig_container=  AI(wittig_container, 0, [], logger)
    
           if ('C(C)=CCCC' !== wittig_container.getSubstrate()[0].canonicalSmiles(false, container.getSubstrate()[0].atoms,logger)) {
            throw new Error('[Wittig test] Expected C(C)=CCCC but got ' + wittig_container.getSubstrate()[0].canonicalSmiles(false, container.getSubstrate()[0].atoms,logger))
        }
    
    
        }

        if (test_ritter) {

            const container_history = []

            // Ritter reaction
            console.log("\n\n")
            console.log('Testing ritter')
            let ritter_container = ContainerFactory(null, [], null, logger)

            const two_methylpropane = MoleculeFactory(
                AtomsFactory('C[C+](C)C', logger),
                false,
                false,
                logger
            )
            ritter_container.addSubstrate(two_methylpropane, 1, logger)
            logger.log('info', ('container + 2-methylpropane C[C+](C)C')).bgBlue
            ritter_container = AI(ritter_container, 0, container_history, [], false, logger)

            const acetonitrile = MoleculeFactory(
                AtomsFactory('CC#N', logger),
                false,
                false,
                logger
            )

            logger.log('info', ('container + acetonitrile CC#N').bgBlue)
            ritter_container.addReagent(acetonitrile, 1, logger)
            ritter_container = AI(ritter_container, 0, container_history, [], false, logger)


            logger.log('info', ('container + water').bgBlue)
            ritter_container.addReagent(water, 1, logger)
            ritter_container = AI(ritter_container, 0, container_history, [], false, logger)

            if ('CC(C)(C)N=C(C)O' !== ritter_container.getSubstrate()[0].canonicalSmiles(false, container.getSubstrate()[0].atoms,logger)) {
                throw new Error('[Ritter test] Expected CC(C)(C)N=C(C)O but got ' + ritter_container.getSubstrate()[0].canonicalSmiles(false, container.getSubstrate()[0].atoms,logger))
            }

            /*
            logger.log('info', ('container + acid').bgBlue)
            ritter_container.addReagent('A:', 1, logger)
            ritter_container = AI(ritter_container, 0, container_history, [], false, logger)

            if ('CC(C)(C)NC(C)=O' !== ritter_container.getSubstrate()[0].canonicalSmiles(false, container.getSubstrate()[0].atoms,logger)) {
                throw new Error('[Ritter test] Expected CC(C)(C)NC(C)=O but got ' + ritter_container.getSubstrate()[0].canonicalSmiles(false, container.getSubstrate()[0].atoms,logger))
            }


            if ('CC(C)(C)NC(C)=O' !== ritter_container.getSubstrate()[0].canonicalSmiles(false, container.getSubstrate()[0].atoms,logger)) {
                throw new Error('[Ritter test] Expected CC(C)(C)NC(C)=O but got ' + ritter_container.getSubstrate()[0].canonicalSmiles(false, container.getSubstrate()[0].atoms,logger))
            }
            */

            console.log('Ritter container after running reaction:')
            console.log(ContainerView(ritter_container).SMILES(logger))


        }



    } catch(e) {
        logger.log('error', ('tests/AI ' + e).red)
        console.log(e.stack)
        process.exit()
    }


}


client.connect(err => {

    try {
        Typecheck(
            {name: "logger", value: logger, type: "object"}
        )
    } catch(e) {
        console.log(e.stack)
        process.exit()
    }

    try {
        assert.equal(err, null) // Check database connection was successful
        console.log("Database connection successful")
        const db = client.db("chemistry")
        console.log("Fetching reactions")
        FetchReactions(db, logger)
    } catch (e) {
        console.log('Could not connect to database. Using cache instead')
        const db = new CacheClient().db('chemistry')
        console.log("Fetching reactions cached")
        FetchReactions(db, logger)
        // reactions_db.collection('known_reactions').find().forEach((reaction)
        /*
        new CacheClient().db('chemistry').collection('known_reactions').find().forEach((reaction)=>{
            console.log('Reaction:')
            console.log(reaction)
        })
         */
    }

})
