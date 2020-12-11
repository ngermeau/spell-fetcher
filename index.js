import fetch from 'node-fetch';
import cheerio from 'cheerio';


async function getListOfSpells(){
  const page = await fetch('http://localhost:8080/sorts.htm')
  return page.text()
}

async function getSpellDetail(spellLink){
  const page = await fetch('http://localhost:8080/' + spellLink)
  const text = await page.text() 
  const html = cheerio.load(text)
  
  html("strong").each((i,detail) => {
    console.log(detail)
  })
}

getListOfSpells().then(text => {
  const html  = cheerio.load(text) 

  html("ul").each((i,spells) => {
    const spellLevel = i
    html(spells).find('a').each((i,spell) => {
      const spellName = html(spell).text()
      const spellLink = html(spell).attr('href')
      console.log('parsing: ' + spellName)
      const spellDetail = getSpellDetail(spellLink)
    })
  })
})

