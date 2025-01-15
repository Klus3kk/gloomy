const fs = require("fs");
const path = require("path");

const filesDir = path.join(process.cwd(), "public/files");
const apiDir = path.join(process.cwd(), "public/api"); // Ensure this directory exists

const generateFiles = () => {
  // Ensure the public/api directory exists
  if (!fs.existsSync(apiDir)) {
    fs.mkdirSync(apiDir, { recursive: true }); // Create the directory if it doesn't exist
  }

  const categories = {};

  const getFiles = (dirPath) => {
    const files = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const file of files) {
      const fullPath = path.join(dirPath, file.name);
      if (file.isDirectory()) {
        const categoryName = file.name;
        categories[categoryName] = fs
          .readdirSync(fullPath)
          .filter((f) => fs.statSync(path.join(fullPath, f)).isFile());
      }
    }
  };

  getFiles(filesDir);

  fs.writeFileSync(
    path.join(apiDir, "files.json"),
    JSON.stringify(categories, null, 2)
  );
  console.log("Static JSON generated at public/api/files.json");
};

generateFiles();
