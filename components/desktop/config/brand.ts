export interface Brand {
    name: string;
    role: string;
    tagline: string;
    /** Distinctive, ownable POV line — the verbal signature beyond the title. */
    signature: string;
    location: string;
    handle: string;
    whoami: string;
    siteUrl: string;
    /** Live hiring-availability signal — surfaced as a real status pill. */
    availability: string;
}

export const BRAND: Brand = {
    name: "Jake Castillo",
    role: "DevSecOps Engineer",
    tagline: "Security-minded full-stack + cloud (AWS) engineer",
    signature: "I make the secure path the fast path.",
    location: "Honolulu, HI",
    handle: "jake.os",
    whoami: "DevSecOps Engineer · Security-minded full-stack + cloud (AWS) · Honolulu, HI",
    siteUrl: "https://jakecastillo.github.io",
    availability: "Open to DevSecOps / Platform Security · Honolulu or remote",
};
