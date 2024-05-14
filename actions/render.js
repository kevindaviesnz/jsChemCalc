/*

Render a message on screen, to file, etc.

Params in: message

 */

const Typecheck = require('../Typecheck')

const render = (message) =>{
    Typecheck(
        {name:"message", value:message, type:"string"}
    )
    console.log(message)
}

module.exports = render
