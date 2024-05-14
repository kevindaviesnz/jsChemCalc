

const winston = require('winston');
const MoleculeFactory = require('../factories/MoleculeFactory');
const ContainerFactory = require('../factories/ContainerFactory')
const AtomsFactory = require('../factories/AtomsFactory')
const Stabilise = require('../actions/Stabilise')
const Prototypes = require("../Prototypes");
const FormatAs = require('../factories/FormatAs');
const { H } = require('../factories/PeriodicTable');
const ChemReact = require('../actions/ChemReact')
const Protonate = require('../mechanisms/Protonate')
const BronstedLoweryAcidBase = require('../reactions/BronstedLoweryAcidBase')
const fetchAllPossibleReactions = require('../reflection/fetchAllPossibleReactions')
const determineMostLikelyNextReaction = require('../reflection/determineMostLikelyNextReaction')
const AIBronstedLoweryAcidBase = require('../AI/BronstedLoweryAcidBase')
const EquilibriumConstant = require('../reflection/EquilibriumConstant')
const ProductsOrReactantsFavoured = require('../reflection/ProductsOrReactantsFavoured')
const EquilibriumConcentrations = require('../reflection/EquilibriumConcentrations')

const _ = require('lodash');

// Container manager and Molecule manager should container no properties so that they are immutable.
const MoleculeManager = require('../managers/MoleculeManager')
const ContainerManager = require('../managers/ContainerManager')

Prototypes()


const colors = require('colors');
const RemoveLeavingGroup = require('../actions/RemoveLeavingGroup');

colors.enable()

// Set custom log levels
const logLevels = {
    fatal: 0,
    error: 1,
    warn: 2,
    reaction: 3,
    info: 4,
    debug: 5,
    trace: 6,
    console: 7
  };
  
const errorFilter = winston.format((info, opts) => {
  return info.level === 'error' ? info : false;
});
const warningsFilter = winston.format((info, opts) => {
  return info.level === 'warn' ? info : false;
});
const reactionFilter = winston.format((info, opts) => {
  return info.level === 'reaction' ? info : false;
});
const traceFilter = winston.format((info, opts) => {
  return info.level === 'trace' ? info : false;
});
const infoFilter = winston.format((info, opts) => {
  return info.level === 'info' ? info : false;
});

const { combine, timestamp, printf, colorize, align, json, label } = winston.format;

const textFormat = printf(({ level, message, label, timestamp }) => {
  return `${message}`;
});


// main logger
const logger = winston.createLogger({
    levels: logLevels,
    transports: [
    ]
});
logger.configure({
    level: 'info',
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({
              filename: 'error.log',
              level: 'error',
              format: combine(errorFilter(), timestamp(), json()),
         }),
         new winston.transports.File({
            filename: 'reaction.log',
            level: 'reaction',
            format: combine(reactionFilter(), timestamp(), json()),
        }),
        new winston.transports.File({
              filename: 'warnings.log',
              level: 'warn',
              format: combine(warningsFilter(), timestamp(), json()),
         }),
        new winston.transports.File({
              filename: 'trace.log',
              level: 'trace',
                format: combine(
                    traceFilter(),
                    textFormat
                 ),
         }),
        new winston.transports.File({
              filename: 'info.log',
              level: 'info',
                format: combine(
                    traceFilter(),
                    textFormat
                 ),
         }),

    ]
});




// Initialise console logging
winston.loggers.add('consoleLogger', {
  levels: logLevels,
  level: 'console',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
  ],
});
const consoleLogger = winston.loggers.get('consoleLogger');

// test main logger
logger.error('error testing')
logger.reaction('reaction testing')
logger.warn('warnings testing')
logger.trace('trace testing')
logger.info('info testing')

// test
consoleLogger.console('testing console.logger')

// @see https://en.wikipedia.org/wiki/Pinacol_rearrangement
let container = ContainerFactory()

const pinacol = MoleculeFactory(
    AtomsFactory('CC(C)(C(C)(C)O)O')
)
const sulphuric_acid = MoleculeFactory(AtomsFactory('OS(=O)(=O)O'))


container.addReactant(pinacol, 1)
container.addReactant(sulphuric_acid, 1)

ChemReact(container)
process.exit()
container = ContainerFactory()



const container_with_pinacol_added = ContainerManager().addReactant(container, pinacol, 1)
const container_with_pinacol_and_acid_added = ContainerManager().addReactant(container_with_pinacol_added, 'A:', 1)

ChemReact(container_with_pinacol_and_acid_added)

const container_with_pinacol_ion_and_base_added = ContainerManager().addReactant(container_with_pinacol_and_acid_added, 'B:', 1)
ChemReact(container_with_pinacol_ion_and_base_added)
//if (container_with_pinacol_ion_and_base_added.reactants)


// "CC(C(C)=[O+])(C)C"
const ketone_ion = MoleculeFactory(
    AtomsFactory('CC(C(C)=[O+])(C)C')
)
container_with_pinacol_and_acid_added.reactants = []
const test_container = ContainerManager().addReactant(container_with_pinacol_and_acid_added, ketone_ion, 1)
const test_container_base_added = ContainerManager().addReactant(container_with_pinacol_and_acid_added, 'B:', 1)
//ChemReact(test_container_base_added)
console.log('tests done')
process.exit()


constainer = ContainerFactory([], [], null, logger)

const atoms = AtomsFactory('[C+]N', logger)
const m_carbocation_with_nitrogen = MoleculeFactory(
  atoms,
  false,
  false,
  logger
)

const containerManager = new ContainerManager()
const moleculeManager = new MoleculeManager()

//const target_atom = m_carbocation_with_nitrogen.atoms.filter(a=>a.atomicSymbol !== 'H')[0]
const m_carbocation_with_nitrogen_with_double_bond =moleculeManager.addDativeBondBetweenBondedAtoms(null, _.cloneDeep(m_carbocation_with_nitrogen), logger)



// Stabilise
const molecule_with_carbocation = MoleculeFactory(
  AtomsFactory('[C+]N', logger),
  false,
  false,
  logger
)
const molecule_with_carbocation_stabilised = Stabilise(molecule_with_carbocation, 0, logger)
if ('C=[N+]' !== molecule_with_carbocation_stabilised.canonicalSmiles) {
    throw new Error('Expected C=[N+] but got ' + molecule_with_carbocation_stabilised.canonicalSmiles)
}

