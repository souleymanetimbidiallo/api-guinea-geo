const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

async function getSousPrefectures() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://en.m.wikipedia.org/wiki/Sub-prefectures_of_Guinea');

  // Récupérer le contenu HTML de la page
  const html = await page.content();
  // Utiliser Cheerio pour charger le HTML
  const $ = cheerio.load(html);

  // Trouver le tableau suivant directement le titre spécifié. Cette étape peut nécessiter d'ajuster le sélecteur pour correspondre à la structure exacte de la page.
  // Par exemple, si le tableau est dans une section qui suit immédiatement un titre particulier.
  // Vous pourriez devoir utiliser un sélecteur plus précis pour cibler le tableau exact si celui-ci n'est pas unique.
  const tableRows = $('table').find('tr p');
    console.log(tableRows)
  // Parcourir chaque ligne du tableau et extraire les informations
  let data = [];
  tableRows.each((index, element) => {
    // Supposons que chaque ligne a des cellules (th ou td) contenant les données.
    const cells = $(element).find('th, td');
    let rowData = [];
    cells.each((index, cell) => {
      rowData.push($(cell).text().trim());
    });
    data.push(rowData);
  });

  console.log(data);
  await browser.close();
}

getSousPrefectures();
