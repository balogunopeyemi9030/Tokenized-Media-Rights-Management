import { describe, it, expect, beforeEach } from "vitest"

// Mock principal addresses
const ADMIN = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
const DISTRIBUTOR = "ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC"

// Mock contract state
let mockRevenueRecords = new Map()
let mockAssetTotalRevenue = new Map()
let mockAdmin = ADMIN
let mockBlockHeight = 100

// Mock distribution-rights contract
const mockDistributionRights = {
  isActiveDistributor: (assetId: number, distributor: string) => {
    // For testing, assume DISTRIBUTOR is authorized for asset 1
    return { success: assetId === 1 && distributor === DISTRIBUTOR }
  },
}

// Mock contract functions
const revenueTracking = {
  recordConsumption: (
      assetId: number,
      period: number,
      streamCount: number,
      downloadCount: number,
      revenue: number,
      caller: string,
  ) => {
    // Check if caller is authorized
    if (caller !== mockAdmin && !mockDistributionRights.isActiveDistributor(assetId, caller).success) {
      return { error: 403 }
    }
    
    const key = `${assetId}-${period}`
    
    if (mockRevenueRecords.has(key)) {
      // Update existing record
      const existingRecord = mockRevenueRecords.get(key)
      mockRevenueRecords.set(key, {
        streams: existingRecord.streams + streamCount,
        downloads: existingRecord.downloads + downloadCount,
        revenueAmount: existingRecord.revenueAmount + revenue,
        lastUpdated: mockBlockHeight,
      })
    } else {
      // Create new record
      mockRevenueRecords.set(key, {
        streams: streamCount,
        downloads: downloadCount,
        revenueAmount: revenue,
        lastUpdated: mockBlockHeight,
      })
    }
    
    // Update total revenue
    if (mockAssetTotalRevenue.has(assetId.toString())) {
      const existingTotal = mockAssetTotalRevenue.get(assetId.toString())
      mockAssetTotalRevenue.set(assetId.toString(), {
        totalRevenue: existingTotal.totalRevenue + revenue,
      })
    } else {
      mockAssetTotalRevenue.set(assetId.toString(), {
        totalRevenue: revenue,
      })
    }
    
    return { success: true }
  },
  
  getPeriodRevenue: (assetId: number, period: number) => {
    const key = `${assetId}-${period}`
    if (!mockRevenueRecords.has(key)) {
      return { error: 404 }
    }
    
    return { success: mockRevenueRecords.get(key) }
  },
  
  getAssetTotalRevenue: (assetId: number) => {
    if (!mockAssetTotalRevenue.has(assetId.toString())) {
      return { error: 404 }
    }
    
    return { success: mockAssetTotalRevenue.get(assetId.toString()).totalRevenue }
  },
}

describe("Revenue Tracking Contract", () => {
  beforeEach(() => {
    // Reset mock state before each test
    mockRevenueRecords = new Map()
    mockAssetTotalRevenue = new Map()
    mockAdmin = ADMIN
    mockBlockHeight = 100
  })
  
  it("should record consumption when called by authorized distributor", () => {
    const result = revenueTracking.recordConsumption(
        1, // Asset ID
        202301, // Period (e.g., January 2023)
        100, // Stream count
        50, // Download count
        1000, // Revenue amount
        DISTRIBUTOR,
    )
    
    expect(result).toHaveProperty("success", true)
    expect(mockRevenueRecords.has("1-202301")).toBe(true)
    expect(mockRevenueRecords.get("1-202301").streams).toBe(100)
    expect(mockRevenueRecords.get("1-202301").downloads).toBe(50)
    expect(mockRevenueRecords.get("1-202301").revenueAmount).toBe(1000)
  })
  
  it("should record consumption when called by admin", () => {
    const result = revenueTracking.recordConsumption(
        1, // Asset ID
        202301, // Period
        100, // Stream count
        50, // Download count
        1000, // Revenue amount
        ADMIN,
    )
    
    expect(result).toHaveProperty("success", true)
    expect(mockRevenueRecords.has("1-202301")).toBe(true)
  })
  
  it("should not record consumption when called by unauthorized user", () => {
    const UNAUTHORIZED = "ST3YFNDD4YYHH8FZQV4J1FJ8C2MGMT0G9KD3BNBJE"
    
    const result = revenueTracking.recordConsumption(
        1, // Asset ID
        202301, // Period
        100, // Stream count
        50, // Download count
        1000, // Revenue amount
        UNAUTHORIZED,
    )
    
    expect(result).toHaveProperty("error", 403)
  })
  
  it("should update existing records when recording consumption for the same period", () => {
    // First record
    revenueTracking.recordConsumption(
        1, // Asset ID
        202301, // Period
        100, // Stream count
        50, // Download count
        1000, // Revenue amount
        DISTRIBUTOR,
    )
    
    // Second record for same period
    revenueTracking.recordConsumption(
        1, // Asset ID
        202301, // Period
        200, // Stream count
        100, // Download count
        2000, // Revenue amount
        DISTRIBUTOR,
    )
    
    const record = mockRevenueRecords.get("1-202301")
    expect(record.streams).toBe(300) // 100 + 200
    expect(record.downloads).toBe(150) // 50 + 100
    expect(record.revenueAmount).toBe(3000) // 1000 + 2000
  })
  
  it("should retrieve revenue data for a specific period", () => {
    revenueTracking.recordConsumption(
        1, // Asset ID
        202301, // Period
        100, // Stream count
        50, // Download count
        1000, // Revenue amount
        DISTRIBUTOR,
    )
    
    const result = revenueTracking.getPeriodRevenue(1, 202301)
    expect(result).toHaveProperty("success")
    expect(result.success.streams).toBe(100)
    expect(result.success.downloads).toBe(50)
    expect(result.success.revenueAmount).toBe(1000)
  })
  
  it("should track total revenue for an asset across periods", () => {
    // Record for period 1
    revenueTracking.recordConsumption(
        1, // Asset ID
        202301, // Period 1
        100, // Stream count
        50, // Download count
        1000, // Revenue amount
        DISTRIBUTOR,
    )
    
    // Record for period 2
    revenueTracking.recordConsumption(
        1, // Asset ID
        202302, // Period 2
        200, // Stream count
        100, // Download count
        2000, // Revenue amount
        DISTRIBUTOR,
    )
    
    const result = revenueTracking.getAssetTotalRevenue(1)
    expect(result).toHaveProperty("success", 3000) // 1000 + 2000
  })
})
