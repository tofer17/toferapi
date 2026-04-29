/**
 * 
 */
async function h4x0rzRu5 ( req, res ) {

	if ( req.body == null ) {
		res.status( 400 ).json( { success: false, message: "Missing body", } );
		return;
	} else if ( req.body.seed == null || typeof req.body.seed !== "number" || req.body.seed === 0 ) {
		res.status( 400 ).json( { success: false, message: "Invalid request", } );
		return;
	} 

	const seed = req.body.seed;

	const roll = await rollIt( seed );
	res.status( 201 ).json( { success: true, roll } );
}


async function encr ( seed, bits, _salt, _iv, _data ) {

	const raw = concat( seed, bits );
	const data = concat( seed, _salt, _iv, _data );

	const salt = crypto.getRandomValues( new Uint16Array( 1 ) );
	const iv = crypto.getRandomValues( new Uint8Array( 12 ) );

	const keyMat = await crypto.subtle.importKey(
		"raw", raw, "PBKDF2", false, [ "deriveKey" ]
	);

	const key = await crypto.subtle.deriveKey(
		{ name: "PBKDF2", salt, iterations: 100000, hash: "SHA-512", }, 
		keyMat, 
		{ name: "AES-GCM", length: 256, iv },
		false, [ "encrypt" ]
	);

	const ct = new Uint8Array( await crypto.subtle.encrypt(
		{ name: "AES-GCM", length: 256, iv },
		key, data
	));

	return { seed, salt, iv, ct };
}

async function rollIt ( seed ) {
	seed = Uint32Array.from( [ seed ] );

	const hash = new Uint32Array( await crypto.subtle.digest( "SHA-512", seed ) );
	const rand = new PRNG( process.env.H4X0RZRU5_A, ...Array.from( hash ), process.env.H4X0RZRU5_B );

	let roll = { ct: new Uint8Array( 0 ), };
	let salt = new Uint16Array( 0 );
	let iv = new Uint8Array( 0 );

	console.log( "snv: " + seed );
	console.time( "gen" );
	for ( let i = 99, j = 0; i >= 0; i--, j++ ) {
		const bitCount = ~~( i / 10 ) + 1;
		const bits = new Uint8Array( bitCount );
		for ( let k = 0; k < bitCount; k++ ) bits[ k ] = rand.uint32() % 2;
		roll = await encr( seed, bits, salt, iv, roll.ct );
		salt = roll.salt;
		iv = roll.iv;
	}
	console.timeEnd( "gen" );
	console.log( "c/t: " + roll.ct.length + ".0 bytes" );

	return { seed: Array.from( seed ), salt: Array.from( roll.salt ), iv: Array.from( roll.iv ), ct: Array.from( roll.ct ) };
}

/** @param {...ArrayBuffer} arrays */
function concat ( ...arrays ) {
	let size = arrays.reduce( ( a, b ) => a + b.byteLength, 0 );
	let result = new Uint8Array( size );
	
	let offset = 0;
	for ( let arr of arrays ) {
		result.set( new Uint8Array( arr.buffer, arr.byteOffset, arr.byteLength ), offset );
		offset += arr.byteLength;
	}

	return result;
}

class PRNG extends Object {

	#state;

	#args;


	constructor ( ...args ) {
		super();
		this.withSeed( ...args );
	}


	get args () { return this.#args; }

	withSeed ( ...args ) {
		if ( args == null || args.length == 0 ) args = [ Date.now() ];
		this.#args = args.concat();
		this.#state = 0;
		for ( let i = 0; i < args.length; i++ ) {
			if ( typeof args[ i ] === "object") args[ i ] = args[ i ].toString();
			if ( typeof args[ i ] === "string" ) {
				const arr = new TextEncoder().encode( args[ i ] );
				args[ i ] = 0;
				for ( let j = 0; j < arr.length; j++ ) args[ i ] += arr[ j ];
			}
			if ( typeof args[ i ] === "number" ) this.#state += Math.abs( args[ i ] );
		}
		
		console.log("rnd:", this.#state)
		return this;		
	}

	uint32 () {
		this.#state = 69069 * this.#state + 1 >>> 1;
		//this.#state = 69069 * this.#state + 1 >>> 0;
		//this.#state = ( ( 25214903917 * this.#state ) + 11 ) >>> 0; // Java?
		//this.#state = ( ( 25214903917 * this.#state ) + 11 ) % 281474976710656;
		//this.#state = ( ( 69069 * this.#state ) + 1 ) % 4294967296;
		return this.#state;
	}

	get int () { return this.uint32(); }
	get boolean () { return this.uint32() % 2; }
}

module.exports = h4x0rzRu5;
