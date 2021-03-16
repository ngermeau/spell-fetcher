'use strict'
import fetch from 'node-fetch';
import cheerio from 'cheerio';
import child from 'child_process';
import csvw from 'csv-writer';

const spellProperties = [ { id: 'nom', title: 'nom' }, 
                          { id: 'niveau', title: 'niveau' },
                          { id: 'lien', title: 'lien' },
                          { id: 'Cible', title: 'Cible' },
                          { id : 'Temps d\'incantation', title: 'Temps d\'incantation'},
                          { id : 'Portée', title: 'Portée'},
                          { id : 'Zone d\'effet', title: 'Zone d\'effet'},
                          { id : 'Durée', title: 'Durée'},
                          { id : 'Jet de sauvegarde', title: 'Jet de sauvegarde'}
                        ]

const filename = "spells.csv" 
const createCsvWriter = csvw.createObjectCsvWriter
const csvWriter = createCsvWriter({
    path: filename,
    header: spellProperties
});

async function retrieveHtml(url){
  const page = await fetch(url)
  const buffer = await page.arrayBuffer() 
  const isoHtml = new TextDecoder("iso-8859-1").decode(buffer)
  return cheerio.load(isoHtml)
}


/** 
 * Creating a list of spells based on the directory 
 */
async function getSpells(spellsUrl){
  const html = await retrieveHtml(spellsUrl)
  const spells = html("ul").map((currentLevel,spells) => {
                        return html(spells).find('a').map((index,spell) => {
                         return {
                            ['niveau']: currentLevel,
                            ['nom']: html(spell).text(),
                            ['lien']: "http://www.gemmaline.com/sorts/" + html(spell).attr('href')
                          }
                        }).get()
                      }).get()
  return spells 
}

/** 
 * Parsing the list of spells 
 */
async function getSpellsDetail(spells){
  let detailedSpells = []
  for (const spell of spells){
    await delay(3000) //avoid getting banned bro
    detailedSpells.push(getSpellDetail(spell))
  }
  return Promise.all(detailedSpells)
}

/** 
 * Getting the detail of one spell
 */
async function getSpellDetail(spell){
  console.log("retrieving spell detail for " + spell['lien'])
  const html = await retrieveHtml(spell['lien'])
  const ids = spellProperties.map((el) => { return el.id })
  html("strong").filter((i,el) => ids.includes(html(el).text()))
                       .map((i,el) =>  spell[html(el).text()] = cleanup(html(el)[0].next.data))
  return spell
}

/** 
 * Avoid getting banned
 */
function delay(ms){
  return new Promise((res) => setTimeout(res,ms))
}

/** 
 * Some spell string cleanup
 */
export function cleanup(stringData){
  return stringData.replace(':','').trim() 
}


let spellsUrl = process.argv.slice(2)[0]

getSpells(spellsUrl).then((spells) => {
  getSpellsDetail(spells).then( spellsDetail => {
   csvWriter.writeRecords(spellsDetail)       
    .then(() => {
          console.log('...Done');
      })
  })
})

