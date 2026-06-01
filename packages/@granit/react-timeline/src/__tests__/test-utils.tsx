export { axiosResponse, createMockClient } from '@granit/testing';

import { DEFAULT_BASE_PATH } from '../constants';
import { TimelineProvider } from '../providers/timeline-provider';

import type { AxiosInstance } from 'axios';

export function createWrapper(client: AxiosInstance, basePath = DEFAULT_BASE_PATH) {
  return function Wrapper({ children }: Readonly<{ children: React.ReactNode }>) {
    return <TimelineProvider config={{ client, basePath }}>{children}</TimelineProvider>;
  };
}
