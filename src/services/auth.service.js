// const bcrypt = require('bcrypt');
// const employeeService = require('./employee.service');
// const deviceService = require('./device.service');
// const otpService = require('./otp.service');
// const jwtService = require('./jwt.service');

// // Optional: Add test employee constant for logging
// const TEST_EMPLOYEE_CODE = 'F142626';

// exports.sendOtp = async ({ employeeCode }) => {
//   /* ---------- 1. Employee must exist ---------- */
//   const employee = await employeeService.getEmployeeByCode(employeeCode);

//   if (!employee) {
//     const error = new Error(
//       "Employee not found. Please contact HR or Admin."
//     );
//     error.statusCode = 404;
//     throw error;
//   }

//   /* ---------- 2. Employee must be active ---------- */
//   if (!employee.isActive) {
//     const error = new Error(
//       "Your account is inactive. Please contact HR."
//     );
//     error.statusCode = 403;
//     throw error;
//   }

//   /* ---------- Optional: Log test employee usage ---------- */
//   if (employeeCode === TEST_EMPLOYEE_CODE && process.env.NODE_ENV !== 'production') {
//   }

//   /* ---------- 3. Generate OTP ---------- */
//   await otpService.generateOtp(employee.email, employeeCode);

//   /* ---------- 4. Update auth step ---------- */
//   await employeeService.updateAuthStep(
//     employee._id,
//     "VERIFY_OTP"
//   );

//   return {
//     email: employee.email,
//     employeeCode: employee.employeeCode,
//     step: "VERIFY_OTP",
//   };
// };

// exports.verifyOtp = async ({ employeeCode, otp, deviceInfo }) => {
//   // Verify OTP (test employee logic is inside otpService)
//   await otpService.verifyOtp(employeeCode, otp);

//   // Get employee
//   const employee = await employeeService.getEmployeeByCode(employeeCode);

//   if (!employee) {
//     throw new Error('Employee not found');
//   }

//   /* ---------- Optional: Log test employee verification ---------- */
//   if (employeeCode === TEST_EMPLOYEE_CODE && process.env.NODE_ENV !== 'production') {
//   }

//   // Generate JWT tokens
//   const tokens = await jwtService.generateAuthTokens(employee);

//   // Update employee status
//   await employeeService.updateAuthStep(employee._id, 'AUTHENTICATED');
//   await employeeService.updateLastLogin(employee._id);
//   await employeeService.saveRefreshToken(employee._id, tokens.refresh.token);

//   // Register/update device if device info is provided
//   if (deviceInfo && deviceInfo.deviceId) {
//     console.log(`Registering/updating device for employee ${employeeCode}:`, deviceInfo);
//     await deviceService.registerOrUpdateDevice({
//       employeeId: employee._id,
//       deviceId: deviceInfo.deviceId,
//       platform: deviceInfo.platform,
//       appVersion: deviceInfo.appVersion,
//       osVersion: deviceInfo.osVersion,
//       isTrusted: true, // Auto-trust after OTP verification
//       fcmToken: deviceInfo.fcmToken,
//     });
//   }

//   // Return user data
//   const userData = {
//     id: employee._id,
//     email: employee.email,
//     fullName: employee.fullName,
//     role: employee.role,
//     department: employee.department,
//     designation: employee.designation,
//     isEmailVerified: employee.isEmailVerified,
//     isActive: employee.isActive,
//   };

//   return {
//     tokens,
//     user: userData,
//     step: 'AUTHENTICATED',
//   };
// };

// // ... rest of the file remains exactly the same ...

// exports.refreshTokens = async (refreshToken) => {
//   // Verify refresh token
//   const payload = await jwtService.verifyToken(refreshToken, 'refresh');

//   // Validate token against stored token
//   const isValid = await employeeService.validateRefreshToken(payload.sub, refreshToken);

//   if (!isValid) {
//     throw new Error('Invalid refresh token');
//   }

//   // Get employee
//   const employee = await employeeService.getEmployeeById(payload.sub);

//   if (!employee) {
//     throw new Error('Employee not found');
//   }

//   // Generate new tokens
//   const tokens = await jwtService.generateAuthTokens(employee);

//   // Update stored refresh token
//   await employeeService.saveRefreshToken(employee._id, tokens.refresh.token);

//   return tokens;
// };

// exports.logout = async (employeeId, deviceId) => {
//   // Clear refresh token
//   await employeeService.clearRefreshToken(employeeId);

//   // Remove device if deviceId is provided
//   if (deviceId) {
//     await deviceService.removeDevice(employeeId, deviceId);
//   }
// };

// exports.logoutAllDevices = async (employeeId) => {
//   // Clear refresh token
//   await employeeService.clearRefreshToken(employeeId);

//   // Remove all devices
//   await deviceService.removeAllDevices(employeeId);
// };

