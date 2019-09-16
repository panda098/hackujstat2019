const csv = require('csv-parser');
const fs = require('fs');
const xml2js = require('xml2js');

const nrpzs = [];

fs.createReadStream(__dirname + '/../csv/narodni-registr-poskytovatelu-zdravotnich-sluzeb.csv')
    .pipe(csv())
    .on('data', (data) => nrpzs.push(data))
    .on('end', () => {
      fs.writeFile(__dirname + '/../../../public/nrpzs.json', JSON.stringify(nrpzs), 'utf8', () => {
      });
    });


const kraje = [];

fs.createReadStream(__dirname + '/../csv/kraj.csv')
    .pipe(csv({separator: ';'}))
    .on('data', (data) => {
      kraje.push(data)
    })
    .on('end', () => {
      fs.writeFile(__dirname + '/../../../public/kraj.json', JSON.stringify(kraje), 'utf8', () => {
      });
    });

const okresy = [];

fs.createReadStream(__dirname + '/../csv/okres.csv')
    .pipe(csv({separator: ';'}))
    .on('data', (data) => {
      okresy.push(data)
    })
    .on('end', () => {
      fs.writeFile(__dirname + '/../../../public/okres.json', JSON.stringify(okresy), 'utf8', () => {
      });
    });

const obce = [];

fs.createReadStream(__dirname + '/../csv/obec.csv')
    .pipe(csv({separator: ';'}))
    .on('data', (data) => {
      obce.push(data)
    })
    .on('end', () => {
      fs.writeFile(__dirname + '/../../../public/obec.json', JSON.stringify(obce), 'utf8', () => {
      });
    });

let ciselnikKraje = [];
var parser = new xml2js.Parser();
fs.readFile(__dirname + '/../csv/CIS0100_CS.xml', function (err, data) {
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

fs.createReadStream(__dirname + '/../csv/zemreli.csv')
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
      fs.writeFile(__dirname + '/../../../public/zemreli.json', JSON.stringify(zemreli), 'utf8', () => {
      });
    });

const dnp = [];

fs.createReadStream(__dirname + '/../csv/pocet-vyplacenych-dnp-podle-kraju-2019.csv')
    .pipe(csv({separator: ','}))
    .on('data', (data) => {
      let ruianKod = data.kraj_kod.replace("VC.", "");
      let kraj = kraje.find(x => x.id === ruianKod);
      data.nuts = kraj.nuts;
      dnp.push(data)
    })
    .on('end', () => {
      fs.writeFile(__dirname + '/../../../public/dnp.json', JSON.stringify(dnp), 'utf8', () => {
      });
    });
