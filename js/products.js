window.products = [
  {
    id: 1,
    name: "Star Chain Bag",
    price: 8500,
    oldPrice: 10000,
    colors: [
      { name: "Black", image: "images/scb2.jpeg", swatch: "#222", stock: 2 },
      { name: "Nude", image: "images/scb5.jpeg", swatch: "#eeddc3ff", stock: 1 },
      { name: "Cocoa", image: "images/scb3.jpeg", swatch: "#2c150aff", stock: 2 },
      { name: "White", image: "images/scb4.jpeg", swatch: "#ffffffff", stock: 1 }
    ],
    image: "images/scb.jpeg", // fallback/default
    category: "Budget Luxury"
  },
  {
    id: 2,
    name: "Butterfly Bag",
    price: 8500,
    oldPrice: 10000,
    colors: [
      { name: "Pink", image: "images/bb4.jpeg", swatch: "#e0a3deff", stock: 1 },
      { name: "Black", image: "images/bb5.jpeg", swatch: "#222", stock: 1 },
      { name: "Nude", image: "images/bb3.jpeg", swatch: "#eeddc3ff", stock: 3 },
    ],
    image: "images/bb.jpeg",
    category: "Budget Luxury"
  },
  {
    id: 3,
    name: "Elegant Clutch Bag",
    price: 8500,
    oldPrice: 10000,
    colors: [
      { name: "White", image: "images/ecb3.jpeg", swatch: "#ffffffff", stock: 0 },
      { name: "Nude", image: "images/ecb.jpeg", swatch: "#eeddc3ff", stock: 3 },
      { name: "Black", image: "images/ecb2.jpeg", swatch: "#222", stock: 2 }
    ],
    image: "images/ecb.jpeg",
    category: "Budget Luxury"
  },
  {
    id: 4,
    name: "Wavy Clutch Bag",
    price: 8500,
    oldPrice: 10000,
    colors: [
      { name: "Black", image: "images/wcp1.jpeg", swatch: "#222", stock: 0 },
      { name: "Nude", image: "images/wcp.jpeg", swatch: "#fff", stock: 0 }
    ],
    image: "images/wcp2.jpeg",
    category: "Budget Luxury"
  },
  {
    id: 5,
    name: "Structured Box Bag",
    price: 18500,
    oldPrice: 23000,
    colors: [
      { name: "Beige", image: "images/sbb.jpeg", swatch: "#dbdbdbff", stock: 3 },
      { name: "Black", image: "images/sbb3.jpeg", swatch: "#000000ff", stock: 1 },
      { name: "Brown", image: "images/sbb2.jpeg", swatch: "#534747ff", stock: 0},
      { name: "Pink", image: "images/sbb5.jpeg", swatch: "#c72c89ff", stock: 0}
    ],
    image: "images/sbb4.jpeg",
    category: "Statement"
  },
  {
    id: 6,
    name: "M Tote Bag",
    price: 8500,
    oldPrice: 12000,
    colors: [
      { name: "Black", image: "images/mtb2.jpeg", swatch: "#222", stock: 1 },
      { name: "Pink", image: "images/mtb.jpeg", swatch: "#e984bdff", stock: 0 }, 
      { name: "Brown", image: "images/mtb4.jpg", swatch: "#422828ff", stock: 1 }
    ],
    image: "images/mtb3.jpeg",
    category: "Tote Bags"
  },
  {
    id: 7,
    name: "Cloud Tote Bag",
    price: 8500,
    oldPrice: 12000,
    colors: [
      { name: "Black", image: "images/ctb.jpeg", swatch: "#222", stock: 0 },
      { name: "Pink", image: "images/ctb.jpeg", swatch: "#efa9ccff9efff", stock: 1 }
    ],
    image: "images/ctb.jpeg",
    category: "Tote Bags"
  },
  {
    id: 8,
    name: "2 in 1 Graffiti Tote Bag",
    price: 8500,
    oldPrice: 15000,
    colors: [
      { name: "White", image: "images/gtb.jpeg", swatch: "#222", stock: 0 },
      { name: "Pink", image: "images/gtb2.jpeg", swatch: "#eecdc3", stock: 1 }
    ],
    image: "images/gtb.jpeg",
    category: "Tote Bags"
  },
  {
    id: 9,
    name: "Hatini Fashion Bag",
    price: 22500,
    oldPrice: 28500,
    colors: [
      { name: "Black", image: "images/hfb3.jpeg", swatch: "#222", stock: 2 },
      { name: "Beige", image: "images/hfb.jpeg", swatch: "#d4d4d4ff", stock: 1 },
      { name: "Brown", image: "images/hfb6.jpeg", swatch: "#4d2917ff", stock: 0 },
      { name: "Red", image: "images/hfb2.jpeg", swatch: "#7e0f0fff", stock: 2 }
    ],
    image: "images/hfb.jpeg",
    category: "Going out"
  },
  {
    id: 10,
    name: "Fancy Clutch Purse",
    price: 17500,
    oldPrice: 25000,
    colors: [
      { name: "Black", image: "images/fcp2.jpeg", swatch: "#d41b1eff", stock: 1 },
      { name: "Black", image: "images/fcp.jpeg", swatch: "#d7338dff", stock: 0 }
    ],
    image: "images/fcp2.jpeg",
    category: "Statement"
  },
  {
    id: 11,
    name: "Structured Denim Bag",
    price: 17500,
    oldPrice: 23000,
    colors: [
      { name: "Beige", image: "images/db.jpeg", swatch: "#e2c6c6ff", stock: 5 },
      { name: "Blue", image: "images/db3.jpeg", swatch: "#3a5a8c", stock: 4 }
    ],
    image: "images/db2.jpeg",
    category: "Statement"
  },
  {
    id: 12,
    name: "Cute Charm Bag",
    price: 15000,
    oldPrice: 18500,
    colors: [
      { name: "Black", image: "images/ccb.jpeg", swatch: "#222", stock: 2 },
      { name: "White", image: "images/ccb2.jpeg", swatch: "#ffffffff", stock: 2}
    ],
    image: "images/ccb2.jpeg",
    category: "Going out"
  },
  {
    id: 13,
    name: "D Bagpack",
    price: 15000,
    oldPrice: 20000,
    colors: [
      { name: "Pink", image: "images/dbp3.jpeg", swatch: "#e7aad3ff", stock: 1 },
      { name: "Black", image: "images/dbp2.jpeg", swatch: "#222", stock: 2 },
      { name: "Brown", image: "images/dbp.jpeg", swatch: "#342727ffd4dff", stock: 2 }
    ],
    image: "images/dbp3.jpeg",
    category: "Everyday"
  },
  {
    id: 14,
    name: "Fully Boxed Hermes Bag",
    price: 25000,
    oldPrice: 28500,
    colors: [
      { name: "Black", image: "images/hb.jpeg", swatch: "#000000ff", stock: 1 }
    ],
    image: "images/hb.jpeg",
    category: "Fully Boxed"
  },
  {
    id: 15,
    name: "Fully Boxed Christian Dior Bag",
    price: 18500,
    oldPrice: 20000,
    colors: [
      { name: "Black", image: "images/cdb.jpeg", swatch: "#222", stock: 1 },
      { name: "Grey", image: "images/cdb.jpeg", swatch: "#5e5c5cff", stock: 2 },
      { name: "Pink", image: "images/cdb.jpeg", swatch: "#f3b3f3ff", stock: 1 }
    ],
    image: "images/cdb.jpeg",
    category: "Fully Boxed"
  },
  {
    id: 16,
    name: "Chrisbella Bag 1",
    price: 43500,
    oldPrice: 45000,
    colors: [
      { name: "Black", image: "images/cb2.jpeg", swatch: "#222", stock: 2 }
    ],
    image: "images/cb2.jpeg",
    category: "Luxury"
  },
  {
    id: 17,
    name: "Chrisbella Bag 2",
    price: 43500,
    oldPrice: 45000,
    colors: [
      { name: "Black", image: "images/cb4.jpeg", swatch: "#222", stock: 1 },
      { name: "Brown", image: "images/cb4.jpeg", swatch: "#7a3d1e", stock: 1 }
    ],
    image: "images/cb4.jpeg",
    category: "Luxury"
  },
  {
    id: 18,
    name: "Chrisbella Bag 3",
    price: 43000,
    oldPrice: 45000,
    colors: [
      { name: "Black", image: "images/cb3.jpeg", swatch: "#222", stock: 1 },
      { name: "Brown", image: "images/cb3.jpeg", swatch: "#ab8c7dff", stock: 1 }
    ],
    image: "images/cb3.jpeg",
    category: "Luxury"
  },
  {
    id: 19,
    name: "Bagco Bag 1",
    price: 33500,
    oldPrice: 35000,
    colors: [
      { name: "Green", image: "images/cb.jpeg", swatch: "#204a05ff", stock: 1 },
      { name: "Brown", image: "images/cb.jpeg", swatch: "#7a3d1e", stock: 2},
      { name: "Maroon", image: "images/cb.jpeg", swatch: "#792020ff", stock: 1 }
    ],
    image: "images/cb.jpeg",
    category: "Luxury"
  },
  {
    id: 20,
    name: "Bagco Bag 2",
    price: 33500,
    oldPrice: 35000,
    colors: [
      { name: "Black", image: "images/cb5.jpeg", swatch: "#222", stock: 1 },
      { name: "Beige", image: "images/cb5.jpeg", swatch: "#cbb7b7ff", stock: 1 },
      { name: "Maroon", image: "images/cb5.jpeg", swatch: "#792020ff", stock: 1 },
      { name: "Brown", image: "images/cb5.jpeg", swatch: "#7a3d1e", stock: 2 }
    ],
    image: "images/cb5.jpeg",
    category: "Luxury"
  },
  {
    id: 21,
    name: "Bagco Bag 3",
    price: 33500,
    oldPrice: 35000,
    colors: [
      { name: "Brown", image: "images/cbb5.jpeg", swatch: "#63351fff", stock: 1 },
      { name: "Maroon", image: "images/cbb5.jpeg", swatch: "#5e2222ff", stock: 1 }
    ],
    image: "images/cbb5.jpeg",
    category: "Luxury"
  }
];