import { Link } from "wouter";
import { motion } from "framer-motion";
import { CheckCircle, Star, Shield, Clock } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col pt-20">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-background">
            <img 
              src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
              alt="Premium abstract background" 
              className="w-full h-full object-cover opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/40 to-background" />
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 md:pt-48 md:pb-32 flex flex-col items-center text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-8"
            >
              <Star className="w-4 h-4 fill-primary" />
              <span>Australia's #1 Premium Cleaning Service</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-7xl font-extrabold text-foreground max-w-4xl leading-tight mb-8"
            >
              Immaculate spaces, <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
                zero effort.
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-12"
            >
              Book professional, vetted cleaners in under 60 seconds. Experience the standard of clean you deserve with instant transparent quoting.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
            >
              <Link 
                href="/booking"
                className="px-8 py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-primary to-blue-500 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto"
              >
                Get an Instant Quote
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-card border-y border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-12">
              <FeatureCard 
                icon={<Shield className="w-8 h-8 text-primary" />}
                title="Fully Vetted & Insured"
                description="Every cleaner passes rigorous background checks and carries full liability insurance."
              />
              <FeatureCard 
                icon={<CheckCircle className="w-8 h-8 text-primary" />}
                title="100% Satisfaction"
                description="Not happy? We'll re-clean for free. Your satisfaction is our highest priority."
              />
              <FeatureCard 
                icon={<Clock className="w-8 h-8 text-primary" />}
                title="Instant Booking"
                description="No lengthy quotes. Configure your clean, get a price, and book securely in 60 seconds."
              />
            </div>
          </div>
        </section>

        {/* Image / Lifestyle Section */}
        <section className="py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl overflow-hidden relative min-h-[500px] flex items-center shadow-2xl shadow-black/50 border border-border/50">
              <img 
                src={`${import.meta.env.BASE_URL}images/clean-home.png`} 
                alt="Pristine living room" 
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
              
              <div className="relative z-10 p-8 md:p-16 max-w-2xl">
                <h2 className="text-3xl md:text-5xl font-bold mb-6">Experience the difference.</h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Whether it's your home, office, or an end-of-lease bond clean, our teams deliver an uncompromising standard of hygiene and organization.
                </p>
                <Link 
                  href="/booking"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold bg-background/50 backdrop-blur border border-border hover:bg-white/10 hover:border-primary transition-all duration-300 text-foreground"
                >
                  Start your booking <ChevronRight className="w-4 h-4 text-primary" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="flex flex-col items-center text-center p-6">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

// Icon helper
function ChevronRight(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round" {...props}>
      <path d="m9 18 6-6-6-6"/>
    </svg>
  );
}
