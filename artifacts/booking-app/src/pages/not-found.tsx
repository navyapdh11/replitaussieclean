import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-center p-4">
      <div>
        <h1 className="text-6xl font-display font-extrabold text-primary mb-4">404</h1>
        <h2 className="text-2xl font-bold text-foreground mb-4">Page not found</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link 
          href="/" 
          className="px-6 py-3 rounded-xl font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
