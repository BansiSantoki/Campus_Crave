const DEFAULT_STALLS = [
  {
    id: 101,
    stallName: "South Indian Stall",
    owner: "Ravi Kumar",
    contact: "9876543210",
    cuisine: "South Indian",
    status: "Active",
    rating: 4.6,
    ordersCount: 2340,
    hours: "8:00 AM - 6:00 PM",
    specialties: ["Dosa", "Idli", "Vada", "Uttapam"],
    description: "Fresh breakfast classics and quick South Indian meals."
  },
  {
    id: 102,
    stallName: "North Indian Stall",
    owner: "Priya Sharma",
    contact: "9876543211",
    cuisine: "North Indian",
    status: "Active",
    rating: 4.4,
    ordersCount: 1890,
    hours: "9:00 AM - 7:00 PM",
    specialties: ["Paratha", "Rajma Rice", "Chole Bhature"],
    description: "Homestyle North Indian meals for lunch and dinner."
  },
  {
    id: 103,
    stallName: "Fast Food Corner",
    owner: "Amit Patel",
    contact: "9876543212",
    cuisine: "Fast Food",
    status: "Active",
    rating: 4.2,
    ordersCount: 2760,
    hours: "10:00 AM - 8:30 PM",
    specialties: ["Burger", "Sandwich", "Fries"],
    description: "Quick bites, burgers, and combo meals for busy hours."
  },
  {
    id: 104,
    stallName: "Juice Corner",
    owner: "Neha Verma",
    contact: "9876543213",
    cuisine: "Beverages",
    status: "Active",
    rating: 4.7,
    ordersCount: 1425,
    hours: "10:00 AM - 7:00 PM",
    specialties: ["Cold Coffee", "Fresh Juice", "Smoothies"],
    description: "Fresh juices and energy boosters throughout the day."
  },
  {
    id: 105,
    stallName: "Wok & Roll",
    owner: "Karan Mehta",
    contact: "9876543214",
    cuisine: "Chinese",
    status: "Active",
    rating: 4.5,
    ordersCount: 1680,
    hours: "11:00 AM - 8:00 PM",
    specialties: ["Noodles", "Fried Rice", "Manchurian"],
    description: "Street style Indo-Chinese bowls and snack combos."
  },
  {
    id: 106,
    stallName: "Sweet Spot",
    owner: "Pooja Nair",
    contact: "9876543215",
    cuisine: "Desserts",
    status: "Active",
    rating: 4.8,
    ordersCount: 1210,
    hours: "12:00 PM - 9:00 PM",
    specialties: ["Brownie", "Kulfi", "Ice Cream"],
    description: "Desserts, shakes, and sweet cravings solved all day."
  },
  {
    id: 107,
    stallName: "Green Bowl Hub",
    owner: "Ishita Rao",
    contact: "9876543216",
    cuisine: "Healthy Bowls",
    status: "Active",
    rating: 4.7,
    ordersCount: 980,
    hours: "8:30 AM - 7:00 PM",
    specialties: ["Quinoa Bowl", "Protein Salad", "Sprout Chaat"],
    description: "Fresh salads, grain bowls, and high-protein campus meals."
  },
  {
    id: 108,
    stallName: "Bake Street",
    owner: "Rahul Soni",
    contact: "9876543217",
    cuisine: "Bakery",
    status: "Active",
    rating: 4.5,
    ordersCount: 1325,
    hours: "9:00 AM - 8:00 PM",
    specialties: ["Garlic Bread", "Muffins", "Puffs"],
    description: "Freshly baked snacks, patties, and evening-time favorites."
  },
  {
    id: 109,
    stallName: "Street Spice Cart",
    owner: "Sana Ali",
    contact: "9876543218",
    cuisine: "Street Food",
    status: "Active",
    rating: 4.6,
    ordersCount: 2100,
    hours: "11:00 AM - 9:00 PM",
    specialties: ["Pani Puri", "Pav Bhaji", "Dahi Puri"],
    description: "Popular Indian street snacks with bold flavors and quick service."
  },
  {
    id: 110,
    stallName: "Combo Central",
    owner: "Vikram Desai",
    contact: "9876543219",
    cuisine: "Combos",
    status: "Active",
    rating: 4.3,
    ordersCount: 1540,
    hours: "10:30 AM - 8:30 PM",
    specialties: ["Meal Box", "Wrap Combo", "Snack Combo"],
    description: "Budget-friendly combo boxes designed for campus lunch rush."
  }
];

