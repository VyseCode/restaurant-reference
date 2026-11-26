import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/restaurant_ref";

function dayString(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true, lowercase: true },
    password: { type: String, select: false },
    role: { type: String, enum: ["customer", "admin"], default: "customer" },
    avatarUrl: String,
  },
  { timestamps: true },
);

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, unique: true },
    slug: { type: String, unique: true },
    description: String,
    sortOrder: Number,
    active: Boolean,
  },
  { timestamps: true },
);

const menuItemSchema = new mongoose.Schema(
  {
    name: String,
    category: mongoose.Schema.Types.ObjectId,
    description: String,
    price: Number,
    imageUrl: String,
    dietaryTags: [String],
    available: Boolean,
    popularity: { type: Number, default: 0 },
  },
  { timestamps: true },
);
menuItemSchema.index({ category: 1, available: 1 });
menuItemSchema.index({ name: "text", description: "text", dietaryTags: "text" });

const specialSchema = new mongoose.Schema(
  {
    date: String,
    item: mongoose.Schema.Types.ObjectId,
    specialPrice: Number,
    note: String,
    available: Boolean,
  },
  { timestamps: true },
);
specialSchema.index({ date: 1, item: 1 }, { unique: true });

const reservationSchema = new mongoose.Schema(
  {
    user: mongoose.Schema.Types.ObjectId,
    date: String,
    time: String,
    partySize: Number,
    status: String,
    notes: String,
  },
  { timestamps: true },
);
reservationSchema.index(
  { user: 1, date: 1, time: 1 },
  { unique: true, partialFilterExpression: { status: "confirmed" } },
);

const cartSchema = new mongoose.Schema(
  { user: { type: mongoose.Schema.Types.ObjectId, unique: true }, items: [{ item: mongoose.Schema.Types.ObjectId, qty: Number }] },
  { timestamps: true },
);

const orderSchema = new mongoose.Schema(
  {
    user: mongoose.Schema.Types.ObjectId,
    items: [{ item: mongoose.Schema.Types.ObjectId, name: String, price: Number, qty: Number }],
    type: String,
    status: String,
    paymentStatus: String,
    total: Number,
    address: String,
    tableNumber: String,
    notes: String,
  },
  { timestamps: true },
);
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

const reviewSchema = new mongoose.Schema(
  {
    user: mongoose.Schema.Types.ObjectId,
    order: { type: mongoose.Schema.Types.ObjectId, unique: true },
    item: mongoose.Schema.Types.ObjectId,
    rating: Number,
    comment: String,
  },
  { timestamps: true },
);

const favoriteSchema = new mongoose.Schema(
  { user: mongoose.Schema.Types.ObjectId, item: mongoose.Schema.Types.ObjectId },
  { timestamps: { createdAt: true, updatedAt: false } },
);
favoriteSchema.index({ user: 1, item: 1 }, { unique: true });

const User = mongoose.model("User", userSchema);
const Category = mongoose.model("Category", categorySchema);
const MenuItem = mongoose.model("MenuItem", menuItemSchema);
const Special = mongoose.model("Special", specialSchema);
const Reservation = mongoose.model("Reservation", reservationSchema);
const Cart = mongoose.model("Cart", cartSchema);
const Order = mongoose.model("Order", orderSchema);
const Review = mongoose.model("Review", reviewSchema);
const Favorite = mongoose.model("Favorite", favoriteSchema);

const people = [
  { email: "admin@restaurant.test", name: "Maya Patel", role: "admin" },
  { email: "alex@example.com", name: "Alex Morgan", role: "customer" },
  { email: "priya@example.com", name: "Priya Sharma", role: "customer" },
  { email: "marcus@example.com", name: "Marcus Lee", role: "customer" },
  { email: "sofia@example.com", name: "Sofia Rodriguez", role: "customer" },
];

const categories = [
  { name: "Starters", slug: "starters", description: "Small plates to begin", sortOrder: 1, active: true },
  { name: "Mains", slug: "mains", description: "Signature curries and rice", sortOrder: 2, active: true },
  { name: "Desserts", slug: "desserts", description: "Something sweet", sortOrder: 3, active: true },
  { name: "Drinks", slug: "drinks", description: "Hot and cold beverages", sortOrder: 4, active: true },
  { name: "Seasonal", slug: "seasonal", description: "Coming soon", sortOrder: 5, active: false },
];

const menu = [
  ["Samosa Chaat", "starters", 180, ["vegetarian", "spicy"], true, "Crisp samosas with yogurt, chutney and sev."],
  ["Paneer Tikka", "starters", 260, ["vegetarian"], true, "Char-grilled cottage cheese with peppers."],
  ["Chicken Wings", "starters", 290, ["spicy"], false, "Tandoori wings with mint dip — currently out of stock."],
  ["Butter Chicken", "mains", 420, ["halal"], true, "Tandoori chicken in a creamy tomato gravy."],
  ["Paneer Butter Masala", "mains", 380, ["vegetarian"], true, "Paneer in a rich butter-tomato sauce."],
  ["Hyderabadi Biryani", "mains", 450, ["halal", "spicy"], true, "Layered basmati rice with spiced chicken."],
  ["Vegan Thali", "mains", 360, ["vegan", "gluten-free"], true, "Seasonal vegetables, dal and rice."],
  ["Gulab Jamun", "desserts", 160, ["vegetarian"], true, "Warm milk dumplings in cardamom syrup."],
  ["Chocolate Brownie", "desserts", 190, ["vegetarian"], true, "Fudgy brownie with vanilla cream."],
  ["Mango Lassi", "drinks", 120, ["vegetarian"], true, "Yogurt and Alphonso mango."],
  ["Masala Chai", "drinks", 80, ["vegetarian"], true, "Spiced tea with milk."],
  ["Lemon Soda", "drinks", 90, ["vegan"], false, "House-made lemonade — currently unavailable."],
];

