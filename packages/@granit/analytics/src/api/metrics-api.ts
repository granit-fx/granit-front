import type { MetricCatalogEntryResponse, MetricRequest, MetricResponse } from '../types';
import type { AxiosInstance, AxiosRequestConfig } from '@granit/api-client';

/**
 * Evaluates a `MetricDefinition` by name with the given period / compare /
 * filter specification.
 *
 * `POST {basePath}/metrics/{metricName}`
 */
export async function evaluateMetric(
  client: AxiosInstance,
  basePath: string,
  metricName: string,
  request: MetricRequest,
  config?: AxiosRequestConfig
): Promise<MetricResponse> {
  const { data } = await client.post<MetricResponse>(
    `${basePath}/metrics/${encodeURIComponent(metricName)}`,
    request,
    config
  );
  return data;
}

/**
 * Lists every registered `MetricDefinition` — the metric catalogue a KPI widget
 * editor offers as a dropdown instead of a free-text metric name.
 *
 * `GET {basePath}/metrics/catalog`
 */
export async function listMetricCatalog(
  client: AxiosInstance,
  basePath: string,
  config?: AxiosRequestConfig
): Promise<readonly MetricCatalogEntryResponse[]> {
  const { data } = await client.get<readonly MetricCatalogEntryResponse[]>(
    `${basePath}/metrics/catalog`,
    config
  );
  return data;
}
