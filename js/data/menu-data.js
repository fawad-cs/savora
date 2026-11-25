// Demonstration menu. Dishes, prices and stories are fictional sample content.
// `model` points at a procedural 3D builder in js/three/food-model.js.

export const CATEGORIES = [
  { id: 'all', label: 'All Dishes' },
  { id: 'starters', label: 'Starters' },
  { id: 'mains', label: 'Main Course' },
  { id: 'burgers', label: 'Burgers' },
  { id: 'pizza', label: 'Pizza' },
  { id: 'desserts', label: 'Desserts' },
  { id: 'drinks', label: 'Drinks' },
];

export const DIET = { V: 'Vegetarian', VG: 'Vegan', GF: 'Gluten-free', DF: 'Dairy-free', N: 'Contains nuts', S: 'Spicy' };

export const DISHES = [
  /* ---------- Starters ---------- */
  {
    id: 'burrata-heirloom', category: 'starters', name: 'Burrata & Heirloom Tomato', price: 18,
    short: 'Apulian burrata, four heirloom tomatoes, basil oil, aged balsamic.',
    description: 'A cloud of Apulian burrata opened at the table over a ring of heirloom tomatoes in four colours, dressed with cold-pressed basil oil and a few drops of twelve-year balsamic.',
    ingredients: ['Apulian burrata', 'Heirloom tomatoes', 'Basil oil', 'Aged balsamic', 'Maldon salt', 'Sourdough crisp'],
    story: 'The tomatoes are picked the afternoon before service and never refrigerated, so they arrive at the plate tasting of the sun they grew in.',
    diet: ['V', 'GF'], model: { type: 'starter', params: { kind: 'burrata' } },
  },
  {
    id: 'beef-tartare', category: 'starters', name: 'Hand-Cut Beef Tartare', price: 22,
    short: 'Dry-aged sirloin, confit yolk, capers, smoked shallot, rye crisps.',
    description: 'Dry-aged sirloin cut by hand to order, bound with smoked shallot and Dijon, crowned with a slow-confit egg yolk and served with crisp rye.',
    ingredients: ['Dry-aged sirloin', 'Confit egg yolk', 'Smoked shallot', 'Capers', 'Dijon mustard', 'Rye crisps'],
    story: 'We never mince the beef. Each portion is cut with a single knife so the texture stays clean and the fat stays cold.',
    diet: ['DF'], model: { type: 'starter', params: { kind: 'tartare' } },
  },
  {
    id: 'truffle-arancini', category: 'starters', name: 'Black Truffle Arancini', price: 16,
    short: 'Crisp risotto spheres, molten fontina, black truffle aioli.',
    description: 'Golden spheres of saffron risotto with a molten fontina heart, finished with shaved Parmigiano and black truffle aioli.',
    ingredients: ['Carnaroli rice', 'Fontina', 'Black truffle', 'Saffron', 'Parmigiano Reggiano', 'Panko crumb'],
    story: 'Made from the previous night’s risotto base, rested for a day so every grain firms before frying.',
    diet: ['V'], model: { type: 'starter', params: { kind: 'arancini' } },
  },
  {
    id: 'charred-octopus', category: 'starters', name: 'Charred Galician Octopus', price: 24,
    short: 'Ember-charred octopus, smoked paprika aioli, herb shoots.',
    description: 'Galician octopus braised for three hours, then charred over oak embers and served with smoked paprika aioli and young herb shoots.',
    ingredients: ['Galician octopus', 'Smoked paprika', 'Garlic aioli', 'Lemon', 'Herb shoots', 'Olive oil'],
    story: 'Charred to order on the open hearth — the single most requested starter since the dining room opened.',
    diet: ['GF', 'DF'], model: { type: 'plated', params: { protein: 'octopus', puree: '#e9b77a', sauce: '#7a1f12' } },
  },

  /* ---------- Main course ---------- */
  {
    id: 'dry-aged-ribeye', category: 'mains', name: 'Forty-Day Dry-Aged Ribeye', price: 58, chef: true, signature: true,
    short: 'Oak-fired ribeye, smoked potato purée, bone-marrow jus.',
    description: 'A ribeye aged forty days in our salt chamber, seared over oak and sliced at the pass. Served with smoked potato purée and a glossy bone-marrow jus.',
    ingredients: ['Dry-aged ribeye', 'Smoked potato purée', 'Bone-marrow jus', 'Pickled shallot', 'Herb shoots', 'Flaked salt'],
    story: 'The chef’s first dish at Savora. The beef rests as long as it cooks, then meets the plate within seconds of slicing.',
    diet: ['GF'], model: { type: 'plated', params: { protein: 'steak' } },
  },
  {
    id: 'miso-black-cod', category: 'mains', name: 'Miso-Glazed Black Cod', price: 46, chef: true,
    short: 'Three-day miso marinade, celeriac purée, dashi beurre blanc.',
    description: 'Black cod marinated for three days in sweet white miso, roasted until lacquered, served on celeriac purée with a dashi beurre blanc.',
    ingredients: ['Black cod', 'Saikyo miso', 'Celeriac', 'Dashi', 'Cultured butter', 'Shiso'],
    story: 'A dish that travels from Kyoto to our hearth: patient marinade, quick fierce heat.',
    diet: ['GF'], model: { type: 'plated', params: { protein: 'fish', puree: '#efe4cf', sauce: '#6a3a12' } },
  },
  {
    id: 'porcini-risotto', category: 'mains', name: 'Wild Porcini Risotto', price: 34,
    short: 'Carnaroli rice, roasted porcini, aged Parmigiano, brown butter.',
    description: 'Carnaroli rice stirred for eighteen minutes with porcini stock, finished with roasted porcini, brown butter and thirty-six-month Parmigiano.',
    ingredients: ['Carnaroli rice', 'Porcini mushrooms', 'Parmigiano 36 months', 'Brown butter', 'Thyme', 'White wine'],
    story: 'Stirred by hand for every order. We will not hold risotto — it is ready when it is ready.',
    diet: ['V', 'GF'], model: { type: 'bowl', params: { fill: 'risotto' } },
  },
  {
    id: 'lobster-tagliolini', category: 'mains', name: 'Lobster Tagliolini', price: 52, chef: true,
    short: 'Hand-cut egg pasta, Atlantic lobster, bisque butter, chive.',
    description: 'Fine egg tagliolini rolled in-house, tossed in a lobster bisque butter with poached Atlantic lobster and chive.',
    ingredients: ['Egg tagliolini', 'Atlantic lobster', 'Lobster bisque', 'Cultured butter', 'Chive', 'Calabrian chilli'],
    story: 'The bisque is reduced from roasted shells for six hours, then mounted with cold butter seconds before plating.',
    diet: ['S'], model: { type: 'bowl', params: { fill: 'pasta' } },
  },

  /* ---------- Burgers ---------- */
  {
    id: 'signature-burger', category: 'burgers', name: 'The Savora Signature', price: 24, chef: true, signature: true,
    short: 'Dry-aged beef, aged cheddar, heirloom tomato, butter lettuce, sesame brioche.',
    description: 'Our signature: a dry-aged beef patty seared hard on cast iron, aged cheddar, heirloom tomato and butter lettuce in a glazed sesame brioche baked each morning.',
    ingredients: ['Sesame brioche', 'Butter lettuce', 'Heirloom tomato', 'Aged cheddar', 'Dry-aged beef patty', 'Toasted brioche base'],
    story: 'Six layers, each chosen for one job: crunch, freshness, acidity, richness, depth and structure. Nothing on it is decorative.',
    diet: [], model: { type: 'burger', params: {} },
  },
  {
    id: 'wagyu-double', category: 'burgers', name: 'Smoked Wagyu Double', price: 32,
    short: 'Two smoked wagyu patties, double cheddar, house pickles.',
    description: 'Two smash-seared wagyu patties cold-smoked over cherry wood, layered with double cheddar and our house bread-and-butter pickles.',
    ingredients: ['Wagyu beef', 'Cherry-wood smoke', 'Aged cheddar', 'House pickles', 'Sesame brioche', 'Smoked mayonnaise'],
    story: 'Built for the guests who asked for “more of the signature”. We listened.',
    diet: [], model: { type: 'burger', params: { patties: 2 } },
  },
  {
    id: 'truffle-mushroom-burger', category: 'burgers', name: 'Truffle Mushroom Burger', price: 26,
    short: 'Roasted king oyster, truffle cheddar, butter lettuce.',
    description: 'Beef patty topped with roasted king oyster mushroom, black-truffle cheddar and butter lettuce on sesame brioche.',
    ingredients: ['Beef patty', 'King oyster mushroom', 'Truffle cheddar', 'Butter lettuce', 'Sesame brioche', 'Garlic confit'],
    story: 'An autumn special that never left the menu.',
    diet: [], model: { type: 'burger', params: { topping: 'mushroom' } },
  },

  /* ---------- Pizza ---------- */
  {
    id: 'diavola', category: 'pizza', name: 'Diavola', price: 21,
    short: 'San Marzano, buffalo mozzarella, spicy salami, hot honey.',
    description: 'Seventy-two-hour dough fired at 480°C with San Marzano tomato, buffalo mozzarella, spicy salami and a thread of hot honey.',
    ingredients: ['72-hour dough', 'San Marzano tomato', 'Buffalo mozzarella', 'Spicy salami', 'Hot honey', 'Basil'],
    story: 'Ninety seconds in the wood oven. The leopard spotting on the crust is the signature of the fire.',
    diet: ['S'], model: { type: 'pizza', params: { style: 'diavola' } },
  },
  {
    id: 'truffle-bianca', category: 'pizza', name: 'Black Truffle Bianca', price: 27, chef: true,
    short: 'Fior di latte cream, wild mushrooms, shaved black truffle.',
    description: 'A white pizza of fior di latte cream, roasted wild mushrooms and black truffle shaved at the table.',
    ingredients: ['72-hour dough', 'Fior di latte', 'Wild mushrooms', 'Black truffle', 'Thyme', 'Olive oil'],
    story: 'Truffle is shaved in front of you — the aroma is part of the dish.',
    diet: ['V'], model: { type: 'pizza', params: { style: 'bianca' } },
  },
  {
    id: 'burrata-margherita', category: 'pizza', name: 'Burrata Margherita', price: 22,
    short: 'San Marzano, whole burrata, basil, olive oil.',
    description: 'The classic, reconsidered: San Marzano tomato, torn burrata added after the bake, basil and a generous pour of olive oil.',
    ingredients: ['72-hour dough', 'San Marzano tomato', 'Burrata', 'Basil', 'Extra-virgin olive oil', 'Sea salt'],
    story: 'Burrata goes on after the oven so it stays cool and creamy against the blistered crust.',
    diet: ['V'], model: { type: 'pizza', params: { style: 'margherita' } },
  },

  /* ---------- Desserts ---------- */
  {
    id: 'chocolate-entremet', category: 'desserts', name: 'Dark Chocolate Entremet', price: 16, chef: true, signature: true,
    short: '70% chocolate mousse, salted caramel, hazelnut sablé, mirror glaze.',
    description: 'Layers of hazelnut sablé, salted caramel crémeux and 70% chocolate mousse under a mirror glaze, finished with raspberries and gold leaf.',
    ingredients: ['70% dark chocolate', 'Salted caramel', 'Hazelnut sablé', 'Mirror glaze', 'Raspberries', 'Gold leaf'],
    story: 'Five components, two days of work, one clean slice.',
    diet: ['V', 'N'], model: { type: 'entremet', params: {} },
  },
  {
    id: 'basque-cheesecake', category: 'desserts', name: 'Burnt Basque Cheesecake', price: 14,
    short: 'Caramelised top, vanilla cream cheese, port-poached cherries.',
    description: 'Baked hot and fast until the top caramelises deeply while the centre stays soft. Served with port-poached cherries.',
    ingredients: ['Cream cheese', 'Vanilla', 'Free-range eggs', 'Port', 'Cherries', 'Spiced biscuit'],
    story: 'The burnt top is intentional — bitter caramel against a just-set custard.',
    diet: ['V'], model: { type: 'entremet', params: { style: 'cheesecake', glaze: '#3a1a08', mousse: '#e9c98e', cream: '#f4e6c8', sponge: '#8a5a30' } },
  },
  {
    id: 'yuzu-tart', category: 'desserts', name: 'Yuzu Meringue Tart', price: 15,
    short: 'Almond pastry, yuzu-lemon curd, torched meringue.',
    description: 'Almond pâte sucrée filled with a bright yuzu and lemon curd, finished with torched Italian meringue kisses.',
    ingredients: ['Almond pâte sucrée', 'Yuzu', 'Lemon', 'Italian meringue', 'Lemon verbena', 'Butter'],
    story: 'Our pastry team pipes every meringue kiss by hand before the evening service.',
    diet: ['V', 'N'], model: { type: 'tart', params: {} },
  },

  /* ---------- Drinks ---------- */
  {
    id: 'smoked-old-fashioned', category: 'drinks', name: 'Smoked Old Fashioned', price: 17,
    short: 'Bourbon, demerara, aromatic bitters, oak smoke, orange.',
    description: 'Bourbon stirred with demerara and aromatic bitters over a single clear ice block, smoked with oak at the table.',
    ingredients: ['Bourbon', 'Demerara syrup', 'Aromatic bitters', 'Orange peel', 'Oak smoke', 'Clear ice'],
    story: 'Smoked under a cloche at the table, then lifted so the aroma reaches you first.',
    diet: ['VG', 'GF'], model: { type: 'drink', params: { kind: 'rocks', liquid: '#8a4512' } },
  },
  {
    id: 'saffron-spritz', category: 'drinks', name: 'Saffron Spritz', price: 14,
    short: 'Saffron aperitivo, blood orange, prosecco.',
    description: 'A house saffron aperitivo with blood orange and prosecco — bright, bitter-sweet and made for the start of an evening.',
    ingredients: ['Saffron aperitivo', 'Blood orange', 'Prosecco', 'Soda', 'Orange wheel'],
    story: 'The aperitivo is steeped in-house from Spanish saffron for ten days.',
    diet: ['VG', 'GF'], model: { type: 'drink', params: { kind: 'wine', liquid: '#e2601a' } },
  },
  {
    id: 'espresso', category: 'drinks', name: 'Single-Origin Espresso', price: 5,
    short: 'Ethiopian Guji, served with dark chocolate.',
    description: 'A washed Ethiopian Guji pulled as a ristretto, with notes of bergamot and cacao, served with a square of dark chocolate.',
    ingredients: ['Ethiopian Guji coffee', 'Dark chocolate', 'Filtered water'],
    story: 'Roasted in small batches for us each week.',
    diet: ['VG', 'GF'], model: { type: 'drink', params: { kind: 'espresso' } },
  },
];

export const byId = id => DISHES.find(d => d.id === id);
export const money = n => `$${n.toFixed(0)}`;
export const categoryLabel = id => CATEGORIES.find(c => c.id === id)?.label || id;
/** Lookup used by [data-render] slots: dish id → model spec. */
export const renderSpec = key => {
  const [id, extra] = key.split('|');
  const d = byId(id);
  if (!d) return null;
  return extra ? { ...d.model, params: { ...d.model.params, ...JSON.parse(extra) } } : d.model;
};
export const escapeHTML = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
