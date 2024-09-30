const clientId = process.env.KAFKA_CLIENT_ID || '';
const brokers = (process.env.KAFKA_BROKERS || '').split(',').filter(Boolean);
const [name, podIndex] = (() => {
    const podWords = process.env.HOSTNAME?.split('-').filter(Boolean) || [];
    // NOTE: 지금은 우리 클러스터 버전이 낮아서 못쓰는데 1.28 로 업그레이드 되면 hostname 파싱 안해도 pod index 사용할 수 있다.
    // https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/#pod-index-label
    const podIndex = Number(podWords.pop());
    return [podWords.join('-'), podIndex];
})();

export const config = {
    name,
    server: {
        port: process.env.PORT || 3000,
    },
    kafka: {
        clientId,
        brokers,
    },
    podIndex: podIndex,
};
