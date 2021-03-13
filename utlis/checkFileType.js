const path = require("path");
const checkFileType = (filename, filetype) =>
  path.extname(filename) === filetype;
export default checkFileType;
