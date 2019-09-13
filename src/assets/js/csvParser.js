const csv = require('csv-parser');
const fs = require('fs');

const results = [];

fs.createReadStream('public/narodni-registr-poskytovatelu-zdravotnich-sluzeb.csv')
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      console.log(results);
      fs.writeFile('public/nrpzs.json', JSON.stringify(results), 'utf8', () => {
      });
    });
