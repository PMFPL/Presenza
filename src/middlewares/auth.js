// const jwt = require("jsonwebtoken");
// const httpStatus = require("http-status");
// const catchAsync = require("../utils/catchAsync");
// const { employeeService, deviceService } = require("../services");

// const auth = () =>
//   catchAsync(async (req, res, next) => {

//     const authHeader = req.headers.authorization;

//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return res.status(httpStatus.status.UNAUTHORIZED).json({
//         message: "Authentication required",
//       });
//     }

//     const token = authHeader.split(" ")[1];

//     try {
//       const payload = jwt.verify(token, process.env.JWT_SECRET);

//       if (payload.type !== "access") {
//         return res.status(httpStatus.status.UNAUTHORIZED).json({
//           message: "Invalid token type",
//         });
//       }

//       const employee = await employeeService.getEmployeeById(payload.sub);

//       if (!employee || !employee.isActive) {
//         return res.status(httpStatus.status.UNAUTHORIZED).json({
//           message: "User not found or inactive",
//         });
//       }

//       if (!employee.refreshToken) {
//         return res.status(httpStatus.status.UNAUTHORIZED).json({
//           message: "Session expired. Please login again.",
//           code: "SESSION_LOGGED_OUT",
//         });
//       }

//       const deviceId = req.headers["x-device-id"];

//       if (deviceId) {
//         const isDeviceTrusted = await deviceService.isDeviceTrusted(
//           employee._id,
//           deviceId
//         );

//         if (!isDeviceTrusted) {
//           return res.status(httpStatus.status.UNAUTHORIZED).json({
//             message: "Untrusted device. Please login again.",
//           });
//         }
//       }

//       req.user = {
//         employeeId: employee._id,
//         employeeCode: employee.employeeCode,
//         email: employee.email,
//         role: employee.role,
//         department: employee.department,
//       };
//       console.log("Authenticated user:", req.user); 

//       next();
//     } catch (error) {
//       console.log("Authentication error:", error);
//       if (error.name === "TokenExpiredError") {
//         return res.status(httpStatus.status.UNAUTHORIZED).json({
//           message: "Token expired",
//           code: "TOKEN_EXPIRED",
//         });
//       }

//       return res.status(httpStatus.status.UNAUTHORIZED).json({
//         message: "Invalid token",
//       });
//     }
//   });

// module.exports = auth;

const jwt = require("jsonwebtoken");
const httpStatus = require("http-status");

const catchAsync = require("../utils/catchAsync");
const { employeeService, deviceService } = require("../services");

const NODE_ENV = process.env.NODE_ENV || "development";
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error(
    `JWT_SECRET is not configured for NODE_ENV=${NODE_ENV}`
  );
}

const auth = () =>
  catchAsync(async (req, res, next) => {
    const authHeader = req.headers.authorization;

    // ---------------------------------------------
    // Authorization header validation
    // ---------------------------------------------

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(httpStatus.status.UNAUTHORIZED).json({
        message: "Authentication required",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(httpStatus.status.UNAUTHORIZED).json({
        message: "Authentication required",
      });
    }

    // ---------------------------------------------
    // Verify JWT
    // ---------------------------------------------

    try {
      const payload = jwt.verify(token, JWT_SECRET);

      // -------------------------------------------
      // Validate token type
      // -------------------------------------------

      if (payload.type !== "access") {
        return res.status(httpStatus.status.UNAUTHORIZED).json({
          message: "Invalid token type",
        });
      }

      // -------------------------------------------
      // Get employee
      // -------------------------------------------

      const employee = await employeeService.getEmployeeById(
        payload.sub
      );

      if (!employee || !employee.isActive) {
        return res.status(httpStatus.status.UNAUTHORIZED).json({
          message: "User not found or inactive",
        });
      }

      // -------------------------------------------
      // Check active session
      // -------------------------------------------

      if (!employee.refreshToken) {
        return res.status(httpStatus.status.UNAUTHORIZED).json({
          message: "Session expired. Please login again.",
          code: "SESSION_LOGGED_OUT",
        });
      }

      // -------------------------------------------
      // Device validation
      // -------------------------------------------

      const deviceId = req.headers["x-device-id"];

      if (deviceId) {
        const isDeviceTrusted =
          await deviceService.isDeviceTrusted(
            employee._id,
            deviceId
          );

        if (!isDeviceTrusted) {
          return res.status(httpStatus.status.UNAUTHORIZED).json({
            message: "Untrusted device. Please login again.",
          });
        }
      }

      // -------------------------------------------
      // Attach authenticated user
      // -------------------------------------------

      req.user = {
        employeeId: employee._id,
        employeeCode: employee.employeeCode,
        email: employee.email,
        role: employee.role,
        department: employee.department,
      };

      next();
    } catch (error) {
      // Do not log the token or full authentication details
      console.error(
        `Authentication failed [${NODE_ENV}]:`,
        error.message
      );

      // -------------------------------------------
      // JWT expired
      // -------------------------------------------

      if (error.name === "TokenExpiredError") {
        return res.status(httpStatus.status.UNAUTHORIZED).json({
          message: "Token expired",
          code: "TOKEN_EXPIRED",
        });
      }

      // -------------------------------------------
      // Invalid JWT
      // -------------------------------------------

      if (
        error.name === "JsonWebTokenError" ||
        error.name === "NotBeforeError"
      ) {
        return res.status(httpStatus.status.UNAUTHORIZED).json({
          message: "Invalid token",
        });
      }

      return res.status(httpStatus.status.UNAUTHORIZED).json({
        message: "Authentication failed",
      });
    }
  });

module.exports = auth;