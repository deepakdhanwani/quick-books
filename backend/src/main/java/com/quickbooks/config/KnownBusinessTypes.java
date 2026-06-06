package com.quickbooks.config;

import java.util.List;

public final class KnownBusinessTypes {

    public record KnownType(String name, String description) {}

    public static final List<KnownType> DEFAULTS = List.of(
            new KnownType("Grocery Store", "Kirana shop and daily essentials"),
            new KnownType("Pharmacy", "Medical store and medicines"),
            new KnownType("Clothing & Apparel", "Garments and fashion retail"),
            new KnownType("Electronics Shop", "Electronics and appliances"),
            new KnownType("Mobile & Accessories", "Mobile phones and accessories"),
            new KnownType("Restaurant", "Food service and dining"),
            new KnownType("Bakery & Confectionery", "Bakery items and sweets"),
            new KnownType("Hardware Store", "Tools, hardware and building materials"),
            new KnownType("Stationery Shop", "Books, stationery and office supplies"),
            new KnownType("Footwear Store", "Shoes and footwear retail"),
            new KnownType("Cosmetics & Beauty", "Beauty and personal care products"),
            new KnownType("Jewellery Shop", "Gold, silver and fashion jewellery"),
            new KnownType("General Store", "Mixed retail goods"),
            new KnownType("Wholesale / Distributor", "Bulk supply and distribution"),
            new KnownType("Fruits & Vegetables", "Fresh produce retail"),
            new KnownType("Dairy Products", "Milk and dairy items"),
            new KnownType("Auto Parts", "Vehicle parts and accessories"),
            new KnownType("Furniture Shop", "Home and office furniture"),
            new KnownType("Tailoring / Garments", "Tailoring and custom clothing"),
            new KnownType("Gift Shop", "Gifts, toys and novelty items"),
            new KnownType("Sports Goods", "Sports equipment and apparel"),
            new KnownType("Pet Shop", "Pet food and accessories"),
            new KnownType("Laundry & Dry Cleaning", "Laundry services and products"),
            new KnownType("Other Retail", "Other retail business types")
    );

    private KnownBusinessTypes() {}
}