// Remove leaving group

const molecule_with_water_leaving_group = MoleculeFactory(
  AtomsFactory('CC([O+])C', logger),
  false,
  false,
  logger
)

const rrl = RemoveLeavingGroup(molecule_with_water_leaving_group, logger)


if ('C[C+]C' !== rrl[0].canonicalSmiles) {
    throw new Error(`Expected CCC but got ${rrl[0].canonicalSmiles}`)
}
// ChemReact


const acetic_acid = MoleculeFactory(
    AtomsFactory('CC(=O)O', logger),
    false,
    false,
    logger
)

const deprotonated_acetic_acid = MoleculeFactory(
    AtomsFactory('CC(=O)[O-]', logger),
    false,
    false,
    logger
)

const ammonia = MoleculeFactory(
    AtomsFactory('N', logger),
    false,
    false,
    logger
)

const protonated_ammonia = MoleculeFactory(
    AtomsFactory('[N+]', logger),
    false,
    false,
    logger
)

const protonated_nitrogen = MoleculeFactory(
    AtomsFactory('CCCC(=[N+])C', logger),
    false,
    false,
    logger
)

const deprotonated_sulphuric_acid = MoleculeFactory(
    AtomsFactory('[O-]S(=O)(=O)O', logger),
    false,
    false,
    logger
)

const ketone = MoleculeFactory(
  AtomsFactory('CCC(=O)C', logger),
  false,
  false,
  logger
)


  
const methylamine = MoleculeFactory(
   AtomsFactory('CN', logger),
   false,
   false,
   logger
)

const water = MoleculeFactory(
   AtomsFactory('O', logger),
   false,
   false,
   logger
)


const acetic_acid2 = MoleculeFactory(
    AtomsFactory('CC(=O)O', logger),
    false,
    false,
    logger
)
acetic_acid2.pKa = 4.76
const c_ammonia = MoleculeFactory(
    AtomsFactory('[N+]', logger),
    false,
    false,
    logger
)

c_ammonia.pKa = 9.24
let equilibrium_constant = EquilibriumConstant(acetic_acid, c_ammonia, 1, 1,  logger)
if (30199.51720402019 !== equilibrium_constant) {
    throw new Error('Expected 30199.51720402019 but got ' + equilibrium_constant)
}
//expect(equilibrium_constant).toBe(30199.51720402019)



container = ContainerFactory([], [], null, logger)
container.addReactant(sulphuric_acid, 1)
container.addReactant(ketone, 1)

let all_possible_reactions = fetchAllPossibleReactions(container, logger)
if ('CCC(=O)C' !== all_possible_reactions[0].reactant[0].canonicalSmiles) {
    throw new Error('Expected CCC(=O)C but got ' + all_possible_reactions[0].reactant[0].canonicalSmiles)
}
if ("O[S](=O)(=O)O" !== all_possible_reactions[0].substrate[0].canonicalSmiles) {
    throw new Error('Expected "O[S](=O)(=O)O" but got ' + all_possible_reactions[0].substrate[0].canonicalSmiles)
}

const most_likely_reaction = determineMostLikelyNextReaction(all_possible_reactions, logger)
if ('CCC(=O)C' !== most_likely_reaction.reactant[0].canonicalSmiles) {
    throw new Error('Expected CCC(=O)C but got ' + all_possible_reactions[0].reactant[0].canonicalSmiles)
}
if ("O[S](=O)(=O)O" !== most_likely_reaction.substrate[0].canonicalSmiles) {
    throw new Error('Expected "O[S](=O)(=O)O" but got ' + most_likely_reaction.substrate[0].canonicalSmiles)
}

ChemReact(container)

if ('CCC(=[O+])C' !== container.reactants[0][0].canonicalSmiles) {
    throw new Error('Expected CCC(=[O+])C but got ' + container.reactants[0][0].canonicalSmiles)
}
if ('[O-][S](=O)(=O)O' !== container.reactants[1][0].canonicalSmiles) {
    throw new Error('Expected [O-][S](=O)(=O)O but got ' + container.reactants[1][0].canonicalSmiles)
}

container.addReactant(methylamine, 1)

const all_possible_reactions_after_adding_lewis_base = fetchAllPossibleReactions(container)

if ('CCC(=O)C' !== all_possible_reactions[0].reactant[0].canonicalSmiles) {
    throw new Error('Expected CCC(=O)C but got ' + all_possible_reactions[0].reactant[0].canonicalSmiles)
}

if ("O[S](=O)(=O)O" !== all_possible_reactions[0].substrate[0].canonicalSmiles) {
    throw new Error('Expected "O[S](=O)(=O)O" but got ' + all_possible_reactions[0].reactant[0].canonicalSmiles)
}


container = ContainerFactory([], [], null, logger)
// Protonation of a ketone
container.addReactant(ketone, 1, logger)
container.addReactant(sulphuric_acid, 1, logger)

const protonation_of_a_ketone_possible_reactions = fetchAllPossibleReactions(container, logger)
const protonation_of_a_ketone_reaction = determineMostLikelyNextReaction(protonation_of_a_ketone_possible_reactions, logger)
if ("CCC(=O)C" !== protonation_of_a_ketone_reaction.reactant[0].canonicalSmiles) {
    throw new Error(`Expecting "CCC(=O)C" but got ${protonation_of_a_ketone_reaction.reactant[0].canonicalSmiles}`)
}
if ("O[S](=O)(=O)O" !== protonation_of_a_ketone_reaction.substrate[0].canonicalSmiles) {
    throw new Error(`Expecting "O[S](=O)(=O)O" but got ${protonation_of_a_ketone_reaction.substrate[0].canonicalSmiles}`)
}

ChemReact(container)

if ("CCC(=[O+])C" !== container.reactants[0][0].canonicalSmiles) {
    throw new Error(`Expecting "CCC(=[O+])C" but got ${container.reactants[0][0].canonicalSmiles}`)
}

if ("[O-][S](=O)(=O)O" !== container.reactants[1][0].canonicalSmiles) {
    throw new Error(`Expecting "[O-][S](=O)(=O)O" but got ${reaction.reactant[1][0]}`)
}

