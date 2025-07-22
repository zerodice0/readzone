export function FeedLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 rounded-lg h-48"></div>
          </div>
        ))}
      </div>
    </div>
  );
}