const DEFAULT_MENU_ITEMS = [
  { id: 1001, stallId: 101, name: "Masala Dosa", category: "South Indian", price: 50, description: "Crispy dosa with potato masala", status: "Available" },
  { id: 1002, stallId: 101, name: "Idli Sambar", category: "South Indian", price: 40, description: "Steamed idli with sambar", status: "Available" },
  { id: 1003, stallId: 101, name: "Medu Vada", category: "South Indian", price: 35, description: "Golden fried vada", status: "Available" },
  { id: 1004, stallId: 101, name: "Onion Uttapam", category: "South Indian", price: 60, description: "Soft uttapam with onions", status: "Available" },
  { id: 1005, stallId: 101, name: "Podi Dosa", category: "South Indian", price: 65, description: "Spiced podi roasted dosa", status: "Available" },
  { id: 1006, stallId: 101, name: "Curd Rice", category: "South Indian", price: 55, description: "Cooling curd rice with tempering", status: "Available" },
  { id: 1007, stallId: 101, name: "Mini Tiffin", category: "South Indian", price: 90, description: "Idli, vada and mini dosa combo", status: "Available" },
  { id: 1008, stallId: 101, name: "Lemon Rice", category: "South Indian", price: 60, description: "Tangy lemon rice with peanuts", status: "Available" },

  { id: 1101, stallId: 102, name: "Aloo Paratha", category: "North Indian", price: 55, description: "Stuffed paratha with curd", status: "Available" },
  { id: 1102, stallId: 102, name: "Chole Bhature", category: "North Indian", price: 80, description: "Bhature with spicy chole", status: "Available" },
  { id: 1103, stallId: 102, name: "Rajma Rice", category: "North Indian", price: 75, description: "Rajma with steamed rice", status: "Available" },
  { id: 1104, stallId: 102, name: "Paneer Roll", category: "North Indian", price: 90, description: "Paneer tikka wrap", status: "Available" },
  { id: 1105, stallId: 102, name: "Dal Makhani Combo", category: "North Indian", price: 95, description: "Dal makhani with jeera rice", status: "Available" },
  { id: 1106, stallId: 102, name: "Kadai Paneer", category: "North Indian", price: 120, description: "Kadai paneer with 2 rotis", status: "Available" },
  { id: 1107, stallId: 102, name: "Veg Biryani", category: "North Indian", price: 100, description: "Fragrant veg biryani bowl", status: "Available" },
  { id: 1108, stallId: 102, name: "Butter Naan Pair", category: "North Indian", price: 45, description: "Fresh butter naan (2 pcs)", status: "Available" },

  { id: 1151, stallId: 105, name: "Hakka Noodles", category: "Chinese", price: 95, description: "Wok tossed noodles", status: "Available" },
  { id: 1152, stallId: 105, name: "Schezwan Noodles", category: "Chinese", price: 105, description: "Spicy schezwan noodle bowl", status: "Available" },
  { id: 1153, stallId: 105, name: "Veg Fried Rice", category: "Chinese", price: 90, description: "Classic veg fried rice", status: "Available" },
  { id: 1154, stallId: 105, name: "Paneer Chilli", category: "Chinese", price: 120, description: "Dry paneer chilli", status: "Available" },
  { id: 1155, stallId: 105, name: "Veg Manchurian", category: "Chinese", price: 110, description: "Manchurian balls in gravy", status: "Available" },
  { id: 1156, stallId: 105, name: "Spring Roll", category: "Chinese", price: 85, description: "Crispy vegetable spring rolls", status: "Available" },
  { id: 1157, stallId: 105, name: "Triple Schezwan Rice", category: "Chinese", price: 140, description: "Rice, noodles and gravy mix", status: "Available" },
  { id: 1158, stallId: 105, name: "Honey Chilli Potato", category: "Chinese", price: 100, description: "Sweet spicy crispy potato", status: "Available" },

  { id: 1201, stallId: 103, name: "Classic Veg Burger", category: "Fast Food", price: 60, description: "Crispy veg patty burger", status: "Available" },
  { id: 1202, stallId: 103, name: "Cheese Burger", category: "Fast Food", price: 80, description: "Loaded cheese burger", status: "Available" },
  { id: 1203, stallId: 103, name: "Double Patty Burger", category: "Fast Food", price: 110, description: "Two patty burger", status: "Available" },
  { id: 1204, stallId: 103, name: "Crispy Chicken Burger", category: "Fast Food", price: 120, description: "Crispy chicken fillet", status: "Available" },
  { id: 1205, stallId: 103, name: "Peri Peri Fries", category: "Fast Food", price: 70, description: "Spiced crispy fries", status: "Available" },
  { id: 1206, stallId: 103, name: "Cheesy Fries", category: "Fast Food", price: 90, description: "Fries with cheese sauce", status: "Available" },
  { id: 1207, stallId: 103, name: "Veg Loaded Sandwich", category: "Fast Food", price: 85, description: "Grilled loaded sandwich", status: "Available" },
  { id: 1208, stallId: 103, name: "Paneer Tikka Sandwich", category: "Fast Food", price: 95, description: "Paneer tikka sandwich", status: "Available" },
  { id: 1209, stallId: 103, name: "Veg Momos", category: "Fast Food", price: 75, description: "Steamed momos with chutney", status: "Available" },
  { id: 1210, stallId: 103, name: "Fried Momos", category: "Fast Food", price: 85, description: "Crispy fried momos", status: "Available" },
  { id: 1211, stallId: 103, name: "Noodles Bowl", category: "Fast Food", price: 95, description: "Street style noodles", status: "Available" },
  { id: 1212, stallId: 103, name: "Manchurian Rice", category: "Fast Food", price: 110, description: "Rice with manchurian gravy", status: "Available" },
  { id: 1213, stallId: 103, name: "Margherita Pizza Slice", category: "Fast Food", price: 85, description: "Cheese pizza slice", status: "Available" },
  { id: 1214, stallId: 103, name: "Farmhouse Pizza Slice", category: "Fast Food", price: 100, description: "Veg-loaded pizza slice", status: "Available" },
  { id: 1215, stallId: 103, name: "Hot Dog", category: "Fast Food", price: 90, description: "Toasted hot dog", status: "Available" },
  { id: 1216, stallId: 103, name: "Paneer Wrap", category: "Fast Food", price: 95, description: "Spicy paneer wrap", status: "Available" },
  { id: 1217, stallId: 103, name: "Chicken Wrap", category: "Fast Food", price: 120, description: "Grilled chicken wrap", status: "Available" },
  { id: 1218, stallId: 103, name: "Taco Pair", category: "Fast Food", price: 130, description: "Two crunchy tacos", status: "Available" },
  { id: 1219, stallId: 103, name: "Nacho Platter", category: "Fast Food", price: 140, description: "Nachos with dips", status: "Available" },
  { id: 1220, stallId: 103, name: "Popcorn Chicken", category: "Fast Food", price: 130, description: "Crunchy popcorn chicken", status: "Available" },

  { id: 1301, stallId: 104, name: "Cold Coffee", category: "Beverages", price: 50, description: "Classic cold coffee", status: "Available" },
  { id: 1302, stallId: 104, name: "Mango Smoothie", category: "Beverages", price: 70, description: "Fresh mango blend", status: "Available" },
  { id: 1303, stallId: 104, name: "Orange Juice", category: "Beverages", price: 45, description: "Fresh orange juice", status: "Available" },
  { id: 1304, stallId: 104, name: "Chocolate Shake", category: "Beverages", price: 80, description: "Rich chocolate shake", status: "Available" },
  { id: 1305, stallId: 104, name: "Lemon Mint Cooler", category: "Beverages", price: 55, description: "Refreshing mint cooler", status: "Available" },
  { id: 1306, stallId: 104, name: "Watermelon Juice", category: "Beverages", price: 60, description: "Fresh watermelon extract", status: "Available" },
  { id: 1307, stallId: 104, name: "Banana Shake", category: "Beverages", price: 65, description: "Creamy banana shake", status: "Available" },
  { id: 1308, stallId: 104, name: "Buttermilk", category: "Beverages", price: 35, description: "Spiced chilled buttermilk", status: "Available" },

  { id: 1401, stallId: 106, name: "Gulab Jamun", category: "Desserts", price: 45, description: "Warm gulab jamun (2 pcs)", status: "Available" },
  { id: 1402, stallId: 106, name: "Brownie Sundae", category: "Desserts", price: 110, description: "Brownie with ice cream", status: "Available" },
  { id: 1403, stallId: 106, name: "Vanilla Ice Cream", category: "Desserts", price: 60, description: "Classic vanilla scoop", status: "Available" },
  { id: 1404, stallId: 106, name: "Kulfi Stick", category: "Desserts", price: 50, description: "Malai kulfi", status: "Available" },
  { id: 1405, stallId: 106, name: "Chocolate Pastry", category: "Desserts", price: 70, description: "Moist chocolate pastry", status: "Available" },
  { id: 1406, stallId: 106, name: "Fruit Custard", category: "Desserts", price: 65, description: "Seasonal fruit custard cup", status: "Available" },
  { id: 1407, stallId: 106, name: "Falooda", category: "Desserts", price: 95, description: "Rose falooda with ice cream", status: "Available" },
  { id: 1408, stallId: 106, name: "Rasmalai", category: "Desserts", price: 85, description: "Soft rasmalai pieces", status: "Available" },

  { id: 1501, stallId: 107, name: "Quinoa Power Bowl", category: "Healthy Bowls", price: 140, description: "Quinoa, veggies, and herbed paneer", status: "Available" },
  { id: 1502, stallId: 107, name: "Mexican Bean Bowl", category: "Healthy Bowls", price: 135, description: "Bean rice bowl with salsa", status: "Available" },
  { id: 1503, stallId: 107, name: "Greek Salad", category: "Healthy Bowls", price: 120, description: "Cucumber, olives, feta-style salad", status: "Available" },
  { id: 1504, stallId: 107, name: "Sprout Chaat", category: "Healthy Bowls", price: 90, description: "Protein-rich sprouts chaat", status: "Available" },
  { id: 1505, stallId: 107, name: "Fruit Yogurt Cup", category: "Healthy Bowls", price: 85, description: "Seasonal fruits with yogurt", status: "Available" },
  { id: 1506, stallId: 107, name: "Millet Khichdi Bowl", category: "Healthy Bowls", price: 110, description: "Wholesome millet and lentil bowl", status: "Available" },

  { id: 1601, stallId: 108, name: "Veg Puff", category: "Bakery", price: 40, description: "Flaky puff with veg filling", status: "Available" },
  { id: 1602, stallId: 108, name: "Paneer Puff", category: "Bakery", price: 55, description: "Buttery puff with paneer mix", status: "Available" },
  { id: 1603, stallId: 108, name: "Garlic Bread Sticks", category: "Bakery", price: 65, description: "Herbed garlic bread sticks", status: "Available" },
  { id: 1604, stallId: 108, name: "Choco Chip Muffin", category: "Bakery", price: 60, description: "Soft muffin with chocolate chips", status: "Available" },
  { id: 1605, stallId: 108, name: "Red Velvet Pastry", category: "Bakery", price: 95, description: "Creamy red velvet slice", status: "Available" },
  { id: 1606, stallId: 108, name: "Croissant Sandwich", category: "Bakery", price: 120, description: "Toasted croissant veggie sandwich", status: "Available" },

  { id: 1701, stallId: 109, name: "Pani Puri", category: "Street Food", price: 50, description: "Crunchy puris with flavored water", status: "Available" },
  { id: 1702, stallId: 109, name: "Sev Puri", category: "Street Food", price: 55, description: "Crispy puri with sev and chutneys", status: "Available" },
  { id: 1703, stallId: 109, name: "Dahi Puri", category: "Street Food", price: 65, description: "Puri topped with curd and chutneys", status: "Available" },
  { id: 1704, stallId: 109, name: "Pav Bhaji", category: "Street Food", price: 90, description: "Mashed veggie curry with butter pav", status: "Available" },
  { id: 1705, stallId: 109, name: "Masala Corn Cup", category: "Street Food", price: 60, description: "Sweet corn with masala and lemon", status: "Available" },
  { id: 1706, stallId: 109, name: "Vada Pav", category: "Street Food", price: 45, description: "Classic vada pav with chutney", status: "Available" },

  { id: 1801, stallId: 110, name: "Mini Meal Combo", category: "Combos", price: 149, description: "Rice bowl, side and beverage", status: "Available" },
  { id: 1802, stallId: 110, name: "Burger Combo", category: "Combos", price: 179, description: "Burger, fries and drink", status: "Available" },
  { id: 1803, stallId: 110, name: "Wrap Combo", category: "Combos", price: 169, description: "Wrap, chips and cooler", status: "Available" },
  { id: 1804, stallId: 110, name: "South Mini Combo", category: "Combos", price: 159, description: "Idli, mini dosa and filter coffee", status: "Available" },
  { id: 1805, stallId: 110, name: "Chinese Combo", category: "Combos", price: 189, description: "Noodles with manchurian and drink", status: "Available" },
  { id: 1806, stallId: 110, name: "Sweet Treat Combo", category: "Combos", price: 139, description: "Pastry and shake combo", status: "Available" }
];

