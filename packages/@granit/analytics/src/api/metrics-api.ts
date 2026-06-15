import type { MetricRequest, MetricResponse } from '../types';
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