container.addReactant(methylamine, 1, logger)
ChemReact(container)

if ("CCC(O)(C)[N+]C" !== container.reactants[0][0].canonicalSmiles) {
    throw new Error(`Expecting "CCC(O)(C)[N+]C" but got ${container.reactants[0][0].canonicalSmiles}`)
}

if ("[O-][S](=O)(=O)O" !== container.reactants[1][0].canonicalSmiles) {
    throw new Error(`Expecting "[O-][S](=O)(=O)O" but got ${reaction.reactant[1][0]}`)
}

container.addReactant(water,1)
ChemReact(container)


if ("O" !== container.reactants[0][0].canonicalSmiles) {
    throw new Error(`Expecting O but got ${container.reactants[0][0].canonicalSmiles}`)
}


if ("O[S](=O)(=O)O" !== container.reactants[1][0].canonicalSmiles) {
    throw new Error(`Expecting "O[S](=O)(=O)O" but got ${container.reactants[1][0].canonicalSmiles}`)
}

if ("CCC(C)=NC" !== container.reactants[2][0].canonicalSmiles) {
    throw new Error(`Expecting CCC(C)=NC but got ${container.reactants[2][0].canonicalSmiles}`)
}

console.log('tests passed')
process.exit()



//const ok = AIBronstedLoweryAcidBase([deprotonated_sulphuric_acid,1], [protonated_nitrogen,1], logger)
container = ContainerFactory([], [], null, logger)
container.addReactant(acetic_acid, 1)
container.addReactant(ammonia, 1)

all_possible_reactions = fetchAllPossibleReactions(container, logger)

const reaction = determineMostLikelyNextReaction(all_possible_reactions, logger)
if ('N' !== reaction.reactant[0].canonicalSmiles) {
    throw new Error(`Expecting N but got ${reaction.reactant[0].canonicalSmiles}`)
}
if ('CC(=O)O' !== reaction.substrate[0].canonicalSmiles) {
    throw new Error(`Expecting CC(=O)O but got ${reaction.substrate[0].canonicalSmiles}`)
}

ChemReact(container, logger)

if ('[N+]' !== container.reactants[0][0].canonicalSmiles) {
    throw new Error(`Expecting [N+] but got ${container.reactants[0][0].canonicalSmiles}`)
}

if ('CC(=O)[O-]' !== container.reactants[1][0].canonicalSmiles) {
    throw new Error(`Expecting CC(=O)[O-] but got ${reaction.reactant[1][0]}`)
}

process.exit()


// Bronsted lowery
container = ContainerFactory([], [], null, logger)
chem_react = ChemReact(container, logger)


const protonated_nitrogen_with_double_bond = MoleculeFactory(
      AtomsFactory('CCCC(=[N+])C', logger),
      false,
      false,
      logger
 )

// @see Reductive amination (deprotonation of the nitrogen atom)
// CCCC(=[N+])C ---> H ---> [O-][S](=O)(=O)O = CCCC(=N)C + O[S](=O)(=O)O
// Acetic acid + ammonia (reversible reaction)
container.addReactant(_.cloneDeep(deprotonated_sulphuric_acid), 1)
container.addReactant(_.cloneDeep(protonated_nitrogen_with_double_bond), 1)
chem_react.react(logger) // [N+], CC(=O)[O-]

console.log('Tests passed')
process.exit()

container = ContainerFactory([], [], null, logger)


container.addReactant(acetic_acid, 1, logger)
container.addReactant(ammonia, 1, logger)

// Do bronsted lowery acid base reaction, passing the base molecule (ammonia) from the container and the acid molecule (acetic acid) from the container.
const ammonia_in_container = container.findMatchingReactant(ammonia, logger)
const acetic_acid_in_container = container.findMatchingReactant(acetic_acid, logger)

// Note: All the ammonia and acetic acid is consumed.
// Equilibrium constant = 30199.51720402019
BronstedLoweryAcidBase(container, ammonia_in_container, acetic_acid_in_container, logger)

if (1 !== container.reactants[0][1]) { // 0.9942456006266285
    //throw new Error('Concentration of conjugate base of acetic acid should be 1 but got ' + container.reactants[0][1])
}

if (1 !== container.reactants[1][1]) { // // 0.9942456006266285
//    throw new Error('Concentration of conjugate acid of ammonia should be 1 but got ' + container.reactants[1][1])
}

// Add two more units of ammonia
container.addReactant(ammonia, 2, logger)
BronstedLoweryAcidBase(container, ammonia_in_container, acetic_acid_in_container, logger)

if (1 !== container.reactants[0][1]) { // 0.9842594785446116
    // throw new Error('Concentration of conjugate base of acetic acid should be 1 but got ' + container.reactants[0][1])
}

if (1 !== container.reactants[1][1]) { // 2.9842594785446117
//    throw new Error('Concentration of conjugate acid of ammonia should be 1 but got ' + container.reactants[1][1])
}

if (2 !== container.reactants[2][1]) { // 0.00998612208201687
    // throw new Error('Concentration of ammonia should be 1 but got ' + container.reactants[2][1])
}


// Add 1 units of deprotonated acetic acid
container = ContainerFactory([], [], null, logger)
container.addReactant(deprotonated_acetic_acid, 1, logger)
container.addReactant(protonated_ammonia, 1, logger)
const deprotonated_acetic_acid_in_container = container.findMatchingReactant(deprotonated_acetic_acid, logger)
const protonated_ammonia_in_container = container.findMatchingReactant(protonated_ammonia, logger)
// equilibrium constant 0.000033113112148259076
BronstedLoweryAcidBase(container, deprotonated_acetic_acid_in_container, protonated_ammonia_in_container, logger)

if (1 !== container.reactants[0][1]) {
    throw new Error('Concentration of conjugate base of acetic acid should be 1 but got ' + container.reactants[0][1])
}
if (1 !== container.reactants[1][1]) {
    throw new Error('Concentration of conjugate acid of ammonia should be 1 but got ' + container.reactants[1][1])
}


// ChemReact
// {"level":"info","message":"[AI/Protonate] __pjv Confirmed that CCC(O)(C)NC (acid molecule) can be protonated by [O+] (base molecule)"}

