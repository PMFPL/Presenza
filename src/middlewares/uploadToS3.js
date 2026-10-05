// const multer = require("multer");
// const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
// const { v4: uuidv4 } = require("uuid"); // For unique file names
// require("dotenv").config();

// // Multer configuration for multiple fields
// const storage = multer.memoryStorage(); // Store files in memory (Buffer)
// const upload = multer({
//   storage,
//   limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
//   fileFilter: (req, file, cb) => {
//     const allowedTypes = ["image/", "application/pdf"];

//     if (
//       file.mimetype.startsWith("image/") ||
//       file.mimetype === "application/pdf"
//     ) {
//       cb(null, true);
//     } else {
//       cb(new Error("Only image and PDF files are allowed!"), false);
//     }
//   },
// }).fields([
//   { name: "image", maxCount: 1 },
//   { name: "logo", maxCount: 1 },
//   { name: "thumbnail", maxCount: 1 },
//   { name: "banner", maxCount: 1 },
//   { name: "file", maxCount: 1 }
// ]);

// // AWS S3 Client
// const s3Client = new S3Client({
//   region: process.env.AWS_REGION,
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   },
// });

// // Middleware to upload files to S3
// const uploadToS3 = async (req, res, next) => {
//   try {
//     if (!req.files) {
//       return res.status(400).send("No files uploaded");
//     }

//     const fileUrls = {};

//     // Iterate over each field in the req.files object
//     for (const fieldName in req.files) {
//       const file = req.files[fieldName][0]; // Each field contains an array
//       const fileExtension = file.originalname.split(".").pop();
//       const fileName = `${uuidv4()}.${fileExtension}`;

//       const params = {
//         Bucket: process.env.AWS_BUCKET_NAME,
//         Key: fileName,
//         Body: file.buffer,
//         ContentType: file.mimetype,
//         ACL: "public-read", // Make the file publicly accessible (optional)
//       };

//       const command = new PutObjectCommand(params);
//       await s3Client.send(command);

//       // Store the file URL in the fileUrls object
//       fileUrls[
//         fieldName
//       ] = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
//     }

//     // Attach the file URLs to the request object for later use
//     req.fileUrls = fileUrls;
//     console.log("Files uploaded to S3:", fileUrls);
//     next();
//   } catch (error) {
//     console.log("Error uploading to S3:", error);
//     next(error);
//   }
// };

// module.exports = { upload, uploadToS3 };


const multer = require("multer");
const {
  S3Client,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");
const { v4: uuidv4 } = require("uuid");

const NODE_ENV = process.env.NODE_ENV || "development";

const AWS_REGION = process.env.AWS_REGION;
const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

if (!AWS_REGION) {
  throw new Error(
    `AWS_REGION is not configured for NODE_ENV=${NODE_ENV}`
  );
}

if (!AWS_BUCKET_NAME) {
  throw new Error(
    `AWS_BUCKET_NAME is not configured for NODE_ENV=${NODE_ENV}`
  );
}

if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
  throw new Error(
    `AWS credentials are not configured for NODE_ENV=${NODE_ENV}`
  );
}

// --------------------------------------------------
// Multer configuration
// --------------------------------------------------

const storage = multer.memoryStorage();

const upload = multer({
  storage,

  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB
  },

  fileFilter: (req, file, cb) => {
    const isImage = file.mimetype.startsWith("image/");
    const isPdf = file.mimetype === "application/pdf";

    if (isImage || isPdf) {
      cb(null, true);
    } else {
      cb(
        new Error("Only image and PDF files are allowed!"),
        false
      );
    }
  },
}).fields([
  { name: "image", maxCount: 1 },
  { name: "logo", maxCount: 1 },
  { name: "thumbnail", maxCount: 1 },
  { name: "banner", maxCount: 1 },
  { name: "file", maxCount: 1 },
]);

// --------------------------------------------------
// AWS S3 Client
// --------------------------------------------------

const s3Client = new S3Client({
  region: AWS_REGION,

  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

// --------------------------------------------------
// Upload files to S3
// --------------------------------------------------

const uploadToS3 = async (req, res, next) => {
  try {
    // if (!req.files || Object.keys(req.files).length === 0) {
    //   return res.status(400).send("No files uploaded");
    // }

    const fileUrls = {};

    for (const fieldName in req.files) {
      const files = req.files[fieldName];

      if (!files || files.length === 0) {
        continue;
      }

      const file = files[0];

      // Get extension safely
      const originalName = file.originalname || "";
      const extension = originalName.includes(".")
        ? originalName.split(".").pop().toLowerCase()
        : "";

      const fileName = extension
        ? `${uuidv4()}.${extension}`
        : uuidv4();

      const params = {
        Bucket: AWS_BUCKET_NAME,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,

        /*
         * Do not use ACL here unless your S3 bucket
         * explicitly supports ACLs.
         *
         * Modern S3 buckets commonly have ACLs disabled.
         */
      };

      const command = new PutObjectCommand(params);

      await s3Client.send(command);

      // Public S3 URL
      fileUrls[fieldName] =
        `https://${AWS_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${fileName}`;
    }

    req.fileUrls = fileUrls;

    console.log(
      `Files uploaded to S3 [${NODE_ENV}]:`,
      Object.keys(fileUrls)
    );

    next();
  } catch (error) {
    console.log(error); 
    console.error(
      `Error uploading files to S3 [${NODE_ENV}]:`,
      error.message
    );

    next(error);
  }
};

module.exports = {
  upload,
  uploadToS3,
};