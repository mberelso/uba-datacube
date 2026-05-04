import { type Dataflow } from '../../api/sdmx'
import { FallbackChart, type ChartProps } from './FallbackChart'
import { ClimateChart } from './ClimateChart'
import { EconomyChart } from './EconomyChart'

export interface ChartRendererProps extends ChartProps {
  flow: Dataflow
}

const CLIMATE_CATEGORIES = new Set(['CLIMATE', 'CROSS'])

export function ChartRenderer(props: ChartRendererProps) {
  const { flow, chartData, activeSeriesList, chartType } = props

  if (CLIMATE_CATEGORIES.has(flow.category)) {
    return (
      <ClimateChart
        chartData={chartData}
        activeSeriesList={activeSeriesList}
      />
    )
  }

  if (flow.category === 'ENV') {
    return (
      <EconomyChart
        chartData={chartData}
        activeSeriesList={activeSeriesList}
      />
    )
  }

  return <FallbackChart chartData={chartData} activeSeriesList={activeSeriesList} chartType={chartType} />
}
