"use client";

type PageLoaderProps = {
  text?: string;
};

export function PageLoader({ text = "Loading..." }: PageLoaderProps) {
  return (
    <main className="page-loader">
      <img
        className="page-loader-image"
        src="/assets/6789b62c38432.png"
        alt="Loading"
      />
      <p className="page-loader-text">{text}</p>
    </main>
  );
}
