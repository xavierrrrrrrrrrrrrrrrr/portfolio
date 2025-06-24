import React from 'react';
import { 
  Sparkles, 
  User, 
  FileText, 
  GraduationCap, 
  Code, 
  Award, 
  Link, 
  Save,
  Github,
  Linkedin,
  ArrowRight,
  CheckCircle,
  Zap,
  Shield,
  Clock
} from 'lucide-react';

interface WelcomePageProps {
  onGetStarted: () => void;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({ onGetStarted }) => {
  const features = [
    {
      icon: User,
      title: 'Personal Information',
      description: 'Add your basic details and contact information easily'
    },
    {
      icon: FileText,
      title: 'About Me Section',
      description: 'Craft a compelling introduction about yourself'
    },
    {
      icon: GraduationCap,
      title: 'Education History',
      description: 'Showcase your academic achievements and qualifications'
    },
    {
      icon: Code,
      title: 'Projects Portfolio',
      description: 'Highlight your best work and technical projects'
    },
    {
      icon: Award,
      title: 'Achievements',
      description: 'Display your awards, certifications, and accomplishments'
    },
    {
      icon: Link,
      title: 'Social Links',
      description: 'Connect your GitHub, LinkedIn, and other professional profiles'
    }
  ];

  const benefits = [
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Create your portfolio in just minutes, not hours'
    },
    {
      icon: Github,
      title: 'GitHub Integration',
      description: 'Automatically fetch and display your repositories'
    },
    {
      icon: Shield,
      title: 'Secure Storage',
      description: 'Your data is safely stored and always accessible'
    },
    {
      icon: Clock,
      title: 'Always Updated',
      description: 'Keep your portfolio current with easy updates'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-secondary-500/10"></div>
        <div className="relative container-custom pt-16 pb-24">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="p-4 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl text-white shadow-lg animate-pulse">
                  <Sparkles className="w-12 h-12" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full animate-bounce"></div>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-neutral-900 mb-6 leading-tight">
              Create Your
              <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent"> Professional</span>
              <br />Portfolio
            </h1>
            
            <p className="text-xl md:text-2xl text-neutral-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Build a stunning, comprehensive portfolio in minutes. Showcase your skills, projects, and achievements with our intelligent portfolio generator.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <button
                onClick={onGetStarted}
                className="btn-primary btn-lg group"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
              </button>
              
              <div className="flex items-center text-neutral-600">
                <CheckCircle className="w-5 h-5 text-primary-500 mr-2" />
                <span>No registration required</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center p-4 bg-white rounded-2xl shadow-soft">
                <div className="text-3xl font-bold text-primary-600 mb-2">5 Min</div>
                <div className="text-neutral-600">Average completion time</div>
              </div>
              <div className="text-center p-4 bg-white rounded-2xl shadow-soft">
                <div className="text-3xl font-bold text-secondary-600 mb-2">100%</div>
                <div className="text-neutral-600">Free to use</div>
              </div>
              <div className="text-center p-4 bg-white rounded-2xl shadow-soft">
                <div className="text-3xl font-bold text-primary-600 mb-2">Auto</div>
                <div className="text-neutral-600">GitHub integration</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="section bg-white">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">
              Everything You Need in One Place
            </h2>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
              Our comprehensive portfolio generator covers all aspects of your professional profile
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group card p-6 card-hover"
              >
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-gradient-to-r from-primary-500 to-secondary-600 rounded-xl text-white group-hover:scale-105 transition-transform duration-200">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-900 ml-4">{feature.title}</h3>
                </div>
                <p className="text-neutral-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="section bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">
              Why Choose Our Portfolio Generator?
            </h2>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
              Built with modern technology and user experience in mind
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="text-center card p-6 card-hover"
              >
                <div className="inline-flex p-4 bg-gradient-to-r from-primary-500 to-secondary-600 rounded-2xl text-white mb-4 group-hover:scale-105 transition-transform duration-200">
                  <benefit.icon className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">{benefit.title}</h3>
                <p className="text-neutral-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="section bg-gradient-to-r from-primary-600 to-secondary-600">
        <div className="container-custom text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Build Your Portfolio?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of professionals who have created their portfolios with our platform. 
            Start building yours today - it's completely free!
          </p>
          
          <button
            onClick={onGetStarted}
            className="group inline-flex items-center bg-white text-primary-600 rounded-xl font-bold text-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 px-10 py-5"
          >
            <Save className="w-6 h-6 mr-3" />
            Start Creating Now
            <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform duration-200" />
          </button>
          
          <div className="flex items-center justify-center mt-6 text-primary-100">
            <CheckCircle className="w-5 h-5 mr-2" />
            <span>Takes less than 5 minutes</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-neutral-900 text-white py-12">
        <div className="container-custom text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="p-2 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl text-white mr-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold">Portfolio Generator</h3>
          </div>
          <p className="text-neutral-400 mb-4">
            &copy; 2025 Portfolio Generator
          </p>
        </div>
      </div>
    </div>
  );
};
