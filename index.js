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

//const remoteServ = 'http://gemmaline.com/sorts/'
const remoteServ = 'http://localhost:8080/'
const download = false 
const spellsListUrl = "liste-classe-pretre.htm"
const filename = "pretre.csv" 
const createCsvWriter = csvw.createObjectCsvWriter
const csvWriter = createCsvWriter({
    path: filename,
    header: spellProperties
});

/** 
 * To download the assets, usefull for testing without getting banned 
 * @param {string} listOfSpellsUrl  url containing the list of spells
 */
async function downloadAssets(listOfSpellsUrl){
  child.exec('wget http://www.gemmaline.com/sorts/' + listOfSpellsUrl + ' -P assets') 
  const listOfSpell = await getListOfSpells(listOfSpellsUrl)
  for (const spell of listOfSpell){
    await delay(3000)
    child.exec('wget http://www.gemmaline.com/sorts/' + spell['lien'] + ' -P assets') 
  }
}

/** 
 * To delay each call avoiding getting banned 
 * @param   {number}  ms  number of delay in millisecond
 * @return  {Promise}     a promise resolved when the time is passed 
 */
function delay(ms){
  return new Promise((res) => setTimeout(res,ms))
}

/** 
 * To cleanup string retrieved for each spell 
 * @param   {string}  stringData  the string needed to be cleanup
 * @return  {string}              cleaned up string
 */
export function cleanup(stringData){
  return stringData.replace(':','').trim() 
}

/** 
 * To retrieve an HTML page in the correct encoding 
 * @param   {url}     url     url which needs to be retrieved 
 * @return  {object}          cheerio object containing the url content 
 */
async function retrieveHtml(url){
  const page = await fetch(remoteServ + url)
  const buffer = await page.arrayBuffer() 
  const isoHtml = new TextDecoder("iso-8859-1").decode(buffer)
  return cheerio.load(isoHtml)

}

/** 
 * To retrieve the detail of a spell 
 * @param   {object} spell  contains name/url/level of the spell 
 * @return  {object}        contains additionnal information
 */
async function getSpellDetail(spell){
  const html = await retrieveHtml(spell['lien'])
  const ids = spellProperties.map((el) => { return el.id })
  html("strong").filter((i,el) => ids.includes(html(el).text()))
                       .map((i,el) =>  spell[html(el).text()] = cleanup(html(el)[0].next.data))
  return spell
}

/** 
 * To retrieve the list of spells 
 * @param   {string}  listOfSpellsUrl   url containing the list of spells  
 * @return  {array}                     the list of spells
 */
async function getListOfSpells(listOfSpellsUrl){
  const html = await retrieveHtml(spellsListUrl)
  const listOfSpells = html("ul").map((currentLevel,spells) => {
                        return html(spells).find('a').map((index,spell) => {
                         return {
                            ['niveau']: currentLevel,
                            ['nom']: html(spell).text(),
                            ['lien']: html(spell).attr('href')
                          }
                        }).get()
                      }).get()
  return listOfSpells
}

/** 
 * Entry point
 * @param   {string}  listOfSpellsUrl   url containing the list of spells  
 * @return  {array}                     of promise containing spell detail objects 
 */
async function process(listOfSpellsUrl){
  const listOfSpells = await getListOfSpells(listOfSpellsUrl)
  const listOfDetailedSpells = listOfSpells.map(spell => getSpellDetail(spell));
  return await Promise.all(listOfDetailedSpells)
}


if (download == true) {
  downloadAssets(spellsListUrl)
} else {
  process(spellsListUrl).then((spells) => {
   csvWriter.writeRecords(spells)       
     .then(() => {
          console.log('...Done');
      })
  })
}

