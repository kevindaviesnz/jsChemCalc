const Set = require('../Set')
const Constants = require("../Constants")
const { loggers } = require('winston')
const { P } = require('../factories/PeriodicTable')
const _ = require('lodash');
const Typecheck = require('../Typecheck')

const pKa = (molecule) => {



        const carboxylicAcid = function() {
            let pKa = 5
            switch(molecule.canonicalSmiles) {
                case 'CC(=O)O':
                    pKa = 4.76  // // acetic acid
                break
                case 'C(=O)O':
                    pKa = 4.76  // // formic acid
            }
            return pKa
        }

        const amine = function() {
        /*
        The pKa of an amine can vary depending on the specific type of amine and its chemical environment. Amines are
        organic compounds containing a nitrogen atom with a lone pair of electrons, and their pKa values can range from
        around 0 to 11 or higher, depending on factors such as the nature of the substituents attached to the nitrogen atom
        and the solvent in which the measurement is made.
        Here are some general pKa ranges for different types of amines:
        Aliphatic Amines: Primary aliphatic amines (R-NH2) typically have pKa values around 9-11. Secondary aliphatic amines
         (R2-NH) have slightly lower pKa values, around 8-10. Tertiary aliphatic amines (R3-N) are less acidic, with
         pKa values around 4-5.
        Aromatic Amines: Aromatic amines, where the amino group is attached to an aromatic ring, often have pKa values closer to neutral pH, around 4-5.
        Ammonium Ions: Ammonium ions (NH4+) have a pKa value of approximately 9.25.
        Anilines: Anilines (aromatic amines) can have pKa values ranging from 4 to 5 or higher, depending on the substituents on the aromatic ring.
        */
            let pKa = null
            switch(molecule.canonicalSmiles) {
                case 'CN':
                case 'NC':
                    pKa = 10.6
                break
                case 'N':
                    pKa = 9.25 // ammonia
            }
            return pKa
        }
        
        const protonatedAmine = function () {
            return null
            let pKa = 10.7
            switch(molecule.canonicalSmiles) {
                case 'C[N+]':
                case '[N+]C':
                    pKa = 10.7 // protonated methylamine
                break
                case 'CC[N+]':
                    pKa = 11 // protonated ethlyamine
                case '[N+]':
                    pKa = -9.25
            }
            return pKa
        }

        const alcohol = function () {
            let pKa = null
            switch(molecule.canonicalSmiles) {
                case 'CO':
                    pKa = 15.5 // methyl alcohol
                break
                case 'CCOH':
                    pKa = 15.9 // ethyl alcohol
            }
            return pKa
        }

        const aldehyde = function() {
            return 20
        }

        const protonatedKetone = function() {
            // @see https://cactus.utahtech.edu/smblack/chem2310/summary_pages/pKa_chart.pdf
            return -7.3
        }

        const ketone = function() {
            return null
        }

        const ester = function() {
            return 25
        }

        const alkane = function() {
            return null
        }

        const protonatedAlcohol = function () {
            let pKa = -2.5
            switch(molecule.canonicalSmiles) {
                case 'C[O+]':
                    pKa = -2.5 // protonated methyl alcohol
                break
                case 'Ar[N+]':
                    pka = 5 // protonated aniline
                break
                case 'CC[O+]':
                    pKa = 15.9 // protonated ethyl alcohol
            }
            return pKa
        }

        const protonatedNitrile = function () {
            let pKa = -10
            switch(molecule.canonicalSmiles) {
                case 'C[O+]':
                    pKa = -2.5 // protonated methyl alcohol
                break
                case 'Ar[N+]':
                    pka = 5 // protonated aniline
                break
                case 'CC[O+]':
                    pKa = 15.9 // protonated ethyl alcohol
            }
            return pKa
        }

        const protonatedCarboxylicAcid = function() {
            return 0
        }

        const nitrile = function() {
            return 31
        }

        const proton = function() {
            return -1000
        }

        // https://byjus.com/chemistry/pka/
        const sulphuricAcid = function() {
            return -3
        }

        // https://byjus.com/chemistry/pka/
        const protonatedSulphuricAcid = function() {
            return 2
        }

        const smiles = {
                'CC(=O)O': 4.76, // acetic acid
                "CC(=O)[O-]": 4.76, // conjugate base of acetic acid 
                '[N+]': 9.24, // conjugate acid of ammonia,
                'N': 9.24 // ammonia
        }

        if (undefined !== smiles[molecule.canonicalSmiles]) {

            return smiles[molecule.canonicalSmiles]

        } else {

            return {
                'alkane': alkane(),
                'aldehyde': aldehyde(),
                'alcohol': alcohol(),
                'akylHalide': 0,
                'amine' : amine(),
                'ammonia': amine(),
                'nitrile' : nitrile(),
                'aldehyde' : 18,
                'carboxylicAcid' : carboxylicAcid(),
                'amide' : 0,
                'ketone': ketone(),
                'ester' : ester(),
                'ether' : 0,
                'protonatedAmine': protonatedAmine(),
                'protonatedNitrile': protonatedNitrile(),
                'protonatedAlcohol': protonatedAlcohol(),
                'protonatedCarboxylicAcid' : protonatedCarboxylicAcid(),
                'protonatedKetone' : protonatedKetone(),
                'water': 15,
                'protonatedWater': 0,
                'hydroxide': 15.7,
                'hydronium': -1.7,
                'proton':proton(),
                'sulphuricAcid': sulphuricAcid(),
                'protonatedSulphuricAcid': protonatedSulphuricAcid(),
             }
     
        }




    

}

module.exports = pKa