// exports.getCurrentUser = async (employeeId) => {
//   const employee = await employeeService.getEmployeeById(employeeId);

//   if (!employee) {
//     return null;
//   }

//   return {
//     id: employee._id,
//     email: employee.email,
//     fullName: employee.fullName,
//     role: employee.role,
//     department: employee.department,
//     designation: employee.designation,
//     isEmailVerified: employee.isEmailVerified,
//     isActive: employee.isActive,
//     lastLoginAt: employee.lastLoginAt,
//     createdAt: employee.createdAt,
//     updatedAt: employee.updatedAt,
//   };
// };


// exports.login = async ({ email, password }) => {
//   // Find employee by email
//   const employee = await employeeService.getEmployeeByEmail(email);

//   if (!employee) {
//     throw new Error('Invalid email or password');
//   }

//   // Check if employee is active
//   if (!employee.isActive) {
//     throw new Error('Your account is inactive. Please contact HR.');
//   }

//   // Verify password
//   const isPasswordValid = await bcrypt.compare(password, employee.password);

//   if (!isPasswordValid) {
//     throw new Error('Invalid email or password');
//   }

//   // Generate JWT tokens
//   const tokens = await jwtService.generateAuthTokens(employee);

//   // Update employee status and last login
//   await employeeService.updateAuthStep(employee._id, 'AUTHENTICATED');
//   await employeeService.updateLastLogin(employee._id);
//   await employeeService.saveRefreshToken(employee._id, tokens.refresh.token);



//   return {
//     tokens,
//     employee
//   };
// }


const bcrypt = require('bcrypt');

const employeeService = require('./employee.service');
const deviceService = require('./device.service');
const otpService = require('./otp.service');
const jwtService = require('./jwt.service');

const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';

// Optional test employee
const TEST_EMPLOYEE_CODE = 'F142626';

/**
 * Send OTP
 */
exports.sendOtp = async ({ employeeCode }) => {
  /* ---------- 1. Employee must exist ---------- */
  const employee = await employeeService.getEmployeeByCode(employeeCode);

  if (!employee) {
    const error = new Error(
      "Employee not found. Please contact HR or Admin."
    );
    error.statusCode = 404;
    throw error;
  }

  /* ---------- 2. Employee must be active ---------- */
  if (!employee.isActive) {
    const error = new Error(
      "Your account is inactive. Please contact HR."
    );
    error.statusCode = 403;
    throw error;
  }

  /* ---------- Optional: Log test employee usage ---------- */
  if (employeeCode === TEST_EMPLOYEE_CODE && process.env.NODE_ENV !== 'production') {
  }

  /* ---------- 3. Generate OTP ---------- */
  await otpService.generateOtp(employee.email, employeeCode);

  /* ---------- 4. Update auth step ---------- */
  await employeeService.updateAuthStep(
    employee._id,
    "VERIFY_OTP"
  );

  return {
    email: employee.email,
    employeeCode: employee.employeeCode,
    step: "VERIFY_OTP",
  };
};

/**
 * Verify OTP
 */
exports.verifyOtp = async ({
  employeeCode,
  otp,
  deviceInfo,
}) => {
  /* ---------- 1. Verify OTP ---------- */
  // Test employee OTP logic is handled inside otpService
  await otpService.verifyOtp(employeeCode, otp);

  /* ---------- 2. Get employee ---------- */
  const employee =
    await employeeService.getEmployeeByCode(employeeCode);

  if (!employee) {
    const error = new Error('Employee not found');
    error.statusCode = 404;
    throw error;
  }

  /* ---------- 3. Generate JWT tokens ---------- */
  const tokens =
    await jwtService.generateAuthTokens(employee);

  /* ---------- 4. Update authentication status ---------- */
  await employeeService.updateAuthStep(
    employee._id,
    'AUTHENTICATED'
  );

  await employeeService.updateLastLogin(
    employee._id
  );

  await employeeService.saveRefreshToken(
    employee._id,
    tokens.refresh.token
  );

  /* ---------- 5. Register/update device ---------- */
  if (deviceInfo?.deviceId) {
    if (!IS_PRODUCTION) {
      console.log(
        `Registering/updating device for employee ${employeeCode} [${NODE_ENV}]`
      );
    }

    await deviceService.registerOrUpdateDevice({
      employeeId: employee._id,
      deviceId: deviceInfo.deviceId,
      platform: deviceInfo.platform,
      appVersion: deviceInfo.appVersion,
      osVersion: deviceInfo.osVersion,
      isTrusted: true,
      fcmToken: deviceInfo.fcmToken,
    });
  }

  /* ---------- 6. Prepare user data ---------- */
  const userData = {
    id: employee._id,
    email: employee.email,
    fullName: employee.fullName,
    role: employee.role,
    department: employee.department,
    designation: employee.designation,
    isEmailVerified: employee.isEmailVerified,
    isActive: employee.isActive,
  };

  return {
    tokens,
    user: userData,
    step: 'AUTHENTICATED',
  };
};

