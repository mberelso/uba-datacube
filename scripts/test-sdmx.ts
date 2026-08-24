import { fetchData, type Dataflow } from '../src/api/sdmx'

async function runTests() {
  console.log('🧪 Starting SDMX API & Utilities Verification Tests...\n')
  let passed = 0
  let failed = 0

  // Test 1: Full dataset fetch (Wassertemperatur)
  try {
    const mockFlow: Dataflow = {
      id: 'DF_DAS_WASSER_WW_I_10',
      name: 'Wassertemperatur der Fließgewässer',
      description: 'Test flow',
      agencyID: 'UBA',
      version: '1.0',
      category: 'CLIMATE',
    }
    const res = await fetchData(mockFlow)
    if (res && res.seriesMap) {
      console.log(`✅ [TEST 1 PASSED] fetchData('DF_DAS_WASSER_WW_I_10') loaded ${Object.keys(res.seriesMap).length} series.`)
      passed++
    } else {
      throw new Error('fetchData returned null or empty seriesMap')
    }
  } catch (err) {
    console.error('❌ [TEST 1 FAILED] fetchData error:', err)
    failed++
  }

  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed.`)
  if (failed > 0) {
    process.exit(1)
  }
}

runTests()
