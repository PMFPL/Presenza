// const jwt = require('jsonwebtoken');

// const generateToken = (employeeId, expires, type, secret = process.env.JWT_SECRET) => {
//   const payload = {
//     sub: employeeId,
//     iat: Math.floor(Date.now() / 1000),
//     exp: Math.floor(Date.now() / 1000) + expires,
//     type,
//   };
//   return jwt.sign(payload, secret);
// };

// exports.generateAuthTokens = async (employee) => {
//   const accessTokenExpires = parseInt(process.env.JWT_ACCESS_EXPIRATION_MINUTES || 15) * 60;
//   const refreshTokenExpires = parseInt(process.env.JWT_REFRESH_EXPIRATION_DAYS || 7) * 24 * 60 * 60;

//   const accessToken = generateToken(employee._id, accessTokenExpires, 'access');
//   const refreshToken = generateToken(employee._id, refreshTokenExpires, 'refresh');

//   return {
//     access: {
//       token: accessToken,
//       expires: new Date(Date.now() + accessTokenExpires * 1000),
//     },
//     refresh: {
//       token: refreshToken,
//       expires: new Date(Date.now() + refreshTokenExpires * 1000),
//     },
//   };
// };

// exports.verifyToken = async (token, type) => {
//   const secret = process.env.JWT_SECRET;
//   const payload = jwt.verify(token, secret);
  
//   if (payload.type !== type) {
//     throw new Error('Invalid token type');
//   }
  
//   return payload;
// };

// exports.refreshAuthTokens = async (refreshToken) => {
//   const payload = await verifyToken(refreshToken, 'refresh');
//   return await generateAuthTokens({ _id: payload.sub });
// };


const jwt = require('jsonwebtoken');

const NODE_ENV = process.env.NODE_ENV || 'development';
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error(
    `JWT_SECRET is not configured for NODE_ENV=${NODE_ENV}`
  );
}

const ACCESS_EXPIRATION_MINUTES =
  Number.parseInt(
    process.env.JWT_ACCESS_EXPIRATION_MINUTES,
    10
  ) || 15;

const REFRESH_EXPIRATION_DAYS =
  Number.parseInt(
    process.env.JWT_REFRESH_EXPIRATION_DAYS,
    10
  ) || 7;


/**
 * Generate JWT token
 */
const generateToken = (
  employeeId,
  expiresInSeconds,
  type
) => {
  const now = Math.floor(Date.now() / 1000);

  const payload = {
    sub: employeeId.toString(),
    iat: now,
    exp: now + expiresInSeconds,
    type,
  };

  return jwt.sign(payload, JWT_SECRET);
};


/**
 * Generate access and refresh tokens
 */
exports.generateAuthTokens = async (employee) => {
  if (!employee?._id) {
    throw new Error('Employee ID is required to generate tokens');
  }

  const accessTokenExpires =
    ACCESS_EXPIRATION_MINUTES * 60;

  const refreshTokenExpires =
    REFRESH_EXPIRATION_DAYS * 24 * 60 * 60;

  const accessToken = generateToken(
    employee._id,
    accessTokenExpires,
    'access'
  );

  const refreshToken = generateToken(
    employee._id,
    refreshTokenExpires,
    'refresh'
  );

  return {
    access: {
      token: accessToken,
      expires: new Date(
        Date.now() + accessTokenExpires * 1000
      ),
    },

    refresh: {
      token: refreshToken,
      expires: new Date(
        Date.now() + refreshTokenExpires * 1000
      ),
    },
  };
};


/**
 * Verify JWT token
 */
exports.verifyToken = async (token, type) => {
  if (!token) {
    throw new Error('Token is required');
  }

  if (!type) {
    throw new Error('Token type is required');
  }

  const payload = jwt.verify(
    token,
    JWT_SECRET
  );

  if (payload.type !== type) {
    throw new Error('Invalid token type');
  }

  return payload;
};


/**
 * Generate new tokens from refresh token
 */
exports.refreshAuthTokens = async (refreshToken) => {
  const payload = await exports.verifyToken(
    refreshToken,
    'refresh'
  );

  return exports.generateAuthTokens({
    _id: payload.sub,
  });
};