
import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;

/*
  The test below is an example. To learn more, read the testing documentation here:
  https://docs.hiro.so/stacks/clarinet-js-sdk
*/

describe("example tests", () => {
  it("ensures simnet is well initalised", () => {
    expect(simnet.blockHeight).toBeDefined();
  });

  // it("shows an example", () => {
  //   const { result } = simnet.callReadOnlyFn("counter", "get-counter", [], address1);
  //   expect(result).toBeUint(0);
  // });
});
import { describe, it, expect, beforeEach } from "vitest"

// Mock implementation for testing Clarity contracts
// In a real environment, you would use a Clarity testing framework

// Mock principal addresses
const ADMIN = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
const CREATOR1 = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG"
const CREATOR2 = "ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC"

// Mock contract state
let mockCreators = new Map()
let mockAdmin = ADMIN
let mockBlockHeight = 100

// Mock contract functions
const creatorVerification = {
  registerCreator: (name: string, caller: string) => {
    if (mockCreators.has(caller)) {
      return { error: 1 }
    }
    
    mockCreators.set(caller, {
      name,
      verified: false,
      registrationDate: mockBlockHeight,
    })
    
    return { success: true }
  },
  
  verifyCreator: (creatorId: string, caller: string) => {
    if (caller !== mockAdmin) {
      return { error: 403 }
    }
    
    if (!mockCreators.has(creatorId)) {
      return { error: 404 }
    }
    
    const creatorData = mockCreators.get(creatorId)
    mockCreators.set(creatorId, {
      ...creatorData,
      verified: true,
    })
    
    return { success: true }
  },
  
  isVerified: (creatorId: string) => {
    if (!mockCreators.has(creatorId)) {
      return { error: 404 }
    }
    
    return { success: mockCreators.get(creatorId).verified }
  },
  
  setAdmin: (newAdmin: string, caller: string) => {
    if (caller !== mockAdmin) {
      return { error: 403 }
    }
    
    mockAdmin = newAdmin
    return { success: true }
  },
}

describe("Creator Verification Contract", () => {
  beforeEach(() => {
    // Reset mock state before each test
    mockCreators = new Map()
    mockAdmin = ADMIN
    mockBlockHeight = 100
  })
  
  it("should register a new creator", () => {
    const result = creatorVerification.registerCreator("Test Creator", CREATOR1)
    expect(result).toHaveProperty("success")
    expect(mockCreators.has(CREATOR1)).toBe(true)
    expect(mockCreators.get(CREATOR1).name).toBe("Test Creator")
    expect(mockCreators.get(CREATOR1).verified).toBe(false)
  })
  
  it("should not register a creator twice", () => {
    creatorVerification.registerCreator("Test Creator", CREATOR1)
    const result = creatorVerification.registerCreator("Test Creator Again", CREATOR1)
    expect(result).toHaveProperty("error")
  })
  
  it("should verify a creator when called by admin", () => {
    creatorVerification.registerCreator("Test Creator", CREATOR1)
    const result = creatorVerification.verifyCreator(CREATOR1, ADMIN)
    expect(result).toHaveProperty("success")
    expect(mockCreators.get(CREATOR1).verified).toBe(true)
  })
  
  it("should not verify a creator when called by non-admin", () => {
    creatorVerification.registerCreator("Test Creator", CREATOR1)
    const result = creatorVerification.verifyCreator(CREATOR1, CREATOR2)
    expect(result).toHaveProperty("error")
    expect(mockCreators.get(CREATOR1).verified).toBe(false)
  })
  
  it("should check if a creator is verified", () => {
    creatorVerification.registerCreator("Test Creator", CREATOR1)
    creatorVerification.verifyCreator(CREATOR1, ADMIN)
    const result = creatorVerification.isVerified(CREATOR1)
    expect(result).toHaveProperty("success", true)
  })
  
  it("should allow admin transfer", () => {
    const result = creatorVerification.setAdmin(CREATOR1, ADMIN)
    expect(result).toHaveProperty("success")
    expect(mockAdmin).toBe(CREATOR1)
  })
  
  it("should not allow non-admin to transfer admin rights", () => {
    const result = creatorVerification.setAdmin(CREATOR2, CREATOR1)
    expect(result).toHaveProperty("error")
    expect(mockAdmin).toBe(ADMIN)
  })
})
