const fs = require('fs');

const wadlFile = fs.readFileSync('test/vidispine_4.9.wadl', 'utf-8');
const vidispine = require('../index.js')(wadlFile);