container = ContainerFactory([], [], null, logger)
chem_react = ChemReact(container, logger)

// Acetic acid + ammonia (reversible reaction)
container.addReactant(_.cloneDeep(acetic_acid), 1)
container.addReactant(_.cloneDeep(ammonia), 1)
chem_react.react(logger) // [N+], CC(=O)[O-]

if ('[N+]' !== container.reactants[0].canonicalSmiles) {
    throw new Error('Expected [N+] but got ' + container.reactants[0].canonicalSmiles)
}

if ('CC(=O)[O-]' !== container.reactants[1].canonicalSmiles) {
    throw new Error('Expected CC(=O)[O-] but got ' + container.reactants[0].canonicalSmiles)
}




let hydronium = MoleculeFactory(
    AtomsFactory('[O+]', logger),
    false,
    false,
    logger
)

let nco = MoleculeFactory(
    AtomsFactory('CCC(O)(C)NC', logger),
    false,
    false,
    logger
)

// Here [O+] should react with CCC(O)(C)NC
container.addReactant(nco, 1)
container.addReactant(deprotonated_sulphuric_acid, 1)
container.addReactant(hydronium, 1)
const reactant = chem_react.react(logger)



nco = MoleculeFactory(
    AtomsFactory('CCC(O)(C)NC', logger),
    false,
    false,
    logger
)
hydronium = MoleculeFactory(
    AtomsFactory('[O+]', logger),
    false,
    false,
    logger
)
container.addReactant(nco,1)
container.addReactant(hydronium,1)
Protonate(container, [nco, 1], [hydronium,1], logger)



const protonated_ketone_atoms = AtomsFactory('CCC(=[O+])C', logger)
const protonated_ketone = MoleculeFactory(
  protonated_ketone_atoms,
  false,
  false,
  logger
)

let deprotonated_sulphuric_acid_atoms = AtomsFactory('[O-][S](=O)(=O)O', logger)
deprotonated_sulphuric_acid = MoleculeFactory(
  deprotonated_sulphuric_acid_atoms,
  false,
  false,
  logger
)



container = ContainerFactory([], [], null, logger)
chem_react = ChemReact(container, logger)
container.addReactant(deprotonated_sulphuric_acid, 1)
container.addReactant(protonated_ketone, 1)
container.addReactant(methylamine, 1)

const acid_substrate = chem_react.fetchRandomSubstrateByLewisAcidity([methylamine, 1], {}, logger)
if ('CCC(=[O+])C' !== acid_substrate[0].canonicalSmiles) {
    throw new Error('Expected CCC(=[O+])C but got ' + acid_substrate[0].canonicalSmiles)
}

chem_react.react()

const molecule_with_carbocation_atoms = AtomsFactory('C[C+]', logger)
if (molecule_with_carbocation_atoms[6].electronPairs.length !==3) {
    throw new Error('Carbocation should have three electron pairs')
}
// Check carbocation has no lone electrons
if (_.find(molecule_with_carbocation_atoms[6].electronPairs, (ep)=>{
    return ep.length === 1
})) {
    throw new Error(`Carbocation should not have a lone electron`)
}

 if (molecule_with_carbocation.canonicalSmiles !== 'CC[C+](N)C') {
     throw new Error(`Canonical smiles should be the CC[C+](N)C but got ${molecule_with_carbocation.canonicalSmiles} instead`)
 }
 

 const r = MoleculeFactory(
    AtomsFactory('O[S](=O)(=O)O', logger),
    false,
    false,
    logger
)
const x = [
    r,
    1
]
if (r.canonicalSmiles !== x[0].canonicalSmiles) {
    throw new Error('Canonical smiles should be the same.')
}

// Basic testing
const r2 = MoleculeFactory(
    AtomsFactory('O[S]([O+])(=O)O', logger),
    false,
    false,
    logger
)
Stabilise(r2, 0, logger)

const m_atoms = AtomsFactory('CN', logger)
const m = MoleculeFactory(
    m_atoms,
    false,
    false,
    logger
)

const electrophilic_carbon_molecule = MoleculeFactory(
    AtomsFactory('C=[O+]', logger),
    false,
    false,
    logger
)

if (false === electrophilic_carbon_molecule.hasElectrophilicCarbon) {
    throw new Error('Expected electrophilic carbon')
}

const oxygen_molecule = MoleculeFactory(
    AtomsFactory('O', logger),
    false,
    false,
    logger
)

const oxygen_atom = oxygen_molecule.atoms[2]

if (oxygen_molecule.atoms.length !==3) {
    throw new Error('Expected 3 atoms but got ' + oxygen_molecule.atoms.length)
}
if (oxygen_atom.hydrogens(oxygen_molecule.atoms).length !==2) {
    throw new Error('Expected 2 hydrogens but got ' + oxygen_atom.atoms[2].hydrogens(oxygen_molecule.atoms).length)
}
if (oxygen_atom.bonds(oxygen_molecule.atoms, true).length !== 2) {
    throw new Error('Expected 2 bonds but got ' + oxygen_atom.bonds(true).length)
}

const nitrogen_molecule = MoleculeFactory(
    AtomsFactory('N', logger),
    false,
    false,
    logger
)

const nitrogen_atom = nitrogen_molecule.atoms[3]

if (nitrogen_molecule.atoms.length !==4) {
    throw new Error('Expected 4 atoms but got ' + nitrogen_molecule.atoms.length)
}
if (nitrogen_atom.hydrogens(nitrogen_molecule.atoms).length !==3) {
    throw new Error('Expected 3 hydrogens but got ' + nitrogen_atom.hydrogens(nitrogen_molecule.atoms).length)
}
if (nitrogen_atom.bonds(nitrogen_molecule.atoms, true).length !== 3) {
    throw new Error('Expected 3 bonds but got ' + nitrogen_atom.bonds(true).length)
}

const carbon_molecule = MoleculeFactory(
    AtomsFactory('C', logger),
    false,
    false,
    logger
)

const carbon_atom = carbon_molecule.atoms[4]

