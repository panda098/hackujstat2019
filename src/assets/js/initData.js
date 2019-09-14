const csv = require('csv-parser');
const fs = require('fs');
const xml2js = require('xml2js');

const nrpzs = [];

fs.createReadStream('../csv/narodni-registr-poskytovatelu-zdravotnich-sluzeb.csv')
    .pipe(csv())
    .on('data', (data) => nrpzs.push(data))
    .on('end', () => {
      fs.writeFile('../../../public/nrpzs.json', JSON.stringify(nrpzs), 'utf8', () => {
      });
    });


const kraje = [];

fs.createReadStream('../csv/kraj.csv')
    .pipe(csv({separator: ';'}))
    .on('data', (data) => {
      kraje.push(data)
    })
    .on('end', () => {
      fs.writeFile('../../../public/kraj.json', JSON.stringify(kraje), 'utf8', () => {
      });
    });

const okresy = [];

fs.createReadStream('../csv/okres.csv')
    .pipe(csv({separator: ';'}))
    .on('data', (data) => {
      okresy.push(data)
    })
    .on('end', () => {
      fs.writeFile('../../../public/okres.json', JSON.stringify(okresy), 'utf8', () => {
      });
    });

const obce = [];

fs.createReadStream('../csv/obec.csv')
    .pipe(csv({separator: ';'}))
    .on('data', (data) => {
      obce.push(data)
    })
    .on('end', () => {
      fs.writeFile('../../../public/obec.json', JSON.stringify(obce), 'utf8', () => {
      });
    });

let ciselnikKraje = [];
var parser = new xml2js.Parser();
fs.readFile('../csv/CIS0100_CS.xml', function (err, data) {
  parser.parseString(data, function (err, result) {
    var kraje = result.EXPORT.DATA[0].POLOZKA;
    kraje.forEach((el) => {
      ciselnikKraje.push({
        'kod': el.CHODNOTA[0],
        'nuts': el.ATRIBUTY[0].ATR[0]._
      })
    });
  });
});

const zemreli = [];

fs.createReadStream('../csv/zemreli.csv')
    .pipe(csv({separator: ','}))
    .on('data', (data) => {
      let el = ciselnikKraje.find(x => x.kod === data.vuzemi_kod);
      if (el) {
        data.hodnota = parseInt(data.hodnota);
        data.nuts = el.nuts;
        zemreli.push(data)
      }
    })
    .on('end', () => {
      fs.writeFile('../../../public/zemreli.json', JSON.stringify(zemreli), 'utf8', () => {
      });
    });

const dnp = [];

fs.createReadStream('../csv/pocet-vyplacenych-dnp-podle-kraju-2019.csv')
    .pipe(csv({separator: ','}))
    .on('data', (data) => {
      let ruianKod = data.kraj_kod.replace("VC.", "");
      let kraj = kraje.find(x => x.id === ruianKod);
      data.nuts = kraj.nuts;
      dnp.push(data)
    })
    .on('end', () => {
      fs.writeFile('../../../public/dnp.json', JSON.stringify(dnp), 'utf8', () => {
      });
    });
