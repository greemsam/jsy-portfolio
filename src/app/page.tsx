import { getPublishedArtworks } from "@/services/artwork.service";
export default async function Home() {
    const artworks = await getPublishedArtworks();

    return (
        <main>
        <h1>Artworks</h1>

        {artworks.length === 0 ? (
            <p>등록된 작품이 없습니다.</p>
        ) : (
            <ul>
                {artworks.map((artwork) => (
                    <li key={artwork.artId}>
                        <strong>{artwork.title}</strong>
                        <p>{artwork.year}</p>
                        <p>{artwork.medium}</p>
                    </li>
                ))}
            </ul>
        )}
        </main>
    );
}