if (carbon_molecule.atoms.length !==5) {
    throw new Error('Expected 5 atoms but got ' + carbon_molecule.atoms.length)
}
if (carbon_atom.hydrogens(carbon_molecule.atoms).length !==4) {
    throw new Error('Expected 4 hydrogens but got ' + carbon_atom.hydrogens(carbon_molecule.atoms).length)
}
if (carbon_atom.bonds(carbon_molecule.atoms, true).length !== 4) {
    throw new Error('Expected 4 bonds but got ' + carbon_atom.bonds(true).length)
}

const oxygen_nitrogen_molecule = MoleculeFactory(
    AtomsFactory('ON', logger),
    false,
    false,
    logger
)
if (5 !== oxygen_nitrogen_molecule.atoms.length) {
    throw new Error('Oxygen-nitrogen molecule should have 5 atoms.')
}
const oxygen_nitrogen_molecule_oxygen_atom = oxygen_nitrogen_molecule.atoms[1]
const oxygen_nitrogen_molecule_nitrogen_atom = oxygen_nitrogen_molecule.atoms[4]
if (oxygen_nitrogen_molecule_oxygen_atom.hydrogens(oxygen_nitrogen_molecule.atoms).length !==1) {
    throw new Error('Expected 1 hydrogens but got ' + oxygen_nitrogen_molecule_oxygen_atom.hydrogens(oxygen_nitrogen_molecule.atoms).length)
}
if (oxygen_nitrogen_molecule_nitrogen_atom.hydrogens(oxygen_nitrogen_molecule.atoms).length !==2) {
    throw new Error('Expected 2 hydrogens but got ' + oxygen_nitrogen_molecule_nitrogen_atom.hydrogens(oxygen_nitrogen_molecule.atoms).length)
}
if(false === oxygen_nitrogen_molecule_oxygen_atom.isBondedTo(oxygen_nitrogen_molecule_nitrogen_atom, oxygen_nitrogen_molecule.atoms)) {
    throw new Error('Expected oxygen atom to be bonded to nitrogen atom.')
}
if(false === oxygen_nitrogen_molecule_oxygen_atom.isSingleBondedTo(oxygen_nitrogen_molecule_nitrogen_atom, oxygen_nitrogen_molecule.atoms)) {
    throw new Error('Expected oxygen atom to be bonded to nitrogen atom.')
}
oxygen_nitrogen_molecule_oxygen_atom.breakBond(oxygen_nitrogen_molecule_nitrogen_atom, [oxygen_nitrogen_molecule,1], logger)
if (oxygen_nitrogen_molecule_nitrogen_atom.isBondedTo(oxygen_nitrogen_molecule_oxygen_atom)) {
    throw new Error('Expected there NOT to be a bond between the nitrogen atom and the oxygen atom.')
}
if (oxygen_nitrogen_molecule_oxygen_atom.isBondedTo(oxygen_nitrogen_molecule_nitrogen_atom)) {
    throw new Error('Expected there NOT to be a bond between the nitrogen atom and the oxygen atom.')
}
oxygen_nitrogen_molecule_oxygen_atom.makeCovalentBond(oxygen_nitrogen_molecule_nitrogen_atom, false, oxygen_nitrogen_molecule.atoms, logger)
if (6 !== oxygen_nitrogen_molecule_oxygen_atom.electronPairs.length) {
    throw new Error('Expected 6 electron pairs but got ' + oxygen_nitrogen_molecule_oxygen_atom.electronPairs.length)
}
if (5 !== oxygen_nitrogen_molecule_nitrogen_atom.electronPairs.length) {
    throw new Error('Expected 6 electron pairs but got ' + oxygen_nitrogen_molecule_nitrogen_atom.electronPairs.length)
}
if(false === oxygen_nitrogen_molecule_oxygen_atom.isBondedTo(oxygen_nitrogen_molecule_nitrogen_atom, oxygen_nitrogen_molecule.atoms)) {
    throw new Error('Expected oxygen atom to be bonded to nitrogen atom.')
}
if(false === oxygen_nitrogen_molecule_oxygen_atom.isSingleBondedTo(oxygen_nitrogen_molecule_nitrogen_atom, oxygen_nitrogen_molecule.atoms)) {
    throw new Error('Expected oxygen atom to be bonded to nitrogen atom.')
}


const carbon_oxygen_molecule = MoleculeFactory(
    AtomsFactory('CO', logger),
    false,
    false,
    logger
)
if (6 !== carbon_oxygen_molecule.atoms.length) {
    throw new Error('Carbon-oxygen molecule should have 6 atoms.')
}
const carbon_oxygen_molecule_carbon_atom = carbon_oxygen_molecule.atoms[3]
const carbon_oxygen_molecule_oxygen_atom = carbon_oxygen_molecule.atoms[5]
if (carbon_oxygen_molecule_carbon_atom.hydrogens(carbon_oxygen_molecule.atoms).length !==3) {
    throw new Error('Expected 3 hydrogens but got ' + carbon_oxygen_molecule_carbon_atom.hydrogens(carbon_oxygen_molecule.atoms).length)
}
if (carbon_oxygen_molecule_oxygen_atom.hydrogens(carbon_oxygen_molecule.atoms).length !==1) {
    throw new Error('Expected 1 hydrogen but got ' + carbon_oxygen_molecule_oxygen_atom.hydrogens(carbon_oxygen_molecule.atoms).length)
}
if(false === carbon_oxygen_molecule_carbon_atom.isBondedTo(carbon_oxygen_molecule_oxygen_atom, carbon_oxygen_molecule.atoms)) {
    throw new Error('Expected carbon atom to be bonded to oxygen atom.')
}
if(false === carbon_oxygen_molecule_carbon_atom.isSingleBondedTo(carbon_oxygen_molecule_oxygen_atom, carbon_oxygen_molecule.atoms)) {
    throw new Error('Expected oxygen atom to be single bonded to carbon atom.')
}