const DEFAULT_CATEGORIES = [
  "South Indian",
  "North Indian",
  "Chinese",
  "Fast Food",
  "Beverages",
  "Desserts",
  "Healthy Bowls",
  "Bakery",
  "Street Food",
  "Combos"
];

const CATEGORY_ICON_MAP = {
  "South Indian": "🥥",
  "North Indian": "🍛",
  Chinese: "🥡",
  "Fast Food": "🍔",
  Beverages: "🥤",
  Desserts: "🍰",
  "Healthy Bowls": "🥗",
  Bakery: "🥐",
  "Street Food": "🌮",
  Combos: "🍱"
};

const CATEGORY_IMAGE_HINTS = {
  "South Indian": "south indian food",
  "North Indian": "north indian food",
  Chinese: "indo chinese food",
  "Fast Food": "fast food",
  Beverages: "fresh drink",
  Desserts: "dessert",
  "Healthy Bowls": "healthy bowl",
  Bakery: "bakery food",
  "Street Food": "street food",
  Combos: "combo meal"
};

const ITEM_IMAGE_QUERY_OVERRIDES = {
  "masala dosa": "masala dosa south indian food",
  "idli sambar": "idli sambar south indian breakfast",
  "medu vada": "medu vada south indian snack",
  "onion uttapam": "onion uttapam south indian",
  "podi dosa": "podi dosa",
  "curd rice": "curd rice indian food",
  "mini tiffin": "south indian tiffin plate",
  "lemon rice": "lemon rice indian",
  "aloo paratha": "aloo paratha with curd",
  "chole bhature": "chole bhature",
  "rajma rice": "rajma chawal",
  "paneer roll": "paneer kathi roll",
  "dal makhani combo": "dal makhani rice meal",
  "kadai paneer": "kadai paneer with roti",
  "veg biryani": "veg biryani",
  "butter naan pair": "butter naan",
  "hakka noodles": "hakka noodles",
  "schezwan noodles": "schezwan noodles",
  "veg fried rice": "vegetable fried rice",
  "paneer chilli": "chilli paneer",
  "veg manchurian": "veg manchurian",
  "spring roll": "veg spring rolls",
  "triple schezwan rice": "schezwan rice noodles combo",
  "honey chilli potato": "honey chilli potato",
  "classic veg burger": "veg burger",
  "cheese burger": "cheese burger",
  "double patty burger": "double patty burger",
  "crispy chicken burger": "crispy chicken burger",
  "peri peri fries": "peri peri fries",
  "cheesy fries": "cheese fries",
  "veg loaded sandwich": "grilled veg sandwich",
  "paneer tikka sandwich": "paneer tikka sandwich",
  "veg momos": "veg momos",
  "fried momos": "fried momos",
  "noodles bowl": "noodles bowl",
  "manchurian rice": "manchurian with rice",
  "margherita pizza slice": "margherita pizza slice",
  "farmhouse pizza slice": "farmhouse veg pizza slice",
  "hot dog": "hot dog",
  "paneer wrap": "paneer wrap",
  "chicken wrap": "chicken wrap",
  "taco pair": "crispy tacos",
  "nacho platter": "nacho platter",
  "popcorn chicken": "popcorn chicken",
  "cold coffee": "cold coffee",
  "mango smoothie": "mango smoothie",
  "orange juice": "orange juice",
  "chocolate shake": "chocolate milkshake",
  "lemon mint cooler": "lemon mint cooler",
  "watermelon juice": "watermelon juice",
  "banana shake": "banana milkshake",
  buttermilk: "spiced buttermilk",
  "gulab jamun": "gulab jamun",
  "brownie sundae": "brownie sundae",
  "vanilla ice cream": "vanilla ice cream scoop",
  "kulfi stick": "kulfi",
  "chocolate pastry": "chocolate pastry",
  "fruit custard": "fruit custard",
  falooda: "falooda",
  rasmalai: "rasmalai",
  "quinoa power bowl": "quinoa bowl",
  "mexican bean bowl": "mexican rice bean bowl",
  "greek salad": "greek salad",
  "sprout chaat": "sprout chaat",
  "fruit yogurt cup": "fruit yogurt parfait",
  "millet khichdi bowl": "millet khichdi",
  "veg puff": "veg puff pastry",
  "paneer puff": "paneer puff pastry",
  "garlic bread sticks": "garlic bread sticks",
  "choco chip muffin": "chocolate chip muffin",
  "red velvet pastry": "red velvet pastry",
  "croissant sandwich": "croissant sandwich",
  "pani puri": "pani puri",
  "sev puri": "sev puri",
  "dahi puri": "dahi puri",
  "pav bhaji": "pav bhaji",
  "masala corn cup": "masala corn",
  "vada pav": "vada pav",
  "mini meal combo": "indian meal combo",
  "burger combo": "burger fries cola combo",
  "wrap combo": "wrap combo meal",
  "south mini combo": "south indian combo meal",
  "chinese combo": "chinese combo meal",
  "sweet treat combo": "dessert combo"
};

