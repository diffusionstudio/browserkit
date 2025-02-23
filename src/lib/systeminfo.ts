import si from 'systeminformation';

const METADATA_URL = 'http://metadata.google.internal/computeMetadata/v1';
const METADATA_HEADERS = { 'Metadata-Flavor': 'Google' };

export async function getInstanceLabels() {
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

export async function getSystemInfo() {
  const [cpuData, gpuData] = await Promise.all([
    si.currentLoad(),
    si.graphics(),
  ]);

  return {
    // CPU Utilization (average across cores)
    cpu: cpuData.currentLoad / 100,
    // GPU Utilization (assuming first GPU; adjust as necessary)
    gpu: gpuData.controllers[0]?.utilizationGpu
      ? gpuData.controllers[0].utilizationGpu / 100
      : 0, // default to 0 if no GPU utilization found,
  };
}
