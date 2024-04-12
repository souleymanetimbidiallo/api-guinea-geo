const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

async function getSousPrefectures() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://fr.wikipedia.org/wiki/Subdivisions_de_la_Guinée');

  const html = await page.content();
  const $ = cheerio.load(html);

  const sousPrefectures = [];

  // Parcourir les lignes du tableau
  $('.wikitable.alternance tr').each((i, row) => {
    if (i === 0) return; // Ignorer la ligne d'en-tête

    const cells = $(row).find('td');

    // Extraire les informations
    const prefecture = $(cells[0]).text().trim();
    const sousPrefecture = $(cells[1]).text().trim();

    sousPrefectures.push({
      prefecture,
      sousPrefecture,
    });
  });

  await browser.close();

  return sousPrefectures;
}

getSousPrefectures().then((data) => {
  console.log(data);
});
