import { getPublishedYears } from "@/__server/services/post.service";
import { getHomeData } from "@/__server/services/home.service";
import ArtworkGallery from "@/__components/service/artworkGallery";
import styles from "@/__cssModules/service/home.module.css";

export const dynamic = "force-dynamic";

export default async function Home() {
    const [years, { artwork }] = await Promise.all([
        getPublishedYears(),
        getHomeData(),
    ]);
    const candidates = (artwork?.images ?? [])
        .slice(0, 4)
        .filter((image) => image.thumbnailUrl)
        .map((image, index) => ({
            id: artwork!.postId + ":" + index,
            title: artwork!.title,
            medium: image.medium ?? artwork!.medium,
            width: image.width ?? artwork!.width,
            height: image.height ?? artwork!.height,
            sizeUnit: image.sizeUnit ?? artwork!.sizeUnit,
            year: artwork!.year,
            src: image.thumbnailUrl,
        }));
    return (
        <main className={styles.home}>
            <ArtworkGallery years={years} candidates={candidates} />
        </main>
    );
}