/**
 * Refresh access/refresh tokens
 */
exports.refreshTokens = async (refreshToken) => {
  if (!refreshToken) {
    const error = new Error('Refresh token is required');
    error.statusCode = 401;
    throw error;
  }

  /* ---------- 1. Verify refresh token ---------- */
  const payload = await jwtService.verifyToken(
    refreshToken,
    'refresh'
  );

  /* ---------- 2. Validate stored refresh token ---------- */
  const isValid =
    await employeeService.validateRefreshToken(
      payload.sub,
      refreshToken
    );

  if (!isValid) {
    const error = new Error('Invalid refresh token');
    error.statusCode = 401;
    throw error;
  }

  /* ---------- 3. Get employee ---------- */
  const employee =
    await employeeService.getEmployeeById(payload.sub);

  if (!employee) {
    const error = new Error('Employee not found');
    error.statusCode = 404;
    throw error;
  }

  if (!employee.isActive) {
    const error = new Error(
      'Your account is inactive. Please contact HR.'
    );
    error.statusCode = 403;
    throw error;
  }

  /* ---------- 4. Generate new tokens ---------- */
  const tokens =
    await jwtService.generateAuthTokens(employee);

  /* ---------- 5. Rotate refresh token ---------- */
  await employeeService.saveRefreshToken(
    employee._id,
    tokens.refresh.token
  );

  return tokens;
};

/**
 * Logout current device/session
 */
exports.logout = async (employeeId, deviceId) => {
  /* ---------- 1. Clear refresh token ---------- */
  await employeeService.clearRefreshToken(employeeId);

  /* ---------- 2. Remove current device ---------- */
  if (deviceId) {
    await deviceService.removeDevice(
      employeeId,
      deviceId
    );
  }
};

/**
 * Logout from all devices
 */
exports.logoutAllDevices = async (employeeId) => {
  /* ---------- 1. Clear refresh token ---------- */
  await employeeService.clearRefreshToken(employeeId);

  /* ---------- 2. Remove all registered devices ---------- */
  await deviceService.removeAllDevices(employeeId);
};

/**
 * Get current authenticated user
 */
exports.getCurrentUser = async (employeeId) => {
  const employee =
    await employeeService.getEmployeeById(employeeId);

  if (!employee) {
    return null;
  }

  return {
    id: employee._id,
    email: employee.email,
    fullName: employee.fullName,
    role: employee.role,
    department: employee.department,
    designation: employee.designation,
    isEmailVerified: employee.isEmailVerified,
    isActive: employee.isActive,
    lastLoginAt: employee.lastLoginAt,
    createdAt: employee.createdAt,
    updatedAt: employee.updatedAt,
  };
};

/**
 * Login with email/password
 */
exports.login = async ({ email, password }) => {
  /* ---------- 1. Find employee ---------- */
  const employee =
    await employeeService.getEmployeeByEmail(email);

  if (!employee) {
    const error = new Error(
      'Invalid email or password'
    );
    error.statusCode = 401;
    throw error;
  }

  /* ---------- 2. Check active status ---------- */
  if (!employee.isActive) {
    const error = new Error(
      'Your account is inactive. Please contact HR.'
    );
    error.statusCode = 403;
    throw error;
  }

  /* ---------- 3. Verify password ---------- */
  const isPasswordValid = await bcrypt.compare(
    password,
    employee.password
  );

  if (!isPasswordValid) {
    const error = new Error(
      'Invalid email or password'
    );
    error.statusCode = 401;
    throw error;
  }

  /* ---------- 4. Generate JWT tokens ---------- */
  const tokens =
    await jwtService.generateAuthTokens(employee);

  /* ---------- 5. Update authentication status ---------- */
  await employeeService.updateAuthStep(
    employee._id,
    'AUTHENTICATED'
  );

  await employeeService.updateLastLogin(
    employee._id
  );

  /* ---------- 6. Store refresh token ---------- */
  await employeeService.saveRefreshToken(
    employee._id,
    tokens.refresh.token
  );

  /* ---------- 7. Return safe employee data ---------- */
  const user = {
    id: employee._id,
    email: employee.email,
    fullName: employee.fullName,
    role: employee.role,
    department: employee.department,
    designation: employee.designation,
    isEmailVerified: employee.isEmailVerified,
    isActive: employee.isActive,
  };

  if (!IS_PRODUCTION) {
    console.log(
      `Employee login successful: ${employee.employeeCode} [${NODE_ENV}]`
    );
  }

  return {
    tokens,
    user,
  };
};