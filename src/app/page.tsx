import { getPosts } from "@/__server/services/post.service";
import styles from "@/__cssModules/service/home.module.css";
import LatestArtwork from "@/__components/service/latestArtwork";

export const dynamic = "force-dynamic";

export default async function Home() {
    const posts = await getPosts(true);
    const candidates = posts
        .filter((post) =>
            post.images.some(
                (image: { displayUrl?: string; thumbnailUrl?: string }) =>
                    image.displayUrl || image.thumbnailUrl,
            ),
        )
        .sort((a, b) => {
            const year = (value: string) =>
                /^\d{4}$/.test(value.trim()) ? Number(value) : -1;
            return year(String(b.year)) - year(String(a.year));
        })
        .map((post) => ({
            id: post.postId,
            title: post.title,
            src: post.images.find(
                (image: { displayUrl?: string; thumbnailUrl?: string }) =>
                    image.displayUrl || image.thumbnailUrl,
            ),
        }))
        .map((post) => ({
            id: post.id,
            title: post.title,
            src: post.src.displayUrl || post.src.thumbnailUrl,
        }));
    return (
        <main className={styles.home}>
            <LatestArtwork candidates={candidates} />
        </main>
    );
}