// Test dative bonding
// Convert carbon atom into a carbocation.
let proton = carbon_atom.hydrogens(carbon_molecule.atoms)[0];
proton.breakBond(carbon_atom, [carbon_molecule, 1], logger);
_.remove(carbon_molecule.atoms, (a) => a.atomId === proton.atomId);
_.remove(carbon_atom.electronPairs, (electron_pair)=>{
    return electron_pair.length === 1
})
oxygen_atom.makeDativeBond(carbon_atom, false, oxygen_molecule.atoms, logger)
if (false === oxygen_atom.isBondedTo(carbon_atom)) {
    throw new Error('Expected there to be a bond between the oxygen atom and the carbon atom.')
}
if (4 !== carbon_atom.electronPairs.length) {
    throw new Error('Expected 4 electron pairs but got ' + carbon_atom.electronPairs.length)
}
if (5 !== oxygen_atom.electronPairs.length) {
    throw new Error('Expected 5 electron pairs but got ' + oxygen_atom.electronPairs.length)
}
carbon_atom.breakBond(oxygen_atom, [carbon_molecule,1], logger)
if (oxygen_atom.isBondedTo(carbon_atom)) {
    throw new Error('Expected there NOT to be a bond between the oxygen atom and the carbon atom.')
}
if (false === carbon_atom.isCarbocation(carbon_molecule.atoms, logger)) {
    throw new Error('Carbon atom should be a carbocation.')
}
if (3 !== carbon_atom.electronPairs.length) {
    throw new Error('Expected 3 electron pairs but got ' + carbon_atom.electronPairs.length)
}
if (6 !== oxygen_atom.electronPairs.length) {
    throw new Error('Expected 6 electron pairs but got ' + oxygen_atom.electronPairs.length)
}

console.log('Basic tests finished')
// process.exit()

// AI
// START HERE

container = ContainerFactory([], [], null, logger)
const test_acid_base = false
const test_lewis_acid_base = true
const test_other = false


const sa = MoleculeFactory(
    AtomsFactory('O[S](=O)(=O)O', logger),
    false,
    false,
    logger
)
container.addReactant(ketone,1)
container.addReactant(sa,1)
container.react()



container = ContainerFactory([], [], null, logger)




if(test_acid_base) {
    const acetic_acid =  MoleculeFactory(
        AtomsFactory('CC(=O)O', logger),
        false,
        false,
        logger
    )
    
    const ammonia =  MoleculeFactory(
        AtomsFactory('N', logger),
        false,
        false,
        logger
    )
    
    // Now add 100 units of ammonia to an empty container
    container.addReactant(
        ammonia,
        100,
        logger
    )
    
    // Add 10 units of acetic acid 
    container.addReactant(
        acetic_acid,
        10,
        logger
    )
    
    
    container.react(logger)


    /*Container.js:Reaction done, reactants in container 
    N{90},
    [N+]{10},
    CC(=O)[O-]{10}*/
 /*
    if (container.reactants.length !==3) {
        throw new Error('Expected three reactants in the container but got ' + container.reactants.length )
    }
    if (-1 === container.convertReactantsToSmiles(container.reactants).indexOf('N')) {
        throw new Error('Reactants should contain N')
    }
    if (-1 === container.convertReactantsToSmiles(container.reactants).indexOf('[N+]')) {        
        throw new Error('Reactants should contain [N+]')
    }
    if (-1 === container.convertReactantsToSmiles(container.reactants).indexOf('CC(=O)[O-]')) {                
        throw new Error('Reactants should contain CC(=O)[O-]')
    }
    
    container = ContainerFactory([], [], null, logger)
    
    const water =  MoleculeFactory(
        AtomsFactory('O', logger),
        false,
        false,
        logger
    )
    //water.pKa = 14
    
    const sulphuric_acid =  MoleculeFactory(
        AtomsFactory('OS(=O)(=O)O', logger),
        false,
        false,
        logger
    )
    //sulphuric_acid.pKa = 1.85
    // Expected [O-][S](=O)(=O)O but got O[S](=[O+])(=O)O)
    if (sulphuric_acid.canonicalSmiles !== 'O[S](=O)(=O)O') {
        throw new Error('Expected O[S](=O)(=O)O but got ' + sulphuric_acid.canonicalSmiles)
    }
    
    // Now add 4 units of water to an empty container
    container.addReactant(
        water,
        4,
        logger
    )
    
    // Add 1 units of sulphuric acid
    container.addReactant(
        sulphuric_acid,
        1,
        logger
    )
    
    container.react(logger)
    
    
    // @see https://en.wikipedia.org/wiki/Pinacol_rearrangement
    // Add pinacol to the container
    container = ContainerFactory([], [], null, logger)
    container.addReactant(
        MoleculeFactory(
            AtomsFactory('CC(C)(C(C)(C)O)O', logger),
            false,
            false,
            logger
        ), // pinacol
        8,
        logger
    )
    // Add an acid (protonate the substrate)
    container.addReactant('A:', 10, logger)
    container.react(logger)
    

    if (container.reactants.length !==4) {
        throw new Error('Expected four reactants in the container but got ' + container.reactants.length )
    }
    if (-1 === container.convertReactantsToSmiles(container.reactants).indexOf('CC(C)(C(C)(C)O)O')) {
        throw new Error('Reactants should contain CC(C)(C(C)(C)O)O')
    }
    if (-1 === container.convertReactantsToSmiles(container.reactants).indexOf('CC(C(C)=[O+])(C)C')) {        
        throw new Error('Reactants should contain CC(C(C)=[O+])(C)C')
    }
    if (-1 === container.convertReactantsToSmiles(container.reactants).indexOf('A:')) {                
        throw new Error('Reactants should contain A:')
    }
    if (-1 === container.convertReactantsToSmiles(container.reactants).indexOf('CB:')) {                
        throw new Error('Reactants should contain CB:')
    }
    */
    console.log('Tests passed')
  //  process.exit()
    
    
    
}

