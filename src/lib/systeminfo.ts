import si from 'systeminformation';

export async function getSystemInfo() {
  const [cpuData, gpuData, uuid, hostname] = await Promise.all([
    si.currentLoad(),
    si.graphics(),
    si.uuid(),
    si.osInfo().then(info => info.hostname),
  ]);

  return {
    // CPU Utilization (average across cores)
    cpu: cpuData.currentLoad / 100,
    // GPU Utilization (assuming first GPU; adjust as necessary)
    gpu: gpuData.controllers[0]?.utilizationGpu
      ? gpuData.controllers[0].utilizationGpu / 100
      : 0, // default to 0 if no GPU utilization found,
    labels: {
      instance_id: `${uuid}`,
      zone: `${hostname}`,
    },
    timestamp: { seconds: Date.now() / 1000 },
  };
}
