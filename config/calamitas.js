export const calamitasConfig = Object.freeze({
  id: 'supreme-calamitas', name: 'SUPREME CALAMITAS',
  hp: 750000, radius: 30, spawnX: 500, spawnY: 150,
  heartHP: 7200, brotherHP: 65000, seekerHP: 4900,
  thresholds: Object.freeze({hell2: .75, hell3: .50, phase2: .40, maelstrom: .30, seekers: .20, hell5: .10}),
  opening: Object.freeze({stage: 'hell', marker: 'opening', label: 'BULLET HELL I'}),
  attackSequence: Object.freeze(['darts','hellblast','giga2','dash4','giga2','hellblast','darts','dash2','darts','hellblast','giga4','hellblast','dash2','darts','giga4','dash4','darts','dash2','darts','dash2'])
});
