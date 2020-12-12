import fetch from 'node-fetch';
import cheerio from 'cheerio';

const spellProperties = ['Cible','Composantes', 'Temps d\'incantation','Portée', 'Durée', 'Jet de sauvegarde']

async function getListOfSpells(){
  const page = await fetch('http://localhost:8080/sorts.htm')
  return page.text()
}

async function getSpellDetail(spellDetail){
  const url = 'http://www.gemmaline.com/sorts/' + spellDetail['link']
  const page = await fetch(url)
  const text = await page.text() 
  const html = cheerio.load(text)

    html("strong").each((i,detail) => {
      const strongElementValue= html(detail).text()
      if (spellProperties.includes(strongElementValue)) {
        spellDetail[strongElementValue] = html(detail)[0].next.data
      }
  })

  //spellDetail['description'] = html('p').text()

  return spellDetail
}

getListOfSpells().then(text => {
  const html  = cheerio.load(text) 
  const spellDetails = [] 

  html("ul").each((i,spells) => {
    const spellLevel = i
    html(spells).find('a').each((i,spell) => {
      const spellDetail = {}
      spellDetail['level'] = spellLevel
      spellDetail['name'] = html(spell).text() 
      spellDetail['link'] = html(spell).attr('href')
      spellDetails.push(getSpellDetail(spellDetail))
    })
  })
  
  Promise.all(spellDetails).then((values) => {
    console.log(values);
  })

})