function toImageQuery(text) {
  return String(text || "food")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ");
}

function getSpecificImageQuery(name, category) {
  const normalizedName = toImageQuery(name);
  const override = ITEM_IMAGE_QUERY_OVERRIDES[normalizedName];
  if (override) {
    return override;
  }

  const categoryHint = CATEGORY_IMAGE_HINTS[category] || category || "food";
  return `${normalizedName || "food item"} ${categoryHint} food`;
}

function buildInlineFoodSvg({ label, category }) {
  const safeLabel = String(label || "Food").slice(0, 28);
  const icon = CATEGORY_ICON_MAP[category] || "🍽";
  return `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="240" viewBox="0 0 360 240">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#fff7e8"/>
          <stop offset="100%" stop-color="#ffe7c0"/>
        </linearGradient>
      </defs>
      <rect width="360" height="240" fill="url(#g)"/>
      <rect x="20" y="20" width="320" height="200" rx="16" fill="rgba(255,255,255,0.65)"/>
      <text x="50%" y="48%" dominant-baseline="middle" text-anchor="middle" font-family="Segoe UI, Arial" font-size="46">${icon}</text>
      <text x="50%" y="67%" dominant-baseline="middle" text-anchor="middle" font-family="Segoe UI, Arial" font-size="18" fill="#6a3f00">${safeLabel}</text>
    </svg>`,
  )}`;
}

function buildFoodImageUrl({ name, category, id }) {
  const label = name || getSpecificImageQuery(name, category) || id || "Food";
  return buildInlineFoodSvg({ label, category });
}

function buildFoodFallbackUrl(category) {
  return buildInlineFoodSvg({
    label: `${category || "Food"} Item`,
    category,
  });
}

function needsImageRefresh(url) {
  if (!url) return true;
  return (
    url.includes("loremflickr.com") ||
    url.includes("source.unsplash.com") ||
    url.includes("dummyimage.com") ||
    url.includes("via.placeholder.com") ||
    url.includes("picsum.photos") ||
    url.includes("wikipedia.org") ||
    url.includes("wikimedia.org") ||
    url.includes("placehold.co")
  );
}

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function normalizeStall(stall) {
  return {
    id: stall.id ?? Date.now(),
    stallName: stall.stallName ?? "Campus Stall",
    owner: stall.owner ?? "Unassigned",
    contact: stall.contact ?? "N/A",
    cuisine: stall.cuisine ?? "General",
    status: stall.status ?? "Active",
    rating: Number(stall.rating ?? 4.0),
    ordersCount: Number(stall.ordersCount ?? 0),
    hours: stall.hours ?? "9:00 AM - 6:00 PM",
    specialties: Array.isArray(stall.specialties)
      ? stall.specialties
      : ["Quick Meals", "Snacks"],
    description:
      stall.description ?? "Popular campus food stall serving fresh meals."
  };
}

function normalizeMenuItem(item) {
  const generatedImage = buildFoodImageUrl({
    name: item.name,
    category: item.category,
    id: item.id
  });

  return {
    id: item.id ?? Date.now(),
    stallId: item.stallId ?? 101,
    name: item.name ?? "Menu Item",
    category: item.category ?? "Fast Food",
    price: Number(item.price ?? 50),
    description: item.description ?? "Freshly prepared campus special.",
    status: item.status ?? "Available",
    image: needsImageRefresh(item.image) ? generatedImage : item.image
  };
}

export function ensureAppData() {
  const existingStalls = readJson("stalls", []);
  if (!Array.isArray(existingStalls) || existingStalls.length === 0) {
    writeJson("stalls", DEFAULT_STALLS);
  } else {
    const normalized = existingStalls.map(normalizeStall);
    const existingIds = new Set(normalized.map((stall) => String(stall.id)));
    const merged = [
      ...normalized,
      ...DEFAULT_STALLS.filter((stall) => !existingIds.has(String(stall.id))).map(normalizeStall)
    ];
    writeJson("stalls", merged);
  }

  const existingOrders = readJson("orders", []);
  if (!Array.isArray(existingOrders)) {
    writeJson("orders", []);
  }

  const existingMap = readJson("stallOwnerStallMap", {});
  if (!existingMap || typeof existingMap !== "object") {
    writeJson("stallOwnerStallMap", {});
  }

  const existingMenuItems = readJson("menuItems", []);
  if (!Array.isArray(existingMenuItems) || existingMenuItems.length === 0) {
    writeJson("menuItems", DEFAULT_MENU_ITEMS);
  } else {
    const normalized = existingMenuItems.map(normalizeMenuItem);
    const existingIds = new Set(normalized.map((item) => String(item.id)));
    const merged = [
      ...normalized,
      ...DEFAULT_MENU_ITEMS.filter((item) => !existingIds.has(String(item.id))).map(normalizeMenuItem)
    ];
    writeJson("menuItems", merged);
  }
}

export function getCurrentUser() {
  return readJson("user", null);
}

export function setCurrentUser(user) {
  writeJson("user", user);
}

export function clearCurrentUser() {
  localStorage.removeItem("user");
}

export function getUsers() {
  return readJson("users", []);
}

export function getStalls() {
  ensureAppData();
  return readJson("stalls", []).map(normalizeStall);
}

export function getOrders() {
  ensureAppData();
  return readJson("orders", []);
}

export function getMenuItems() {
  ensureAppData();
  return readJson("menuItems", []).map(normalizeMenuItem);
}

export function setMenuItems(items) {
  writeJson("menuItems", items.map(normalizeMenuItem));
}

export function getMenuCategories() {
  const itemCategories = [...new Set(getMenuItems().map((item) => item.category))];
  return [...new Set([...DEFAULT_CATEGORIES, ...itemCategories])];
}

export function getCategoryIcon(category) {
  return CATEGORY_ICON_MAP[category] || "🍽";
}

export function getFoodImage(menuItem) {
  if (!menuItem) return buildFoodImageUrl({ name: "food", category: "meal", id: "default" });
  return (
    menuItem.image ||
    buildFoodImageUrl({
      name: menuItem.name,
      category: menuItem.category,
      id: menuItem.id
    })
  );
}

export function getFoodFallbackImage(category) {
  return buildFoodFallbackUrl(category);
}

export function getInlineFoodPlaceholder(category) {
  const label = (category || "Food").toString().slice(0, 20);
  return `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#e8f7ef"/>
          <stop offset="100%" stop-color="#cdebdc"/>
        </linearGradient>
      </defs>
      <rect width="640" height="420" fill="url(#g)"/>
      <text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-family="Segoe UI, Arial" font-size="52">🍽</text>
      <text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" font-family="Segoe UI, Arial" font-size="22" fill="#1f5136">${label}</text>
    </svg>`
  )}`;
}

