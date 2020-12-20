'use strict'
import fetch from 'node-fetch';
import cheerio from 'cheerio';
import child from 'child_process';
import csvw from 'csv-writer';

const remoteServ = 'http://localhost:8080/'
const filename = 'spells.csv'

const spellProperties = [ { id: 'niveau', title: 'niveau' },
                          { id: 'nom', title: 'nom' }, 
                          { id: 'lien', title: 'lien' },
                          { id: 'Cible', title: 'Cible' },
                          { id : 'Temps d\'incantation', title: 'Temps d\'incantation'},
                          { id : 'Portée', title: 'Portée'},
                          { id : 'Zone d\'effet', title: 'Zone d\'effet'},
                          { id : 'Durée', title: 'Durée'},
                          { id : 'Jet de sauvegarde', title: 'Jet de sauvegarde'}
                        ]


// To download the assets avoiding getting ban from usage 
async function downloadAssets(){
  const listOfSpell = await getListOfSpells()
  for (const spell of listOfSpell){
    await delay(3000)
    child.exec('wget http://www.gemmaline.com/sorts/' + spell['lien'] + ' -P assets') 
  }
}

function delay(ms){
  return new Promise((res) => setTimeout(res,ms))
}

function cleanup(stringData){
  return stringData.replace(':','').trim() 
}

async function getSpellDetail(spell){
  const url = remoteServ + spell['lien'] 
  const page = await fetch(url)
  const text = await page.text() 
  const html = cheerio.load(text)
  const ids = spellProperties.map((el) => { return el.id })
  html("strong").filter((i,el) => ids.includes(html(el).text()))
                       .map((i,el) =>  spell[html(el).text()] = cleanup(html(el)[0].next.data))
  return spell
}

async function getListOfSpells(){
  const url = remoteServ + 'liste-classe-base-druide.htm'
  const page = await fetch(url)
  const text = await page.text()
  const html  = cheerio.load(text) 
 
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

async function process(){
  const listOfSpells = await getListOfSpells()
  const listOfDetailedSpells =  listOfSpells.map(spell => getSpellDetail(spell));
  return await Promise.all(listOfDetailedSpells)
}


const createCsvWriter = csvw.createObjectCsvWriter
const csvWriter = createCsvWriter({
    path: filename,
    header: spellProperties
});

process().then((spells) => {
 csvWriter.writeRecords(spells)       
   .then(() => {
        console.log('...Done');
    })
})

