import { ChangeEvent, useState } from 'react'
import './App.css'

interface Log {
  hitpointsHealed: number
  damageTaken: {
    total: number
    byCreatureKind: Record<string, number>
  }
  experienceGained: number
  loot: Record<string, number>
}



function App() {

  const [log, setLog] = useState<Log>()

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.onload = event => {
        if(event.target?.result && typeof event.target.result === 'string') {
          const events = event.target.result.split('.').map(x => x.replace(/\d{2}:\d{2}/g, '').trim())
          const healed = events.filter(x => x.includes('You healed yourself for')).map(y => Number(y.match(/\d+/g))).reduce((sum, num) => sum + num)

          const damageTakenEvents = events.filter(x => x.includes('You lose'))
          const totalDamageTaken = damageTakenEvents.map(x => Number(x.match(/\d+/g))).reduce((sum, num) => sum + num)

          const byCreatureKindEvents = damageTakenEvents.filter(x => x.includes('due to an attack by')).map(x => x.replace('You lose', '').replace('hitpoints due to an attack by a', '').replace('hitpoint due to an attack by a', ''))
          const byCreatureKindArray = byCreatureKindEvents.map(y => { return {kind: y.replace(/\d+/g, '').trim(), value: Number(y.match(/\d+/g))} })
          const creatureKinds = [... new Set(byCreatureKindEvents.map(x => x.replace(/\d+/g, '').trim()))]
          let byCreatureKind: Record<string, number> = {}
          creatureKinds.forEach((kind) => {
            byCreatureKind = {...byCreatureKind, [kind]: byCreatureKindArray.filter(y => y.kind === kind).map(x => x.value).reduce((sum, num) => sum + num)}
          })

          const experienceGained = events.filter(x => x.match(/You.+gained.\d+.+experience.+points/g)).map(y => Number(y.match(/\d+/g))).reduce((sum, num) => sum + num)
          

          const lootEvents = events.filter(x => x.match(/Loot.+of.+a.+:.+/g)).filter(y => !y.includes('nothing')).flatMap(z => z.replace(/Loot.+of.+a.+:/g, '').split(',')).map(q => q.replace(/\sa\s/g, ''))
          const items =  [... new Set(lootEvents.map(x => x.replace(/\d+/g, '').trim()))]
          const lootArray = lootEvents.map(x => { return {item: x.replace(/\d+/g, '').trim(), value: new RegExp(/\d+/g).test(x) ? Number(x.match(/\d+/g)) : 1 }})

          let loot: Record<string, number> = {}
          items.forEach((item) => {
            loot = { ...loot,  [item]: lootArray.filter(x => x.item === item).map(x => x.value).reduce((sum, num) => sum + num)}
          })

          
          setLog({
            hitpointsHealed: healed, 
            damageTaken: {
              total: totalDamageTaken,
              byCreatureKind: byCreatureKind
            },
            experienceGained,
            loot
          })
        }
      }
      reader.readAsText(file) 
    }
  };
  
  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      {log && <pre>{JSON.stringify(JSON.parse(JSON.stringify(log)), undefined, 2)}</pre>}
    </div>
  )
}

export default App