if (test_lewis_acid_base) {

    // Formation of imine from a ketone and an amine
    // @see https://cdn.masterorganicchemistry.com/wp-content/uploads/2019/10/3-formation-of-imine-from-ketone-with-amine-full-arrow-pushing-mechanism.gif
    // Ketone should be protonated by the sulphuric acid
    logger.info('Empty container initialised')
    container = ContainerFactory([], [], null, logger)

    // Add ketone to the container
    container = ContainerFactory([], [], null, logger)
    container.addReactant(
        MoleculeFactory(
            AtomsFactory('CCCC(=O)C', logger),
            false,
            false,
            logger
        ),  // ketone
        1,
        logger
    )
    logger.info('CCCC(=O)C added to container')
    console.log(('[tests/chemtest] CCCC(=O)C added to container').bgRed)

    // Add an acid to the container. This will protonate the carbonyl oxygen in CCCC(=O)
    container.addReactant(
        MoleculeFactory(
            AtomsFactory('OS(=O)(=O)O', logger),
            false,
            false,
            logger
        ), // sulphuric acid
        1,
        logger
    )
    logger.info('Sulphuric acid added to container')
    // Result: [O-][S](=O)(=O)O,  CCCC(=[O+])C, 
   // container.react()

 //   process.exit()
//

    logger.info('Empty container initialised')
    container = ContainerFactory([], [], null, logger)

    // Add ketone to the container
    container = ContainerFactory([], [], null, logger)
    container.addReactant(
        MoleculeFactory(
            AtomsFactory('CCCC(=[O+])C', logger),
            false,
            false,
            logger
        ),  // ketone
        1,
        logger
    )

    container.addReactant(
        MoleculeFactory(
            AtomsFactory('[O-][S](=O)(=O)O', logger),
            false,
            false,
            logger
        ),  // ketone
        1,
        logger
    )

    //logger.info('CCCC(=[O+])C added to container')
    container.addReactant(
        MoleculeFactory(
            // methylamine
            AtomsFactory('CN', logger),
            false,
            false,
            logger
        ),
        2,
        logger
    )
    logger.info('[tests/chemtest] CN added to container'.bgRed)
    logger.info('[tests/chemtest] Note: when CN reacts with the conjugate base of sulphuric acid it deprotonates the conjugate to form C[N+] and [O-]S(=O)(=O)[O-]'.bgRed)

    container.react()

    process.exit()

    container.addReactant(
        MoleculeFactory(
            // methylamine
            AtomsFactory('O', logger),
            false,
            false,
            logger
        ),
        2,
        logger
    )
    logger.info('Water added to container')
    container.react()


   if (false) {
    // Add ketone to the container
    container = ContainerFactory([], [], null, logger)
    container.addReactant(
        MoleculeFactory(
            AtomsFactory('CCCC(=O)C', logger),
            false,
            false,
            logger
        ),  // ketone
        2,
        logger
    )

    // Add an acid to the container. This will protonate the carbonyl oxygen in CCCC(=O)
    container.addReactant(
        MoleculeFactory(
            AtomsFactory('OS(=O)(=O)O', logger),
            false,
            false,
            logger
        ), // sulphuric acid
        2,
        logger
    )
/*

    React.js:Reaction done, reactants in container 
    CCCC(=O)C{6},
    O[S](=O)(=O)O{9},
    [O-][S](=O)(=O)O{1},
    CCCC(=[O+])C{1}
    */
    container.react(logger)
    if (-1 === container.convertReactantsToSmiles(container.reactants).indexOf('CCCC(=O)C')) {
        throw new Error('Reactants should contain CCCC(=O)C')
    }
    if (-1 === container.convertReactantsToSmiles(container.reactants).indexOf('CCCC(=[O+])C')) {
        throw new Error('Reactants should contain CCCC(=[O+])C')
    }
    /*
    React.js:Reaction done, reactants in container 
CCCC(=O)C{6},
O[S](=O)(=O)O{2},
CCCC(=[O+])C{1},
[O-][S](=O)(=O)[O-]{1},
[O-][S](=O)(=O)O{3},
OC(=[O+])(=O)O{1},
[O-]C(=[O+])(=O)O{1},
[O+][S](=O)(=O)O{1},
[C+](=[O+])(=[O+])[O-]{1}
*/
    if (container.reactants.length !==4) {
       console.log('Warning: Expected four reactants in the container but got ' + container.reactants.length )
    }

    /*
       container.addReactant(
           MoleculeFactory(
               AtomsFactory('CCCC(=[O+])C', logger),
               false,
               false,
               logger
           ),
           10,
           logger
       )
       */
       container.addReactant(
           MoleculeFactory(
               // methylamine
               AtomsFactory('CN', logger),
               false,
               false,
               logger
           ),
           2,
           logger
       )
    // The methylamine nitrogen atom should bond with the carbonyl carbon, breaking one of the C=[O+] bonds. 
    // Note: The sulphuric acid will protonate some of the methylamine molecules.
    container.react(logger)

    container.addReactant(
        MoleculeFactory(
            AtomsFactory('O', logger),
            false,
            false,
            logger
        ), 
        10, 
        logger
    )

    container.react(logger)
    /*
React.js:Reaction done, reactants in container 
CN{10},
O{6},
[O+]{3},
CCCC(C)=[N+]C{9},
CCCC(C)=NC{2},
[O-]{1}
React.js:566
    */


    // At this point the substrate will be a conjugate acid as it has been protonated by the reagent.

    // @see https://cdn.masterorganicchemistry.com/wp-content/uploads/2019/10/3-formation-of-imine-from-ketone-with-amine-full-arrow-pushing-mechanism.gif
    // Nitrogen should bond with the carbonyl carbon.
    // DO NOT remove the hydrogen sulphate ([O-][S](=O)(=O)O).
    // The hydrogen sulphate should not react with the ketone.
    // Add methylamine.
    // lewis acid base
    // temp for testing
}

    console.log("tests passed")
    //process.exit()

}

