import { check } from "express-validator";


export const validateFileUpload = (fieldName, type, size) => {
  return [
    check(fieldName).custom((value, { req }) => {
      // 1. Check if file exists (if required)
      if (!req.file) {
        throw new Error("Please upload a file.");
      }


      // 2. Validate File Type (MIME type)
      const allowedTypes = type;
      if (!allowedTypes.includes(req.file.mimetype)) {
        throw new Error(
          `Invalid file type. Only ${allowedTypes.join(", ")} are allowed`,
        );
      }


      // 3. Validate File Size (e.g., 2MB limit)
      const maxSize = size * 1024 * 1024; // 2MB in bytes
      if (req.file.size > maxSize) {
        throw new Error(`File is too large. Maximum size is ${size}MB`);
      }


      return true; // Validation passed
    }),
  ];
};