export function getDisplayName(user) {
  if (!user) return "Guest";
  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
  if (fullName) return fullName;
  if (user.name) return user.name;
  if (user.email) return user.email.split("@")[0];
  return "User";
}

export function assignStallToOwner(user) {
  const stalls = getStalls();
  const key = user?.email;
  if (!key) return null;

  const ownerMap = readJson("stallOwnerStallMap", {});
  const mappedId = ownerMap[key];
  if (mappedId) {
    return stalls.find((stall) => String(stall.id) === String(mappedId)) || null;
  }

  const ownerName = getDisplayName(user).toLowerCase();
  const byName = stalls.find((stall) => stall.owner.toLowerCase() === ownerName);
  if (byName) {
    ownerMap[key] = byName.id;
    writeJson("stallOwnerStallMap", ownerMap);
    return byName;
  }

  const mappedIds = new Set(Object.values(ownerMap).map(String));
  const firstUnassigned = stalls.find(
    (stall) => !mappedIds.has(String(stall.id)) && stall.status === "Active"
  );

  const assigned = firstUnassigned || stalls.find((stall) => stall.status === "Active") || stalls[0] || null;

  if (assigned) {
    ownerMap[key] = assigned.id;
    writeJson("stallOwnerStallMap", ownerMap);
  }

  return assigned;
}