if (test_other) {
    if ('CCCC(O)(C)[N+]C' !== container.getSubstrate()[0].canonicalSmiles) {
        throw new Error('Expecting CCCC(O)(C)[N+]C but got ' + container.getSubstrate()[0].canonicalSmiles)
    }

    // At this point we have a new species so the substrate should neither be a conjugate base or a conjugate acid.
    if (container.getSubstrate()[0].isConjugateBase || container.getSubstrate()[0].isConjugateAcid) {
        throw new Error('After a Lewis Base reaction the substrate should not be a conjugate base or conjugate acid')
    }

    // temporary
    container.reagents = []

    // Proton transfer
    // Add water to the container.
    // DO NOT remove the hydrogen sulphate ([O-][S](=O)(=O)O).
    // The hydrogen sulphate should not react with the substrate.
    const w = MoleculeFactory(
        AtomsFactory('O', logger),
        false,
        false,
        logger
    )
    container.addReagent(
        w,
        7,
        logger
    )
    // The water molecule should act as a base and deprotonate the nitrogen atom.
    container.react(logger)
    if('CCCC(O)(C)NC' !== container.getSubstrate()[0].canonicalSmiles) {
        throw new Error('Expecting CCCC(O)(C)NC but got ' + container.getSubstrate()[0].canonicalSmiles + ' instead.')
    }
    if('[O+]' !== container.reagents[0][0].canonicalSmiles) {
        throw new Error('Expecting [O+] but got ' + container.reagents[0][0].canonicalSmiles + ' instead.')
    }

    // At this point the substrate is a conjugate base (a conjugate base can be deprotonated)

    // 1, 2 Elimination
    // DO NOT remove the hydrogen sulphate ([O-][S](=O)(=O)O).
    // The hydrogen sulphate should not react with the substrate.
    // [O+] should leave and nitrogen atom should form a double bond with the resulting carbocation.
    //container.react(logger)
    // @todo This should happen right after the nitrogen atom is deprotonated and the reagent atom (water) is protonated.
    // The reagent [O+] is deprotonated by the substrate oxygen atom giving the substrate oxygen atom a positive charge. (see Protonate.js)
    // This should create a O leaving group which should then be removed substrate.
    // Nitrogen atom that is bonded to the carbocation with a single bond should now form a double bond with the carbocation

    // Protonate the substrate oxygen. This will then create a [O+] leaving group which will be removed.
    container.react(logger)
    // CCCC(O)(C)NC => CCCC(C)=[N+]C NOT CCCC(O)(C)NC
    if('CCCC(C)=[N+]C' !== container.getSubstrate()[0].canonicalSmiles) { //  https://cdn.masterorganicchemistry.com/wp-content/uploads/2019/10/3-formation-of-imine-from-ketone-with-amine-full-arrow-pushing-mechanism.gif
        throw new Error('Expecting CCCC(C)=[N+]C but got ' + container.getSubstrate()[0].canonicalSmiles + ' instead.')
    }

    // @todo
    container.reagents = []
    // Add an acid to the container. This will deprotonate the positively charged nitrogen
    container.addReagent(
        MoleculeFactory(
            AtomsFactory('OS(=O)(=O)O', logger),
            false,
            false,
            logger
        ), // sulphuric acid
        7,
        logger
    )
    container.react(logger)
    if('CCCC(C)=NC' !== container.getSubstrate()[0].canonicalSmiles) {
        throw new Error('Expecting CCCC(C)=NC but got ' + container.getSubstrate()[0].canonicalSmiles + ' instead.')
    }

    console.log("tests passed.")
    //process.exit()


    /*
    Reaction done, reactants in container
    O{1} (pKa 15),
    [O+]{1} (pKa 1.74),
    O[S](=O)(=O)[O-]{1} (pKa 1.99)

    water should not react with conjugate base of sulphuric acid
    hydronium should not react with water.
    hydronium SHOULD  react with the conjugate base of sulphuric acid.

    Water can donate a proton to conjugate base of sulphuric acid.
    Hydronium can donate a proton to water.
    Conjugate base of sulphuric acid can donate a proton to water.
    */


    // Initialise a container with nothing in it
    const temp =  MoleculeFactory(
        AtomsFactory('C(O)C', logger),
        false,
        false,
        logger
    )
    if ('C(O)C' !== FormatAs(temp).SMILES(logger)) {
        throw new Error('Expecting C(O)C but got ' + FormatAs(temp).SMILES(logger))
    }

    const temp2 =  MoleculeFactory(
        AtomsFactory('[O+]', logger),
        false,
        false,
        logger
    )
    if ('[O+]' !== FormatAs(temp2).SMILES(logger)) {
        throw new Error('Expecting [O+] but got ' + FormatAs(temp).SMILES(logger))
    }


    container = ContainerFactory([], [], null, logger)

    // Elimination / Substitution
    // SN2
    container.addSolvent("polar aprotic")
    container.addSubstrate(
        MoleculeFactory(
            AtomsFactory('C(C)([Cl])(C)(C)', logger),
            false,
            false,
            logger
        ),
        10,
        logger
    )
    container.addReagent(
        MoleculeFactory(
            AtomsFactory('[O-]', logger),
            false,
            false,
            logger
        ),
        10,
        logger
    )
    // This should replace chlorine with oxygen,.
    container.react(logger)
    if ('C(C)(C)(C)O' !== container.getSubstrate()[0].canonicalSmiles) {
        throw new Error('Expecting C(C)(C)(C)O but got ' + container.getSubstrate()[0].canonicalSmiles)
    }


    container = ContainerFactory([], [], null, logger)

    // SN1
    container.addSolvent("protic")
    container.addSubstrate(
        MoleculeFactory(
            AtomsFactory('C(C)([Cl])(C)(C)', logger),
            false,
            false,
            logger
        ),
        10,
        logger
    )
    container.addReagent(
        MoleculeFactory(
            AtomsFactory('[O-]', logger),
            false,
            false,
            logger
        ),
        10,
        logger
    )
    container.react(logger)
    if ('C(C)(C)(C)O' !== container.getSubstrate()[0].canonicalSmiles) {
        throw new Error('Expecting C(C)(C)(C)O but got ' + container.getSubstrate()[0].canonicalSmiles)
    }

    // Elimination

    container = ContainerFactory([], [], null, logger)
    container.addSubstrate(
        MoleculeFactory(
            AtomsFactory('C(C)(C)(Cl)C(C)(C)', logger),
            false,
            false,
            logger
        ),
        10,
        logger
    )
    container.addReagent(
        MoleculeFactory(
            AtomsFactory('[O-]', logger),
            false,
            false,
            logger
        ),
        10,
        logger
    )
    // C(=C)(C)C(C)C
    container.react(logger)
    if ('C(=C)(C)C(C)C' !== container.getSubstrate()[0].canonicalSmiles) {
        throw new Error('Expecting C(=C)(C)C(C)C but got ' + container.getSubstrate()[0].canonicalSmiles)
    }





    // ****


    console.log('Mechanism/reaction tests finished')



    process.exit()

}
