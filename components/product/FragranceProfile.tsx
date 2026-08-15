import type { PerfumeDetails } from "@/types";

type FragranceProfileProps = {
  details: PerfumeDetails;
};

export function FragranceProfile({ details }: FragranceProfileProps) {
  const notes = [
    { label: "Fragrance Family", values: [details.fragranceFamily] },
    { label: "Top Notes", values: details.topNotes },
    { label: "Heart Notes", values: details.heartNotes },
    { label: "Base Notes", values: details.baseNotes },
  ];

  return (
    <section className="border border-border bg-off-white px-6 py-8">
      <p className="text-12 tracking-label text-taupe">Olfactive</p>
      <h2 className="mt-2 font-heading text-24 text-black">Fragrance Profile</h2>
      <dl className="mt-6 flex flex-col gap-6">
        {notes.map((note) => (
          <div key={note.label}>
            <dt className="text-12 tracking-label text-taupe">{note.label}</dt>
            <dd className="mt-2 font-heading text-18 text-black">
              {note.values.join(" · ")}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
