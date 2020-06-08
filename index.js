/**
 * Custom OCR - CSV tool
 * Author: Mauricio Guzmán Salazar
 */

/** Module initialization */
const tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');
const csv = require('csv-writer').createObjectCsvWriter

/** Teseract js configuration */
const worker = tesseract.createWorker();

/** Main algorithm */
(async () => {

  /** Csv writer configuration */
  const csvWriter = csv({
    path: 'out.csv',
    header: [
      { id: 'date', title: 'Date' },
      { id: 'name', title: 'Name'},
      { id: 'amount', title: 'Amount' }
    ]
  })

  /** Tesseract worker configuration */
  await worker.load();
  await worker.loadLanguage('spa');
  await worker.initialize('spa');
 
  /** Load of raw images */
  const rawImages = fs.readdirSync('./raw_images');
  const rawImagesPaths = [];

  /** Store raw images in new array with complete path */
  for (const image of rawImages) {
    if (image != '.gitkeep') {
      rawImagesPaths.push(path.join('raw_images', image));
    }
  }

  /** Create a new folder for the processed images */
  const processedFolderName = Date.now();
  const processedFolderNamePath = `processed_images/${processedFolderName}`;
  fs.mkdirSync(processedFolderNamePath, { mode: '777'});

  /** Image OCR */
  let imageNumber = 1;
  const csvData = [];
  for (const image of rawImagesPaths) {
    const { data: { text }} = await worker.recognize(image);
    const arrString = text.split(" ");

    /** Name */
    const firstName = arrString[4].split('\n')[1];
    const middleName = arrString[5];
    const firstLastName = arrString[6];
    const lastLastName = arrString[7].split('\n')[0];

    /** Amount */
    const amount = arrString[7].split('\n')[1];

    /** Date */
    const day = arrString[9].split('\n')[1];
    const month = arrString[10];
    const year = arrString[11];
    
    /** Copy images from raw folder to proccesed folder */
    fs.copyFileSync(image, `${processedFolderNamePath}/${imageNumber}-${day}_${month}_${year}_${firstName}_${middleName}_${firstLastName}_${lastLastName}_${amount}.jpeg`);
    imageNumber ++;

    /** Create CSV data and add it to an array */
    csvData.push({
      date: `${day}-${month}-${year}`,
      name: `${firstName} ${middleName} ${firstLastName} ${lastLastName}`,
      amount: `${amount}`
    });
  }

  /** Write to CSV */
  await csvWriter.writeRecords(csvData)

  /** Terminate Tesseract writer */
  await worker.terminate();
  console.log('PROCESSING FINISHED');
})();

/** Posiciones importantes Nombre: [4 5 6 7] Fecha [9 10 11]  Monto [7]*/