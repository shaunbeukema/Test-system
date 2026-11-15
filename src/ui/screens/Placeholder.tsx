interface Props {
  title: string;
  note: string;
}

/** Temporary screen for features coming in later phases. */
export function Placeholder({ title, note }: Props) {
  return (
    <main className="screen">
      <h1 className="title">{title}</h1>
      <div className="card empty">
        <p>{note}</p>
      </div>
    </main>
  );
}
