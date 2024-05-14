const uniqid = require('uniqid');
const Constants = require('../Constants')

const winston = require('winston');

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
        new winston.transports.File({ filename: 'debug.log', level: '' }),
        new winston.transports.File({ filename: 'products.log', level:'verbose' }),
    ],
});

/*
If reaction_step property has has just two elements then root path - ie the chemical is the final product.
Extract reaction_steps where the last element of the reaction_step property is unique.


 */
const reaction_steps = [
    {
        pathway: '42g5a.42ija',
        mechanism: 'reduction',
        precursor_substrate_SMILES: 'C=[N+]C(C)C',
        chemical_substrate_SMILES: 'CNC(C)C',
        parent_substrate: 'parent_chemical',
        child_substrate: 'child_chemical'
    },
    {
        pathway: '42g5a.42ija.42jtk',
        mechanism: '1,2 elimination',
        precursor_substrate_SMILES: 'CC(C)NC[O+]',
        chemical_substrate_SMILES: 'C=[N+]C(C)C',
        parent_substrate: 'parent_chemical',
        child_substrate: 'child_chemical'
    },
    {
        pathway: '42g5a.42ija.42jtk.42lvf',
        mechanism: 'proton transfer',
        precursor_substrate_SMILES: 'CC(C)[N+]CO',
        chemical_substrate_SMILES: 'CC(C)NC[O+]',
        parent_substrate: 'parent_chemical',
        child_substrate: 'child_chemical'
    },
    {
        pathway: '42g5a.42ps1',
        mechanism: 'reduction',
        precursor_substrate_SMILES: 'C[N+]=C(C)C',
        chemical_substrate_SMILES: 'CNC(C)C',
        parent_substrate: 'parent_chemical',
        child_substrate: 'child_chemical'
    },
    {
        pathway: '42g5a.42ps1.42qex',
        mechanism: '1,2 elimination',
        precursor_substrate_SMILES: 'CNC([O+])(C)C',
        chemical_substrate_SMILES: 'C[N+]=C(C)C',
        parent_substrate: 'parent_chemical',
        child_substrate: 'child_chemical'
    },
    {
        pathway: '42g5a.42ps1.42qex.42sfj',
        mechanism: 'proton transfer',
        precursor_substrate_SMILES: 'C[N+]C(O)(C)C',
        chemical_substrate_SMILES: 'CNC([O+])(C)C',
        parent_substrate: 'parent_chemical',
        child_substrate: 'child_chemical'
    }
]


/*
SET pathways to array
Extract reaction_steps where the last element of the reaction_step property is unique.
 pathway: '42g5a.42ps1.42qex.42sfj',
 FOR EACH of reaction step
      SET pathway to array
      GET reaction step elements by splitting reaction step property by '.' and reverse
      FOR EACH reaction step element
          FIND reaction step where the reaction step property last element matches the current reaction step element
          ADD reaction step to pathway
      END FOR
      ADD pathway to pathways
 END FOR



42sfj (last element)
        mechanism: 'proton transfer',
        precursor_substrate_SMILES: 'C[N+]C(O)(C)C',
        chemical_substrate_SMILES: 'CNC([O+])(C)C',
42qex
        mechanism: '1,2 elimination',
        precursor_substrate_SMILES: 'CNC([O+])(C)C',
        chemical_substrate_SMILES: 'C[N+]=C(C)C',
42ps1
        mechanism: 'reduction',
        precursor_substrate_SMILES: 'C[N+]=C(C)C',
        chemical_substrate_SMILES: 'CNC(C)C',

42g5a.42ija.42jtk.42lvf
42lvf
        mechanism: 'proton transfer',
        precursor_substrate_SMILES: 'CC(C)[N+]CO',
        chemical_substrate_SMILES: 'CC(C)NC[O+]',
42jtk
        mechanism: '1,2 elimination',
        precursor_substrate_SMILES: 'CC(C)NC[O+]',
        chemical_substrate_SMILES: 'C=[N+]C(C)C',
42ija
        mechanism: 'reduction',
        precursor_substrate_SMILES: 'C=[N+]C(C)C',
        chemical_substrate_SMILES: 'CNC(C)C',

 */


const Pathways = require('../view/Pathways')(reaction_steps, logger)

Pathways.console()
