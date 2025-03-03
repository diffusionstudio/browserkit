import monitoring from '@google-cloud/monitoring';

import { METADATA_URL, METADATA_HEADERS } from './constants';
import { GCP_PROJECT_ID } from './environment';
import { logger } from './logger';

const client = new monitoring.MetricServiceClient();

/**
 * Report metrics to Google Cloud Monitoring
 * @param metrics - Array of metrics to report
 */
export async function report(metrics: { type: string, value: number | undefined }[]) {
  if (!GCP_PROJECT_ID) {
    logger.info('GCP project ID is not set, skipping metrics publishing');
    return;
  }
  
  try {
    const labels = await getInstanceLabels();
    // Prepares the time series request
    const [result] = await client.createTimeSeries({
      name: client.projectPath(GCP_PROJECT_ID),
      timeSeries: metrics.map(metric => ({
        // Ties the data point to a custom metric
        metric: { type: metric.type },
        resource: {
          type: 'gce_instance',
          labels: {
            project_id: GCP_PROJECT_ID || '',
            ...labels,
          },
        },
        points: [{
          interval: {
            endTime: {
              seconds: Date.now() / 1000,
            },
          },
          value: {
            doubleValue: metric.value,
          },
        }],
      })),
    });
    logger.info('Done writing time series data.', result);
  } catch (error) {
    logger.error('Error writing time series data.', error);
  }
}

/**
 * Get instance labels from GCP metadata server
 * @returns Object containing instance ID and zone
 */
async function getInstanceLabels() {
  const [instanceIdRes, zoneRes] = await Promise.all([
    fetch(`${METADATA_URL}/instance/id`, { headers: METADATA_HEADERS }),
    fetch(`${METADATA_URL}/instance/zone`, { headers: METADATA_HEADERS }),
  ]);

  if (!instanceIdRes.ok || !zoneRes.ok) {
    throw new Error('Error fetching metadata from GCP metadata server');
  }

  const instanceId = await instanceIdRes.text(); // numeric instance id as string
  const zoneFullPath = await zoneRes.text(); // e.g., projects/123456789/zones/us-central1-a
  const zone = zoneFullPath.split('/').pop(); // extracts 'us-central1-a'

  return {
    instance_id: instanceId,
    zone: zone || 'unknown',
  };
}