async function main() {
  await mongoose.connect(URI);
  await Promise.all([
    User.createIndexes(),
    Category.createIndexes(),
    MenuItem.createIndexes(),
    Special.createIndexes(),
    Reservation.createIndexes(),
    Cart.createIndexes(),
    Order.createIndexes(),
    Review.createIndexes(),
    Favorite.createIndexes(),
  ]);

  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    MenuItem.deleteMany({}),
    Special.deleteMany({}),
    Reservation.deleteMany({}),
    Cart.deleteMany({}),
    Order.deleteMany({}),
    Review.deleteMany({}),
    Favorite.deleteMany({}),
  ]);

  const password = await bcrypt.hash("password123", 12);
  const users = await User.create(people.map((p) => ({ ...p, password })));
  const [, alex, priya, marcus, sofia] = users;

  const cats = await Category.create(categories);
  const catId = (slug) => cats.find((c) => c.slug === slug)._id;
  const items = await MenuItem.create(
    menu.map(([name, slug, price, dietaryTags, available, description]) => ({
      name,
      category: catId(slug),
      description,
      price,
      imageUrl: "",
      dietaryTags,
      available,
    })),
  );
  const itemByName = (name) => items.find((i) => i.name === name);
  const line = (name, qty) => ({
    item: itemByName(name)._id,
    name,
    price: itemByName(name).price,
    qty,
  });

  await Special.create([
    { date: dayString(0), item: itemByName("Butter Chicken")._id, specialPrice: 320, note: "Chef's pick of the day", available: true },
    { date: dayString(1), item: itemByName("Paneer Tikka")._id, specialPrice: 199, note: "Tomorrow only", available: true },
  ]);

  await Reservation.create([
    { user: alex._id, date: dayString(1), time: "19:00", partySize: 2, status: "confirmed", notes: "Window seat please" },
    { user: priya._id, date: dayString(1), time: "19:00", partySize: 2, status: "confirmed", notes: "" },
    { user: marcus._id, date: dayString(3), time: "18:00", partySize: 4, status: "confirmed", notes: "Birthday dinner" },
    { user: sofia._id, date: dayString(2), time: "12:00", partySize: 3, status: "cancelled", notes: "Plans changed" },
    { user: alex._id, date: dayString(5), time: "20:00", partySize: 2, status: "completed", notes: "" },
    { user: marcus._id, date: dayString(-3), time: "18:00", partySize: 2, status: "completed", notes: "Past visit" },
  ]);

  await Cart.create({
    user: alex._id,
    items: [
      { item: itemByName("Butter Chicken")._id, qty: 1 },
      { item: itemByName("Mango Lassi")._id, qty: 2 },
    ],
  });

  const orders = await Order.create([
    { user: alex._id, items: [line("Butter Chicken", 1), line("Gulab Jamun", 2)], type: "dine-in", status: "completed", paymentStatus: "paid", total: 420 + 160 * 2, address: "", tableNumber: "T4", notes: "Great meal" },
    { user: priya._id, items: [line("Paneer Butter Masala", 1), line("Masala Chai", 1)], type: "takeaway", status: "completed", paymentStatus: "paid", total: 380 + 80, address: "", tableNumber: "", notes: "" },
    { user: priya._id, items: [line("Vegan Thali", 1)], type: "delivery", status: "placed", paymentStatus: "unpaid", total: 360, address: "42 Oak Street, Springfield", tableNumber: "", notes: "Ring the bell" },
    { user: marcus._id, items: [line("Chicken Wings", 1), line("Hyderabadi Biryani", 1)], type: "dine-in", status: "preparing", paymentStatus: "paid", total: 290 + 450, address: "", tableNumber: "T7", notes: "" },
    { user: sofia._id, items: [line("Chocolate Brownie", 1), line("Mango Lassi", 1)], type: "takeaway", status: "ready", paymentStatus: "paid", total: 190 + 120, address: "", tableNumber: "", notes: "" },
    { user: alex._id, items: [line("Lemon Soda", 1)], type: "takeaway", status: "cancelled", paymentStatus: "unpaid", total: 90, address: "", tableNumber: "", notes: "Changed mind" },
  ]);

  await Review.create([
    { user: alex._id, order: orders[0]._id, item: itemByName("Butter Chicken")._id, rating: 5, comment: "Absolutely delicious, will come back." },
    { user: priya._id, order: orders[1]._id, item: itemByName("Paneer Butter Masala")._id, rating: 4, comment: "Rich and flavourful." },
  ]);

  await Favorite.create([
    { user: alex._id, item: itemByName("Butter Chicken")._id },
    { user: alex._id, item: itemByName("Gulab Jamun")._id },
    { user: priya._id, item: itemByName("Vegan Thali")._id },
  ]);

  for (const [name, count] of [
    ["Butter Chicken", 3],
    ["Gulab Jamun", 2],
    ["Paneer Butter Masala", 2],
    ["Vegan Thali", 2],
  ]) {
    await MenuItem.updateOne({ _id: itemByName(name)._id }, { $set: { popularity: count } });
  }

  console.log(
    `Seeded ${users.length} users, ${cats.length} categories, ${items.length} menu items, 2 specials, 6 reservations, 1 cart, ${orders.length} orders, 2 reviews, 3 favorites.`,
  );
  console.log("Demo: admin@restaurant.test / password123 (admin); alex@example.com / password123 (customer)");
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
