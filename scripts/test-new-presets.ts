import { fetchSingleSeries, fetchCsvAveraged } from '../src/api/sdmx'

async function main() {
  console.log('--- Preset 1: Stickoxide (NOx) vs Feinstaub (PM2.5) ---')
  const p1a = await fetchCsvAveraged('DF_AIR_EMISSIONS_TRENDS', '1.0', { 'D_SUBSTANCES': 'NOx_NO2' })
  const p1b = await fetchCsvAveraged('DF_AIR_EMISSIONS_TRENDS', '1.0', { 'D_SUBSTANCES': 'PM25' })
  console.log('P1A (NOx):', p1a.length, 'points (1990..2024). First/Last:', p1a[0], p1a[p1a.length - 1])
  console.log('P1B (PM2,5):', p1b.length, 'points (1990..2024). First/Last:', p1b[0], p1b[p1b.length - 1])

  console.log('\n--- Preset 2: Erneuerbare Energien vs Luftschadstoffe (NOx) ---')
  const p2a = await fetchSingleSeries('UBA,DF_ENERGY_AGEE_SHARE,1.0', 'DE.A.PZ.SHARE_EE_GFEC_RED.EE')
  console.log('P2A (EE Share):', p2a.length, 'points (2002..2024). First/Last:', p2a[0], p2a[p2a.length - 1])
  console.log('P2B (NOx):', p1a.length, 'points')

  console.log('\n--- Preset 3: Schwefeldioxid (SO2) vs Stickoxide (NOx) ---')
  const p3a = await fetchCsvAveraged('DF_AIR_EMISSIONS_TRENDS', '1.0', { 'D_SUBSTANCES': 'SO2' })
  console.log('P3A (SO2):', p3a.length, 'points (1990..2024). First/Last:', p3a[0], p3a[p3a.length - 1])
}

main().catch((err) => console.error(err))
