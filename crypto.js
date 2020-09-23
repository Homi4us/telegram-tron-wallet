// Part of https://github.com/chris-rock/node-crypto-examples

var crypto = require('crypto'),
algorithm = 'aes-256-ctr'


exports.encrypt = (chunk,key)=> {

	var cipher,
	    result,
        iv;
    chunk = new Buffer(chunk, "utf8")
    let password = crypto.createHash('sha256').update(String(key)).digest('base64').substr(0, 32);

	// Create an iv
	iv = crypto.randomBytes(16);

	// Create a new cipher
	cipher = crypto.createCipheriv(algorithm, password, iv);

	// Create the new chunk
	result = Buffer.concat([iv, cipher.update(chunk), cipher.final()]);

	return result.toString('hex');
}
 
exports.decrypt=(chunk_, key)=> {

	var decipher,
	    result,
	    iv;

    let chunk = Buffer.from(chunk_,'hex')
    let password = crypto.createHash('sha256').update(String(key)).digest('base64').substr(0, 32);
	// Get the iv: the first 16 bytes
	iv = chunk.slice(0, 16);

	// Get the rest
	chunk = chunk.slice(16);

	// Create a decipher
	decipher = crypto.createDecipheriv(algorithm, password, iv);

	// Actually decrypt it
	result = Buffer.concat([decipher.update(chunk), decipher.final()]);

	return result.toString('utf-8');
}
 

