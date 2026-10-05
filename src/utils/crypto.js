// const crypto = require("crypto")
// const dotenv = require("dotenv")
// const path = require("path")
// dotenv.config({ path: path.join(__dirname, "../../.env") });

// var key = process.env.CRYPTO_SERVER_KEY
// var iv = key.slice(0, 16)
// const algorithm = "aes-256-cbc" //Using AES encryption
// let encoding = "base64"

// function encrypt(text) {
// 	var cipher = crypto.createCipheriv("aes256", key, iv)
// 	var result = cipher.update(text, "utf8", encoding)
// 	result += cipher.final(encoding)
// 	return result
// }

// function decrypt(text) {
// 	var decipher = crypto.createDecipheriv("aes256", key, iv)
// 	var result = decipher.update(text, "base64")
// 	result += decipher.final()
// 	return result
// }

// function ccAvenueEncrypt (plainText,workingKey){
// 	var m = crypto.createHash('md5');
//     	m.update(workingKey);
//    	var key = m.digest('binary');
//       	var iv = '\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0a\x0b\x0c\x0d\x0e\x0f';	
// 	var cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
// 	var encoded = cipher.update(plainText,'utf8','hex');
// 	encoded += cipher.final('hex');
//     	return encoded;
// }
// function ccAvenueDecrypt (encText,workingKey){
// 	var m = crypto.createHash('md5');
// 	m.update(workingKey)
// 	var key = m.digest('binary');
// var iv = '\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0a\x0b\x0c\x0d\x0e\x0f';	
// var decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
// 	var decoded = decipher.update(encText,'hex','utf8');
// decoded += decipher.final('utf8');
// 	return decoded;
// }
// module.exports = {
// 	encrypt,
// 	decrypt,
// 	ccAvenueEncrypt,
// 	ccAvenueDecrypt
// }


const crypto = require("crypto");

/*
 * Environment variables are loaded in server.js
 *
 * UAT:
 *   NODE_ENV=uat
 *   -> .env.uat
 *
 * PROD:
 *   NODE_ENV=production
 *   -> .env.prod
 */

const key = process.env.CRYPTO_SERVER_KEY;

if (!key) {
    throw new Error(
        `CRYPTO_SERVER_KEY is not configured for NODE_ENV=${process.env.NODE_ENV}`
    );
}

if (Buffer.byteLength(key, "utf8") !== 32) {
    throw new Error(
        `CRYPTO_SERVER_KEY must be exactly 32 bytes for AES-256-CBC`
    );
}

const iv = key.slice(0, 16);

const encoding = "base64";

/**
 * General AES-256-CBC encryption
 */
function encrypt(text) {
    const cipher = crypto.createCipheriv(
        "aes-256-cbc",
        Buffer.from(key, "utf8"),
        Buffer.from(iv, "utf8")
    );

    let result = cipher.update(text, "utf8", encoding);
    result += cipher.final(encoding);

    return result;
}

/**
 * General AES-256-CBC decryption
 */
function decrypt(text) {
    const decipher = crypto.createDecipheriv(
        "aes-256-cbc",
        Buffer.from(key, "utf8"),
        Buffer.from(iv, "utf8")
    );

    let result = decipher.update(text, "base64", "utf8");
    result += decipher.final("utf8");

    return result;
}

/**
 * CCAvenue encryption
 *
 * CCAvenue uses:
 * - MD5 hash of working key
 * - AES-128-CBC
 * - Fixed IV
 */
function ccAvenueEncrypt(plainText, workingKey) {
    const md5 = crypto.createHash("md5");
    md5.update(workingKey);

    const derivedKey = md5.digest();

    const iv = Buffer.from([
        0x00,
        0x01,
        0x02,
        0x03,
        0x04,
        0x05,
        0x06,
        0x07,
        0x08,
        0x09,
        0x0a,
        0x0b,
        0x0c,
        0x0d,
        0x0e,
        0x0f,
    ]);

    const cipher = crypto.createCipheriv(
        "aes-128-cbc",
        derivedKey,
        iv
    );

    let encoded = cipher.update(
        plainText,
        "utf8",
        "hex"
    );

    encoded += cipher.final("hex");

    return encoded;
}

/**
 * CCAvenue decryption
 */
function ccAvenueDecrypt(encText, workingKey) {
    const md5 = crypto.createHash("md5");
    md5.update(workingKey);

    const derivedKey = md5.digest();

    const iv = Buffer.from([
        0x00,
        0x01,
        0x02,
        0x03,
        0x04,
        0x05,
        0x06,
        0x07,
        0x08,
        0x09,
        0x0a,
        0x0b,
        0x0c,
        0x0d,
        0x0e,
        0x0f,
    ]);

    const decipher = crypto.createDecipheriv(
        "aes-128-cbc",
        derivedKey,
        iv
    );

    let decoded = decipher.update(
        encText,
        "hex",
        "utf8"
    );

    decoded += decipher.final("utf8");

    return decoded;
}

module.exports = {
    encrypt,
    decrypt,
    ccAvenueEncrypt,
    ccAvenueDecrypt,
};