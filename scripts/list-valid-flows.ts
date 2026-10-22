import { fetchDataflows } from '../src/api/sdmx'

async function main() {
  const flows = await fetchDataflows()
  console.log(`Found ${flows.length} dataflows from UBA API:`)
  for (const f of flows.slice(0, 30)) {
    console.log(`- ${f.id} (agency: ${f.agencyID}, v: ${f.version}): ${f.name}`)
  }
}

main().catch(err => console.error(err))
