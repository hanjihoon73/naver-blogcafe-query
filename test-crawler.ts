import { crawlSocialData } from './src/lib/crawler';

async function run() {
    try {
        const data = await crawlSocialData('깨봉수학', '2024-01-01', '2024-01-31');
        console.log("Success! Data length:", data.length);
    } catch (e) {
        console.error("ERROR CAUGHT:");
        console.error(e);
    }
}
run();
