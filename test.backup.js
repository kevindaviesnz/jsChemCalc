

const winston = require('winston');
const MoleculeFactory = require('../factories/MoleculeFactory');
const ContainerFactory = require('../factories/ContainerFactory')
const AtomsFactory = require('../factories/AtomsFactory')
const Stabilise = require('../actions/Stabilise')
const Prototypes = require("../Prototypes");
const FormatAs = require('../factories/FormatAs');
const { H } = require('../factories/PeriodicTable');
const Protonate = require('../mechanisms/Protonate')

Prototypes()

const _ = require('lodash');

const colors = require('colors');

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
const protonation_test_sa = MoleculeFactory(
    AtomsFactory('O[S](=O)(=O)O', logger),
    false,
    false,
    logger
)
const r2 = MoleculeFactory(
    AtomsFactory('CC(O)(N)CC', logger),
    false,
    false,
    logger
)
const c = ContainerFactory([], [], null, logger)
Protonate(c, [r2,1], [protonation_test_sa,1], logger)
//console.log('tests')
//process.exit()

// {"level":"info","message":"[AI/Protonate] Checking if CCC[C+](C)[N+]C can be deprotonated by O."}
const c2 = ContainerFactory([], [], null, logger)
const s_p = MoleculeFactory(
    AtomsFactory('CCC[C+](C)[N+]C', logger),
    false,
    false,
    logger
)
c2.addReactant(s_p,1)
const r3 = MoleculeFactory(
    AtomsFactory('O', logger),
    false,
    false,
    logger
)
c2.addReactant(r3,1)
c2.react()
process.exit()


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

let container = ContainerFactory([], [], null, logger)
const test_acid_base = false
const test_lewis_acid_base = true
const test_other = false

const ketone = MoleculeFactory(
    AtomsFactory('CCCC(=O)C', logger),
    false,
    false,
    logger
)

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
