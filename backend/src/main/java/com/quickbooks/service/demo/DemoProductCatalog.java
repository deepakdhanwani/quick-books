package com.quickbooks.service.demo;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public final class DemoProductCatalog {

    public record ProductSeed(String name, BigDecimal price, BigDecimal discount) {}

    private static final String[] VARIANTS = {
            "Small Pack", "Regular Pack", "Family Pack", "Premium", "Economy", "Bulk", "Combo", "Value Pack"
    };

    private static final Map<String, List<String>> PRODUCTS_BY_TYPE = new LinkedHashMap<>();

    static {
        PRODUCTS_BY_TYPE.put("Grocery Store", List.of(
                "Basmati Rice", "Toor Dal", "Moong Dal", "Wheat Flour", "Sugar", "Salt", "Sunflower Oil",
                "Mustard Oil", "Tea Leaves", "Coffee Powder", "Biscuits", "Namkeen", "Soap", "Detergent Powder",
                "Toothpaste", "Shampoo", "Milk Powder", "Poha", "Rava", "Besan"
        ));
        PRODUCTS_BY_TYPE.put("Pharmacy", List.of(
                "Paracetamol 500mg", "Cough Syrup", "Vitamin C Tablets", "Bandage Roll", "Antiseptic Liquid",
                "Pain Relief Gel", "Thermometer", "Face Mask", "Hand Sanitizer", "Glucose Powder",
                "ORS Sachet", "Antacid Tablets", "Allergy Tablets", "Digestive Enzyme", "Iron Supplement",
                "Calcium Tablets", "BP Monitor Strips", "Cotton Roll", "Surgical Tape", "Digital Thermometer"
        ));
        PRODUCTS_BY_TYPE.put("Clothing & Apparel", List.of(
                "Men Cotton Shirt", "Women Kurti", "Kids T-Shirt", "Denim Jeans", "Formal Trousers",
                "Cotton Saree", "Leggings", "Winter Jacket", "Sports Shorts", "School Uniform Shirt",
                "Ethnic Kurta", "Track Pants", "Cotton Dupatta", "Blazer", "Night Suit",
                "Socks Pack", "Belt", "Cap", "Raincoat", "Thermal Wear"
        ));
        PRODUCTS_BY_TYPE.put("Electronics Shop", List.of(
                "LED Bulb", "Extension Board", "Mobile Charger", "Bluetooth Speaker", "USB Cable",
                "Power Bank", "Table Fan", "Electric Kettle", "Iron Box", "Mixer Grinder Jar",
                "Remote Control", "HDMI Cable", "Wi-Fi Router", "Keyboard", "Mouse",
                "Laptop Stand", "Earphones", "Smart Watch Strap", "CFL Lamp", "Voltage Stabilizer"
        ));
        PRODUCTS_BY_TYPE.put("Mobile & Accessories", List.of(
                "Screen Guard", "Phone Case", "Type-C Cable", "Fast Charger", "Wireless Earbuds",
                "Car Charger", "Phone Holder", "Tempered Glass", "OTG Adapter", "Memory Card",
                "SIM Adapter Kit", "Bluetooth Headset", "Power Bank 10000mAh", "Ring Light", "Selfie Stick",
                "Mobile Stand", "Cleaning Kit", "Sticker Pack", "Data Cable", "Neckband"
        ));
        PRODUCTS_BY_TYPE.put("Restaurant", List.of(
                "Veg Thali", "Paneer Butter Masala", "Dal Tadka", "Roti Basket", "Jeera Rice",
                "Veg Biryani", "Masala Dosa", "Idli Plate", "Cold Coffee", "Fresh Lime Soda",
                "French Fries", "Veg Burger", "Margherita Pizza", "Chicken Curry", "Fish Fry",
                "Veg Soup", "Garlic Naan", "Lassi", "Ice Cream Scoop", "Mineral Water"
        ));
        PRODUCTS_BY_TYPE.put("Bakery & Confectionery", List.of(
                "White Bread", "Brown Bread", "Butter Croissant", "Chocolate Muffin", "Fruit Cake Slice",
                "Cookies Pack", "Donut", "Puff Pastry", "Cream Roll", "Samosa",
                "Kachori", "Rusk Pack", "Garlic Bread", "Cupcake", "Cinnamon Roll",
                "Pizza Base", "Bun Pack", "Cake Rusk", "Honey Cake", "Eclairs Pack"
        ));
        PRODUCTS_BY_TYPE.put("Hardware Store", List.of(
                "Hammer", "Screwdriver Set", "PVC Pipe", "Wall Plug", "Door Hinge",
                "Paint Brush", "Measuring Tape", "Safety Gloves", "Nails Box", "Cement Bag",
                "Sandpaper Roll", "Drill Bit Set", "Door Lock", "Fevicol Tube", "Steel Rod",
                "Tile Adhesive", "Pipe Wrench", "LED Flood Light", "Switch Board", "Wire Roll"
        ));
        PRODUCTS_BY_TYPE.put("Stationery Shop", List.of(
                "Notebook A4", "Ball Pen Pack", "Pencil Box", "Eraser Pack", "Sharpener",
                "Geometry Box", "Marker Set", "A4 Paper Ream", "Sticky Notes", "File Folder",
                "Register Book", "Glue Stick", "Crayon Box", "Chart Paper", "Envelope Pack",
                "Stapler", "Calculator", "Ink Bottle", "Scale 30cm", "Highlighter Set"
        ));
        PRODUCTS_BY_TYPE.put("General Store", List.of(
                "Household Cleaner", "Plastic Bucket", "Broom", "Mop", "Matchbox Pack",
                "Candle Pack", "Battery Cell", "Notebook", "Snacks Mix", "Pickle Jar",
                "Spice Box", "Plastic Container", "Kitchen Towel", "Aluminium Foil", "Garbage Bag Roll",
                "Room Freshener", "Mosquito Coil", "Light Bulb", "Extension Cord", "Water Bottle"
        ));
    }

    private DemoProductCatalog() {}

    public static List<ProductSeed> buildProducts(String businessTypeName, int count) {
        List<String> baseNames = PRODUCTS_BY_TYPE.getOrDefault(
                businessTypeName,
                PRODUCTS_BY_TYPE.get("General Store")
        );

        List<ProductSeed> products = new ArrayList<>();
        int index = 0;
        while (products.size() < count) {
            String base = baseNames.get(index % baseNames.size());
            String variant = VARIANTS[(index / baseNames.size()) % VARIANTS.length];
            int suffix = (index / (baseNames.size() * VARIANTS.length)) + 1;
            String name = suffix > 1
                    ? base + " " + variant + " " + suffix
                    : base + " " + variant;

            BigDecimal price = BigDecimal.valueOf(20 + (index % 180) + (index % 7) * 3L)
                    .setScale(2, java.math.RoundingMode.HALF_UP);
            BigDecimal discount = index % 5 == 0
                    ? BigDecimal.valueOf(2 + (index % 8)).setScale(2, java.math.RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            products.add(new ProductSeed(name, price, discount));
            index++;
        }

        return products;
    }
}
