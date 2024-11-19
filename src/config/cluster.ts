import { ClusterManagerOptions } from 'discord-hybrid-sharding';

export const ClusterConfig = {
  shardsPerClusters: 4,
  totalShards: 'auto',
  mode: 'process',
  respawn: true,
  restarts: {
    max: 6,
    interval: 1000 * 60 * 60,
  },
} as ClusterManagerOptions;
