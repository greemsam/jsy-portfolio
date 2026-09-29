import { adminDb } from "@/lib/firebase-admin";

export default async function Home() {
  const snapshot = await adminDb.collection("artworks").get();

  const artworks = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return (
    <main>
      <h1>Artworks</h1>

      <pre>{JSON.stringify(artworks, null, 2)}</pre>
    </main>
  );
}