export function createOrder({
  student,
  stall,
  pickupTime,
  specialInstructions,
  paymentMethod,
  items,
  totalAmount
}) {
  const orders = getOrders();
  const resolvedStudentName =
    getDisplayName(student) !== "Guest"
      ? getDisplayName(student)
      : student?.email
      ? student.email.split("@")[0]
      : student?.studentId
      ? `Student ${student.studentId}`
      : "Unknown Student";
  const computedTotal = Number(
    (totalAmount ?? items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0)).toFixed(2)
  );
  const nextOrder = {
    id: `ORD${Date.now().toString().slice(-7)}`,
    studentName: resolvedStudentName,
    studentEmail: student?.email || "",
    studentId: student?.studentId || "N/A",
    stallId: stall?.id,
    stallName: stall?.stallName || "Campus Stall",
    stallOwner: stall?.owner || "N/A",
    items,
    qty: items.reduce((sum, item) => sum + item.quantity, 0),
    pickupTime,
    paymentMethod,
    specialInstructions,
    totalAmount: computedTotal,
    status: "New",
    createdAt: new Date().toISOString()
  };

  const updatedOrders = [nextOrder, ...orders];
  writeJson("orders", updatedOrders);
  return nextOrder;
}

export function updateOrderStatus(orderId, nextStatus) {
  const updatedOrders = getOrders().map((order) =>
    order.id === orderId ? { ...order, status: nextStatus } : order
  );
  writeJson("orders", updatedOrders);
  return updatedOrders;
}

