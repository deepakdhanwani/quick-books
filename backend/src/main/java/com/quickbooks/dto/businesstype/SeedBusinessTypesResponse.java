package com.quickbooks.dto.businesstype;

public class SeedBusinessTypesResponse {

    private int created;
    private int skipped;
    private int totalKnown;

    public SeedBusinessTypesResponse(int created, int skipped, int totalKnown) {
        this.created = created;
        this.skipped = skipped;
        this.totalKnown = totalKnown;
    }

    public int getCreated() { return created; }
    public int getSkipped() { return skipped; }
    public int getTotalKnown() { return totalKnown; }
}
