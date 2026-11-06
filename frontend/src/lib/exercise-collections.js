// Search-only labels for curated exercise collections. The catalogue ids stay canonical, so
// history for (for example) bench press remains one exercise; these terms merely let someone
// find every movement used by a named coach/template from the Library or exercise picker.
const COLLECTIONS = {
  tanchengyi: {
    ids: new Set([
      '0025', '0314', '0251', '0061', '5818',
      '1204', '7583', '1235', '0218', '1636',
      '1757', '2290', '0042', '0085', '0489',
      '3329', '0472', '0175',
    ]),
    terms: ['谭', '谭成义', '谭成义动作', '谭成义训练', 'Tan Chengyi', 'tanchengyi'],
  },
};

export const exerciseCollectionTerms = id => Object.values(COLLECTIONS)
  .filter(collection => collection.ids.has(String(id)))
  .flatMap(collection => collection.terms);
