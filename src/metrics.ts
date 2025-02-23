import monitoring from '@google-cloud/monitoring';
import { getSystemInfo, getInstanceLabels } from './lib/systeminfo';
import * as env from './environment';
import { sessions } from './sessions';

const client = new monitoring.MetricServiceClient();

// Metrics Publishing Function
export default async function publish() {
  if (!env.GCP_PROJECT_ID) {
    console.log('GCP project ID is not set, skipping metrics publishing');
    return;
  }

  const [systemInfo, labels] = await Promise.all([
    getSystemInfo(),
    getInstanceLabels(),
  ]);

  const metrics = [
    {
      type: 'custom.googleapis.com/browser_utilization',
      value: sessions.size / env.MAX_BROWSER_INSTANCES,
    },
    {
      type: 'custom.googleapis.com/cpu_utilization',
      value: systemInfo.cpu,
    },
    {
      type: 'custom.googleapis.com/gpu_utilization',
      value: systemInfo.gpu,
    },
  ];

  try {
    // Prepares the time series request
    const [result] = await client.createTimeSeries({
      name: client.projectPath(env.GCP_PROJECT_ID),
      timeSeries: metrics.map(metric => ({
        // Ties the data point to a custom metric
        metric: { type: metric.type },
        resource: {
          type: 'gce_instance',
          labels: {
            project_id: env.GCP_PROJECT_ID || '',
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
    console.log('Done writing time series data.', result);
  } catch (error) {
    console.error('Error writing time series data.', error);
  }

  setTimeout(publish, 30e3);
}
