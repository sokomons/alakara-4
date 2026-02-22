import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  Users, 
  BookOpen, 
  BarChart3, 
  Globe, 
  Lock,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import Logo from './Logo';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden">
      {/* Kenyan Flag Strips Header */}
      <div className="h-2 bg-kenya-black w-full" />
      <div className="h-2 bg-kenya-red w-full" />
      <div className="h-2 bg-kenya-green w-full" />

      {/* Navigation */}
      <nav className="container mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Logo size={64} />
          <span className="text-2xl font-black tracking-tighter text-kenya-black uppercase">ALAKARA PRO</span>
        </div>
        <div className="hidden md:flex items-center gap-8 font-medium">
          <a href="#features" className="hover:text-kenya-red transition-colors">Features</a>
          <a href="#about" className="hover:text-kenya-red transition-colors">About</a>
          <Link 
            to="/login" 
            className="bg-kenya-black text-white px-6 py-2 rounded-full hover:bg-kenya-red transition-all flex items-center gap-2"
          >
            Access Portal <ArrowRight size={18} />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 flex flex-col lg:flex-row items-center gap-12">
        <div className="flex-1 space-y-8">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl lg:text-7xl font-black text-kenya-black leading-none"
          >
            Empowering <span className="text-kenya-red italic">Education</span> Through Technology.
          </motion.h1>
          <p className="text-xl text-slate-600 max-w-xl leading-relaxed">
            A comprehensive, multi-tenant school management platform designed for the Kenyan education system. Real-time marks analysis, secure student portals, and administrative excellence.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/login" className="bg-kenya-green text-white px-8 py-4 rounded-xl font-bold text-lg hover:scale-105 transition-transform shadow-lg shadow-kenya-green/20">
              Get Started Now
            </Link>
            <button className="border-2 border-kenya-black px-8 py-4 rounded-xl font-bold text-lg hover:bg-kenya-black hover:text-white transition-all">
              Request Demo
            </button>
          </div>
        </div>
        <div className="flex-1 relative">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-kenya-red/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-kenya-green/10 rounded-full blur-3xl" />
          <img 
            src="https://arena.co.ke/wp-content/uploads/2022/12/kcpe-2022-pic.jpg" 
            alt="Kenyan students in a classroom" 
            className="rounded-3xl shadow-2xl relative z-10 border-8 border-white"
            referrerPolicy="no-referrer"
          />
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="bg-slate-50 py-24">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <h2 className="text-4xl font-black text-kenya-black">Built for Every Stakeholder</h2>
            <p className="text-slate-600 text-lg">Our platform bridges the gap between administrators, teachers, parents, and students with specialized tools for everyone.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<ShieldCheck className="text-kenya-red" />}
              title="Super Admin Control"
              description="Manage multiple institutions, monitor system-wide analytics, and enforce security protocols from a single dashboard."
            />
            <FeatureCard 
              icon={<BarChart3 className="text-kenya-green" />}
              title="Real-time Analytics"
              description="Automatic marks synchronization and deep performance analysis for School Heads and Teachers."
            />
            <FeatureCard 
              icon={<Users className="text-kenya-black" />}
              title="Parental Engagement"
              description="Dedicated portal for parents to track student performance, attendance, and fee status in real-time."
            />
            <FeatureCard 
              icon={<BookOpen className="text-kenya-red" />}
              title="Learning Resources"
              description="Centralized repository for exams, notes, and marking schemes approved by school administration."
            />
            <FeatureCard 
              icon={<Globe className="text-kenya-green" />}
              title="Multi-Tenant Architecture"
              description="Scalable design that supports thousands of schools with isolated data and custom configurations."
            />
            <FeatureCard 
              icon={<Lock className="text-kenya-black" />}
              title="Secure RBAC"
              description="Advanced Role-Based Access Control ensures users only see what they are authorized to see."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-kenya-black text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-kenya-red" />
        <div className="absolute top-1 left-0 w-full h-1 bg-kenya-green" />
        
        <div className="container mx-auto px-6 text-center relative z-10">
          <h2 className="text-5xl font-black mb-8">Ready to Transform Your School?</h2>
          <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">Join hundreds of schools across Kenya using ISMS to streamline their operations and improve academic outcomes.</p>
          <Link to="/login" className="bg-kenya-red text-white px-12 py-5 rounded-full font-bold text-xl hover:bg-white hover:text-kenya-black transition-all inline-block">
            Access the Portal
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <Logo size={48} />
            <span className="font-bold text-xl uppercase">ALAKARA PRO</span>
          </div>
          <p className="text-slate-500 text-sm">© 2024 ALAKARA SCHOOL MANAGER PRO. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="text-slate-400 hover:text-kenya-red transition-colors">Privacy</a>
            <a href="#" className="text-slate-400 hover:text-kenya-red transition-colors">Terms</a>
            <a href="#" className="text-slate-400 hover:text-kenya-red transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
  <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-2 transition-all group">
    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-4 text-kenya-black">{title}</h3>
    <p className="text-slate-500 leading-relaxed">{description}</p>
  </div>
);

export default LandingPage;