function getCartKey(user) {
  const email = user?.email || "guest";
  return `cart:${email}`;
}

export function getCart(user) {
  ensureAppData();
  const items = readJson(getCartKey(user), []);
  const normalized = items.map((item) => ({
    ...item,
    image: needsImageRefresh(item.image)
      ? buildFoodImageUrl({
          name: item.name,
          category: item.category,
          id: item.id
        })
      : item.image
  }));

  const hasRefresh = normalized.some((item, index) => item.image !== items[index]?.image);
  if (hasRefresh) {
    setCart(user, normalized);
  }

  return normalized;
}

export function setCart(user, items) {
  writeJson(getCartKey(user), items);
}

export function clearCart(user) {
  localStorage.removeItem(getCartKey(user));
}

export function addItemToCart(user, menuItem, quantity = 1) {
  const currentCart = getCart(user);
  const qty = Number(quantity || 1);
  const currentStallId = currentCart[0]?.stallId;

  if (currentStallId && String(currentStallId) !== String(menuItem.stallId)) {
    return {
      success: false,
      message: "Your cart has items from another stall. Complete or clear the cart first."
    };
  }

  const existing = currentCart.find((item) => String(item.id) === String(menuItem.id));
  let nextCart;

  if (existing) {
    nextCart = currentCart.map((item) =>
      String(item.id) === String(menuItem.id)
        ? { ...item, quantity: Math.max(1, Number(item.quantity) + qty) }
        : item
    );
  } else {
    nextCart = [
      ...currentCart,
      {
        id: menuItem.id,
        name: menuItem.name,
        price: Number(menuItem.price),
        quantity: Math.max(1, qty),
        category: menuItem.category,
        image: getFoodImage(menuItem),
        stallId: menuItem.stallId
      }
    ];
  }

  setCart(user, nextCart);
  return { success: true, cart: nextCart };
}

export function updateCartItemQuantity(user, itemId, nextQuantity) {
  const qty = Number(nextQuantity);
  const currentCart = getCart(user);
  const nextCart =
    qty <= 0
      ? currentCart.filter((item) => String(item.id) !== String(itemId))
      : currentCart.map((item) =>
          String(item.id) === String(itemId) ? { ...item, quantity: qty } : item
        );
  setCart(user, nextCart);
  return nextCart;
}

export function removeCartItem(user, itemId) {
  const nextCart = getCart(user).filter((item) => String(item.id) !== String(itemId));
  setCart(user, nextCart);
  return nextCart;
}
