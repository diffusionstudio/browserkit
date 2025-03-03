import si from 'systeminformation';

import { report } from "./monitoring";

/**
 * Report GPU utilization metrics to Google Cloud Monitoring
 */
async function reportUtilization() {
  const { controllers } = await si.graphics();

  const averageGpuUtilization = controllers.reduce((acc, controller) => {
    return acc + (controller.utilizationGpu || 0);
  }, 0) / controllers.length;

  const averageMemoryUtilization = controllers.reduce((acc, controller) => {
    return acc + (controller.utilizationMemory || 0);
  }, 0) / controllers.length;

  await report([
    {
      type: 'custom.googleapis.com/gpu_memory_utilization',
      value: averageMemoryUtilization,
    },
    {
      type: 'custom.googleapis.com/gpu_utilization',
      value: averageGpuUtilization,
    },
  ]);
}

// Report GPU utilization every 30 seconds
setInterval(reportUtilization, 30e3);
