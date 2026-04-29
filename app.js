/**
 * 
 */
const express = require( "express" );
const cors = require( "cors" );


const PORT = process.env.PORT || 443;


const app = express();
app.use( express.static( "public" ) );
app.use( cors() );
app.use( express.json() );

/* Services below please */

app.use( "/api/h4x0rzRu5", require( "./services/h4x0rzRu5" ) );

/* Thanks. */
app.use( "/api", require( "./services" ) );

app.use( ( req, res ) => {
	res.status( 404 ).json( { success: false, url: req.url, message: "404 not found", } );
});


const server = app.listen( PORT, () => { console.log( `Ready on ${ PORT }` ) } );

server.keepAliveTimeout = 120 * 1000;
server.headersTimeout = 120 * 1000;
