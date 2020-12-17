import fetch from 'node-fetch';
import cheerio from 'cheerio';
import child from 'child_process';

const spellProperties = ['Cible',
                         'Composantes', 
                         'Temps d\'incantation',
                         'Portée', 
                         'Durée', 
                         'Jet de sauvegarde']

function delay(ms){
  return new Promise((res) => setTimeout(res,ms))
}

function storeAssets(spell){
  const ls = child.exec('wget http://www.gemmaline.com/sorts/' + spell['lien'] + ' -P assets') 
}

async function getSpellDetail(spellDetail){
  console.log('retrieving detail for spell: ' + spellDetail['lien'])
  const url = 'http://localhost:8080/' + spellDetail['lien']
  const page = await fetch(url)
  const text = await page.text() 
  const html = cheerio.load(text)

    html("strong").each((i,detail) => {
      const strongElementValue= html(detail).text()
      if (spellProperties.includes(strongElementValue)) {
        spellDetail[strongElementValue] = html(detail)[0].next.data
      }
  })
  return spellDetail
}


async function getListOfSpells(){
  console.log('retrieving list of spells')
  const url = 'http://localhost:8080/liste-classe-base-druide.htm'
  const page = await fetch(url)
  const text = await page.text()
  const html  = cheerio.load(text) 
  const spellList = [] 

  html("ul").each((currentLevel,spells) => {
    const spellLevel = currentLevel 
    html(spells).find('a').each((index,spell) => {
      const spellDetail = {}
      spellDetail['niveau'] = spellLevel
      spellDetail['nom'] = html(spell).text() 
      spellDetail['lien'] = html(spell).attr('href')
      spellList.push(spellDetail)
    })
  })

  return spellList
}

async function process(){
  const detailedSpellsList = []
  const listOfSpells = await getListOfSpells()
  listOfSpells.forEach((spell) => {
    detailedSpellsList.push(getSpellDetail(spell))
  });
  console.log(detailedSpellsList.length)
  return detailedSpellsList;
}

async function downloadAssets(){
  const listOfSpell = await getListOfSpells()
  for (const spell of listOfSpell){
    await delay(3000)
    storeAssets(spell)
  }
}

process().then((detailedSpellList) => {
  console.log(detailedSpellList)
})
//Promise.all(processListofSpells()).then((detailedSpellList) => {
 // console.log(detailedSpellList)
//})
