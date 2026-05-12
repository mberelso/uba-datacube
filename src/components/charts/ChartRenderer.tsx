import { type Dataflow } from '../../api/sdmx'
import { FallbackChart, type ChartProps } from './FallbackChart'
import { ClimateChart } from './ClimateChart'
import { EconomyChart } from './EconomyChart'
import { StackedAreaChart, type StackedSeriesConfig } from './StackedAreaChart'
import { GermanyMap } from './GermanyMap'

export interface ChartRendererProps extends ChartProps {
  flow: Dataflow
  stackedSeries?: StackedSeriesConfig[]
  exportMode?: boolean
}

const CLIMATE_CATEGORIES = new Set(['CLIMATE', 'CROSS'])
const MAP_DATASETS = new Set(['DF_AREA_SOIL_LAND_ECOSYSTEMS_AREA'])

export function ChartRenderer(props: ChartRendererProps) {
  const { flow, chartData, activeSeriesList, chartType, stackedSeries, exportMode } = props

  if (stackedSeries) {
    return <StackedAreaChart chartData={chartData} seriesConfig={stackedSeries} />
  }

  if (MAP_DATASETS.has(flow.id)) {
    return <GermanyMap />
  }

  if (CLIMATE_CATEGORIES.has(flow.category)) {
    return (
      <ClimateChart
        chartData={chartData}
        activeSeriesList={activeSeriesList}
        exportMode={exportMode}
      />
    )
  }

  if (flow.category === 'ENV') {
    return (
      <EconomyChart
        chartData={chartData}
        activeSeriesList={activeSeriesList}
        exportMode={exportMode}
      />
    )
  }

  return <FallbackChart chartData={chartData} activeSeriesList={activeSeriesList} chartType={chartType} exportMode={exportMode} />
}
