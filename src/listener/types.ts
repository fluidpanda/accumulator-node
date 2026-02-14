export interface SenseairAnnounceV1 {
    type: "senseair.sensor.announce";
    version: 1;
    id: string;
    ips: Array<string>;
    api: {
        port: number;
        path: string;
    };
    ts: number;
}
